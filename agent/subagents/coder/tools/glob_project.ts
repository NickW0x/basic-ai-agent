import { defineTool } from "eve/tools";
import { z } from "zod";
import { globProject } from "../../../lib/project-files";

export default defineTool({
  description: "Find files in this repository by glob pattern.",
  inputSchema: z.object({
    pattern: z
      .string()
      .describe('Glob pattern, e.g. "agent/subagents/**/*.ts"'),
  }),
  async execute({ pattern }) {
    return globProject(pattern);
  },
});
