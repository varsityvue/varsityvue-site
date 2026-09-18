import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/internal/",
          "/account",
          "/account-suspended",
          "/login",
          "/forgot-password",
          "/reset-password",
          "/report-score",
          "/manage-roster",
          "/email/",
          "/sponsor-inquiry/success",
        ],
      },
    ],
    sitemap: "https://varsityvue.com/sitemap.xml",
    host: "https://varsityvue.com",
  };
}
