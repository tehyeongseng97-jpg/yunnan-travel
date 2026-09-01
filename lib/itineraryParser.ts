/**
 * Itinerary Parser
 * ------------------------------------------------------------
 * 从纯文本行程解析出结构化的每日行程数据。
 * 重点：日期/标题/住宿/预约提醒要准确；价格只做罗列参考，不做精确计算
 * （行程距出行还有几个月，价格必然浮动，精确计算反而误导）。
 */

export interface ParsedDay {
  date: string;
  title: string;
  hotel: string | null;
  priceRefs: string[]; // 这天出现过的价格片段，仅供参考，不加总
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

/**
 * 提取住宿信息：只认"🏨"这一行本身的内容，
 * 如果这一行只有图标没有文字，往下找最近一行非空、非时间戳、非价格的文字作为住宿名。
 * 不再"顺手"抓到别的字段。
 */
function extractHotel(block: string): string | null {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const hotelIdx = lines.findIndex((l) => l.includes("🏨"));
  if (hotelIdx === -1) return null;

  const sameLine = lines[hotelIdx].replace(/🏨/g, "").trim();
  if (sameLine.length > 1) return sameLine;

  for (let i = hotelIdx + 1; i < Math.min(hotelIdx + 4, lines.length); i++) {
    const l = lines[i];
    if (/^\d{1,2}:\d{2}/.test(l)) continue; // 跳过时间戳行
    if (/^[🚕🚗🚄✈️🚲🚌🍽️🍜☕🌊🏔️🏮🌅]/.test(l)) continue; // 跳过其他图标开头的行
    if (l.length <= 1) continue;
    return l.replace(/📍/g, "").trim();
  }
  return null;
}

function extractTransportModes(block: string): string[] {
  const lines = block.split("\n");
  const found: string[] = [];

  for (const [icon, name] of Object.entries(TRANSPORT_ICONS)) {
    const relevant = lines.some((l) => {
      if (!l.includes(icon)) return false;
      if (icon === "✈️") return l.includes("机场") || l.includes("直飞") || l.includes("登机");
      return true;
    });
    if (relevant) found.push(name);
  }
  return found;
}

function extractPriceRefs(block: string): string[] {
  const matches = [...block.matchAll(/¥\s?[\d,]+(?:[–\-]\d+)?(?:\/[^\s，。,]+)?/g)];
  // 去重，最多保留 5 个，避免一天里罗列太多价格片段
  const unique = [...new Set(matches.map((m) => m[0]))];
  return unique.slice(0, 5);
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

    days.push({
      date,
      title,
      hotel: extractHotel(block),
      priceRefs: extractPriceRefs(block),
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
