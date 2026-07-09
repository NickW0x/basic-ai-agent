/** Shared xAI Realtime WebSocket URL for the voice proxy. */

const XAI_REALTIME_BASE_URL = "wss://api.x.ai/v1/realtime";

/** Dashboard Voice Agent Builder ID — when set, connects with ?agent_id=… */
export const XAI_VOICE_AGENT_ID = (process.env.XAI_VOICE_AGENT_ID || "").trim();

export const XAI_REALTIME_MODEL =
  process.env.XAI_REALTIME_MODEL || "grok-voice-think-fast-1.0";

/** True when the proxy should use a console-configured agent instead of ?model=. */
export const USE_DASHBOARD_AGENT = XAI_VOICE_AGENT_ID.length > 0;

// Prefer dashboard agent_id; fall back to model query for local persona sessions.
export const XAI_REALTIME_URL = USE_DASHBOARD_AGENT
  ? `${XAI_REALTIME_BASE_URL}?agent_id=${encodeURIComponent(XAI_VOICE_AGENT_ID)}`
  : `${XAI_REALTIME_BASE_URL}?model=${encodeURIComponent(XAI_REALTIME_MODEL)}`;
