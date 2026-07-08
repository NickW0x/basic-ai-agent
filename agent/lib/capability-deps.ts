// Maps tool names to required environment variables for full functionality.

export interface ToolCapabilityDep {
  envVar?: string;
  note?: string;
}

export const TOOL_CAPABILITY_DEPS: Record<string, ToolCapabilityDep> = {
  search_web: { envVar: "TAVILY_API_KEY" },
  fetch_page: {},
  get_weather: {},
  calculate: {},
  format_social_posts: {},
  read_project_file: {},
  grep_project: {},
  glob_project: {},
  run_typecheck: {},
};

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
