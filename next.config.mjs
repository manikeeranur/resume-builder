/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/resumes/[id]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/resumes/[id]/png": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/**/*": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
  },
};

export default nextConfig;
