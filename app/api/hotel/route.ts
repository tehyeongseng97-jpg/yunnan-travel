import { NextRequest, NextResponse } from "next/server";
import { buildHotelSearchLinks } from "@/lib/hotelSearch";

export async function POST(req: NextRequest) {
  const { location, checkIn, checkOut } = await req.json();

  if (!location) {
    return NextResponse.json({ error: "缺少 location 参数" }, { status: 400 });
  }

  const result = buildHotelSearchLinks(location, checkIn, checkOut);
  return NextResponse.json({ status: "ok", ...result });
}
