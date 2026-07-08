"use client";

import {
  readinessLabel,
  readinessStatus,
  StatusBadge,
} from "@/components/settings/status-badge";
import { AGENT_META_BY_ID } from "@/lib/agent-meta";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AgentStatusEntry } from "@/lib/status-types";

interface AgentCardProps {
  agent: AgentStatusEntry;
  isOrchestrator?: boolean;
}

export function AgentCard({ agent, isOrchestrator = false }: AgentCardProps) {
  const meta = AGENT_META_BY_ID[agent.id];
  const Icon = meta?.icon;
  const activeTools = agent.tools.filter((tool) => tool.status !== "disabled");

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition-colors",
        agent.readiness === "ready"
          ? "border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]"
          : "border-border/80",
      )}
    >
      <CardHeader className="gap-3 border-b border-border/60 px-4 py-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Icon className="size-5 text-muted-foreground" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{agent.label}</CardTitle>
              <StatusBadge
                label={readinessLabel(agent.readiness)}
                status={readinessStatus(agent.readiness)}
              />
              {isOrchestrator ? (
                <Badge variant="outline">Orchestrator</Badge>
              ) : null}
            </div>
            <CardDescription className="mt-1.5 leading-snug">
              {agent.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 py-4">
        <div>
          <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Active tools
          </p>
          {activeTools.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Delegates to specialists — root tools disabled by design.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeTools.map((tool) => (
                <Badge
                  className="gap-1"
                  key={tool.name}
                  variant={
                    tool.status === "ready"
                      ? "outline"
                      : tool.status === "limited"
                        ? "secondary"
                        : "secondary"
                  }
                >
                  {tool.name}
                  {tool.status === "limited" && tool.requiredEnv
                    ? ` · needs ${tool.requiredEnv}`
                    : null}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {agent.skills.length > 0 ? (
          <div>
            <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
