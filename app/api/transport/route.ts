import { NextRequest, NextResponse } from "next/server";
import { compareTransportRealSearch } from "@/lib/searchAgent";
import { realSearchAdapter } from "@/lib/realSearchAdapter";

export async function POST(req: NextRequest) {
  try {
    const { from = "丽江", to = "香格里拉", partySize = 2 } = await req.json();
    const result = await compareTransportRealSearch(from, to, partySize, realSearchAdapter);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "未知错误" },
      { status: 500 }
    );
  }
}
