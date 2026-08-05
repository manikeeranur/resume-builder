import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Check, X } from "lucide-react";
import { authOptions } from "@/lib/auth";

const FREE_FEATURES = [
  { label: "1 saved resume", included: true },
  { label: "3 PDF downloads", included: true },
  { label: "Standard templates", included: true },
  { label: "Watermark on PDFs", included: true },
  { label: "Premium templates", included: false },
  { label: "Custom colors & fonts", included: false },
];

const PAID_FEATURES = [
  { label: "Unlimited saved resumes", included: true },
  { label: "Unlimited PDF downloads", included: true },
  { label: "All premium templates", included: true },
  { label: "No watermark", included: true },
  { label: "Custom colors & fonts", included: true },
  { label: "Billed monthly or yearly", included: true },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-text sm:text-5xl">
          Build a resume that gets you hired
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary sm:text-lg">
          ResumePro is an online resume builder: pick a template, fill in your details, and download a
          polished, ATS-friendly PDF in minutes. No design skills needed.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary rounded-xl px-6 py-3 text-sm">
            Get started for free
          </Link>
          <Link
            href="/templates"
            className="rounded-xl border border-border bg-white px-6 py-3 text-sm font-semibold text-text hover:bg-bg"
          >
            Browse templates
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-text">Free plan</h2>
            <p className="mt-1 text-sm text-text-secondary">Get started with the basics.</p>
            <ul className="mt-4 space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm text-text">
                  {f.included ? (
                    <Check size={16} className="shrink-0 text-success" />
                  ) : (
                    <X size={16} className="shrink-0 text-text-secondary" />
                  )}
                  {f.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="card border-primary p-6">
            <h2 className="text-lg font-bold text-text">Premium plans</h2>
            <p className="mt-1 text-sm text-text-secondary">From ₹199/month or ₹1,499/year.</p>
            <ul className="mt-4 space-y-2">
              {PAID_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm text-text">
                  <Check size={16} className="shrink-0 text-success" />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/pricing" className="text-sm font-semibold text-primary hover:underline">
            See full pricing details &rarr;
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-12 text-center sm:px-6">
          <h2 className="text-xl font-bold text-text">Need help?</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Reach our support team at{" "}
            <a href="mailto:manikandan.arumugam0001@gmail.com" className="font-semibold text-primary hover:underline">
              manikandan.arumugam0001@gmail.com
            </a>{" "}
            or visit the{" "}
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
