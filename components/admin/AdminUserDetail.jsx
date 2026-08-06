"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  Ban,
  CheckCircle2,
  FileText,
  Crown,
  Calendar,
  Phone,
  Trash2,
  MoreVertical,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import AvatarImage from "@/components/ui/AvatarImage";
import ChangePlanModal from "@/components/admin/ChangePlanModal";
import DeleteUserModal from "@/components/admin/DeleteUserModal";

function Avatar({ name, photo }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-lg font-bold text-primary ring-2 ring-primary/30 ring-offset-2">
      {initial}
      <AvatarImage src={photo} alt={name} className="absolute inset-0 h-full w-full object-cover" />
    </span>
  );
}

// Same kebab-menu pattern as AdminUsersTable's RowMenu — kept local here
// too since the two components' props/actions differ enough that sharing
// one generic component wouldn't actually save code.
function ActionsMenu({ user, isSelf, acting, onToggleRole, onToggleBlock, onChangePlan, onDelete }) {
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
    fn();
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="User actions"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-bg hover:text-text"
      >
        <MoreVertical size={17} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-card-lg">
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

export default function AdminUserDetail({ userId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setUser(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (action) => {
    setActing(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setUser((prev) => ({ ...prev, ...data }));
    } catch (err) {
      alert(err.message);
    } finally {
      setActing(false);
    }
  };

  if (loading) return <p className="text-sm text-text-secondary">Loading…</p>;
  if (error || !user) return <p className="text-sm text-red-600">{error || "User not found"}</p>;

  const isSelf = user._id === session?.user?.id;

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary">
        <ArrowLeft size={15} />
        Back to users
      </Link>

      <div className="card flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} photo={user.photo} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-lg font-bold text-text">
              {user.name}
              {isSelf && <span className="text-xs font-normal text-text-secondary">(you)</span>}
            </p>
            <p className="text-sm text-text-secondary">{user.email}</p>
            {user.phone && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                <Phone size={11} />
                {user.phone}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === "admin" ? "bg-primary-light text-primary" : "bg-bg text-text-secondary"}`}>
            {user.role}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.isBlocked ? "bg-red-50 text-red-600" : "bg-green-50 text-success"}`}>
            {user.isBlocked ? "Blocked" : "Active"}
          </span>
          <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold capitalize text-text-secondary">{user.provider}</span>
          <ActionsMenu
            user={user}
            isSelf={isSelf}
            acting={acting}
            onToggleRole={() => patch(user.role === "admin" ? "demote" : "promote")}
            onToggleBlock={() => patch(user.isBlocked ? "unblock" : "block")}
            onChangePlan={() => setShowPlanModal(true)}
            onDelete={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} value={user.resumeCount} label="Resumes" tint={{ bg: "var(--primary-light)", fg: "var(--primary)" }} />
        <StatCard icon={Crown} value={user.subscription?.planId?.name || "Free"} label="Current plan" tint={{ bg: "#fef3c7", fg: "#b45309" }} />
        <StatCard icon={Calendar} value={new Date(user.createdAt).toLocaleDateString("en-IN")} label="Joined" tint={{ bg: "#e0f2fe", fg: "#0284c7" }} />
      </div>

      {showPlanModal && (
        <ChangePlanModal
          userId={user._id}
          subscriptionId={user.subscription?._id}
          currentPlanId={user.subscription?.planId?._id}
          onClose={() => setShowPlanModal(false)}
          onDone={() => {
            setShowPlanModal(false);
            load();
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteUserModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onDone={() => router.push("/admin/users")}
        />
      )}
    </div>
  );
}
