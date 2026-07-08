import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Inspect and explain code in this repository, run read-only checks, and return findings with file paths.",
  model: process.env.AI_MODEL ?? "anthropic/claude-sonnet-4",
});
