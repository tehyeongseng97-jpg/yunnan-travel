"use client";

import { useState } from "react";

export default function Home() {
  const [place, setPlace] = useState("普达措国家公园");
  const [partySize, setPartySize] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [from, setFrom] = useState("丽江");
  const [to, setTo] = useState("香格里拉");
  const [transportLoading, setTransportLoading] = useState(false);
  const [transportResult, setTransportResult] = useState<any>(null);

  const [itineraryText, setItineraryText] = useState("");
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryResult, setItineraryResult] = useState<any>(null);

  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksResult, setTasksResult] = useState<any>(null);

  const [stopsText, setStopsText] = useState("沙溪、喜洲、蛮荒时代、大理");
  const [hasLuggage, setHasLuggage] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<any>(null);

  const [hotelLocation, setHotelLocation] = useState("大理古城");
  const [checkIn, setCheckIn] = useState("11/04");
  const [checkOut, setCheckOut] = useState("11/06");
  const [hotelLoading, setHotelLoading] = useState(false);
  const [hotelResult, setHotelResult] = useState<any>(null);

  async function handleAsk() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place, partySize }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  async function handleTransportAsk() {
    setTransportLoading(true);
    setTransportResult(null);
    const res = await fetch("/api/transport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, partySize }),
    });
    const data = await res.json();
    setTransportResult(data);
    setTransportLoading(false);
  }

  async function handleParseItinerary() {
    setItineraryLoading(true);
    setItineraryResult(null);
    const res = await fetch("/api/itinerary/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: itineraryText }),
    });
    const data = await res.json();
    setItineraryResult(data);
    setItineraryLoading(false);
  }

  async function handleExtractTasks() {
    setTasksLoading(true);
    setTasksResult(null);
    const res = await fetch("/api/itinerary/extract-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: itineraryText }),
    });
    const data = await res.json();
    setTasksResult(data);
    setTasksLoading(false);
  }

  async function handleRouteAnalysis() {
    setRouteLoading(true);
    setRouteResult(null);
    const stops = stopsText.split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/route-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stops, partySize, hasLuggage }),
    });
    const data = await res.json();
    setRouteResult(data);
    setRouteLoading(false);
  }

  async function handleHotelSearch() {
    setHotelLoading(true);
    setHotelResult(null);
    const res = await fetch("/api/hotel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location: hotelLocation, checkIn, checkOut }),
    });
    const data = await res.json();
    setHotelResult(data);
    setHotelLoading(false);
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20 }}>YUNNAN AI TRAVEL AGENT</h1>

      <p style={{ color: "#666", fontSize: 14, marginTop: 16 }}>粘贴你的完整行程，AI 帮你结构化整理</p>
      <textarea
        value={itineraryText}
        onChange={(e) => setItineraryText(e.target.value)}
        placeholder="把整段行程文字粘贴到这里"
        rows={6}
        style={{ width: "100%", padding: 10, marginTop: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={handleParseItinerary}
          disabled={itineraryLoading || !itineraryText}
          style={{ flex: 1, padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}
        >
          {itineraryLoading ? "正在解析" : "解析行程"}
        </button>
        <button
          onClick={handleExtractTasks}
          disabled={tasksLoading || !itineraryText}
          style={{ flex: 1, padding: 12, background: "#2563eb", color: "#fff", borderRadius: 8 }}
        >
          {tasksLoading ? "正在识别" : "识别待查项"}
        </button>
      </div>

      {tasksResult && tasksResult.status === "insufficient_data" && (
        <p style={{ marginTop: 16, color: "#c0392b" }}>{tasksResult.message}</p>
      )}

      {tasksResult && tasksResult.status === "ok" && (
        <div style={{ marginTop: 16, background: "#eff6ff", padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>AI 识别出的待查项</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
            这是初版识别规则，可能有遗漏或误判，先看看准不准
          </div>

          {tasksResult.ticketTasks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>门票（{tasksResult.ticketTasks.length}项）</div>
              {tasksResult.ticketTasks.map((t: any, i: number) => (
                <div key={i} style={{ fontSize: 13, color: "#333" }}>
                  {t.date} — {t.place}
                </div>
              ))}
            </div>
          )}

          {tasksResult.hotelTasks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>酒店（{tasksResult.hotelTasks.length}项）</div>
              {tasksResult.hotelTasks.map((t: any, i: number) => (
                <div key={i} style={{ fontSize: 13, color: "#333" }}>
                  {t.date} — {t.location}
                </div>
              ))}
            </div>
          )}

          {tasksResult.routeTasks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>多站点路线（{tasksResult.routeTasks.length}项）</div>
              {tasksResult.routeTasks.map((t: any, i: number) => (
                <div key={i} style={{ fontSize: 13, color: "#333" }}>
                  {t.date} — {t.stops.join(" → ")}
                  {t.hasLuggage && <span style={{ color: "#c0392b" }}>（带行李）</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {itineraryResult && itineraryResult.status === "insufficient_data" && (
        <p style={{ marginTop: 16, color: "#c0392b" }}>{itineraryResult.message}</p>
      )}

      {itineraryResult && itineraryResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600 }}>共识别 {itineraryResult.dayCount} 天</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
              价格距出行还有几个月，会浮动，仅作参考
            </div>
          </div>

          {itineraryResult.warnings.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ fontSize: 14 }}>需要提前处理的事项</h3>
              {itineraryResult.warnings.map((w: any, i: number) => (
                <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ color: "#c0392b" }}>{w.date}</span> {w.title}：{w.warning}
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: 14, marginTop: 16 }}>每日概览</h3>
          {itineraryResult.days.map((d: any, i: number) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {d.date} {d.title}
              </div>
              {d.hotel && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>住宿：{d.hotel}</div>
              )}
              {d.transportModes.length > 0 && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  交通：{d.transportModes.join("、")}
                </div>
              )}
              {d.priceRefs.length > 0 && (
                <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                  价格参考：{d.priceRefs.join("　")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <p style={{ color: "#666", fontSize: 14 }}>酒店搜索</p>
      <input
        value={hotelLocation}
        onChange={(e) => setHotelLocation(e.target.value)}
        placeholder="区域名称，如：大理古城"
        style={{ width: "100%", padding: 10, marginTop: 8, border: "1px solid #ddd", borderRadius: 8 }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          placeholder="入住日期"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <input
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          placeholder="退房日期"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
      </div>
      <button
        onClick={handleHotelSearch}
        disabled={hotelLoading}
        style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}
      >
        {hotelLoading ? "生成搜索链接中" : "去平台搜酒店"}
      </button>

      {hotelResult && hotelResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
            酒店价格是动态的，需要选日期才显示，无法自动比价，这里直接帮你打开对应平台的搜索结果
          </div>
          {hotelResult.links.map((link: any, i: number) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              style={{
                display: "block",
                padding: 12,
                border: "1px solid #eee",
                borderRadius: 8,
                marginTop: 8,
                color: "#2563eb",
                textDecoration: "none",
              }}
            >
              {link.label} → {hotelResult.location}
            </a>
          ))}
        </div>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <p style={{ color: "#666", fontSize: 14 }}>当天多站点，打车分段 vs 包车哪个划算</p>
      <textarea
        value={stopsText}
        onChange={(e) => setStopsText(e.target.value)}
        placeholder="用顿号分隔，如：沙溪、喜洲、蛮荒时代、大理"
        rows={2}
        style={{ width: "100%", padding: 10, marginTop: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }}
      />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          checked={hasLuggage}
          onChange={(e) => setHasLuggage(e.target.checked)}
          id="luggage"
        />
        <label htmlFor="luggage" style={{ fontSize: 13 }}>今天要换酒店，带行李跑一整天</label>
      </div>
      <button
        onClick={handleRouteAnalysis}
        disabled={routeLoading}
        style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}
      >
        {routeLoading ? "AI 正在分析路线" : "分析这天的交通方案"}
      </button>

      {routeResult && routeResult.status === "insufficient_data" && (
        <p style={{ marginTop: 16, color: "#c0392b" }}>{routeResult.message}</p>
      )}

      {routeResult && routeResult.status === "error" && (
        <p style={{ marginTop: 16, color: "#c0392b" }}>报错：{routeResult.message}</p>
      )}

      {routeResult && routeResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 13 }}>
            {routeResult.recommendation}
          </div>

          <h3 style={{ fontSize: 14, marginTop: 12 }}>打车分段明细</h3>
          {routeResult.taxiLegs.map((leg: any, i: number) => (
            <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
              {leg.from} → {leg.to}：{leg.price ? `¥${leg.price}` : "未找到价格"}
            </div>
          ))}

          {routeResult.taxiPartialTotal !== null && (
            <div style={{ fontSize: 13, marginTop: 6, fontWeight: 600 }}>
              打车已找到部分合计：¥{routeResult.taxiPartialTotal}（{routeResult.taxiFoundCount}/{routeResult.taxiLegCount} 段有数据）
            </div>
          )}

          {routeResult.charterTotal !== null && (
            <div style={{ fontSize: 13, marginTop: 12 }}>
              整天包车：约 ¥{routeResult.charterTotal}（人均约 ¥{routeResult.charterPerPerson}）
            </div>
          )}
        </div>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <p style={{ color: "#666", fontSize: 14 }}>输入景点名，AI 帮你比价</p>
      <input
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        placeholder="景点名称"
        style={{ width: "100%", padding: 10, marginTop: 8, border: "1px solid #ddd", borderRadius: 8 }}
      />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 14 }}>人数</label>
        <input
          type="number"
          value={partySize}
          min={1}
          onChange={(e) => setPartySize(Number(e.target.value))}
          style={{ width: 60, padding: 6, border: "1px solid #ddd", borderRadius: 6 }}
        />
      </div>
      <button
        onClick={handleAsk}
        disabled={loading}
        style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}
      >
        {loading ? "AI 正在比价" : "帮我比价"}
      </button>

      {result && result.status === "insufficient_data" && (
        <p style={{ marginTop: 20, color: "#c0392b" }}>{result.message}</p>
      )}

      {result && result.status === "ok" && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16 }}>AI 推荐</h2>
          <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>{result.recommendation.title}</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{result.recommendation.reasoning}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
              数据更新时间：{new Date(result.recommendation.checkedAt).toLocaleString("zh-CN")}
            </div>
            <a
              href={result.recommendation.purchaseUrl}
              target="_blank"
              style={{ display: "inline-block", marginTop: 10, color: "#2563eb" }}
            >
              前往购买
            </a>
          </div>

          <h3 style={{ fontSize: 14, marginTop: 16 }}>所有候选项</h3>
          {result.candidates.map((c: any, i: number) => (
            <div key={i} style={{ fontSize: 13, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                {c.title} — ¥{c.price}{" "}
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: c.sourceTrust.level === "official" ? "#dcfce7" : "#dbeafe",
                  }}
                >
                  {c.sourceTrust.level}
                </span>
              </div>
              <div style={{ color: "#999", fontSize: 11 }}>{c.sourceTrust.reason}</div>
            </div>
          ))}
        </div>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <p style={{ color: "#666", fontSize: 14 }}>交通方案比价</p>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="出发地"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="目的地"
          style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />
      </div>
      <button
        onClick={handleTransportAsk}
        disabled={transportLoading}
        style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}
      >
        {transportLoading ? "AI 正在比较交通方案" : "帮我比较交通方案"}
      </button>

      {transportResult && transportResult.status === "insufficient_data" && (
        <p style={{ marginTop: 20, color: "#c0392b" }}>{transportResult.message}</p>
      )}

      {transportResult && transportResult.status === "error" && (
        <p style={{ marginTop: 20, color: "#c0392b" }}>报错：{transportResult.message}</p>
      )}

      {transportResult && transportResult.status === "ok" && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16 }}>AI 推荐：{transportResult.recommended}</h2>
          {transportResult.ranked.map((r: any, i: number) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 600 }}>
                {r.label} — 人均 ¥{r.totalPerPerson}
                {i === 0 && <span style={{ marginLeft: 6, fontSize: 12, color: "#16a34a" }}>最优</span>}
              </div>
              {r.diffFromCheapest > 0 && (
                <div style={{ fontSize: 12, color: "#999" }}>比最优方案贵 ¥{r.diffFromCheapest}/人</div>
              )}
              <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                {partySize} 人总计 ¥{r.totalForParty}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
