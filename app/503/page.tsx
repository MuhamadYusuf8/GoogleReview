import type { Metadata } from "next";

export const metadata: Metadata = { title: "Layanan Gangguan" };

export default function ServiceErrorPage() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px", background: "var(--color-bg)",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", margin: "0 auto 24px",
        }}>⚠️</div>

        <div style={{
          fontSize: "4rem", fontWeight: 800, lineHeight: 1,
          background: "linear-gradient(135deg,#ef4444,#f97316)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>503</div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 12 }}>
          Layanan Sementara Tidak Tersedia
        </h1>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
          Sistem sedang mengalami gangguan. Silakan coba lagi dalam beberapa menit.
          Tim kami sudah diberitahu dan sedang menangani masalah ini.
        </p>
      </div>
    </div>
  );
}
