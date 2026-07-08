import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Draft and refine marketing copy, social posts, and campaign messaging before the parent responds.",
  model: process.env.AI_MODEL ?? "anthropic/claude-sonnet-4",
});
