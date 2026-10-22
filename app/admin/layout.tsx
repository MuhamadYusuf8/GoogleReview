import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") redirect("/login");

  return (
    <div className="admin-layout">
      <AdminSidebar
        userEmail={user.email ?? ""}
        userName={profile.full_name ?? user.email ?? "Admin"}
      />
      <div className="admin-main">{children}</div>
    </div>
  );
}
