import AdminUsersTable from "@/components/admin/AdminUsersTable";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-text">Users</h1>
      <p className="mb-6 text-sm text-text-secondary">Everyone registered on the platform.</p>
      <AdminUsersTable />
    </div>
  );
}
