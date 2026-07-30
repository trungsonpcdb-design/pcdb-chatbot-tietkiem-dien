import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import type { UserMemoryNoteDto } from "./user-memory-store";

export type MemoryCommand =
  | { type: "NOT_A_MEMORY_COMMAND" }
  | { type: "VIEW" }
  | { type: "SAVE"; content: string }
  | { type: "FORGET_ALL" }
  | { type: "FORGET_SPECIFIC"; noteId: string }
  | { type: "FORGET_UNCLEAR" };

export async function classifyMemoryCommand(
  message: string,
  existingNotes: UserMemoryNoteDto[]
): Promise<MemoryCommand> {
  const openai = getOpenAI();
  const notesList =
    existingNotes.length > 0
      ? existingNotes.map((n) => `${n.id}: ${n.content}`).join("\n")
      : "(chưa có thông tin nào được lưu)";

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: `Bạn phân loại tin nhắn của người dùng thành 1 trong các lệnh quản lý "bộ nhớ cá nhân" sau. CHỈ trả lời đúng 1 dòng theo định dạng, không giải thích thêm:

- Nếu tin nhắn KHÔNG phải yêu cầu lưu/xem/xóa thông tin cá nhân (chỉ là câu hỏi bình thường tình cờ chứa từ "nhớ"/"quên"): trả về "NOT_A_MEMORY_COMMAND"
- Nếu user muốn xem lại thông tin đã lưu: trả về "VIEW"
- Nếu user muốn lưu một thông tin mới: trả về "SAVE: <câu tóm tắt thông tin cần lưu, ngắn gọn, ở ngôi thứ ba, ví dụ: Khách ở phường Mường Thanh, dùng công tơ 1 pha>"
- Nếu user muốn xóa TOÀN BỘ thông tin đã lưu: trả về "FORGET_ALL"
- Nếu user muốn xóa MỘT thông tin cụ thể và bạn xác định rõ đó là mục nào trong danh sách dưới đây: trả về "FORGET_SPECIFIC: <id>" (dùng đúng id trong danh sách)
- Nếu user muốn xóa một thông tin cụ thể nhưng bạn KHÔNG chắc chắn là mục nào: trả về "FORGET_UNCLEAR"

DANH SÁCH THÔNG TIN ĐÃ LƯU CỦA NGƯỜI DÙNG NÀY (id: nội dung):
${notesList}`,
      },
      { role: "user", content: message },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? "NOT_A_MEMORY_COMMAND";

  if (raw.startsWith("SAVE:")) {
    const content = raw.slice("SAVE:".length).trim();
    return content ? { type: "SAVE", content } : { type: "NOT_A_MEMORY_COMMAND" };
  }
  if (raw.startsWith("FORGET_SPECIFIC:")) {
    const noteId = raw.slice("FORGET_SPECIFIC:".length).trim();
    const found = existingNotes.some((n) => n.id === noteId);
    return found ? { type: "FORGET_SPECIFIC", noteId } : { type: "FORGET_UNCLEAR" };
  }
  if (raw.startsWith("VIEW")) return { type: "VIEW" };
  if (raw.startsWith("FORGET_ALL")) return { type: "FORGET_ALL" };
  if (raw.startsWith("FORGET_UNCLEAR")) return { type: "FORGET_UNCLEAR" };
  return { type: "NOT_A_MEMORY_COMMAND" };
}
