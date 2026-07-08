import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchTavily } from "../../../lib/tavily";

export default defineTool({
  description:
    "Search the web for market trends, competitors, or campaign research.",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  async execute({ query }) {
    return searchTavily(query);
  },
});
