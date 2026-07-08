"use client";

import type { PersonaState } from "@/components/ai-elements/persona";
import { Persona } from "@/components/ai-elements/persona";
import {
  MicSelector,
  MicSelectorContent,
  MicSelectorEmpty,
  MicSelectorItem,
  MicSelectorLabel,
  MicSelectorList,
  MicSelectorTrigger,
  MicSelectorValue,
  useAudioDevices,
} from "@/components/ai-elements/mic-selector";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { personaStatusLabel } from "@/lib/voice/persona-state";
import { PhoneOffIcon } from "lucide-react";
import Link from "next/link";

export interface VoiceTranscriptLine {
  id: string;
  speaker: "user" | "assistant";
  text: string;
}

interface VoiceModePanelProps {
  personaState: PersonaState;
  compact?: boolean;
  voiceEnabled?: boolean;
  voiceConnected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isConnecting?: boolean;
  transcripts?: VoiceTranscriptLine[];
  selectedMicId?: string;
  onMicChange?: (deviceId: string | undefined) => void;
}

export function VoiceModePanel({
  personaState,
  compact = false,
  voiceEnabled = false,
  voiceConnected = false,
  onConnect,
  onDisconnect,
  isConnecting = false,
  transcripts = [],
  selectedMicId,
  onMicChange,
}: VoiceModePanelProps) {
  const label = personaStatusLabel(personaState);
  const { hasPermission, loadDevices } = useAudioDevices();

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-3 rounded-lg border bg-muted/30 px-4 py-3"
          : "flex flex-col items-center justify-center gap-4 py-8"
      }
    >
      <div className={compact ? "flex items-center gap-4" : "flex flex-col items-center gap-4"}>
        <Persona
          className={compact ? "size-16 shrink-0" : "size-32 md:size-40"}
          state={personaState}
          variant="opal"
        />
        <div className={compact ? "min-w-0 flex-1" : "text-center"}>
          <p className="font-medium text-sm">{label}</p>
          {!compact && !voiceEnabled ? (
            <p className="mt-2 text-muted-foreground text-xs">
              Set{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                NEXT_PUBLIC_VOICE_PROXY_URL
              </code>{" "}
              or enable in{" "}
              <Link
                className="underline hover:text-foreground"
                href="/settings/voice"
              >
                Settings → Voice
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <MicSelector onValueChange={onMicChange} value={selectedMicId}>
            <MicSelectorTrigger className="w-[200px]">
              <MicSelectorValue />
            </MicSelectorTrigger>
            <MicSelectorContent>
              {!hasPermission ? (
                <MicSelectorEmpty>
                  <Button
                    className="w-full"
                    onClick={() => void loadDevices()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Allow microphone access
                  </Button>
                </MicSelectorEmpty>
              ) : (
                <MicSelectorList>
                  {(devices) =>
                    devices.length === 0 ? (
                      <MicSelectorEmpty>No microphones found</MicSelectorEmpty>
                    ) : (
                      devices.map((device) => (
                        <MicSelectorItem
                          key={device.deviceId}
                          value={device.deviceId}
                        >
                          <MicSelectorLabel device={device} />
                        </MicSelectorItem>
                      ))
                    )
                  }
                </MicSelectorList>
              )}
            </MicSelectorContent>
          </MicSelector>

          {voiceEnabled ? (
            voiceConnected ? (
              <Button onClick={onDisconnect} size="sm" variant="outline">
                <PhoneOffIcon className="mr-1.5 size-3.5" />
                Disconnect
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      disabled={isConnecting}
                      onClick={onConnect}
                      size="sm"
                    >
                      {isConnecting ? "Connecting…" : "Connect voice"}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!voiceEnabled ? (
                  <TooltipContent>
                    Configure voice proxy in Settings
                  </TooltipContent>
                ) : null}
              </Tooltip>
            )
          ) : null}
        </div>
      ) : null}

      {transcripts.length > 0 ? (
        <div
          className={
            compact
              ? "max-h-32 space-y-2 overflow-y-auto text-sm"
              : "max-h-48 w-full max-w-md space-y-2 overflow-y-auto rounded-lg border bg-card p-3 text-sm"
          }
        >
          {transcripts.map((line) => (
            <p
              className={
                line.speaker === "user"
                  ? "text-muted-foreground"
                  : "text-foreground"
              }
              key={line.id}
            >
              <span className="font-medium capitalize">{line.speaker}: </span>
              {line.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
