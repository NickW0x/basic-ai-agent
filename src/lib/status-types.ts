// Shared status vocabulary for infrastructure and capability probes.

export type StatusLevel =
  | "live"
  | "configured"
  | "degraded"
  | "offline"
  | "unconfigured";

export type AggregateHealth = "healthy" | "degraded" | "offline";

export type StatusSection = "system" | "agents" | "connectors";

export type ToolStatus = "ready" | "limited" | "disabled";

export type AgentReadiness = "ready" | "limited";

export interface RedisStatus {
  provider: "upstash";
  mode: "redis" | "memory";
  status: StatusLevel;
  configured: boolean;
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

export interface EveHealthStatus {
  status: StatusLevel;
  ok?: boolean;
  workflowId?: string;
  runtimeStatus?: string;
  error?: string;
}

export interface CapabilityStatus {
  aiGateway: StatusLevel;
  webSearch: StatusLevel;
  model: string;
}

export interface SystemStatusSlice {
  redis: RedisStatus;
  eve: EveHealthStatus;
  capabilities: CapabilityStatus;
  health: AggregateHealth;
}

export interface ToolStatusEntry {
  name: string;
  status: ToolStatus;
  requiredEnv?: string;
}

export interface AgentStatusEntry {
  id: string;
  label: string;
  description: string;
  readiness: AgentReadiness;
  tools: ToolStatusEntry[];
  skills: string[];
}

export interface AgentsStatusSlice {
  source: "eve-info" | "filesystem-fallback";
  model: string;
  maxSubagentDepth: number;
  orchestrator: AgentStatusEntry;
  specialists: AgentStatusEntry[];
  health: AggregateHealth;
  manifestError?: string;
}

export interface ConnectorsStatusSlice {
  botUsername: string;
  connectors: Array<{
    slug: string;
    name: string;
    description: string;
    enabled: boolean;
    missingEnv: string[];
    webhookPath: string;
    docsUrl: string;
  }>;
  state: {
    mode: "redis" | "memory";
    configured: boolean;
  };
}

export interface StatusResponse {
  checkedAt: string;
  environment: "development" | "production";
  system?: SystemStatusSlice;
  agents?: AgentsStatusSlice;
  connectors?: ConnectorsStatusSlice;
}
