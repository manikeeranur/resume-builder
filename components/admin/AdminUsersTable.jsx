"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, ShieldOff, Users as UsersIcon, ShieldHalf, Phone } from "lucide-react";
import { useSession } from "next-auth/react";
import StatCard from "@/components/dashboard/StatCard";
import CrownBadge from "@/components/layout/CrownBadge";
import AvatarImage from "@/components/ui/AvatarImage";

const EMPTY_FILTERS = { q: "", role: "" };

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

export default function AdminUsersTable() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

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

  const toggleRole = async (user) => {
    setActingOn(user._id);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: user.role === "admin" ? "demote" : "promote" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: data.role } : u)));
      setAdminCount((prev) => prev + (data.role === "admin" ? 1 : -1));
    } catch (err) {
      alert(err.message);
    } finally {
      setActingOn(null);
    }
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

      <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <input
          className="input-field sm:col-span-2"
          placeholder="Search name or email"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select
          className="input-field"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
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
                        <p className="truncate font-medium text-text">
                          {u.name} {isSelf && <span className="text-xs font-normal text-text-secondary">(you)</span>}
                        </p>
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
                    <button
                      type="button"
                      disabled={actingOn === u._id || (isSelf && u.role === "admin")}
                      onClick={() => toggleRole(u)}
                      title={isSelf && u.role === "admin" ? "You can't remove your own admin access" : undefined}
                      className={`flex items-center gap-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                        u.role === "admin" ? "text-red-600 hover:underline" : "text-primary hover:underline"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <>
                          <ShieldOff size={13} /> Remove admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} /> Make admin
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-secondary">{total} matching filter(s)</p>
    </div>
  );
}
