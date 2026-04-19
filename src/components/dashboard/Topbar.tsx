"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase-browser";

export default function Topbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md border-b border-navy-200 dark:border-navy-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <span className="text-navy-950 dark:text-white font-semibold">Dashboard</span>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800/50 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notification bell */}
        <button
          className="p-2 rounded-lg text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800/50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800/50 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
