const MAX_BYTES = 500_000;
const FETCH_TIMEOUT_MS = 15_000;

export interface FetchPageResult {
  url: string;
  title: string | null;
  text: string;
  truncated: boolean;
  error?: string;
}

// Strips HTML tags and collapses whitespace for readable plain text.
function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const withoutTags = withoutScripts.replace(/<[^>]+>/g, " ");

  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match?.[1]) {
    return null;
  }

  return htmlToText(match[1]) || null;
}

// Fetches a public URL and returns extractable plain text for agent tools.
export async function fetchPageText(url: string): Promise<FetchPageResult> {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return {
      url,
      title: null,
      text: "",
      truncated: false,
      error: "Invalid URL",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      url,
      title: null,
      text: "",
      truncated: false,
      error: "Only http and https URLs are supported",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "opensocket-ai-agent/1.0",
      },
    });

    if (!response.ok) {
      return {
        url,
        title: null,
        text: "",
        truncated: false,
        error: `HTTP ${response.status}`,
      };
    }

    const buffer = await response.arrayBuffer();
    const truncated = buffer.byteLength > MAX_BYTES;
    const slice = truncated
      ? buffer.slice(0, MAX_BYTES)
      : buffer;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(slice);

    return {
      url,
      title: extractTitle(html),
      text: htmlToText(html),
      truncated,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch URL";

    return {
      url,
      title: null,
      text: "",
      truncated: false,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}
