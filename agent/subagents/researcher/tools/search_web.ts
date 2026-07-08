import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchTavily } from "../../../lib/tavily";

export default defineTool({
  description:
    "Search the web for current information. Use when the task needs recent events, news, or facts that may have changed.",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  async execute({ query }) {
    return searchTavily(query);
  },
});
