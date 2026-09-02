/**
 * Itinerary Parser
 * ------------------------------------------------------------
 * 关键修复：多晚连住的信息（如"🏨 香格里拉 11/10–11/13 共4晚"）
 * 只在汇总段落出现一次，不会每天重复写。之前的版本只读每日区块，
 * 漏掉了这类信息。这次先扫描全文的住宿汇总段落，建立"日期→住宿地"
 * 映射表，再用它填补每日区块里没有单独写住宿的日子。
 */

export interface ParsedDay {
  date: string;
  title: string;
  hotel: string | null;
  priceRefs: string[];
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

// 纯占位词，不构成真实住宿地名（用于过滤，不是完整名单，覆盖主要场景）
const HOTEL_PLACEHOLDER_ONLY = [
  "酒店", "住宿", "入住", "换酒店", "住宿安排", "今晚", "继续住",
];

function isPlaceholderOnly(text: string): boolean {
  const stripped = text.trim();
  return HOTEL_PLACEHOLDER_ONLY.some((w) => stripped === w) || stripped.length <= 1;
}

function extractHotelFromDayBlock(block: string): string | null {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const hotelIdx = lines.findIndex((l) => l.includes("🏨"));
  if (hotelIdx === -1) return null;

  const candidates: string[] = [];
  const sameLine = lines[hotelIdx].replace(/🏨/g, "").trim();
  if (sameLine.length > 1) candidates.push(sameLine);

  for (let i = hotelIdx + 1; i < Math.min(hotelIdx + 5, lines.length); i++) {
    const l = lines[i];
    if (/^\d{1,2}:\d{2}/.test(l)) continue;
    if (/^[🚕🚗🚄✈️🚲🚌🍽️🍜☕🌊🏔️🏮🌅]/.test(l)) continue;
    if (l.length <= 1) continue;
    candidates.push(l.replace(/📍/g, "").trim());
  }

  // 优先返回第一个不是纯占位词的候选，都不行就退而求其次用第一个候选
  for (const c of candidates) {
    if (!isPlaceholderOnly(c)) return c;
  }
  return candidates[0] ?? null;
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
  const unique = [...new Set(matches.map((m) => m[0]))];
  return unique.slice(0, 5);
}

// -------- 住宿汇总段落解析（核心修复） --------

function fillDateRange(
  map: Map<string, string>,
  start: string,
  end: string,
  location: string,
  exclusiveEnd: boolean
) {
  const [sm, sd] = start.split("/").map(Number);
  const [em, ed] = end.split("/").map(Number);
  if (!sm || !sd || !em || !ed) return;

  let cur = new Date(2000, sm - 1, sd);
  const endDate = new Date(2000, em - 1, ed);
  let guard = 0;
  while (guard < 60) {
    if (exclusiveEnd && cur >= endDate) break;
    if (!exclusiveEnd && cur > endDate) break;
    const key = `${cur.getMonth() + 1}/${cur.getDate()}`;
    if (!map.has(key)) map.set(key, location);
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
}

function findLocationBefore(fullText: string, index: number): string {
  const before = fullText.slice(Math.max(0, index - 150), index);
  const lines = before.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes("🏨")) {
      return lines[i].replace(/🏨/g, "").replace(/[：:].*$/, "").trim();
    }
  }
  return "";
}

/**
 * 扫描全文（不分天），找出所有"住宿汇总"表达方式，建立 日期→住宿地 映射：
 * A. "🏨 香格里拉 ... 11/10–11/13 共4晚"
 * B. "11/04：大理古城 1晚"
 * C. "🏨 昆明：住2晚 ... 11/02入住 → 11/04退房"（退房当天不算在住宿夜数内）
 * D. "11/06–11/07：大理古城 2晚"
 */
function parseAccommodationSummary(fullText: string): Map<string, string> {
  const map = new Map<string, string>();

  const rangeWithGong = /([\d]{1,2}\/[\d]{1,2})\s*[–\-]\s*([\d]{1,2}\/[\d]{1,2})[^\n]{0,10}共\s*\d+\s*晚/g;
  let m: RegExpExecArray | null;
  while ((m = rangeWithGong.exec(fullText))) {
    const location = findLocationBefore(fullText, m.index);
    if (location) fillDateRange(map, m[1], m[2], location, false);
  }

  const singleDate = /([\d]{1,2}\/[\d]{1,2})\s*[：:]\s*([\u4e00-\u9fa5]{2,10})\s*\d+晚/g;
  while ((m = singleDate.exec(fullText))) {
    const date = m[1];
    const location = m[2].trim();
    if (!map.has(date)) map.set(date, location);
  }

  const rangeWithColon = /([\d]{1,2}\/[\d]{1,2})\s*[–\-]\s*([\d]{1,2}\/[\d]{1,2})\s*[：:]\s*([\u4e00-\u9fa5]{2,10})\s*\d+晚/g;
  while ((m = rangeWithColon.exec(fullText))) {
    fillDateRange(map, m[1], m[2], m[3].trim(), false);
  }

  const checkInOut = /([\d]{1,2}\/[\d]{1,2})\s*入住\s*[→\-]\s*([\d]{1,2}\/[\d]{1,2})\s*退房/g;
  while ((m = checkInOut.exec(fullText))) {
    const location = findLocationBefore(fullText, m.index);
    if (location) fillDateRange(map, m[1], m[2], location, true); // 退房当天不算
  }

  return map;
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
      hotel: extractHotelFromDayBlock(block),
      priceRefs: extractPriceRefs(block),
      warnings: warningLines,
      transportModes: extractTransportModes(block),
      rawText: block.trim(),
    });
  }

  // 用汇总段落信息填补每日区块没有单独写住宿的日子
  const summaryMap = parseAccommodationSummary(text);
  for (const day of days) {
    if (!day.hotel) {
      const fromSummary = summaryMap.get(day.date);
      if (fromSummary) day.hotel = fromSummary;
    }
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
