import { tool } from "ai";
import { z } from "zod";

export const tools = {
  getWeather: tool({
    description: "Get the current weather for a location",
    inputSchema: z.object({
      location: z.string().describe("City name, e.g. San Francisco"),
    }),
    execute: async ({ location }) => {
      const temperature = Math.round(55 + Math.random() * 30);
      const conditions = ["sunny", "cloudy", "rainy", "windy"] as const;
      const condition = conditions[Math.floor(Math.random() * conditions.length)];

      return {
        location,
        temperatureF: temperature,
        condition,
      };
    },
  }),

  calculate: tool({
    description: "Evaluate a basic math expression with +, -, *, /, and parentheses",
    inputSchema: z.object({
      expression: z.string().describe("Math expression, e.g. (12 + 4) * 2"),
    }),
    execute: async ({ expression }) => {
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
    },
  }),
};