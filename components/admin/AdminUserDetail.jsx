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
  Download,
} from "lucide-react";
import AvatarImage from "@/components/ui/AvatarImage";
import CustomTable from "@/components/common/CustomTable";
import TableSkeleton from "@/components/common/TableSkeleton";
import ChangePlanModal from "@/components/admin/ChangePlanModal";
import DeleteUserModal from "@/components/admin/DeleteUserModal";
import ProfileShowcase from "@/components/profile/ProfileShowcase";

// Flat panel — white bg, no border/shadow, unlike the site-wide `.card`
// class (which the rest of the admin panel uses). This page intentionally
// sits on a #f8f9fc background with plain white sections on top, matching
// the look of the user-facing /profile page instead of the bordered-card
// style used on the users list.
function Panel({ className = "", children }) {
  return <div className={`rounded-2xl bg-white p-5 ${className}`}>{children}</div>;
}

function Stat({ icon: Icon, value, label, tint }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: tint.bg, color: tint.fg }}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight text-text">{value}</p>
        <p className="truncate text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

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

// Resumes each reference a template by id only — this resolves it to the
// name an admin can actually recognize (built-in or admin-authored),
// already done server-side in the API response.
function ResumesTable({ resumes }) {
  const columns = [
    { key: "title", title: "Resume", render: (r) => <span className="font-medium text-text">{r.title}</span> },
    {
      key: "templateName",
      title: "Template",
      render: (r) => <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">{r.templateName}</span>,
    },
    { key: "downloadCount", title: "Downloads", sortable: true },
    {
      key: "createdAt",
      title: "Created",
      sortable: true,
      sortValue: (r) => new Date(r.createdAt),
      render: (r) => <span className="text-text-secondary">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      key: "updatedAt",
      title: "Last edited",
      sortable: true,
      sortValue: (r) => new Date(r.updatedAt),
      render: (r) => <span className="text-text-secondary">{new Date(r.updatedAt).toLocaleDateString("en-IN")}</span>,
    },
  ];
  // A sortable table shell with column headers implies there's something to
  // sort — for a user with zero resumes that just reads as broken. A single
  // flat line says the same thing without the empty chrome.
  if (!resumes.length) {
    return (
      <Panel>
        <p className="text-sm text-text-secondary">This user hasn&apos;t created any resumes yet.</p>
      </Panel>
    );
  }
  return (
    <CustomTable
      columns={columns}
      data={resumes}
      rowKey="_id"
      defaultPerPage={10}
      perPageOptions={[10, 25, 50]}
      skeletonHasActions={false}
    />
  );
}

function DownloadsTable({ downloads }) {
  const columns = [
    {
      key: "createdAt",
      title: "Downloaded",
      sortable: true,
      sortValue: (d) => new Date(d.createdAt),
      render: (d) => <span className="text-text-secondary">{new Date(d.createdAt).toLocaleString("en-IN")}</span>,
    },
    { key: "resumeTitle", title: "Resume", render: (d) => <span className="font-medium text-text">{d.resumeTitle}</span> },
    {
      key: "templateName",
      title: "Template",
      render: (d) =>
        d.templateName ? (
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold text-primary">{d.templateName}</span>
        ) : (
          <span className="text-text-secondary">—</span>
        ),
    },
  ];
  if (!downloads.length) {
    return (
      <Panel>
        <p className="text-sm text-text-secondary">No PDF downloads yet.</p>
      </Panel>
    );
  }
  return (
    <CustomTable
      columns={columns}
      data={downloads}
      rowKey="_id"
      defaultPerPage={10}
      perPageOptions={[10, 25, 50]}
      skeletonHasActions={false}
    />
  );
}

function SkeletonLine({ className }) {
  return <span className={`block animate-pulse rounded-full bg-gray-200 ${className}`} />;
}

function SkeletonTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <table className="w-full text-sm">
        <tbody>
          <TableSkeleton columns={columns} rows={rows} hasActionColumn={false} />
        </tbody>
      </table>
    </div>
  );
}

// Mirrors the loaded page's exact section layout (same panel sizes, same
// stat-row/table shapes) so there's no layout shift once the real data
// swaps in — rather than a generic spinner or "Loading…" line.
function UserDetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Panel className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-40" />
            <SkeletonLine className="h-3 w-56 bg-gray-100" />
            <SkeletonLine className="h-3 w-32 bg-gray-100" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-6 w-16 bg-gray-100" />
          <SkeletonLine className="h-6 w-16 bg-gray-100" />
          <span className="h-9 w-9 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-4">
            <span className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-gray-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-4 w-12" />
              <SkeletonLine className="h-3 w-16 bg-gray-100" />
            </div>
          </div>
        ))}
      </div>

      <Panel className="space-y-3">
        <SkeletonLine className="h-4 w-32" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonLine className="h-3 w-24 bg-gray-100" />
              <SkeletonLine className="h-3.5 w-32" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="space-y-3">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-3 w-full bg-gray-100" />
        <SkeletonLine className="h-3 w-5/6 bg-gray-100" />
        <SkeletonLine className="h-3 w-2/3 bg-gray-100" />
      </Panel>

      <div className="space-y-2">
        <SkeletonLine className="h-4 w-48" />
        <SkeletonTable columns={5} rows={4} />
      </div>

      <div className="space-y-2">
        <SkeletonLine className="h-4 w-40" />
        <SkeletonTable columns={3} rows={4} />
      </div>
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

  const isSelf = user && user._id === session?.user?.id;

  return (
    // Bleeds out to the edges of the admin layout's content column (which
    // wraps every /admin/* page in -m-4 sm:-mx-6 py-8 of its own padding —
    // see app/admin/(protected)/layout.jsx) so the #f8f9fc fill reaches the
    // same edges that padding would otherwise leave gray (--bg, #f6f5fb).
    <div className="-m-4 bg-[#f8f9fc] p-4 sm:-mx-6 sm:px-6">
      <div className="space-y-6">
        <Link href="/admin/users" className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-primary">
          <ArrowLeft size={15} />
          Back to users
        </Link>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : loading || !user ? (
          <UserDetailSkeleton />
        ) : (
          <>
            <Panel className="flex flex-wrap items-start justify-between gap-4">
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
            </Panel>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat icon={FileText} value={user.resumeCount} label="Resumes" tint={{ bg: "var(--primary-light)", fg: "var(--primary)" }} />
              <Stat icon={Download} value={user.downloads?.total ?? 0} label="PDF downloads" tint={{ bg: "#dcfce7", fg: "#16a34a" }} />
              <Stat icon={Crown} value={user.subscription?.planId?.name || "Free"} label="Current plan" tint={{ bg: "#fef3c7", fg: "#b45309" }} />
              <Stat icon={Calendar} value={new Date(user.createdAt).toLocaleDateString("en-IN")} label="Joined" tint={{ bg: "#e0f2fe", fg: "#0284c7" }} />
            </div>

            <Panel className="space-y-3">
              <h2 className="text-sm font-bold text-text">Account details</h2>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-text-secondary">Sign-in method</dt>
                  <dd className="font-medium capitalize text-text">{user.provider}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Status</dt>
                  <dd className="font-medium text-text">{user.isBlocked ? "Blocked" : "Active"}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Plan</dt>
                  <dd className="font-medium text-text">
                    {user.subscription?.planId?.name || "Free"}
                    {user.subscription?.planId?.billingType && user.subscription.planId.billingType !== "FREE"
                      ? ` (${user.subscription.planId.billingType.toLowerCase()})`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Resumes created</dt>
                  <dd className="font-medium text-text">{user.resumeCount}</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">PDF downloads</dt>
                  <dd className="font-medium text-text">{user.downloads?.total ?? 0}</dd>
                </div>
              </dl>
            </Panel>

            <div>
              <h2 className="mb-2 text-sm font-bold text-text">Profile</h2>
              {user.profile ? (
                <>
                  {user.profile.source === "resume" && (
                    <p className="mb-2 text-xs text-text-secondary">
                      This user never saved a profile — showing details from their most recently edited resume instead.
                    </p>
                  )}
                  <ProfileShowcase sections={user.profile.sections} isPremium={Boolean(user.subscription)} embedded />
                </>
              ) : (
                <Panel>
                  <p className="text-sm text-text-secondary">This user hasn&apos;t filled in any details yet.</p>
                </Panel>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-bold text-text">Resumes &amp; templates used</h2>
              <ResumesTable resumes={user.resumes || []} />
            </div>

            <div>
              <h2 className="mb-2 text-sm font-bold text-text">Download history</h2>
              <DownloadsTable downloads={user.downloads?.recent || []} />
            </div>
          </>
        )}
      </div>

      {user && showPlanModal && (
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

      {user && showDeleteModal && (
        <DeleteUserModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
          onDone={() => router.push("/admin/users")}
        />
      )}
    </div>
  );
}
