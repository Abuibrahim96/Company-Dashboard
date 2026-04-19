import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Drive With Us", href: "/drive-with-us" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-navy-950 border-t border-navy-200 dark:border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-1 font-bold text-xl tracking-wide">
              <span className="text-navy-950 dark:text-white">ELITE</span>
              <span className="text-accent-500">TRUCK LINES</span>
            </Link>
            <p className="mt-4 text-navy-500 dark:text-navy-400 text-sm leading-relaxed">
              Reliable trucking and logistics solutions across North America.
              Delivering your freight safely and on time, every time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-navy-950 dark:text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-navy-950 dark:text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-navy-500 dark:text-navy-400 text-sm">
              <li>
                <span className="block">Email</span>
                <a
                  href="mailto:info@elitetrucklines.com"
                  className="text-accent-500 hover:text-accent-400 transition-colors"
                >
                  info@elitetrucklines.com
                </a>
              </li>
              <li className="pt-1">
                <span className="block">Phone</span>
                <a
                  href="tel:+15033095090"
                  className="text-accent-500 hover:text-accent-400 transition-colors"
                >
                  (503) 309-5090
                </a>
              </li>
              <li className="pt-1">
                <span className="block">Hours</span>
                <span>Open 24/7</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-navy-200 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-navy-400 dark:text-navy-500 text-xs">
          <span>&copy; {year} Elite Truck Lines. All rights reserved.</span>
          <span>Built for reliability. Driven by excellence.</span>
        </div>
      </div>
    </footer>
  );
}
