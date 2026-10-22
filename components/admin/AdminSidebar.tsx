"use client";

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

  return (
    <aside className="sidebar">
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
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{
          padding: "10px 12px",
          borderRadius: "var(--radius-md)",
          marginBottom: 8,
        }}>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 2 }}>
            {userName}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </div>
        </div>
        <form action={logoutAction}>
          <button
            id="logout-btn"
            type="submit"
            className="sidebar-nav-item btn-ghost w-full"
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <span className="nav-icon">🚪</span>
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
