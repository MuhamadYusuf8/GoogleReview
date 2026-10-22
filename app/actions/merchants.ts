"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { merchantSchema } from "@/lib/validations";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(): Promise<{ supabase: SupabaseClient<any>; userId: string }> {
  const supabase = await createClient() as SupabaseClient<any>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Tidak terautentikasi");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile as { role: string }).role !== "admin") throw new Error("Akses ditolak");

  return { supabase, userId: user.id };
}

interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function createMerchantAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const raw = {
      name: formData.get("name") as string,
      contact_name: formData.get("contact_name") as string || null,
      contact_phone: formData.get("contact_phone") as string || null,
      google_place_id: formData.get("google_place_id") as string || null,
      notes: formData.get("notes") as string || null,
      is_active: true,
    };

    const parsed = merchantSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { data, error } = await supabase
      .from("merchants")
      .insert(parsed.data)
      .select("id")
      .single();

    if (error) return { success: false, error: "Gagal menyimpan merchant: " + error.message };

    revalidatePath("/admin/merchants");
    return { success: true, id: (data as { id: string }).id };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}

export async function updateMerchantAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const id = formData.get("id") as string;

    const raw = {
      name: formData.get("name") as string,
      contact_name: formData.get("contact_name") as string || null,
      contact_phone: formData.get("contact_phone") as string || null,
      google_place_id: formData.get("google_place_id") as string || null,
      notes: formData.get("notes") as string || null,
      is_active: formData.get("is_active") === "true",
    };

    const parsed = merchantSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { error } = await supabase
      .from("merchants")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: "Gagal memperbarui: " + error.message };

    revalidatePath("/admin/merchants");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}

export async function toggleMerchantStatusAction(
  merchantId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("merchants")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", merchantId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/merchants");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}
