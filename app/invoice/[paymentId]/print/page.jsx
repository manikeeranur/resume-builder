import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInvoiceData } from "@/lib/invoice";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";

// Captured by Puppeteer (lib/renderInvoicePdf.js), same pattern as
// app/resumes/[id]/print — a plain, print-friendly HTML page rather than a
// separate PDF/invoice library. The payment-success email attaches the same
// invoice via lib/invoiceHtml.js, a separate plain-string template (not this
// component) — Next's app router won't bundle a component-derived module
// together with react-dom/server inside a Route Handler's module graph.
export default async function InvoicePrintPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const data = await getInvoiceData(params.paymentId, {
    userId: session.user.id,
    isAdmin: session.user.role === "admin",
  });
  if (!data) notFound();

  return <InvoiceDocument data={data} />;
}
