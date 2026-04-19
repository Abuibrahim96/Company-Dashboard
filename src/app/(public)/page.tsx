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
      "We find and book the best loads for you so you can focus on driving. Our dispatchers negotiate rates and handle all coordination.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Management",
    description:
      "Stay compliant with DOT regulations, ELD requirements, and all federal and state rules — we manage it all on your behalf.",
  },
  {
    icon: FileText,
    title: "Back-Office & Paperwork",
    description:
      "From invoicing and billing to factoring and settlements, our back-office team keeps your paperwork in order.",
  },
  {
    icon: Headphones,
    title: "24/7 Driver Support",
    description:
      "Breakdowns don't follow business hours. Our support team is available around the clock to help you handle any situation on the road.",
  },
];

const stats = [
  { value: "85-90%", label: "You Keep" },
  { value: "100%", label: "Back-Office Covered" },
  { value: "0", label: "Hidden Fees" },
];

const ctaChecks = [
  "No upfront costs",
  "Keep 85-90% of gross",
  "Full back-office support",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-50 via-white to-navy-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 py-24 md:py-36">
        {/* Radial gradient accent glow — top right */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 right-0 h-[600px] w-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(249,115,22,0.15) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            We Handle the Business.{" "}
            <span className="text-accent-400">You Handle the Road.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-600 dark:text-navy-300 md:text-xl">
            Elite Truck Lines partners with owner-operators and independent
            drivers — taking care of dispatch, compliance, billing, and support
            so you can stay focused on what you do best: driving.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/drive-with-us"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-7 py-3 text-base font-semibold text-white transition hover:bg-accent-600"
            >
              Drive With Us
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-lg border border-navy-300 dark:border-navy-600 px-7 py-3 text-base font-semibold text-navy-950 dark:text-white transition hover:bg-navy-100 dark:hover:bg-navy-800"
            >
              Our Services
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/50 py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-0 sm:divide-x sm:divide-navy-200 dark:sm:divide-navy-800">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center sm:px-16">
                <span className="text-4xl font-extrabold text-accent-400">
                  {value}
                </span>
                <span className="mt-1 text-sm font-medium uppercase tracking-widest text-navy-500 dark:text-navy-400">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Everything You Need, Nothing You Don&apos;t
            </h2>
            <p className="mt-4 text-navy-500 dark:text-navy-400">
              Our full-service model means you keep more money and less stress.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/50 p-6"
              >
                <div className="mb-4 inline-flex rounded-lg bg-accent-50 dark:bg-accent-500/10 p-3">
                  <Icon className="h-6 w-6 text-accent-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-navy-500 dark:text-navy-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-navy-200 dark:border-navy-800 bg-navy-50 dark:bg-navy-900/50 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to Partner With Us?
          </h2>
          <p className="mt-4 text-navy-500 dark:text-navy-400">
            Join drivers who keep more of what they earn with none of the
            back-office headaches.
          </p>

          <ul className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {ctaChecks.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
                <span className="text-navy-700 dark:text-navy-200">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link
              href="/drive-with-us"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-8 py-4 text-base font-semibold text-white transition hover:bg-accent-600"
            >
              Apply Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
