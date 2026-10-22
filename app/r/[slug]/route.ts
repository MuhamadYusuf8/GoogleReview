import { NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isValidSlugFormat, normalizeSlug, isAllowedTargetUrl } from "@/lib/validations";
import { buildScanPayload } from "@/lib/analytics";

export const runtime = "nodejs"; // Benchmark dulu; ganti ke "edge" jika latency lebih baik

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);

  // ── 1. Validasi format slug sebelum menyentuh database ──────────────────
  if (!isValidSlugFormat(slug)) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/404" },
    });
  }

  const supabase = createServiceClient();

  // ── 2. Query database ───────────────────────────────────────────────────
  let data, dbError;
  try {
    const result = await supabase
      .from("links")
      .select("id, target_url, status, merchants!inner(is_active)")
      .eq("slug", slug)
      .single();
    data = result.data;
    dbError = result.error;
  } catch {
    // Database tidak dapat dijangkau
    return new Response(null, {
      status: 302,
      headers: { Location: "/503" },
    });
  }

  // ── 3. Slug tidak ditemukan ─────────────────────────────────────────────
  if (dbError || !data) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/not-found" },
    });
  }

  const merchant = Array.isArray(data.merchants)
    ? data.merchants[0]
    : data.merchants;

  // ── 4. Link atau merchant tidak aktif ───────────────────────────────────
  if (data.status !== "active" || !merchant?.is_active) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/link-inactive" },
    });
  }

  // ── 5. Verifikasi ulang target_url saat runtime (keamanan open redirect) ─
  if (!isAllowedTargetUrl(data.target_url)) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/not-found" },
    });
  }

  // ── 6. Catat scan secara asinkron (tidak memblokir redirect) ────────────
  after(async () => {
    try {
      const payload = buildScanPayload(data.id, request);
      await supabase.from("scan_events").insert(payload);
    } catch {
      // Kegagalan pencatatan tidak mempengaruhi redirect – diabaikan
    }
  });

  // ── 7. Redirect 302 ─────────────────────────────────────────────────────
  return NextResponse.redirect(data.target_url, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
    },
  });
}
