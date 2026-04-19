"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { daysUntil } from "@/lib/utils";

type Document = {
  id: string;
  doc_type: string;
  doc_number: string;
  expires_at: string;
  status: string;
  operators: { full_name: string } | null;
  trucks: { make: string; model: string } | null;
};

type FilterOption = {
  value: string;
  label: string;
  maxDays?: number;
};

const FILTER_OPTIONS: FilterOption[] = [
  { value: "all", label: "All" },
  { value: "expired", label: "Expired" },
  { value: "7", label: "7 Days", maxDays: 7 },
  { value: "15", label: "15 Days", maxDays: 15 },
  { value: "30", label: "30 Days", maxDays: 30 },
];

function daysLeftColor(days: number): string {
  if (days < 0) return "text-red-400";
  if (days <= 7) return "text-red-400";
  if (days <= 30) return "text-yellow-400";
  return "text-green-400";
}

export default function CompliancePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchDocuments() {
      const { data, error } = await supabase
        .from("documents")
        .select(
          "id, doc_type, doc_number, expires_at, status, operators(full_name), trucks(make, model)"
        )
        .order("expires_at", { ascending: true });

      if (!error && data) {
        setDocuments(data as Document[]);
      }
      setLoading(false);
    }

    fetchDocuments();

    const channel = supabase
      .channel("compliance-documents")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => fetchDocuments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Summary counts
  const expiredCount = documents.filter((d) => daysUntil(d.expires_at) < 0).length;
  const expiringSoonCount = documents.filter(
    (d) => daysUntil(d.expires_at) >= 0 && daysUntil(d.expires_at) <= 30
  ).length;
  const validCount = documents.filter((d) => daysUntil(d.expires_at) > 30).length;

  // Filtered list
  const filtered = documents.filter((doc) => {
    const days = daysUntil(doc.expires_at);
    if (filter === "all") return true;
    if (filter === "expired") return days < 0;
    const maxDays = parseInt(filter, 10);
    return days >= 0 && days <= maxDays;
  });

  function ownerLabel(doc: Document): string {
    if (doc.operators?.full_name) return doc.operators.full_name;
    if (doc.trucks) return `${doc.trucks.make} ${doc.trucks.model}`;
    return "—";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Compliance</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-navy-900/50 border border-red-500/30 p-4">
          <p className="text-sm text-navy-400 mb-1">Expired</p>
          <p className="text-2xl font-bold text-red-400">{expiredCount}</p>
        </div>
        <div className="rounded-xl bg-navy-900/50 border border-yellow-500/30 p-4">
          <p className="text-sm text-navy-400 mb-1">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-400">{expiringSoonCount}</p>
          <p className="text-xs text-navy-400 mt-0.5">Within 30 days</p>
        </div>
        <div className="rounded-xl bg-navy-900/50 border border-green-500/30 p-4">
          <p className="text-sm text-navy-400 mb-1">Valid</p>
          <p className="text-2xl font-bold text-green-400">{validCount}</p>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === opt.value
                ? "bg-accent-500/20 text-accent-400 border border-accent-500/40"
                : "bg-navy-900/50 text-navy-400 border border-navy-800 hover:text-white hover:bg-navy-800/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Owner</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Document Type</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Number</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Expires</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Days Left</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-400">
                  Loading documents…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-400">
                  No documents found.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => {
                const days = daysUntil(doc.expires_at);
                return (
                  <tr
                    key={doc.id}
                    className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-white">{ownerLabel(doc)}</td>
                    <td className="px-4 py-3 text-navy-300 capitalize">
                      {doc.doc_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-navy-300 font-mono text-xs">
                      {doc.doc_number ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-navy-300">
                      {new Date(doc.expires_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className={`px-4 py-3 font-medium ${daysLeftColor(days)}`}>
                      {days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
