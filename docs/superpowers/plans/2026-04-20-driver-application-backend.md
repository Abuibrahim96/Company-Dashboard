# Driver Application Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken `/drive-with-us` application submission and send owner + applicant emails via Resend when a new application arrives.

**Architecture:** The existing `POST /api/applications` route is rewritten to use the Supabase service-role key (bypasses the RLS/`.select().single()` bug) and, after a successful insert, sends two plain-text emails via Resend using `Promise.allSettled` so email failures never fail the submission. A new `src/lib/email.ts` module holds the Resend wrapper and both templates. No test framework is added — verification is done via `curl` and end-to-end browser tests against the local dev server and the live site.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase (`@supabase/supabase-js`), Resend (`resend` SDK), Vercel.

**Spec:** `docs/superpowers/specs/2026-04-20-driver-application-backend-design.md`

---

## File Structure

| Path | Change | Responsibility |
|---|---|---|
| `src/app/api/applications/route.ts` | Modify (full rewrite) | POST handler: validate, insert, send emails, respond |
| `src/lib/email.ts` | Create | Resend client wrapper + `sendOwnerNotification` + `sendApplicantConfirmation` + templates |
| `src/lib/supabase-server.ts` | Reuse as-is | Already exports `createServiceRoleClient()` — used by the API route |
| `package.json` / `package-lock.json` | Modify | Add `resend` dependency |
| `.env.local` | Modify | Add `RESEND_API_KEY`, `APPLICATIONS_NOTIFY_TO`, `APPLICATIONS_FROM` |
| Vercel project env vars | Modify (manual) | Same three vars for Production + Preview |

No test files — this project has no test framework configured, and adding one for two small functions is overkill. Verification is manual per task.

---

## Prerequisites (owner does these before or during Task 1)

Implementation can start, but end-to-end success depends on:

1. **Supabase migration applied.** In the Supabase dashboard Table Editor, confirm the `applications` table exists. If it doesn't, paste `supabase/migrations/001_initial_schema.sql` into the SQL Editor and run it.
2. **Resend account created** at [resend.com](https://resend.com).
3. **Domain `elitetrucking.xyz` verified in Resend** — add the SPF TXT + 2× DKIM CNAME records shown in the Resend dashboard to the DNS provider, then click Verify. May take minutes to an hour.
4. **Resend API key** created (send-only permission).
5. **`info@elitetrucking.xyz` mailbox exists** somewhere that actually receives email (Google Workspace, Zoho, etc.). Resend does not host inboxes — it only sends.

---

## Task 1: Verify prerequisites & install dependency

**Files:**
- Modify: `/Users/abuibrahim/Desktop/EliteTrucking/package.json`
- Modify: `/Users/abuibrahim/Desktop/EliteTrucking/package-lock.json`

- [ ] **Step 1: Confirm the `applications` table exists in live Supabase**

Open the Supabase dashboard for project `qvrgmbuovhywvurpbxcm` (from `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`). Go to **Table Editor**. Confirm a table named `applications` is listed with columns `full_name, phone, email, cdl_class, truck_year, truck_make, truck_model, num_trucks, notes, status, created_at, updated_at`.

If it doesn't exist: open **SQL Editor**, paste the full contents of `/Users/abuibrahim/Desktop/EliteTrucking/supabase/migrations/001_initial_schema.sql`, run it. Confirm the table now exists.

Expected outcome: `applications` table exists in the live project.

- [ ] **Step 2: Confirm Resend API key is available**

Ask the user for the Resend API key (starts with `re_`). If they don't have one yet, pause and tell them to complete the Resend setup (account + domain verification + API key creation) before proceeding. Do not guess or fabricate a key.

- [ ] **Step 3: Install the `resend` package**

Run from `/Users/abuibrahim/Desktop/EliteTrucking`:

```bash
npm install resend
```

Expected: `resend` is added to `dependencies` in `package.json` and `package-lock.json` is updated. No peer-dep warnings that are blockers.

- [ ] **Step 4: Commit the dependency**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
git add package.json package-lock.json
git commit -m "deps: add resend for transactional email"
```

---

## Task 2: Add environment variables

**Files:**
- Modify: `/Users/abuibrahim/Desktop/EliteTrucking/.env.local`

- [ ] **Step 1: Add the three new env vars to `.env.local`**

Append to `/Users/abuibrahim/Desktop/EliteTrucking/.env.local`:

```
RESEND_API_KEY=<paste the re_... key from the user>
APPLICATIONS_NOTIFY_TO=info@elitetrucking.xyz
APPLICATIONS_FROM=Elite Trucking <apply@elitetrucking.xyz>
```

Use the exact API key provided by the user. Do NOT commit `.env.local` — it's already in `.gitignore` (verify with `grep -q "^\.env" .gitignore`).

- [ ] **Step 2: Verify `.env.local` is gitignored**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
git check-ignore .env.local
```

Expected output: `.env.local` (meaning git is ignoring it).

If not ignored: STOP. Do not proceed until `.env.local` is confirmed ignored — committing the API key would be a security incident.

- [ ] **Step 3: Tell the user to add the same three vars to Vercel**

Print to the user:

> Add these three environment variables to the Vercel project (Settings → Environment Variables → both Production and Preview):
> - `RESEND_API_KEY` = `<the re_... key>`
> - `APPLICATIONS_NOTIFY_TO` = `info@elitetrucking.xyz`
> - `APPLICATIONS_FROM` = `Elite Trucking <apply@elitetrucking.xyz>`
>
> Without these, the deployed site will 500 on application submissions.

Do not attempt to set Vercel env vars programmatically — this is a manual step for the owner.

No commit in this task (nothing was staged).

---

## Task 3: Create `src/lib/email.ts`

**Files:**
- Create: `/Users/abuibrahim/Desktop/EliteTrucking/src/lib/email.ts`

- [ ] **Step 1: Create the email module**

Create `/Users/abuibrahim/Desktop/EliteTrucking/src/lib/email.ts` with this exact content:

```ts
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
```

Key design choices locked in by this code:
- **Lazy client construction** (`getResend()` inside each function) — matches the pattern from commit `62f64b0` so Vercel build doesn't break when env vars aren't available at build time.
- **`replyTo: app.email`** on owner email — replying in the inbox goes to the driver.
- **Throw on Resend error** — callers are expected to wrap in `allSettled` so a thrown error is logged but doesn't crash the request.

- [ ] **Step 2: Type-check the new file**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
npx tsc --noEmit
```

Expected: no new errors attributable to `src/lib/email.ts`. (Any pre-existing errors elsewhere are out of scope.)

- [ ] **Step 3: Commit**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
git add src/lib/email.ts
git commit -m "feat: add Resend email wrapper for application notifications"
```

---

## Task 4: Rewrite `src/app/api/applications/route.ts`

**Files:**
- Modify: `/Users/abuibrahim/Desktop/EliteTrucking/src/app/api/applications/route.ts`

- [ ] **Step 1: Replace the file contents**

Overwrite `/Users/abuibrahim/Desktop/EliteTrucking/src/app/api/applications/route.ts` with:

```ts
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
```

Key choices locked in:
- **Service-role client** via existing helper `createServiceRoleClient()` — fixes the original bug.
- **Normalization happens before both DB and email** — emails receive the same values that went into the DB, avoiding drift between what's stored and what the owner sees in the notification.
- **`Promise.allSettled`** — both emails are attempted even if one fails; neither can fail the request.
- **`console.error` logs include the application id** — so a missed email can be manually followed up on.

- [ ] **Step 2: Type-check**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
git add src/app/api/applications/route.ts
git commit -m "fix: use service role and send email notifications on new applications

Fixes a bug where the anon key + .select().single() would always 500 because
anon has no SELECT policy on the applications table. Switches to the
service-role client (server-only) and adds owner + applicant email
notifications via Resend. Email failures are logged but do not fail the
request, so an application is never lost to a transient Resend issue."
```

---

## Task 5: Local end-to-end verification

**Files:** none modified

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
npm run dev
```

Wait for `Ready` / the local URL to print. Leave this running in the background.

- [ ] **Step 2: Submit a happy-path application via curl**

In a new shell:

```bash
curl -i -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Driver",
    "phone": "(555) 123-4567",
    "email": "YOUR_REAL_TEST_INBOX@example.com",
    "cdl_class": "A",
    "truck_year": "2021",
    "truck_make": "Freightliner",
    "truck_model": "Cascadia",
    "num_trucks": "2",
    "notes": "Plan verification test"
  }'
```

Replace `YOUR_REAL_TEST_INBOX@example.com` with an inbox you actually control (so you can confirm the applicant email arrives).

Expected: HTTP 200, body `{"success":true,"id":"<uuid>"}`.

- [ ] **Step 3: Verify the row in Supabase**

In Supabase Table Editor, open the `applications` table. Confirm a row appears with `full_name = "Test Driver"` and the `id` matching the curl response. `num_trucks` should be `2`.

- [ ] **Step 4: Verify the applicant email arrives**

Check the inbox used in Step 2. Within ~30 seconds you should see a plain-text email from `Elite Trucking <apply@elitetrucking.xyz>` with subject `We got your application — Elite Trucking`. Check spam if it's not in the main inbox.

- [ ] **Step 5: Verify the owner email arrives**

Check the `info@elitetrucking.xyz` inbox. You should see a plain-text email with subject `New driver application — Test Driver`, containing all the field values. Confirm that replying would go to `YOUR_REAL_TEST_INBOX@example.com` (the applicant), not back to Resend.

- [ ] **Step 6: Submit a validation-failure request**

```bash
curl -i -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"full_name": "", "phone": "", "email": ""}'
```

Expected: HTTP 400, body `{"error":"Name, phone, and email are required"}`. No row in DB. No emails sent.

- [ ] **Step 7: Submit a malformed JSON request**

```bash
curl -i -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -d 'not json'
```

Expected: HTTP 400, body `{"error":"Invalid JSON"}`. No row. No emails.

- [ ] **Step 8: Simulate email failure, confirm submission still succeeds**

Stop the dev server (Ctrl+C). Temporarily break the Resend key:

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
# In .env.local, change RESEND_API_KEY=re_... to RESEND_API_KEY=re_broken
```

Restart `npm run dev`. Then submit another valid application via curl (Step 2 body, with a different email). Expected:
- HTTP 200 with `{"success":true,"id":"<uuid>"}`
- Row inserted in Supabase
- No emails arrive
- Dev-server console shows two `console.error` lines: one for owner notification, one for applicant confirmation, both including the application id

Restore the real `RESEND_API_KEY` in `.env.local` afterward. Restart the dev server.

- [ ] **Step 9: Browser test via the actual form**

Open `http://localhost:3000/drive-with-us`. Fill out the form with real data (use your test inbox again for the applicant email). Submit.

Expected:
- Form shows the "Application Submitted" success state with the green checkmark
- No red error banner
- Applicant confirmation and owner notification both arrive

- [ ] **Step 10: Stop the dev server**

Ctrl+C in the dev server shell.

No commit — no files changed in this task.

---

## Task 6: Deploy and production smoke test

**Files:** none modified

- [ ] **Step 1: Confirm Vercel env vars are set**

Ask the user to confirm that `RESEND_API_KEY`, `APPLICATIONS_NOTIFY_TO`, and `APPLICATIONS_FROM` are set in the Vercel project for **both Production and Preview** environments (see Task 2 Step 3). If not, pause — deploying without them will 500.

- [ ] **Step 2: Push to deploy**

```bash
cd /Users/abuibrahim/Desktop/EliteTrucking
git push
```

Vercel auto-deploys on push to the main branch.

- [ ] **Step 3: Wait for deploy, then smoke test**

Once the Vercel deploy succeeds (watch the Vercel dashboard or wait ~2 min), go to the live `/drive-with-us` page. Submit a real test application (same test inbox as Task 5).

Expected:
- Form shows success state
- Row appears in Supabase `applications` table
- Both emails arrive (applicant confirmation and owner notification)

- [ ] **Step 4: Mark the task complete**

If all three expected outcomes above are confirmed on production, the backend is working. If any are broken, check:
- Vercel function logs (Project → Deployments → latest → Functions → `api/applications`) for errors
- Resend dashboard → Logs for delivery attempts
- Supabase dashboard for the row

---

## Self-review (completed during plan authoring)

**Spec coverage:**
- ✅ Fix the RLS/`.select().single()` bug → Task 4 (service-role client)
- ✅ Insert reliably into `applications` → Task 1 (migration check) + Task 4 (service role)
- ✅ Owner email to `info@elitetrucking.xyz` → Task 3 `sendOwnerNotification` + Task 4 wiring
- ✅ Applicant confirmation email → Task 3 `sendApplicantConfirmation` + Task 4 wiring
- ✅ Email failures don't fail submission → Task 4 `Promise.allSettled` + logging
- ✅ Lazy Resend client (Vercel build safety) → Task 3 `getResend()`
- ✅ `reply-to` on owner email goes to applicant → Task 3 `replyTo: app.email`
- ✅ Three env vars in `.env.local` and Vercel → Task 2
- ✅ `resend` dependency → Task 1
- ✅ Local + production verification → Tasks 5 & 6

**Placeholder scan:** No TBDs, no "add error handling", no "similar to", no missing code blocks. One legitimate human-input placeholder (`YOUR_REAL_TEST_INBOX@example.com`) is clearly labeled.

**Type consistency:** `ApplicationPayload` shape in Task 3 matches the object constructed in Task 4 (same 10 fields, matching types). `num_trucks` is `number` in both.

**Scope:** Single feature, single plan. No decomposition needed.
