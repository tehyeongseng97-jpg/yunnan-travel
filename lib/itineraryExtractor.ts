import { ParsedDay } from "./itineraryParser";

export interface TicketTask {
  date: string;
  place: string;
}

export interface HotelTask {
  date: string;
  location: string;
}

export interface RouteTask {
  date: string;
  stops: string[];
  hasLuggage: boolean;
}

export interface ExtractedTasks {
  ticketTasks: TicketTask[];
  hotelTasks: HotelTask[];
  routeTasks: RouteTask[];
}

// 明确免费/不构成门票景点的地名，即使命中门票关键词也排除
const FREE_PLACE_WHITELIST = [
  "翠湖", "抚仙湖", "洱海", "纳帕海", "海洪湿地", "南强街", "斗南花市",
  "独克宗古城", "束河古镇", "白沙古镇", "喜洲古镇", "苍山", // 苍山本身免费，索道单独判断
];

const NON_TICKET_KEYWORDS = [
  "机场", "车站", "酒店", "民宿", "夜市", "古城", "古镇", "街", "码头",
  "回程", "返回", "抵达", "退房", "入住", "登机", "火车", "高铁", "村",
];

const TICKET_KEYWORDS = [
  "国家公园", "雪山", "峡", "寺", "庙", "索道", "植物园",
  "松赞林", "木府", "转经筒", "龟山公园", "纳帕海",
];

// 通用占位词，不构成有效酒店/区域名
const HOTEL_PLACEHOLDER_WORDS = [
  "酒店", "住宿", "入住", "换酒店", "最后一晚", "今晚", "继续住",
  "安排", "民宿",
];

function looksLikeTicketPlace(segment: string): boolean {
  if (FREE_PLACE_WHITELIST.some((w) => segment.includes(w))) return false;
  if (NON_TICKET_KEYWORDS.some((kw) => segment.includes(kw))) return false;
  return TICKET_KEYWORDS.some((kw) => segment.includes(kw));
}

/** 从正文（非标题）里额外找出未在标题出现的门票关键词，如"纳帕海"这类藏在正文中的景点 */
function findAdditionalTicketMentions(rawText: string, alreadyFound: Set<string>): string[] {
  const found: string[] = [];
  for (const kw of TICKET_KEYWORDS) {
    if (rawText.includes(kw) && !alreadyFound.has(kw)) {
      // 避免把关键词本身当地名（如"索道"不是完整地名），只在关键词前后凑出更完整的名字
      const match = rawText.match(new RegExp(`[\\u4e00-\\u9fa5]{0,4}${kw}`));
      const place = match ? match[0] : kw;
      if (!FREE_PLACE_WHITELIST.some((w) => place.includes(w) && !place.includes("索道"))) {
        found.push(place);
        alreadyFound.add(kw);
      }
    }
  }
  return found;
}

function isValidHotelName(text: string): boolean {
  const stripped = text.trim();
  if (stripped.length < 3) return false; // 太短，大概率是占位词
  if (HOTEL_PLACEHOLDER_WORDS.some((w) => stripped === w || stripped.length <= 4 && stripped.includes(w))) {
    // 允许"入住XX古城酒店"这种更长的组合，只排除纯占位词本身
    if (stripped.length <= 6 && HOTEL_PLACEHOLDER_WORDS.some((w) => stripped.includes(w)) && !/[大理丽江香格里拉沙溪喜洲白沙昆明西双版纳告庄独克宗]/.test(stripped)) {
      return false;
    }
  }
  return true;
}

function extractStopsFromTitle(title: string): string[] {
  return title
    .split(/[→\->]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function extractTasks(days: ParsedDay[]): ExtractedTasks {
  const ticketTasks: TicketTask[] = [];
  const hotelTasks: HotelTask[] = [];
  const routeTasks: RouteTask[] = [];

  for (const day of days) {
    const stops = extractStopsFromTitle(day.title);
    const seenTickets = new Set<string>();

    for (const stop of stops) {
      if (looksLikeTicketPlace(stop) && !seenTickets.has(stop)) {
        seenTickets.add(stop);
        ticketTasks.push({ date: day.date, place: stop });
      }
    }

    // 补充正文中提到但标题没有的门票项（如纳帕海）
    const additional = findAdditionalTicketMentions(day.rawText, seenTickets);
    for (const place of additional) {
      ticketTasks.push({ date: day.date, place });
    }

    // 酒店：过滤掉占位词，只保留看起来像真实地名/酒店名的
    if (day.hotel && isValidHotelName(day.hotel)) {
      hotelTasks.push({ date: day.date, location: day.hotel });
    }

    if (stops.length >= 3) {
      routeTasks.push({
        date: day.date,
        stops,
        hasLuggage: !!day.hotel,
      });
    }
  }

  return { ticketTasks, hotelTasks, routeTasks };
}
