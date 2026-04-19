# Elite Truck Lines — Simplified Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild EliteTrucking as a single Next.js app combining a professional public website with a management dashboard and AI-powered operations assistant.

**Architecture:** Next.js 14 App Router with Tailwind CSS for styling, Supabase for database/auth/storage/realtime, Claude API for the single AI agent with tool use. Public pages are server-rendered. Dashboard pages are client-side with real-time Supabase subscriptions. AI chat is a slide-out panel that persists across dashboard pages.

**Tech Stack:** Next.js 14, Tailwind CSS, Supabase (Postgres, Auth, Realtime, Storage), Claude API (@anthropic-ai/sdk), Vercel

---

## File Structure

```
elite-trucking/
├── .env.local                          # Supabase + Anthropic keys
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── tsconfig.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # All tables, RLS policies, functions
│
├── src/
│   ├── lib/
│   │   ├── supabase-server.ts          # Server-side Supabase client
│   │   ├── supabase-browser.ts         # Browser-side Supabase client
│   │   └── utils.ts                    # Shared helpers (cn, formatCurrency, etc.)
│   │
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (fonts, metadata)
│   │   ├── globals.css                 # Tailwind imports + custom CSS
│   │   │
│   │   ├── (public)/                   # Public website route group
│   │   │   ├── layout.tsx              # Public nav + footer
│   │   │   ├── page.tsx                # Home page
│   │   │   ├── about/page.tsx          # About page
│   │   │   ├── services/page.tsx       # Services page
│   │   │   ├── drive-with-us/page.tsx  # Drive With Us + application form
│   │   │   └── contact/page.tsx        # Contact page
│   │   │
│   │   ├── login/page.tsx              # Login page
│   │   │
│   │   ├── dashboard/                  # Dashboard route group (protected)
│   │   │   ├── layout.tsx              # Sidebar + topbar + chat panel
│   │   │   ├── page.tsx                # Overview (KPIs, alerts)
│   │   │   ├── operators/
│   │   │   │   ├── page.tsx            # Operators table
│   │   │   │   └── [id]/page.tsx       # Operator detail
│   │   │   ├── fleet/page.tsx          # Fleet table
│   │   │   ├── compliance/page.tsx     # Compliance overview
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx            # Clients table
│   │   │   │   └── [id]/page.tsx       # Client detail
│   │   │   └── loads/page.tsx          # Loads table
│   │   │
│   │   └── api/
│   │       ├── chat/route.ts           # AI agent endpoint (streaming)
│   │       ├── applications/route.ts   # Public application form submission
│   │       └── cron/compliance/route.ts # Daily compliance check (Vercel Cron)
│   │
│   └── components/
│       ├── public/
│       │   ├── Navbar.tsx              # Public site navigation
│       │   └── Footer.tsx              # Public site footer
│       │
│       ├── dashboard/
│       │   ├── Sidebar.tsx             # Dashboard sidebar nav
│       │   ├── Topbar.tsx              # Dashboard top bar
│       │   ├── ChatPanel.tsx           # AI chat slide-out panel
│       │   ├── KpiCard.tsx             # KPI stat card
│       │   ├── DataTable.tsx           # Reusable sortable/filterable table
│       │   ├── StatusBadge.tsx         # Color-coded status badges
│       │   ├── AddOperatorForm.tsx     # Manual add operator form
│       │   ├── AddTruckForm.tsx        # Manual add truck form
│       │   ├── AddDocumentForm.tsx     # Manual add document form
│       │   ├── AddClientForm.tsx       # Manual add client form
│       │   ├── AddLoadForm.tsx         # Manual add load form
│       │   └── ComplianceBar.tsx       # Per-operator compliance progress bar
│       │
│       └── ui/
│           ├── Button.tsx              # Shared button component
│           ├── Input.tsx               # Shared input component
│           ├── Modal.tsx               # Shared modal component
│           └── Select.tsx              # Shared select component
│
├── agent/
│   ├── system-prompt.ts                # Agent system prompt
│   ├── tools.ts                        # Tool definitions (JSON schema for Claude)
│   └── tool-handlers.ts               # Tool execution functions (Supabase queries)
│
└── vercel.json                         # Cron job config
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`, `.env.local`, `.gitignore`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/utils.ts`

- [ ] **Step 1: Initialize Next.js project**

Run from `/Users/abuibrahim/Desktop/EliteTrucking`:

```bash
# Remove old files that conflict (keep docs/)
rm -rf compliance-agent dashboard elite-agents operations start.sh

# Create the Next.js app in current directory
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

When prompted, accept defaults. If it asks about overwriting, say yes (we already committed the spec).

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk clsx tailwind-merge lucide-react
```

- `@supabase/supabase-js` — Supabase client
- `@supabase/ssr` — Server-side Supabase for Next.js App Router
- `@anthropic-ai/sdk` — Claude API
- `clsx` + `tailwind-merge` — Utility for conditional class names
- `lucide-react` — Icon library (clean, professional icons)

- [ ] **Step 3: Configure environment variables**

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
CRON_SECRET=your_random_secret_for_cron
```

- [ ] **Step 4: Update Tailwind config with brand colors**

Replace `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f0f3f9",
          100: "#d9e0f0",
          200: "#b3c1e0",
          300: "#8da2d1",
          400: "#6683c1",
          500: "#4064b2",
          600: "#33508e",
          700: "#263c6b",
          800: "#1a2847",
          900: "#0d1424",
          950: "#070a12",
        },
        accent: {
          50: "#fff8f0",
          100: "#ffecd6",
          200: "#ffd5a8",
          300: "#ffb86b",
          400: "#ff9f3d",
          500: "#f58220",
          600: "#d66a10",
          700: "#a34f0b",
          800: "#703708",
          900: "#3d1e04",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Set up global styles**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

@layer base {
  body {
    @apply antialiased;
  }
}
```

- [ ] **Step 6: Set up root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Elite Truck Lines",
  description:
    "We Handle the Business. You Handle the Road. Elite Truck Lines manages dispatch, compliance, and back-office for owner-operators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create utility helpers**

Create `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateLoadNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ELT-${year}-${rand}`;
}
```

- [ ] **Step 8: Verify the app runs**

```bash
npm run dev
```

Open `http://localhost:3000` — should see the default Next.js page. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and dependencies"
```

---

## Task 2: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase-server.ts`, `src/lib/supabase-browser.ts`, `src/app/api/applications/route.ts`

- [ ] **Step 1: Create browser-side Supabase client**

Create `src/lib/supabase-browser.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create server-side Supabase client**

Create `src/lib/supabase-server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore — can't set cookies in Server Components, only in
            // Server Actions and Route Handlers.
          }
        },
      },
    }
  );
}

export function createServiceRoleClient() {
  // For admin operations (cron jobs, agent tool calls)
  // Uses service role key — bypasses RLS
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase-server.ts src/lib/supabase-browser.ts
git commit -m "feat: add Supabase client setup for browser and server"
```

---

## Task 3: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

This SQL should be run in the Supabase SQL Editor (Dashboard → SQL Editor → New Query → paste and run).

- [ ] **Step 1: Write the full migration**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- ============================================================
-- Elite Truck Lines — Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Applications (public form submissions) ──────────────────

create table applications (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  email text not null,
  cdl_class text,
  truck_year text,
  truck_make text,
  truck_model text,
  num_trucks integer default 1,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'onboarded', 'rejected')),
  created_at timestamptz not null default now()
);

-- ── Operators ───────────────────────────────────────────────

create table operators (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text,
  email text,
  address text,
  cdl_class text,
  cdl_number text,
  commission_rate decimal(4,2) not null default 0.12
    check (commission_rate >= 0.05 and commission_rate <= 0.30),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'inactive')),
  onboarded_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Trucks ──────────────────────────────────────────────────

create table trucks (
  id uuid primary key default uuid_generate_v4(),
  operator_id uuid not null references operators(id) on delete cascade,
  year integer,
  make text,
  model text,
  vin text unique,
  license_plate text,
  license_state text,
  color text,
  status text not null default 'active'
    check (status in ('active', 'out_of_service', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Documents ───────────────────────────────────────────────

create table documents (
  id uuid primary key default uuid_generate_v4(),
  operator_id uuid references operators(id) on delete cascade,
  truck_id uuid references trucks(id) on delete cascade,
  type text not null
    check (type in ('cdl', 'medical_card', 'insurance', 'registration',
                    'drug_test', 'annual_inspection', 'w9', 'operating_authority')),
  document_number text,
  issued_date date,
  expiration_date date,
  status text not null default 'valid'
    check (status in ('valid', 'expiring_soon', 'expired')),
  file_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_owner_check check (
    operator_id is not null or truck_id is not null
  )
);

-- ── Clients ─────────────────────────────────────────────────

create table clients (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  type text not null
    check (type in ('shipper', 'broker')),
  contact_name text,
  phone text,
  email text,
  mc_number text,
  dot_number text,
  payment_terms text default 'net_30'
    check (payment_terms in ('net_30', 'net_15', 'net_7', 'quick_pay', 'factoring', 'other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Loads ────────────────────────────────────────────────────

create table loads (
  id uuid primary key default uuid_generate_v4(),
  load_number text unique not null,
  operator_id uuid references operators(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  origin_city text not null,
  origin_state text not null,
  destination_city text not null,
  destination_state text not null,
  pickup_date date,
  delivery_date date,
  rate decimal(10,2),
  miles integer,
  commission_rate decimal(4,2),
  elite_cut decimal(10,2),
  operator_pay decimal(10,2),
  status text not null default 'booked'
    check (status in ('booked', 'in_transit', 'delivered', 'invoiced', 'paid')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Chat Messages ───────────────────────────────────────────

create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ── Indexes ─────────────────────────────────────────────────

create index idx_operators_status on operators(status);
create index idx_trucks_operator on trucks(operator_id);
create index idx_trucks_status on trucks(status);
create index idx_documents_operator on documents(operator_id);
create index idx_documents_truck on documents(truck_id);
create index idx_documents_expiration on documents(expiration_date);
create index idx_documents_status on documents(status);
create index idx_loads_operator on loads(operator_id);
create index idx_loads_client on loads(client_id);
create index idx_loads_status on loads(status);
create index idx_chat_messages_user on chat_messages(user_id);

-- ── Auto-update updated_at trigger ──────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger operators_updated_at before update on operators
  for each row execute function update_updated_at();

create trigger trucks_updated_at before update on trucks
  for each row execute function update_updated_at();

create trigger documents_updated_at before update on documents
  for each row execute function update_updated_at();

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger loads_updated_at before update on loads
  for each row execute function update_updated_at();

-- ── Row-Level Security ──────────────────────────────────────

alter table applications enable row level security;
alter table operators enable row level security;
alter table trucks enable row level security;
alter table documents enable row level security;
alter table clients enable row level security;
alter table loads enable row level security;
alter table chat_messages enable row level security;

-- Applications: anyone can insert (public form), only authed users can read/update
create policy "Anyone can submit applications"
  on applications for insert to anon with check (true);

create policy "Authed users can read applications"
  on applications for select to authenticated using (true);

create policy "Authed users can update applications"
  on applications for update to authenticated using (true);

-- All other tables: authed users only
create policy "Authed users full access to operators"
  on operators for all to authenticated using (true) with check (true);

create policy "Authed users full access to trucks"
  on trucks for all to authenticated using (true) with check (true);

create policy "Authed users full access to documents"
  on documents for all to authenticated using (true) with check (true);

create policy "Authed users full access to clients"
  on clients for all to authenticated using (true) with check (true);

create policy "Authed users full access to loads"
  on loads for all to authenticated using (true) with check (true);

create policy "Authed users full access to chat_messages"
  on chat_messages for all to authenticated using (true) with check (true);

-- ── Enable Realtime ─────────────────────────────────────────

alter publication supabase_realtime add table operators;
alter publication supabase_realtime add table trucks;
alter publication supabase_realtime add table documents;
alter publication supabase_realtime add table loads;
alter publication supabase_realtime add table applications;
```

- [ ] **Step 2: Run the migration in Supabase**

Go to your Supabase project → SQL Editor → New Query → paste the entire SQL above → click Run.

Alternatively, if you have the Supabase CLI set up:
```bash
supabase db push
```

- [ ] **Step 3: Create a user account for yourself**

In Supabase Dashboard → Authentication → Users → Add User:
- Email: your email
- Password: your choice
- Auto-confirm: Yes

Do the same for any partners who need access.

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema with RLS and realtime"
```

---

## Task 4: Shared UI Components

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/Select.tsx`

- [ ] **Step 1: Create Button component**

Create `src/components/ui/Button.tsx`:

```tsx
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500":
              variant === "primary",
            "bg-navy-800 text-white hover:bg-navy-700 focus:ring-navy-500":
              variant === "secondary",
            "text-navy-300 hover:text-white hover:bg-navy-800 focus:ring-navy-500":
              variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500":
              variant === "danger",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
```

- [ ] **Step 2: Create Input component**

Create `src/components/ui/Input.tsx`:

```tsx
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-navy-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border bg-navy-900 px-3 py-2 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors",
            error ? "border-red-500" : "border-navy-700",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
```

- [ ] **Step 3: Create Select component**

Create `src/components/ui/Select.tsx`:

```tsx
import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-navy-200">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
```

- [ ] **Step 4: Create Modal component**

Create `src/components/ui/Modal.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-xl bg-navy-900 border border-navy-700 shadow-2xl",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-navy-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-navy-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shared UI components (Button, Input, Select, Modal)"
```

---

## Task 5: Public Website — Layout, Navbar, Footer

**Files:**
- Create: `src/components/public/Navbar.tsx`, `src/components/public/Footer.tsx`, `src/app/(public)/layout.tsx`

- [ ] **Step 1: Create Navbar**

Create `src/components/public/Navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/drive-with-us", label: "Drive With Us" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-navy-950/90 backdrop-blur-md border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white tracking-tight">
              ELITE<span className="text-accent-500"> TRUCK LINES</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-accent-400 bg-navy-800/50"
                    : "text-navy-300 hover:text-white hover:bg-navy-800/30"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-navy-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-950 border-t border-navy-800">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-accent-400 bg-navy-800/50"
                    : "text-navy-300 hover:text-white hover:bg-navy-800/30"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Create Footer**

Create `src/components/public/Footer.tsx`:

```tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span className="text-xl font-bold text-white tracking-tight">
              ELITE<span className="text-accent-500"> TRUCK LINES</span>
            </span>
            <p className="mt-3 text-sm text-navy-400 max-w-xs">
              We handle dispatch, compliance, and back-office so you can focus on
              what you do best — driving.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/services", label: "Services" },
                { href: "/drive-with-us", label: "Drive With Us" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-navy-400 hover:text-accent-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-navy-400">
              <li>info@elitetrucklines.com</li>
              <li>(555) 000-0000</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-navy-800 text-center text-xs text-navy-500">
          &copy; {new Date().getFullYear()} Elite Truck Lines. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create public layout**

Create `src/app/(public)/layout.tsx`:

```tsx
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 4: Verify — run dev server**

```bash
npm run dev
```

Open `http://localhost:3000` — should see the navbar with the Elite Truck Lines branding and the footer. The page content will be the default Next.js page for now.

- [ ] **Step 5: Commit**

```bash
git add src/components/public/ src/app/\(public\)/layout.tsx
git commit -m "feat: add public website layout with navbar and footer"
```

---

## Task 6: Public Website — Home Page

**Files:**
- Create: `src/app/(public)/page.tsx`

- [ ] **Step 1: Build the home page**

Create `src/app/(public)/page.tsx`:

```tsx
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  FileText,
  Headphones,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Dispatch & Load Booking",
    description:
      "We find and book the loads. You pick up and deliver. No hunting for freight — we handle it all.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Management",
    description:
      "CDL, medical cards, insurance, inspections — we track every document and alert you before anything expires.",
  },
  {
    icon: FileText,
    title: "Back-Office & Paperwork",
    description:
      "Invoicing, rate confirmations, and all the paperwork that comes with trucking. We take care of it.",
  },
  {
    icon: Headphones,
    title: "24/7 Driver Support",
    description:
      "Questions, issues, or updates on the road — our team is here for you around the clock.",
  },
];

const stats = [
  { value: "85-90%", label: "You Keep" },
  { value: "100%", label: "Back-Office Covered" },
  { value: "0", label: "Hidden Fees" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
              We Handle the Business.{" "}
              <span className="text-accent-400">You Handle the Road.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-navy-300 max-w-2xl">
              Elite Truck Lines manages dispatch, compliance, and back-office for
              owner-operators. Bring your truck, keep 85-90% of the gross, and let
              us handle the rest.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/drive-with-us"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-500 text-white font-semibold hover:bg-accent-600 transition-colors"
              >
                Drive With Us
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-navy-600 text-navy-200 font-semibold hover:bg-navy-800 hover:text-white transition-colors"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-navy-900/50 border-y border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-accent-400">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-navy-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Everything You Need to Stay on the Road
            </h2>
            <p className="mt-4 text-navy-400">
              We take the business side off your plate so you can focus on driving
              and taking care of your truck.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-navy-900/50 border border-navy-800 hover:border-navy-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center mb-4">
                  <feature.icon size={20} className="text-accent-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-navy-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-navy-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Partner With Us?
          </h2>
          <p className="text-navy-400 max-w-xl mx-auto mb-8">
            If you own your truck and want a team that handles everything else,
            we want to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/drive-with-us"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-500 text-white font-semibold hover:bg-accent-600 transition-colors"
            >
              Apply Now
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-navy-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              No upfront costs
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              Keep 85-90% of gross
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-400" />
              Full back-office support
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000` — should see the full home page with hero, stats, features, and CTA sections. Check mobile responsiveness by resizing the browser.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/page.tsx
git commit -m "feat: add home page with hero, features, stats, and CTA"
```

---

## Task 7: Public Website — About, Services, Contact Pages

**Files:**
- Create: `src/app/(public)/about/page.tsx`, `src/app/(public)/services/page.tsx`, `src/app/(public)/contact/page.tsx`

- [ ] **Step 1: Create About page**

Create `src/app/(public)/about/page.tsx`:

```tsx
import { Target, Users, TrendingUp } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Driver-First Approach",
    description:
      "Every decision we make starts with one question: does this make life better for our drivers? If it doesn't, we don't do it.",
  },
  {
    icon: Users,
    title: "Real Partnership",
    description:
      "We don't treat owner-operators like a number. You're a partner. Your success is our success — that's how we built this company.",
  },
  {
    icon: TrendingUp,
    title: "Transparency",
    description:
      "No hidden fees, no surprises. You see exactly what every load pays, what we take, and what you keep. Every time.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              About Elite Truck Lines
            </h1>
            <p className="mt-6 text-lg text-navy-300 leading-relaxed">
              We started Elite Truck Lines because we saw too many owner-operators
              getting a raw deal — high commission rates, zero support, and
              mountains of paperwork. We built something better.
            </p>
            <p className="mt-4 text-lg text-navy-300 leading-relaxed">
              Our model is simple: you bring your truck and your CDL. We handle
              dispatch, compliance, invoicing, and everything else that keeps you
              off the road. You keep 85-90% of the gross and focus on what you do
              best — driving.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-navy-900/30 border-y border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
                  <value.icon size={20} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-navy-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Our Team</h2>
          <p className="text-navy-400 max-w-2xl mb-12">
            A small team that moves fast and puts drivers first. We know trucking
            because we live it every day.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-navy-900/50 border border-navy-800">
              <div className="w-12 h-12 rounded-full bg-accent-500/20 flex items-center justify-center mb-4">
                <span className="text-accent-400 font-bold text-lg">H</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Hassan</h3>
              <p className="text-sm text-accent-400 mb-2">Founder</p>
              <p className="text-sm text-navy-400">
                Operations, strategy, and making sure every driver gets the
                support they need.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Create Services page**

Create `src/app/(public)/services/page.tsx`:

```tsx
import { Truck, ShieldCheck, FileText, Phone, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const driverServices = [
  {
    icon: Truck,
    title: "Dispatch & Load Booking",
    description:
      "We find consistent, well-paying freight on the lanes you want to run. No load boards, no chasing brokers — we handle negotiations and booking so you always have your next load lined up.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Management",
    description:
      "We track every document — CDL, medical cards, insurance, drug tests, annual inspections. You'll get alerts before anything expires so you never get caught off guard at a weigh station.",
  },
  {
    icon: FileText,
    title: "Back-Office & Invoicing",
    description:
      "Rate confirmations, BOLs, invoicing, collections — all the paperwork that eats your time. We process it so you get paid on time, every time.",
  },
  {
    icon: Phone,
    title: "Driver Support",
    description:
      "Got a question? Need help with a shipper? Breakdown on the road? Our team is available to help you work through it.",
  },
  {
    icon: MapPin,
    title: "Route & Lane Optimization",
    description:
      "We analyze your preferred lanes and find freight that keeps you moving efficiently — less deadhead, more loaded miles, better revenue per mile.",
  },
  {
    icon: DollarSign,
    title: "Transparent Pay",
    description:
      "You see exactly what every load pays. We take 10-15% of the gross — that's it. No hidden fees, no fuel surcharge skimming, no surprise deductions.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              What We Do for You
            </h1>
            <p className="mt-6 text-lg text-navy-300">
              We built Elite Truck Lines to be the back-office that owner-operators
              deserve. Here's everything we handle so you can stay focused on driving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {driverServices.map((service) => (
              <div
                key={service.title}
                className="p-6 rounded-xl bg-navy-900/50 border border-navy-800 hover:border-navy-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center mb-4">
                  <service.icon size={20} className="text-accent-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-navy-400 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-900/30 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-navy-400 mb-6">
            Apply today and let us show you what real support looks like.
          </p>
          <Link
            href="/drive-with-us"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-500 text-white font-semibold hover:bg-accent-600 transition-colors"
          >
            Drive With Us
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Create Contact page**

Create `src/app/(public)/contact/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // For now, just show success. Can integrate email later.
    setSubmitted(true);
  }

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg text-navy-300">
              Have questions about partnering with Elite Truck Lines? Want to learn
              more about our services? Reach out — we'd love to hear from you.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Email</h3>
                  <p className="text-sm text-navy-400">info@elitetrucklines.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Phone</h3>
                  <p className="text-sm text-navy-400">(555) 000-0000</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">MC / DOT</h3>
                  <p className="text-sm text-navy-400">MC-000000 / DOT-000000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 rounded-xl bg-navy-900/50 border border-navy-800">
            {submitted ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Message Sent
                </h3>
                <p className="text-navy-400">
                  We'll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input id="name" label="Name" placeholder="Your name" required />
                <Input id="email" label="Email" type="email" placeholder="you@example.com" required />
                <Input id="phone" label="Phone" type="tel" placeholder="(555) 000-0000" />
                <div className="space-y-1">
                  <label htmlFor="message" className="block text-sm font-medium text-navy-200">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    required
                    placeholder="How can we help?"
                    className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify all pages in browser**

```bash
npm run dev
```

Check: `http://localhost:3000/about`, `/services`, `/contact`. Verify nav links work. Check mobile view.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(public\)/about/ src/app/\(public\)/services/ src/app/\(public\)/contact/
git commit -m "feat: add about, services, and contact pages"
```

---

## Task 8: Public Website — Drive With Us Page + Application API

**Files:**
- Create: `src/app/(public)/drive-with-us/page.tsx`, `src/app/api/applications/route.ts`

- [ ] **Step 1: Create the application API route**

Create `src/app/api/applications/route.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { full_name, phone, email, cdl_class, truck_year, truck_make, truck_model, num_trucks, notes } = body;

  if (!full_name || !phone || !email) {
    return NextResponse.json(
      { error: "Name, phone, and email are required" },
      { status: 400 }
    );
  }

  // Use anon key — the RLS policy allows anonymous inserts on applications
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.from("applications").insert({
    full_name,
    phone,
    email,
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
```

- [ ] **Step 2: Create Drive With Us page**

Create `src/app/(public)/drive-with-us/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

const benefits = [
  "Keep 85-90% of gross revenue",
  "Consistent freight — no load board hunting",
  "Full compliance tracking and alerts",
  "Invoicing and collections handled",
  "No upfront costs or hidden fees",
  "Dedicated support for every driver",
];

const cdlOptions = [
  { value: "", label: "Select CDL Class" },
  { value: "A", label: "Class A" },
  { value: "B", label: "Class B" },
];

export default function DriveWithUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      full_name: formData.get("full_name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      cdl_class: formData.get("cdl_class"),
      truck_year: formData.get("truck_year"),
      truck_make: formData.get("truck_make"),
      truck_model: formData.get("truck_model"),
      num_trucks: formData.get("num_trucks"),
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left — pitch */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Drive With Us
            </h1>
            <p className="mt-6 text-lg text-navy-300 leading-relaxed">
              Own your truck? We'll handle the rest. Elite Truck Lines partners with
              owner-operators who want consistent freight, full back-office support,
              and no hassle. You drive. We manage everything else.
            </p>

            <div className="mt-8 space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                  <span className="text-navy-200">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 rounded-xl bg-navy-900/50 border border-navy-800">
              <h3 className="text-lg font-semibold text-white mb-2">
                How It Works
              </h3>
              <ol className="space-y-3 text-sm text-navy-300">
                <li className="flex gap-3">
                  <span className="text-accent-400 font-bold">1.</span>
                  Fill out the application below
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-400 font-bold">2.</span>
                  We review your info and reach out within 24-48 hours
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-400 font-bold">3.</span>
                  Complete onboarding — send us your documents, we set everything up
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-400 font-bold">4.</span>
                  Start driving. We book your first load.
                </li>
              </ol>
            </div>
          </div>

          {/* Right — form */}
          <div className="p-8 rounded-xl bg-navy-900/50 border border-navy-800">
            {submitted ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Application Received
                </h3>
                <p className="text-navy-400">
                  We'll review your application and reach out within 24-48 hours.
                  Thanks for your interest in Elite Truck Lines.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white mb-6">
                  Apply Now
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input name="full_name" id="full_name" label="Full Name" placeholder="John Smith" required />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input name="phone" id="phone" label="Phone" type="tel" placeholder="(555) 000-0000" required />
                    <Input name="email" id="email" label="Email" type="email" placeholder="john@example.com" required />
                  </div>
                  <Select name="cdl_class" id="cdl_class" label="CDL Class" options={cdlOptions} />
                  <div className="grid grid-cols-3 gap-4">
                    <Input name="truck_year" id="truck_year" label="Truck Year" placeholder="2022" />
                    <Input name="truck_make" id="truck_make" label="Make" placeholder="Peterbilt" />
                    <Input name="truck_model" id="truck_model" label="Model" placeholder="579" />
                  </div>
                  <Input name="num_trucks" id="num_trucks" label="Number of Trucks" type="number" placeholder="1" />
                  <div className="space-y-1">
                    <label htmlFor="notes" className="block text-sm font-medium text-navy-200">
                      Anything else we should know?
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      placeholder="Preferred lanes, experience, questions..."
                      className="w-full rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors resize-none"
                    />
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000/drive-with-us`. Fill out the form (will fail until Supabase is configured, but verify the UI looks correct).

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/drive-with-us/ src/app/api/applications/
git commit -m "feat: add Drive With Us page with application form and API"
```

---

## Task 9: Login Page + Auth Middleware

**Files:**
- Create: `src/app/login/page.tsx`, `src/middleware.ts`

- [ ] **Step 1: Create login page**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold text-white tracking-tight">
              ELITE<span className="text-accent-500"> TRUCK LINES</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-navy-400">Sign in to your dashboard</p>
        </div>

        <div className="p-8 rounded-xl bg-navy-900/50 border border-navy-800">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@elitetrucklines.com"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-navy-400 hover:text-accent-400 transition-colors">
            Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create auth middleware**

Create `src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from login
  if (request.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Visit `http://localhost:3000/login` — see login form. Try visiting `/dashboard` — should redirect to `/login`.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/ src/middleware.ts
git commit -m "feat: add login page and auth middleware for dashboard protection"
```

---

## Task 10: Dashboard Layout — Sidebar, Topbar, Chat Panel

**Files:**
- Create: `src/components/dashboard/Sidebar.tsx`, `src/components/dashboard/Topbar.tsx`, `src/components/dashboard/ChatPanel.tsx`, `src/components/dashboard/StatusBadge.tsx`, `src/components/dashboard/KpiCard.tsx`, `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Create StatusBadge component**

Create `src/components/dashboard/StatusBadge.tsx`:

```tsx
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  valid: "bg-green-500/10 text-green-400 border-green-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  onboarded: "bg-green-500/10 text-green-400 border-green-500/20",

  in_transit: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  booked: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pending: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reviewed: "bg-blue-500/10 text-blue-400 border-blue-500/20",

  expiring_soon: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  maintenance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  invoiced: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",

  suspended: "bg-red-500/10 text-red-400 border-red-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  out_of_service: "bg-red-500/10 text-red-400 border-red-500/20",
  inactive: "bg-red-500/10 text-red-400 border-red-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const colors = colorMap[status] || "bg-navy-700/50 text-navy-300 border-navy-600";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize",
        colors
      )}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Create KpiCard component**

Create `src/components/dashboard/KpiCard.tsx`:

```tsx
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

export default function KpiCard({ title, value, icon: Icon, subtitle }: KpiCardProps) {
  return (
    <div className="p-6 rounded-xl bg-navy-900/50 border border-navy-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-navy-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-navy-500">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center">
          <Icon size={20} className="text-accent-400" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Sidebar**

Create `src/components/dashboard/Sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Truck,
  ShieldCheck,
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/operators", icon: Users, label: "Operators" },
  { href: "/dashboard/fleet", icon: Truck, label: "Fleet" },
  { href: "/dashboard/compliance", icon: ShieldCheck, label: "Compliance" },
  { href: "/dashboard/clients", icon: Building2, label: "Clients" },
  { href: "/dashboard/loads", icon: Package, label: "Loads" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-30 flex flex-col bg-navy-950 border-r border-navy-800 transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-navy-800">
        {collapsed ? (
          <span className="text-lg font-bold text-accent-500 mx-auto">E</span>
        ) : (
          <Link href="/" className="text-sm font-bold text-white tracking-tight">
            ELITE<span className="text-accent-500"> TRUCK LINES</span>
          </Link>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-500/10 text-accent-400"
                  : "text-navy-400 hover:text-white hover:bg-navy-800/50"
              )}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-10 flex items-center justify-center border-t border-navy-800 text-navy-500 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
```

- [ ] **Step 4: Create Topbar**

Create `src/components/dashboard/Topbar.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Bell, LogOut } from "lucide-react";

export default function Topbar() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 bg-navy-950/80 backdrop-blur-md border-b border-navy-800 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors">
          <Bell size={18} />
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Create ChatPanel**

Create `src/components/dashboard/ChatPanel.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey, I'm your operations assistant. I can add or remove drivers, check compliance, book loads, and more. What do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.response }]);
    } catch {
      setMessages([
        ...updated,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors",
          open
            ? "bg-navy-800 text-white"
            : "bg-accent-500 text-white hover:bg-accent-600"
        )}
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-40 w-full sm:w-96 bg-navy-950 border-l border-navy-800 flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Operations Assistant</h2>
            <p className="text-xs text-navy-400">Powered by AI</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-navy-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto bg-accent-500 text-white"
                  : "bg-navy-800 text-navy-200"
              )}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-navy-400 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-navy-800 p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white placeholder:text-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Create dashboard layout**

Create `src/app/dashboard/layout.tsx`:

```tsx
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import ChatPanel from "@/components/dashboard/ChatPanel";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950">
      <Sidebar />
      <div className="ml-56 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <ChatPanel />
    </div>
  );
}
```

- [ ] **Step 7: Create placeholder dashboard overview page**

Create `src/app/dashboard/page.tsx`:

```tsx
export default function DashboardOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>
      <p className="text-navy-400">Dashboard content coming next...</p>
    </div>
  );
}
```

- [ ] **Step 8: Verify in browser**

```bash
npm run dev
```

Log in at `/login` (with the Supabase user you created). Should see the dashboard with sidebar, topbar, and the chat panel button in the bottom-right corner.

- [ ] **Step 9: Commit**

```bash
git add src/components/dashboard/ src/app/dashboard/
git commit -m "feat: add dashboard layout with sidebar, topbar, and AI chat panel"
```

---

## Task 11: AI Agent — System Prompt, Tools, and Handlers

**Files:**
- Create: `agent/system-prompt.ts`, `agent/tools.ts`, `agent/tool-handlers.ts`, `src/app/api/chat/route.ts`

- [ ] **Step 1: Create system prompt**

Create `agent/system-prompt.ts`:

```typescript
export const SYSTEM_PROMPT = `You are the operations assistant for Elite Truck Lines, a trucking company that manages owner-operators.

Your job is to help the team manage their business through natural conversation. You can add and remove drivers, track trucks, manage compliance documents, handle clients, and book loads.

BEHAVIOR:
- Be concise and direct. No fluff.
- When you successfully complete an action, confirm what you did in one sentence.
- When a command is ambiguous, ask ONE clarifying question.
- For destructive actions (removing a driver, deactivating a truck), always confirm before executing.
- If the user provides partial info (e.g., "add driver Marcus"), ask for the missing required fields.
- Use the user's language style — if they're casual, be casual back.

REQUIRED FIELDS:
- Adding an operator: full_name is required. Phone, email, CDL class, and commission rate are helpful but can be added later.
- Adding a truck: operator (name or ID) and at least make/model are required.
- Adding a document: operator or truck, document type, and expiration date are required.
- Adding a client: company name and type (shipper or broker) are required.
- Booking a load: operator, client, origin, destination, and rate are required.

COMMISSION:
- Elite Truck Lines takes 10-15% of the gross load rate. Default is 12% if not specified.
- elite_cut = rate * commission_rate
- operator_pay = rate - elite_cut

When searching, if you find multiple matches, list them and ask which one. If you find exactly one, use it.`;
```

- [ ] **Step 2: Create tool definitions**

Create `agent/tools.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "add_operator",
    description: "Add a new owner-operator to the system",
    input_schema: {
      type: "object" as const,
      properties: {
        full_name: { type: "string", description: "Operator's full name" },
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
        cdl_class: { type: "string", description: "CDL class (A or B)" },
        cdl_number: { type: "string", description: "CDL number" },
        commission_rate: {
          type: "number",
          description: "Commission rate as decimal (e.g., 0.12 for 12%). Defaults to 0.12.",
        },
      },
      required: ["full_name"],
    },
  },
  {
    name: "update_operator",
    description: "Update an existing operator's information or status",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
        full_name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        address: { type: "string" },
        cdl_class: { type: "string" },
        cdl_number: { type: "string" },
        commission_rate: { type: "number" },
        status: {
          type: "string",
          enum: ["active", "suspended", "inactive"],
        },
      },
      required: ["operator_id"],
    },
  },
  {
    name: "remove_operator",
    description: "Deactivate an operator (sets status to inactive)",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
      },
      required: ["operator_id"],
    },
  },
  {
    name: "search_operators",
    description: "Search for operators by name or filter by status",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Name to search for (partial match)" },
        status: { type: "string", enum: ["active", "suspended", "inactive"] },
      },
    },
  },
  {
    name: "add_truck",
    description: "Add a truck linked to an operator",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
        year: { type: "number" },
        make: { type: "string" },
        model: { type: "string" },
        vin: { type: "string" },
        license_plate: { type: "string" },
        license_state: { type: "string" },
        color: { type: "string" },
      },
      required: ["operator_id", "make", "model"],
    },
  },
  {
    name: "update_truck",
    description: "Update truck info or status",
    input_schema: {
      type: "object" as const,
      properties: {
        truck_id: { type: "string", description: "Truck UUID" },
        status: { type: "string", enum: ["active", "out_of_service", "maintenance"] },
        license_plate: { type: "string" },
        license_state: { type: "string" },
      },
      required: ["truck_id"],
    },
  },
  {
    name: "add_document",
    description: "Record a compliance document (CDL, medical card, insurance, etc.)",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID (for driver docs)" },
        truck_id: { type: "string", description: "Truck UUID (for vehicle docs)" },
        type: {
          type: "string",
          enum: [
            "cdl", "medical_card", "insurance", "registration",
            "drug_test", "annual_inspection", "w9", "operating_authority",
          ],
        },
        document_number: { type: "string" },
        issued_date: { type: "string", description: "YYYY-MM-DD" },
        expiration_date: { type: "string", description: "YYYY-MM-DD" },
        notes: { type: "string" },
      },
      required: ["type", "expiration_date"],
    },
  },
  {
    name: "get_expiring_documents",
    description: "Get documents expiring within a number of days",
    input_schema: {
      type: "object" as const,
      properties: {
        days: {
          type: "number",
          description: "Number of days to look ahead. Defaults to 30.",
        },
      },
    },
  },
  {
    name: "add_client",
    description: "Add a new shipper or broker client",
    input_schema: {
      type: "object" as const,
      properties: {
        company_name: { type: "string" },
        type: { type: "string", enum: ["shipper", "broker"] },
        contact_name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        mc_number: { type: "string" },
        dot_number: { type: "string" },
        payment_terms: {
          type: "string",
          enum: ["net_30", "net_15", "net_7", "quick_pay", "factoring", "other"],
        },
        notes: { type: "string" },
      },
      required: ["company_name", "type"],
    },
  },
  {
    name: "search_clients",
    description: "Search for clients by name or filter by type",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Company name search" },
        type: { type: "string", enum: ["shipper", "broker"] },
      },
    },
  },
  {
    name: "update_client",
    description: "Update client information",
    input_schema: {
      type: "object" as const,
      properties: {
        client_id: { type: "string", description: "Client UUID" },
        company_name: { type: "string" },
        contact_name: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        payment_terms: { type: "string" },
        notes: { type: "string" },
      },
      required: ["client_id"],
    },
  },
  {
    name: "add_load",
    description: "Book a new load",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string", description: "Operator UUID" },
        client_id: { type: "string", description: "Client UUID" },
        origin_city: { type: "string" },
        origin_state: { type: "string" },
        destination_city: { type: "string" },
        destination_state: { type: "string" },
        pickup_date: { type: "string", description: "YYYY-MM-DD" },
        delivery_date: { type: "string", description: "YYYY-MM-DD" },
        rate: { type: "number", description: "Gross pay in dollars" },
        miles: { type: "number" },
        notes: { type: "string" },
      },
      required: ["operator_id", "client_id", "origin_city", "origin_state", "destination_city", "destination_state", "rate"],
    },
  },
  {
    name: "update_load",
    description: "Update a load's status or details",
    input_schema: {
      type: "object" as const,
      properties: {
        load_id: { type: "string", description: "Load UUID" },
        status: {
          type: "string",
          enum: ["booked", "in_transit", "delivered", "invoiced", "paid"],
        },
        notes: { type: "string" },
      },
      required: ["load_id"],
    },
  },
  {
    name: "search_loads",
    description: "Search loads by operator, client, or status",
    input_schema: {
      type: "object" as const,
      properties: {
        operator_id: { type: "string" },
        client_id: { type: "string" },
        status: { type: "string" },
      },
    },
  },
  {
    name: "get_dashboard_stats",
    description: "Get KPI summary: active operators, trucks, loads this month, revenue, compliance score",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_applications",
    description: "List pending applications from the Drive With Us page",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["pending", "reviewed", "onboarded", "rejected"] },
      },
    },
  },
  {
    name: "onboard_application",
    description: "Convert a pending application into an active operator",
    input_schema: {
      type: "object" as const,
      properties: {
        application_id: { type: "string", description: "Application UUID" },
        commission_rate: {
          type: "number",
          description: "Commission rate. Defaults to 0.12.",
        },
      },
      required: ["application_id"],
    },
  },
];
```

- [ ] **Step 3: Create tool handlers**

Create `agent/tool-handlers.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { generateLoadNumber } from "@/lib/utils";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function handleToolCall(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const supabase = getSupabase();

  switch (name) {
    case "add_operator": {
      const { data, error } = await supabase
        .from("operators")
        .insert({
          full_name: input.full_name,
          phone: input.phone || null,
          email: input.email || null,
          cdl_class: input.cdl_class || null,
          cdl_number: input.cdl_number || null,
          commission_rate: input.commission_rate || 0.12,
        })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, operator: data });
    }

    case "update_operator": {
      const { operator_id, ...fields } = input;
      const { data, error } = await supabase
        .from("operators")
        .update(fields)
        .eq("id", operator_id)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, operator: data });
    }

    case "remove_operator": {
      const { data, error } = await supabase
        .from("operators")
        .update({ status: "inactive" })
        .eq("id", input.operator_id)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, operator: data });
    }

    case "search_operators": {
      let query = supabase.from("operators").select("*");
      if (input.query) {
        query = query.ilike("full_name", `%${input.query}%`);
      }
      if (input.status) {
        query = query.eq("status", input.status);
      }
      const { data, error } = await query.order("full_name");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ operators: data, count: data.length });
    }

    case "add_truck": {
      const { data, error } = await supabase
        .from("trucks")
        .insert({
          operator_id: input.operator_id,
          year: input.year || null,
          make: input.make,
          model: input.model,
          vin: input.vin || null,
          license_plate: input.license_plate || null,
          license_state: input.license_state || null,
          color: input.color || null,
        })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, truck: data });
    }

    case "update_truck": {
      const { truck_id, ...fields } = input;
      const { data, error } = await supabase
        .from("trucks")
        .update(fields)
        .eq("id", truck_id)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, truck: data });
    }

    case "add_document": {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          operator_id: input.operator_id || null,
          truck_id: input.truck_id || null,
          type: input.type,
          document_number: input.document_number || null,
          issued_date: input.issued_date || null,
          expiration_date: input.expiration_date,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, document: data });
    }

    case "get_expiring_documents": {
      const days = (input.days as number) || 30;
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from("documents")
        .select("*, operators(full_name), trucks(make, model, vin)")
        .lte("expiration_date", futureDate.toISOString().split("T")[0])
        .order("expiration_date");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ documents: data, count: data.length });
    }

    case "add_client": {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          company_name: input.company_name,
          type: input.type,
          contact_name: input.contact_name || null,
          phone: input.phone || null,
          email: input.email || null,
          mc_number: input.mc_number || null,
          dot_number: input.dot_number || null,
          payment_terms: input.payment_terms || "net_30",
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, client: data });
    }

    case "search_clients": {
      let query = supabase.from("clients").select("*");
      if (input.query) {
        query = query.ilike("company_name", `%${input.query}%`);
      }
      if (input.type) {
        query = query.eq("type", input.type);
      }
      const { data, error } = await query.order("company_name");
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ clients: data, count: data.length });
    }

    case "update_client": {
      const { client_id, ...fields } = input;
      const { data, error } = await supabase
        .from("clients")
        .update(fields)
        .eq("id", client_id)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, client: data });
    }

    case "add_load": {
      // Get operator's commission rate
      const { data: operator } = await supabase
        .from("operators")
        .select("commission_rate")
        .eq("id", input.operator_id)
        .single();

      const rate = input.rate as number;
      const commissionRate = operator?.commission_rate || 0.12;
      const eliteCut = Math.round(rate * commissionRate * 100) / 100;
      const operatorPay = Math.round((rate - eliteCut) * 100) / 100;

      const { data, error } = await supabase
        .from("loads")
        .insert({
          load_number: generateLoadNumber(),
          operator_id: input.operator_id,
          client_id: input.client_id,
          origin_city: input.origin_city,
          origin_state: input.origin_state,
          destination_city: input.destination_city,
          destination_state: input.destination_state,
          pickup_date: input.pickup_date || null,
          delivery_date: input.delivery_date || null,
          rate,
          miles: input.miles || null,
          commission_rate: commissionRate,
          elite_cut: eliteCut,
          operator_pay: operatorPay,
          notes: input.notes || null,
        })
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, load: data });
    }

    case "update_load": {
      const { load_id, ...fields } = input;
      const { data, error } = await supabase
        .from("loads")
        .update(fields)
        .eq("id", load_id)
        .select()
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, load: data });
    }

    case "search_loads": {
      let query = supabase
        .from("loads")
        .select("*, operators(full_name), clients(company_name)");
      if (input.operator_id) query = query.eq("operator_id", input.operator_id);
      if (input.client_id) query = query.eq("client_id", input.client_id);
      if (input.status) query = query.eq("status", input.status);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ loads: data, count: data.length });
    }

    case "get_dashboard_stats": {
      const [operators, trucks, loads, documents] = await Promise.all([
        supabase.from("operators").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("trucks").select("id", { count: "exact" }).eq("status", "active"),
        supabase
          .from("loads")
          .select("rate, elite_cut")
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from("documents").select("status"),
      ]);

      const monthlyRevenue = (loads.data || []).reduce(
        (sum, l) => sum + (Number(l.elite_cut) || 0),
        0
      );
      const totalDocs = (documents.data || []).length;
      const validDocs = (documents.data || []).filter(
        (d) => d.status === "valid"
      ).length;
      const complianceScore = totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 100;

      return JSON.stringify({
        active_operators: operators.count || 0,
        active_trucks: trucks.count || 0,
        loads_this_month: (loads.data || []).length,
        monthly_revenue: monthlyRevenue,
        compliance_score: complianceScore,
      });
    }

    case "get_applications": {
      let query = supabase.from("applications").select("*");
      if (input.status) {
        query = query.eq("status", input.status);
      } else {
        query = query.eq("status", "pending");
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ applications: data, count: data.length });
    }

    case "onboard_application": {
      const { data: app, error: fetchError } = await supabase
        .from("applications")
        .select("*")
        .eq("id", input.application_id)
        .single();

      if (fetchError || !app) {
        return JSON.stringify({ error: "Application not found" });
      }

      // Create operator from application
      const { data: operator, error: insertError } = await supabase
        .from("operators")
        .insert({
          full_name: app.full_name,
          phone: app.phone,
          email: app.email,
          cdl_class: app.cdl_class || null,
          commission_rate: (input.commission_rate as number) || 0.12,
        })
        .select()
        .single();

      if (insertError) return JSON.stringify({ error: insertError.message });

      // If application has truck info, create truck
      if (app.truck_make || app.truck_model) {
        await supabase.from("trucks").insert({
          operator_id: operator.id,
          year: app.truck_year ? parseInt(app.truck_year, 10) : null,
          make: app.truck_make || "Unknown",
          model: app.truck_model || "Unknown",
        });
      }

      // Update application status
      await supabase
        .from("applications")
        .update({ status: "onboarded" })
        .eq("id", input.application_id);

      return JSON.stringify({ success: true, operator });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
```

- [ ] **Step 4: Create the chat API route**

Create `src/app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "../../../../agent/system-prompt";
import { TOOLS } from "../../../../agent/tools";
import { handleToolCall } from "../../../../agent/tool-handlers";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  // Convert our simple message format to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = messages.map(
    (m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  try {
    // Agent loop — keep going until we get a final text response
    let currentMessages = [...anthropicMessages];
    let finalResponse = "";

    for (let i = 0; i < 10; i++) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: currentMessages,
      });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text"
      );

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0) {
        finalResponse = textBlocks.map((b) => b.text).join("\n");
        break;
      }

      // Process tool calls
      currentMessages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolBlock of toolUseBlocks) {
        const result = await handleToolCall(
          toolBlock.name,
          toolBlock.input as Record<string, unknown>
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolBlock.id,
          content: result,
        });
      }

      currentMessages.push({ role: "user", content: toolResults });

      // If stop reason is end_turn with text, grab it
      if (response.stop_reason === "end_turn" && textBlocks.length > 0) {
        finalResponse = textBlocks.map((b) => b.text).join("\n");
        break;
      }
    }

    return NextResponse.json({ response: finalResponse || "Done." });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Verify the chat works**

```bash
npm run dev
```

Log in, open the chat panel, type "What can you do?" — should get a response listing capabilities. Then try "Show me dashboard stats" — should call `get_dashboard_stats` and return results.

- [ ] **Step 6: Commit**

```bash
git add agent/ src/app/api/chat/
git commit -m "feat: add AI agent with system prompt, tools, and chat API"
```

---

## Task 12: Dashboard — Overview Page with Real Data

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Build the overview page with real Supabase data**

Replace `src/app/dashboard/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { formatCurrency } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Users, Truck, Package, DollarSign, ShieldCheck, FileWarning } from "lucide-react";

interface Stats {
  operators: number;
  trucks: number;
  loadsThisMonth: number;
  monthlyRevenue: number;
  complianceScore: number;
}

interface ExpiringDoc {
  id: string;
  type: string;
  expiration_date: string;
  status: string;
  operators: { full_name: string } | null;
}

interface Application {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    operators: 0,
    trucks: 0,
    loadsThisMonth: 0,
    monthlyRevenue: 0,
    complianceScore: 100,
  });
  const [expiringDocs, setExpiringDocs] = useState<ExpiringDoc[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const [ops, trucks, loads, docs, expiring, apps] = await Promise.all([
        supabase.from("operators").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("trucks").select("id", { count: "exact" }).eq("status", "active"),
        supabase.from("loads").select("elite_cut").gte("created_at", monthStart),
        supabase.from("documents").select("status"),
        supabase
          .from("documents")
          .select("id, type, expiration_date, status, operators(full_name)")
          .in("status", ["expiring_soon", "expired"])
          .order("expiration_date")
          .limit(10),
        supabase
          .from("applications")
          .select("id, full_name, phone, email, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const revenue = (loads.data || []).reduce(
        (sum, l) => sum + (Number(l.elite_cut) || 0),
        0
      );
      const totalDocs = (docs.data || []).length;
      const validDocs = (docs.data || []).filter((d) => d.status === "valid").length;

      setStats({
        operators: ops.count || 0,
        trucks: trucks.count || 0,
        loadsThisMonth: (loads.data || []).length,
        monthlyRevenue: revenue,
        complianceScore: totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 100,
      });
      setExpiringDocs((expiring.data as ExpiringDoc[]) || []);
      setApplications((apps.data as Application[]) || []);
    }

    loadData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "operators" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "loads" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard title="Active Operators" value={stats.operators} icon={Users} />
        <KpiCard title="Active Trucks" value={stats.trucks} icon={Truck} />
        <KpiCard title="Loads This Month" value={stats.loadsThisMonth} icon={Package} />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          subtitle="Elite's cut"
        />
        <KpiCard
          title="Compliance"
          value={`${stats.complianceScore}%`}
          icon={ShieldCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Documents */}
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileWarning size={18} className="text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Compliance Alerts</h2>
          </div>
          {expiringDocs.length === 0 ? (
            <p className="text-sm text-navy-400">All documents are up to date.</p>
          ) : (
            <div className="space-y-3">
              {expiringDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-2 border-b border-navy-800 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white">
                      {doc.operators?.full_name || "Unknown"} — {doc.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-navy-400">
                      Expires: {doc.expiration_date}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-accent-400" />
            <h2 className="text-lg font-semibold text-white">New Applications</h2>
          </div>
          {applications.length === 0 ? (
            <p className="text-sm text-navy-400">No pending applications.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2 border-b border-navy-800 last:border-0"
                >
                  <div>
                    <p className="text-sm text-white">{app.full_name}</p>
                    <p className="text-xs text-navy-400">
                      {app.phone} &middot; {app.email}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Visit `/dashboard`. Should see KPI cards (all zeros initially) and empty alert/application lists. Data will populate as you add records via the AI chat.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add dashboard overview with KPIs, compliance alerts, and applications"
```

---

## Task 13: Dashboard — Operators Page

**Files:**
- Create: `src/app/dashboard/operators/page.tsx`, `src/app/dashboard/operators/[id]/page.tsx`

- [ ] **Step 1: Create operators list page**

Create `src/app/dashboard/operators/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/dashboard/StatusBadge";
import Button from "@/components/ui/Button";
import { Search, Plus } from "lucide-react";

interface Operator {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  cdl_class: string;
  commission_rate: number;
  created_at: string;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      let query = supabase.from("operators").select("*").order("full_name");
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data } = await query;
      setOperators((data as Operator[]) || []);
    }
    load();

    const channel = supabase
      .channel("operators-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "operators" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  const filtered = operators.filter((op) =>
    op.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Operators</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-700 bg-navy-900 text-sm text-white placeholder:text-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-navy-700 bg-navy-900 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-6 py-3">
                Name
              </th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-6 py-3">
                Phone
              </th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-6 py-3">
                CDL
              </th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-6 py-3">
                Commission
              </th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase tracking-wider px-6 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-navy-400">
                  {search ? "No operators match your search." : "No operators yet. Use the AI chat to add one."}
                </td>
              </tr>
            ) : (
              filtered.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => router.push(`/dashboard/operators/${op.id}`)}
                  className="border-b border-navy-800/50 hover:bg-navy-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-white font-medium">{op.full_name}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{op.phone || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{op.cdl_class || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">
                    {Math.round(op.commission_rate * 100)}%
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={op.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create operator detail page**

Create `src/app/dashboard/operators/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, FileText, Package } from "lucide-react";
import Link from "next/link";

interface Operator {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  cdl_class: string;
  cdl_number: string;
  commission_rate: number;
  status: string;
  onboarded_at: string;
}

interface TruckRecord {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  license_plate: string;
  status: string;
}

interface Document {
  id: string;
  type: string;
  document_number: string;
  expiration_date: string;
  status: string;
}

interface Load {
  id: string;
  load_number: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  rate: number;
  operator_pay: number;
  status: string;
  pickup_date: string;
}

export default function OperatorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [trucks, setTrucks] = useState<TruckRecord[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [opRes, truckRes, docRes, loadRes] = await Promise.all([
        supabase.from("operators").select("*").eq("id", id).single(),
        supabase.from("trucks").select("*").eq("operator_id", id).order("created_at"),
        supabase.from("documents").select("*").eq("operator_id", id).order("expiration_date"),
        supabase
          .from("loads")
          .select("*")
          .eq("operator_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setOperator(opRes.data as Operator);
      setTrucks((truckRes.data as TruckRecord[]) || []);
      setDocuments((docRes.data as Document[]) || []);
      setLoads((loadRes.data as Load[]) || []);
    }
    load();
  }, [id]);

  if (!operator) {
    return <div className="text-navy-400">Loading...</div>;
  }

  const totalRevenue = loads.reduce((sum, l) => sum + (Number(l.operator_pay) || 0), 0);

  return (
    <div>
      <Link
        href="/dashboard/operators"
        className="inline-flex items-center gap-1 text-sm text-navy-400 hover:text-accent-400 mb-4 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Operators
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{operator.full_name}</h1>
          <p className="text-sm text-navy-400 mt-1">
            CDL {operator.cdl_class || "—"} &middot; {Math.round(operator.commission_rate * 100)}%
            commission &middot; Since {formatDate(operator.onboarded_at)}
          </p>
        </div>
        <StatusBadge status={operator.status} />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800">
          <p className="text-xs text-navy-400 mb-1">Phone</p>
          <p className="text-sm text-white">{operator.phone || "—"}</p>
        </div>
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800">
          <p className="text-xs text-navy-400 mb-1">Email</p>
          <p className="text-sm text-white">{operator.email || "—"}</p>
        </div>
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800">
          <p className="text-xs text-navy-400 mb-1">Total Revenue (Operator Pay)</p>
          <p className="text-sm text-white">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Trucks */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Truck size={16} className="text-accent-400" />
          <h2 className="text-lg font-semibold text-white">Trucks ({trucks.length})</h2>
        </div>
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Vehicle</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">VIN</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Plate</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {trucks.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-4 text-sm text-navy-400 text-center">No trucks</td></tr>
              ) : (
                trucks.map((t) => (
                  <tr key={t.id} className="border-b border-navy-800/50">
                    <td className="px-4 py-3 text-sm text-white">{t.year} {t.make} {t.model}</td>
                    <td className="px-4 py-3 text-sm text-navy-300 font-mono">{t.vin || "—"}</td>
                    <td className="px-4 py-3 text-sm text-navy-300">{t.license_plate || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-accent-400" />
          <h2 className="text-lg font-semibold text-white">Documents ({documents.length})</h2>
        </div>
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Type</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Number</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Expires</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-4 text-sm text-navy-400 text-center">No documents</td></tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="border-b border-navy-800/50">
                    <td className="px-4 py-3 text-sm text-white capitalize">{d.type.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-sm text-navy-300">{d.document_number || "—"}</td>
                    <td className="px-4 py-3 text-sm text-navy-300">{d.expiration_date || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Loads */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-accent-400" />
          <h2 className="text-lg font-semibold text-white">Recent Loads ({loads.length})</h2>
        </div>
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-navy-800">
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Load #</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Route</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Rate</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Your Pay</th>
                <th className="text-left text-xs font-medium text-navy-400 uppercase px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loads.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-sm text-navy-400 text-center">No loads</td></tr>
              ) : (
                loads.map((l) => (
                  <tr key={l.id} className="border-b border-navy-800/50">
                    <td className="px-4 py-3 text-sm text-white font-mono">{l.load_number}</td>
                    <td className="px-4 py-3 text-sm text-navy-300">
                      {l.origin_city}, {l.origin_state} → {l.destination_city}, {l.destination_state}
                    </td>
                    <td className="px-4 py-3 text-sm text-navy-300">{formatCurrency(l.rate)}</td>
                    <td className="px-4 py-3 text-sm text-green-400">{formatCurrency(l.operator_pay)}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify in browser**

Visit `/dashboard/operators`. Should see an empty table with a message to use AI chat. Add an operator via chat and confirm the table updates in real-time.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/operators/
git commit -m "feat: add operators list and detail pages"
```

---

## Task 14: Dashboard — Fleet, Compliance, Clients, Loads Pages

**Files:**
- Create: `src/app/dashboard/fleet/page.tsx`, `src/app/dashboard/compliance/page.tsx`, `src/app/dashboard/clients/page.tsx`, `src/app/dashboard/clients/[id]/page.tsx`, `src/app/dashboard/loads/page.tsx`

- [ ] **Step 1: Create Fleet page**

Create `src/app/dashboard/fleet/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Search } from "lucide-react";

interface TruckRow {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  license_plate: string;
  license_state: string;
  status: string;
  operators: { full_name: string } | null;
}

export default function FleetPage() {
  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("trucks")
        .select("*, operators(full_name)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data } = await query;
      setTrucks((data as TruckRow[]) || []);
    }
    load();

    const channel = supabase
      .channel("fleet-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "trucks" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  const filtered = trucks.filter(
    (t) =>
      `${t.year} ${t.make} ${t.model} ${t.vin || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Fleet</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trucks..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-700 bg-navy-900 text-sm text-white placeholder:text-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-navy-700 bg-navy-900 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="out_of_service">Out of Service</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Operator</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Vehicle</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">VIN</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Plate</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-navy-400">
                  No trucks found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{t.operators?.full_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{t.year} {t.make} {t.model}</td>
                  <td className="px-6 py-4 text-sm text-navy-300 font-mono">{t.vin || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{t.license_plate || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Compliance page**

Create `src/app/dashboard/compliance/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { daysUntil } from "@/lib/utils";

interface DocRow {
  id: string;
  type: string;
  document_number: string;
  expiration_date: string;
  status: string;
  operators: { full_name: string } | null;
  trucks: { make: string; model: string } | null;
}

type FilterMode = "all" | "expired" | "7" | "15" | "30";

export default function CompliancePage() {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [filter, setFilter] = useState<FilterMode>("all");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("documents")
        .select("*, operators(full_name), trucks(make, model)")
        .order("expiration_date");
      setDocuments((data as DocRow[]) || []);
    }
    load();

    const channel = supabase
      .channel("compliance")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = documents.filter((doc) => {
    if (filter === "all") return true;
    if (filter === "expired") return doc.status === "expired";
    const days = daysUntil(doc.expiration_date);
    return days <= parseInt(filter) && days >= 0;
  });

  const counts = {
    expired: documents.filter((d) => d.status === "expired").length,
    expiring: documents.filter((d) => d.status === "expiring_soon").length,
    valid: documents.filter((d) => d.status === "valid").length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Compliance</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{counts.expired}</p>
          <p className="text-xs text-red-400/70">Expired</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">{counts.expiring}</p>
          <p className="text-xs text-yellow-400/70">Expiring Soon</p>
        </div>
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <p className="text-2xl font-bold text-green-400">{counts.valid}</p>
          <p className="text-xs text-green-400/70">Valid</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: "all" as FilterMode, label: "All" },
          { value: "expired" as FilterMode, label: "Expired" },
          { value: "7" as FilterMode, label: "7 Days" },
          { value: "15" as FilterMode, label: "15 Days" },
          { value: "30" as FilterMode, label: "30 Days" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-accent-500/10 text-accent-400"
                : "text-navy-400 hover:text-white hover:bg-navy-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Owner</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Document</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Number</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Expires</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Days Left</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-navy-400">
                  No documents match this filter.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const days = daysUntil(doc.expiration_date);
                return (
                  <tr key={doc.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {doc.operators?.full_name || (doc.trucks ? `${doc.trucks.make} ${doc.trucks.model}` : "—")}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-300 capitalize">{doc.type.replace(/_/g, " ")}</td>
                    <td className="px-6 py-4 text-sm text-navy-300">{doc.document_number || "—"}</td>
                    <td className="px-6 py-4 text-sm text-navy-300">{doc.expiration_date}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={days <= 0 ? "text-red-400" : days <= 7 ? "text-red-400" : days <= 15 ? "text-orange-400" : days <= 30 ? "text-yellow-400" : "text-green-400"}>
                        {days <= 0 ? "Expired" : `${days} days`}
                      </span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Clients page**

Create `src/app/dashboard/clients/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Search } from "lucide-react";

interface Client {
  id: string;
  company_name: string;
  type: string;
  contact_name: string;
  phone: string;
  email: string;
  payment_terms: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      let query = supabase.from("clients").select("*").order("company_name");
      if (typeFilter !== "all") query = query.eq("type", typeFilter);
      const { data } = await query;
      setClients((data as Client[]) || []);
    }
    load();

    const channel = supabase
      .channel("clients-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [typeFilter]);

  const filtered = clients.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Clients</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy-700 bg-navy-900 text-sm text-white placeholder:text-navy-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-navy-700 bg-navy-900 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="all">All Types</option>
          <option value="shipper">Shippers</option>
          <option value="broker">Brokers</option>
        </select>
      </div>

      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Company</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Type</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Contact</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Phone</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-navy-400">
                  No clients yet.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/dashboard/clients/${c.id}`)}
                  className="border-b border-navy-800/50 hover:bg-navy-800/30 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-white font-medium">{c.company_name}</td>
                  <td className="px-6 py-4"><StatusBadge status={c.type} /></td>
                  <td className="px-6 py-4 text-sm text-navy-300">{c.contact_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{c.phone || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300 capitalize">{(c.payment_terms || "").replace(/_/g, " ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Client detail page**

Create `src/app/dashboard/clients/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  company_name: string;
  type: string;
  contact_name: string;
  phone: string;
  email: string;
  mc_number: string;
  dot_number: string;
  payment_terms: string;
  notes: string;
}

interface Load {
  id: string;
  load_number: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  rate: number;
  status: string;
  operators: { full_name: string } | null;
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loads, setLoads] = useState<Load[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [cRes, lRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).single(),
        supabase
          .from("loads")
          .select("*, operators(full_name)")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
      ]);
      setClient(cRes.data as Client);
      setLoads((lRes.data as Load[]) || []);
    }
    load();
  }, [id]);

  if (!client) return <div className="text-navy-400">Loading...</div>;

  return (
    <div>
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-navy-400 hover:text-accent-400 mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{client.company_name}</h1>
          <p className="text-sm text-navy-400 mt-1">
            {client.contact_name || "No contact"} &middot; {(client.payment_terms || "").replace(/_/g, " ")}
          </p>
        </div>
        <StatusBadge status={client.type} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800">
          <p className="text-xs text-navy-400 mb-1">Phone</p>
          <p className="text-sm text-white">{client.phone || "—"}</p>
        </div>
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800">
          <p className="text-xs text-navy-400 mb-1">Email</p>
          <p className="text-sm text-white">{client.email || "—"}</p>
        </div>
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800">
          <p className="text-xs text-navy-400 mb-1">MC Number</p>
          <p className="text-sm text-white">{client.mc_number || "—"}</p>
        </div>
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800">
          <p className="text-xs text-navy-400 mb-1">DOT Number</p>
          <p className="text-sm text-white">{client.dot_number || "—"}</p>
        </div>
      </div>

      {client.notes && (
        <div className="p-4 rounded-xl bg-navy-900/50 border border-navy-800 mb-8">
          <p className="text-xs text-navy-400 mb-1">Notes</p>
          <p className="text-sm text-navy-300">{client.notes}</p>
        </div>
      )}

      <h2 className="text-lg font-semibold text-white mb-3">Load History ({loads.length})</h2>
      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Load #</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Operator</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Route</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Rate</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loads.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-navy-400">No loads</td></tr>
            ) : (
              loads.map((l) => (
                <tr key={l.id} className="border-b border-navy-800/50">
                  <td className="px-6 py-4 text-sm text-white font-mono">{l.load_number}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{l.operators?.full_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">
                    {l.origin_city}, {l.origin_state} → {l.destination_city}, {l.destination_state}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-300">{formatCurrency(l.rate)}</td>
                  <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Loads page**

Create `src/app/dashboard/loads/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Search } from "lucide-react";

interface LoadRow {
  id: string;
  load_number: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  rate: number;
  elite_cut: number;
  operator_pay: number;
  status: string;
  pickup_date: string;
  operators: { full_name: string } | null;
  clients: { company_name: string } | null;
}

export default function LoadsPage() {
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("loads")
        .select("*, operators(full_name), clients(company_name)")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data } = await query;
      setLoads((data as LoadRow[]) || []);
    }
    load();

    const channel = supabase
      .channel("loads-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "loads" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  const totalGross = loads.reduce((s, l) => s + (Number(l.rate) || 0), 0);
  const totalEliteCut = loads.reduce((s, l) => s + (Number(l.elite_cut) || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Loads</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-navy-700 bg-navy-900 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="all">All Status</option>
          <option value="booked">Booked</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
        </select>

        <div className="ml-auto flex gap-4 text-sm">
          <span className="text-navy-400">
            Gross: <span className="text-white font-medium">{formatCurrency(totalGross)}</span>
          </span>
          <span className="text-navy-400">
            Elite Cut: <span className="text-accent-400 font-medium">{formatCurrency(totalEliteCut)}</span>
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Load #</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Operator</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Client</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Route</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Rate</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Elite Cut</th>
              <th className="text-left text-xs font-medium text-navy-400 uppercase px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-navy-400">
                  No loads found.
                </td>
              </tr>
            ) : (
              loads.map((l) => (
                <tr key={l.id} className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-mono">{l.load_number}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{l.operators?.full_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">{l.clients?.company_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-navy-300">
                    {l.origin_city}, {l.origin_state} → {l.destination_city}, {l.destination_state}
                  </td>
                  <td className="px-6 py-4 text-sm text-navy-300">{formatCurrency(l.rate)}</td>
                  <td className="px-6 py-4 text-sm text-accent-400">{formatCurrency(l.elite_cut)}</td>
                  <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify all pages in browser**

```bash
npm run dev
```

Check `/dashboard/fleet`, `/dashboard/compliance`, `/dashboard/clients`, `/dashboard/loads`. All should render with empty states.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/fleet/ src/app/dashboard/compliance/ src/app/dashboard/clients/ src/app/dashboard/loads/
git commit -m "feat: add fleet, compliance, clients, and loads dashboard pages"
```

---

## Task 15: Compliance Cron Job

**Files:**
- Create: `src/app/api/cron/compliance/route.ts`, `vercel.json`

- [ ] **Step 1: Create the cron endpoint**

Create `src/app/api/cron/compliance/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Verify cron secret
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

  // Mark expired documents
  const { count: expiredCount } = await supabase
    .from("documents")
    .update({ status: "expired" })
    .lt("expiration_date", today)
    .neq("status", "expired");

  // Mark expiring soon (within 30 days)
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
```

- [ ] **Step 2: Create vercel.json with cron config**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/compliance",
      "schedule": "0 6 * * *"
    }
  ]
}
```

This runs daily at 6 AM UTC.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/ vercel.json
git commit -m "feat: add daily compliance cron job for document status updates"
```

---

## Task 16: Final Cleanup and Push

- [ ] **Step 1: Remove old project files if any remain**

```bash
# Check for any remaining old files
ls -la
# Remove if present:
rm -rf compliance-agent dashboard elite-agents operations start.sh
```

- [ ] **Step 2: Update .gitignore**

Ensure `.gitignore` includes:

```
node_modules/
.next/
.env.local
.env
*.db
*.db-shm
*.db-wal
.DS_Store
```

- [ ] **Step 3: Run the dev server and do a full walkthrough**

```bash
npm run dev
```

Test the following flow:
1. Visit `/` — home page loads with hero, features, CTA
2. Visit `/about`, `/services`, `/contact` — all pages render
3. Visit `/drive-with-us` — fill out and submit the form
4. Visit `/login` — log in with your Supabase credentials
5. See `/dashboard` — overview with KPIs, the new application shows in alerts
6. Open AI chat → "Show me applications" → should list the one you just submitted
7. "Onboard the application from [name]" → should create operator
8. Check `/dashboard/operators` — new operator appears
9. "Add a 2022 Peterbilt 579 for [name]" → truck appears in `/dashboard/fleet`
10. "Add CDL for [name], expires 2027-06-15" → doc appears in `/dashboard/compliance`
11. Navigate sidebar — all pages work

- [ ] **Step 4: Final commit and push**

```bash
git add -A
git commit -m "feat: complete Elite Truck Lines rebuild — website, dashboard, and AI agent"
git push origin main
```
