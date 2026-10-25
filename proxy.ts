import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl } from "@/lib/supabase/config";

/**
 * Next.js 16 Proxy (menggantikan middleware.ts)
 * Melindungi rute /admin/* dan menyegarkan sesi Supabase untuk SSR.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimasi Performa: Rute publik (/r/*, /review/*, dll.) tidak membutuhkan verifikasi auth
  const isAuthProtected = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";

  if (!isAuthProtected && !isLoginPage) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session hanya untuk rute admin atau login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteksi rute /admin/*
  if (isAuthProtected) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect admin yang sudah login dari halaman login
  if (isLoginPage && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
