// Maps tool names to required environment variables for full functionality.

import { isEnvConfigured } from "./env-helpers";

export interface ToolCapabilityDep {
  envVar?: string;
  envVars?: string[];
  requiredEnvLabel?: string;
  note?: string;
}

export const TOOL_CAPABILITY_DEPS: Record<string, ToolCapabilityDep> = {
  search_web: {
    envVars: ["XAI_API_KEY", "TAVILY_API_KEY"],
    requiredEnvLabel: "XAI_API_KEY or TAVILY_API_KEY",
  },
  fetch_page: {},
  get_weather: {},
  calculate: {},
  format_social_posts: {},
  read_project_file: {},
  grep_project: {},
  glob_project: {},
  run_typecheck: {},
};

// True when a tool's env dependency (single or any-of) is satisfied.
export function isToolCapabilityReady(dep?: ToolCapabilityDep): boolean {
  if (!dep) {
    return true;
  }

  if (dep.envVars?.length) {
    return dep.envVars.some((name) => isEnvConfigured(name));
  }

  if (dep.envVar) {
    return isEnvConfigured(dep.envVar);
  }

  return true;
}

// Active tools per subagent from the filesystem (non-disabled tools).
export const SUBAGENT_ACTIVE_TOOLS: Record<string, string[]> = {
  researcher: ["search_web", "fetch_page", "get_weather"],
  analyst: ["calculate"],
  summarizer: ["fetch_page"],
  coder: ["read_project_file", "grep_project", "glob_project", "run_typecheck"],
  marketer: ["search_web", "fetch_page", "format_social_posts"],
};

export const ORCHESTRATOR_SKILLS = ["chat-reply-format"];

export const SUBAGENT_SKILLS: Record<string, string[]> = {
  marketer: ["copy-frameworks"],
};
