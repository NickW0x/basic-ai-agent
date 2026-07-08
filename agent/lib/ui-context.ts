import type { ModelMessage } from "ai";

export interface UiClientContext {
  model?: string;
  webSearch?: boolean;
}

// Extracts per-turn UI preferences from ephemeral clientContext messages.
export function parseUiContextFromMessages(
  messages: readonly ModelMessage[],
): UiClientContext {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user" || typeof message.content === "string") {
      continue;
    }

    if (!Array.isArray(message.content)) {
      continue;
    }

    for (const part of message.content) {
      if (part.type !== "text") {
        continue;
      }

      try {
        const parsed = JSON.parse(part.text) as UiClientContext;
        if (parsed && (parsed.model || parsed.webSearch !== undefined)) {
          return parsed;
        }
      } catch {
        // Not JSON client context — skip.
      }
    }
  }

  return {};
}
