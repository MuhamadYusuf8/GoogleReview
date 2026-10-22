"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ActionState {
  error: string | null;
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as SupabaseClient<any>;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    console.error("Supabase auth error:", error?.message, error?.status);
    return { 
      error: error?.message === "Invalid login credentials"
        ? "Email atau password salah. Silakan coba lagi."
        : error?.message || "Gagal masuk. Silakan coba lagi." 
    };
  }

  // Verifikasi role admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile || (profile as { role: string }).role !== "admin") {
    console.error("Role admin verification failed:", profileError, profile);
    await supabase.auth.signOut();
    return { error: "Akun Anda tidak memiliki hak akses admin." };
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
