/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/resumes/*/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
      "/api/resumes/*/png": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    },
  },
};

export default nextConfig;
