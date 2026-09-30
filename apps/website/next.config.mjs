import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@aegis/auth", "@aegis/database", "@aegis/types", "@aegis/ui"],
};

export default withSentryConfig(nextConfig, {
  org: "arukamed",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
