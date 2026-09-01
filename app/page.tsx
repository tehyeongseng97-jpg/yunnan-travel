"use client";

import { useState } from "react";

export default function Home() {
  const [place, setPlace] = useState("普达措国家公园");
  const [partySize, setPartySize] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 20 }}>🇨🇳 YUNNAN AI TRAVEL AGENT</h1>
      <p style={{ color: "#666", fontSize: 14 }}>输入景点名，AI 帮你比价</p>

      <input
        value={place}
        onChange={(e) => setPlace(e.target.value)}
        placeholder="景点名称，如：普达措国家公园"
        style={{ width: "100%", padding: 10, marginTop: 12, border: "1px solid #ddd", borderRadius: 8 }}
      />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 14 }}>👤 人数</label>
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
        {loading ? "AI 正在比价…" : "帮我比价"}
      </button>

      {result?.status === "insufficient_data" && (
        <p style={{ marginTop: 20, color: "#c0392b" }}>⚠️ {result.message}</p>
      )}

      {result?.status === "ok" && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16 }}>⭐ AI 推荐</h2>
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
              前往购买 →
            </a>
          </div>

          <h3 style={{ fontSize: 14, marginTop: 16 }}>所有候选项（按可信度+价格排序）</h3>
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
    </main>
  );
}
