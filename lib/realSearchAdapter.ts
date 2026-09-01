import { SearchAdapter, RawSearchResult } from "./searchAgent";

export const realSearchAdapter: SearchAdapter = {
  async search(query: string): Promise<RawSearchResult[]> {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, gl: "cn", hl: "zh-cn" }),
    });
    const data = await res.json();
    return (data.organic || []).map((item: any) => ({
      url: item.link,
      title: item.title,
      snippet: item.snippet,
      publishedAt: item.date || null,
    }));
  },
};
