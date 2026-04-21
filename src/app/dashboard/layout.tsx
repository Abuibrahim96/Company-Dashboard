import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import ChatPanel from "@/components/dashboard/ChatPanel";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  const role = current?.role ?? "member";

  return (
    <div className="min-h-screen bg-white dark:bg-navy-950">
      <Sidebar role={role} />
      <div className="ml-56 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <ChatPanel />
    </div>
  );
}
