import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Check, X, LayoutTemplate, PenLine, Download } from "lucide-react";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Plan from "@/lib/models/Plan";
import { TEMPLATE_LIST } from "@/lib/templates";
import PremiumBadge from "@/components/templates/PremiumBadge";
import Reveal from "@/components/marketing/Reveal";
import HeroVectors from "@/components/marketing/HeroVectors";
import HeroTemplateStack from "@/components/marketing/HeroTemplateStack";

function formatPlanPrice(plan) {
  return `${plan.currency === "INR" ? "₹" : plan.currency}${plan.price.toLocaleString("en-IN")}`;
}

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

// Genuinely true of the product today (docx export: app/api/resumes/[id]/docx),
// not marketing fluff — kept short so it reads as a fact list, not a pitch.
const TRUST_POINTS = ["Free to start", "PDF & Word export", "ATS-friendly templates"];

const STEPS = [
  {
    icon: LayoutTemplate,
    title: "Pick a template",
    description: "Choose from professionally designed templates built for every kind of role.",
  },
  {
    icon: PenLine,
    title: "Fill in your details",
    description: "Add your experience, skills and education — or start from your saved profile.",
  },
  {
    icon: Download,
    title: "Download & apply",
    description: "Export a polished, ATS-friendly PDF or Word doc, ready to send.",
  },
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  // Read fresh from the DB, same as /pricing — hardcoding these strings is
  // exactly what let this teaser drift out of sync with the real prices an
  // admin sets in the Plan Manager.
  await dbConnect();
  const [monthlyPlan, yearlyPlan] = await Promise.all([
    Plan.findOne({ billingType: "MONTHLY", active: true }).sort({ price: 1 }),
    Plan.findOne({ billingType: "YEARLY", active: true }).sort({ price: 1 }),
  ]);
  const priceTeaser = [
    monthlyPlan && `${formatPlanPrice(monthlyPlan)}/month`,
    yearlyPlan && `${formatPlanPrice(yearlyPlan)}/year`,
  ]
    .filter(Boolean)
    .join(" or ");

  return (
    <>
      {/* Hero — decorative vectors behind a two-column layout (copy left,
          an animated real-template preview stack right) instead of the old
          plain centered-text block, so the very first thing a visitor sees
          is the actual product, not just a promise about it. */}
      <section className="relative overflow-hidden">
        <HeroVectors />

        <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-8">
          <Reveal className="text-center lg:text-left">
            <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight text-text sm:text-5xl lg:mx-0">
              Build a resume that gets you hired
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary sm:text-lg lg:mx-0">
              ResumePro is an online resume builder: pick a template, fill in your details, and download a
              polished, ATS-friendly PDF in minutes. No design skills needed.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-text-secondary sm:text-sm lg:justify-start">
              {TRUST_POINTS.map((point) => (
                <span key={point} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="shrink-0 text-success" />
                  {point}
                </span>
              ))}
            </div>
          </Reveal>

          <HeroTemplateStack />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">Three steps to a finished resume</h2>
          </Reveal>

          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.12} className="text-center">
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <step.icon size={24} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-4 text-base font-bold text-text">{step.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-text-secondary">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Template showcase */}
      <section className="border-t border-border bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-text sm:text-3xl">Templates that make a great first impression</h2>
            <p className="mt-3 text-sm text-text-secondary sm:text-base">
              A few of our professionally designed templates, ready to fill in. Pick one and start building — no
              design skills needed.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {TEMPLATE_LIST.slice(0, 4).map((t, i) => (
              <Reveal key={t.id} delay={(i % 3) * 0.08}>
                <Link
                  href="/templates"
                  className="group block overflow-hidden rounded-2xl border border-border bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-lg"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.thumbnail}
                      alt={t.name}
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    {t.premium && <PremiumBadge className="absolute right-2 top-2" />}
                  </div>
                  <p className="px-3 py-2.5 text-center text-xs font-semibold text-text sm:text-sm">{t.name}</p>
                </Link>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/templates" className="btn-primary inline-block rounded-xl px-6 py-3 text-sm">
              Browse all templates
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">Simple, honest pricing</h2>
          <p className="mt-3 text-sm text-text-secondary sm:text-base">Start free. Upgrade only when you need to.</p>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Reveal className="card p-6">
            <h3 className="text-lg font-bold text-text">Free plan</h3>
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
          </Reveal>

          <Reveal delay={0.12} className="relative overflow-hidden rounded-2xl border-2 border-primary bg-white p-6 shadow-card-lg">
            <span className="absolute right-5 top-5 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
              Best value
            </span>
            <h3 className="text-lg font-bold text-text">Premium plans</h3>
            <p className="mt-1 text-sm text-text-secondary">{priceTeaser ? `From ${priceTeaser}.` : "Billed monthly or yearly."}</p>
            <ul className="mt-4 space-y-2">
              {PAID_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-sm text-text">
                  <Check size={16} className="shrink-0 text-success" />
                  {f.label}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-6 text-center">
          <Link href="/pricing" className="text-sm font-semibold text-primary hover:underline">
            See full pricing details &rarr;
          </Link>
        </div>
      </section>

      {/* Closing CTA banner */}
      <section className="bg-gradient-to-br from-primary to-[#8a7cf0]">
        <Reveal className="mx-auto max-w-[900px] px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to build your resume?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
            Create your free account and have a polished, ready-to-send resume in minutes.
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary transition-transform hover:-translate-y-0.5 hover:shadow-card-lg"
          >
            Get started for free
          </Link>
        </Reveal>
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
