import AdminPaymentsTable from "@/components/admin/AdminPaymentsTable";

export default function AdminPaymentsPage() {
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-text">Payments</h1>
      <p className="mb-6 text-sm text-text-secondary">Every Razorpay order created through this app.</p>
      <AdminPaymentsTable />
    </div>
  );
}
