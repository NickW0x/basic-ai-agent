import { defineTool } from "eve/tools";
import { z } from "zod";
import { fetchPageText } from "../../../lib/fetch-page";

export default defineTool({
  description:
    "Fetch a public URL and return extractable page text. Use when the task references a specific link.",
  inputSchema: z.object({
    url: z.string().url().describe("Public http or https URL to fetch"),
  }),
  async execute({ url }) {
    return fetchPageText(url);
  },
});
