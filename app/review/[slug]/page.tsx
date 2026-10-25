import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import {
  isValidSlugFormat,
  normalizeSlug,
  isAllowedTargetUrl,
  formatWhatsAppNumber,
  isReviewGateEnabled,
} from "@/lib/validations";
import ReviewGateClient from "@/components/public/ReviewGateClient";

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("links")
    .select("merchants!inner(name)")
    .eq("slug", slug)
    .maybeSingle();

  const merchant = Array.isArray(data?.merchants) ? data?.merchants[0] : data?.merchants;
  const name = (merchant as { name?: string })?.name ?? "Merchant";

  return {
    title: `Beri Penilaian & Ulasan - ${name}`,
    description: `Sampaikan penilaian dan masukan Anda untuk ${name}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);

  if (!isValidSlugFormat(slug)) {
    notFound();
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("links")
    .select("id, target_url, status, merchants!inner(id, name, is_active, contact_phone, notes)")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    notFound();
  }

  const merchant = Array.isArray(data.merchants)
    ? data.merchants[0]
    : data.merchants;

  // Jika link atau merchant tidak aktif
  if (data.status !== "active" || !merchant?.is_active) {
    redirect("/link-inactive");
  }

  // Jika target_url tidak valid
  if (!isAllowedTargetUrl(data.target_url)) {
    notFound();
  }

  // Jika review gate tidak aktif atau tidak ada nomor WhatsApp, langsung ke Google
  const waNumber = formatWhatsAppNumber(merchant?.contact_phone);
  const isGateActive = isReviewGateEnabled(merchant?.notes, merchant?.contact_phone);

  if (!waNumber || !isGateActive) {
    redirect(data.target_url);
  }

  return (
    <ReviewGateClient
      merchantName={merchant.name}
      slug={slug}
      whatsappPhone={waNumber}
      targetUrl={data.target_url}
    />
  );
}
