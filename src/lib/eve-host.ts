import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Resolves the local eve dev server origin for browser clients when withEve rewrites lag.
export async function getEveDevHost(): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    return "";
  }

  const envHost = process.env.EVE_BASE_URL?.trim();
  if (envHost) {
    return envHost.replace(/\/+$/, "");
  }

  try {
    const registryPath = join(process.cwd(), ".eve", "next-dev-server.json");
    const registry = JSON.parse(await readFile(registryPath, "utf8")) as {
      origin?: string;
    };

    return registry.origin?.replace(/\/+$/, "") ?? "";
  } catch {
    return "";
  }
}
