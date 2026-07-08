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

  searchWeb: tool({
    description:
      "Search the web for current information. Use when the user asks about recent events, news, or facts that may have changed.",
    inputSchema: z.object({
      query: z.string().describe("Search query"),
    }),
    execute: async ({ query }) => {
      const apiKey = process.env.TAVILY_API_KEY;

      if (!apiKey) {
        return {
          query,
          results: [],
          message:
            "Web search is not configured. Add TAVILY_API_KEY to your environment to enable search.",
        };
      }

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 5,
          include_answer: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        answer?: string;
        results?: Array<{
          title: string;
          url: string;
          content: string;
        }>;
      };

      return {
        query,
        answer: data.answer ?? null,
        results: (data.results ?? []).map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.content,
        })),
      };
    },
  }),
};

export const baseToolNames = ["getWeather", "calculate"] as const;
export const webSearchToolNames = ["getWeather", "calculate", "searchWeb"] as const;

export type AgentToolName = (typeof webSearchToolNames)[number];
