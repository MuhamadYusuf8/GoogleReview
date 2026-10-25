"use client";

import { useState, useEffect, useRef } from "react";
import { buildWhatsAppReviewUrl } from "@/lib/validations";

interface ReviewGateClientProps {
  merchantName: string;
  slug: string;
  whatsappPhone: string;
  targetUrl: string;
}

const COMMON_ISSUES = [
  "Pelayanan kurang ramah",
  "Waktu tunggu lama",
  "Kualitas makanan/minuman",
  "Kebersihan tempat",
  "Pesanan tidak sesuai",
  "Masalah kasir/pembayaran",
];

const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  1: { text: "Sangat Kecewa", emoji: "😞", color: "#ef4444" },
  2: { text: "Kurang Memuaskan", emoji: "🙁", color: "#f97316" },
  3: { text: "Cukup / Biasa Saja", emoji: "😐", color: "#eab308" },
  4: { text: "Puas & Menyenangkan", emoji: "😊", color: "#22c55e" },
  5: { text: "Sangat Puas / Luar Biasa!", emoji: "🤩", color: "#10b981" },
};

export default function ReviewGateClient({
  merchantName,
  whatsappPhone,
  targetUrl,
}: ReviewGateClientProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [customNote, setCustomNote] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(3);
  const [autoRedirecting, setAutoRedirecting] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayRating = hoverRating ?? rating ?? 0;
  const isHighRating = rating !== null && rating >= 4;
  const isLowRating = rating !== null && rating <= 3;

  // Auto-redirect timer untuk rating tinggi (4-5) ke Google Review
  useEffect(() => {
    if (isHighRating && autoRedirecting) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            window.location.href = targetUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHighRating, autoRedirecting, targetUrl]);

  const handleSelectRating = (selected: number) => {
    setRating(selected);
    if (selected >= 4) {
      setAutoRedirecting(true);
      setCountdown(2);
    } else {
      setAutoRedirecting(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleOpenWhatsApp = () => {
    const waUrl = buildWhatsAppReviewUrl(
      whatsappPhone,
      merchantName,
      rating ?? undefined,
      selectedIssue,
      customNote
    );
    window.location.href = waUrl;
  };

  const initialLetter = merchantName.charAt(0).toUpperCase() || "M";

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px",
      background: "radial-gradient(ellipse at 50% 0%, #1e293b 0%, #0a0f1e 70%)",
      fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      color: "#f1f5f9",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 440,
        background: "rgba(17, 24, 39, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 24,
        padding: "32px 24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.1)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow ambient background */}
        <div style={{
          position: "absolute",
          top: -60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 200,
          height: 120,
          background: isHighRating
            ? "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)"
            : isLowRating
            ? "radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          transition: "all 0.5s ease",
        }} />

        {/* Merchant Avatar */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#fff",
          margin: "0 auto 16px",
          boxShadow: "0 8px 20px rgba(59, 130, 246, 0.4)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}>
          {initialLetter}
        </div>

        {/* Merchant Name */}
        <h1 style={{
          fontSize: "1.35rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#f8fafc",
          marginBottom: 6,
        }}>
          {merchantName}
        </h1>

        {/* ── STEP 1: PILIH BINTANG (JIKA BELUM MEMILIH) ───────────────────────── */}
        {rating === null ? (
          <div>
            <p style={{
              fontSize: "0.95rem",
              color: "#94a3b8",
              marginBottom: 24,
              lineHeight: 1.5,
            }}>
              Bagaimana pengalaman Anda hari ini bersama kami?
            </p>

            {/* 5 Stars Rating Bar */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginBottom: 16,
            }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isHovered = hoverRating !== null && star <= hoverRating;
                const isSelected = rating !== null && star <= rating;
                const isActive = isHovered || isSelected;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleSelectRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 4,
                      cursor: "pointer",
                      transition: "transform 0.15s ease",
                      transform: isActive ? "scale(1.2)" : "scale(1)",
                      outline: "none",
                    }}
                    aria-label={`Beri nilai ${star} bintang`}
                  >
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      fill={isActive ? "#fbbf24" : "rgba(255, 255, 255, 0.15)"}
                      stroke={isActive ? "#f59e0b" : "rgba(255, 255, 255, 0.3)"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: isActive ? "drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Label underneath */}
            <div style={{
              minHeight: 28,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: displayRating > 0 ? RATING_LABELS[displayRating]?.color : "#64748b",
              transition: "color 0.2s ease",
            }}>
              {displayRating > 0 ? (
                <span>
                  {RATING_LABELS[displayRating]?.emoji} {RATING_LABELS[displayRating]?.text}
                </span>
              ) : (
                <span style={{ color: "#64748b" }}>Sentuh bintang untuk menilai</span>
              )}
            </div>
          </div>
        ) : null}

        {/* ── STEP 2A: RATING TINGGI (BINTANG 4 & 5) ➔ KE GOOGLE REVIEWS ───────── */}
        {isHighRating ? (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              fontSize: "2.5rem",
              marginBottom: 10,
              animation: "bounce 0.6s ease",
            }}>
              🎉
            </div>

            <div style={{
              display: "inline-block",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "4px 14px",
              borderRadius: 20,
              marginBottom: 12,
              border: "1px solid rgba(16, 185, 129, 0.3)",
            }}>
              ⭐ {rating}/5 Bintang · Luar Biasa!
            </div>

            <h2 style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: 8,
            }}>
              Terima Kasih Banyak!
            </h2>

            <p style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: 20,
            }}>
              Dukungan Anda sangat berarti bagi tim kami. Mohon luangkan 10 detik untuk menulis ulasan di <strong>Google Maps</strong>.
            </p>

            {/* Tombol Menuju Google Review */}
            <a
              href={targetUrl}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
                transition: "transform 0.15s ease",
              }}
            >
              ⭐⭐⭐⭐⭐ Tulis Ulasan di Google Maps →
            </a>

            {/* Countdown notice */}
            {autoRedirecting && countdown > 0 && (
              <p style={{
                fontSize: "0.8125rem",
                color: "#64748b",
                marginTop: 14,
              }}>
                Mengalihkan otomatis dalam {countdown} detik...
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setRating(null);
                setAutoRedirecting(false);
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "0.8125rem",
                cursor: "pointer",
                marginTop: 16,
                textDecoration: "underline",
              }}
            >
              ← Ubah penilaian
            </button>
          </div>
        ) : null}

        {/* ── STEP 2B: RATING RENDAH (BINTANG 1, 2, 3) ➔ KE WHATSAPP OWNER ────── */}
        {isLowRating ? (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{
              fontSize: "2.5rem",
              marginBottom: 10,
            }}>
              🙏
            </div>

            <div style={{
              display: "inline-block",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#fbbf24",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "4px 14px",
              borderRadius: 20,
              marginBottom: 12,
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}>
              ⭐ {rating}/5 Bintang · Masukan Pelanggan
            </div>

            <h2 style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: 8,
            }}>
              Mohon Maaf Atas Ketidaknyamanannya
            </h2>

            <p style={{
              fontSize: "0.85rem",
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: 16,
            }}>
              Kepuasan Anda sangat penting bagi kami. Sampaikan kritik dan keluhan Anda langsung ke <strong>Owner / Manajemen</strong> via WhatsApp agar segera kami perbaiki.
            </p>

            {/* Quick issue chips */}
            <div style={{ marginBottom: 12, textAlign: "left" }}>
              <label style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#94a3b8",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                Pilih kendala yang dialami:
              </label>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}>
                {COMMON_ISSUES.map((issue) => {
                  const isSelected = selectedIssue === issue;
                  return (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => setSelectedIssue(isSelected ? "" : issue)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.775rem",
                        borderRadius: 20,
                        border: isSelected
                          ? "1px solid #10b981"
                          : "1px solid rgba(255, 255, 255, 0.12)",
                        background: isSelected
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(255, 255, 255, 0.05)",
                        color: isSelected ? "#34d399" : "#cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {issue}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional message input */}
            <div style={{ marginBottom: 16 }}>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Tulis kritik atau saran tambahan (opsional)..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "0.85rem",
                  borderRadius: 12,
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f1f5f9",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Tombol WhatsApp Owner */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                padding: "14px 20px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(37, 211, 102, 0.35)",
                transition: "transform 0.15s ease",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Chat WhatsApp Owner Toko
            </button>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              fontSize: "0.775rem",
              color: "#64748b",
            }}>
              <button
                type="button"
                onClick={() => setRating(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                ← Ubah nilai
              </button>

              <a
                href={targetUrl}
                style={{
                  color: "#475569",
                  textDecoration: "none",
                }}
              >
                Tetap ke Google Maps →
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
