import type { LucideIcon } from "lucide-react";
import {
  BrainCircuitIcon,
  CalculatorIcon,
  Code2Icon,
  FileTextIcon,
  MegaphoneIcon,
  SearchIcon,
} from "lucide-react";

export interface AgentMetaEntry {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  variant: "default" | "secondary";
}

export const AGENT_META: AgentMetaEntry[] = [
  {
    id: "orchestrator",
    label: "Orchestrator",
    description: "Routes tasks and synthesizes replies",
    icon: BrainCircuitIcon,
    variant: "default",
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Web search, URLs, and weather",
    icon: SearchIcon,
    variant: "secondary",
  },
  {
    id: "analyst",
    label: "Analyst",
    description: "Math and calculations",
    icon: CalculatorIcon,
    variant: "secondary",
  },
  {
    id: "summarizer",
    label: "Summarizer",
    description: "TL;DR and long-text condensation",
    icon: FileTextIcon,
    variant: "secondary",
  },
  {
    id: "coder",
    label: "Coder",
    description: "Repo inspection and code help",
    icon: Code2Icon,
    variant: "secondary",
  },
  {
    id: "marketer",
    label: "Marketer",
    description: "Copy, social posts, campaigns",
    icon: MegaphoneIcon,
    variant: "secondary",
  },
];

export const AGENT_META_BY_ID = Object.fromEntries(
  AGENT_META.map((agent) => [agent.id, agent]),
) as Record<string, AgentMetaEntry>;

export const SPECIALIST_META = AGENT_META.filter(
  (agent) => agent.id !== "orchestrator",
);

export const SPECIALIST_SUBTITLE = SPECIALIST_META.map((a) => a.label).join(
  " · ",
);
