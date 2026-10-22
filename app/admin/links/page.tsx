import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import LinksClient from "@/components/admin/LinksClient";

export const metadata: Metadata = { title: "Links & QR" };
export const revalidate = 30;

export default async function LinksPage() {
  const supabase = createServiceClient();

  const [{ data: links }, { data: merchants }] = await Promise.all([
    supabase
      .from("links")
      .select(`
        id, slug, label, target_url, status, created_at, updated_at,
        merchants(id, name)
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("merchants")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  // Ambil total scan per link (non-bot)
  const linkIds = links?.map((l) => l.id) ?? [];
  let scanCounts: Record<string, number> = {};

  if (linkIds.length > 0) {
    const { data: scans } = await supabase
      .from("scan_events")
      .select("link_id")
      .in("link_id", linkIds)
      .eq("is_bot", false);

    if (scans) {
      scanCounts = scans.reduce((acc, s) => {
        acc[s.link_id] = (acc[s.link_id] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  const linksWithCounts = (links ?? []).map((l) => ({
    ...l,
    scan_count: scanCounts[l.id] ?? 0,
  }));

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 2 }}>Links & QR</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {links?.length ?? 0} link terdaftar
          </p>
        </div>
      </div>
      <div className="admin-content">
        <LinksClient
          initialLinks={linksWithCounts}
          merchants={merchants ?? []}
        />
      </div>
    </div>
  );
}
