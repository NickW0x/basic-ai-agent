"use client";

import { Badge } from "@/components/ui/badge";
import { BotIcon, BrainCircuitIcon, CalculatorIcon, SearchIcon } from "lucide-react";

const AGENTS = [
  {
    id: "orchestrator",
    label: "Orchestrator",
    description: "Routes tasks and synthesizes replies",
    icon: BrainCircuitIcon,
    variant: "default" as const,
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Web search, news, and weather",
    icon: SearchIcon,
    variant: "secondary" as const,
  },
  {
    id: "analyst",
    label: "Analyst",
    description: "Math and calculations",
    icon: CalculatorIcon,
    variant: "secondary" as const,
  },
];

// Always-visible roster so the multi-agent architecture is obvious in the UI.
export function AgentRoster() {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <BotIcon className="size-4 text-primary" />
        <h2 className="font-medium text-sm">Multi-agent system</h2>
        <Badge className="ml-auto" variant="outline">
          eve + Chat SDK
        </Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;

          return (
            <div
              className="rounded-lg border bg-background/80 px-3 py-2.5"
              key={agent.id}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">{agent.label}</span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
                {agent.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
