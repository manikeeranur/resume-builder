/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/resumes/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/resumes/[id]/png": ["./node_modules/@sparticuz/chromium/bin/**/*"],
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
