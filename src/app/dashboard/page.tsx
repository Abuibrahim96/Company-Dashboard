"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Truck, Package, DollarSign, ShieldCheck, FileWarning } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { formatCurrency, formatDate } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";
import StatusBadge from "@/components/dashboard/StatusBadge";

type ComplianceDoc = {
  id: string;
  document_type: string;
  expiration_date: string;
  status: string;
  operators: { full_name: string } | null;
};

type Application = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
};

type DashboardData = {
  activeOperators: number;
  activeTrucks: number;
  loadsThisMonth: number;
  monthlyRevenue: number;
  complianceScore: number;
  expiringDocs: ComplianceDoc[];
  pendingApplications: Application[];
};

const initialData: DashboardData = {
  activeOperators: 0,
  activeTrucks: 0,
  loadsThisMonth: 0,
  monthlyRevenue: 0,
  complianceScore: 0,
  expiringDocs: [],
  pendingApplications: [],
};

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const supabase = createClient();

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [
      operatorsRes,
      trucksRes,
      loadsRes,
      docsAllRes,
      docsExpiringRes,
      applicationsRes,
    ] = await Promise.all([
      // 1. Active operators count
      supabase
        .from("operators")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),

      // 2. Active trucks count
      supabase
        .from("trucks")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),

      // 3. Loads this month — sum elite_cut
      supabase
        .from("loads")
        .select("elite_cut")
        .gte("created_at", firstOfMonth.toISOString()),

      // 4. All documents for compliance score
      supabase.from("documents").select("status"),

      // 5. Expiring / expired documents (top 10) with operator name
      supabase
        .from("documents")
        .select("id, document_type, expiration_date, status, operators(full_name)")
        .in("status", ["expiring_soon", "expired"])
        .order("expiration_date", { ascending: true })
        .limit(10),

      // 6. Pending applications (top 5)
      supabase
        .from("applications")
        .select("id, full_name, phone, email, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Derive KPI values
    const activeOperators = operatorsRes.count ?? 0;
    const activeTrucks = trucksRes.count ?? 0;

    const loadsThisMonth = loadsRes.data?.length ?? 0;
    const monthlyRevenue = (loadsRes.data ?? []).reduce(
      (sum, row) => sum + (row.elite_cut ?? 0),
      0
    );

    const allDocs = docsAllRes.data ?? [];
    const validDocs = allDocs.filter((d) => d.status === "valid").length;
    const complianceScore =
      allDocs.length > 0 ? Math.round((validDocs / allDocs.length) * 100) : 100;

    setData({
      activeOperators,
      activeTrucks,
      loadsThisMonth,
      monthlyRevenue,
      complianceScore,
      expiringDocs: (docsExpiringRes.data ?? []) as unknown as ComplianceDoc[],
      pendingApplications: (applicationsRes.data ?? []) as unknown as Application[],
    });
    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const supabase = createClient();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operators" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loads" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-950 dark:text-white mb-6">Overview</h1>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <KpiCard
          title="Active Operators"
          value={loading ? "—" : data.activeOperators}
          icon={Users}
        />
        <KpiCard
          title="Active Trucks"
          value={loading ? "—" : data.activeTrucks}
          icon={Truck}
        />
        <KpiCard
          title="Loads This Month"
          value={loading ? "—" : data.loadsThisMonth}
          icon={Package}
        />
        <KpiCard
          title="Monthly Revenue"
          value={loading ? "—" : formatCurrency(data.monthlyRevenue)}
          icon={DollarSign}
          subtitle="Elite's cut"
        />
        <KpiCard
          title="Compliance"
          value={loading ? "—" : `${data.complianceScore}%`}
          icon={ShieldCheck}
        />
      </div>

      {/* Two-column detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Alerts */}
        <div className="rounded-xl bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileWarning className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-semibold text-navy-950 dark:text-white">Compliance Alerts</h2>
          </div>

          {loading ? (
            <p className="text-sm text-navy-500 dark:text-navy-400">Loading...</p>
          ) : data.expiringDocs.length === 0 ? (
            <p className="text-sm text-navy-500 dark:text-navy-400">No expiring documents.</p>
          ) : (
            <ul className="space-y-3">
              {data.expiringDocs.map((doc) => (
                <li key={doc.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-950 dark:text-white truncate">
                      {doc.operators?.full_name ?? "Unknown Operator"}
                    </p>
                    <p className="text-xs text-navy-500 dark:text-navy-400 capitalize">
                      {doc.document_type.replace(/_/g, " ")}
                      {doc.expiration_date && (
                        <> &middot; expires {formatDate(doc.expiration_date)}</>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={doc.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* New Applications */}
        <div className="rounded-xl bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-accent-400" />
            <h2 className="text-base font-semibold text-navy-950 dark:text-white">New Applications</h2>
          </div>

          {loading ? (
            <p className="text-sm text-navy-500 dark:text-navy-400">Loading...</p>
          ) : data.pendingApplications.length === 0 ? (
            <p className="text-sm text-navy-500 dark:text-navy-400">No pending applications.</p>
          ) : (
            <ul className="space-y-1">
              {data.pendingApplications.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/dashboard/applications/${app.id}`}
                    className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-navy-100 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-navy-950 dark:text-white truncate">{app.full_name}</p>
                      <p className="text-xs text-navy-500 dark:text-navy-400 truncate">
                        {app.phone} &middot; {app.email}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
