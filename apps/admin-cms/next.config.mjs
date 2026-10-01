/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@aegis/database", "@aegis/ui", "@aegis/auth", "@aegis/types"],
  serverExternalPackages: ["drizzle-orm", "postgres"],
};

export default nextConfig;
