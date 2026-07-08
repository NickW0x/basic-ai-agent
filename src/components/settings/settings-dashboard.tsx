"use client";

import {
  ConnectorCard,
  type ConnectorStatus,
} from "@/components/settings/connector-card";
import { InfrastructurePanel } from "@/components/settings/infrastructure-panel";
import { useSettingsStatus } from "@/components/settings/settings-status-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CONNECTOR_BRANDS,
  CONNECTOR_CATEGORY_LABELS,
  CONNECTOR_CATEGORY_ORDER,
  type ConnectorCategory,
} from "@/lib/connector-meta";
import { AlertCircleIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";

type FilterMode = "all" | "configured" | "needs-setup";

function groupConnectorsByCategory(connectors: ConnectorStatus[]) {
  const groups = new Map<ConnectorCategory, ConnectorStatus[]>();

  for (const category of CONNECTOR_CATEGORY_ORDER) {
    groups.set(category, []);
  }

  for (const connector of connectors) {
    const category = CONNECTOR_BRANDS[connector.slug]?.category ?? "messaging";
    const list = groups.get(category) ?? [];
    list.push(connector);
    groups.set(category, list);
  }

  return CONNECTOR_CATEGORY_ORDER.map((category) => ({
    category,
    label: CONNECTOR_CATEGORY_LABELS[category],
    connectors: groups.get(category) ?? [],
  })).filter((group) => group.connectors.length > 0);
}

export function SettingsDashboard() {
  const { data, error, loading, lastCheckedAt } = useSettingsStatus();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");

  const connectors = data?.connectors?.connectors ?? [];
  const system = data?.system;

  const filteredConnectors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return connectors.filter((connector) => {
      if (filter === "configured" && !connector.enabled) return false;
      if (filter === "needs-setup" && connector.enabled) return false;

      if (!normalizedQuery) return true;

      return (
        connector.name.toLowerCase().includes(normalizedQuery) ||
        connector.slug.toLowerCase().includes(normalizedQuery) ||
        connector.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [connectors, filter, query]);

  const groupedConnectors = useMemo(
    () => groupConnectorsByCategory(filteredConnectors),
    [filteredConnectors],
  );

  const configuredCount = connectors.filter((c) => c.enabled).length;
  const needsSetupCount = connectors.length - configuredCount;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      <Alert>
        <AlertTitle>Credentials live in environment variables</AlertTitle>
        <AlertDescription>
          Add secrets to <code>.env.local</code> or your deployment host, then
          restart the server. Configured means env vars are detected — not a
          live webhook check. Restrict access in production once auth is wired.
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

      {system && data?.connectors ? (
        <>
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-medium text-sm tracking-wide uppercase text-muted-foreground">
                Infrastructure
              </h2>
              <div className="flex flex-wrap gap-2">
                {lastCheckedAt ? (
                  <Badge variant="outline">
                    Checked {new Date(lastCheckedAt).toLocaleTimeString()}
                  </Badge>
                ) : null}
                <Badge variant="outline">{configuredCount} configured</Badge>
                <Badge variant="secondary">{needsSetupCount} need setup</Badge>
              </div>
            </div>
            <InfrastructurePanel
              botUsername={data.connectors.botUsername}
              enabledCount={configuredCount}
              environment={data.environment}
              lastCheckedAt={lastCheckedAt}
              redis={system.redis}
              system={system}
              totalCount={connectors.length}
            />
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-medium text-sm tracking-wide uppercase text-muted-foreground">
                  Platform adapters
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  {filteredConnectors.length} of {connectors.length} connectors
                  shown
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[320px]">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search connectors"
                    className="pl-9"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search Slack, Sendblue, Linear…"
                    value={query}
                  />
                </div>
                <Tabs
                  onValueChange={(value) => setFilter(value as FilterMode)}
                  value={filter}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="configured">Configured</TabsTrigger>
                    <TabsTrigger value="needs-setup">Needs setup</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {groupedConnectors.length === 0 ? (
              <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                <p className="font-medium text-sm">No connectors match</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Try a different search or filter.
                </p>
              </div>
            ) : (
              groupedConnectors.map((group) => (
                <div className="space-y-3" key={group.category}>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-sm">{group.label}</h3>
                    <div className="h-px flex-1 bg-border" />
                    <Badge variant="outline">{group.connectors.length}</Badge>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {group.connectors.map((connector) => (
                      <ConnectorCard
                        connector={connector}
                        key={connector.slug}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </>
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
    </div>
  );
}
