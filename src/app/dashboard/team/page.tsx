import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/auth";
import TeamManager from "./TeamManager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const current = await getCurrentUser();
  if (!current || current.role !== "admin") {
    redirect("/dashboard");
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("user_id, email, full_name, role, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load profiles:", error);
  }

  const profiles = (data ?? []) as Profile[];

  return (
    <TeamManager
      initialProfiles={profiles}
      currentUserId={current.userId}
    />
  );
}
