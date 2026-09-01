import { NextRequest, NextResponse } from "next/server";
import { compareHotels } from "@/lib/hotelSearch";
import { realSearchAdapter } from "@/lib/realSearchAdapter";

// POST /api/hotel { location: "大理古城", checkIn: "11/04", checkOut: "11/06" }
export async function POST(req: NextRequest) {
  try {
    const { location, checkIn, checkOut } = await req.json();

    if (!location) {
      return NextResponse.json({ error: "缺少 location 参数" }, { status: 400 });
    }

    const result = await compareHotels(location, realSearchAdapter, checkIn, checkOut);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "未知错误" },
      { status: 500 }
    );
  }
}
