import PolicyPage from "@/components/legal/PolicyPage";

export const metadata = {
  title: "Cancellation & Refund Policy — ResumePro",
  description: "ResumePro's cancellation and refund policy for paid plans.",
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Cancellation & Refund Policy" updated="August 5, 2026">
      <p>
        ResumePro sells access to paid plan features (Monthly or Yearly) as a one-time charge for a fixed
        period. There is no auto-renewing subscription — you are only charged when you actively purchase or
        renew a plan.
      </p>

      <h2>Cancellation</h2>
      <p>
        Because plans are one-time purchases and not recurring subscriptions, there is nothing to
        &quot;cancel&quot; — a plan simply expires at the end of its period and is not renewed unless you
        purchase again. You can stop using the Service at any time and delete your account by contacting
        support.
      </p>

      <h2>Refunds</h2>
      <p>
        As paid features (premium templates, unlimited downloads, watermark removal, custom colors/fonts) are
        activated on your account immediately after a successful payment, purchases are generally
        non-refundable once activated.
      </p>
      <p>We will issue a full refund in the following cases:</p>
      <ul>
        <li>You were charged more than once for the same order (duplicate charge).</li>
        <li>Payment was deducted from your bank/UPI account but the order failed and your plan was never activated.</li>
        <li>A verified technical error on our end prevented you from using the paid features you purchased.</li>
      </ul>
      <p>
        To request a refund under one of the cases above, email{" "}
        <a href="mailto:manikandan.arumugam0001@gmail.com">manikandan.arumugam0001@gmail.com</a> within 7 days
        of the charge, including your account email and the Razorpay payment ID from your invoice. Approved
        refunds are processed back to the original payment method via Razorpay, typically within 5–7 business
        days.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about a charge? Reach us at{" "}
        <a href="mailto:manikandan.arumugam0001@gmail.com">manikandan.arumugam0001@gmail.com</a> or via our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    </PolicyPage>
  );
}
