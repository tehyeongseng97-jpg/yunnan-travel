import { evaluateSource, trustRank, TrustResult } from "./sourceTrust";
import { SearchAdapter, RawSearchResult } from "./searchAgent";

export interface HotelCandidate {
  title: string;
  price: number;
  sourceUrl: string;
  sourceTrust: TrustResult;
  checkedAt: string;
}

export interface HotelComparisonResult {
  status: "ok" | "insufficient_data";
  location: string;
  candidates: HotelCandidate[];
  recommendation?: {
    title: string;
    reasoning: string;
    purchaseUrl: string;
    checkedAt: string;
  };
  message?: string;
}

function extractPricesFromSnippet(snippet: string): number[] {
  const matches = snippet.match(/¥\s?(\d{2,5})/g) || [];
  return matches
    .map((m) => parseInt(m.replace(/[¥\s]/g, ""), 10))
    .filter((p) => p >= 50 && p <= 5000); // 过滤掉明显不是房价的数字（如年份、里程）
}

/**
 * 酒店比价：复用门票比价的信任过滤逻辑。
 * 查询词针对"区域+日期范围+价格"，而不是具体酒店名，
 * 因为用户通常先想"住哪个区域"，而不是已经锁定某家酒店。
 */
export async function compareHotels(
  location: string,
  adapter: SearchAdapter,
  checkIn?: string,
  checkOut?: string
): Promise<HotelComparisonResult> {
  const dateHint = checkIn && checkOut ? ` ${checkIn}至${checkOut}` : "";
  const query = `${location} 酒店 民宿 价格${dateHint} 携程`;
  const raw: RawSearchResult[] = await adapter.search(query);

  const candidates: HotelCandidate[] = [];

  for (const r of raw) {
    const trust = evaluateSource({ url: r.url, pageText: r.snippet, publishedAt: r.publishedAt });
    if (!trust.usableAsPriceSource) continue;

    const prices = extractPricesFromSnippet(r.snippet);
    for (const price of prices) {
      candidates.push({
        title: r.title,
        price,
        sourceUrl: r.url,
        sourceTrust: trust,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  if (candidates.length === 0) {
    return {
      status: "insufficient_data",
      location,
      candidates: [],
      message: "暂时无法确认这个区域的实时酒店价格，建议直接在携程/美团查看，或搜索更具体的区域名称（如「大理古城南门附近酒店」）。",
    };
  }

  candidates.sort((a, b) => {
    const t = trustRank(a.sourceTrust.level) - trustRank(b.sourceTrust.level);
    if (t !== 0) return t;
    return a.price - b.price;
  });

  const best = candidates[0];

  return {
    status: "ok",
    location,
    candidates,
    recommendation: {
      title: best.title,
      reasoning: `${best.sourceTrust.reason}，价格约¥${best.price}/晚。实际价格会随预订日期临近而波动，建议出发前1-2周再确认。`,
      purchaseUrl: best.sourceUrl,
      checkedAt: best.checkedAt,
    },
  };
}
