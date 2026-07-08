import { getEveDevHost } from "@/lib/eve-host";
import { EveChatShell } from "@/components/chat/eve-chat-shell";

export default async function ChatPage() {
  const eveHost = await getEveDevHost();

  return <EveChatShell eveHost={eveHost} />;
}
