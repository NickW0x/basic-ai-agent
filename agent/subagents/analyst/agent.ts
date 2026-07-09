import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Evaluate math expressions and produce precise numeric answers with brief working.",
  model: process.env.AI_MODEL ?? "xai/grok-4.5",
});
