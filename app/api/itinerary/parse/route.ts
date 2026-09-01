import { NextRequest, NextResponse } from "next/server";
import { parseItinerary, collectAllWarnings } from "@/lib/itineraryParser";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "缺少行程文本" }, { status: 400 });
  }

  const days = parseItinerary(text);

  if (days.length === 0) {
    return NextResponse.json({
      status: "insufficient_data",
      message: "没有识别到符合格式的每日行程（需要包含「📅 日期｜标题」这样的格式）。",
    });
  }

  const warnings = collectAllWarnings(days);
  const totalMajor = days.reduce((sum, d) => sum + d.majorCost, 0);
  const totalTaxi = days.reduce((sum, d) => sum + d.taxiCost, 0);

  return NextResponse.json({
    status: "ok",
    days,
    warnings,
    totalMajor,
    totalTaxi,
    dayCount: days.length,
  });
}
