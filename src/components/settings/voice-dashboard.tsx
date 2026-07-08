"use client";

import {
  VoiceSelector,
  VoiceSelectorAccent,
  VoiceSelectorContent,
  VoiceSelectorEmpty,
  VoiceSelectorGroup,
  VoiceSelectorInput,
  VoiceSelectorItem,
  VoiceSelectorList,
  VoiceSelectorName,
  VoiceSelectorPreview,
  VoiceSelectorTrigger,
} from "@/components/ai-elements/voice-selector";
import { ReplacementHint } from "@/components/settings/replacement-hint";
import {
  RuntimeConnectionPanel,
  SettingsPageHeader,
} from "@/components/settings/settings-page-header";
import { SettingsSummaryGrid } from "@/components/settings/settings-summary-grid";
import { useSettingsDraft } from "@/components/settings/settings-draft-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  FIELDLOW_VOICE_REPO,
  XAI_VOICE_IDS,
  type VoiceSettings,
} from "@/lib/settings-runtime-contract";
import { cn } from "@/lib/utils";
import {
  ExternalLinkIcon,
  MicIcon,
  RadioIcon,
  ServerIcon,
  WorkflowIcon,
} from "lucide-react";
import { useState } from "react";

const CHANNEL_LABELS: Record<string, string> = {
  web: "Web chat",
  slack: "Slack",
  whatsapp: "WhatsApp",
};

export function VoiceDashboard() {
  const { state, updateState } = useSettingsDraft();
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const updateVoice = (patch: Partial<VoiceSettings>) => {
    updateState((prev) => ({
      ...prev,
      voice: { ...prev.voice, ...patch },
    }));
  };

  const selectedVoice = XAI_VOICE_IDS.find(
    (v) => v.id === state.voice.defaultVoiceId,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      <SettingsPageHeader
        description="Grok Voice Agent via Railway grok-voice-proxy — separate project from fieldflow."
        stat={state.voice.enabled ? "Enabled" : "Disabled"}
        title="Voice"
      />

      <RuntimeConnectionPanel>
        <div className="space-y-3">
          <p>
            Reference implementation:{" "}
            <a
              className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              href={FIELDLOW_VOICE_REPO}
              rel="noreferrer"
              target="_blank"
            >
              NickW0x/fieldflow
              <ExternalLinkIcon className="size-3" />
            </a>{" "}
            (<code>voice-proxy/</code>, <code>hooks/use-grok-voice.ts</code>).
            Deploy a <strong>new</strong> Railway project — do not modify the
            existing <code>fieldflow</code> service on{" "}
            <code>voice.tradecraft.nexus</code>.
          </p>
          <p>
            Pipeline: Settings → <code>POST /api/voice/session</code> →{" "}
            <code>wss://&#123;proxy&#125;/voice-proxy</code> → xAI realtime.
            <code>session.update</code> carries soul instructions, voice ID,
            speed, and <code>file_search</code> collection IDs.
          </p>
        </div>
      </RuntimeConnectionPanel>

      <SettingsSummaryGrid
        stats={[
          { label: "Default voice", value: selectedVoice?.name ?? "—", icon: MicIcon },
          { label: "Model", value: state.voice.model },
          { label: "Speed", value: state.voice.speed.toFixed(2) },
          {
            label: "KB collections",
            value: state.voice.collectionIds.length,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voice mode</CardTitle>
          <CardDescription>
            Web chat only — Chat SDK platforms remain text-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <Label htmlFor="voice-enabled">Enable voice in web chat</Label>
          <Switch
            checked={state.voice.enabled}
            id="voice-enabled"
            onCheckedChange={(enabled) => updateVoice({ enabled })}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b px-4 py-4">
            <CardTitle className="text-base">Proxy & model</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="proxy-url">Voice proxy URL</Label>
                <ReplacementHint hintKey="voice.proxyUrl" />
              </div>
              <Input
                id="proxy-url"
                onChange={(e) => updateVoice({ proxyUrl: e.target.value })}
                placeholder="https://your-service.railway.app"
                value={state.voice.proxyUrl}
              />
              <p className="text-muted-foreground text-xs">
                Replaces: <code>NEXT_PUBLIC_VOICE_PROXY_URL</code> (new Railway
                project)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice-model">Realtime model</Label>
              <Input
                disabled
                id="voice-model"
                value={state.voice.model}
              />
              <p className="text-muted-foreground text-xs">
                Set on Railway as <code>XAI_REALTIME_MODEL</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b px-4 py-4">
            <CardTitle className="text-base">Default voice</CardTitle>
            <CardDescription>
              Maps to <code>session.update.voice</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 py-4">
            <VoiceSelector
              onValueChange={(v) => v && updateVoice({ defaultVoiceId: v })}
              value={state.voice.defaultVoiceId}
            >
              <VoiceSelectorTrigger asChild>
                <Button className="w-full justify-between" type="button" variant="outline">
                  <span>
                    {selectedVoice?.name ?? state.voice.defaultVoiceId}
                    <span className="ml-2 text-muted-foreground text-xs">
                      ({selectedVoice?.accent ?? "—"})
                    </span>
                  </span>
                  <MicIcon className="size-4" />
                </Button>
              </VoiceSelectorTrigger>
              <VoiceSelectorContent title="Select default voice">
                <VoiceSelectorInput placeholder="Search voices…" />
                <VoiceSelectorList>
                  <VoiceSelectorEmpty>No voice found.</VoiceSelectorEmpty>
                  <VoiceSelectorGroup heading="xAI voices">
                    {XAI_VOICE_IDS.map((voice) => (
                      <VoiceSelectorItem
                        key={voice.id}
                        onSelect={() => updateVoice({ defaultVoiceId: voice.id })}
                        value={voice.id}
                      >
                        <VoiceSelectorName>{voice.name}</VoiceSelectorName>
                        <VoiceSelectorAccent value={voice.accent.toLowerCase()}>
                          {voice.accent}
                        </VoiceSelectorAccent>
                      </VoiceSelectorItem>
                    ))}
                  </VoiceSelectorGroup>
                </VoiceSelectorList>
              </VoiceSelectorContent>
            </VoiceSelector>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {XAI_VOICE_IDS.map((voice) => (
                <button
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    state.voice.defaultVoiceId === voice.id
                      ? "border-primary bg-accent"
                      : "hover:bg-muted/40",
                  )}
                  key={voice.id}
                  onClick={() => updateVoice({ defaultVoiceId: voice.id })}
                  type="button"
                >
                  <p className="font-medium">{voice.name}</p>
                  <p className="text-muted-foreground text-xs">{voice.id}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <VoiceSelectorPreview
                onPlay={() => {
                  setPreviewPlaying((p) => !p);
                  window.setTimeout(() => setPreviewPlaying(false), 2000);
                }}
                playing={previewPlaying}
              />
              <p className="text-muted-foreground text-xs">
                Preview mock — phase 2 uses <code>GrokVoiceClient</code> via proxy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Playback</CardTitle>
          <CardDescription>
            <code>session.update.audio.output.speed</code> (0.7–1.5)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Label>Speed</Label>
              <ReplacementHint hintKey="voice.speed" />
            </div>
            <span className="font-mono text-sm tabular-nums">
              {state.voice.speed.toFixed(2)}
            </span>
          </div>
          <Slider
            max={1.5}
            min={0.7}
            onValueChange={([v]) => updateVoice({ speed: v })}
            step={0.05}
            value={[state.voice.speed]}
          />
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-4 py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <WorkflowIcon className="size-4" />
            Runtime pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {[
              { icon: MicIcon, label: "Web UI", sub: "useGrokVoice hook" },
              { icon: ServerIcon, label: "POST /api/voice/session", sub: "Mint tokens" },
              { icon: RadioIcon, label: "Railway proxy", sub: "/voice-proxy WS" },
              { icon: WorkflowIcon, label: "xAI Realtime", sub: "Grok Voice Agent" },
            ].map((step, i, arr) => (
              <div className="flex flex-1 items-center gap-2" key={step.label}>
                <div className="flex min-w-0 flex-1 flex-col items-center rounded-lg border bg-muted/30 px-3 py-4 text-center">
                  <step.icon className="mb-2 size-5 text-muted-foreground" />
                  <p className="font-medium text-sm">{step.label}</p>
                  <p className="text-muted-foreground text-xs">{step.sub}</p>
                </div>
                {i < arr.length - 1 ? (
                  <span className="hidden text-muted-foreground md:inline">→</span>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Accordion className="rounded-xl border px-4" collapsible type="single">
        <AccordionItem value="channels">
          <AccordionTrigger className="text-sm hover:no-underline">
            Channel overrides (web first)
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {Object.entries(state.voice.channelOverrides).map(([channel, voiceId]) => (
              <div
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                key={channel}
              >
                <span className="font-medium text-sm">
                  {CHANNEL_LABELS[channel] ?? channel}
                </span>
                {voiceId ? (
                  <Badge variant="outline">{voiceId}</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    Uses default ({state.voice.defaultVoiceId})
                  </span>
                )}
              </div>
            ))}
            <p className="text-muted-foreground text-xs">
              Phase 2: per-channel voice via resolver; Chat SDK stays text-only.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
