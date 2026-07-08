import { defineTool } from "eve/tools";
import { z } from "zod";
import { evaluateMathExpression } from "../../../lib/evaluate";

export default defineTool({
  description:
    "Evaluate a basic math expression with +, -, *, /, and parentheses",
  inputSchema: z.object({
    expression: z.string().describe("Math expression, e.g. (12 + 4) * 2"),
  }),
  async execute({ expression }) {
    return evaluateMathExpression(expression);
  },
});
