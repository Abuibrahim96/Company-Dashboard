import Link from "next/link";

const links = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Drive With Us", href: "/drive-with-us" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-navy-950 border-t border-navy-100 dark:border-navy-800/50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-1 font-semibold text-base tracking-wide">
              <span className="text-navy-950 dark:text-white">ELITE</span>
              <span className="text-accent-500">TRUCK LINES</span>
            </Link>
            <p className="mt-2 text-navy-400 dark:text-navy-500 text-sm">
              Reliable trucking across North America.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-navy-400 dark:text-navy-500 hover:text-navy-700 dark:hover:text-navy-300 text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-navy-100 dark:border-navy-800/50 text-navy-400 dark:text-navy-600 text-xs">
          &copy; {year} Elite Truck Lines. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
