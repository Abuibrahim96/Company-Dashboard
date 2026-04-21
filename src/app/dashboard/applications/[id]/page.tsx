"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Phone, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatDate } from "@/lib/utils";

type Application = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  cdl_class: string | null;
  truck_year: string | null;
  truck_make: string | null;
  truck_model: string | null;
  num_trucks: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ActionStatus = "contacted" | "approved" | "rejected";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<ActionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("applications")
      .select(
        "id, full_name, phone, email, cdl_class, truck_year, truck_make, truck_model, num_trucks, notes, status, created_at, updated_at"
      )
      .eq("id", id)
      .single();

    if (fetchError) {
      setApplication(null);
    } else {
      setApplication(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(next: ActionStatus) {
    if (!application || saving) return;
    setError(null);
    setSaving(next);

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("applications")
      .update({ status: next })
      .eq("id", application.id)
      .select(
        "id, full_name, phone, email, cdl_class, truck_year, truck_make, truck_model, num_trucks, notes, status, created_at, updated_at"
      )
      .single();

    setSaving(null);
    if (updateError || !data) {
      setError(updateError?.message ?? "Failed to update status. Please try again.");
      return;
    }
    setApplication(data);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-navy-500 dark:text-navy-400">
        Loading...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-16 text-navy-500 dark:text-navy-400">
        Application not found.{" "}
        <Link href="/dashboard" className="text-accent-400 underline">
          Go back
        </Link>
      </div>
    );
  }

  const truck = [application.truck_year, application.truck_make, application.truck_model]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-navy-500 dark:text-navy-400 hover:text-navy-950 dark:hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="bg-navy-100 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-950 dark:text-white">
              {application.full_name}
            </h1>
            <p className="mt-2 text-sm text-navy-600 dark:text-navy-300">
              Submitted {formatDate(application.created_at)}
              {application.updated_at !== application.created_at && (
                <> &middot; Updated {formatDate(application.updated_at)}</>
              )}
            </p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      {/* Action bar */}
      <div className="bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <ActionButton
            variant="approve"
            label="Approve"
            icon={<Check className="w-4 h-4" />}
            active={application.status === "approved"}
            loading={saving === "approved"}
            disabled={saving !== null || application.status === "approved"}
            onClick={() => updateStatus("approved")}
          />
          <ActionButton
            variant="neutral"
            label="Mark as Contacted"
            icon={<Phone className="w-4 h-4" />}
            active={application.status === "contacted"}
            loading={saving === "contacted"}
            disabled={saving !== null || application.status === "contacted"}
            onClick={() => updateStatus("contacted")}
          />
          <ActionButton
            variant="reject"
            label="Reject"
            icon={<X className="w-4 h-4" />}
            active={application.status === "rejected"}
            loading={saving === "rejected"}
            disabled={saving !== null || application.status === "rejected"}
            onClick={() => updateStatus("rejected")}
          />
        </div>
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Submitted fields */}
      <div>
        <h2 className="text-lg font-semibold text-navy-950 dark:text-white mb-3">
          Submitted Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone" value={application.phone} copyable />
          <Field label="Email" value={application.email} copyable />
          <Field label="CDL Class" value={application.cdl_class} />
          <Field
            label="Number of Trucks"
            value={application.num_trucks != null ? String(application.num_trucks) : null}
          />
          <Field label="Truck" value={truck || null} span2 />
          <Field label="Notes" value={application.notes} span2 multiline />
        </dl>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  span2 = false,
  copyable = false,
  multiline = false,
}: {
  label: string;
  value: string | null;
  span2?: boolean;
  copyable?: boolean;
  multiline?: boolean;
}) {
  const display = value && value.trim() ? value : "—";
  return (
    <div
      className={`bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 rounded-xl p-4 ${span2 ? "sm:col-span-2" : ""}`}
    >
      <dt className="text-xs text-navy-500 dark:text-navy-400 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd
        className={`text-sm text-navy-950 dark:text-white ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {copyable && value ? (
          <a
            href={label === "Email" ? `mailto:${value}` : `tel:${value}`}
            className="hover:text-accent-400 transition-colors"
          >
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  active,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  variant: "approve" | "reject" | "neutral";
  active: boolean;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:cursor-not-allowed";
  const styles = {
    approve: active
      ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/40"
      : "bg-green-500 hover:bg-green-600 text-white border-green-500 disabled:opacity-50",
    reject: active
      ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40"
      : "bg-white dark:bg-navy-900 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-500/40 disabled:opacity-50",
    neutral: active
      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/40"
      : "bg-white dark:bg-navy-900 hover:bg-navy-100 dark:hover:bg-navy-800 text-navy-950 dark:text-white border-navy-300 dark:border-navy-700 disabled:opacity-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} flex-1`}
    >
      {icon}
      {loading ? "Saving..." : label}
    </button>
  );
}
