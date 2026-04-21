"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/utils";

type Load = {
  id: string;
  load_number: string;
  origin_city: string | null;
  origin_state: string | null;
  destination_city: string | null;
  destination_state: string | null;
  rate: number;
  elite_cut: number;
  status: string;
  operators: { full_name: string } | null;
  clients: { company_name: string } | null;
};

function formatCityState(city: string | null, state: string | null): string {
  const parts = [city, state].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "booked", label: "Booked" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
];

export default function LoadsPage() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchLoads() {
      const { data, error } = await supabase
        .from("loads")
        .select(
          "id, load_number, origin_city, origin_state, destination_city, destination_state, rate, elite_cut, status, operators(full_name), clients(company_name)"
        )
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLoads(data as unknown as Load[]);
      }
      setLoading(false);
    }

    fetchLoads();

    const channel = supabase
      .channel("loads-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loads" },
        () => fetchLoads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = loads.filter(
    (load) => statusFilter === "all" || load.status === statusFilter
  );

  const totalGross = filtered.reduce((sum, l) => sum + (l.rate ?? 0), 0);
  const totalEliteCut = filtered.reduce((sum, l) => sum + (l.elite_cut ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-6">Loads</h1>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-accent-50 dark:bg-accent-500/20 text-accent-400 border border-accent-500/40"
                : "bg-navy-50 dark:bg-navy-900/50 text-navy-500 dark:text-navy-400 border border-navy-200 dark:border-navy-800 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary line */}
      {!loading && (
        <div className="flex gap-6 mb-6 text-sm">
          <span className="text-navy-500 dark:text-navy-400">
            Total Gross:{" "}
            <span className="text-navy-950 dark:text-white font-semibold">{formatCurrency(totalGross)}</span>
          </span>
          <span className="text-navy-500 dark:text-navy-400">
            Total Elite Cut:{" "}
            <span className="text-accent-400 font-semibold">{formatCurrency(totalEliteCut)}</span>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-200 dark:border-navy-800">
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Load #</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Operator</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Client</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Route</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Rate</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Elite Cut</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                  Loading loads...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                  No loads found.
                </td>
              </tr>
            ) : (
              filtered.map((load) => (
                <tr
                  key={load.id}
                  className="border-b border-navy-200/50 dark:border-navy-800/50 hover:bg-navy-100/50 dark:hover:bg-navy-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-navy-950 dark:text-white font-mono text-xs">{load.load_number}</td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300">
                    {load.operators?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300">
                    {load.clients?.company_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300">
                    {formatCityState(load.origin_city, load.origin_state)} → {formatCityState(load.destination_city, load.destination_state)}
                  </td>
                  <td className="px-4 py-3 text-navy-950 dark:text-white">{formatCurrency(load.rate)}</td>
                  <td className="px-4 py-3 text-accent-400 font-medium">
                    {formatCurrency(load.elite_cut)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={load.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
