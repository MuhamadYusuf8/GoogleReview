"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/merchants", label: "Merchant", icon: "🏪", exact: false },
  { href: "/admin/links", label: "Links & QR", icon: "🔗", exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: "📈", exact: false },
];

interface AdminSidebarProps {
  userEmail: string;
  userName: string;
}

export default function AdminSidebar({ userEmail, userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Close drawer and reset navigating state on route change
  useEffect(() => {
    setDrawerOpen(false);
    setNavigatingTo(null);
  }, [pathname]);

  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Desktop Sidebar (>= 769px) ── */}
      <aside className="sidebar desktop-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">📍</div>
            <span>ReviewLink</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const isNavigating = navigatingTo === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-${item.label.toLowerCase()}`}
                onClick={() => {
                  if (pathname !== item.href) setNavigatingTo(item.href);
                }}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                style={{ position: "relative" }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isNavigating && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                      boxShadow: "0 0 8px var(--color-primary)",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>


        {/* Footer */}
        <div className="sidebar-footer">
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              marginBottom: 8,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: 2,
              }}
            >
              {userName}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userEmail}
            </div>
          </div>
          <form action={logoutAction}>
            <button
              id="logout-btn"
              type="submit"
              className="sidebar-nav-item btn-ghost w-full"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span className="nav-icon">🚪</span>
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Top Header (< 769px) ── */}
      <header className="mobile-header">
        <Link href="/admin" className="mobile-header-logo">
          <div className="logo-icon-sm">📍</div>
          <span className="mobile-header-title">ReviewLink</span>
        </Link>
        <button
          type="button"
          aria-label="Buka Menu"
          className="mobile-header-btn"
          onClick={() => setDrawerOpen(true)}
          id="mobile-drawer-toggle"
        >
          <span style={{ fontSize: "1.2rem" }}>☰</span>
        </button>
      </header>

      {/* ── Mobile Drawer Overlay (< 769px) ── */}
      {drawerOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <div className="logo-mark">
                <div className="logo-icon-sm">📍</div>
                <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>ReviewLink</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDrawerOpen(false)}
                id="mobile-drawer-close"
                aria-label="Tutup Menu"
              >
                ×
              </button>
            </div>

            {/* Profile Info */}
            <div className="mobile-drawer-profile">
              <div className="profile-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-primary)" }}>
                  {userName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {userEmail}
                </div>
              </div>
            </div>

            {/* Navigation in Drawer */}
            <nav className="mobile-drawer-nav">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout button */}
            <div className="mobile-drawer-footer">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="btn btn-danger w-full"
                  style={{ justifyContent: "center" }}
                >
                  <span>🚪</span>
                  <span>Keluar dari Akun</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation Bar (< 769px) ── */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const isNavigating = navigatingTo === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (pathname !== item.href) setNavigatingTo(item.href);
              }}
              className={`mobile-bottom-item ${isActive ? "active" : ""}`}
            >
              <span
                className="mobile-bottom-icon"
                style={isNavigating ? { transform: "scale(1.2)", transition: "transform 0.15s ease" } : {}}
              >
                {item.icon}
              </span>
              <span className="mobile-bottom-label">
                {isNavigating ? "Memuat..." : item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
