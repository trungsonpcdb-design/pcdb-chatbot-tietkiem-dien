import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, CHAT_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/openai";
import { SYSTEM_PROMPT_MVP } from "@/lib/prompts/system-mvp";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  if (!body.message || typeof body.message !== "string") {
    return jsonError(400, "message is required");
  }
  if (body.message.length > 2000) {
    return jsonError(400, "Câu hỏi quá dài (tối đa 2000 ký tự)");
  }

  const { userId: clerkUserId } = await auth();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = hashIp(ip);
  const rateKey = clerkUserId ? `user:${clerkUserId}` : `ip:${ipHash}`;
  const rl = checkRateLimit(rateKey, Boolean(clerkUserId));
  if (!rl.allowed) {
    return jsonError(
      429,
      `Bạn hỏi quá nhanh. Vui lòng thử lại sau ${Math.ceil(rl.resetInSec / 60)} phút.`
    );
  }

  const mod = moderate(body.message);
  if (!mod.allowed && mod.suggestedReply) {
    return streamText(mod.suggestedReply);
  }

  const anonymousId = clerkUserId ? null : await getOrCreateAnonymousId();

  let session;
  if (body.sessionId) {
    session = await prisma.chatSession.findUnique({ where: { id: body.sessionId } });
  }
  if (!session) {
    session = await prisma.chatSession.create({
      data: {
        anonymousId,
        clerkUserId,
        ipHash,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    });
  }

  await prisma.message.create({
    data: { sessionId: session.id, role: "user", content: body.message },
  });

  const history = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const openai = getOpenAI();
  const encoder = new TextEncoder();
  const sessionId = session.id;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`)
      );

      let fullText = "";
      const started = Date.now();

      try {
        const openaiStream = await openai.chat.completions.create({
          model: CHAT_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.4,
          stream: true,
          messages: [
            { role: "system", content: SYSTEM_PROMPT_MVP },
            ...history.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`)
            );
          }
        }

        const latencyMs = Date.now() - started;
        await prisma.message.create({
          data: {
            sessionId,
            role: "assistant",
            content: fullText,
            latencyMs,
          },
        });
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            lastMessageAt: new Date(),
            messageCount: { increment: 2 },
          },
        });

        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`)
        );
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

function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId: null })}\n\n`)
      );
      controller.enqueue(
        encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`)
      );
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
