import { Resend } from "resend";

export interface ApplicationPayload {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  cdl_class: string | null;
  truck_year: string | null;
  truck_make: string | null;
  truck_model: string | null;
  num_trucks: number;
  notes: string | null;
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function formatTruck(app: ApplicationPayload): string {
  const parts = [app.truck_year, app.truck_make, app.truck_model]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return parts.length === 0 ? "—" : parts.join(" ");
}

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first || "there";
}

export async function sendOwnerNotification(
  app: ApplicationPayload
): Promise<void> {
  const resend = getResend();
  const from = requireEnv("APPLICATIONS_FROM");
  const to = requireEnv("APPLICATIONS_NOTIFY_TO");

  const text = [
    "A new driver has applied to drive with Elite Trucking.",
    "",
    `Name:          ${app.full_name}`,
    `Phone:         ${app.phone}`,
    `Email:         ${app.email}`,
    `CDL Class:     ${app.cdl_class ?? "—"}`,
    `Truck:         ${formatTruck(app)}`,
    `# of trucks:   ${app.num_trucks}`,
    `Notes:         ${app.notes ?? "—"}`,
    "",
    `Application ID: ${app.id}`,
    "",
    "Reply to this email to contact the applicant directly.",
  ].join("\n");

  const result = await resend.emails.send({
    from,
    to,
    replyTo: app.email,
    subject: `New driver application — ${app.full_name}`,
    text,
  });

  if (result.error) {
    throw new Error(`Resend owner email failed: ${JSON.stringify(result.error)}`);
  }
}

export async function sendApplicantConfirmation(
  app: ApplicationPayload
): Promise<void> {
  const resend = getResend();
  const from = requireEnv("APPLICATIONS_FROM");

  const text = [
    `Hi ${firstName(app.full_name)},`,
    "",
    "Thanks for applying to drive with Elite Trucking. We've received",
    "your application and our team will review it and reach out within",
    "1-2 business days.",
    "",
    "If you need to reach us sooner, reply to this email or call us.",
    "",
    "— The Elite Trucking team",
  ].join("\n");

  const result = await resend.emails.send({
    from,
    to: app.email,
    subject: "We got your application — Elite Trucking",
    text,
  });

  if (result.error) {
    throw new Error(
      `Resend applicant email failed: ${JSON.stringify(result.error)}`
    );
  }
}
