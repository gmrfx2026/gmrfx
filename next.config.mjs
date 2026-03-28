/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["xss", "daftar-wilayah-indonesia"],
  },
  async redirects() {
    return [
      { source: "/privacy", destination: "/kebijakan-privasi", permanent: true },
      { source: "/terms", destination: "/syarat-ketentuan", permanent: true },
      { source: "/admin/mail", destination: "/admin", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
