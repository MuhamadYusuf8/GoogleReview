"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createLinkSchema,
  updateLinkSchema,
  updateLinkStatusSchema,
  normalizeSlug,
  RESERVED_SLUGS,
} from "@/lib/validations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(): Promise<{ supabase: SupabaseClient<any>; userId: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function createLinkAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireAdmin();

    const rawSlug = formData.get("slug") as string;
    const slug = normalizeSlug(rawSlug);

    const raw = {
      merchant_id: formData.get("merchant_id") as string,
      slug,
      label: formData.get("label") as string || null,
      target_url: formData.get("target_url") as string,
    };

    const parsed = createLinkSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    if (RESERVED_SLUGS.has(slug)) {
      return { success: false, error: "Slug ini tidak tersedia (kata terlarang)." };
    }

    const { data, error } = await supabase
      .from("links")
      .insert({ ...parsed.data, created_by: userId, status: "active" })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") return { success: false, error: "Slug sudah dipakai. Pilih slug lain." };
      return { success: false, error: "Gagal membuat link: " + error.message };
    }

    const linkId = (data as { id: string }).id;

    // Catat ke riwayat (entry pertama)
    await supabase.from("link_target_history").insert({
      link_id: linkId,
      old_target_url: null,
      new_target_url: parsed.data.target_url,
      changed_by: userId,
    });

    revalidatePath("/admin/links");
    revalidatePath("/admin");
    return { success: true, id: linkId };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}

export async function updateLinkTargetAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireAdmin();
    const linkId = formData.get("link_id") as string;

    const raw = {
      label: formData.get("label") as string || null,
      target_url: formData.get("target_url") as string,
    };

    const parsed = updateLinkSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Ambil URL lama untuk audit trail
    const { data: existing } = await supabase
      .from("links").select("target_url").eq("id", linkId).single();

    const { error } = await supabase
      .from("links")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", linkId);

    if (error) return { success: false, error: "Gagal memperbarui: " + error.message };

    // Catat riwayat jika target_url berubah
    const existingUrl = (existing as { target_url?: string } | null)?.target_url;
    if (existingUrl && existingUrl !== parsed.data.target_url) {
      await supabase.from("link_target_history").insert({
        link_id: linkId,
        old_target_url: existingUrl,
        new_target_url: parsed.data.target_url,
        changed_by: userId,
      });
    }

    revalidatePath("/admin/links");
    revalidatePath(`/admin/links/${linkId}`);
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}

export async function updateLinkStatusAction(
  linkId: string,
  status: "active" | "paused" | "archived"
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();

    const parsed = updateLinkStatusSchema.safeParse({ status });
    if (!parsed.success) {
      return { success: false, error: "Status tidak valid." };
    }

    const { error } = await supabase
      .from("links")
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq("id", linkId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/links");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Terjadi kesalahan" };
  }
}

export async function checkSlugAvailabilityAction(slug: string): Promise<{ available: boolean }> {
  try {
    const { supabase } = await requireAdmin();
    const normalized = normalizeSlug(slug);

    if (RESERVED_SLUGS.has(normalized)) return { available: false };

    const { data } = await supabase
      .from("links").select("id").eq("slug", normalized).maybeSingle();

    return { available: !data };
  } catch {
    return { available: false };
  }
}
