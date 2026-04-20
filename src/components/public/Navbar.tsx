"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Drive With Us", href: "/drive-with-us" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-navy-950/80 backdrop-blur-sm border-b border-navy-100 dark:border-navy-800/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 font-semibold text-base tracking-wide">
            <span className="text-navy-950 dark:text-white">ELITE</span>
            <span className="text-accent-500">TRUCK LINES</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-navy-950 dark:text-white font-medium"
                      : "text-navy-400 dark:text-navy-500 hover:text-navy-700 dark:hover:text-navy-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-navy-400 dark:text-navy-500 hover:text-navy-700 dark:hover:text-navy-300 transition-colors"
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <Link
              href="/login"
              className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              Dashboard
            </Link>
            <button
              className="md:hidden p-2 rounded-lg text-navy-400 dark:text-navy-500 hover:text-navy-700 dark:hover:text-navy-300 transition-colors"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 dark:bg-navy-950/95 backdrop-blur-sm border-t border-navy-100 dark:border-navy-800/50">
          <div className="px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "text-navy-950 dark:text-white font-medium"
                      : "text-navy-400 dark:text-navy-500 hover:text-navy-700 dark:hover:text-navy-300"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-3 px-3 py-2 rounded-full text-sm font-medium bg-accent-500 text-white text-center hover:bg-accent-600 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
