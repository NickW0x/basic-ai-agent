import { ToolLoopAgent } from "ai";
import { tools } from "./tools";

export const agent = new ToolLoopAgent({
  model: process.env.AI_MODEL ?? "anthropic/claude-sonnet-4",
  instructions:
    "You are a helpful AI assistant. Answer clearly and concisely. " +
    "Use your tools when you need real-time data or calculations. " +
    "Format responses for chat with short paragraphs and bullet points when helpful.",
  tools,
});