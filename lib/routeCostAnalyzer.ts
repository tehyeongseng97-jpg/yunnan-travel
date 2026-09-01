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
  taxiTotal: number | null;
  taxiLegs: RouteLegResult[];
  charterTotal: number | null;
  charterPerPerson: number | null;
  recommendation: string;
  hasLuggage: boolean;
  message?: string;
}

/**
 * 分析一天多站点行程：打车分段加总 vs 整天包车，哪个划算。
 * hasLuggage=true 时（当天要换酒店带行李跑一整天），
 * 即使打车总价略低，也会在结论里提醒包车更省心。
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
      taxiLegs: [],
      charterTotal: null,
      charterPerPerson: null,
      recommendation: "",
      hasLuggage,
      message: "至少需要2个地点才能分析路线成本。",
    };
  }

  const taxiLegs: RouteLegResult[] = [];
  let taxiTotal = 0;
  let taxiMissing = false;

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const result = await searchBestPrice(`${from}到${to} 打车 价格`, adapter);
    if (result) {
      taxiLegs.push({ from, to, price: result.price, sourceUrl: result.sourceUrl });
      taxiTotal += result.price;
    } else {
      taxiLegs.push({ from, to, price: null, sourceUrl: null });
      taxiMissing = true;
    }
  }

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const charterResult = await searchBestPrice(`${origin}到${destination} 包车 一天 价格`, adapter);

  const charterTotal = charterResult?.price ?? null;
  const charterPerPerson = charterTotal ? Math.round(charterTotal / partySize) : null;
  const taxiPerPerson = taxiMissing ? null : Math.round(taxiTotal / partySize);

  let recommendation = "";
  if (taxiPerPerson !== null && charterPerPerson !== null) {
    const diff = taxiPerPerson - charterPerPerson;
    if (hasLuggage) {
      recommendation =
        diff > 0
          ? `包车人均约¥${charterPerPerson}，比打车分段（人均约¥${taxiPerPerson}）便宜¥${diff}，且今天要带行李换酒店，全程一辆车更省心，推荐包车。`
          : `打车分段人均约¥${taxiPerPerson}，比包车（人均约¥${charterPerPerson}）便宜¥${-diff}，但今天要带行李换酒店，多次上下车不方便，仍建议考虑包车。`;
    } else {
      recommendation =
        diff > 0
          ? `包车人均约¥${charterPerPerson}，比打车分段（人均约¥${taxiPerPerson}）便宜¥${diff}，推荐包车。`
          : `打车分段人均约¥${taxiPerPerson}，比包车（人均约¥${charterPerPerson}）便宜¥${-diff}，且路线灵活，推荐打车分段。`;
    }
  } else if (taxiPerPerson !== null) {
    recommendation = `只找到打车分段价格（人均约¥${taxiPerPerson}），未找到可信的包车价格，建议直接联系当地包车公司询价对比。`;
  } else if (charterPerPerson !== null) {
    recommendation = `只找到包车价格（人均约¥${charterPerPerson}），部分打车分段价格未找到，建议以包车为主。`;
  } else {
    recommendation = "打车和包车价格均未找到可信数据，建议出发前直接询价。";
  }

  return {
    status: "ok",
    stops,
    taxiTotal: taxiMissing ? null : taxiTotal,
    taxiLegs,
    charterTotal,
    charterPerPerson,
    recommendation,
    hasLuggage,
  };
}
