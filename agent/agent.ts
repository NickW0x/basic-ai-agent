import { defineAgent, defineDynamic } from "eve";
import { parseUiContextFromMessages } from "./lib/ui-context";

const defaultModel = process.env.AI_MODEL ?? "xai/grok-4.5";

export default defineAgent({
  model: defineDynamic({
    fallback: defaultModel,
    events: {
      "turn.started": (_event, ctx) => {
        const ui = parseUiContextFromMessages(ctx.messages);
        return ui.model ?? null;
      },
    },
  }),
  limits: {
    maxSubagentDepth: 2,
  },
});
