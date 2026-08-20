import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText } from "lucide-react";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/lib/models/Payment";
import TopBar from "@/components/layout/TopBar";
import SubscriptionSummary from "@/components/subscription/SubscriptionSummary";
import PaymentHistoryTable from "@/components/subscription/PaymentHistoryTable";
import { getUserPlan } from "@/lib/subscription/get-user-plan";

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  await dbConnect();
  const [{ plan, subscription }, payments] = await Promise.all([
    getUserPlan(session.user.id),
    Payment.find({ userId: session.user.id }).sort({ createdAt: -1 }).populate("planId", "name"),
  ]);

  return (
    <>
      <TopBar backHref="/dashboard" title="Subscription" subtitle="Your plan, billing history and invoices" size="lg" />
      <div className="mx-auto max-w-[1100px] space-y-8 px-4 py-8 sm:px-6">
        <SubscriptionSummary
          plan={JSON.parse(JSON.stringify(plan))}
          subscription={subscription ? JSON.parse(JSON.stringify(subscription)) : null}
        />

        <div>
          <h2 className="mb-4 flex items-center gap-2.5 text-base font-bold text-text">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
              <FileText size={16} />
            </span>
            Payment history
          </h2>
          <PaymentHistoryTable payments={JSON.parse(JSON.stringify(payments))} />
        </div>
      </div>
    </>
  );
}
