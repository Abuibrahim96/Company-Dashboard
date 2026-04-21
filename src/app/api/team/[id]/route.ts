import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ForbiddenError, isBootstrapAdminEmail } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  let current;
  try {
    current = await requireAdmin();
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.role !== "admin" && body.role !== "member") {
    return NextResponse.json(
      { error: "role must be 'admin' or 'member'" },
      { status: 400 }
    );
  }
  const nextRole = body.role;

  if (id === current.userId && nextRole !== "admin") {
    return NextResponse.json(
      { error: "You can't demote yourself. Ask another admin." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("Service-role client init failed:", e);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .update({ role: nextRole })
    .eq("user_id", id)
    .select()
    .single();

  if (error || !profile) {
    console.error("Profile update failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update role" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  let current;
  try {
    current = await requireAdmin();
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (id === current.userId) {
    return NextResponse.json(
      { error: "You can't remove yourself." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (e) {
    console.error("Service-role client init failed:", e);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Look up the target's email so we can guard against wiping the
  // last remaining bootstrap admin and locking everyone out.
  const { data: target } = await admin
    .from("profiles")
    .select("email")
    .eq("user_id", id)
    .maybeSingle();

  if (target?.email && isBootstrapAdminEmail(target.email)) {
    return NextResponse.json(
      {
        error:
          "This email is configured as a bootstrap admin. Remove it from DASHBOARD_ADMIN_EMAILS before deleting the user.",
      },
      { status: 400 }
    );
  }

  // Deleting the auth user cascades to profiles via the FK.
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.error("Auth user delete failed:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to remove member" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
