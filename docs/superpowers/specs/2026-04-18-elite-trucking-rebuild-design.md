# Elite Truck Lines — Simplified Rebuild

**Date:** 2026-04-18
**Status:** Draft
**Author:** Hassan + Claude

---

## Problem

The current EliteTrucking system is overbuilt: 6 AI agents (Boss, Dispatch, Compliance, Acquisition, Outreach, Load Update), 3 separate services (Express, 2x Flask), a Telegram bot, Slack integration, n8n workflows, and multiple dashboards. The agents don't understand simple commands, and the whole thing looks like a developer dashboard, not a professional trucking company.

## Goal

Rebuild as a single, clean application that serves two purposes:

1. **Public company website** — professional site for Elite Truck Lines that recruits owner-operators and presents the business to clients
2. **Management dashboard** — where Hassan and partners manage their fleet of owner-operators, compliance, clients, loads, and paperwork

One AI agent replaces all six. It understands natural language commands, reads/writes directly to the database, and the dashboard updates in real-time.

## Business Model

Elite Truck Lines is an asset-light trucking company. They onboard owner-operators who bring their own trucks. Elite handles everything — dispatch, compliance, load booking, back-office — and takes 10-15% of the gross revenue per load. Drivers just drive and maintain their trucks.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime subscriptions |
| File Storage | Supabase Storage (document uploads) |
| AI | Claude API (single agent with tool use) |
| Deployment | Vercel |

### Why This Stack

- **Next.js** — handles both the public marketing site (server-rendered, SEO-friendly) and the dashboard (client-side interactivity) in one codebase, one deploy
- **Supabase** — already in use, provides Postgres, auth, real-time subscriptions, and file storage in one service
- **Tailwind** — custom styling without template bloat, easy to make it look professional and unique
- **Claude API** — single agent with tool use replaces 6 broken agents
- **Vercel** — zero-config deployment for Next.js, free tier covers this scale

---

## Public Website

### Design Direction

- Dark navy primary, white text, bold accent color (orange or gold)
- Typography-driven, minimal, no stock photos
- Mobile-responsive
- Professional — should look like a real logistics company, not a tech demo

### Pages

**Home (`/`)**
- Hero with tagline (e.g., "We Handle the Business. You Handle the Road.")
- 3-4 value proposition cards (dispatch, compliance, back-office, driver support)
- CTA button to "Drive With Us"
- Brief stats/social proof section if available

**About (`/about`)**
- Company story, mission
- Team section (Hassan and partners)
- What makes Elite different

**Services (`/services`)**
- For owner-operators: what Elite provides (dispatch, compliance management, load booking, paperwork, invoicing)
- For clients/shippers: reliable capacity, professional communication, on-time delivery

**Drive With Us (`/drive-with-us`)**
- Explain the deal: bring your truck, we handle everything, keep 85-90%
- Requirements (CDL class, truck specs, insurance minimums)
- Application form:
  - Full name
  - Phone
  - Email
  - CDL class
  - Truck year/make/model
  - Number of trucks
  - Message/notes
- Form submission writes to Supabase `applications` table
- Shows up in the dashboard for review

**Contact (`/contact`)**
- Phone, email
- Contact form
- MC and DOT numbers for credibility

### Navigation

- Clean top nav: Home, About, Services, Drive With Us, Contact
- When logged in, "Dashboard" link appears in the nav
- Mobile hamburger menu

---

## Dashboard

### Access

- Protected by Supabase Auth (email/password)
- Only Hassan and partners have accounts — no driver self-service (for now)
- Login page at `/login`, redirects to `/dashboard` on success

### Layout

- **Sidebar** (collapsible): Overview, Operators, Fleet, Compliance, Clients, Loads
- **Top bar**: User name, notification bell (compliance alerts, new applications), logout
- **AI Chat panel**: Slide-out panel on the right, toggled by a floating button. Always accessible without leaving the current page.

### Pages

**Overview (`/dashboard`)**
- KPI cards:
  - Active operators
  - Trucks on road
  - Loads this month
  - Monthly revenue
  - Compliance score (% of documents current)
- Recent alerts (expiring documents, new applications from "Drive With Us")
- Quick actions (add operator, book load)

**Operators (`/dashboard/operators`)**
- Table: name, phone, status, trucks, commission rate, compliance status
- Search and filter by status (active, suspended, inactive)
- Click row → detail page with:
  - Operator info (editable)
  - Their trucks
  - Their documents
  - Load history
  - Revenue summary

**Fleet (`/dashboard/fleet`)**
- Table: all trucks across all operators
- Columns: operator name, year/make/model, VIN, plate, status
- Filter by status (active, out of service, maintenance)
- Click row → truck detail with linked documents

**Compliance (`/dashboard/compliance`)**
- Document status overview: counts by status (valid, expiring soon, expired)
- Color-coded: green (valid), yellow (expiring in 30 days), orange (expiring in 15), red (expiring in 7 or expired)
- Filtered views: expiring in 7/15/30 days, expired, all clear
- Per-operator compliance summary
- Click any document → detail view

**Clients (`/dashboard/clients`)**
- Table: company name, type (shipper/broker), contact person, phone, payment terms
- Search and filter
- Click row → detail with notes, load history, contact info

**Loads (`/dashboard/loads`)**
- Table: load #, operator, client, origin → destination, rate, status
- Filter by status (booked, in transit, delivered, invoiced, paid)
- Click row → load detail with full info
- Revenue calculations: gross, commission (operator %), Elite's cut

---

## Database Schema

### Tables

**applications**
- id (uuid, PK)
- full_name (text)
- phone (text)
- email (text)
- cdl_class (text)
- truck_year (text)
- truck_make (text)
- truck_model (text)
- num_trucks (integer)
- notes (text)
- status (text: pending, reviewed, onboarded, rejected)
- created_at (timestamptz)

**operators**
- id (uuid, PK)
- full_name (text)
- phone (text)
- email (text)
- address (text)
- cdl_class (text)
- cdl_number (text)
- commission_rate (decimal) — 0.10 to 0.15
- status (text: active, suspended, inactive)
- onboarded_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)

**trucks**
- id (uuid, PK)
- operator_id (uuid, FK → operators)
- year (integer)
- make (text)
- model (text)
- vin (text, unique)
- license_plate (text)
- license_state (text)
- color (text)
- status (text: active, out_of_service, maintenance)
- created_at (timestamptz)
- updated_at (timestamptz)

**documents**
- id (uuid, PK)
- operator_id (uuid, FK → operators, nullable)
- truck_id (uuid, FK → trucks, nullable)
- type (text: cdl, medical_card, insurance, registration, drug_test, annual_inspection, w9, operating_authority)
- document_number (text)
- issued_date (date)
- expiration_date (date)
- status (text: valid, expiring_soon, expired)
- file_url (text) — Supabase Storage URL
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**clients**
- id (uuid, PK)
- company_name (text)
- type (text: shipper, broker)
- contact_name (text)
- phone (text)
- email (text)
- mc_number (text)
- dot_number (text)
- payment_terms (text: net_30, net_15, quick_pay, etc.)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**loads**
- id (uuid, PK)
- load_number (text, unique) — auto-generated (e.g., ELT-2026-0001)
- operator_id (uuid, FK → operators)
- client_id (uuid, FK → clients)
- origin_city (text)
- origin_state (text)
- destination_city (text)
- destination_state (text)
- pickup_date (date)
- delivery_date (date)
- rate (decimal) — gross pay
- miles (integer)
- commission_rate (decimal) — snapshot of operator's rate at booking
- elite_cut (decimal) — computed: rate * commission_rate
- operator_pay (decimal) — computed: rate - elite_cut
- status (text: booked, in_transit, delivered, invoiced, paid)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**chat_messages**
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- role (text: user, assistant)
- content (text)
- created_at (timestamptz)

### Row-Level Security

All dashboard tables have RLS enabled. Only authenticated users can read/write. The public `applications` table allows anonymous inserts (from the "Drive With Us" form) but only authenticated users can read/update.

---

## AI Agent

### Architecture

Single Claude agent using the Anthropic API with tool use. The agent has a system prompt defining its role and a set of tools that map to Supabase operations.

### System Prompt

The agent is the operations assistant for Elite Truck Lines. It:
- Understands natural language commands about operators, trucks, documents, clients, and loads
- Executes actions by calling tools that read/write to Supabase
- Responds conversationally but concisely
- Asks for clarification when commands are ambiguous
- Never makes destructive changes without confirming (e.g., "Are you sure you want to remove this operator?")

### Tools

| Tool | Description |
|------|------------|
| `add_operator` | Create a new owner-operator. Params: name, phone, email, cdl_class, commission_rate |
| `update_operator` | Edit an operator's info or status. Params: operator_id, fields to update |
| `remove_operator` | Set an operator to inactive. Params: operator_id |
| `search_operators` | Find operators by name, status, etc. Params: query, filters |
| `add_truck` | Add a truck to an operator. Params: operator_id, year, make, model, vin, plate |
| `update_truck` | Edit truck info or status. Params: truck_id, fields to update |
| `add_document` | Record a document with expiration. Params: operator_id or truck_id, type, expiration_date, document_number |
| `get_expiring_documents` | Get docs expiring within N days. Params: days (default 30) |
| `add_client` | Add a shipper or broker. Params: company_name, type, contact info, payment_terms |
| `search_clients` | Find clients by name or type. Params: query, filters |
| `update_client` | Edit client info. Params: client_id, fields to update |
| `add_load` | Book a new load. Params: operator_id, client_id, origin, destination, dates, rate |
| `update_load` | Change load status or details. Params: load_id, fields to update |
| `search_loads` | Find loads by operator, client, status, date range. Params: filters |
| `get_dashboard_stats` | Pull KPI summary: active operators, trucks, monthly revenue, compliance % |
| `get_applications` | List pending "Drive With Us" applications |
| `onboard_application` | Convert an application into an active operator record |

### Conversation Flow

The chat panel maintains conversation history per session. The agent sees previous messages for context, so you can say things like:

- "Add driver Marcus Johnson" → agent asks for phone, CDL class, commission rate
- "His phone is 214-555-1234, CDL A, 12%" → agent has context, creates the record
- "Now add his truck — 2022 Peterbilt 579, VIN 1XPWD49X..." → agent links it to Marcus

### Background Compliance Job

A scheduled function (Vercel Cron) runs daily at 6 AM:
1. Query documents where expiration_date is within 30 days
2. Update document status to `expiring_soon` or `expired`
3. These alerts surface in the dashboard Overview and Compliance pages automatically via real-time subscriptions

No separate agent needed — it's a simple database query on a timer.

---

## Application Flow: "Drive With Us" → Onboarding

1. Potential owner-operator fills out the form on `/drive-with-us`
2. Form submits to a Next.js API route that inserts into `applications` table
3. Dashboard shows new applications in the Overview alerts and a dedicated section
4. Hassan reviews the application
5. Hassan tells the AI: "Onboard the application from Marcus Johnson"
6. Agent calls `onboard_application` → creates operator record, marks application as onboarded
7. Hassan can then add the operator's truck and documents via chat or forms

---

## What Gets Cut From the Old System

| Old | New |
|-----|-----|
| 6 AI agents (Boss, Dispatch, Compliance, Acquisition, Outreach, Load Update) | 1 agent with tools |
| 3 separate services (Express + 2 Flask apps) | 1 Next.js app |
| Telegram bot | AI chat panel in dashboard |
| Slack integration | In-app notifications |
| n8n workflows | Vercel Cron for scheduled tasks |
| SendGrid emails | Not needed (for now) |
| Twilio SMS | Not needed (for now) |
| SQLite + Supabase (dual databases) | Supabase only |
| Multiple HTML dashboards | One unified dashboard |
| Approval workflows | Simple confirmation in AI chat |

---

## Future Additions (Not In This Build)

These are explicitly out of scope for the initial build but could be added later:
- Owner-operator self-service portal (upload their own docs)
- Twilio SMS notifications for expiring documents
- Email notifications via SendGrid/Resend
- FMCSA API integration for automated carrier vetting
- Invoicing and payment tracking
- Mobile app
