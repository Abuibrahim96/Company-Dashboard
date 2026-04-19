"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Truck, FileText, Package } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Operator = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cdl_number: string | null;
  cdl_class: string | null;
  commission_pct: number | null;
  status: string;
  created_at: string;
};

type TruckRow = {
  id: string;
  vehicle: string | null;
  vin: string | null;
  plate: string | null;
  status: string;
};

type DocumentRow = {
  id: string;
  type: string;
  number: string | null;
  expires: string | null;
  status: string;
};

type LoadRow = {
  id: string;
  load_number: string | null;
  origin: string | null;
  destination: string | null;
  rate: number | null;
  operator_pay: number | null;
  status: string;
};

export default function OperatorDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [operator, setOperator] = useState<Operator | null>(null);
  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loads, setLoads] = useState<LoadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    async function load() {
      const [opRes, trucksRes, docsRes, loadsRes] = await Promise.all([
        supabase
          .from("operators")
          .select(
            "id, name, email, phone, cdl_number, cdl_class, commission_pct, status, created_at"
          )
          .eq("id", id)
          .single(),
        supabase
          .from("trucks")
          .select("id, vehicle, vin, plate, status")
          .eq("operator_id", id),
        supabase
          .from("documents")
          .select("id, type, number, expires, status")
          .eq("operator_id", id),
        supabase
          .from("loads")
          .select("id, load_number, origin, destination, rate, operator_pay, status")
          .eq("operator_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (opRes.data) setOperator(opRes.data);
      if (trucksRes.data) setTrucks(trucksRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (loadsRes.data) setLoads(loadsRes.data);
      setLoading(false);
    }

    load();
  }, [id]);

  const totalRevenue = loads.reduce(
    (sum, l) => sum + (l.operator_pay ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-navy-400">
        Loading…
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="text-center py-16 text-navy-400">
        Operator not found.{" "}
        <Link href="/dashboard/operators" className="text-gold-400 underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/dashboard/operators"
        className="inline-flex items-center gap-2 text-navy-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Operators
      </Link>

      {/* Header */}
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{operator.name}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-navy-300">
              {operator.cdl_class && (
                <span>CDL Class {operator.cdl_class}</span>
              )}
              {operator.commission_pct != null && (
                <span>Commission: {operator.commission_pct}%</span>
              )}
              <span>Onboarded: {formatDate(operator.created_at)}</span>
            </div>
          </div>
          <StatusBadge status={operator.status} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard label="Phone" value={operator.phone ?? "—"} />
        <InfoCard label="Email" value={operator.email ?? "—"} />
        <InfoCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          highlight
        />
      </div>

      {/* Trucks */}
      <Section icon={<Truck className="w-5 h-5" />} title="Trucks">
        {trucks.length === 0 ? (
          <Empty message="No trucks assigned." />
        ) : (
          <TableWrapper>
            <thead className="bg-navy-800 text-navy-300 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">VIN</th>
                <th className="px-4 py-3 text-left">Plate</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {trucks.map((t) => (
                <tr key={t.id} className="bg-navy-900">
                  <td className="px-4 py-3 text-white">{t.vehicle ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-300">{t.vin ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-300">{t.plate ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </Section>

      {/* Documents */}
      <Section icon={<FileText className="w-5 h-5" />} title="Documents">
        {documents.length === 0 ? (
          <Empty message="No documents on file." />
        ) : (
          <TableWrapper>
            <thead className="bg-navy-800 text-navy-300 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Number</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {documents.map((d) => (
                <tr key={d.id} className="bg-navy-900">
                  <td className="px-4 py-3 text-white capitalize">
                    {d.type.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-navy-300">{d.number ?? "—"}</td>
                  <td className="px-4 py-3 text-navy-300">
                    {d.expires ? formatDate(d.expires) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </Section>

      {/* Recent Loads */}
      <Section icon={<Package className="w-5 h-5" />} title="Recent Loads">
        {loads.length === 0 ? (
          <Empty message="No loads found." />
        ) : (
          <TableWrapper>
            <thead className="bg-navy-800 text-navy-300 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Load #</th>
                <th className="px-4 py-3 text-left">Route</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Operator Pay</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700">
              {loads.map((l) => (
                <tr key={l.id} className="bg-navy-900">
                  <td className="px-4 py-3 text-white font-mono text-xs">
                    {l.load_number ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-navy-300">
                    {l.origin && l.destination
                      ? `${l.origin} → ${l.destination}`
                      : (l.origin ?? l.destination ?? "—")}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-300">
                    {l.rate != null ? formatCurrency(l.rate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-300">
                    {l.operator_pay != null
                      ? formatCurrency(l.operator_pay)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        )}
      </Section>
    </div>
  );
}

/* ── Small helpers ─────────────────────────────────────────────────────────── */

function InfoCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-5">
      <p className="text-xs text-navy-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-lg font-semibold ${highlight ? "text-gold-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white font-semibold text-lg mb-3">
        <span className="text-gold-400">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-navy-700">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-navy-400 bg-navy-900 rounded-xl border border-navy-700">
      {message}
    </div>
  );
}
