import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

// Public marketing + legal pages (home, pricing links, contact, terms,
// privacy, refund, shipping). No auth gate — these must be reachable by
// anonymous visitors and crawlers (e.g. Razorpay's website verification).
export default function MarketingLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
