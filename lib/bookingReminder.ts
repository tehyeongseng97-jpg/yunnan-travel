import { ParsedDay } from "./itineraryParser";
import { ExtractedTasks } from "./itineraryExtractor";

export interface BookingReminder {
  date: string;
  daysUntil: number;
  type: "酒店" | "门票" | "国内机票";
  item: string;
}

/**
 * 计算"距今天X天后要做的事"，用于提前2-3天提醒预订。
 * currentDate 由调用方传入（不用 new Date()，方便测试和用户自定义"今天"）。
 * 日期格式统一按 "M/D"（不含年份），跨年场景（如11月到次年1月）需要额外处理。
 */
export function calculateBookingReminders(
  days: ParsedDay[],
  tasks: ExtractedTasks,
  currentDate: Date,
  windowDays: number = 3
): BookingReminder[] {
  const reminders: BookingReminder[] = [];

  function daysUntilDate(dateStr: string): number | null {
    const parts = dateStr.split("/").map(Number);
    if (parts.length !== 2) return null;
    const [month, day] = parts;

    // 假设行程日期都在未来，按当前年份或明年推算
    let year = currentDate.getFullYear();
    let target = new Date(year, month - 1, day);
    if (target < currentDate) {
      target = new Date(year + 1, month - 1, day);
    }

    const diffMs = target.getTime() - new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  // 酒店：每个待查酒店项，提前提醒
  for (const h of tasks.hotelTasks) {
    const diff = daysUntilDate(h.date);
    if (diff !== null && diff >= 0 && diff <= windowDays) {
      reminders.push({ date: h.date, daysUntil: diff, type: "酒店", item: h.location });
    }
  }

  // 门票：每个待查门票项，提前提醒
  for (const t of tasks.ticketTasks) {
    const diff = daysUntilDate(t.date);
    if (diff !== null && diff >= 0 && diff <= windowDays) {
      reminders.push({ date: t.date, daysUntil: diff, type: "门票", item: t.place });
    }
  }

  // 国内机票：标题或正文里出现"飞"、"直飞"、"航班"字样的天，视为需要机票
  for (const day of days) {
    const isFlightDay = day.title.includes("飞") || day.rawText.includes("直飞") || day.rawText.includes("航班");
    if (isFlightDay) {
      const diff = daysUntilDate(day.date);
      if (diff !== null && diff >= 0 && diff <= windowDays) {
        reminders.push({ date: day.date, daysUntil: diff, type: "国内机票", item: day.title });
      }
    }
  }

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}
