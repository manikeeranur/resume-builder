// Regenerates the file Tailwind's content scanner uses to see class names
// used inside admin-authored (DB-stored) template code — see
// lib/templateClassScan.js for why this file needs to exist at all. Runs
// automatically before `npm run dev` and `npm run build` (see package.json's
// predev/prebuild); production CSS is generated once at `next build` and
// never rescanned afterward, so without this, a template saved after the
// last deploy would render unstyled for real users until the next deploy.
//   node --env-file=.env scripts/generateTemplateClassScan.mjs
import mongoose from "mongoose";
import Template from "../lib/models/Template.js";
import { writeTemplateClassScan } from "../lib/templateClassScan.js";

async function main() {
  if (!process.env.MONGO_URI) {
    // No DB configured (e.g. a fresh clone before .env is set up) —
    // regenerate an empty scan file rather than fail predev/prebuild.
    await writeTemplateClassScan([]);
    console.log("MONGO_URI not set — wrote an empty template class scan.");
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  const templates = await Template.find().select("code draftCode");
  const codeStrings = templates.flatMap((t) => [t.code, t.draftCode]);
  await writeTemplateClassScan(codeStrings);
  console.log(`Wrote template class scan from ${templates.length} template(s).`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
