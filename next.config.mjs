/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/resumes/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/resumes/[id]/png": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/**/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
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
