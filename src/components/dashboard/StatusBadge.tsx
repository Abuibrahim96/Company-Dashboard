type StatusBadgeProps = {
  status: string;
};

const colorMap: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/30",
  valid: "bg-green-500/10 text-green-400 border-green-500/30",
  delivered: "bg-green-500/10 text-green-400 border-green-500/30",
  paid: "bg-green-500/10 text-green-400 border-green-500/30",
  onboarded: "bg-green-500/10 text-green-400 border-green-500/30",

  in_transit: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  booked: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  pending: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  reviewed: "bg-blue-500/10 text-blue-400 border-blue-500/30",

  expiring_soon: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  maintenance: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  invoiced: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",

  suspended: "bg-red-500/10 text-red-400 border-red-500/30",
  expired: "bg-red-500/10 text-red-400 border-red-500/30",
  out_of_service: "bg-red-500/10 text-red-400 border-red-500/30",
  inactive: "bg-red-500/10 text-red-400 border-red-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass =
    colorMap[status] ?? "bg-navy-700/50 text-navy-300 border-navy-600/30";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${colorClass}`}
    >
      {label}
    </span>
  );
}
