import AdminUserDetail from "@/components/admin/AdminUserDetail";

export default function AdminUserDetailPage({ params }) {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-text">User details</h1>
      <p className="mb-6 text-sm text-text-secondary">View and manage this user's access, role, and plan.</p>
      <AdminUserDetail userId={params.id} />
    </div>
  );
}
