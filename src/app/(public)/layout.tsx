import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import RecruitmentChat from "@/components/public/RecruitmentChat";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <RecruitmentChat />
    </div>
  );
}
