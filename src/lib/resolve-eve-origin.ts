import { headers } from "next/headers";
import { getEveDevHost } from "./eve-host";

// Resolves the eve HTTP origin for server-side health/info probes.
export async function resolveEveOrigin(): Promise<string> {
  const devHost = await getEveDevHost();
  if (devHost) {
    return devHost;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("host");

    if (host) {
      const protocol = host.includes("localhost") ? "http" : "https";
      return `${protocol}://${host}`;
    }
  } catch {
    // headers() unavailable outside a request context.
  }

  const port = process.env.PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}
