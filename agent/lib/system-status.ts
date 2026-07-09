import type {
  AggregateHealth,
  CapabilityStatus,
  EveHealthStatus,
  StatusLevel,
  SystemStatusSlice,
} from "../../src/lib/status-types";
import { getEnvStatus, getEnvValue, isEnvConfigured } from "./env-helpers";
import { probeRedis } from "./redis-probe";
import { resolveEveOrigin } from "../../src/lib/resolve-eve-origin";

const PROBE_TIMEOUT_MS = 3000;

export async function probeEveHealth(origin: string): Promise<EveHealthStatus> {
  try {
    const response = await fetch(`${origin}/eve/v1/health`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        status: "offline",
        ok: false,
        error: `Health check returned ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      ok?: boolean;
      status?: string;
      workflowId?: string;
    };

    return {
      status: data.ok ? "live" : "degraded",
      ok: data.ok,
      workflowId: data.workflowId,
      runtimeStatus: data.status,
    };
  } catch (error) {
    return {
      status: "offline",
      ok: false,
      error: error instanceof Error ? error.message : "Eve health probe failed",
    };
  }
}

export function getWebSearchStatus(): StatusLevel {
  if (isEnvConfigured("XAI_API_KEY") || isEnvConfigured("TAVILY_API_KEY")) {
    return "configured";
  }

  return "unconfigured";
}

export function getCapabilityStatus(): CapabilityStatus {
  return {
    aiGateway: getEnvStatus("AI_GATEWAY_API_KEY"),
    webSearch: getWebSearchStatus(),
    model: getEnvValue("AI_MODEL") ?? "xai/grok-4.5",
  };
}

export function getAggregateHealth(
  system: Pick<SystemStatusSlice, "redis" | "eve" | "capabilities">,
  environment: "development" | "production",
): AggregateHealth {
  if (system.eve.status === "offline") {
    return "offline";
  }

  const gatewayReady = system.capabilities.aiGateway === "configured";

  if (environment === "production") {
    const redisReady = system.redis.status === "live";

    if (system.eve.status === "live" && gatewayReady && redisReady) {
      return "healthy";
    }

    return "degraded";
  }

  // Development: in-memory Redis is acceptable.
  if (system.eve.status === "live" && gatewayReady) {
    return "healthy";
  }

  if (system.eve.status === "live") {
    return "degraded";
  }

  return "degraded";
}

export async function getSystemStatus(): Promise<SystemStatusSlice> {
  const origin = await resolveEveOrigin();
  const [redis, eve] = await Promise.all([
    probeRedis(),
    probeEveHealth(origin),
  ]);
  const capabilities = getCapabilityStatus();
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "development";

  const health = getAggregateHealth(
    { redis, eve, capabilities },
    environment,
  );

  return {
    redis,
    eve,
    capabilities,
    health,
  };
}
