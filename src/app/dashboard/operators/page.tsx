"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";

type Operator = {
  id: string;
  name: string;
  phone: string | null;
  cdl_number: string | null;
  cdl_class: string | null;
  commission_pct: number | null;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
];

export default function OperatorsPage() {
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOperators = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("operators")
      .select("id, name, phone, cdl_number, cdl_class, commission_pct, status")
      .order("name");
    if (data) setOperators(data);
  }, []);

  useEffect(() => {
    fetchOperators();

    const supabase = createClient();
    const channel = supabase
      .channel("operators-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operators" },
        () => fetchOperators()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOperators]);

  const filtered = operators.filter((op) => {
    const matchesStatus =
      statusFilter === "all" || op.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      op.name.toLowerCase().includes(q) ||
      (op.phone ?? "").toLowerCase().includes(q) ||
      (op.cdl_number ?? "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Operators</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or CDL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-navy-400">
          {operators.length === 0
            ? "No operators yet. Use the AI chat to add one."
            : "No operators match your filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-navy-700">
          <table className="w-full text-sm">
            <thead className="bg-navy-800 text-navy-300 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">CDL</th>
                <th className="px-4 py-3 text-right">Commission (%)</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {filtered.map((op) => (
                <tr
                  key={op.id}
                  onClick={() => router.push(`/dashboard/operators/${op.id}`)}
                  className="bg-navy-900 hover:bg-navy-800 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {op.name}
                  </td>
                  <td className="px-4 py-3 text-navy-300">
                    {op.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-navy-300">
                    {op.cdl_number
                      ? `${op.cdl_number}${op.cdl_class ? ` (${op.cdl_class})` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-300">
                    {op.commission_pct != null
                      ? `${op.commission_pct}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={op.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
