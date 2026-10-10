export default function robots() {
  const baseUrl = "https://clubs.kptmangaluru.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/hod/",
          "/principal/",
          "/student/",
          "/club-incharge/",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/unauthorized",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
