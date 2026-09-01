import { NextRequest, NextResponse } from "next/server";
import { compareTransportOptions } from "@/lib/searchAgent";

// POST /api/transport { from: "丽江", to: "香格里拉", partySize: 4 }
// 当前为演示数据（来自真实搜索的丽江→香格里拉区间），
// 真实实现应对每个 mode 单独发起 search + 结构化提取。
export async function POST(req: NextRequest) {
  const { partySize = 2 } = await req.json();

  const options = [
    { mode: "大巴", basePrice: 65, connectionCost: 0, durationMinutes: 270, comfortScore: 3 },
    { mode: "拼车", basePrice: 150, connectionCost: 0, durationMinutes: 210, comfortScore: 4 },
    {
      mode: "包车（整车，按人数分摊）",
      basePrice: 650,
      connectionCost: 0,
      durationMinutes: 210,
      comfortScore: 5,
      isPerPersonPrice: false,
    },
  ];

  const result = compareTransportOptions(options, partySize);

  return NextResponse.json({
    status: "ok",
    note: "示例数据，来源为真实搜索摘要，未接入实时票价 API，上线前需替换为实时数据源",
    ...result,
  });
}
