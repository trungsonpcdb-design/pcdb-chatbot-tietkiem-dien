import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI, CHAT_MODEL, MAX_OUTPUT_TOKENS } from "@/lib/openai";
import { SYSTEM_PROMPT_MVP } from "@/lib/prompts/system-mvp";
import { SCRIPTED_FACTS } from "@/lib/prompts/scripted-facts";
import {
  buildCustomerStatsSection,
  CUSTOMER_STATS_GUIDANCE,
} from "@/lib/prompts/customer-stats";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { checkRateLimit, hashIp } from "@/lib/rate-limit";
import { moderate } from "@/lib/moderation";
import { rewriteQuery } from "@/lib/rag/query-rewriter";
import { classifyTopic } from "@/lib/rag/topic-classifier";
import { embedQuery } from "@/lib/rag/embedder";
import { searchTopK } from "@/lib/rag/vector-store";
import { buildPromptWithContext, type CitationRef } from "@/lib/rag/prompt-builder";
import { shouldSuggestLead } from "@/lib/lead-intent";
import { isMemoryCommandCandidate } from "@/lib/memory/keyword-filter";
import { handleMemoryCommand } from "@/lib/memory/handle-memory-command";
import { listUserMemoryNotes, getUserMemoryBlock, type OwnerKey } from "@/lib/memory/user-memory-store";
import { estimateFromForm } from "@/lib/solar-constants";
import {
  searchCache,
  saveCache,
  bumpHit,
  shouldSkipCache,
  CACHE_SIMILARITY_THRESHOLD,
} from "@/lib/rag/cache-store";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_SCORE_ACCEPT = 0.35;
const MIN_SCORE_USE = 0.5;

interface FormDmtmnPayload {
  areaM2: number;
  orientation: string;
  roofType: string;
  monthlyBillVnd: number;
}

interface ChatBody {
  sessionId?: string;
  message: string;
  formData?: FormDmtmnPayload;
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
  const owner: OwnerKey = { anonymousId, clerkUserId };

  if (isMemoryCommandCandidate(body.message)) {
    const memoryReply = await handleMemoryCommand(owner, body.message);
    if (memoryReply) return streamOneShot(memoryReply, null, []);
  }

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

  // Semantic cache: embed sớm để dùng cho cả cache lookup và RAG retrieval.
  const skipCache = shouldSkipCache({ message: body.message, formData: body.formData });
  const queryEmbedding = !skipCache ? await embedQuery(rewritten) : null;

  if (queryEmbedding) {
    const hit = await searchCache(queryEmbedding, CACHE_SIMILARITY_THRESHOLD);
    if (hit) {
      const saved = await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: hit.answer,
          citations: hit.citations,
          topicTag: hit.topicTag,
        },
      });

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date(), messageCount: { increment: 2 } },
      });

      bumpHit(hit.id).catch((err) => console.error("[cache] bumpHit failed", err));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: hit.answer })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(
              `event: message_saved\ndata: ${JSON.stringify({ id: saved.id })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
          controller.close();
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
  }

  let systemPrompt: string;
  let citationMap: CitationRef[] = [];

  const [hasDocuments, customerStats] = await Promise.all([
    prisma.document.count({ where: { isActive: true } }).then((n) => n > 0),
    buildCustomerStatsSection(),
  ]);

  if (!hasDocuments) {
    systemPrompt = SYSTEM_PROMPT_MVP + "\n\n" + SCRIPTED_FACTS;
  } else {
    const queryVec = queryEmbedding ?? (await embedQuery(rewritten));
    const topChunks = await searchTopK(queryVec, 5);
    const highest = topChunks[0]?.score ?? 0;
    const useable = topChunks.filter((c) => c.score >= MIN_SCORE_USE);

    if (highest < MIN_SCORE_ACCEPT) {
      await prisma.unansweredQuery.create({
        data: { sessionId, question: body.message, reason: "NO_DOCUMENT_MATCH" },
      });
      return streamOneShot(
        "Tôi chưa có đủ thông tin để trả lời câu hỏi này. Bạn có muốn để lại số điện thoại để nhân viên PC Điện Biên tư vấn trực tiếp không?",
        sessionId,
        [],
        "KHAC"
      );
    }

    const built = buildPromptWithContext(useable);
    systemPrompt = built.system;
    citationMap = built.citationMap;
  }

  if (customerStats) {
    systemPrompt += "\n\n" + customerStats + "\n\n" + CUSTOMER_STATS_GUIDANCE;
  }

  systemPrompt += getUserMemoryBlock(await listUserMemoryNotes(owner));

  if (body.formData) {
    const f = body.formData;
    const est = estimateFromForm({ areaM2: f.areaM2, monthlyBillVnd: f.monthlyBillVnd });
    const pinOnlyM = Math.round(est.pinOnlyCostVnd / 1_000_000);
    const withBessM = Math.round(est.withBessCostVnd / 1_000_000);
    const bottleneckNote = est.isRoofBottleneck
      ? `⚠ Mái của khách (${f.areaM2} m²) KHÔNG đủ chỗ để bù toàn bộ hóa đơn hiện tại (cần ~${est.kwpByBill} kWp = ~${Math.round(est.kwpByBill * 6)} m²). Khuyến nghị lắp tối đa theo mái = ${est.recommendedKw} kWp, phần còn lại vẫn dùng điện lưới.`
      : est.extraKwpCapacity >= 2
        ? `✅ Mái của khách (${f.areaM2} m²) THỪA capacity: lắp đủ bù hóa đơn chỉ cần ${est.recommendedKw} kWp (~${est.recommendedAreaM2} m²), còn dư ~${est.extraKwpCapacity} kWp (~${est.extraKwpCapacity * 6} m² mái). Có thể gợi ý khách lắp thêm để BÁN ĐIỆN DƯ (tối đa 50% sản lượng, tham chiếu mục 7 Bán điện dư trong dữ liệu chính thức).`
        : `✅ Mái của khách (${f.areaM2} m²) vừa đủ để lắp ${est.recommendedKw} kWp bù hóa đơn.`;

    systemPrompt += `\n\nDỮ LIỆU KHÁCH HÀNG CUNG CẤP:
- Diện tích mái: ${f.areaM2} m²
- Hướng mái: ${f.orientation}
- Loại mái: ${f.roofType}
- Hóa đơn TB/tháng: ${f.monthlyBillVnd.toLocaleString("vi-VN")} VNĐ

ƯỚC TÍNH ĐÃ TÍNH SẴN BẰNG CÔNG THỨC CHÍNH THỨC (kWp = m² ÷ 6, đơn giá PC Điện Biên 2026) — HÃY DÙNG ĐÚNG CÁC CON SỐ NÀY, KHÔNG TỰ TÍNH LẠI:
- Công suất mái cho phép tối đa: ${est.kwpByRoof} kWp (= ${f.areaM2} ÷ 6, làm tròn)
- Công suất đủ để bù hóa đơn: ~${est.kwpByBill} kWp
- **CÔNG SUẤT KHUYẾN NGHỊ LẮP: ${est.recommendedKw} kWp** (chiếm ~${est.recommendedAreaM2} m² mái)
- Sản lượng điện dự kiến: ~${est.dailyKwh} kWh/ngày (~${est.monthlyKwh} kWh/tháng)
- Chi phí (chưa VAT, chưa khung sắt gia cố mái):
  • Chỉ pin mặt trời: ~${pinOnlyM} triệu VNĐ (${est.recommendedKw} × 9,8 triệu)
  • Pin mặt trời + lưu trữ BESS ${est.bessKwh} kWh: ~${withBessM} triệu VNĐ (${est.recommendedKw} × 12,6 triệu)

Ghi chú tư vấn: ${bottleneckNote}

YÊU CẦU TRÌNH BÀY:
1. Trình bày đủ 2 phương án chi phí (chỉ pin / pin + BESS) để khách lựa chọn.
2. Nhắc rõ ghi chú tư vấn ở trên (mái dư, mái vừa đủ, hay mái không đủ).
3. Luôn nhấn mạnh "giá tham khảo, chưa VAT, giá thực tế do nhà cung cấp báo + cần khảo sát hiện trạng mái".
4. KHÔNG chèn <FORM_DMTMN/> vào câu trả lời lần này.`;
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
            formData: body.formData ? JSON.stringify(body.formData) : null,
            latencyMs,
          },
        });

        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { lastMessageAt: new Date(), messageCount: { increment: 2 } },
        });

        if (queryEmbedding && !skipCache && fullText.trim().length > 0) {
          const mode: "MVP" | "RAG" = citationMap.length > 0 ? "RAG" : "MVP";
          saveCache({
            question: rewritten,
            embedding: queryEmbedding,
            answer: fullText,
            citations: citationsJson,
            topicTag: null,
            mode,
            sourceMessageId: savedMessage.id,
          }).catch((err) => console.error("[cache] saveCache failed", err));
        }

        classifyTopic(body.message)
          .then((tag) =>
            prisma.message.update({ where: { id: savedMessage.id }, data: { topicTag: tag } })
          )
          .catch(() => {});

        controller.enqueue(
          encoder.encode(`event: message_saved\ndata: ${JSON.stringify({ id: savedMessage.id })}\n\n`)
        );

        if (shouldSuggestLead(body.message, fullText)) {
          const currentTopic = savedMessage.topicTag ?? "KHAC";
          controller.enqueue(
            encoder.encode(`event: suggest_lead\ndata: ${JSON.stringify({ interestTopic: currentTopic })}\n\n`)
          );
        }

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

function streamOneShot(
  text: string,
  sessionId: string | null,
  citations: unknown[],
  suggestLead?: string
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));
      controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(encoder.encode(`event: citations\ndata: ${JSON.stringify(citations)}\n\n`));
      if (suggestLead) {
        controller.enqueue(
          encoder.encode(`event: suggest_lead\ndata: ${JSON.stringify({ interestTopic: suggestLead })}\n\n`)
        );
      }
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
