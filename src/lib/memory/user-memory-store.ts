import { prisma } from "@/lib/prisma";

export const MAX_NOTES_PER_OWNER = 20;

export interface OwnerKey {
  anonymousId: string | null;
  clerkUserId: string | null;
}

export interface UserMemoryNoteDto {
  id: string;
  content: string;
}

function ownerWhere(owner: OwnerKey) {
  if (owner.clerkUserId) return { clerkUserId: owner.clerkUserId };
  return { anonymousId: owner.anonymousId };
}

export async function listUserMemoryNotes(owner: OwnerKey): Promise<UserMemoryNoteDto[]> {
  if (!owner.clerkUserId && !owner.anonymousId) return [];
  const notes = await prisma.userMemoryNote.findMany({
    where: ownerWhere(owner),
    orderBy: { createdAt: "asc" },
  });
  return notes.map((n) => ({ id: n.id, content: n.content }));
}

export async function createUserMemoryNote(
  owner: OwnerKey,
  content: string
): Promise<UserMemoryNoteDto> {
  const note = await prisma.userMemoryNote.create({
    data: { anonymousId: owner.anonymousId, clerkUserId: owner.clerkUserId, content },
  });
  return { id: note.id, content: note.content };
}

export async function deleteUserMemoryNote(owner: OwnerKey, noteId: string): Promise<boolean> {
  const result = await prisma.userMemoryNote.deleteMany({
    where: { id: noteId, ...ownerWhere(owner) },
  });
  return result.count > 0;
}

export async function deleteAllUserMemoryNotes(owner: OwnerKey): Promise<number> {
  const result = await prisma.userMemoryNote.deleteMany({ where: ownerWhere(owner) });
  return result.count;
}

export function getUserMemoryBlock(notes: UserMemoryNoteDto[]): string {
  if (notes.length === 0) return "";
  const lines = notes.map((n) => `- ${n.content}`).join("\n");
  return `\n\nTHÔNG TIN KHÁCH HÀNG ĐÃ YÊU CẦU GHI NHỚ (từ các lần chat trước):\n${lines}\n\nDùng thông tin này để cá nhân hoá câu trả lời khi liên quan. Không tự nhắc lại nếu không cần thiết.`;
}
