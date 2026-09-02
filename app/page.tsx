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
