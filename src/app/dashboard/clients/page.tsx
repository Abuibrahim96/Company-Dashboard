"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";

type Client = {
  id: string;
  company_name: string;
  type: string;
  contact_name: string;
  phone: string;
  payment_terms: string;
};

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "shipper", label: "Shipper" },
  { value: "broker", label: "Broker" },
];

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchClients() {
      const { data, error } = await supabase
        .from("clients")
        .select("id, company_name, type, contact_name, phone, payment_terms")
        .order("company_name", { ascending: true });

      if (!error && data) {
        setClients(data as Client[]);
      }
      setLoading(false);
    }

    fetchClients();

    const channel = supabase
      .channel("clients-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => fetchClients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = clients.filter((client) => {
    const q = search.toLowerCase();
    const matchesSearch =
      client.company_name.toLowerCase().includes(q) ||
      (client.contact_name ?? "").toLowerCase().includes(q) ||
      (client.phone ?? "").toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-6">Clients</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 text-navy-950 dark:text-white placeholder-navy-400 text-sm focus:outline-none focus:border-accent-500"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === opt.value
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
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Company</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Type</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Contact</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Phone</th>
              <th className="px-4 py-3 text-left text-navy-500 dark:text-navy-400 font-medium">Payment Terms</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                  Loading clients...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                  No clients found.
                </td>
              </tr>
            ) : (
              filtered.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="border-b border-navy-200/50 dark:border-navy-800/50 hover:bg-navy-100/50 dark:hover:bg-navy-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-navy-950 dark:text-white font-medium">{client.company_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={client.type} />
                  </td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300">{client.contact_name ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300">{client.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-600 dark:text-navy-300">{client.payment_terms ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
