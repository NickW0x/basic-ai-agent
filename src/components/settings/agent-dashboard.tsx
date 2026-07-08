"use client";

import { AgentCard } from "@/components/settings/agent-card";
import { AgentRuntimePanel } from "@/components/settings/agent-runtime-panel";
import { RedisStatusCard } from "@/components/settings/redis-status-card";
import { useSettingsStatus } from "@/components/settings/settings-status-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircleIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

type FilterMode = "all" | "ready" | "needs-setup";

export function AgentDashboard() {
  const { data, error, loading, lastCheckedAt } = useSettingsStatus();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");

  const agents = data?.agents;
  const system = data?.system;

  const filteredSpecialists = useMemo(() => {
    if (!agents) return [];

    const normalizedQuery = query.trim().toLowerCase();

    return agents.specialists.filter((agent) => {
      if (filter === "ready" && agent.readiness !== "ready") return false;
      if (filter === "needs-setup" && agent.readiness === "ready") return false;

      if (!normalizedQuery) return true;

      return (
        agent.label.toLowerCase().includes(normalizedQuery) ||
        agent.id.toLowerCase().includes(normalizedQuery) ||
        agent.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [agents, filter, query]);

  const readyCount =
    agents?.specialists.filter((agent) => agent.readiness === "ready").length ??
    0;
  const limitedCount = (agents?.specialists.length ?? 0) - readyCount;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      <Alert>
        <AlertTitle>Read-only agent configuration</AlertTitle>
        <AlertDescription>
          Agent definitions live under <code>agent/</code>. This tab shows live
          runtime health, resolved model, and tool readiness — not secret values.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Could not refresh status</AlertTitle>
          <AlertDescription>
            {error}
            {data ? " Showing last known status." : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {agents?.manifestError ? (
        <Alert>
          <AlertTitle>Manifest fallback active</AlertTitle>
          <AlertDescription>{agents.manifestError}</AlertDescription>
        </Alert>
      ) : null}

      {system && data ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium text-sm tracking-wide uppercase text-muted-foreground">
              Runtime infrastructure
            </h2>
            <div className="flex flex-wrap gap-2">
              {lastCheckedAt ? (
                <Badge variant="outline">
                  Checked {new Date(lastCheckedAt).toLocaleTimeString()}
                </Badge>
              ) : null}
              <Badge variant="outline">Model: {agents?.model}</Badge>
            </div>
          </div>
          <AgentRuntimePanel environment={data.environment} system={system} />
          <RedisStatusCard
            environment={data.environment}
            lastCheckedAt={lastCheckedAt}
            redis={system.redis}
          />
        </section>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-28 animate-pulse rounded-xl border bg-muted/40"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {agents ? (
        <>
          <section className="space-y-3">
            <h2 className="font-medium text-sm tracking-wide uppercase text-muted-foreground">
              Orchestrator
            </h2>
            <AgentCard agent={agents.orchestrator} isOrchestrator />
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-medium text-sm tracking-wide uppercase text-muted-foreground">
                  Specialists
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  {filteredSpecialists.length} of {agents.specialists.length}{" "}
                  specialists shown · max depth {agents.maxSubagentDepth}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[320px]">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search agents"
                    className="pl-9"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search researcher, coder, marketer…"
                    value={query}
                  />
                </div>
                <Tabs
                  onValueChange={(value) => setFilter(value as FilterMode)}
                  value={filter}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="ready">Ready</TabsTrigger>
                    <TabsTrigger value="needs-setup">Needs setup</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{readyCount} ready</Badge>
              <Badge variant="secondary">{limitedCount} limited</Badge>
            </div>

            {filteredSpecialists.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                <p className="font-medium text-sm">No agents match</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Try a different search or filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredSpecialists.map((agent) => (
                  <AgentCard agent={agent} key={agent.id} />
                ))}
              </div>
            )}
          </section>
        </>
      ) : loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-40 animate-pulse rounded-xl border bg-muted/40"
              key={index}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
