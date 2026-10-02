/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@aegis/database", "@aegis/ui", "@aegis/auth", "@aegis/types"],
  serverExternalPackages: ["drizzle-orm", "postgres"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  devIndicators: false,
};

export default nextConfig;
