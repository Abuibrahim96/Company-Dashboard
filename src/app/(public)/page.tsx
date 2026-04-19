import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  FileText,
  Headphones,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Dispatch & Load Booking",
    description:
      "We find and book the best loads so you can focus on driving.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Management",
    description:
      "Stay DOT-compliant without lifting a finger.",
  },
  {
    icon: FileText,
    title: "Back-Office & Paperwork",
    description:
      "Invoicing, billing, factoring, and settlements — handled.",
  },
  {
    icon: Headphones,
    title: "24/7 Driver Support",
    description:
      "Real humans, available around the clock.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white">
      {/* Hero */}
      <section className="py-32 sm:py-40">
        <div className="mx-auto max-w-3xl px-6 text-center animate-fade-in">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            We Handle the Business.{" "}
            <span className="text-accent-500">You Handle the Road.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg text-navy-500 dark:text-navy-400 leading-relaxed">
            Dispatch, compliance, billing, and support — so you can stay
            focused on what you do best.
          </p>

          <div className="mt-12">
            <Link
              href="/drive-with-us"
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-accent-600 hover:shadow-lg hover:shadow-accent-500/20"
            >
              Drive With Us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need
          </h2>
          <p className="mt-4 text-center text-navy-500 dark:text-navy-400">
            A full-service model so you keep more money and less stress.
          </p>

          <div className="mt-16 grid gap-10 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl bg-navy-50/50 dark:bg-navy-900/30 p-8 transition-all hover:bg-navy-50 dark:hover:bg-navy-900/50 hover:shadow-sm"
              >
                <Icon className="h-6 w-6 text-accent-500 mb-4 transition-transform group-hover:scale-110" />
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-navy-500 dark:text-navy-400 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to partner with us?
          </h2>
          <p className="mt-4 text-navy-500 dark:text-navy-400">
            Join drivers who keep more of what they earn.
          </p>
          <div className="mt-10">
            <Link
              href="/drive-with-us"
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-8 py-3.5 text-base font-medium text-white transition-all hover:bg-accent-600 hover:shadow-lg hover:shadow-accent-500/20"
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
