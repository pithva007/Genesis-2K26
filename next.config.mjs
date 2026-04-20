/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
