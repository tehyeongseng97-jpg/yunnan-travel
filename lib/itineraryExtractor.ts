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

// 只过滤纯占位词本身，不再用长度粗暴过滤——之前"丽江市区"这种4字真实地名被误杀了
const HOTEL_PLACEHOLDER_ONLY = [
  "酒店", "住宿", "入住", "换酒店", "住宿安排", "今晚", "继续住", "民宿",
];

function looksLikeTicketPlace(segment: string): boolean {
  if (FREE_PLACE_WHITELIST.some((w) => segment.includes(w))) return false;
  if (NON_TICKET_KEYWORDS.some((kw) => segment.includes(kw))) return false;
  return TICKET_KEYWORDS.some((kw) => segment.includes(kw));
}

function isValidHotelName(text: string): boolean {
  const stripped = text.trim();
  if (stripped.length < 2) return false;
  // 只排除完全等于纯占位词的情况，不再按长度整体拒绝
  return !HOTEL_PLACEHOLDER_ONLY.some((w) => stripped === w);
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
