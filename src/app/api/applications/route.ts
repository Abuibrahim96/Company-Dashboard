import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { full_name, phone, email, cdl_class, truck_year, truck_make, truck_model, num_trucks, notes } = body;

  if (!full_name || !phone || !email) {
    return NextResponse.json({ error: "Name, phone, and email are required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.from("applications").insert({
    full_name, phone, email,
    cdl_class: cdl_class || null,
    truck_year: truck_year || null,
    truck_make: truck_make || null,
    truck_model: truck_model || null,
    num_trucks: num_trucks ? parseInt(num_trucks, 10) : 1,
    notes: notes || null,
  }).select().single();

  if (error) {
    console.error("Application insert error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
