import { createAgentUIStreamResponse } from "ai";
import { agent } from "./agent";
import { getUser } from "./auth-stub";
import { webChatOptionsSchema } from "./chat-config";

interface WebChatRequestBody {
  messages?: unknown[];
  id?: string;
  model?: string;
  webSearch?: boolean;
}

// Handles browser chat with full UIMessage streaming (tools, files, markdown).
export async function handleWebChat(request: Request): Promise<Response> {
  const user = await getUser(request);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: WebChatRequestBody;

  try {
    body = (await request.json()) as WebChatRequestBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("Request body must include a messages array", {
      status: 400,
    });
  }

  const parsedOptions = webChatOptionsSchema.safeParse({
    model: body.model,
    webSearch: body.webSearch,
  });

  const options = parsedOptions.success ? parsedOptions.data : undefined;

  return createAgentUIStreamResponse({
    agent,
    uiMessages: body.messages,
    options,
    abortSignal: request.signal,
  });
}
