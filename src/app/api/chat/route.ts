import { handleWebChat } from "@/lib/web-chat";

export async function POST(request: Request): Promise<Response> {
  return handleWebChat(request);
}
