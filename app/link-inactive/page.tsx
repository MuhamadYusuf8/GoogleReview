import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tautan Tidak Aktif" };

export default function LinkInactivePage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px", background: "var(--color-bg)",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(245,158,11,0.1)", border: "2px solid rgba(245,158,11,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", margin: "0 auto 24px",
        }}>⏸️</div>

        <div style={{
          fontSize: "4rem", fontWeight: 800, lineHeight: 1,
          background: "linear-gradient(135deg,#f59e0b,#ef4444)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>410</div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 12 }}>
          Tautan Tidak Aktif
        </h1>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
          Kartu review ini sedang tidak aktif atau layanannya telah berakhir.
          Hubungi merchant untuk informasi lebih lanjut.
        </p>
      </div>
    </div>
  );
}
