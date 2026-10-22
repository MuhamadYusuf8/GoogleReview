"use client";

import { useRef, useCallback } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

interface QRGeneratorProps {
  slug: string;
  shortDomain?: string;
}

export default function QRGenerator({ slug, shortDomain }: QRGeneratorProps) {
  let rawDomain = shortDomain ?? process.env.NEXT_PUBLIC_SHORT_DOMAIN ?? "go.reviewku.id";
  rawDomain = rawDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Localhost menggunakan http://, production / custom domain menggunakan https://
  const isLocal =
    rawDomain.startsWith("localhost") ||
    rawDomain.startsWith("127.0.0.1") ||
    rawDomain.startsWith("192.168.");
  const protocol = isLocal ? "http" : "https";

  const qrUrl = `${protocol}://${rawDomain}/r/${slug}?s=qr`;
  const nfcUrl = `${protocol}://${rawDomain}/r/${slug}?s=nfc`;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const downloadPNG = useCallback(() => {
    // Render at high resolution: scale up then download
    const size = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Draw from the QRCodeCanvas element
    const srcCanvas = document.getElementById(`qr-canvas-${slug}`) as HTMLCanvasElement;
    if (!srcCanvas) return;
    ctx.drawImage(srcCanvas, 0, 0, size, size);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${slug}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [slug]);

  const downloadSVG = useCallback(() => {
    const svgEl = document.getElementById(`qr-svg-${slug}`) as SVGElement | null;
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${slug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [slug]);

  const copyNfcUrl = useCallback(() => {
    navigator.clipboard.writeText(nfcUrl).then(() => {
      const btn = document.getElementById(`copy-nfc-${slug}`);
      if (btn) {
        btn.textContent = "✅ Tersalin!";
        setTimeout(() => { if (btn) btn.textContent = "📋 Salin URL NFC"; }, 2000);
      }
    });
  }, [nfcUrl, slug]);

  return (
    <div>
      {/* QR Preview */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div className="qr-preview-container">
          <QRCodeCanvas
            id={`qr-canvas-${slug}`}
            value={qrUrl}
            size={200}
            level="Q"
            bgColor="#ffffff"
            fgColor="#000000"
            style={{ display: "block" }}
          />
        </div>
        {/* Hidden SVG for SVG download */}
        <div style={{ display: "none" }}>
          <QRCodeSVG
            id={`qr-svg-${slug}`}
            value={qrUrl}
            size={1200}
            level="Q"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-primary)",
              background: "var(--color-bg-elevated)",
              padding: "6px 14px",
              borderRadius: "var(--radius-sm)",
              wordBreak: "break-all",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
              border: "1px solid var(--color-border)",
            }}
            title="Klik untuk uji redirect di tab baru"
          >
            <span>🔗 {qrUrl}</span>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>↗</span>
          </a>
        </div>
      </div>

      {/* Download buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          id={`download-png-${slug}`}
          className="btn btn-primary btn-sm"
          onClick={downloadPNG}
          style={{ flex: "1 1 140px", minHeight: 44 }}
        >
          ⬇️ Download PNG (1200px)
        </button>
        <button
          id={`download-svg-${slug}`}
          className="btn btn-secondary btn-sm"
          onClick={downloadSVG}
          style={{ flex: "1 1 140px", minHeight: 44 }}
        >
          ⬇️ Download SVG
        </button>
      </div>

      {/* NFC URL */}
      <div style={{
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
      }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>
          📱 URL untuk chip NFC (NDEF URI)
        </div>
        <code style={{
          fontSize: "0.8125rem",
          color: "var(--color-primary)",
          wordBreak: "break-all",
          display: "block",
          marginBottom: 10,
          background: "rgba(0,0,0,0.25)",
          padding: "8px 10px",
          borderRadius: "var(--radius-sm)",
        }}>
          {nfcUrl}
        </code>
        <button
          id={`copy-nfc-${slug}`}
          className="btn btn-secondary btn-sm"
          onClick={copyNfcUrl}
          style={{ width: "100%", minHeight: 40, justifyContent: "center" }}
        >
          📋 Salin URL NFC
        </button>
      </div>
    </div>
  );
}
