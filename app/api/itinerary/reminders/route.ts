import { NextRequest, NextResponse } from "next/server";
import { parseItinerary } from "@/lib/itineraryParser";
import { extractTasks } from "@/lib/itineraryExtractor";
import { calculateBookingReminders } from "@/lib/bookingReminder";

export async function POST(req: NextRequest) {
  const { text, windowDays = 3 } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "缺少行程文本" }, { status: 400 });
  }

  const days = parseItinerary(text);
  if (days.length === 0) {
    return NextResponse.json({
      status: "insufficient_data",
      message: "没有识别到符合格式的每日行程。",
    });
  }

  const tasks = extractTasks(days);
  const reminders = calculateBookingReminders(days, tasks, new Date(), windowDays);

  return NextResponse.json({ status: "ok", reminders });
}
