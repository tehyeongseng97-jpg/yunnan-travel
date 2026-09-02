import { ParsedDay } from "./itineraryParser";

export interface TicketTask {
  date: string;
  place: string; // 待查门票的景点名
}

export interface HotelTask {
  date: string;
  location: string; // 待查酒店的区域
}

export interface RouteTask {
  date: string;
  stops: string[]; // 当天多站点路线
  hasLuggage: boolean; // 是否当天换酒店（带行李跑一整天）
}

export interface ExtractedTasks {
  ticketTasks: TicketTask[];
  hotelTasks: HotelTask[];
  routeTasks: RouteTask[];
}

// 明确不是门票景点的关键词（免费/非景区场所），出现在标题里则跳过
const NON_TICKET_KEYWORDS = [
  "机场", "车站", "酒店", "民宿", "夜市", "古城", "古镇", "街", "码头",
  "回程", "返回", "抵达", "退房", "入住", "登机", "火车", "高铁",
];

// 已知需要门票的景区关键词（覆盖不全，作为初版规则，后续可扩充）
const TICKET_KEYWORDS = [
  "国家公园", "雪山", "峡", "寺", "庙", "索道", "植物园", "湖",
  "苍山", "洱海", "松赞林", "木府", "转经筒", "龟山公园",
];

function looksLikeTicketPlace(segment: string): boolean {
  if (NON_TICKET_KEYWORDS.some((kw) => segment.includes(kw))) return false;
  return TICKET_KEYWORDS.some((kw) => segment.includes(kw));
}

function extractStopsFromTitle(title: string): string[] {
  // 标题格式通常是 "地点A → 地点B → 地点C"，用箭头或类似符号分割
  return title
    .split(/[→\->]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 从已解析的每日行程中，提取出"需要查门票"、"需要查酒店"、"需要判断打车vs包车"的任务清单。
 * 这是一个初版规则集，覆盖不全是预期内的——先让用户看到提取结果、确认准确度，
 * 而不是直接批量执行搜索（搜索有额度和时间成本，识别错了会浪费）。
 */
export function extractTasks(days: ParsedDay[]): ExtractedTasks {
  const ticketTasks: TicketTask[] = [];
  const hotelTasks: HotelTask[] = [];
  const routeTasks: RouteTask[] = [];

  for (const day of days) {
    const stops = extractStopsFromTitle(day.title);

    // 门票任务：标题里每个像景区的地点，去重
    const seenTickets = new Set<string>();
    for (const stop of stops) {
      if (looksLikeTicketPlace(stop) && !seenTickets.has(stop)) {
        seenTickets.add(stop);
        ticketTasks.push({ date: day.date, place: stop });
      }
    }

    // 酒店任务：如果这天有住宿信息，取住宿信息本身或标题最后一站作为区域
    if (day.hotel) {
      hotelTasks.push({ date: day.date, location: day.hotel });
    }

    // 路线任务：标题里出现3个及以上站点时，判定为多站点日，值得比较打车vs包车
    if (stops.length >= 3) {
      routeTasks.push({
        date: day.date,
        stops,
        hasLuggage: !!day.hotel, // 简化判断：这天如果有住宿变化记录，粗略视为可能换酒店
      });
    }
  }

  return { ticketTasks, hotelTasks, routeTasks };
}
