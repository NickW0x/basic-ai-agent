import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name, e.g. San Francisco"),
  }),
  async execute({ location }) {
    const temperature = Math.round(55 + Math.random() * 30);
    const conditions = ["sunny", "cloudy", "rainy", "windy"] as const;
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      location,
      temperatureF: temperature,
      condition,
    };
  },
});
