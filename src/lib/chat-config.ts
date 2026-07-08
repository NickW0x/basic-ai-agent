import { z } from "zod";

// Per-request options sent from the web chat UI via useChat body.
export const webChatOptionsSchema = z.object({
  model: z.string().optional(),
  webSearch: z.boolean().optional(),
});

export type WebChatOptions = z.infer<typeof webChatOptionsSchema>;

export interface ChatModel {
  id: string;
  name: string;
  vision: boolean;
}

// Curated AI Gateway models for the model picker.
export const CHAT_MODELS: ChatModel[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    vision: false,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    vision: true,
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    vision: true,
  },
];

export const DEFAULT_MODEL_ID =
  process.env.AI_MODEL ?? CHAT_MODELS[0]?.id ?? "anthropic/claude-sonnet-4";

// First vision-capable model — used when the user attaches files.
export const DEFAULT_VISION_MODEL_ID =
  CHAT_MODELS.find((model) => model.vision)?.id ?? "openai/gpt-4o";

export function getModelById(modelId: string): ChatModel | undefined {
  return CHAT_MODELS.find((model) => model.id === modelId);
}
