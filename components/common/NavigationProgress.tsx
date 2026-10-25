"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [, startTransition] = useTransition();

  // Reset/complete on route change
  useEffect(() => {
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  const startProgress = useCallback(() => {
    setVisible(true);
    setProgress(20);

    const t1 = setTimeout(() => {
      setProgress((prev) => (prev < 65 ? 65 : prev));
    }, 120);

    const t2 = setTimeout(() => {
      setProgress((prev) => (prev < 85 ? 85 : prev));
    }, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Intercept all internal link clicks for instant feedback
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, anchor, target="_blank", or modifier clicks (Ctrl/Cmd/Shift)
      if (
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if it's the exact same pathname + search
      try {
        const url = new URL(href, window.location.href);
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      startTransition(() => {
        startProgress();
      });
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
    };
  }, [startProgress]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: 3,
        zIndex: 999999,
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 40%, #ec4899 80%, #38bdf8 100%)",
          boxShadow: "0 0 16px rgba(99, 102, 241, 0.8), 0 0 8px rgba(236, 72, 153, 0.6)",
          borderRadius: "0 2px 2px 0",
          transition: progress === 100 ? "width 0.15s ease, opacity 0.25s ease" : "width 0.3s cubic-bezier(0.1, 0.7, 0.1, 1)",
          opacity: visible ? 1 : 0,
        }}
      />
      {/* Subtle pulse spinner on top right corner */}
      <div
        style={{
          position: "fixed",
          top: 14,
          right: 18,
          width: 14,
          height: 14,
          borderRadius: "50%",
          border: "2px solid rgba(99, 102, 241, 0.2)",
          borderTopColor: "#6366f1",
          animation: "spin 0.6s linear infinite",
          opacity: visible && progress < 90 ? 1 : 0,
          transition: "opacity 0.2s ease",
          zIndex: 999999,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
