/** Shared xAI Realtime WebSocket URL for the voice proxy. */

const XAI_REALTIME_BASE_URL = "wss://api.x.ai/v1/realtime";

export const XAI_REALTIME_MODEL =
  process.env.XAI_REALTIME_MODEL || "grok-voice-think-fast-1.0";

export const XAI_REALTIME_URL = `${XAI_REALTIME_BASE_URL}?model=${encodeURIComponent(
  XAI_REALTIME_MODEL,
)}`;
