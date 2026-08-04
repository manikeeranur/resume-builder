"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RippleButton from "@/components/ui/RippleButton";

// Razorpay's own free, hosted Checkout script — not an npm/paid plugin.
// Loaded on demand so it never blocks a page that doesn't need it.
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load the payment form — check your connection and try again"));
    document.body.appendChild(script);
  });
}

// Follows the flow in the spec exactly: client sends only { planId }, the
// server computes and returns the order; Checkout collects payment; the
// razorpay_* triple goes to /api/payments/verify, and only that server
// response (never the Checkout callback by itself) is treated as success.
export default function RazorpayCheckoutButton({ plan, user, className, children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan._id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not start checkout");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ResumePro",
        description: `${order.planName} plan`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#6d5ce8" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const result = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(result.error || "Payment verification failed");
            router.push(`/payment/success?paymentId=${result.paymentId}`);
          } catch (err) {
            router.push(`/payment/failed?reason=${encodeURIComponent(err.message)}`);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", (response) => {
        router.push(`/payment/failed?reason=${encodeURIComponent(response.error?.description || "Payment failed")}`);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <RippleButton type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Loading…" : children}
      </RippleButton>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
