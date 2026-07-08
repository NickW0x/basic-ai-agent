import { createClient } from "redis";
import type { RedisStatus } from "../../src/lib/status-types";
import { getEnvStatus, getEnvValue } from "./env-helpers";

// Probes Upstash Redis connectivity via PING with a short timeout.
export async function probeRedis(): Promise<RedisStatus> {
  const redisUrl = getEnvValue("REDIS_URL");
  const envStatus = getEnvStatus("REDIS_URL");

  if (envStatus === "unconfigured") {
    return {
      provider: "upstash",
      mode: "memory",
      status: "unconfigured",
      configured: false,
      connected: false,
    };
  }

  const startedAt = Date.now();

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 3000,
      },
    });

    client.on("error", () => {
      // Suppress unhandled error events during probe teardown.
    });

    await client.connect();
    const pong = await client.ping();
    await client.quit();

    if (pong !== "PONG") {
      return {
        provider: "upstash",
        mode: "redis",
        status: "degraded",
        configured: true,
        connected: false,
        error: `Unexpected PING response: ${pong}`,
      };
    }

    return {
      provider: "upstash",
      mode: "redis",
      status: "live",
      configured: true,
      connected: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      provider: "upstash",
      mode: "redis",
      status: "offline",
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : "Redis PING failed",
    };
  }
}
