export default function AdminLoading() {
  return (
    <div className="admin-content page-transition">
      {/* Skeleton Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 8, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 280, height: 16, borderRadius: 6 }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="skeleton" style={{ width: 120, height: 38, borderRadius: 8 }} />
        </div>
      </div>

      {/* Skeleton Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="stat-card"
            style={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="skeleton" style={{ width: "50%", height: 14, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
            </div>
            <div className="skeleton" style={{ width: "70%", height: 32, marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: "40%", height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* Skeleton Table Card */}
      <div className="card" style={{ padding: "20px 24px" }}>
        {/* Table controls */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div className="skeleton" style={{ width: 260, height: 38, borderRadius: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="skeleton" style={{ width: 110, height: 38, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 110, height: 38, borderRadius: 8 }} />
          </div>
        </div>

        {/* Skeleton Table Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton" style={{ width: "100%", height: 42, borderRadius: 6 }} />
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr",
                gap: 16,
                padding: "14px 12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ width: "60%", height: 16, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: "35%", height: 12, borderRadius: 4 }} />
              </div>
              <div className="skeleton" style={{ width: "70%", height: 14, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: "50%", height: 22, borderRadius: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
