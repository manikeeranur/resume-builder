import PolicyPage from "@/components/legal/PolicyPage";

export const metadata = {
  title: "Shipping Policy — ResumePro",
  description: "ResumePro is a digital service — no physical products are shipped.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" updated="August 5, 2026">
      <p>
        ResumePro is a digital software service. No physical products are shipped. Paid features are
        activated digitally on your account immediately after successful payment — there is nothing to
        deliver by post or courier, and no shipping charges apply.
      </p>
      <p>
        If you have any trouble accessing a paid feature after payment, contact us at{" "}
        <a href="mailto:manikandan.arumugam0001@gmail.com">manikandan.arumugam0001@gmail.com</a> or via our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    </PolicyPage>
  );
}
