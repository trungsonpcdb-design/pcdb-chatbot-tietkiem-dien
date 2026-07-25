import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { TOPIC_TAGS, type TopicTag } from "@/lib/constants";

export async function classifyTopic(question: string): Promise<TopicTag> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    max_tokens: 10,
    messages: [
      {
        role: "system",
        content: `Phân loại câu hỏi của người dùng vào 1 trong các nhãn sau, CHỈ trả về mã nhãn:
- TIET_KIEM_SH: tiết kiệm điện sinh hoạt/hộ gia đình
- TIET_KIEM_DN: tiết kiệm điện doanh nghiệp/sản xuất
- DMTMN_KY_THUAT: điện mặt trời mái nhà — kỹ thuật (công suất, panel, inverter, hướng mái)
- DMTMN_TAI_CHINH: điện mặt trời mái nhà — chi phí, hoàn vốn, mua bán điện dư
- TINH_HOA_DON: tính hóa đơn tiền điện, biểu giá, kWh
- THU_TUC: thủ tục hành chính, đăng ký, đấu nối, hồ sơ
- KHAC: không thuộc các mục trên`,
      },
      { role: "user", content: question },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim().toUpperCase() ?? "";
  const match = TOPIC_TAGS.find((t) => raw.includes(t));
  return match ?? "KHAC";
}
