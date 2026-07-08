"use client";

import { Badge } from "@/components/ui/badge";
import type { HandleMessageStreamEvent } from "eve/client";
import { BotIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useMemo } from "react";

interface SubagentActivityProps {
  events: readonly HandleMessageStreamEvent[];
}

interface SubagentRun {
  callId: string;
  name: string;
  status: "running" | "completed";
}

// Surfaces orchestrator delegation to specialist subagents from the eve event stream.
export function SubagentActivity({ events }: SubagentActivityProps) {
  const runs = useMemo(() => {
    const map = new Map<string, SubagentRun>();

    for (const event of events) {
      if (event.type === "subagent.called") {
        map.set(event.data.callId, {
          callId: event.data.callId,
          name: event.data.name || event.data.toolName,
          status: "running",
        });
      }

      if (event.type === "subagent.completed") {
        const existing = map.get(event.data.callId);
        if (existing) {
          map.set(event.data.callId, {
            ...existing,
            status: "completed",
          });
        } else {
          map.set(event.data.callId, {
            callId: event.data.callId,
            name: event.data.subagentName,
            status: "completed",
          });
        }
      }
    }

    return [...map.values()];
  }, [events]);

  if (runs.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Specialist activity
      </p>
      <div className="flex flex-wrap gap-2">
        {runs.map((run) => (
          <Badge
            className="gap-1.5 px-2.5 py-1"
            key={run.callId}
            variant={run.status === "completed" ? "secondary" : "outline"}
          >
            {run.status === "completed" ? (
              <CheckCircle2Icon className="size-3.5" />
            ) : (
              <Loader2Icon className="size-3.5 animate-spin" />
            )}
            <BotIcon className="size-3.5" />
            <span>{run.name}</span>
          </Badge>
        ))}
      </div>
    </section>
  );
}
