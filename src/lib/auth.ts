import { createServerSupabase, createServiceRoleClient } from "./supabase-server";

export type UserRole = "admin" | "member";

export interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  userId: string;
  email: string;
  role: UserRole;
  profile: Profile | null;
  isBootstrapAdmin: boolean;
}

function bootstrapAdminEmails(): Set<string> {
  const raw = process.env.DASHBOARD_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return bootstrapAdminEmails().has(email.toLowerCase());
}

/**
 * Resolve the current user, their profile, and effective role.
 * Bootstrap rule: emails in DASHBOARD_ADMIN_EMAILS are always treated as
 * admin and have an admin profile lazily upserted so they appear in the
 * Team list.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const isBootstrap = isBootstrapAdminEmail(user.email);

  // Service-role read avoids the RLS round-trip and works even before the
  // user has a profile row (bootstrap path).
  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return {
      userId: user.id,
      email: user.email,
      role: isBootstrap ? "admin" : "member",
      profile: null,
      isBootstrapAdmin: isBootstrap,
    };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let finalProfile = (profile as Profile | null) ?? null;

  if (isBootstrap) {
    if (!finalProfile) {
      const { data: created } = await admin
        .from("profiles")
        .insert({ user_id: user.id, email: user.email, role: "admin" })
        .select()
        .single();
      finalProfile = (created as Profile | null) ?? null;
    } else if (finalProfile.role !== "admin") {
      const { data: updated } = await admin
        .from("profiles")
        .update({ role: "admin" })
        .eq("user_id", user.id)
        .select()
        .single();
      finalProfile = (updated as Profile | null) ?? finalProfile;
    }
  }

  const role: UserRole = isBootstrap
    ? "admin"
    : finalProfile?.role ?? "member";

  return {
    userId: user.id,
    email: user.email,
    role,
    profile: finalProfile,
    isBootstrapAdmin: isBootstrap,
  };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current || current.role !== "admin") {
    throw new ForbiddenError();
  }
  return current;
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}
