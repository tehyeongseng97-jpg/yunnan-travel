/**
 * Itinerary Parser
 * ------------------------------------------------------------
 * 从纯文本行程解析出结构化的每日行程数据。规则匹配，不依赖 LLM，免费。
 */

export interface ParsedDay {
  date: string;
  title: string;
  hotel: string | null;
  majorCost: number; // 门票、大交通等大额支出
  taxiCost: number; // 打车接驳等零散支出
  warnings: string[];
  transportModes: string[];
  rawText: string;
}

const TRANSPORT_ICONS: Record<string, string> = {
  "🚗": "包车/自驾",
  "🚄": "高铁",
  "✈️": "飞机",
  "🚲": "骑行",
  "🚌": "大巴",
};

function extractHotel(block: string): string | null {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const hotelIdx = lines.findIndex((l) => l.includes("🏨"));
  if (hotelIdx === -1) return null;

  const sameLineText = lines[hotelIdx].replace(/🏨/g, "").trim();
  if (sameLineText.length > 1) return sameLineText;

  for (let i = hotelIdx + 1; i < Math.min(hotelIdx + 5, lines.length); i++) {
    const l = lines[i];
    if (/^\d{1,2}:\d{2}/.test(l)) continue;
    if (l.length <= 2) continue;
    return l.replace(/📍/g, "").replace(/💰.*$/, "").trim();
  }
  return null;
}

function extractTransportModes(block: string): string[] {
  const lines = block.split("\n");
  const found: string[] = [];

  for (const [icon, name] of Object.entries(TRANSPORT_ICONS)) {
    const hasRelevantLine = lines.some((l) => {
      if (!l.includes(icon)) return false;
      if (icon === "✈️") {
        return l.includes("机场") || l.includes("直飞") || l.includes("登机");
      }
      return true;
    });
    if (hasRelevantLine) found.push(name);
  }
  return found;
}

function splitCosts(block: string): { majorCost: number; taxiCost: number } {
  const lines = block.split("\n");
  let majorCost = 0;
  let taxiCost = 0;

  for (const line of lines) {
    const priceMatches = [...line.matchAll(/¥\s?(\d+)/g)];
    if (priceMatches.length === 0) continue;
    if (line.includes("/晚") || line.includes("/房")) continue;

    const amount = priceMatches.reduce((sum, m) => sum + parseInt(m[1], 10), 0);

    if (line.includes("🚕")) {
      taxiCost += amount;
    } else {
      majorCost += amount;
    }
  }

  return { majorCost, taxiCost };
}

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

    const warningLines = block
      .split("\n")
      .filter((l) => l.includes("⚠️") || l.includes("预约") || l.includes("提前"))
      .map((l) => l.trim())
      .filter(Boolean);

    const { majorCost, taxiCost } = splitCosts(block);

    days.push({
      date,
      title,
      hotel: extractHotel(block),
      majorCost,
      taxiCost,
      warnings: warningLines,
      transportModes: extractTransportModes(block),
      rawText: block.trim(),
    });
  }

  return days;
}

export function collectAllWarnings(days: ParsedDay[]): { date: string; title: string; warning: string }[] {
  const result: { date: string; title: string; warning: string }[] = [];
  for (const day of days) {
    for (const w of day.warnings) {
      result.push({ date: day.date, title: day.title, warning: w });
    }
  }
  return result;
}
