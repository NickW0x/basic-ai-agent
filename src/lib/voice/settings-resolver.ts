import {
  DEFAULT_GLOBAL_SOUL,
  DEFAULT_VOICE_SETTINGS,
} from "@/lib/settings-mock/defaults";
import type { SoulProfile } from "@/lib/settings-runtime-contract";
import type { GrokVoiceTool } from "@/lib/voice-client/types";

const TONE_HINTS: Record<SoulProfile["tonePreset"], string> = {
  professional: "Use a professional, polished tone.",
  friendly: "Use a warm, approachable tone.",
  direct: "Be direct and efficient.",
  playful: "Use a light, engaging tone.",
  custom: "Follow the custom instructions closely.",
};

/** Build soul instructions block for voice session.update. */
export function buildSoulInstructions(soul: SoulProfile = DEFAULT_GLOBAL_SOUL): string {
  const lines = [
    `You are ${soul.identityName}. ${soul.tagline}`,
    TONE_HINTS[soul.tonePreset],
    `Traits: ${soul.traits.join(", ")}.`,
    soul.allowEmoji ? "Emoji are allowed when natural." : "Avoid emoji.",
    soul.customInstructions,
    "You are the multi-agent orchestrator assistant. Answer clearly and concisely.",
  ];
  return lines.filter(Boolean).join("\n");
}

export interface VoiceSessionConfig {
  systemPrompt: string;
  agentVoice: string;
  speed: number;
  collectionIds: string[];
  tools: GrokVoiceTool[];
}

/** Map settings mocks → Grok Voice session.update payload inputs. */
export function buildVoiceSessionConfig(
  overrides?: Partial<{
    soul: SoulProfile;
    voiceId: string;
    speed: number;
    collectionIds: string[];
  }>,
): VoiceSessionConfig {
  const voiceId = overrides?.voiceId ?? DEFAULT_VOICE_SETTINGS.defaultVoiceId;
  const speed = overrides?.speed ?? DEFAULT_VOICE_SETTINGS.speed;
  const collectionIds =
    overrides?.collectionIds ?? DEFAULT_VOICE_SETTINGS.collectionIds;

  const tools: GrokVoiceTool[] = [];

  if (collectionIds.length > 0) {
    tools.push({
      type: "function",
      name: "file_search",
      description: "Search knowledge base collections for grounded answers.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    });
  }

  return {
    systemPrompt: buildSoulInstructions(overrides?.soul),
    agentVoice: voiceId,
    speed,
    collectionIds,
    tools,
  };
}
