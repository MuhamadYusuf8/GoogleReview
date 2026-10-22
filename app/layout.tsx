import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ReviewLink – Dynamic QR & NFC Redirector", template: "%s | ReviewLink" },
  description: "Platform manajemen tautan dinamis untuk kartu review fisik Google Maps merchant F&B.",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
