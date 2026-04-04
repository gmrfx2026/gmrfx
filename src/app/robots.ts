import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/profil/",
          "/api/",
          "/go/",
          "/lengkapi-profil",
          "/penawaran/buat",
        ],
      },
    ],
    sitemap: "https://gmrfx.app/sitemap.xml",
  };
}
