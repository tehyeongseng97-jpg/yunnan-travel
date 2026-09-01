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

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20 }}>YUNNAN AI TRAVEL AGENT</h1>

      <p style={{ color: "#666", fontSize: 14, marginTop: 16 }}>输入景点名，AI 帮你比价</p>
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
