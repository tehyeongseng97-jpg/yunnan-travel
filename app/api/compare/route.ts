import { NextRequest, NextResponse } from "next/server";
import { comparePlaceTickets } from "@/lib/searchAgent";
import { realSearchAdapter } from "@/lib/realSearchAdapter";

export async function POST(req: NextRequest) {
  const { place, partySize = 2 } = await req.json();

  if (!place) {
    return NextResponse.json({ error: "缺少 place 参数" }, { status: 400 });
  }

  const result = await comparePlaceTickets(place, realSearchAdapter, partySize);

  return NextResponse.json(result);
}
