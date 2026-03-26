/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kurangi risiko ERR_REQUIRE_ESM (CommonJS vs ESM) untuk paket yang dipakai sanitasi HTML di server.
  experimental: {
    serverComponentsExternalPackages: [
      "isomorphic-dompurify",
      "jsdom",
      "html-encoding-sniffer",
    ],
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
