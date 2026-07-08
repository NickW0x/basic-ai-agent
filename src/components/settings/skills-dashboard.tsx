"use client";

import { ReplacementHint } from "@/components/settings/replacement-hint";
import {
  RuntimeConnectionPanel,
  SettingsPageHeader,
} from "@/components/settings/settings-page-header";
import { SettingsSummaryGrid } from "@/components/settings/settings-summary-grid";
import { useSettingsDraft } from "@/components/settings/settings-draft-context";
import { AGENT_META_BY_ID } from "@/lib/agent-meta";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { SkillEntry } from "@/lib/settings-runtime-contract";
import { cn } from "@/lib/utils";
import { BookOpenIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

type FilterMode = "all" | "orchestrator" | "specialists" | "draft";

export function SkillsDashboard() {
  const { state, updateState } = useSettingsDraft();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    state.skills[0]?.id ?? null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.skills.filter((skill) => {
      if (filter === "orchestrator" && skill.scope !== "orchestrator")
        return false;
      if (filter === "specialists" && skill.scope === "orchestrator")
        return false;
      if (filter === "draft" && skill.status !== "draft") return false;
      if (!q) return true;
      return (
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.scope.toLowerCase().includes(q)
      );
    });
  }, [state.skills, filter, query]);

  const selected =
    state.skills.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  const updateSkill = (id: string, patch: Partial<SkillEntry>) => {
    updateState((prev) => ({
      ...prev,
      skills: prev.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const addSkill = () => {
    const id = `skill-${Date.now()}`;
    const newSkill: SkillEntry = {
      id,
      name: "new-skill",
      scope: "orchestrator",
      description: "Describe when the model should load this skill.",
      triggerHint: "Use when…",
      body: "# New skill\n\nAdd procedure steps here.",
      status: "draft",
      replacesPath: "agent/skills/new-skill.md",
      updatedAt: new Date().toISOString(),
    };
    updateState((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill],
    }));
    setSelectedId(id);
    setSheetOpen(true);
  };

  const orchestratorCount = state.skills.filter(
    (s) => s.scope === "orchestrator",
  ).length;

  const detailPane = selected ? (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{selected.name}</CardTitle>
          <Badge variant="outline">{selected.scope}</Badge>
          <Badge
            variant={selected.status === "active" ? "default" : "secondary"}
          >
            {selected.status}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs">
          {selected.replacesPath}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <Tabs defaultValue="edit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-4 pt-4" value="edit">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                onChange={(e) =>
                  updateSkill(selected.id, { name: e.target.value })
                }
                value={selected.name}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Scope</Label>
                <ReplacementHint hintKey="skill.scope" />
              </div>
              <Select
                onValueChange={(v) => updateSkill(selected.id, { scope: v })}
                value={selected.scope}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orchestrator">Orchestrator</SelectItem>
                  {Object.keys(AGENT_META_BY_ID)
                    .filter((id) => id !== "orchestrator")
                    .map((id) => (
                      <SelectItem key={id} value={id}>
                        {AGENT_META_BY_ID[id]?.label ?? id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Trigger hint</Label>
                <ReplacementHint hintKey="skill.triggerHint" />
              </div>
              <Input
                onChange={(e) =>
                  updateSkill(selected.id, { triggerHint: e.target.value })
                }
                value={selected.triggerHint}
              />
            </div>
            <div className="space-y-2">
              <Label>Markdown body</Label>
              <Textarea
                className="font-mono text-xs"
                onChange={(e) =>
                  updateSkill(selected.id, { body: e.target.value })
                }
                rows={12}
                value={selected.body}
              />
            </div>
          </TabsContent>
          <TabsContent className="pt-4" value="preview">
            <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs whitespace-pre-wrap">
              {selected.body}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  ) : (
    <div className="rounded-xl border border-dashed px-6 py-12 text-center text-muted-foreground text-sm">
      Select a skill or create one.
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      <SettingsPageHeader
        description="Load-on-demand procedures scoped per agent via eve load_skill."
        stat={`${state.skills.length} skills`}
        title="Skills"
      />

      <RuntimeConnectionPanel>
        <p>
          Skills live under <code>agent/skills/</code> (orchestrator) or{" "}
          <code>agent/subagents/&lt;id&gt;/skills/</code>. Seeded from{" "}
          <code>chat-reply-format</code> and <code>copy-frameworks</code>.
        </p>
      </RuntimeConnectionPanel>

      <SettingsSummaryGrid
        stats={[
          { label: "Total skills", value: state.skills.length, icon: BookOpenIcon },
          { label: "Orchestrator", value: orchestratorCount },
          {
            label: "Specialists",
            value: state.skills.length - orchestratorCount,
          },
          {
            label: "Drafts",
            value: state.skills.filter((s) => s.status === "draft").length,
          },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            value={query}
          />
        </div>
        <Tabs onValueChange={(v) => setFilter(v as FilterMode)} value={filter}>
          <TabsList className="grid w-full grid-cols-4 sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="orchestrator">Orchestrator</TabsTrigger>
            <TabsTrigger value="specialists">Specialists</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {filtered.map((skill) => (
            <button
              className={cn(
                "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                selected?.id === skill.id
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-muted/40",
              )}
              key={skill.id}
              onClick={() => setSelectedId(skill.id)}
              type="button"
            >
              <p className="font-medium text-sm">{skill.name}</p>
              <p className="text-muted-foreground text-xs">{skill.scope}</p>
            </button>
          ))}
          <Button
            className="w-full"
            onClick={addSkill}
            type="button"
            variant="outline"
          >
            <PlusIcon className="size-4" />
            Add skill
          </Button>
        </div>
        {detailPane}
      </div>

      <div className="space-y-3 lg:hidden">
        <div className="grid gap-2">
          {filtered.map((skill) => (
            <Button
              className="h-auto w-full justify-start py-3"
              key={skill.id}
              onClick={() => {
                setSelectedId(skill.id);
                setSheetOpen(true);
              }}
              type="button"
              variant="outline"
            >
              <div className="text-left">
                <p className="font-medium">{skill.name}</p>
                <p className="text-muted-foreground text-xs">{skill.scope}</p>
              </div>
            </Button>
          ))}
        </div>
        <Button className="w-full" onClick={addSkill} type="button">
          <PlusIcon className="size-4" />
          Add skill
        </Button>
        <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
          <SheetContent className="overflow-y-auto sm:max-w-lg" side="right">
            <SheetHeader>
              <SheetTitle>{selected?.name ?? "Skill"}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{detailPane}</div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
