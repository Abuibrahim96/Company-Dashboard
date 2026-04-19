"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Operators", href: "/dashboard/operators", icon: Users, exact: false },
  { label: "Fleet", href: "/dashboard/fleet", icon: Truck, exact: false },
  { label: "Compliance", href: "/dashboard/compliance", icon: ShieldCheck, exact: false },
  { label: "Clients", href: "/dashboard/clients", icon: Building2, exact: false },
  { label: "Loads", href: "/dashboard/loads", icon: Package, exact: false },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-navy-950 border-r border-navy-200 dark:border-navy-800 flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-navy-200 dark:border-navy-800 overflow-hidden">
        {collapsed ? (
          <span className="text-xl font-bold text-accent-400">E</span>
        ) : (
          <span className="text-lg font-bold text-navy-950 dark:text-white whitespace-nowrap">
            Elite Truck Lines
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 overflow-hidden">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-50 dark:bg-accent-500/10 text-accent-400"
                  : "text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800/50"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="whitespace-nowrap">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-navy-200 dark:border-navy-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800/50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
