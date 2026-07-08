import {
  getConnectorStatuses,
  getStateStorageStatus,
} from "../../../../agent/lib/connectors";
import { getAgentsStatus } from "../../../../agent/lib/agent-manifest";
import { getSystemStatus } from "../../../../agent/lib/system-status";
import type { StatusResponse, StatusSection } from "@/lib/status-types";

const VALID_SECTIONS: StatusSection[] = ["system", "agents", "connectors"];

function parseSections(searchParams: URLSearchParams): StatusSection[] {
  const raw = searchParams.get("sections");

  if (!raw) {
    return ["system", "agents", "connectors"];
  }

  const requested = raw
    .split(",")
    .map((section) => section.trim())
    .filter((section): section is StatusSection =>
      VALID_SECTIONS.includes(section as StatusSection),
    );

  return requested.length > 0 ? requested : ["system"];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sections = parseSections(searchParams);
  const checkedAt = new Date().toISOString();
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "development";

  const response: StatusResponse = {
    checkedAt,
    environment,
  };

  const tasks: Promise<void>[] = [];

  if (sections.includes("system")) {
    tasks.push(
      getSystemStatus().then((system) => {
        response.system = system;
      }),
    );
  }

  if (sections.includes("agents")) {
    tasks.push(
      getAgentsStatus().then((agents) => {
        response.agents = agents;
      }),
    );
  }

  if (sections.includes("connectors")) {
    tasks.push(
      Promise.resolve().then(() => {
        response.connectors = {
          botUsername: process.env.BOT_USERNAME?.trim() || "basic-ai-agent",
          connectors: getConnectorStatuses(),
          state: getStateStorageStatus(),
        };
      }),
    );
  }

  await Promise.all(tasks);

  return Response.json(response);
}
