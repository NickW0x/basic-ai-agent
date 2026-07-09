import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchWeb } from "../../../lib/web-search";

export default defineTool({
  description:
    "Search the web for market trends, competitors, or campaign research.",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  async execute({ query }) {
    return searchWeb(query);
  },
});
