import PlanCard from "./PlanCard";

export default function PricingPlans({ plans, currentPlanCode, user }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          isCurrent={plan.code === currentPlanCode}
          user={user}
          highlighted={plan.billingType === "YEARLY"}
        />
      ))}
    </div>
  );
}
