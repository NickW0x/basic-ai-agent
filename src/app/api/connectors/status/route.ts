import {
  getConnectorStatuses,
  getStateStorageStatus,
} from "../../../../../agent/lib/connectors";

// Thin re-export of the unified status API connectors slice.
export async function GET() {
  return Response.json({
    botUsername: process.env.BOT_USERNAME?.trim() || "opensocket-ai-agent",
    connectors: getConnectorStatuses(),
    state: getStateStorageStatus(),
  });
}
