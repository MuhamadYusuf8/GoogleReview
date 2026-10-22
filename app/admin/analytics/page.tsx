import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import AnalyticsClient from "@/components/admin/AnalyticsClient";

export const metadata: Metadata = { title: "Analytics" };
export const revalidate = 60;

export default async function AnalyticsPage() {
  const supabase = createServiceClient();
  const now = new Date();
  const from30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const from7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: total30d },
    { count: total7d },
    { data: bySource },
    { data: byLink },
    { data: byDay },
  ] = await Promise.all([
    supabase
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .eq("is_bot", false)
      .gte("scanned_at", from30d),

    supabase
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .eq("is_bot", false)
      .gte("scanned_at", from7d),

    supabase
      .from("scan_events")
      .select("source")
      .eq("is_bot", false)
      .gte("scanned_at", from30d),

    supabase
      .from("scan_events")
      .select("link_id, links(slug, label, merchants(name))")
      .eq("is_bot", false)
      .gte("scanned_at", from30d),

    supabase
      .from("scan_events")
      .select("scanned_at")
      .eq("is_bot", false)
      .gte("scanned_at", from30d)
      .order("scanned_at", { ascending: true }),
  ]);

  // Aggregate by source
  const sourceAgg = { qr: 0, nfc: 0, unknown: 0 };
  bySource?.forEach((e) => {
    sourceAgg[e.source as keyof typeof sourceAgg]++;
  });

  // Aggregate by link
  const linkAgg: Record<string, { slug: string; label: string | null; merchant: string; count: number }> = {};
  byLink?.forEach((e) => {
    if (!linkAgg[e.link_id]) {
      const link = Array.isArray(e.links) ? e.links[0] : e.links;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linkAny = link as any;
      const merchantsField = linkAny?.merchants;
      const merchant = Array.isArray(merchantsField)
        ? merchantsField[0]?.name
        : merchantsField?.name;
      linkAgg[e.link_id] = {
        slug: linkAny?.slug ?? "—",
        label: linkAny?.label ?? null,
        merchant: merchant ?? "—",
        count: 0,
      };
    }
    linkAgg[e.link_id].count++;
  });
  const topLinks = Object.values(linkAgg).sort((a, b) => b.count - a.count).slice(0, 10);

  // Aggregate by day
  const dayAgg: Record<string, number> = {};
  byDay?.forEach((e) => {
    const day = e.scanned_at.slice(0, 10);
    dayAgg[day] = (dayAgg[day] ?? 0) + 1;
  });
  const dailyData = Object.entries(dayAgg).map(([date, count]) => ({ date, count }));

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 2 }}>Analytics</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Data scan & tap kartu review (non-bot)
          </p>
        </div>
      </div>
      <div className="admin-content">
        <AnalyticsClient
          total30d={total30d ?? 0}
          total7d={total7d ?? 0}
          sourceAgg={sourceAgg}
          topLinks={topLinks}
          dailyData={dailyData}
        />
      </div>
    </div>
  );
}
