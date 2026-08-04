import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInvoiceData } from "@/lib/invoice";
import { launchBrowser } from "@/lib/launchBrowser";
import { renderInvoicePdf } from "@/lib/renderInvoicePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Usable by the paying user for their own payment, or by an admin for any
// payment — ownership/role is checked inside getInvoiceData.
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getInvoiceData(params.paymentId, {
    userId: session.user.id,
    isAdmin: session.user.role === "admin",
  });
  if (!data) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  let browser = null;
  try {
    browser = await launchBrowser();
    const origin = new URL(req.url).origin || process.env.NEXTAUTH_URL;
    const pdfBuffer = await renderInvoicePdf(browser, { paymentId: params.paymentId, origin, req });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Invoice PDF generation error:", err.message);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
