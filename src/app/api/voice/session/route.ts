import { createHmac, randomUUID } from "crypto";
import { NextResponse } from "next/server";

const XAI_SESSION_URL = "https://api.x.ai/v1/realtime/client_secrets";
const TOKEN_TTL_SECONDS = 300;

interface GateTokenPayload {
  agentId: string;
  sessionId?: string;
  exp: number;
  iat: number;
}

function createGateToken(payload: Omit<GateTokenPayload, "iat" | "exp"> & { expiresIn: number }): string {
  const secret = process.env.VOICE_PROXY_SHARED_SECRET;
  if (!secret) {
    throw new Error("VOICE_PROXY_SHARED_SECRET not configured");
  }

  const data = JSON.stringify({
    agentId: payload.agentId,
    sessionId: payload.sessionId,
    exp: Date.now() + payload.expiresIn * 1000,
    iat: Date.now(),
  } satisfies GateTokenPayload);

  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  const signature = hmac.digest("hex");
  return `${Buffer.from(data).toString("base64")}.${signature}`;
}

/** Mint xAI ephemeral token + HMAC gate token for Grok Voice proxy connections. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      agentId?: string;
      sessionId?: string;
    };

    const agentId = body.agentId ?? "orchestrator";
    const sessionId = body.sessionId ?? randomUUID();

    const xaiKey = process.env.XAI_API_KEY;
    if (!xaiKey) {
      return NextResponse.json(
        { error: "Voice is not configured (XAI_API_KEY missing)" },
        { status: 503 },
      );
    }

    const xaiResponse = await fetch(XAI_SESSION_URL, {
      body: JSON.stringify({
        expires_after: { seconds: TOKEN_TTL_SECONDS },
      }),
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!xaiResponse.ok) {
      const errorText = await xaiResponse.text();
      console.error("[voice/session] xAI error:", xaiResponse.status, errorText);
      return NextResponse.json(
        {
          error:
            xaiResponse.status === 429
              ? "Voice service temporarily busy. Try again shortly."
              : "Failed to create voice session",
        },
        { status: xaiResponse.status === 429 ? 429 : 500 },
      );
    }

    const xaiData = (await xaiResponse.json()) as {
      value?: string;
      expires_at?: string;
    };

    if (!xaiData.value) {
      return NextResponse.json(
        { error: "Invalid response from voice service" },
        { status: 500 },
      );
    }

    let gateToken: string;
    try {
      gateToken = createGateToken({
        agentId,
        sessionId,
        expiresIn: TOKEN_TTL_SECONDS,
      });
    } catch {
      return NextResponse.json(
        { error: "Voice proxy shared secret not configured" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      xai_token: xaiData.value,
      gate_token: gateToken,
      expires_at: xaiData.expires_at,
      session_id: sessionId,
      // True when XAI_VOICE_AGENT_ID is set — client skips local persona session.update.
      dashboard_agent: Boolean(process.env.XAI_VOICE_AGENT_ID?.trim()),
    });
  } catch (error) {
    console.error("[voice/session] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
