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

// ─── Type exports ─────────────────────────────────────────────────────────────

export type MerchantFormData = z.infer<typeof merchantSchema>;
export type CreateLinkFormData = z.infer<typeof createLinkSchema>;
export type UpdateLinkFormData = z.infer<typeof updateLinkSchema>;
