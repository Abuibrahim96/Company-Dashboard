"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function Topbar() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-navy-950/80 backdrop-blur-md border-b border-navy-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <span className="text-white font-semibold">Dashboard</span>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800/50 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800/50 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
