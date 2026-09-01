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
      
