"use client";
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import { AppRole, ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/roles";
import { useRole } from "@/lib/RoleContext";
import {
  Users, Plus, Search, Shield, User, Edit2, Trash2,
  X, ShieldCheck, Mail, RefreshCw, Send, Clock, KeyRound,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  is_registered: boolean;
  created_at: string;
  last_login: string | null;
}

const INITIAL_FORM = { name: "", email: "", role: "user" as AppRole, is_active: true };

export default function UserManagementPage() {
  const { role: currentUserRole, user: currentUserInfo } = useRole();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserRow | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [sendingResetId, setSendingResetId] = useState<number | null>(null);

  /* ── Data fetching ─────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
        if (silent) toast.success("User list refreshed");
      } else {
        toast.error(data.error ?? "Failed to fetch users");
      }
    } catch {
      toast.error("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchUsers());
  }, [fetchUsers]);

  /* ── Modal helpers ─────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditingUser(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, is_active: u.is_active });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingUser(null); };

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    const method = editingUser ? "PUT" : "POST";
    const payload: Record<string, unknown> = { ...formData };

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();

      if (res.ok) {
        closeModal();
        await fetchUsers(false);
        if (editingUser) {
          toast.success(`${formData.name} updated successfully`);
        } else {
          toast.success(`Invitation sent to ${formData.email}`);
        }
      } else {
        toast.error(data.error ?? "Failed to save user");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const handleDelete = (u: UserRow) => setPendingDelete(u);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const u = pendingDelete;
    setPendingDelete(null);
    setDeleting(u.id);
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${u.name} has been removed`);
        await fetchUsers(false);
      } else {
        toast.error(data.error ?? "Failed to delete user");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setDeleting(null);
    }
  };

  /* ── Toggle active ─────────────────────────────────────────────────────── */
  const toggleActive = async (u: UserRow) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !u.is_active }) });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
        toast.info(`${u.name} is now ${!u.is_active ? "active" : "inactive"}`);
      } else {
        toast.error(data.error ?? "Failed to update status");
      }
    } catch {
      toast.error("Network error");
    }
  };

  /* ── Resend invite ─────────────────────────────────────────────────────── */
  const resendInvite = async (u: UserRow) => {
    setResendingId(u.id);
    try {
      const res = await fetch("/api/users/resend-invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id }) });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation resent to ${u.email}`);
      } else {
        toast.error(data.error ?? "Failed to resend invitation");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setResendingId(null);
    }
  };

  /* ── Send reset link ──────────────────────────────────────────────────── */
  const sendReset = async (u: UserRow) => {
    setSendingResetId(u.id);
    try {
      const res = await fetch("/api/users/send-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id }) });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Password reset link sent to ${u.email}`);
      } else {
        toast.error(data.error ?? "Failed to send reset link");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSendingResetId(null);
    }
  };

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const visibleUsers = currentUserRole === "super_admin"
    ? users
    : users.filter((u) => u.role !== "super_admin");

  const filteredUsers = visibleUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: visibleUsers.length,
    active: visibleUsers.filter((u) => u.is_active).length,
    superAdmins: users.filter((u) => u.role === "super_admin").length,
    admins: visibleUsers.filter((u) => u.role === "admin").length,
    pending: visibleUsers.filter((u) => !u.is_registered).length,
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0086D1]/10 text-[#0086D1] text-xs font-bold uppercase tracking-wider mb-4 border border-[#0086D1]/20">
              <Users size={14} /> Administration
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">User Management</h1>
            <p className="text-slate-500 font-medium">Manage system access, roles, and accounts for Aman Berki Estates.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchUsers(true)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white px-3 py-2.5 rounded-xl text-xs font-bold transition-colors hover:bg-slate-50">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-[#0086D1] hover:bg-[#0070b0] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#0086D1]/25">
              <Plus size={16} /> Invite User
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.total, color: "from-slate-900 to-slate-700" },
            { label: "Active", value: stats.active, color: "from-green-600 to-green-400" },
            { label: "Pending", value: stats.pending, color: "from-amber-600 to-amber-400" },
            { label: "Super Admins", value: stats.superAdmins, color: "from-purple-600 to-purple-400" },
            { label: "Admins", value: stats.admins, color: "from-[#0086D1] to-sky-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
              <span className={`text-3xl font-extrabold bg-gradient-to-br ${s.color} bg-clip-text text-transparent`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm mb-5 flex items-center px-4 py-1">
          <Search className="text-slate-400 shrink-0" size={17} />
          <input
            type="text" placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium py-2.5 pl-3 text-slate-700 placeholder-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <Card className="border border-slate-200/60 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">User</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Last Active</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Users size={40} className="opacity-30" />
                        <span className="font-semibold text-sm">No users found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white font-black text-sm shadow-inner ${u.is_registered ? "bg-gradient-to-br from-[#0086D1] to-[#005fa3]" : "bg-gradient-to-br from-amber-400 to-amber-600"}`}>
                            {u.is_registered ? u.name.slice(0, 2).toUpperCase() : <Clock size={16} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2 leading-tight">
                              {u.name}
                              {u.email === currentUserInfo?.email && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-[#0086D1]/10 text-[#0086D1] font-black">You</span>
                              )}
                              {!u.is_registered && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-amber-100 text-amber-700 font-black border border-amber-200">Pending</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE_COLORS[u.role] || ROLE_BADGE_COLORS["user"]}`}>
                          <Shield size={11} />
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="px-6 py-4">
                        {u.is_registered ? (
                          <button
                            onClick={() => toggleActive(u)}
                            className="flex items-center gap-2 group/status"
                            title={u.is_active ? "Click to deactivate" : "Click to activate"}
                          >
                            <div className={`w-2 h-2 rounded-full transition-colors ${u.is_active ? "bg-green-500" : "bg-slate-300"}`} />
                            <span className={`text-xs font-bold transition-colors ${u.is_active ? "text-slate-700" : "text-slate-400"} group-hover/status:text-[#0086D1]`}>
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </button>
                        ) : (
                          <span className="flex items-center gap-2 text-xs font-bold text-amber-600">
                            <Clock size={12} /> Awaiting Setup
                          </span>
                        )}
                      </td>

                      {/* Last active */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {u.last_login
                          ? new Date(u.last_login).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : <span className="text-slate-300">Never</span>
                        }
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Resend invite — only for pending (not yet registered) users */}
                          {!u.is_registered && (
                            <button
                              onClick={() => resendInvite(u)}
                              disabled={resendingId === u.id}
                              title="Resend invitation"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-60"
                            >
                              {resendingId === u.id
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <Send size={13} />
                              }
                              Resend
                            </button>
                          )}
                          {/* Send reset link — only for fully registered users */}
                          {u.is_registered && (
                            <button
                              onClick={() => sendReset(u)}
                              disabled={sendingResetId === u.id || u.email === currentUserInfo?.email}
                              title="Send password reset link"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {sendingResetId === u.id
                                ? <RefreshCw size={13} className="animate-spin" />
                                : <KeyRound size={13} />
                              }
                              Reset
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-[#0086D1]/10 hover:text-[#0086D1] transition-colors"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={u.email === currentUserInfo?.email || deleting === u.id}
                            title="Delete"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {deleting === u.id
                              ? <RefreshCw size={13} className="animate-spin" />
                              : <Trash2 size={13} />
                            }
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && filteredUsers.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-400">
                Showing {filteredUsers.length} of {users.length} users
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* ── Invite / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                {editingUser
                  ? <><Edit2 size={16} className="text-[#0086D1]" /> Edit Account</>
                  : <><Mail size={16} className="text-[#0086D1]" /> Invite New User</>
                }
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Invitation info banner (create mode only) */}
            {!editingUser && (
              <div className="mx-6 mt-5 px-4 py-3 rounded-xl bg-[#0086D1]/8 border border-[#0086D1]/20 flex items-start gap-3">
                <Mail size={15} className="text-[#0086D1] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  A secure <strong>registration link</strong> will be emailed to the user.
                  They will set their own password when they click it.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4 pt-4">

              {/* Name */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" required autoFocus
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0086D1]/20 focus:border-[#0086D1] outline-none transition-all"
                    placeholder="Jane Doe" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingUser}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0086D1]/20 focus:border-[#0086D1] outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    placeholder="jane@AmanBerki.com" />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Role</label>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0086D1]/20 focus:border-[#0086D1] outline-none appearance-none transition-all">
                    <option value="user">User — View Only</option>
                    <option value="admin">Admin — Full (except technical)</option>
                    {currentUserRole === "super_admin" && (
                      <option value="super_admin">Super Admin — Full Access</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Active toggle (edit only) */}
              {editingUser && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Account Active</span>
                  <button type="button" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.is_active ? "bg-green-500" : "bg-slate-300"}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${formData.is_active ? "translate-x-[18px]" : "translate-x-1"}`} />
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-[#0086D1] hover:bg-[#0070b0] disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-[#0086D1]/20 text-sm flex items-center justify-center gap-2">
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  {editingUser ? "Save Changes" : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete ${pendingDelete?.name ?? "this user"}? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
