# Driver Application Backend — Design

**Date:** 2026-04-20
**Status:** Approved for implementation
**Scope:** Fix the broken `/drive-with-us` application form and wire up email notifications.

---

## Problem

The "Drive With Us" form at `/drive-with-us` submits to `POST /api/applications` but always returns an error to the applicant. Beyond that, no one at Elite Trucking is notified when an application is (or isn't) submitted.

### Root cause of the error

`src/app/api/applications/route.ts` calls the table with the **anon key** and does `.insert(...).select().single()`.

The `applications` table has RLS enabled with:
- `anon_insert_applications` — anon can INSERT
- `auth_select_applications` — authenticated can SELECT

Anon has **no SELECT policy**. So the `.select()` returning clause yields zero rows and `.single()` throws "JSON object requested, multiple (or no) rows returned". The API returns 500, the applicant sees "Failed to submit application."

The row may or may not actually be written depending on whether migration `001_initial_schema.sql` has been applied to the live Supabase project — that needs to be verified before/during implementation.

### Missing capability

No notification is sent to Elite Trucking staff when an application arrives, and no confirmation is sent to the applicant. The dashboard already supports viewing applications, but staff have no passive signal to go check it.

---

## Goals

1. Applications submitted from the public site land reliably in the `applications` table.
2. On a successful submission, send a plain-text email to `info@elitetrucking.xyz` with all the application details.
3. On a successful submission, send a plain-text confirmation email to the applicant.
4. Email failures must not cause the submission to be reported as failed — the row being saved is the primary success condition.

## Non-goals

- Reviewer UI changes in the dashboard (already exists and will continue to read the same table).
- SMS notifications.
- Automatic status transitions or auto-onboarding.
- Rate limiting / CAPTCHA / anti-spam (can be added later if abuse appears).
- Retry logic for failed emails beyond what Resend does internally.

---

## Architecture

```
[Drive-With-Us form]
        │  POST /api/applications  (JSON body)
        ▼
[/api/applications route (server)]
   1. Parse + validate required fields (name, phone, email)
   2. Insert row into `applications` using SUPABASE_SERVICE_ROLE_KEY
      (server-only; bypasses RLS; fixes the returning-row bug)
   3. Send owner notification  → APPLICATIONS_NOTIFY_TO  (via Resend)
   4. Send applicant confirmation                          (via Resend)
   5. Respond { success: true, id } to the browser
        │
        ▼
[Dashboard] reads applications as before (unchanged)
```

### Failure behavior

| Stage          | Failure mode                                    | Response                                                       |
|----------------|-------------------------------------------------|----------------------------------------------------------------|
| Parse JSON     | Malformed body                                  | `400 { error: "Invalid JSON" }`                                |
| Validate       | Missing name/phone/email                        | `400 { error: "Name, phone, and email are required" }`         |
| DB insert      | Supabase error (RLS, network, table missing)    | `500 { error: "Failed to submit application" }`, log full error |
| Owner email    | Resend error / timeout                          | Log server-side. Still return `200 { success, id }`.           |
| Applicant email| Resend error / timeout                          | Log server-side. Still return `200 { success, id }`.           |

Rationale for the email-failure behavior: the primary commitment to the applicant is that their application is captured. Telling them it failed (when it didn't) pushes them to resubmit and creates duplicate rows. A missed notification is recoverable; a lost application is not.

---

## Components

### `src/app/api/applications/route.ts` (rewrite)

- Parse JSON body defensively (catch `SyntaxError`).
- Validate `full_name`, `phone`, `email` are present and non-empty after `.trim()`.
- Construct a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` and `auth: { persistSession: false }`.
- Insert with `.select("id").single()`. Service role bypasses RLS so the returning row is always visible.
- After a successful insert, fire the two email sends via `Promise.allSettled` so neither blocks the other and both are awaited before responding.
- Log rejections from `allSettled` with enough context to debug (application id + which email failed).
- Return `{ success: true, id }` on insert success regardless of email outcome.

### `src/lib/email.ts` (new)

Thin wrapper around the Resend SDK.

- Lazily constructs `new Resend(process.env.RESEND_API_KEY!)` inside each exported function. This matches the existing pattern in the repo (see commit `62f64b0 fix: lazily create Supabase and Anthropic clients for Vercel build`) — top-level clients break Vercel build because env vars aren't available at build time.
- Exports two functions:
  - `sendOwnerNotification(app: Application): Promise<void>`
  - `sendApplicantConfirmation(app: Application): Promise<void>`
- `from`: `process.env.APPLICATIONS_FROM` (e.g. `"Elite Trucking <apply@elitetrucking.xyz>"`)
- Owner email `to`: `process.env.APPLICATIONS_NOTIFY_TO` (production value: `info@elitetrucking.xyz`)
- Owner email `reply_to`: the applicant's email — so replying in an inbox goes to the driver.
- If any required env var is missing, throw a descriptive error (will be caught by `allSettled` and logged).

### Email templates (inline in `src/lib/email.ts`)

Both plain text. No HTML, no layout, no React Email.

**Owner notification**

- **Subject:** `New driver application — {full_name}`
- **Body:** list of every field, one per line:
  ```
  A new driver has applied to drive with Elite Trucking.

  Name:          {full_name}
  Phone:         {phone}
  Email:         {email}
  CDL Class:     {cdl_class or "—"}
  Truck:         {truck_year} {truck_make} {truck_model}  (or "—" if all blank)
  # of trucks:   {num_trucks}
  Notes:         {notes or "—"}

  Application ID: {id}

  Reply to this email to contact the applicant directly.
  ```

**Applicant confirmation**

- **Subject:** `We got your application — Elite Trucking`
- **Body:**
  ```
  Hi {first_name},

  Thanks for applying to drive with Elite Trucking. We've received
  your application and our team will review it and reach out within
  1-2 business days.

  If you need to reach us sooner, reply to this email or call us.

  — The Elite Trucking team
  ```

`first_name` is derived by taking the first whitespace-separated token of `full_name`. Fallback to "there" if somehow empty.

### Environment variables

Added to both `.env.local` and Vercel Project → Settings → Environment Variables (Production + Preview):

| Name                       | Example value                                       |
|----------------------------|-----------------------------------------------------|
| `RESEND_API_KEY`           | `re_...`                                            |
| `APPLICATIONS_NOTIFY_TO`   | `info@elitetrucking.xyz`                            |
| `APPLICATIONS_FROM`        | `Elite Trucking <apply@elitetrucking.xyz>`          |

### Dependency

Add `resend` (latest stable) to `package.json` `dependencies`.

---

## Prerequisites (owner-side, outside of code)

1. **Supabase migration applied.** Verify `applications` table exists in the live Supabase project. If not, run `supabase/migrations/001_initial_schema.sql` via the Supabase SQL editor.
2. **Resend account + domain verification for `elitetrucking.xyz`.**
   - Sign up at resend.com.
   - Add `elitetrucking.xyz` as a domain.
   - Add the ~3 DNS records Resend provides (1× SPF TXT, 2× DKIM CNAME; DMARC TXT optional but recommended).
   - Wait for verification.
   - Create an API key (send-only).
3. **`info@elitetrucking.xyz` mailbox exists** somewhere the owner actually receives mail (Google Workspace, Zoho, etc.). Resend only sends; it doesn't host inboxes. If the mailbox doesn't exist, the owner email will bounce silently from the recipient side.

Implementation can proceed without these, but the end-to-end test fails until they're done.

---

## Testing

- **Unit-ish:** manual dev-server test posting to `/api/applications` with valid + invalid bodies, confirming 200/400 responses and row in `applications` table.
- **Email end-to-end:** submit a real application from `localhost:3000/drive-with-us` with a test email address you control; verify both emails arrive (owner + applicant), verify the `reply-to` on the owner email is the applicant's address.
- **Failure path:** temporarily break `RESEND_API_KEY` and confirm the submission still succeeds and the row is saved — only the emails should fail (logged).
- **Production smoke test:** after Vercel deploy, submit a test application from the live site with a real inbox.

---

## Out of scope (future work)

- Rate limiting (Vercel edge middleware or Upstash Redis) if spam submissions appear.
- Review-state transitions driving email replies (e.g. automated "approved" / "rejected" messages).
- Dashboard "resend confirmation" / "contact applicant" buttons.
- SMS notifications via Twilio.

---

## Files touched

- `src/app/api/applications/route.ts` — rewrite
- `src/lib/email.ts` — new
- `.env.local` — 3 new vars
- `package.json` / `package-lock.json` — add `resend`
- Vercel env vars — 3 new (manual, not in code)
