/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
