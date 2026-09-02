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

  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [batchProgress, setBatchProgress] = useState("");

  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderResult, setReminderResult] = useState<any>(null);

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

  async function handleBatchAnalyze() {
    setBatchLoading(true);
    setBatchResult(null);
    setBatchProgress("AI 正在逐项查询，可能需要1-2分钟，请耐心等待");
    try {
      const res = await fetch("/api/itinerary/batch-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: itineraryText, partySize }),
      });
      const data = await res.json();
      setBatchResult(data);
    } catch (err) {
      setBatchResult({ status: "error", message: "请求失败，可能是超时，可以重试" });
    }
    setBatchProgress("");
    setBatchLoading(false);
  }

  async function handleCheckReminders() {
    setReminderLoading(true);
    setReminderResult(null);
    const res = await fetch("/api/itinerary/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: itineraryText, windowDays: 3 }),
    });
    const data = await res.json();
    setReminderResult(data);
    setReminderLoading(false);
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
          style={{ flex: 1, padding: 12, background: "#111", color: "#fff", borderRadius: 8, fontSize: 13 }}
        >
          {itineraryLoading ? "解析中" : "解析行程"}
        </button>
        <button
          onClick={handleExtractTasks}
          disabled={tasksLoading || !itineraryText}
          style={{ flex: 1, padding: 12, background: "#2563eb", color: "#fff", borderRadius: 8, fontSize: 13 }}
        >
          {tasksLoading ? "识别中" : "识别待查项"}
        </button>
      </div>

      <button
        onClick={handleBatchAnalyze}
        disabled={batchLoading || !itineraryText}
        style={{ marginTop: 8, width: "100%", padding: 14, background: "#16a34a", color: "#fff", borderRadius: 8, fontWeight: 600 }}
      >
        {batchLoading ? "AI 正在全部分析中..." : "一键分析全部行程（门票+酒店+交通）"}
      </button>

      <button
        onClick={handleCheckReminders}
        disabled={reminderLoading || !itineraryText}
        style={{ marginTop: 8, width: "100%", padding: 12, background: "#f59e0b", color: "#fff", borderRadius: 8, fontSize: 13 }}
      >
        {reminderLoading ? "检查中" : "检查近3天内需要预订的事项"}
      </button>

      {reminderResult && reminderResult.status === "ok" && (
        <div style={{ marginTop: 12 }}>
          {reminderResult.reminders.length === 0 ? (
            <p style={{ fontSize: 13, color: "#666" }}>未来3天内没有需要立即预订的事项</p>
          ) : (
            reminderResult.reminders.map((r: any, i: number) => (
              <div key={i} style={{ background: "#fffbeb", padding: 10, borderRadius: 8, marginTop: 6, fontSize: 13 }}>
                <span style={{ color: "#c0392b", fontWeight: 600 }}>
                  {r.daysUntil === 0 ? "今天" : `${r.daysUntil}天后`}
                </span>
                （{r.date}）— {r.type}：{r.item}
              </div>
            ))
          )}
        </div>
      )}

      {batchProgress && <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>{batchProgress}</p>}

      {batchResult && (batchResult.status === "error" || batchResult.status === "insufficient_data") && (
        <p style={{ marginTop: 16, color: "#c0392b" }}>{batchResult.message}</p>
      )}

      {batchResult && batchResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            分析完成：{batchResult.dayCount} 天行程，门票 {batchResult.tickets.length} 项，酒店 {batchResult.hotels.length} 项，多站点路线 {batchResult.routes.length} 项
          </div>

          {batchResult.tickets.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14 }}>门票比价结果</h3>
              {batchResult.tickets.map((t: any, i: number) => (
                <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.date} — {t.place}</div>
                  {t.status === "ok" ? (
                    <>
                      <div style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>约 ¥{t.price}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{t.reasoning}</div>
                      <a href={t.purchaseUrl} target="_blank" style={{ fontSize: 12, color: "#2563eb", marginTop: 4, display: "inline-block" }}>前往购买</a>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}>{t.message}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {batchResult.hotels.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14 }}>酒店搜索链接</h3>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>
                行程里只写了推荐区域，没有具体酒店名，暂时无法直接推荐某一家，这里帮你打开对应区域的搜索结果自己挑
              </div>
              {batchResult.hotels.map((h: any, i: number) => (
                <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.date} — {h.location}</div>
                  <div style={{ marginTop: 6 }}>
                    {h.links.map((link: any, j: number) => (
                      <a key={j} href={link.url} target="_blank" style={{ fontSize: 12, color: "#2563eb", marginRight: 12 }}>{link.label}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {batchResult.routes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14 }}>多站点交通分析</h3>
              {batchResult.routes.map((r: any, i: number) => (
                <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{r.date} — {r.stops.join(" → ")}</div>
                  {r.status === "ok" ? (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{r.recommendation}</div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}>{r.message}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tasksResult && tasksResult.status === "ok" && (
        <div style={{ marginTop: 16, background: "#eff6ff", padding: 12, borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>AI 识别出的待查项</div>
          {tasksResult.ticketTasks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>门票（{tasksResult.ticketTasks.length}项）</div>
              {tasksResult.ticketTasks.map((t: any, i: number) => (
                <div key={i} style={{ fontSize: 13, color: "#333" }}>{t.date} — {t.place}</div>
              ))}
            </div>
          )}
          {tasksResult.hotelTasks.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>酒店（{tasksResult.hotelTasks.length}项）</div>
              {tasksResult.hotelTasks.map((t: any, i: number) => (
                <div key={i} style={{ fontSize: 13, color: "#333" }}>{t.date} — {t.location}</div>
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

      {itineraryResult && itineraryResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600 }}>共识别 {itineraryResult.dayCount} 天</div>
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
              <div style={{ fontWeight: 600, fontSize: 13 }}>{d.date} {d.title}</div>
              {d.hotel && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>住宿：{d.hotel}</div>}
              {d.transportModes.length > 0 && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>交通：{d.transportModes.join("、")}</div>
              )}
              {d.priceRefs.length > 0 && (
                <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>价格参考：{d.priceRefs.join("　")}</div>
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
        <input value={checkIn} onChange={(e) => setCheckIn(e.target.value)} placeholder="入住日期" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }} />
        <input value={checkOut} onChange={(e) => setCheckOut(e.target.value)} placeholder="退房日期" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }} />
      </div>
      <button onClick={handleHotelSearch} disabled={hotelLoading} style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}>
        {hotelLoading ? "生成搜索链接中" : "去平台搜酒店"}
      </button>

      {hotelResult && hotelResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          {hotelResult.links.map((link: any, i: number) => (
            <a key={i} href={link.url} target="_blank" style={{ display: "block", padding: 12, border: "1px solid #eee", borderRadius: 8, marginTop: 8, color: "#2563eb", textDecoration: "none" }}>
              {link.label} → {hotelResult.location}
            </a>
          ))}
        </div>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <p style={{ color: "#666", fontSize: 14 }}>当天多站点，打车分段 vs 包车哪个划算</p>
      <textarea value={stopsText} onChange={(e) => setStopsText(e.target.value)} placeholder="用顿号分隔" rows={2} style={{ width: "100%", padding: 10, marginTop: 8, border: "1px solid #ddd", borderRadius: 8, fontSize: 13 }} />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={hasLuggage} onChange={(e) => setHasLuggage(e.target.checked)} id="luggage" />
        <label htmlFor="luggage" style={{ fontSize: 13 }}>今天要换酒店，带行李跑一整天</label>
      </div>
      <button onClick={handleRouteAnalysis} disabled={routeLoading} style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}>
        {routeLoading ? "AI 正在分析路线" : "分析这天的交通方案"}
      </button>

      {routeResult && routeResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8, fontSize: 13 }}>{routeResult.recommendation}</div>
        </div>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <p style={{ color: "#666", fontSize: 14 }}>输入景点名，AI 帮你比价</p>
      <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="景点名称" style={{ width: "100%", padding: 10, marginTop: 8, border: "1px solid #ddd", borderRadius: 8 }} />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 14 }}>人数</label>
        <input type="number" value={partySize} min={1} onChange={(e) => setPartySize(Number(e.target.value))} style={{ width: 60, padding: 6, border: "1px solid #ddd", borderRadius: 6 }} />
      </div>
      <button onClick={handleAsk} disabled={loading} style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}>
        {loading ? "AI 正在比价" : "帮我比价"}
      </button>

      {result && result.status === "ok" && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16 }}>AI 推荐</h2>
          <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>{result.recommendation.title}</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{result.recommendation.reasoning}</div>
            <a href={result.recommendation.purchaseUrl} target="_blank" style={{ display: "inline-block", marginTop: 10, color: "#2563eb" }}>前往购买</a>
          </div>
        </div>
      )}

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid #eee" }} />

      <p style={{ color: "#666", fontSize: 14 }}>交通方案比价</p>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="出发地" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }} />
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="目的地" style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 8 }} />
      </div>
      <button onClick={handleTransportAsk} disabled={transportLoading} style={{ marginTop: 12, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}>
        {transportLoading ? "AI 正在比较交通方案" : "帮我比较交通方案"}
      </button>

      {transportResult && transportResult.status === "ok" && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16 }}>AI 推荐：{transportResult.recommended}</h2>
          {transportResult.ranked.map((r: any, i: number) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12, marginTop: 8 }}>
              <div style={{ fontWeight: 600 }}>{r.label} — 人均 ¥{r.totalPerPerson}{i === 0 && <span style={{ marginLeft: 6, fontSize: 12, color: "#16a34a" }}>最优</span>}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
