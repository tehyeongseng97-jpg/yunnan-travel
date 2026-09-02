import { comparePlaceTickets } from "./searchAgent";
import { analyzeMultiStopDay } from "./routeCostAnalyzer";
import { buildHotelSearchLinks } from "./hotelSearch";
import { realSearchAdapter } from "./realSearchAdapter";
import { ExtractedTasks } from "./itineraryExtractor";

export interface BatchTicketResult {
  date: string;
  place: string;
  status: "ok" | "insufficient_data";
  price: number | null;
  purchaseUrl: string | null;
  reasoning: string | null;
  message?: string;
}

export interface BatchHotelResult {
  date: string;
  location: string;
  links: { label: string; url: string }[];
}

export interface BatchRouteResult {
  date: string;
  stops: string[];
  status: "ok" | "insufficient_data";
  recommendation: string;
  message?: string;
}

export interface BatchAnalysisResult {
  tickets: BatchTicketResult[];
  hotels: BatchHotelResult[];
  routes: BatchRouteResult[];
}

/**
 * 批量执行门票/酒店/路线分析。
 * 门票和路线涉及真实搜索，逐项串行执行（避免并发触发速率限制），
 * 酒店只是生成链接，不涉及搜索，立即完成。
 */
export async function runBatchAnalysis(
  tasks: ExtractedTasks,
  partySize: number
): Promise<BatchAnalysisResult> {
  const tickets: BatchTicketResult[] = [];
  for (const t of tasks.ticketTasks) {
    try {
      const result = await comparePlaceTickets(t.place, realSearchAdapter, partySize);
      if (result.status === "ok" && result.recommendation) {
        tickets.push({
          date: t.date,
          place: t.place,
          status: "ok",
          price: result.candidates[0]?.price ?? null,
          purchaseUrl: result.recommendation.purchaseUrl,
          reasoning: result.recommendation.reasoning,
        });
      } else {
        tickets.push({
          date: t.date,
          place: t.place,
          status: "insufficient_data",
          price: null,
          purchaseUrl: null,
          reasoning: null,
          message: result.message || "未找到可信价格",
        });
      }
    } catch {
      tickets.push({
        date: t.date,
        place: t.place,
        status: "insufficient_data",
        price: null,
        purchaseUrl: null,
        reasoning: null,
        message: "查询出错",
      });
    }
  }

  const hotels: BatchHotelResult[] = tasks.hotelTasks.map((h) => {
    const linkResult = buildHotelSearchLinks(h.location);
    return { date: h.date, location: h.location, links: linkResult.links };
  });

  const routes: BatchRouteResult[] = [];
  for (const r of tasks.routeTasks) {
    try {
      const result = await analyzeMultiStopDay(r.stops, partySize, r.hasLuggage, realSearchAdapter);
      if (result.status === "ok") {
        routes.push({
          date: r.date,
          stops: r.stops,
          status: "ok",
          recommendation: result.recommendation,
        });
      } else {
        routes.push({
          date: r.date,
          stops: r.stops,
          status: "insufficient_data",
          recommendation: "",
          message: result.message || "未找到数据",
        });
      }
    } catch {
      routes.push({
        date: r.date,
        stops: r.stops,
        status: "insufficient_data",
        recommendation: "",
        message: "查询出错",
      });
    }
  }

  return { tickets, hotels, routes };
}
