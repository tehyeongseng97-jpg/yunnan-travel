import { evaluateSource, trustRank, TrustResult } from "./sourceTrust";
import { calculateTotalCost, compareCostOptions, CostBreakdown } from "./costCalculator";

export interface SearchAdapter {
  search(query: string): Promise<RawSearchResult[]>;
}

export interface RawSearchResult {
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string | null;
}

export interface PriceCandidate {
  title: string;
  price: number;
  includes: string[];
  sourceUrl: string;
  sourceTrust: TrustResult;
  checkedAt: string;
}

export interface ComparisonResult {
  status: "ok" | "insufficient_data";
  query: string;
  candidates: PriceCandidate[];
  recommendation?: {
    title: string;
    reasoning: string;
    confidence: "high" | "medium" | "low";
    purchaseUrl: string;
    checkedAt: string;
  };
  message?: string;
}

function extractPricesFromSnippet(snippet: string): number[] {
  const matches = snippet.match(/¥\s?(\d{2,4})/g) || [];
  return matches.map((m) => parseInt(m.replace(/[¥\s]/g, ""), 10));
}

export async function comparePlaceTickets(
  placeName: string,
  adapter: SearchAdapter,
  partySize = 2
): Promise<ComparisonResult> {
  const query = `${placeName} 门票 官方 携程 价格`;
  const raw = await adapter.search(query);

  const candidates: PriceCandidate[] = [];

  for (const r of raw) {
    const trust = evaluateSource({ url: r.url, pageText: r.snippet, publishedAt: r.publishedAt });
    if (!trust.usableAsPriceSource) continue;

    const prices = extractPricesFromSnippet(r.snippet);
    for (const price of prices) {
      candidates.push({
        title: r.title,
        price,
        includes: [],
        sourceUrl: r.url,
        sourceTrust: trust,
        checkedAt: new Date().toISOString(),
      });
    }
  }

  if (candidates.length === 0) {
    return {
      status: "insufficient_data",
      query,
      candidates: [],
      message: "我暂时无法确认这个信息，没有找到可信来源的实时价格，请稍后重试或直接前往官方渠道核实。",
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
    query,
    candidates,
    recommendation: {
      title: best.title,
      reasoning: `${best.sourceTrust.reason}，且综合价格在可信候选中最优（¥${best.price}）。人数：${partySize}人。`,
      confidence: best.sourceTrust.level === "official" ? "high" : "medium",
      purchaseUrl: best.sourceUrl,
      checkedAt: best.checkedAt,
    },
  };
}

export function compareTransportOptions(
  options: {
    mode: string;
    basePrice: number;
    connectionCost?: number;
    isPerPersonPrice?: boolean;
    durationMinutes: number;
    comfortScore: number;
  }[],
  partySize: number
) {
  const breakdowns: CostBreakdown[] = options.map((o) =>
    calculateTotalCost({
      label: o.mode,
      basePrice: o.basePrice,
      connectionCost: o.connectionCost ?? 0,
      partySize,
      isPerPersonPrice: o.isPerPersonPrice ?? true,
    })
  );

  const { cheapest, ranked } = compareCostOptions(breakdowns);

  return {
    ranked: ranked.map((r, i) => ({
      ...r,
      durationMinutes: options[i].durationMinutes,
      comfortScore: options[i].comfortScore,
    })),
    recommended: cheapest.label,
  };
}

export async function compareTransportRealSearch(
  from: string,
  to: string,
  partySize: number,
  adapter: SearchAdapter
) {
  const modes = [
    { mode: "大巴", query: `${from}到${to} 大巴 票价`, isPerPersonPrice: true },
    { mode: "拼车", query: `${from}到${to} 拼车 价格`, isPerPersonPrice: true },
    { mode: "包车", query: `${from}到${to} 包车 一天多少钱`, isPerPersonPrice: false },
  ];

  const results: {
    mode: string;
    candidates: PriceCandidate[];
    bestPrice: number | null;
  }[] = [];

  for (const m of modes) {
    const raw = await adapter.search(m.query);
    const candidates: PriceCandidate[] = [];

    for (const r of raw) {
      const trust = evaluateSource({ url: r.url, pageText: r.snippet, publishedAt: r.publishedAt });
      if (!trust.usableAsPriceSource) continue;

      const prices = extractPricesFromSnippet(r.snippet);
      for (const price of prices) {
        candidates.push({
          title: r.title,
          price,
          includes: [],
          sourceUrl: r.url,
          sourceTrust: trust,
          checkedAt: new Date().toISOString(),
        });
      }
    }

    candidates.sort((a, b) => trustRank(a.sourceTrust.level) - trustRank(b.sourceTrust.level) || a.price - b.price);

    results.push({
      mode: m.mode,
      candidates,
      bestPrice: candidates[0]?.price ?? null,
    });
  }

  const usable = results.filter((r) => r.bestPrice !== null);

  if (usable.length === 0) {
    return {
      status: "insufficient_data" as const,
      message: "我暂时无法确认这几种交通方式的实时价格，建议直接查携程或当地客运站官方渠道核实。",
    };
  }

  const breakdowns = usable.map((r) => {
    const modeConfig = modes.find((m) => m.mode === r.mode)!;
    return calculateTotalCost({
      label: r.mode,
      basePrice: r.bestPrice!,
      partySize,
      isPerPersonPrice: modeConfig.isPerPersonPrice,
    });
  });

  const { cheapest, ranked } = compareCostOptions(breakdowns);

  return {
    status: "ok" as const,
    recommended: cheapest.label,
    ranked,
    detail: usable,
  };
}
