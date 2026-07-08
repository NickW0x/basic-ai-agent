import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { defineTool } from "eve/tools";
import { z } from "zod";

const execFileAsync = promisify(execFile);

export default defineTool({
  description:
    "Run npm run typecheck in the repository root and return stdout/stderr.",
  inputSchema: z.object({}),
  async execute() {
    try {
      const { stdout, stderr } = await execFileAsync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", "typecheck"],
        {
          cwd: process.cwd(),
          timeout: 60_000,
          maxBuffer: 2_000_000,
        },
      );

      return {
        exitCode: 0,
        stdout,
        stderr,
      };
    } catch (error) {
      const execError = error as {
        code?: number;
        stdout?: string;
        stderr?: string;
        message?: string;
      };

      return {
        exitCode: execError.code ?? 1,
        stdout: execError.stdout ?? "",
        stderr: execError.stderr ?? execError.message ?? "typecheck failed",
      };
    }
  },
});
