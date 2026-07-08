import { defineTool } from "eve/tools";
import { z } from "zod";
import { readProjectFile } from "../../../lib/project-files";

export default defineTool({
  description:
    "Read a file from this repository. Use to inspect source code before explaining it.",
  inputSchema: z.object({
    path: z.string().describe("Repo-relative file path, e.g. agent/agent.ts"),
    startLine: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("Optional 1-based start line"),
    endLine: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("Optional 1-based end line"),
  }),
  async execute({ path, startLine, endLine }) {
    return readProjectFile(path, startLine, endLine);
  },
});
