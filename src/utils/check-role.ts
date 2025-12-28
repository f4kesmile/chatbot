import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("User")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  if (!isAdmin) {
    redirect("/");
  }

  return profile;
}