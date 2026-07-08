"use client";

import { AGENT_META } from "@/lib/agent-meta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { GlobeIcon } from "lucide-react";

export type AgentScopeId = "global" | string;

interface AgentScopeSelectProps {
  value: AgentScopeId;
  onChange: (scopeId: AgentScopeId) => void;
  includeGlobal?: boolean;
}

export function AgentScopeSelect({
  value,
  onChange,
  includeGlobal = true,
}: AgentScopeSelectProps) {
  const scopes: { id: AgentScopeId; label: string; icon?: React.ComponentType<{ className?: string }> }[] =
    [];

  if (includeGlobal) {
    scopes.push({ id: "global", label: "Global default", icon: GlobeIcon });
  }

  for (const agent of AGENT_META) {
    scopes.push({
      id: agent.id,
      label: agent.label,
      icon: agent.icon,
    });
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max gap-2 pb-1">
        {scopes.map((scope) => {
          const Icon = scope.icon;
          const isActive = value === scope.id;
          return (
            <Button
              className={cn(
                "gap-2",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              )}
              key={scope.id}
              onClick={() => onChange(scope.id)}
              size="sm"
              type="button"
              variant={isActive ? "default" : "outline"}
            >
              {Icon ? <Icon className="size-3.5" /> : null}
              {scope.label}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
