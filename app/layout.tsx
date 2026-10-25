import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import NavigationProgress from "@/components/common/NavigationProgress";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0f1e",
};

export const metadata: Metadata = {
  title: { default: "ReviewLink – Dynamic QR & NFC Redirector", template: "%s | ReviewLink" },
  description: "Platform manajemen tautan dinamis untuk kartu review fisik Google Maps merchant F&B.",
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

