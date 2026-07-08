import { defineTool } from "eve/tools";
import { z } from "zod";
import { grepProject } from "../../../lib/project-files";

export default defineTool({
  description:
    "Search file contents in this repository by regex pattern.",
  inputSchema: z.object({
    pattern: z.string().describe("Regex pattern to search for"),
    fileGlob: z
      .string()
      .optional()
      .describe('Optional file glob, default "**/*"'),
  }),
  async execute({ pattern, fileGlob }) {
    return grepProject(pattern, fileGlob ?? "**/*");
  },
});
