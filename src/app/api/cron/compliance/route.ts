import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().split("T")[0];
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const thirtyDaysStr = thirtyDays.toISOString().split("T")[0];

  const { count: expiredCount } = await supabase
    .from("documents")
    .update({ status: "expired" })
    .lt("expiration_date", today)
    .neq("status", "expired");

  const { count: expiringCount } = await supabase
    .from("documents")
    .update({ status: "expiring_soon" })
    .gte("expiration_date", today)
    .lte("expiration_date", thirtyDaysStr)
    .neq("status", "expiring_soon")
    .neq("status", "expired");

  return NextResponse.json({
    success: true,
    expired_updated: expiredCount || 0,
    expiring_soon_updated: expiringCount || 0,
    run_at: new Date().toISOString(),
  });
}
