/**
 * WebSocket proxy handler — relays browser ↔ xAI Grok Voice API.
 */

import { createHmac, randomUUID } from "crypto";
import type { IncomingMessage } from "http";
import WebSocket from "ws";
import { createLogger } from "./logger";
import { XAI_REALTIME_URL } from "./xai-config";

const moduleLog = createLogger({ module: "proxy-handler" });

const WEB_VOICE_MAX_SESSION_MINUTES = Math.max(
  1,
  Math.min(
    180,
    Number.parseInt(process.env.WEB_VOICE_MAX_SESSION_MINUTES || "30", 10) || 30,
  ),
);

interface GateVerification {
  valid: boolean;
  agentId?: string;
  sessionId?: string;
  error?: string;
}

function verifyGateToken(token: string): GateVerification {
  try {
    const secret = process.env.VOICE_PROXY_SHARED_SECRET;
    const newSecret = process.env.VOICE_PROXY_SHARED_SECRET_NEW;

    if (!secret) {
      return { valid: false, error: "Server configuration error" };
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Invalid token format" };
    }

    const [encodedData, providedSignature] = parts;
    const data = Buffer.from(encodedData!, "base64").toString("utf8");
    const payload = JSON.parse(data) as {
      agentId?: string;
      sessionId?: string;
      exp?: number;
    };

    const verifyWithSecret = (sec: string) => {
      const hmac = createHmac("sha256", sec);
      hmac.update(data);
      return hmac.digest("hex") === providedSignature;
    };

    const signatureValid =
      verifyWithSecret(secret) || Boolean(newSecret && verifyWithSecret(newSecret));

    if (!signatureValid) {
      return { valid: false, error: "Invalid signature" };
    }

    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false, error: "Token expired" };
    }

    if (!payload.agentId) {
      return { valid: false, error: "Gate token must include agentId" };
    }

    return {
      valid: true,
      agentId: payload.agentId,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    moduleLog.error("gate-token verification error", {
      err: error instanceof Error ? error.message : String(error),
    });
    return { valid: false, error: "Token verification failed" };
  }
}

export async function handleProxyConnection(
  clientWs: WebSocket,
  req: IncomingMessage,
): Promise<void> {
  const connectionId = randomUUID().substring(0, 8);
  const log = moduleLog.child({ connectionId });

  const url = new URL(req.url || "", `ws://${req.headers.host}`);
  const xaiToken = url.searchParams.get("token");
  const gateToken = url.searchParams.get("gate");

  if (!xaiToken) {
    clientWs.close(4001, "Missing authentication token");
    return;
  }

  if (!gateToken) {
    clientWs.close(4001, "Missing gate token");
    return;
  }

  const verification = verifyGateToken(gateToken);
  if (!verification.valid) {
    clientWs.close(4001, `Invalid gate token: ${verification.error}`);
    return;
  }

  const sessionLog = log.child({
    agentId: verification.agentId,
    sessionId: verification.sessionId ?? null,
  });

  const proxyStartTime = Date.now();
  sessionLog.info("gate_token_verified");

  try {
    const xaiWs = new WebSocket(XAI_REALTIME_URL, {
      headers: {
        Authorization: `Bearer ${xaiToken}`,
        "Content-Type": "application/json",
      },
    });

    const messageBuffer: (string | Buffer)[] = [];

    let pongReceived = true;
    const heartbeatInterval = setInterval(() => {
      if (!pongReceived) {
        clientWs.terminate();
        return;
      }
      pongReceived = false;
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.ping();
      }
    }, 30_000);

    clientWs.on("pong", () => {
      pongReceived = true;
    });

    const maxSessionTimer = setTimeout(() => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, `Session exceeded ${WEB_VOICE_MAX_SESSION_MINUTES} minute limit`);
      }
      if (xaiWs.readyState === WebSocket.OPEN) {
        xaiWs.close(1000, "Max session duration reached");
      }
    }, WEB_VOICE_MAX_SESSION_MINUTES * 60 * 1000);

    xaiWs.on("open", () => {
      sessionLog.info("xai_connected", { endpoint: XAI_REALTIME_URL });
      for (const msg of messageBuffer) {
        xaiWs.send(msg);
      }
      messageBuffer.length = 0;
    });

    xaiWs.on("message", (data) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });

    clientWs.on("message", (data) => {
      const payload =
        typeof data === "string"
          ? data
          : Buffer.isBuffer(data)
            ? data.toString("utf8")
            : data;

      if (xaiWs.readyState === WebSocket.OPEN) {
        xaiWs.send(payload);
      } else {
        messageBuffer.push(payload as string | Buffer);
      }
    });

    xaiWs.on("error", (error) => {
      sessionLog.error("xai_connection_error", { err: error.message });
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(4002, "xAI connection failed");
      }
    });

    xaiWs.on("close", (code, reason) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(code, reason.toString());
      }
    });

    clientWs.on("close", () => {
      clearTimeout(maxSessionTimer);
      clearInterval(heartbeatInterval);
      sessionLog.info("browser_disconnected", {
        durationSeconds: Math.round((Date.now() - proxyStartTime) / 1000),
      });
      if (xaiWs.readyState === WebSocket.OPEN) {
        xaiWs.close(1000, "Client disconnected");
      }
    });

    clientWs.on("error", (error) => {
      sessionLog.error("browser_connection_error", { err: error.message });
      if (xaiWs.readyState === WebSocket.OPEN) {
        xaiWs.close(1011, "Browser connection error");
      }
    });
  } catch (error) {
    sessionLog.error("proxy_error", {
      err: error instanceof Error ? error.message : String(error),
    });
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(4003, error instanceof Error ? error.message : "Proxy error");
    }
  }
}
