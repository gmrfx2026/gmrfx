/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["dompurify", "jsdom"],
  },
  async redirects() {
    return [
      { source: "/privacy", destination: "/kebijakan-privasi", permanent: true },
      { source: "/terms", destination: "/syarat-ketentuan", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
