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
      'We find the best-paying loads for your lanes and handle all broker negotiations so you never have to argue rates again.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance Management',
    description:
      'Stay DOT-compliant without the headache. We manage your MC authority, insurance certificates, and regulatory filings.',
  },
  {
    icon: FileText,
    title: 'Back-Office & Invoicing',
    description:
      'From rate confirmations to factoring submissions, we handle the paperwork so cash hits your account faster.',
  },
  {
    icon: Phone,
    title: 'Driver Support',
    description:
      'Real humans available when you need us. Whether you're dealing with a breakdown or a broker dispute, we have your back.',
  },
  {
    icon: MapPin,
    title: 'Route & Lane Optimization',
    description:
      'We analyze freight patterns to keep you loaded on the way out and on the way back, maximizing your revenue per mile.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pay',
    description:
      'Detailed settlement statements every week. Know exactly what you earned, what was deducted, and why — no surprises.',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Header */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-white mb-4">What We Do for You</h1>
        <p className="text-navy-300 text-lg leading-relaxed">
          From finding freight to getting you paid, Elite Truck Lines handles every part of running
          a trucking operation — so you can stay focused on driving.
        </p>
      </section>

      {/* Service Cards */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 rounded-xl bg-navy-900/50 border border-navy-800 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-accent-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-navy-300 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-navy-300 mb-6 text-lg">Ready to let us handle the heavy lifting?</p>
          <Link
            href="/drive-with-us"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-accent-500 text-white font-semibold text-lg hover:bg-accent-600 transition-colors"
          >
            Drive With Us
          </Link>
        </div>
      </section>
    </div>
  );
}
