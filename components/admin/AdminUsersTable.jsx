"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldOff,
  Users as UsersIcon,
  ShieldHalf,
  Phone,
  MoreVertical,
  UserCog,
  Ban,
  CheckCircle2,
  Crown,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import StatCard from "@/components/dashboard/StatCard";
import CrownBadge from "@/components/layout/CrownBadge";
import AvatarImage from "@/components/ui/AvatarImage";
import ChangePlanModal from "@/components/admin/ChangePlanModal";
import DeleteUserModal from "@/components/admin/DeleteUserModal";

const EMPTY_FILTERS = { q: "", role: "", provider: "", planId: "", joinedFrom: "", joinedTo: "" };

// Same treatment as the navbar's own avatar (components/layout/AvatarMenu.jsx)
// — ring outline, and a crown for anyone with an active paid plan — so a
// user looks the same here as they do to themselves.
function Avatar({ name, photo, isPremium }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span className="relative flex h-9 w-9 shrink-0">
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
        {initial}
        <AvatarImage src={photo} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      </span>
      {isPremium && <CrownBadge />}
    </span>
  );
}

// Groups every per-row admin action behind one kebab button instead of a
// row of always-visible buttons — the row now needs 5 actions (manage,
// promote/demote, block/unblock, change plan, delete), which stopped
// fitting inline once "delete" and "change plan" joined the original
// promote/demote button.
function RowMenu({ user, isSelf, acting, onToggleRole, onToggleBlock, onChangePlan, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const act = (fn) => {
    setOpen(false);
    fn(user);
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="User actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-card-lg">
          <Link
            href={`/admin/users/${user._id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg"
          >
            <UserCog size={14} /> Manage
          </Link>
          <button
            type="button"
            disabled={acting || (isSelf && user.role === "admin")}
            title={isSelf && user.role === "admin" ? "You can't remove your own admin access" : undefined}
            onClick={() => act(onToggleRole)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {user.role === "admin" ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
            {user.role === "admin" ? "Remove admin" : "Make admin"}
          </button>
          <button
            type="button"
            disabled={acting || isSelf}
            title={isSelf ? "You can't block your own access" : undefined}
            onClick={() => act(onToggleBlock)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            {user.isBlocked ? <CheckCircle2 size={14} /> : <Ban size={14} />}
            {user.isBlocked ? "Unblock access" : "Block access"}
          </button>
          <button
            type="button"
            onClick={() => act(onChangePlan)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text hover:bg-bg"
          >
            <Crown size={14} /> Change plan
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            disabled={isSelf}
            title={isSelf ? "You can't delete your own account" : undefined}
            onClick={() => act(onDelete)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} /> Delete user
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersTable() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);
  const [planModalUser, setPlanModalUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setGrandTotal(data.grandTotal ?? data.total ?? 0);
        setAdminCount(data.adminCount || 0);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const patchUser = async (user, action) => {
    setActingOn(user._id);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, ...data } : u)));
      if (action === "promote" || action === "demote") {
        setAdminCount((prev) => prev + (data.role === "admin" ? 1 : -1));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActingOn(null);
    }
  };

  const removeUserFromList = (user) => {
    setUsers((prev) => prev.filter((u) => u._id !== user._id));
    setTotal((prev) => prev - 1);
    setGrandTotal((prev) => prev - 1);
    if (user.role === "admin") setAdminCount((prev) => prev - 1);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={UsersIcon}
          value={grandTotal}
          label="Total Users"
          tint={{ bg: "var(--primary-light)", fg: "var(--primary)" }}
        />
        <StatCard icon={ShieldHalf} value={adminCount} label="Admins" tint={{ bg: "#e0f2fe", fg: "#0284c7" }} />
        <StatCard
          icon={UsersIcon}
          value={grandTotal - adminCount}
          label="Regular Users"
          tint={{ bg: "#dcfce7", fg: "#16a34a" }}
        />
      </div>

      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          className="input-field sm:col-span-2"
          placeholder="Search name or email"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select
          className="input-field"
          value={filters.provider}
          onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
        >
          <option value="">All providers</option>
          <option value="credentials">Email</option>
          <option value="google">Google</option>
        </select>
        <select
          className="input-field"
          value={filters.planId}
          onChange={(e) => setFilters({ ...filters, planId: e.target.value })}
        >
          <option value="">All plans</option>
          <option value="__free__">Free</option>
          {plans.filter((p) => p.billingType !== "FREE").map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="input-field"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <div className="flex items-center gap-1.5 sm:col-span-2 lg:col-span-2">
          <input
            type="date"
            className="input-field"
            title="Joined from"
            value={filters.joinedFrom}
            max={filters.joinedTo || undefined}
            onChange={(e) => setFilters({ ...filters, joinedFrom: e.target.value })}
          />
          <span className="text-xs text-text-secondary">to</span>
          <input
            type="date"
            className="input-field"
            title="Joined to"
            value={filters.joinedTo}
            min={filters.joinedFrom || undefined}
            onChange={(e) => setFilters({ ...filters, joinedTo: e.target.value })}
          />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="sticky top-0 border-b border-border bg-white text-xs uppercase tracking-wide text-text-secondary">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Provider</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Resumes</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  No users match these filters.
                </td>
              </tr>
            )}
            {users.map((u) => {
              const isSelf = u._id === session?.user?.id;
              return (
                <tr key={u._id} className="border-b border-border align-top transition-colors last:border-0 hover:bg-bg">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} photo={u.photo} isPremium={Boolean(u.plan)} />
                      <div className="min-w-0">
                        <Link href={`/admin/users/${u._id}`} className="truncate font-medium text-text hover:text-primary hover:underline">
                          {u.name} {isSelf && <span className="text-xs font-normal text-text-secondary">(you)</span>}
                        </Link>
                        {u.isBlocked && (
                          <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">Blocked</span>
                        )}
                        <p className="truncate text-xs text-text-secondary">{u.email}</p>
                        {u.phone && (
                          <p className="flex items-center gap-1 truncate text-xs text-text-secondary">
                            <Phone size={11} />
                            {u.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-text-secondary">{u.provider}</td>
                  <td className="px-4 py-3 text-text">{u.plan?.name || "Free"}</td>
                  <td className="px-4 py-3 text-text">{u.resumeCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === "admin" ? "bg-primary-light text-primary" : "bg-bg text-text-secondary"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <RowMenu
                      user={u}
                      isSelf={isSelf}
                      acting={actingOn === u._id}
                      onToggleRole={(user) => patchUser(user, user.role === "admin" ? "demote" : "promote")}
                      onToggleBlock={(user) => patchUser(user, user.isBlocked ? "unblock" : "block")}
                      onChangePlan={setPlanModalUser}
                      onDelete={setDeleteModalUser}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-secondary">{total} matching filter(s)</p>

      {planModalUser && (
        <ChangePlanModal
          userId={planModalUser._id}
          subscriptionId={planModalUser.subscriptionId}
          currentPlanId={planModalUser.plan?._id}
          onClose={() => setPlanModalUser(null)}
          onDone={() => {
            setPlanModalUser(null);
            load();
          }}
        />
      )}

      {deleteModalUser && (
        <DeleteUserModal
          user={deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          onDone={() => {
            removeUserFromList(deleteModalUser);
            setDeleteModalUser(null);
          }}
        />
      )}
    </div>
  );
}
