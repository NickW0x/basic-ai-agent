import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Condense long text, articles, or URLs into concise summaries before the parent responds.",
  model: process.env.AI_MODEL ?? "anthropic/claude-sonnet-4",
});
