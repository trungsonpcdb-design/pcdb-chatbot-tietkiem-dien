import { ChatContainer } from "@/components/chat/chat-container";
import { resolveInitialScriptId } from "@/lib/scripts";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ kb?: string }>;
}) {
  const { kb } = await searchParams;
  const initialScriptId = resolveInitialScriptId(kb);
  return <ChatContainer initialScriptId={initialScriptId} />;
}
