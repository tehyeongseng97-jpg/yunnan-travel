/**
 * Itinerary Parser
 * ------------------------------------------------------------
 * 关键修复：多晚连住的信息只在汇总段落出现一次，先扫描全文建立
 * "日期→住宿地"映射表，再填补每日区块没单独写住宿的日子。
 *
 * 本次新增：提取"📍 推荐区域：XXX"这类用户自己在行程里写的具体推荐，
 * 单独作为字段展示出来，而不是只显示笼统的住宿地名。
 */

export interface ParsedDay {
  date: string;
  title: string;
  hotel: string | null;
  recommendedArea: string | null; // 用户原文里写的具体推荐区域
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

const HOTEL_PLACEHOLDER_ONLY = [
  "酒店", "住宿", "入住", "换酒店", "住宿安排", "今晚", "继续住",
];

const TIME_OR_ACTION_ONLY = [
  "晚上", "早上", "上午", "下午", "中午", "凌晨", "今天", "明天",
  "休息", "自由活动", "不安排大型景点",
];

function isPlaceholderOnly(text: string): boolean {
  const stripped = text.trim();
  return (
    HOTEL_PLACEHOLDER_ONLY.some((w) => stripped === w) ||
    TIME_OR_ACTION_ONLY.some((w) => stripped === w || stripped.includes(w)) ||
    stripped.length <= 1
  );
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

  for (let i = hotelIdx + 1; i < Math.min(hotelIdx + 6, lines.length); i++) {
    const l = lines[i];
    if (/^\d{1,2}:\d{2}/.test(l)) continue;
    if (/^[🚕🚗🚄✈️🚲🚌🍽️🍜☕🌊🏔️🏮🌅]/.test(l)) continue;
    if (l.length <= 1) continue;
    if (/^今晚[：:]?$/.test(l)) continue;
    candidates.push(l.replace(/📍/g, "").replace(/[：:]\s*$/, "").trim());
  }

  for (const c of candidates) {
    if (!isPlaceholderOnly(c)) return c;
  }
  return null;
}

/** 提取"📍 推荐区域：XXX"或"📍 推荐：XXX"这类用户自己写的具体推荐 */
function extractRecommendedArea(block: string): string | null {
  const match = block.match(/📍\s*推荐(?:区域)?[：:]\s*([^\n]+)/);
  if (!match) return null;
  return match[1].trim();
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

/** 找一个位置之前最近的"📍 推荐区域：XXX"，用于给汇总段落的住宿也配上推荐区域 */
function findRecommendedAreaBefore(fullText: string, index: number): string | null {
  const before = fullText.slice(Math.max(0, index - 300), index);
  const match = [...before.matchAll(/📍\s*推荐(?:区域)?[：:]\s*([^\n]+)/g)];
  if (match.length === 0) return null;
  return match[match.length - 1][1].trim();
}

function parseAccommodationSummary(
  fullText: string
): { hotelMap: Map<string, string>; areaMap: Map<string, string> } {
  const hotelMap = new Map<string, string>();
  const areaMap = new Map<string, string>();

  const rangeWithGong = /([\d]{1,2}\/[\d]{1,2})\s*[–\-]\s*([\d]{1,2}\/[\d]{1,2})[^\n]{0,10}共\s*\d+\s*晚/g;
  let m: RegExpExecArray | null;
  while ((m = rangeWithGong.exec(fullText))) {
    const location = findLocationBefore(fullText, m.index);
    const area = findRecommendedAreaBefore(fullText, m.index);
    if (location) {
      fillDateRange(hotelMap, m[1], m[2], location, false);
      if (area) fillDateRange(areaMap, m[1], m[2], area, false);
    }
  }

  const singleDate = /([\d]{1,2}\/[\d]{1,2})\s*[：:]\s*([\u4e00-\u9fa5]{2,10})\s*\d+晚/g;
  while ((m = singleDate.exec(fullText))) {
    const date = m[1];
    const location = m[2].trim();
    if (!hotelMap.has(date)) hotelMap.set(date, location);
  }

  const rangeWithColon = /([\d]{1,2}\/[\d]{1,2})\s*[–\-]\s*([\d]{1,2}\/[\d]{1,2})\s*[：:]\s*([\u4e00-\u9fa5]{2,10})\s*\d+晚/g;
  while ((m = rangeWithColon.exec(fullText))) {
    fillDateRange(hotelMap, m[1], m[2], m[3].trim(), false);
  }

  const checkInOut = /([\d]{1,2}\/[\d]{1,2})\s*入住\s*[→\-]\s*([\d]{1,2}\/[\d]{1,2})\s*退房/g;
  while ((m = checkInOut.exec(fullText))) {
    const location = findLocationBefore(fullText, m.index);
    const area = findRecommendedAreaBefore(fullText, m.index);
    if (location) {
      fillDateRange(hotelMap, m[1], m[2], location, true);
      if (area) fillDateRange(areaMap, m[1], m[2], area, true);
    }
  }

  return { hotelMap, areaMap };
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
      recommendedArea: extractRecommendedArea(block),
      priceRefs: extractPriceRefs(block),
      warnings: warningLines,
      transportModes: extractTransportModes(block),
      rawText: block.trim(),
    });
  }

  const { hotelMap, areaMap } = parseAccommodationSummary(text);
  for (const day of days) {
    if (!day.hotel) {
      const fromSummary = hotelMap.get(day.date);
      if (fromSummary) day.hotel = fromSummary;
    }
    if (!day.recommendedArea) {
      const fromSummary = areaMap.get(day.date);
      if (fromSummary) day.recommendedArea = fromSummary;
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
