import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  sendOwnerNotification,
  sendApplicantConfirmation,
  type ApplicationPayload,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!full_name || !phone || !email) {
    return NextResponse.json(
      { error: "Name, phone, and email are required" },
      { status: 400 }
    );
  }

  const cdl_class = typeof body.cdl_class === "string" && body.cdl_class ? body.cdl_class : null;
  const truck_year = typeof body.truck_year === "string" && body.truck_year ? body.truck_year : null;
  const truck_make = typeof body.truck_make === "string" && body.truck_make ? body.truck_make : null;
  const truck_model = typeof body.truck_model === "string" && body.truck_model ? body.truck_model : null;
  const notes = typeof body.notes === "string" && body.notes ? body.notes : null;

  const parsedNumTrucks = typeof body.num_trucks === "string" && body.num_trucks
    ? parseInt(body.num_trucks, 10)
    : typeof body.num_trucks === "number"
      ? body.num_trucks
      : 1;
  const num_trucks = Number.isFinite(parsedNumTrucks) && parsedNumTrucks > 0 ? parsedNumTrucks : 1;

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("applications")
    .insert({
      full_name,
      phone,
      email,
      cdl_class,
      truck_year,
      truck_make,
      truck_model,
      num_trucks,
      notes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Application insert error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }

  const payload: ApplicationPayload = {
    id: data.id,
    full_name,
    phone,
    email,
    cdl_class,
    truck_year,
    truck_make,
    truck_model,
    num_trucks,
    notes,
  };

  const emailResults = await Promise.allSettled([
    sendOwnerNotification(payload),
    sendApplicantConfirmation(payload),
  ]);
  const labels = ["owner notification", "applicant confirmation"];
  emailResults.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(
        `Email (${labels[i]}) failed for application ${data.id}:`,
        result.reason
      );
    }
  });

  return NextResponse.json({ success: true, id: data.id });
}
