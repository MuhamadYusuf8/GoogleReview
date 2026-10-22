import { createServerClient } from "@supabase/ssr";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseUrl } from "./config";

/**
 * Server-side Supabase client (untuk Server Components & Server Actions).
 * Menggunakan anon key + session cookie admin.
 * Returns typed as `any` to avoid generic inference issues across the codebase.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<SupabaseClient<any>> {
  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component – tidak dapat set cookie, diabaikan.
          }
        },
      },
    }
  );
}

/**
 * Service role client – digunakan HANYA di Route Handlers server-side
 * yang perlu melewati RLS (mis. redirect engine).
 * JANGAN ekspos ke klien – TIDAK PERNAH gunakan NEXT_PUBLIC_ prefix di sini.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): SupabaseClient<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createSupabaseClient<any>(
    getSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
