import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ForbiddenError } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    throw e;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role === "admin" ? "admin" : "member";
  const fullName =
    typeof body.full_name === "string" && body.full_name.trim()
      ? body.full_name.trim()
      : null;

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required" },
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

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email);

  if (inviteError || !invited?.user) {
    console.error("Supabase invite failed:", inviteError);
    return NextResponse.json(
      { error: inviteError?.message ?? "Failed to send invite" },
      { status: 500 }
    );
  }

  const userId = invited.user.id;

  const { data: profile, error: upsertError } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        email,
        full_name: fullName,
        role,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (upsertError) {
    console.error("Profile upsert failed:", upsertError);
    return NextResponse.json(
      { error: "User invited but profile save failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile });
}
