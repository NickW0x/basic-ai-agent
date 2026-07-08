import type { StatusLevel } from "../../src/lib/status-types";

// Returns true when an env var is set to a non-empty value.
export function envSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

// Detects .env.example placeholder copy-paste values.
export function isPlaceholderEnv(name: string, value: string): boolean {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  switch (name) {
    case "REDIS_URL":
      return (
        normalized.includes("your-host.upstash.io") ||
        normalized.includes("your-password")
      );
    case "AI_GATEWAY_API_KEY":
      return normalized === "your-ai-gateway-api-key";
    case "TAVILY_API_KEY":
      return normalized === "tvly-your-tavily-api-key";
    default:
      return normalized.startsWith("your-") || normalized.includes("your-");
  }
}

export function getEnvValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getEnvStatus(name: string): StatusLevel {
  const value = getEnvValue(name);

  if (!value || isPlaceholderEnv(name, value)) {
    return "unconfigured";
  }

  return "configured";
}

export function isEnvConfigured(name: string): boolean {
  return getEnvStatus(name) === "configured";
}
