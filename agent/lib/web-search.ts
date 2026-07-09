import { isEnvConfigured } from "./env-helpers";
import { searchTavily } from "./tavily";

const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";
const DEFAULT_XAI_SEARCH_MODEL = "grok-4.20-non-reasoning";
const SEARCH_TIMEOUT_MS = 45_000;

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  query: string;
  answer: string | null;
  results: WebSearchResult[];
  message?: string;
  provider?: "xai" | "tavily";
}

interface XaiOutputPart {
  type?: string;
  text?: string;
}

interface XaiOutputItem {
  type?: string;
  content?: XaiOutputPart[];
}

interface XaiCitation {
  url?: string;
  title?: string;
  snippet?: string;
  text?: string;
}

interface XaiResponsesPayload {
  output_text?: string;
  output?: XaiOutputItem[];
  citations?: Array<string | XaiCitation>;
}

const UNCONFIGURED_MESSAGE =
  "Web search is not configured. Add XAI_API_KEY (preferred) or optional TAVILY_API_KEY to your environment.";

// Primary xAI web_search via Responses API; Tavily fallback when configured.
export async function searchWeb(query: string): Promise<WebSearchResponse> {
  const xaiResult = await searchXai(query);

  if (xaiResult) {
    return xaiResult;
  }

  if (isEnvConfigured("TAVILY_API_KEY")) {
    const tavilyResult = await searchTavily(query);
    return { ...tavilyResult, provider: "tavily" };
  }

  return {
    query,
    answer: null,
    results: [],
    message: UNCONFIGURED_MESSAGE,
  };
}

async function searchXai(query: string): Promise<WebSearchResponse | null> {
  if (!isEnvConfigured("XAI_API_KEY")) {
    return null;
  }

  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model =
    process.env.XAI_SEARCH_MODEL?.trim() || DEFAULT_XAI_SEARCH_MODEL;

  try {
    const response = await fetch(XAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: `Search the web and give a concise, factual answer for: ${query}`,
        tools: [{ type: "web_search" }],
      }),
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as XaiResponsesPayload;
    const parsed = parseXaiResponses(data, query);

    if (!parsed) {
      return null;
    }

    return { ...parsed, provider: "xai" };
  } catch {
    return null;
  }
}

function parseXaiResponses(
  data: XaiResponsesPayload,
  query: string,
): Omit<WebSearchResponse, "provider"> | null {
  const answer = extractOutputText(data);
  const results = extractCitations(data);

  if (!answer && results.length === 0) {
    return null;
  }

  return {
    query,
    answer,
    results,
  };
}

function extractOutputText(data: XaiResponsesPayload): string | null {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks: string[] = [];

  for (const item of data.output ?? []) {
    if (item.type !== "message") {
      continue;
    }

    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text?.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }

  if (chunks.length === 0) {
    return null;
  }

  return chunks.join("\n");
}

function extractCitations(data: XaiResponsesPayload): WebSearchResult[] {
  const citations = data.citations ?? [];
  const results: WebSearchResult[] = [];

  for (const citation of citations) {
    if (typeof citation === "string") {
      const url = citation.trim();
      if (!url) {
        continue;
      }

      results.push({
        title: url,
        url,
        snippet: "",
      });
      continue;
    }

    const url = citation.url?.trim();
    if (!url) {
      continue;
    }

    results.push({
      title: citation.title?.trim() || url,
      url,
      snippet: citation.snippet?.trim() || citation.text?.trim() || "",
    });
  }

  return results;
}
