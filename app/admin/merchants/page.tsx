import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import MerchantsClient from "@/components/admin/MerchantsClient";

export const metadata: Metadata = { title: "Merchant" };
export const revalidate = 30;

export default async function MerchantsPage() {
  const supabase = createServiceClient();

  const { data: merchants } = await supabase
    .from("merchants")
    .select(`
      id, name, contact_name, contact_phone, google_place_id, notes, is_active, created_at,
      links(count)
    `)
    .order("name", { ascending: true });

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 2 }}>Merchant</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {merchants?.length ?? 0} merchant terdaftar
          </p>
        </div>
      </div>
      <div className="admin-content">
        <MerchantsClient initialMerchants={merchants ?? []} />
      </div>
    </div>
  );
}
