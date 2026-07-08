export interface TavilySearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface TavilySearchResponse {
  query: string;
  answer: string | null;
  results: TavilySearchResult[];
  message?: string;
}

// Shared Tavily web search used by the researcher subagent.
export async function searchTavily(query: string): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return {
      query,
      answer: null,
      results: [],
      message:
        "Web search is not configured. Add TAVILY_API_KEY to your environment to enable search.",
    };
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 5,
      include_answer: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    answer?: string;
    results?: Array<{
      title: string;
      url: string;
      content: string;
    }>;
  };

  return {
    query,
    answer: data.answer ?? null,
    results: (data.results ?? []).map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
    })),
  };
}
