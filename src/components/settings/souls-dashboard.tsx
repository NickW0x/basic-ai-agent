"use client";

import { AgentScopeSelect } from "@/components/settings/agent-scope-select";
import { ReplacementHint } from "@/components/settings/replacement-hint";
import {
  RuntimeConnectionPanel,
  SettingsPageHeader,
} from "@/components/settings/settings-page-header";
import { SettingsPreviewMessage } from "@/components/settings/settings-preview-message";
import { SettingsSummaryGrid } from "@/components/settings/settings-summary-grid";
import { useSettingsDraft } from "@/components/settings/settings-draft-context";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  buildSoulPreviewText,
  type SoulProfile,
  type TonePreset,
} from "@/lib/settings-runtime-contract";
import { cn } from "@/lib/utils";
import { SparklesIcon, UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";

const TONE_PRESETS: {
  id: TonePreset;
  label: string;
  description: string;
}[] = [
  { id: "professional", label: "Professional", description: "Clear and structured" },
  { id: "friendly", label: "Friendly", description: "Warm and approachable" },
  { id: "direct", label: "Direct", description: "Concise and action-oriented" },
  { id: "playful", label: "Playful", description: "Light tone with personality" },
  { id: "custom", label: "Custom", description: "Your own instructions" },
];

const TRAIT_SUGGESTIONS = [
  "curious",
  "concise",
  "empathetic",
  "technical",
  "patient",
];

export function SoulsDashboard() {
  const { state, updateState } = useSettingsDraft();
  const [scopeId, setScopeId] = useState<string>("orchestrator");

  const profile = state.souls[scopeId] ?? state.souls.global;
  const previewText = useMemo(() => buildSoulPreviewText(profile), [profile]);

  const updateProfile = (patch: Partial<SoulProfile>) => {
    updateState((prev) => ({
      ...prev,
      souls: {
        ...prev.souls,
        [scopeId]: { ...prev.souls[scopeId], ...patch },
      },
    }));
  };

  const configuredCount = Object.keys(state.souls).filter(
    (id) => id !== "global" && !state.souls[id]?.inheritFromGlobal,
  ).length;

  const addTrait = (trait: string) => {
    if (profile.traits.includes(trait)) return;
    updateProfile({ traits: [...profile.traits, trait] });
  };

  const removeTrait = (trait: string) => {
    updateProfile({ traits: profile.traits.filter((t) => t !== trait) });
  };

  const dimmed = profile.inheritFromGlobal && scopeId !== "global";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      <SettingsPageHeader
        description="Identity, tone, and personality per agent. Maps to eve instructions.md in production."
        stat={`${configuredCount} overrides`}
        title="Souls"
      />

      <RuntimeConnectionPanel>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>eve:</strong> instructions.md + defineDynamic on turn.started
          </li>
          <li>
            <strong>Chat SDK:</strong> channel overrides via ctx.channel
          </li>
          <li>
            <strong>Voice:</strong> same soul text in session.update.instructions
          </li>
        </ul>
      </RuntimeConnectionPanel>

      <SettingsSummaryGrid
        stats={[
          {
            label: "Agents with overrides",
            value: configuredCount,
            icon: UsersIcon,
          },
          {
            label: "Active tone",
            value: profile.tonePreset,
            icon: SparklesIcon,
          },
          {
            label: "Traits",
            value: profile.traits.length,
            detail: profile.traits.join(", ") || "None",
          },
          {
            label: "Preview",
            value: "Ready",
            detail: "Template preview updates live",
          },
        ]}
      />

      <AgentScopeSelect onChange={setScopeId} value={scopeId} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          className={cn("gap-0 py-0 lg:col-span-3", dimmed && "opacity-60")}
        >
          <CardHeader className="border-b px-4 py-4">
            <CardTitle className="text-base">Soul editor</CardTitle>
            <CardDescription>
              Scope: <code className="text-xs">{scopeId}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-4 py-4">
            {scopeId !== "global" ? (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="inherit">Use global default</Label>
                <Switch
                  checked={profile.inheritFromGlobal}
                  id="inherit"
                  onCheckedChange={(checked) =>
                    updateProfile({ inheritFromGlobal: checked })
                  }
                />
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="identity">Identity name</Label>
                <Input
                  disabled={dimmed}
                  id="identity"
                  onChange={(e) =>
                    updateProfile({ identityName: e.target.value })
                  }
                  value={profile.identityName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  disabled={dimmed}
                  id="tagline"
                  onChange={(e) => updateProfile({ tagline: e.target.value })}
                  value={profile.tagline}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Tone preset</Label>
                <ReplacementHint hintKey="soul.tonePreset" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {TONE_PRESETS.map((preset) => (
                  <button
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      profile.tonePreset === preset.id
                        ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                        : "border-border hover:bg-muted/40",
                      dimmed && "pointer-events-none",
                    )}
                    disabled={dimmed}
                    key={preset.id}
                    onClick={() => updateProfile({ tonePreset: preset.id })}
                    type="button"
                  >
                    <p className="font-medium text-sm">{preset.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Formality</Label>
              <Slider
                disabled={dimmed}
                max={100}
                onValueChange={([v]) => updateProfile({ formality: v ?? 50 })}
                step={1}
                value={[profile.formality]}
              />
              <p className="text-muted-foreground text-xs">
                Casual ← → Formal
              </p>
            </div>

            <div className="space-y-2">
              <Label>Verbosity</Label>
              <Slider
                disabled={dimmed}
                max={100}
                onValueChange={([v]) => updateProfile({ verbosity: v ?? 50 })}
                step={1}
                value={[profile.verbosity]}
              />
              <p className="text-muted-foreground text-xs">
                Concise ← → Detailed
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="emoji">Allow emoji</Label>
              <Switch
                checked={profile.allowEmoji}
                disabled={dimmed}
                id="emoji"
                onCheckedChange={(checked) =>
                  updateProfile({ allowEmoji: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Traits</Label>
              <div className="flex flex-wrap gap-2">
                {profile.traits.map((trait) => (
                  <Badge className="gap-1" key={trait} variant="secondary">
                    {trait}
                    {!dimmed ? (
                      <button
                        aria-label={`Remove ${trait}`}
                        className="ml-1 hover:text-destructive"
                        onClick={() => removeTrait(trait)}
                        type="button"
                      >
                        ×
                      </button>
                    ) : null}
                  </Badge>
                ))}
              </div>
              {!dimmed ? (
                <div className="flex flex-wrap gap-2">
                  {TRAIT_SUGGESTIONS.filter((t) => !profile.traits.includes(t)).map(
                    (trait) => (
                      <Button
                        key={trait}
                        onClick={() => addTrait(trait)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        + {trait}
                      </Button>
                    ),
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="custom">Custom instructions</Label>
                <ReplacementHint hintKey="soul.customInstructions" />
              </div>
              <Textarea
                disabled={dimmed}
                id="custom"
                onChange={(e) =>
                  updateProfile({ customInstructions: e.target.value })
                }
                rows={4}
                value={profile.customInstructions}
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-6">
            <SettingsPreviewMessage assistantMessage={previewText} />
          </div>
          <Accordion className="mt-4 lg:hidden" collapsible type="single">
            <AccordionItem value="preview">
              <AccordionTrigger>Live preview</AccordionTrigger>
              <AccordionContent>
                <SettingsPreviewMessage assistantMessage={previewText} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
