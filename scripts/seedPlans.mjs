// Idempotent seed for the three required plans. Run with your Mongo env
// loaded, e.g.:
//   node --env-file=.env scripts/seedPlans.mjs
//
// Plain .mjs (not .js) and relative imports on purpose — this runs outside
// Next.js, so the "@/*" path alias and JSX/webpack pipeline aren't available.
import mongoose from "mongoose";
import Plan from "../lib/models/Plan.js";

const PLANS = [
  {
    code: "FREE",
    name: "Free",
    description: "Get started with the basics — limited resumes and downloads, watermarked PDFs.",
    price: 0,
    currency: "INR",
    billingType: "FREE",
    durationDays: 36500, // effectively indefinite; free users have no Subscription row anyway
    resumeLimit: 1,
    pdfDownloadLimit: 3,
    premiumTemplateAccess: false,
    watermarkEnabled: true,
    customColors: false,
    customFonts: false,
    active: true,
  },
  {
    code: "MONTHLY",
    name: "Monthly",
    description: "Full access, billed every month.",
    price: 199,
    currency: "INR",
    billingType: "MONTHLY",
    durationDays: 30,
    resumeLimit: null,
    pdfDownloadLimit: null,
    premiumTemplateAccess: true,
    watermarkEnabled: false,
    customColors: true,
    customFonts: true,
    active: true,
  },
  {
    code: "YEARLY",
    name: "Yearly",
    description: "Full access, billed once a year at a lower effective monthly price.",
    price: 1499,
    currency: "INR",
    billingType: "YEARLY",
    durationDays: 365,
    resumeLimit: null,
    pdfDownloadLimit: null,
    premiumTemplateAccess: true,
    watermarkEnabled: false,
    customColors: true,
    customFonts: true,
    active: true,
  },
];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set — run with: node --env-file=.env scripts/seedPlans.mjs");
  }
  await mongoose.connect(process.env.MONGO_URI);

  for (const plan of PLANS) {
    const res = await Plan.findOneAndUpdate({ code: plan.code }, plan, { upsert: true, returnDocument: "after" });
    console.log(`Upserted plan ${res.code} (${res._id})`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
