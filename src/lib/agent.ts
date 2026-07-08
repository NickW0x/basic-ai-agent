import { ToolLoopAgent } from "ai";
import {
  DEFAULT_MODEL_ID,
  webChatOptionsSchema,
  type WebChatOptions,
} from "./chat-config";
import { baseToolNames, tools, webSearchToolNames } from "./tools";

export const agent = new ToolLoopAgent<WebChatOptions, typeof tools>({
  model: DEFAULT_MODEL_ID,
  instructions:
    "You are a helpful AI assistant. Answer clearly and concisely. " +
    "Use your tools when you need real-time data, calculations, or web search. " +
    "Format responses for chat with short paragraphs and bullet points when helpful.",
  tools,
  callOptionsSchema: webChatOptionsSchema,
  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    model: options?.model ?? settings.model,
    activeTools: options?.webSearch
      ? [...webSearchToolNames]
      : [...baseToolNames],
  }),
});
