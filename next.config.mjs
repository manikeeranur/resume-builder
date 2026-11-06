/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // framer-motion isn't in Next 14.2's default list; its barrel pulled ~880
    // modules into every page using <Reorder>/<motion>.
    optimizePackageImports: ["framer-motion"],
    outputFileTracingIncludes: {
      // pdf/png also read app/globals.css and tailwind's preflight CSS at
      // runtime (lib/renderResumeHtml.js) — fs reads the tracer can't see.
      "/api/resumes/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*", "./app/globals.css", "./node_modules/tailwindcss/lib/css/**/*"],
      "/api/resumes/[id]/png": ["./node_modules/@sparticuz/chromium/bin/**/*", "./app/globals.css", "./node_modules/tailwindcss/lib/css/**/*"],
      "/api/**/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      // lib/generateTailwindPreviewCss.js runs the real tailwindcss JIT
      // engine at request time; its `preflight` core plugin loads this CSS
      // file via a runtime fs.readFileSync, not an import/require, so
      // Vercel's build-time file tracer (which only follows static
      // imports) never bundles it — producing an ENOENT that crashes this
      // page's whole Server Component render on Vercel, invisibly (Next
      // hides the message in production), which is why the admin's PDF
      // preview here waits forever for #resume-content and times out.
      "/admin/templates/preview/[templateId]": ["./node_modules/tailwindcss/lib/css/**/*"],
    },
  },
  async redirects() {
    return [
      // Cancellation and refund terms live on one page; keep both URLs from
      // Razorpay's website-verification checklist resolving successfully.
      { source: "/cancellation-policy", destination: "/refund-policy", permanent: true },
    ];
  },
};

export default nextConfig;
