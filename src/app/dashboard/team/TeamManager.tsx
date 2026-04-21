"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, Shield, User as UserIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile, UserRole } from "@/lib/auth";

interface Props {
  initialProfiles: Profile[];
  currentUserId: string;
}

export default function TeamManager({ initialProfiles, currentUserId }: Props) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("member");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (inviteBusy) return;
    setInviteError(null);
    setInviteBusy(true);

    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || null,
        role: inviteRole,
      }),
    });

    setInviteBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInviteError(body?.error ?? "Failed to send invite");
      return;
    }

    setProfiles((prev) => [...prev, body.profile as Profile]);
    setInviteEmail("");
    setInviteName("");
    setInviteRole("member");
    setInviteOpen(false);
    router.refresh();
  }

  async function changeRole(profile: Profile, nextRole: UserRole) {
    if (rowBusy) return;
    setRowError(null);
    setRowBusy(profile.user_id);
    const res = await fetch(`/api/team/${profile.user_id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    setRowBusy(null);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRowError({ id: profile.user_id, message: body?.error ?? "Failed to update role" });
      return;
    }
    setProfiles((prev) =>
      prev.map((p) => (p.user_id === profile.user_id ? (body.profile as Profile) : p))
    );
  }

  async function removeMember(profile: Profile) {
    if (rowBusy) return;
    const confirmed = window.confirm(
      `Remove ${profile.email}? They will lose access immediately and their account will be deleted.`
    );
    if (!confirmed) return;

    setRowError(null);
    setRowBusy(profile.user_id);
    const res = await fetch(`/api/team/${profile.user_id}`, { method: "DELETE" });
    setRowBusy(null);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRowError({ id: profile.user_id, message: body?.error ?? "Failed to remove member" });
      return;
    }
    setProfiles((prev) => prev.filter((p) => p.user_id !== profile.user_id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 dark:text-white">Team</h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
            Invite people and manage their access.
          </p>
        </div>
        <button
          onClick={() => setInviteOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-400 hover:bg-accent-500 text-white text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite member
        </button>
      </div>

      {inviteOpen && (
        <form
          onSubmit={submitInvite}
          className="bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 rounded-xl p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wide text-navy-500 dark:text-navy-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="person@example.com"
                className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-navy-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-navy-500 dark:text-navy-400 mb-1">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-navy-950 dark:text-white"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs uppercase tracking-wide text-navy-500 dark:text-navy-400 mb-1">
                Full name (optional)
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-navy-950 dark:text-white"
              />
            </div>
          </div>

          {inviteError && (
            <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {inviteError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setInviteOpen(false);
                setInviteError(null);
              }}
              className="px-4 py-2 rounded-lg text-sm text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteBusy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-400 hover:bg-accent-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {inviteBusy ? "Sending..." : "Send invite"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy-100 dark:bg-navy-800/50 text-navy-500 dark:text-navy-400">
            <tr>
              <th className="text-left font-medium uppercase tracking-wide text-xs px-4 py-3">
                Member
              </th>
              <th className="text-left font-medium uppercase tracking-wide text-xs px-4 py-3">
                Role
              </th>
              <th className="text-left font-medium uppercase tracking-wide text-xs px-4 py-3">
                Added
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-200 dark:divide-navy-800">
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-navy-500 dark:text-navy-400">
                  No team members yet.
                </td>
              </tr>
            ) : (
              profiles.map((p) => {
                const isSelf = p.user_id === currentUserId;
                const busy = rowBusy === p.user_id;
                const rowErr = rowError?.id === p.user_id ? rowError.message : null;
                return (
                  <tr key={p.user_id} className="text-navy-950 dark:text-white">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.full_name || p.email}</div>
                      {p.full_name && (
                        <div className="text-xs text-navy-500 dark:text-navy-400">{p.email}</div>
                      )}
                      {rowErr && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">{rowErr}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.role === "admin" ? (
                          <Shield className="w-4 h-4 text-accent-400" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-navy-400" />
                        )}
                        <select
                          value={p.role}
                          disabled={busy || isSelf}
                          onChange={(e) => changeRole(p, e.target.value as UserRole)}
                          className="rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-2 py-1 text-sm disabled:opacity-60"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy-500 dark:text-navy-400">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeMember(p)}
                        disabled={busy || isSelf}
                        title={isSelf ? "You can't remove yourself" : "Remove member"}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
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
