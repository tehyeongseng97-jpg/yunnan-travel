/**
 * Itinerary Parser
 * ------------------------------------------------------------
 * 从纯文本行程(📅日期｜标题 / 🏨住宿 / 💰价格 / ⚠️提醒 格式)
 * 解析出结构化的每日行程数据。规则匹配，不依赖 LLM，免费。
 */

export interface ParsedDay {
  date: string; // "11/02"
  title: string;
  hotel: string | null;
  prices: string[]; // 原始价格片段，如 "¥60–100/车"
  warnings: string[]; // 含 ⚠️ 或 "预约"/"提前" 的提醒
  transportModes: string[]; // 出现过的交通方式
  rawText: string;
}

const TRANSPORT_ICONS: Record<string, string> = {
  "🚕": "打车",
  "🚗": "包车/自驾",
  "🚄": "高铁",
  "✈️": "飞机",
  "🚲": "骑行",
  "🚌": "大巴",
};

export function parseItinerary(text: string): ParsedDay[] {
  const dayHeaderRegex = /📅\s*([\d]{1,2}\/[\d]{1,2})[｜|]([^\n]+)/g;

  const matches = [...text.matchAll(dayHeaderRegex)];
  const days: ParsedDay[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const date = match[1].trim();
    const title = match[2].trim();
    const startIdx = match.index! + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const block = text.slice(startIdx, endIdx);

    const hotelLine = block.split("\n").find((l) => l.includes("🏨"));
    const priceMatches = [...block.matchAll(/¥\s?[\d,]+(?:[–\-]\d+)?(?:\/[^\s，。,]+)?/g)].map(
      (m) => m[0]
    );
    const warningLines = block
      .split("\n")
      .filter((l) => l.includes("⚠️") || l.includes("预约") || l.includes("提前"))
      .map((l) => l.trim())
      .filter(Boolean);

    const transportModes = Object.entries(TRANSPORT_ICONS)
      .filter(([icon]) => block.includes(icon))
      .map(([, name]) => name);

    days.push({
      date,
      title,
      hotel: hotelLine ? hotelLine.replace(/🏨/g, "").trim() : null,
      prices: priceMatches,
      warnings: warningLines,
      transportModes,
      rawText: block.trim(),
    });
  }

  return days;
}

/** 粗略预算估算：排除按"/晚"、"/房"计价的住宿项，取区间下限求和，仅供参考 */
export function estimateDailyCost(prices: string[]): number | null {
  const relevant = prices.filter((p) => !p.includes("/晚") && !p.includes("/房"));
  if (relevant.length === 0) return null;

  let total = 0;
  for (const p of relevant) {
    const numMatch = p.match(/¥\s?(\d+)/);
    if (numMatch) total += parseInt(numMatch[1], 10);
  }
  return total > 0 ? total : null;
}

/** 汇总整个行程需要提前预约/确认的事项 */
export function collectAllWarnings(days: ParsedDay[]): { date: string; title: string; warning: string }[] {
  const result: { date: string; title: string; warning: string }[] = [];
  for (const day of days) {
    for (const w of day.warnings) {
      result.push({ date: day.date, title: day.title, warning: w });
    }
  }
  return result;
}
