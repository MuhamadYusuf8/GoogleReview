/**
 * Helper konfigurasi Supabase dengan sanitasi URL otomatis.
 * Memastikan URL tidak memiliki trailing slash atau suffix '/rest/v1' yang tidak sengaja tertempel.
 */
export function getSupabaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  url = url.trim().replace(/\/+$/, "");
  url = url.replace(/\/rest\/v1\/?$/, "");
  return url;
}
