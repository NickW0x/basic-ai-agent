/** Client-side voice runtime helpers. */

export function getVoiceProxyUrl(): string {
  return process.env.NEXT_PUBLIC_VOICE_PROXY_URL ?? "";
}

export function isVoiceRuntimeEnabled(): boolean {
  return Boolean(getVoiceProxyUrl());
}
