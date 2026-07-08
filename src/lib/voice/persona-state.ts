import type { PersonaState } from "@/components/ai-elements/persona";
import type { UseEveAgentStatus } from "eve/react";

export interface DerivePersonaStateOptions {
  agentStatus: UseEveAgentStatus;
  isListening: boolean;
  voiceMode: boolean;
  voiceConnected?: boolean;
  isUserSpeaking?: boolean;
  isAssistantSpeaking?: boolean;
  isVoiceProcessing?: boolean;
}

/** Map eve agent status + mic/voice flags → Persona animation state. */
export function derivePersonaState({
  agentStatus,
  isListening,
  voiceMode,
  voiceConnected = false,
  isUserSpeaking = false,
  isAssistantSpeaking = false,
  isVoiceProcessing = false,
}: DerivePersonaStateOptions): PersonaState {
  if (!voiceMode) {
    return "asleep";
  }

  // Grok Voice realtime takes priority when connected (Phase 2).
  if (voiceConnected) {
    if (isUserSpeaking || isListening) {
      return "listening";
    }
    if (isAssistantSpeaking) {
      return "speaking";
    }
    if (isVoiceProcessing) {
      return "thinking";
    }
    return "idle";
  }

  // Phase 1: SpeechInput + text agent status.
  if (isListening) {
    return "listening";
  }
  if (agentStatus === "submitted") {
    return "thinking";
  }
  if (agentStatus === "streaming") {
    return "speaking";
  }
  if (agentStatus === "ready" || agentStatus === "error") {
    return "idle";
  }

  return "idle";
}

const PERSONA_STATUS_LABELS: Record<PersonaState, string> = {
  asleep: "Voice mode off",
  idle: "Ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

/** Human-readable caption for the current persona state. */
export function personaStatusLabel(state: PersonaState): string {
  return PERSONA_STATUS_LABELS[state];
}
