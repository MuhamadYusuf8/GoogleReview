"use client";

import { useState, useMemo } from "react";

interface DailyData { date: string; count: number }
interface TopLink { slug: string; label: string | null; merchant: string; count: number }
interface SourceAgg { qr: number; nfc: number; unknown: number }

interface Props {
  total30d: number;
  total7d: number;
  sourceAgg: SourceAgg;
  topLinks: TopLink[];
  dailyData: DailyData[];
}

function MiniBarChart({ data }: { data: DailyData[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, marginTop: 16 }}>
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count} scan`}
          style={{
            flex: 1,
            height: `${Math.max((d.count / max) * 100, 4)}%`,
            background: "linear-gradient(180deg, #3b82f6, #6366f1)",
            borderRadius: "3px 3px 0 0",
            transition: "height 0.3s ease",
            cursor: "default",
            minHeight: 4,
          }}
        />
      ))}
    </div>
  );
}

function DonutChart({ qr, nfc, unknown }: SourceAgg) {
  const total = qr + nfc + unknown;
  if (total === 0) return <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 20 }}>Belum ada data</div>;

  const qrPct = Math.round((qr / total) * 100);
  const nfcPct = Math.round((nfc / total) * 100);
  const unknownPct = 100 - qrPct - nfcPct;

  const items = [
    { label: "QR Code", count: qr, pct: qrPct, color: "#3b82f6" },
    { label: "NFC Tap", count: nfc, pct: nfcPct, color: "#10b981" },
    { label: "Unknown", count: unknown, pct: unknownPct, color: "#64748b" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>{item.label}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {item.count.toLocaleString("id")} <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>({item.pct}%)</span>
            </span>
          </div>
          <div style={{ height: 8, background: "var(--color-bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${item.pct}%`,
              background: item.color, borderRadius: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function exportCSV(topLinks: TopLink[], dailyData: DailyData[]) {
  const rows = [
    ["Tipe", "Keterangan", "Jumlah"],
    ...topLinks.map((l) => ["Link", `/${l.slug} – ${l.merchant}`, l.count]),
    ["---", "---", "---"],
    ...dailyData.map((d) => ["Harian", d.date, d.count]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsClient({ total30d, total7d, sourceAgg, topLinks, dailyData }: Props) {
  const [range, setRange] = useState<"7d" | "30d">("30d");

  const filteredDaily = useMemo(() => {
    if (range === "7d") return dailyData.slice(-7);
    return dailyData;
  }, [range, dailyData]);

  const total = range === "7d" ? total7d : total30d;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(59,130,246,0.15)" }}>📊</div>
          <div className="stat-value">{total.toLocaleString("id")}</div>
          <div className="stat-label">Total Scan ({range === "7d" ? "7 hari" : "30 hari"})</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16,185,129,0.15)" }}>📷</div>
          <div className="stat-value">{sourceAgg.qr.toLocaleString("id")}</div>
          <div className="stat-label">QR Code Scan (30 hari)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)" }}>📱</div>
          <div className="stat-value">{sourceAgg.nfc.toLocaleString("id")}</div>
          <div className="stat-label">NFC Tap (30 hari)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)" }}>🔗</div>
          <div className="stat-value">{topLinks.length}</div>
          <div className="stat-label">Link Aktif Dipakai</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {/* Daily Chart */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ fontSize: "1rem" }}>📈 Tren Harian</h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  id={`range-${r}`}
                  className={`btn btn-sm ${range === r ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setRange(r)}
                >
                  {r === "7d" ? "7 Hari" : "30 Hari"}
                </button>
              ))}
            </div>
          </div>
          {filteredDaily.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 40 }}>Belum ada data</div>
          ) : (
            <>
              <MiniBarChart data={filteredDaily} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                <span>{filteredDaily[0]?.date}</span>
                <span>{filteredDaily[filteredDaily.length - 1]?.date}</span>
              </div>
            </>
          )}
        </div>

        {/* Source Breakdown */}
        <div className="card">
          <h3 style={{ fontSize: "1rem", marginBottom: 20 }}>🎯 QR vs NFC (30 Hari)</h3>
          <DonutChart {...sourceAgg} />
        </div>
      </div>

      {/* Top Links */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: "1rem" }}>🏆 Top Links (30 Hari)</h3>
          <button
            id="export-csv-btn"
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(topLinks, dailyData)}
          >
            ⬇️ Export CSV
          </button>
        </div>
        {topLinks.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: 24 }}>
            Belum ada data scan dalam 30 hari terakhir.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topLinks.map((link, i) => {
              const max = topLinks[0]?.count ?? 1;
              return (
                <div key={link.slug}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary)", fontFamily: "monospace" }}>
                        #{i + 1} /{link.slug}
                      </span>
                      {link.label && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: 8 }}>{link.label}</span>
                      )}
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{link.merchant}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "0.9375rem" }}>
                      {link.count.toLocaleString("id")}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "var(--color-bg-elevated)", borderRadius: 3 }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: `${(link.count / max) * 100}%`,
                      background: i === 0
                        ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                        : "linear-gradient(90deg, #3b82f6, #6366f1)",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
