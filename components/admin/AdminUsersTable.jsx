"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldOff,
  Users as UsersIcon,
  ShieldHalf,
  Phone,
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
import CustomTable from "@/components/common/CustomTable";
import CustomThreeDotMenu from "@/components/common/CustomThreeDotMenu";
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

export default function AdminUsersTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);
  const [planModalUser, setPlanModalUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(page));
    params.set("limit", String(perPage));
    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setGrandTotal(data.grandTotal ?? data.total ?? 0);
        setAdminCount(data.adminCount || 0);
      })
      .finally(() => setLoading(false));
  }, [filters, page, perPage]);

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

  const columns = [
    {
      key: "user",
      title: "User",
      render: (u) => {
        const isSelf = u._id === session?.user?.id;
        return (
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
        );
      },
    },
    { key: "provider", title: "Provider", render: (u) => <span className="capitalize text-text-secondary">{u.provider}</span> },
    { key: "plan", title: "Plan", render: (u) => u.plan?.name || "Free" },
    { key: "resumeCount", title: "Resumes", sortable: true },
    {
      key: "role",
      title: "Role",
      render: (u) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-primary-light text-primary" : "bg-bg text-text-secondary"}`}>
          {u.role}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "Joined",
      sortable: true,
      sortValue: (u) => new Date(u.createdAt),
      render: (u) => <span className="text-text-secondary">{new Date(u.createdAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      key: "actions",
      title: "Actions",
      render: (u) => {
        const isSelf = u._id === session?.user?.id;
        const acting = actingOn === u._id;
        return (
          <CustomThreeDotMenu
            actions={[
              { label: "Manage", icon: <UserCog size={14} />, onClick: () => router.push(`/admin/users/${u._id}`) },
              {
                label: u.role === "admin" ? "Remove admin" : "Make admin",
                icon: u.role === "admin" ? <ShieldOff size={14} /> : <ShieldCheck size={14} />,
                disabled: acting || (isSelf && u.role === "admin"),
                onClick: () => patchUser(u, u.role === "admin" ? "demote" : "promote"),
              },
              {
                label: u.isBlocked ? "Unblock access" : "Block access",
                icon: u.isBlocked ? <CheckCircle2 size={14} /> : <Ban size={14} />,
                disabled: acting || isSelf,
                onClick: () => patchUser(u, u.isBlocked ? "unblock" : "block"),
              },
              { label: "Change plan", icon: <Crown size={14} />, onClick: () => setPlanModalUser(u) },
              {
                label: "Delete user",
                icon: <Trash2 size={14} />,
                destructive: true,
                disabled: isSelf,
                separatorBefore: true,
                onClick: () => setDeleteModalUser(u),
              },
            ]}
          />
        );
      },
    },
  ];

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

      <CustomTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users match these filters."
        rowKey="_id"
        perPageOptions={[10, 25, 50, 100]}
        paginationState={{ page, perPage, totalPages }}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

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
