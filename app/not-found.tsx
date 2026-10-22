import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tautan Tidak Ditemukan" };

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "24px",
      background: "var(--color-bg)",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(59,130,246,0.1)", border: "2px solid rgba(59,130,246,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2rem", margin: "0 auto 24px",
        }}>🔗</div>

        <div style={{
          fontSize: "4rem", fontWeight: 800, lineHeight: 1,
          background: "linear-gradient(135deg,#3b82f6,#6366f1)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>404</div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 12 }}>
          Tautan Tidak Ditemukan
        </h1>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: 32 }}>
          Kartu yang kamu pindai tidak terdaftar atau menggunakan kode yang tidak valid.
          Pastikan kamu memindai kartu yang benar.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Butuh bantuan? Hubungi merchant tempat kamu mendapatkan kartu ini.
          </p>
        </div>
      </div>
    </div>
  );
}
