import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };
export const revalidate = 60; // revalidate every 60s

async function getDashboardStats() {
  const supabase = createServiceClient();

  const [merchantsRes, linksRes, scansRes] = await Promise.all([
    supabase.from("merchants").select("id, is_active", { count: "exact" }),
    supabase.from("links").select("id, status", { count: "exact" }),
    supabase
      .from("scan_events")
      .select("id", { count: "exact" })
      .eq("is_bot", false)
      .gte("scanned_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const totalMerchants = merchantsRes.count ?? 0;
  const activeMerchants = merchantsRes.data?.filter((m) => m.is_active).length ?? 0;
  const totalLinks = linksRes.count ?? 0;
  const activeLinks = linksRes.data?.filter((l) => l.status === "active").length ?? 0;
  const scans30d = scansRes.count ?? 0;

  // Recent links
  const { data: recentLinks } = await supabase
    .from("links")
    .select("id, slug, label, status, target_url, merchants(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  return { totalMerchants, activeMerchants, totalLinks, activeLinks, scans30d, recentLinks };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 2 }}>Dashboard</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Selamat datang kembali! Berikut ringkasan performa hari ini.
          </p>
        </div>
        <Link href="/admin/links?new=1" className="btn btn-primary btn-sm" id="header-new-link-btn">
          + Link Baru
        </Link>
      </div>

      <div className="admin-content">
        {/* Stats */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(59,130,246,0.15)" }}>🏪</div>
            <div className="stat-value">{stats.totalMerchants}</div>
            <div className="stat-label">Total Merchant</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-success)", marginTop: 4 }}>
              {stats.activeMerchants} aktif
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)" }}>🔗</div>
            <div className="stat-value">{stats.totalLinks}</div>
            <div className="stat-label">Total Link</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-success)", marginTop: 4 }}>
              {stats.activeLinks} aktif
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(16,185,129,0.15)" }}>📊</div>
            <div className="stat-value">{stats.scans30d.toLocaleString("id")}</div>
            <div className="stat-label">Scan 30 Hari</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
              non-bot
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)" }}>⚡</div>
            <div className="stat-value">&lt;300ms</div>
            <div className="stat-label">Target Latency p95</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 4 }}>
              redirect engine
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>⚡ Aksi Cepat</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/admin/merchants?new=1" className="btn btn-secondary w-full" id="quick-new-merchant-btn">
                🏪 Tambah Merchant Baru
              </Link>
              <Link href="/admin/links?new=1" className="btn btn-secondary w-full" id="quick-new-link-btn">
                🔗 Buat Link & QR Baru
              </Link>
              <Link href="/admin/analytics" className="btn btn-secondary w-full" id="quick-analytics-btn">
                📈 Lihat Analytics
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "1rem", marginBottom: 16 }}>📋 Link Terbaru</h3>
            {!stats.recentLinks || stats.recentLinks.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                Belum ada link. Mulai buat link pertama!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.recentLinks.map((link) => {
                  const merchant = Array.isArray(link.merchants) ? link.merchants[0] : link.merchants;
                  return (
                    <Link
                      key={link.id}
                      href={`/admin/links/${link.id}`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "var(--color-bg-elevated)",
                        borderRadius: "var(--radius-md)",
                        textDecoration: "none",
                        transition: "background var(--transition-fast)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          /{link.slug}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {merchant?.name ?? "—"}
                        </div>
                      </div>
                      <span className={`badge badge-${link.status}`}>{link.status}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="alert alert-info">
          <span>💡</span>
          <div>
            <strong>Tips:</strong> Kartu fisik hanya menyimpan short-link permanen.
            Kamu bisa mengganti Target URL kapan saja dari halaman{" "}
            <Link href="/admin/links" style={{ color: "inherit", textDecoration: "underline" }}>
              Links & QR
            </Link>{" "}
            tanpa perlu cetak ulang kartu.
          </div>
        </div>
      </div>
    </div>
  );
}
