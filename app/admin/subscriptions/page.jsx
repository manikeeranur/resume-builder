import AdminSubscriptionsTable from "@/components/admin/AdminSubscriptionsTable";
import PlanManagerForm from "@/components/admin/PlanManagerForm";

export default function AdminSubscriptionsPage({ searchParams }) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-1 text-xl font-bold text-text">Subscriptions</h1>
        <p className="mb-6 text-sm text-text-secondary">Every user's subscription and its billing state.</p>
        <AdminSubscriptionsTable initialUser={searchParams?.user || ""} />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-bold text-text">Plan management</h2>
        <p className="mb-6 text-sm text-text-secondary">
          Changes apply to future purchases only — past payments keep the amount they were actually charged.
        </p>
        <PlanManagerForm />
      </div>
    </div>
  );
}
