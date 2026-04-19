import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  FileText,
  Phone,
  MapPin,
  DollarSign,
} from 'lucide-react';

const services = [
  {
    icon: Truck,
    title: 'Dispatch & Load Booking',
    description:
      'We find the best-paying loads for your lanes and handle all broker negotiations.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Management',
    description:
      'MC authority, insurance certificates, and regulatory filings — managed for you.',
  },
  {
    icon: FileText,
    title: 'Back-Office & Invoicing',
    description:
      'Rate confirmations to factoring submissions, so cash hits your account faster.',
  },
  {
    icon: Phone,
    title: 'Driver Support',
    description:
      "Real humans available when you need us. Breakdowns, disputes — we have your back.",
  },
  {
    icon: MapPin,
    title: 'Route & Lane Optimization',
    description:
      'Stay loaded on the way out and on the way back, maximizing revenue per mile.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pay',
    description:
      'Detailed settlements every week. Know exactly what you earned and why.',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 text-navy-950 dark:text-white">
      {/* Header */}
      <section className="px-6 py-28 sm:py-36 max-w-2xl mx-auto text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">What We Do for You</h1>
        <p className="text-navy-500 dark:text-navy-400 text-lg leading-relaxed">
          From finding freight to getting you paid — we handle every part of running
          a trucking operation.
        </p>
      </section>

      {/* Service Cards */}
      <section className="px-6 pb-24 sm:pb-32 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl bg-navy-50/50 dark:bg-navy-900/30 p-8 transition-all hover:bg-navy-50 dark:hover:bg-navy-900/50 hover:shadow-sm hover:-translate-y-0.5"
            >
              <Icon className="w-5 h-5 text-accent-500 mb-4 transition-transform group-hover:scale-110" />
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-navy-500 dark:text-navy-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <p className="text-navy-500 dark:text-navy-400 mb-6">Ready to let us handle the heavy lifting?</p>
          <Link
            href="/drive-with-us"
            className="text-accent-500 hover:text-accent-600 font-medium transition-colors"
          >
            Drive with us &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
