import { headers } from "next/headers";
import { getEveDevHost } from "./eve-host";

// Strip trailing slashes so origin comparisons stay consistent.
function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

// Resolves the eve HTTP origin for server-side health/info probes.
export async function resolveEveOrigin(): Promise<string> {
  const devHost = await getEveDevHost();
  if (devHost) {
    return normalizeOrigin(devHost);
  }

  // Prefer the incoming Host so preview/custom domains resolve correctly per request.
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

  // Non-request contexts (cron, scripts): use the configured canonical URL.
  const appUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return normalizeOrigin(appUrl);
  }

  // Last resort: Vercel deployment hostname.
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${normalizeOrigin(vercelUrl)}`;
  }

  const port = process.env.PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}
