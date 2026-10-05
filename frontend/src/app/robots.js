export default function robots() {
  const baseUrl = "https://clubs.kptmangaluru.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/auth/",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}