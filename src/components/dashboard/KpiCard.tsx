import { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
};

export default function KpiCard({ title, value, icon: Icon, subtitle }: KpiCardProps) {
  return (
    <div className="relative p-6 rounded-xl bg-navy-900/50 border border-navy-800">
      <div className="absolute top-6 right-6 p-2 rounded-lg bg-accent-500/10">
        <Icon className="w-5 h-5 text-accent-400" />
      </div>
      <p className="text-sm text-navy-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-navy-400">{subtitle}</p>
      )}
    </div>
  );
}
