"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";

type Truck = {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  license_plate: string;
  status: string;
  operators: { full_name: string } | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "out_of_service", label: "Out of Service" },
  { value: "maintenance", label: "Maintenance" },
];

export default function FleetPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchTrucks() {
      const { data, error } = await supabase
        .from("trucks")
        .select("id, year, make, model, vin, license_plate, status, operators(full_name)")
        .order("make", { ascending: true });

      if (!error && data) {
        setTrucks(data as unknown as Truck[]);
      }
      setLoading(false);
    }

    fetchTrucks();

    const channel = supabase
      .channel("fleet-trucks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trucks" },
        () => fetchTrucks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = trucks.filter((truck) => {
    const q = search.toLowerCase();
    const matchesSearch =
      truck.make.toLowerCase().includes(q) ||
      truck.model.toLowerCase().includes(q) ||
      truck.vin.toLowerCase().includes(q) ||
      truck.license_plate.toLowerCase().includes(q) ||
      (truck.operators?.full_name ?? "").toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" || truck.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-6">Fleet</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 text-navy-950 dark:text-white placeholder-navy-400 text-sm focus:outline-none focus:border-accent-500"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
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
      </div>

      {/* Table */}
      <div className="rounded-xl bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-200 dark:border-navy-800">
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Operator</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Vehicle</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">VIN</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Plate</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                  Loading fleet...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                  No vehicles found.
                </td>
              </tr>
            ) : (
              filtered.map((truck) => (
                <tr
                  key={truck.id}
                  className="border-b border-navy-200/50 dark:border-navy-800/50 hover:bg-navy-100/50 dark:hover:bg-navy-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-navy-950 dark:text-white">
                    {truck.operators?.full_name ?? (
                      <span className="text-navy-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy-950 dark:text-white">
                    {truck.year} {truck.make} {truck.model}
                  </td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300 font-mono text-xs">{truck.vin}</td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300">{truck.license_plate}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={truck.status} />
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
