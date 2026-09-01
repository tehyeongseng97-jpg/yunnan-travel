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
      <button
        onClick={handleParseItinerary}
        disabled={itineraryLoading || !itineraryText}
        style={{ marginTop: 8, width: "100%", padding: 12, background: "#111", color: "#fff", borderRadius: 8 }}
      >
        {itineraryLoading ? "正在解析" : "解析行程"}
      </button>

      {itineraryResult && itineraryResult.status === "insufficient_data" && (
        <p style={{ marginTop: 16, color: "#c0392b" }}>{itineraryResult.message}</p>
      )}

      {itineraryResult && itineraryResult.status === "ok" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 600 }}>共识别 {itineraryResult.dayCount} 天</div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
              大额支出（门票/大交通）合计：约 ¥{itineraryResult.totalMajor}
            </div>
            <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>
              零散打车合计：约 ¥{itineraryResult.totalTaxi}
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>不含住宿，仅供参考</div>
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
              {d.hotel && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>住宿：{d.hotel}</div>}
              {d.transportModes.length > 0 && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  交通：{d.transportModes.join("、")}
                </div>
              )}
              {(d.majorCost > 0 || d.taxiCost > 0) && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                  大额 ¥{d.majorCost}　打车 ¥{d.taxiCost}
                </div>
              )}
            </div>
          ))}
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
