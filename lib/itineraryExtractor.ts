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

const FREE_PLACE_WHITELIST = [
  "翠湖", "抚仙湖", "洱海", "纳帕海", "海洪湿地", "南强街", "斗南花市",
  "独克宗古城", "束河古镇", "白沙古镇", "喜洲古镇", "苍山",
];

const NON_TICKET_KEYWORDS = [
  "机场", "车站", "酒店", "民宿", "夜市", "古城", "古镇", "街", "码头",
  "回程", "返回", "抵达", "退房", "入住", "登机", "火车", "高铁", "村",
];

const TICKET_KEYWORDS = [
  "国家公园", "雪山", "峡", "寺", "庙", "索道", "植物园",
  "松赞林", "木府", "转经筒", "龟山公园", "纳帕海",
];

const HOTEL_PLACEHOLDER_WORDS = [
  "酒店", "住宿", "入住", "换酒店", "最后一晚", "今晚", "继续住",
  "安排", "民宿",
];

function looksLikeTicketPlace(segment: string): boolean {
  if (FREE_PLACE_WHITELIST.some((w) => segment.includes(w))) return false;
  if (NON_TICKET_KEYWORDS.some((kw) => segment.includes(kw))) return false;
  return TICKET_KEYWORDS.some((kw) => segment.includes(kw));
}

function isValidHotelName(text: string): boolean {
  const stripped = text.trim();
  if (stripped.length < 3) return false;
  if (stripped.length <= 6 && HOTEL_PLACEHOLDER_WORDS.some((w) => stripped.includes(w))) {
    if (!/[大理丽江香格里拉沙溪喜洲白沙昆明西双版纳告庄独克宗]/.test(stripped)) {
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

/**
 * 只依赖标题分段来判断门票项，不再尝试从正文里额外提取。
 * 会漏掉少数只在正文提及的景点（如纳帕海如果不在标题里），
 * 但换来的是列表干净、不重复、不碎片化 —— 这个取舍更划算，
 * 用户扫一眼列表就能补充漏掉的一两项，但没法忍受一堆重复碎片。
 */
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
