"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, FileText, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/utils";

type Client = {
  id: string;
  company_name: string;
  type: string;
  contact_name: string;
  phone: string;
  email: string;
  mc_number: string;
  dot_number: string;
  notes: string | null;
  payment_terms: string;
};

type Load = {
  id: string;
  load_number: string;
  origin: string;
  destination: string;
  rate: number;
  status: string;
  operators: { full_name: string } | null;
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    async function fetchData() {
      const [clientRes, loadsRes] = await Promise.all([
        supabase
          .from("clients")
          .select(
            "id, company_name, type, contact_name, phone, email, mc_number, dot_number, notes, payment_terms"
          )
          .eq("id", id)
          .single(),
        supabase
          .from("loads")
          .select(
            "id, load_number, origin, destination, rate, status, operators(full_name)"
          )
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (!clientRes.error && clientRes.data) {
        setClient(clientRes.data as Client);
      }
      if (!loadsRes.error && loadsRes.data) {
        setLoads(loadsRes.data as unknown as Load[]);
      }
      setLoading(false);
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-navy-400">Loading client…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-navy-400">Client not found.</p>
      </div>
    );
  }

  const infoCards = [
    { icon: Phone, label: "Phone", value: client.phone ?? "—" },
    { icon: Mail, label: "Email", value: client.email ?? "—" },
    { icon: FileText, label: "MC Number", value: client.mc_number ?? "—" },
    { icon: Truck, label: "DOT Number", value: client.dot_number ?? "—" },
  ];

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-sm text-navy-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{client.company_name}</h1>
          {client.contact_name && (
            <p className="text-sm text-navy-400 mt-0.5">{client.contact_name}</p>
          )}
        </div>
        <StatusBadge status={client.type} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {infoCards.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl bg-navy-900/50 border border-navy-800 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-accent-400" />
              <p className="text-xs text-navy-400">{label}</p>
            </div>
            <p className="text-sm text-white font-medium break-all">{value}</p>
          </div>
        ))}
      </div>

      {/* Payment Terms */}
      {client.payment_terms && (
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-4 mb-6">
          <p className="text-xs text-navy-400 mb-1">Payment Terms</p>
          <p className="text-sm text-white">{client.payment_terms}</p>
        </div>
      )}

      {/* Notes */}
      {client.notes && (
        <div className="rounded-xl bg-navy-900/50 border border-navy-800 p-4 mb-6">
          <p className="text-xs text-navy-400 mb-2">Notes</p>
          <p className="text-sm text-navy-300 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Load History */}
      <h2 className="text-lg font-semibold text-white mb-3">Load History</h2>
      <div className="rounded-xl bg-navy-900/50 border border-navy-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-800">
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Load #</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Operator</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Route</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Rate</th>
              <th className="px-4 py-3 text-left text-navy-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-navy-400">
                  No loads found for this client.
                </td>
              </tr>
            ) : (
              loads.map((load) => (
                <tr
                  key={load.id}
                  className="border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-mono text-xs">{load.load_number}</td>
                  <td className="px-4 py-3 text-navy-300">
                    {load.operators?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-navy-300">
                    {load.origin} → {load.destination}
                  </td>
                  <td className="px-4 py-3 text-white">{formatCurrency(load.rate)}</td>
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
