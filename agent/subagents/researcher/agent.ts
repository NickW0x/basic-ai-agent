import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Search the web and gather current facts, news, citations, and weather before the parent responds.",
  model: process.env.AI_MODEL ?? "xai/grok-4.5",
});
