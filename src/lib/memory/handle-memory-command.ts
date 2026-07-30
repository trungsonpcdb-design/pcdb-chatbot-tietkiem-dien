import { classifyMemoryCommand } from "./memory-command-classifier";
import {
  listUserMemoryNotes,
  createUserMemoryNote,
  deleteUserMemoryNote,
  deleteAllUserMemoryNotes,
  MAX_NOTES_PER_OWNER,
  type OwnerKey,
} from "./user-memory-store";

export async function handleMemoryCommand(
  owner: OwnerKey,
  message: string
): Promise<string | null> {
  const existingNotes = await listUserMemoryNotes(owner);
  const command = await classifyMemoryCommand(message, existingNotes);

  switch (command.type) {
    case "NOT_A_MEMORY_COMMAND":
      return null;

    case "VIEW":
      if (existingNotes.length === 0) return "Hiện chưa có thông tin nào được lưu.";
      return `Thông tin bạn đã yêu cầu tôi ghi nhớ:\n${existingNotes
        .map((n) => `- ${n.content}`)
        .join("\n")}`;

    case "SAVE":
      if (existingNotes.length >= MAX_NOTES_PER_OWNER) {
        return `Bạn đã lưu đủ ${MAX_NOTES_PER_OWNER} thông tin, hãy xóa bớt trước khi thêm mới (gõ "xem thông tin đã lưu" để xem danh sách).`;
      }
      await createUserMemoryNote(owner, command.content);
      return `Đã lưu: "${command.content}". Lần sau chat tôi sẽ dùng thông tin này khi phù hợp.`;

    case "FORGET_ALL": {
      const count = await deleteAllUserMemoryNotes(owner);
      return count > 0
        ? `Đã xóa toàn bộ ${count} thông tin đã lưu.`
        : "Hiện chưa có thông tin nào được lưu.";
    }

    case "FORGET_SPECIFIC": {
      const deleted = await deleteUserMemoryNote(owner, command.noteId);
      return deleted
        ? "Đã xóa thông tin đó."
        : "Không tìm thấy thông tin cần xóa, có thể đã bị xóa trước đó.";
    }

    case "FORGET_UNCLEAR":
      return `Bạn muốn xóa thông tin nào? Đây là danh sách hiện có:\n${existingNotes
        .map((n) => `- ${n.content}`)
        .join("\n")}`;

    default:
      return null;
  }
}
