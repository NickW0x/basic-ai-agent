/**
 * Standalone Grok Voice WebSocket proxy for basic-ai-agent.
 * Browser ←WebSocket→ Proxy ←WebSocket→ xAI Realtime
 */

import cors from "cors";
import { config } from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Redis } from "@upstash/redis";
import { WebSocketServer } from "ws";
import { createLogger } from "./logger";
import { handleProxyConnection } from "./proxy-handler";

config();

const log = createLogger({ module: "server" });
const app = express();
const server = createServer(app);

const PORT = Number.parseInt(process.env.PORT || "8080", 10);
// Comma-separated browser origins allowed to open the WebSocket (trim spaces).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
])
  .map((origin) => origin.trim())
  .filter(Boolean);

let redis: Redis | null = null;
const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (redisUrl && redisToken) {
  try {
    redis = new Redis({ url: redisUrl, token: redisToken });
    log.info("Redis connected for connection tracking");
  } catch (error) {
    log.error("Redis initialization failed", error);
    redis = null;
  }
}

const CONN_LIMIT_PER_IP = 3;
const CONN_LIMIT_GLOBAL = 100;
const CONN_TTL_SECONDS = 300;

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ALLOWED_ORIGINS,
  }),
);
app.use(
  rateLimit({
    legacyHeaders: false,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    windowMs: 15 * 60 * 1000,
  }),
);

let activeConnections = 0;

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", async (req, socket, head) => {
  const origin = req.headers.origin;
  const clientIP = req.socket.remoteAddress || "unknown";
  const url = new URL(req.url || "", `http://${req.headers.host}`);

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    log.warn("Rejected WebSocket from unauthorized origin", { origin });
    socket.destroy();
    return;
  }

  if (redis) {
    try {
      const ipConnKey = `voice:conn:ip:${clientIP}`;
      const ipConns = await redis.incr(ipConnKey);
      if (ipConns === 1) {
        await redis.expire(ipConnKey, CONN_TTL_SECONDS);
      }
      if (ipConns > CONN_LIMIT_PER_IP) {
        socket.write("HTTP/1.1 429 Too Many Connections\r\n\r\n");
        socket.destroy();
        await redis.decr(ipConnKey);
        return;
      }

      const globalKey = "voice:conn:global";
      const globalConns = await redis.incr(globalKey);
      if (globalConns === 1) {
        await redis.expire(globalKey, CONN_TTL_SECONDS);
      }
      if (globalConns > CONN_LIMIT_GLOBAL) {
        socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
        socket.destroy();
        await redis.decr(ipConnKey);
        await redis.decr(globalKey);
        return;
      }

      (req as { clientIP?: string }).clientIP = clientIP;
    } catch (redisError) {
      log.error("Redis error during connection limit check", redisError);
    }
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (clientWs, req) => {
  const clientIP =
    (req as { clientIP?: string }).clientIP || req.socket.remoteAddress || "unknown";
  activeConnections += 1;

  log.info("ws_connected", {
    activeConnections,
    clientIP,
    path: (req.url || "").split("?")[0],
  });

  clientWs.on("close", async () => {
    activeConnections -= 1;
    if (redis) {
      try {
        await redis.decr(`voice:conn:ip:${clientIP}`);
        await redis.decr("voice:conn:global");
      } catch (redisError) {
        log.error("Redis error during connection cleanup", redisError);
      }
    }
  });

  const url = req.url || "";
  if (url.startsWith("/voice-proxy")) {
    void handleProxyConnection(clientWs, req);
  } else {
    clientWs.close(4000, "Unknown WebSocket path");
  }
});

app.get("/health", (_req, res) => {
  res.json({
    activeConnections,
    service: "grok-voice-proxy",
    status: "healthy",
    uptime: process.uptime(),
    version: "1.0.0",
  });
});

app.get("/", (_req, res) => {
  res.json({
    documentation: "https://docs.x.ai/docs/guides/voice/agent",
    endpoints: {
      health: "/health",
      websocket: "/voice-proxy",
    },
    service: "basic-ai-agent Grok Voice Proxy",
    version: "1.0.0",
  });
});

server.listen(PORT, () => {
  log.info("Grok Voice Proxy Server started", {
    allowedOrigins: ALLOWED_ORIGINS,
    port: PORT,
  });
});

process.on("SIGTERM", () => {
  for (const client of wss.clients) {
    client.close(1001, "Server shutting down");
  }
  server.close(() => process.exit(0));
});
