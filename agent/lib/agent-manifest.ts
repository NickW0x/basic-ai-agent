import type {
  AgentReadiness,
  AgentsStatusSlice,
  ToolStatus,
  ToolStatusEntry,
} from "../../src/lib/status-types";
import { AGENT_META_BY_ID } from "../../src/lib/agent-meta";
import {
  ORCHESTRATOR_SKILLS,
  SUBAGENT_ACTIVE_TOOLS,
  SUBAGENT_SKILLS,
  TOOL_CAPABILITY_DEPS,
} from "./capability-deps";
import { getEnvStatus } from "./env-helpers";

const PROBE_TIMEOUT_MS = 5000;

interface EveInfoSubagent {
  name?: string;
  description?: string;
  tools?: Array<{ name?: string; enabled?: boolean } | string>;
  skills?: Array<{ name?: string } | string>;
}

interface EveInfoResponse {
  model?: string;
  limits?: { maxSubagentDepth?: number };
  subagents?: EveInfoSubagent[];
  skills?: Array<{ name?: string } | string>;
}

function toolName(tool: { name?: string } | string): string {
  return typeof tool === "string" ? tool : (tool.name ?? "unknown");
}

function skillName(skill: { name?: string } | string): string {
  return typeof skill === "string" ? skill : (skill.name ?? "unknown");
}

function resolveToolStatus(toolName: string, enabled = true): ToolStatusEntry {
  if (!enabled) {
    return { name: toolName, status: "disabled" };
  }

  const dep = TOOL_CAPABILITY_DEPS[toolName];

  if (!dep?.envVar) {
    return { name: toolName, status: "ready" };
  }

  const envStatus = getEnvStatus(dep.envVar);

  if (envStatus === "configured") {
    return { name: toolName, status: "ready" };
  }

  return {
    name: toolName,
    status: "limited",
    requiredEnv: dep.envVar,
  };
}

function agentReadiness(tools: ToolStatusEntry[]): AgentReadiness {
  const activeTools = tools.filter((tool) => tool.status !== "disabled");

  if (activeTools.some((tool) => tool.status === "limited")) {
    return "limited";
  }

  return "ready";
}

function buildAgentEntry(
  id: string,
  description: string,
  tools: ToolStatusEntry[],
  skills: string[],
): AgentsStatusSlice["orchestrator"] {
  const meta = AGENT_META_BY_ID[id];

  return {
    id,
    label: meta?.label ?? id,
    description: description || meta?.description || "",
    readiness: agentReadiness(tools),
    tools,
    skills,
  };
}

function buildFilesystemManifest(): AgentsStatusSlice {
  const model = process.env.AI_MODEL ?? "anthropic/claude-sonnet-4";

  const orchestrator = buildAgentEntry(
    "orchestrator",
    AGENT_META_BY_ID.orchestrator?.description ?? "",
    [{ name: "agent", status: "disabled" }],
    ORCHESTRATOR_SKILLS,
  );

  const specialists = Object.entries(SUBAGENT_ACTIVE_TOOLS).map(
    ([id, toolNames]) => {
      const tools = toolNames.map((name) => resolveToolStatus(name));
      const skills = SUBAGENT_SKILLS[id] ?? [];

      return buildAgentEntry(
        id,
        AGENT_META_BY_ID[id]?.description ?? "",
        tools,
        skills,
      );
    },
  );

  const anyLimited = specialists.some((agent) => agent.readiness === "limited");

  return {
    source: "filesystem-fallback",
    model,
    maxSubagentDepth: 2,
    orchestrator,
    specialists,
    health: anyLimited ? "degraded" : "healthy",
    manifestError: "Using filesystem fallback manifest",
  };
}

function buildFromEveInfo(info: EveInfoResponse): AgentsStatusSlice {
  const model = info.model ?? process.env.AI_MODEL ?? "anthropic/claude-sonnet-4";
  const maxSubagentDepth = info.limits?.maxSubagentDepth ?? 2;

  const orchestratorSkills = (info.skills ?? [])
    .map(skillName)
    .filter(Boolean);

  const orchestrator = buildAgentEntry(
    "orchestrator",
    AGENT_META_BY_ID.orchestrator?.description ?? "",
    [{ name: "agent", status: "disabled" }],
    orchestratorSkills.length > 0 ? orchestratorSkills : ORCHESTRATOR_SKILLS,
  );

  const specialists = (info.subagents ?? []).map((subagent) => {
    const id = subagent.name ?? "unknown";
    const fallbackTools = SUBAGENT_ACTIVE_TOOLS[id] ?? [];
    const toolsFromInfo = subagent.tools?.map((tool) => {
      const name = toolName(tool);
      const enabled =
        typeof tool === "object" && "enabled" in tool
          ? tool.enabled !== false
          : true;
      return resolveToolStatus(name, enabled);
    });

    const tools =
      toolsFromInfo && toolsFromInfo.length > 0
        ? toolsFromInfo
        : fallbackTools.map((name) => resolveToolStatus(name));

    const skillsFromInfo = subagent.skills?.map(skillName).filter(Boolean) ?? [];
    const skills =
      skillsFromInfo.length > 0 ? skillsFromInfo : (SUBAGENT_SKILLS[id] ?? []);

    return buildAgentEntry(
      id,
      subagent.description ?? AGENT_META_BY_ID[id]?.description ?? "",
      tools,
      skills,
    );
  });

  // Ensure all known specialists appear even if /info omits one.
  for (const [id, toolNames] of Object.entries(SUBAGENT_ACTIVE_TOOLS)) {
    if (!specialists.some((agent) => agent.id === id)) {
      specialists.push(
        buildAgentEntry(
          id,
          AGENT_META_BY_ID[id]?.description ?? "",
          toolNames.map((name) => resolveToolStatus(name)),
          SUBAGENT_SKILLS[id] ?? [],
        ),
      );
    }
  }

  const anyLimited = specialists.some((agent) => agent.readiness === "limited");

  return {
    source: "eve-info",
    model,
    maxSubagentDepth,
    orchestrator,
    specialists,
    health: anyLimited ? "degraded" : "healthy",
  };
}

export async function fetchEveInfo(
  origin: string,
): Promise<{ info: EveInfoResponse | null; error?: string; authRequired?: boolean }> {
  try {
    const response = await fetch(`${origin}/eve/v1/info`, {
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      return {
        info: null,
        authRequired: true,
        error: "Manifest requires deployment auth",
      };
    }

    if (!response.ok) {
      return {
        info: null,
        error: `Info endpoint returned ${response.status}`,
      };
    }

    return { info: (await response.json()) as EveInfoResponse };
  } catch (error) {
    return {
      info: null,
      error: error instanceof Error ? error.message : "Failed to fetch eve info",
    };
  }
}

export async function getAgentsStatus(): Promise<AgentsStatusSlice> {
  const { resolveEveOrigin } = await import("../../src/lib/resolve-eve-origin");
  const origin = await resolveEveOrigin();
  const result = await fetchEveInfo(origin);

  if (!result.info) {
    const fallback = buildFilesystemManifest();
    return {
      ...fallback,
      manifestError: result.error,
    };
  }

  return buildFromEveInfo(result.info);
}
