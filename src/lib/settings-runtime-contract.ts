/** Shared types and replacement hints for settings UI → eve / xAI / Railway runtime. */

export type AgentScopeId = "global" | "orchestrator" | string;

export type TonePreset =
  | "professional"
  | "friendly"
  | "direct"
  | "playful"
  | "custom";

export type SkillScope = "orchestrator" | string;

export type SkillStatus = "active" | "draft";

export type KnowledgeSourceStatus =
  | "unconfigured"
  | "connected"
  | "syncing";

export type DocumentIndexStatus = "pending" | "indexed" | "stale";

export interface SoulProfile {
  scopeId: AgentScopeId;
  inheritFromGlobal: boolean;
  identityName: string;
  tagline: string;
  tonePreset: TonePreset;
  formality: number;
  verbosity: number;
  allowEmoji: boolean;
  traits: string[];
  customInstructions: string;
  channelOverrides: Record<string, Partial<Pick<SoulProfile, "tonePreset" | "traits">>>;
}

export interface SkillEntry {
  id: string;
  name: string;
  scope: SkillScope;
  description: string;
  triggerHint: string;
  body: string;
  status: SkillStatus;
  replacesPath: string;
  updatedAt: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: "upload" | "website" | "google_drive" | "notion";
  status: KnowledgeSourceStatus;
  documentCount: number;
  collectionId?: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  sourceId: string;
  sourceName: string;
  chunkCount: number;
  indexStatus: DocumentIndexStatus;
  updatedAt: string;
  fileType: string;
}

export interface RagSettings {
  topK: number;
  chunkSize: number;
  overlap: number;
  embeddingModel: string;
}

export interface VoiceSettings {
  enabled: boolean;
  proxyUrl: string;
  defaultVoiceId: string;
  model: string;
  speed: number;
  stability: number;
  collectionIds: string[];
  channelOverrides: Record<string, string | null>;
}

export interface ReplacementHint {
  field: string;
  phase2Target: string;
  runtimeEffect: string;
}

export const REPLACEMENT_HINTS: Record<string, ReplacementHint> = {
  "soul.tonePreset": {
    field: "Tone preset",
    phase2Target: "agent/instructions.md or defineDynamic instructions on turn.started",
    runtimeEffect: "Model sees soul on every turn for that agent",
  },
  "soul.customInstructions": {
    field: "Custom instructions",
    phase2Target: "agent/instructions.md + subagent instructions.md",
    runtimeEffect: "Permanent identity block in system prompt",
  },
  "skill.scope": {
    field: "Skill scope",
    phase2Target: "agent/skills/<name>.md or agent/subagents/<id>/skills/<name>.md",
    runtimeEffect: "eve load_skill — scoped per agent, not shared",
  },
  "skill.triggerHint": {
    field: "Trigger hint",
    phase2Target: "First line of skill .md body (eve routing description)",
    runtimeEffect: "Controls when model calls load_skill",
  },
  "knowledge.collectionId": {
    field: "Collection ID",
    phase2Target: "xAI Collections API — collections_search / file_search",
    runtimeEffect: "Grounded answers with citations",
  },
  "knowledge.topK": {
    field: "Top K results",
    phase2Target: "collections_search limit or file_search max_num_results",
    runtimeEffect: "Retrieval depth per query",
  },
  "voice.proxyUrl": {
    field: "Voice proxy URL",
    phase2Target:
      "NEXT_PUBLIC_VOICE_PROXY_URL → new Railway grok-voice-proxy (not fieldflow)",
    runtimeEffect: "Browser WS wss://…/voice-proxy → xAI realtime",
  },
  "voice.defaultVoiceId": {
    field: "Default voice",
    phase2Target: "session.update.voice on GrokVoiceClient connect",
    runtimeEffect: "TTS voice identity for web voice mode",
  },
  "voice.speed": {
    field: "Playback speed",
    phase2Target: "session.update.audio.output.speed (0.7–1.5)",
    runtimeEffect: "Voice playback rate",
  },
};

export const FIELDLOW_VOICE_REPO = "https://github.com/NickW0x/fieldflow";

export const XAI_VOICE_IDS = [
  { id: "eve", name: "Eve", accent: "American" },
  { id: "ara", name: "Ara", accent: "American" },
  { id: "rex", name: "Rex", accent: "British" },
  { id: "sal", name: "Sal", accent: "American" },
  { id: "leo", name: "Leo", accent: "American" },
] as const;

export function buildSoulPreviewText(profile: SoulProfile): string {
  const toneLines: Record<TonePreset, string> = {
    professional:
      "Hello — I'm here to help. I'll keep responses clear, structured, and respectful of your time.",
    friendly:
      "Hey there! Happy to help — I'll keep things warm and easy to follow.",
    direct: "Got it. I'll be concise and action-oriented — no fluff.",
    playful:
      "Hi! Let's make this fun and useful — I'll keep it light while staying helpful.",
    custom:
      profile.customInstructions.trim() ||
      "I'll follow your custom identity instructions for every reply.",
  };

  const base = toneLines[profile.tonePreset];
  const verbose =
    profile.verbosity > 66
      ? " I can go into more detail when you ask."
      : profile.verbosity < 33
        ? " I'll keep answers short unless you want depth."
        : "";

  const emoji = profile.allowEmoji ? " 🙂" : "";
  const traits =
    profile.traits.length > 0
      ? ` Traits: ${profile.traits.join(", ")}.`
      : "";

  return `${base}${verbose}${traits}${emoji}`;
}

export function cloneSoulDefaults(profile: SoulProfile): SoulProfile {
  return {
    ...profile,
    traits: [...profile.traits],
    channelOverrides: { ...profile.channelOverrides },
  };
}
