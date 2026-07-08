import { defineTool } from "eve/tools";
import { z } from "zod";

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "clear",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "depositing rime fog",
  51: "light drizzle",
  53: "drizzle",
  55: "dense drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  95: "thunderstorm",
};

function describeWeather(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "unknown";
}

async function geocodeLocation(location: string) {
  const params = new URLSearchParams({
    name: location,
    count: "1",
    language: "en",
    format: "json",
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      name: string;
      country?: string;
      latitude: number;
      longitude: number;
    }>;
  };

  return data.results?.[0] ?? null;
}

export default defineTool({
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name, e.g. San Francisco"),
  }),
  async execute({ location }) {
    const place = await geocodeLocation(location);

    if (!place) {
      return {
        location,
        error: `Could not find coordinates for "${location}"`,
      };
    }

    const forecastParams = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: "temperature_2m,weather_code,wind_speed_10m",
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
    });

    const forecastResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`,
    );

    if (!forecastResponse.ok) {
      throw new Error(
        `Weather forecast failed with status ${forecastResponse.status}`,
      );
    }

    const forecast = (await forecastResponse.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };

    const current = forecast.current;

    return {
      location: place.country
        ? `${place.name}, ${place.country}`
        : place.name,
      temperatureF: current?.temperature_2m ?? null,
      windMph: current?.wind_speed_10m ?? null,
      condition: describeWeather(current?.weather_code ?? -1),
    };
  },
});
