import { NextRequest, NextResponse } from "next/server";
import { analyzeMultiStopDay } from "@/lib/routeCostAnalyzer";
import { realSearchAdapter } from "@/lib/realSearchAdapter";

// POST /api/route-analysis { stops: ["沙溪","喜洲","蛮荒时代","大理"], partySize: 2, hasLuggage: true }
export async function POST(req: NextRequest) {
  try {
    const { stops, partySize = 2, hasLuggage = false } = await req.json();

    if (!stops || !Array.isArray(stops) || stops.length < 2) {
      return NextResponse.json({ error: "至少需要2个地点" }, { status: 400 });
    }

    const result = await analyzeMultiStopDay(stops, partySize, hasLuggage, realSearchAdapter);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "未知错误" },
      { status: 500 }
    );
  }
}
