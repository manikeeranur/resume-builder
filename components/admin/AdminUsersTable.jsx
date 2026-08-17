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
  Mail,
  Bell,
  Send,
  CreditCard,
  RotateCcw,
  Circle,
  MessageCircle,
} from "lucide-react";
import { IconRosetteDiscountCheckFilled } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import StatCard from "@/components/dashboard/StatCard";
import CrownBadge from "@/components/layout/CrownBadge";
import AvatarImage from "@/components/ui/AvatarImage";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CustomTable from "@/components/common/CustomTable";
import CustomThreeDotMenu from "@/components/common/CustomThreeDotMenu";
import ChangePlanModal from "@/components/admin/ChangePlanModal";
import DeleteUserModal from "@/components/admin/DeleteUserModal";
import SendEmailModal from "@/components/admin/SendEmailModal";
import SendNotificationModal from "@/components/admin/SendNotificationModal";
import BroadcastNotificationModal from "@/components/admin/BroadcastNotificationModal";
import UserChatModal from "@/components/admin/UserChatModal";
import { useToast } from "@/components/providers/ToastProvider";

const EMPTY_FILTERS = { q: "", role: "", provider: "", planId: "", joinedFrom: "", joinedTo: "", online: false };

// "30 APR 2026 10:05 PM" — day, abbreviated-uppercase month, year, then
// 12-hour time, all in one glance instead of just a bare date.
function formatJoined(date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${day} ${month} ${year} ${time}`;
}

// Same treatment as the navbar's own avatar (components/layout/AvatarMenu.jsx)
// — ring outline, and a crown for anyone with an active paid plan — so a
// user looks the same here as they do to themselves.
function Avatar({ name, photo, isPremium, online }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span className="relative flex h-9 w-9 shrink-0">
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary-light text-sm font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
        {initial}
        <AvatarImage src={photo} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      </span>
      {isPremium && <CrownBadge />}
      {online && (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500"
          title="Online"
          aria-label="Online"
        />
      )}
    </span>
  );
}

export default function AdminUsersTable() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);
  const [planModalUser, setPlanModalUser] = useState(null);
  const [emailModalUser, setEmailModalUser] = useState(null);
  const [notifyModalUser, setNotifyModalUser] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [chatModalUser, setChatModalUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [bulkReminderConfirm, setBulkReminderConfirm] = useState(null);
  const [bulkReminderLoading, setBulkReminderLoading] = useState(false);
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
        setOnlineCount(data.onlineCount || 0);
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
      toast(err.message, { type: "error" });
    } finally {
      setActingOn(null);
    }
  };

  // Fixed-template, one-click sends — no compose modal, unlike SendEmailModal/
  // SendNotificationModal, since the content is the same reminder copy the
  // cron itself sends (see app/api/cron/subscription-reminders).
  const sendReminder = async (user, type) => {
    setActingOn(user._id);
    try {
      const res = await fetch(`/api/admin/users/${user._id}/${type}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reminder");
      toast("Reminder sent.", { type: "success" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setActingOn(null);
    }
  };

  const confirmBulkReminder = async () => {
    if (!bulkReminderConfirm) return;
    setBulkReminderLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/${bulkReminderConfirm.type}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      toast(`Sent to ${data.recipientCount} user(s).`, { type: "success" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBulkReminderLoading(false);
      setBulkReminderConfirm(null);
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
            <Avatar name={u.name} photo={u.photo} isPremium={Boolean(u.plan)} online={u.online} />
            <div className="min-w-0">
              <Link
                href={`/admin/users/${u._id}`}
                className="inline-flex items-center gap-1 truncate font-medium text-text hover:text-primary hover:underline"
              >
                {u.name}
                {u.emailVerified && (
                  <IconRosetteDiscountCheckFilled size={15} className="shrink-0 text-primary" aria-label="Verified" />
                )}
                {isSelf && <span className="text-xs font-normal text-text-secondary">(you)</span>}
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
    { key: "downloadCount", title: "Downloads", sortable: true },
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
      render: (u) => <span className="whitespace-nowrap text-text-secondary">{formatJoined(u.createdAt)}</span>,
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
              { label: "Send email", icon: <Mail size={14} />, onClick: () => setEmailModalUser(u) },
              { label: "Send notification", icon: <Bell size={14} />, onClick: () => setNotifyModalUser(u) },
              { label: "Chat", icon: <MessageCircle size={14} />, onClick: () => setChatModalUser(u) },
              {
                label: "Send payment reminder",
                icon: <CreditCard size={14} />,
                disabled: acting,
                onClick: () => sendReminder(u, "payment-reminder"),
              },
              {
                label: "Send resubscribe reminder",
                icon: <RotateCcw size={14} />,
                disabled: acting,
                onClick: () => sendReminder(u, "resubscribe-reminder"),
              },
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
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setBulkReminderConfirm({ type: "payment-reminders", label: "a payment reminder" })}
          className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <CreditCard size={14} />
          Payment reminder to all
        </button>
        <button
          type="button"
          onClick={() => setBulkReminderConfirm({ type: "resubscribe-reminders", label: "a resubscribe reminder" })}
          className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <RotateCcw size={14} />
          Resubscribe reminder to all
        </button>
        <button
          type="button"
          onClick={() => setBroadcastOpen(true)}
          className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Send size={14} />
          Notify all users
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        <StatCard icon={Circle} value={onlineCount} label="Online Now" tint={{ bg: "#dcfce7", fg: "#16a34a" }} />
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
        <label className="input-field flex cursor-pointer items-center gap-2 text-sm font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={filters.online}
            onChange={(e) => setFilters({ ...filters, online: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Online now
          </span>
        </label>
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

      {emailModalUser && (
        <SendEmailModal user={emailModalUser} onClose={() => setEmailModalUser(null)} onDone={() => setEmailModalUser(null)} />
      )}

      {notifyModalUser && (
        <SendNotificationModal
          user={notifyModalUser}
          onClose={() => setNotifyModalUser(null)}
          onDone={() => setNotifyModalUser(null)}
        />
      )}

      {broadcastOpen && (
        <BroadcastNotificationModal onClose={() => setBroadcastOpen(false)} onDone={() => setBroadcastOpen(false)} />
      )}

      {chatModalUser && <UserChatModal user={chatModalUser} onClose={() => setChatModalUser(null)} />}

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

      <ConfirmDialog
        open={Boolean(bulkReminderConfirm)}
        title="Send reminder to all?"
        message={`Send ${bulkReminderConfirm?.label} to every eligible user right now?`}
        confirmLabel="Send"
        loading={bulkReminderLoading}
        onConfirm={confirmBulkReminder}
        onCancel={() => setBulkReminderConfirm(null)}
      />
    </div>
  );
}
