import { z } from "zod";

// ─── Konstanta ────────────────────────────────────────────────────────────────

/** Slug yang tidak boleh digunakan karena konflik dengan rute aplikasi. */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "login", "logout", "r", "_next", "static",
  "public", "favicon", "robots", "sitemap", "health", "status",
]);

/** Domain yang diizinkan sebagai target redirect (allowlist). */
export const ALLOWED_DOMAINS = [
  "search.google.com",
  "www.google.com",
  "google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "g.page",
  "g.co",
];

/** Pola slug valid: huruf kecil, angka, tanda hubung tunggal. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const slugSchema = z
  .string()
  .min(3, "Slug minimal 3 karakter")
  .max(40, "Slug maksimal 40 karakter")
  .regex(SLUG_PATTERN, "Slug hanya boleh huruf kecil, angka, dan tanda hubung")
  .refine((s) => !RESERVED_SLUGS.has(s), "Slug ini tidak tersedia (kata terlarang)");

export const targetUrlSchema = z
  .string()
  .max(2048, "URL terlalu panjang (maks 2048 karakter)")
  .url("URL tidak valid")
  .refine((url) => url.startsWith("https://"), "URL harus menggunakan HTTPS")
  .refine((url) => {
    try {
      const host = new URL(url).hostname;
      return ALLOWED_DOMAINS.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`)
      );
    } catch {
      return false;
    }
  }, `URL harus mengarah ke domain Google yang diizinkan`);

export const merchantSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  contact_name: z.string().max(100).optional().nullable(),
  contact_phone: z.string().max(20).optional().nullable(),
  google_place_id: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const createLinkSchema = z.object({
  merchant_id: z.string().uuid("Merchant tidak valid"),
  slug: slugSchema,
  label: z.string().max(100).optional().nullable(),
  target_url: targetUrlSchema,
});

export const updateLinkSchema = z.object({
  label: z.string().max(100).optional().nullable(),
  target_url: targetUrlSchema,
});

export const updateLinkStatusSchema = z.object({
  status: z.enum(["active", "paused", "archived"]),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalisasi slug: trim dan huruf kecil. */
export function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

/** Buat URL review dari Google Place ID. */
export function buildReviewUrl(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

/** Validasi format slug saat runtime (untuk redirect engine). */
export function isValidSlugFormat(slug: string): boolean {
  return (
    SLUG_PATTERN.test(slug) &&
    slug.length >= 3 &&
    slug.length <= 40
  );
}

/** Verifikasi ulang target_url saat runtime sebelum redirect. */
export function isAllowedTargetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    return ALLOWED_DOMAINS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

/** Format dan normalisasi nomor WhatsApp (standar internasional, e.g. 62812...). */
export function formatWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62") && digits.startsWith("8")) {
    digits = "62" + digits;
  }

  return digits;
}

/** Cek apakah fitur Review Gate (Filter Bintang 1-3 ke WA) aktif. */
export function isReviewGateEnabled(
  notes: string | null | undefined,
  phone: string | null | undefined
): boolean {
  const wa = formatWhatsAppNumber(phone);
  if (!wa) return false;
  if (notes && notes.includes("[review_gate: off]")) return false;
  return true;
}

/** Buat link WhatsApp langsung dengan pesan komplain pre-filled. */
export function buildWhatsAppReviewUrl(
  phone: string,
  merchantName: string,
  rating?: number,
  reason?: string,
  customNote?: string
): string {
  const cleanPhone = formatWhatsAppNumber(phone);
  if (!cleanPhone) return "#";

  let message = `Halo ${merchantName}, saya pelanggan Anda`;
  if (rating) {
    const stars = "⭐".repeat(Math.min(Math.max(rating, 1), 5));
    message += ` (penilaian: ${stars} ${rating}/5)`;
  }
  message += `.\nSaya ingin menyampaikan masukan langsung terkait pelayanan:`;

  if (reason && reason.trim()) {
    message += `\n• Masalah: ${reason.trim()}`;
  }
  if (customNote && customNote.trim()) {
    message += `\n• Detail: ${customNote.trim()}`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// ─── Type exports ─────────────────────────────────────────────────────────────

export type MerchantFormData = z.infer<typeof merchantSchema>;
export type CreateLinkFormData = z.infer<typeof createLinkSchema>;
export type UpdateLinkFormData = z.infer<typeof updateLinkSchema>;

