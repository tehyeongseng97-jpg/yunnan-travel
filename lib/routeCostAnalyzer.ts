import { evaluateSource, trustRank } from "./sourceTrust";
import { SearchAdapter } from "./searchAgent";

function extractPrice(snippet: string): number | null {
  const matches = snippet.match(/¥\s?(\d{2,4})/g);
  if (!matches || matches.length === 0) return null;
  const nums = matches.map((m) => parseInt(m.replace(/[¥\s]/g, ""), 10));
  return Math.min(...nums);
}

async function searchBestPrice(
  query: string,
  adapter: SearchAdapter
): Promise<{ price: number; sourceUrl: string; trustLevel: string } | null> {
  const raw = await adapter.search(query);
  const candidates: { price: number; sourceUrl: string; trustLevel: string }[] = [];

  for (const r of raw) {
    const trust = evaluateSource({ url: r.url, pageText: r.snippet, publishedAt: r.publishedAt });
    if (!trust.usableAsPriceSource) continue;
    const price = extractPrice(r.snippet);
    if (price) candidates.push({ price, sourceUrl: r.url, trustLevel: trust.level });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => trustRank(a.trustLevel as any) - trustRank(b.trustLevel as any) || a.price - b.price);
  return candidates[0];
}

export interface RouteLegResult {
  from: string;
  to: string;
  price: number | null;
  sourceUrl: string | null;
}

export interface RouteCostAnalysis {
  status: "ok" | "insufficient_data";
  stops: string[];
  taxiTotal: number | null; // 仅在所有分段都有数据时才是完整总计
  taxiPartialTotal: number | null; // 已找到分段的部分加总（无论是否完整）
  taxiFoundCount: number;
  taxiLegCount: number;
  taxiLegs: RouteLegResult[];
  charterTotal: number | null;
  charterPerPerson: number | null;
  recommendation: string;
  hasLuggage: boolean;
  message?: string;
}

/**
 * 分析一天多站点行程：打车分段加总 vs 整天包车，哪个划算。
 * 关键修复：只要有部分分段找到价格，就展示部分数据，
 * 不再因为某一段缺数据就把整体判定为"完全无数据"。
 */
export async function analyzeMultiStopDay(
  stops: string[],
  partySize: number,
  hasLuggage: boolean,
  adapter: SearchAdapter
): Promise<RouteCostAnalysis> {
  if (stops.length < 2) {
    return {
      status: "insufficient_data",
      stops,
      taxiTotal: null,
      taxiPartialTotal: null,
      taxiFoundCount: 0,
      taxiLegCount: 0,
      taxiLegs: [],
      charterTotal: null,
      charterPerPerson: null,
      recommendation: "",
      hasLuggage,
      message: "至少需要2个地点才能分析路线成本。",
    };
  }

  const taxiLegs: RouteLegResult[] = [];
  let taxiPartialTotal = 0;
  let foundCount = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const result = await searchBestPrice(`${from}到${to} 打车 价格`, adapter);
    if (result) {
      taxiLegs.push({ from, to, price: result.price, sourceUrl: result.sourceUrl });
      taxiPartialTotal += result.price;
      foundCount++;
    } else {
      taxiLegs.push({ from, to, price: null, sourceUrl: null });
    }
  }

  const legCount = stops.length - 1;
  const taxiComplete = foundCount === legCount;
  const taxiTotal = taxiComplete ? taxiPartialTotal : null;

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const charterResult = await searchBestPrice(`${origin}到${destination} 包车 一天 价格`, adapter);

  const charterTotal = charterResult?.price ?? null;
  const charterPerPerson = charterTotal ? Math.round(charterTotal / partySize) : null;

  let recommendation = "";

  if (foundCount === 0 && charterTotal === null) {
    recommendation = "打车和包车价格均未找到可信数据，建议出发前直接询价。";
  } else {
    const parts: string[] = [];

    if (foundCount > 0) {
      const taxiPerPersonPartial = Math.round(taxiPartialTotal / partySize);
      if (taxiComplete) {
        parts.push(`打车分段人均约¥${taxiPerPersonPartial}（${legCount}段全部找到价格）`);
      } else {
        parts.push(
          `打车分段中${foundCount}/${legCount}段找到参考价，已找到部分合计约¥${taxiPartialTotal}（人均约¥${taxiPerPersonPartial}，未包含缺失段，实际会更高）`
        );
      }
    } else {
      parts.push("打车分段价格均未找到");
    }

    if (charterPerPerson !== null) {
      parts.push(`整天包车约¥${charterTotal}（人均约¥${charterPerPerson}）`);
    } else {
      parts.push("包车价格未找到");
    }

    recommendation = parts.join("；") + "。";

    if (hasLuggage) {
      recommendation += " 今天要带行李换酒店，多次上下车不方便，即使打车总价可能更低，仍建议优先考虑包车，全程一辆车更省心。";
    } else if (taxiComplete && charterPerPerson !== null) {
      const diff = Math.round(taxiPartialTotal / partySize) - charterPerPerson;
      if (diff > 0) {
        recommendation += ` 综合看包车更划算，人均省约¥${diff}。`;
      } else if (diff < 0) {
        recommendation += ` 综合看打车分段更划算，人均省约¥${-diff}，且路线更灵活。`;
      }
    }
  }

  return {
    status: "ok",
    stops,
    taxiTotal,
    taxiPartialTotal: foundCount > 0 ? taxiPartialTotal : null,
    taxiFoundCount: foundCount,
    taxiLegCount: legCount,
    taxiLegs,
    charterTotal,
    charterPerPerson,
    recommendation,
    hasLuggage,
  };
}
