import { NextRequest, NextResponse } from "next/server";
import { comparePlaceTickets } from "@/lib/searchAgent";
import { mockPudacuoAdapter } from "@/lib/mockAdapter";

// POST /api/compare  { place: "普达措国家公园", partySize: 4 }
export async function POST(req: NextRequest) {
  const { place, partySize = 2 } = await req.json();

  if (!place) {
    return NextResponse.json({ error: "缺少 place 参数" }, { status: 400 });
  }

  // TODO 上线时替换为真实 SearchAdapter（Serper / Bing Search API 等）
  const result = await comparePlaceTickets(place, mockPudacuoAdapter, partySize);

  return NextResponse.json(result);
}
