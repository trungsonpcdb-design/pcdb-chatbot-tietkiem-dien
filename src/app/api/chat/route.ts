import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, CHAT_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/openai";
import { SYSTEM_PROMPT_MVP } from "@/lib/prompts/system-mvp";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";
import { rewriteQuery } from "@/lib/rag/query-rewriter";
import { classifyTopic } from "@/lib/rag/topic-classifier";
import { embedQuery } from "@/lib/rag/embedder";
import { searchTopK } from "@/lib/rag/vector-store";
import { buildPromptWithContext, type CitationRef } from "@/lib/rag/prompt-builder";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_SCORE_ACCEPT = 0.35;
const MIN_SCORE_USE = 0.5;

interface ChatBody {
  sessionId?: string;
  message: string;
}

export async function POST(req: NextRequest) {
  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }
  if (!body.message || typeof body.message !== "string") return jsonError(400, "message is required");
  if (body.message.length > 2000) return jsonError(400, "Câu hỏi quá dài");

  const { userId: clerkUserId } = await auth();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "0.0.0.0";
  const ipHash = hashIp(ip);
  const rateKey = clerkUserId ? `user:${clerkUserId}` : `ip:${ipHash}`;
  const rl = checkRateLimit(rateKey, Boolean(clerkUserId));
  if (!rl.allowed) {
    return jsonError(429, `Bạn hỏi quá nhanh. Vui lòng thử lại sau ${Math.ceil(rl.resetInSec / 60)} phút.`);
  }

  const mod = moderate(body.message);
  if (!mod.allowed && mod.suggestedReply) {
    return streamOneShot(mod.suggestedReply, null, []);
  }

  const anonymousId = clerkUserId ? null : await getOrCreateAnonymousId();

  let session = body.sessionId
    ? await prisma.chatSession.findUnique({ where: { id: body.sessionId } })
    : null;
  if (!session) {
    session = await prisma.chatSession.create({
      data: { anonymousId, clerkUserId, ipHash, userAgent: req.headers.get("user-agent") ?? undefined },
    });
  }
  const sessionId = session.id;

  await prisma.message.create({
    data: { sessionId, role: "user", content: body.message },
  });

  const history = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const historyForLLM = history.map((h) => ({
    role: h.role as "user" | "assistant",
    content: h.content,
  }));

  const priorTurns = historyForLLM.slice(0, -1);
  const rewritten =
    priorTurns.length > 0 ? await rewriteQuery(body.message, priorTurns) : body.message;

  let systemPrompt: string;
  let citationMap: CitationRef[] = [];

  const hasDocuments = (await prisma.document.count({ where: { isActive: true } })) > 0;

  if (!hasDocuments) {
    systemPrompt = SYSTEM_PROMPT_MVP;
  } else {
    const queryVec = await embedQuery(rewritten);
    const topChunks = await searchTopK(queryVec, 5);
    const highest = topChunks[0]?.score ?? 0;
    const useable = topChunks.filter((c) => c.score >= MIN_SCORE_USE);

    if (highest < MIN_SCORE_ACCEPT) {
      await prisma.unansweredQuery.create({
        data: { sessionId, question: body.message, reason: "NO_DOCUMENT_MATCH" },
      });
      return streamOneShot(
        "Tôi chưa có đủ thông tin để trả lời câu hỏi này. Bạn có muốn để lại số điện thoại để nhân viên EVN Điện Biên tư vấn trực tiếp không?",
        sessionId,
        []
      );
    }

    const built = buildPromptWithContext(useable);
    systemPrompt = built.system;
    citationMap = built.citationMap;
  }

  const openai = getOpenAI();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));

      let fullText = "";
      const started = Date.now();

      try {
        const openaiStream = await openai.chat.completions.create({
          model: CHAT_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.3,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...historyForLLM,
          ],
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`));
          }
        }

        const usedMarkers = new Set<number>();
        for (const m of citationMap) {
          if (fullText.includes(`[${m.marker}]`)) usedMarkers.add(m.marker);
        }
        const usedCitations = citationMap.filter((c) => usedMarkers.has(c.marker));
        const citationsJson = usedCitations.length > 0 ? JSON.stringify(usedCitations) : null;

        controller.enqueue(
          encoder.encode(`event: citations\ndata: ${JSON.stringify(usedCitations)}\n\n`)
        );

        const latencyMs = Date.now() - started;
        const savedMessage = await prisma.message.create({
          data: {
            sessionId,
            role: "assistant",
            content: fullText,
            citations: citationsJson,
            latencyMs,
          },
        });

        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { lastMessageAt: new Date(), messageCount: { increment: 2 } },
        });

        classifyTopic(body.message)
          .then((tag) =>
            prisma.message.update({ where: { id: savedMessage.id }, data: { topicTag: tag } })
          )
          .catch(() => {});

        controller.enqueue(
          encoder.encode(`event: message_saved\ndata: ${JSON.stringify({ id: savedMessage.id })}\n\n`)
        );

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function streamOneShot(text: string, sessionId: string | null, citations: unknown[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));
      controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(encoder.encode(`event: citations\ndata: ${JSON.stringify(citations)}\n\n`));
      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
