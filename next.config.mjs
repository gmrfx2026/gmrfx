/** @type {import('next').NextConfig} */
// Klien `next-auth/react` membaca `NEXTAUTH_URL` saat build (bukan `AUTH_URL`).
// Tanpa ini, login dari browser bisa salah host/path → cookie tidak terbaca → terlihat "logout".
// Preview Vercel: kadang hanya VERCEL_URL yang terisi saat build.
const nextAuthPublicUrl =
  process.env.NEXTAUTH_URL ||
  process.env.AUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

const nextConfig = {
  env: {
    ...(nextAuthPublicUrl ? { NEXTAUTH_URL: nextAuthPublicUrl } : {}),
  },
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
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
