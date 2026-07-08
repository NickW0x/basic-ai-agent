export interface EvaluateResult {
  expression: string;
  result: number;
}

// Safely evaluates a basic math expression for the analyst subagent.
export function evaluateMathExpression(expression: string): EvaluateResult {
  if (!/^[\d\s+\-*/().]+$/.test(expression)) {
    throw new Error("Expression contains unsupported characters");
  }

  const result = Function(`"use strict"; return (${expression})`)();

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Expression did not evaluate to a finite number");
  }

  return {
    expression,
    result,
  };
}
