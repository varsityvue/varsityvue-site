export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/internal/",
    },
    sitemap: "https://varsityvue.com/sitemap.xml",
  };
}