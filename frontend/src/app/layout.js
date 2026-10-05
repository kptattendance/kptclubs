import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://clubs.kptmangaluru.in"),

  title: {
    default: "KPT Mangalore Clubs | Student Clubs & Activities",
    template: "%s | KPT Mangalore Clubs",
  },

  description:
    "Explore student clubs, activities, events, achievements and extracurricular activities at Karnataka Government Polytechnic Mangaluru.",

  keywords: [
    "KPT Mangalore Clubs",
    "KPT Mangaluru Clubs",
    "Karnataka Government Polytechnic Mangaluru",
    "Karnataka Government Polytechnic Mangalore",
    "KPT Mangalore",
    "KPT Mangaluru",
    "student clubs KPT Mangalore",
    "polytechnic student clubs",
    "college clubs Mangalore",
    "student activities Mangalore",
    "KPT club activities",
    "KPT student activities",
    "college activities Mangaluru",
    "polytechnic activities Karnataka",
    "student events KPT Mangalore",
    "KPT Mangaluru events",
  ],

  authors: [
    {
      name: "Karnataka Government Polytechnic Mangaluru",
    },
  ],

  creator: "Karnataka Government Polytechnic Mangaluru",

  publisher: "Karnataka Government Polytechnic Mangaluru",

  category: "Education",

  classification: "Educational Institution",

  applicationName: "KPT Mangalore Clubs",

  referrer: "origin-when-cross-origin",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Google Search Console verification
  verification: {
    google: "O67tWHY9xLUtBxSrAxCliKSiLNqr1KiTwmd_uKb_iVA",
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",

    url: "https://clubs.kptmangaluru.in",

    siteName: "KPT Mangalore Clubs",

    title: "KPT Mangalore Clubs | Student Clubs & Activities",

    description:
      "Discover student clubs, activities, events, achievements and extracurricular activities at Karnataka Government Polytechnic Mangaluru.",

    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KPT Mangalore Clubs - Student Clubs and Activities",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "KPT Mangalore Clubs | Student Clubs & Activities",

    description:
      "Explore student clubs, activities, events and achievements at Karnataka Government Polytechnic Mangaluru.",

    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: "https://clubs.kptmangaluru.in",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",

  name: "Karnataka Government Polytechnic Mangaluru",

  alternateName: [
    "KPT Mangaluru",
    "KPT Mangalore",
    "Karnataka Government Polytechnic Mangalore",
  ],

  url: "https://clubs.kptmangaluru.in",

  description:
    "Student clubs, activities, events and extracurricular activities of Karnataka Government Polytechnic Mangaluru.",

  address: {
    "@type": "PostalAddress",
    addressLocality: "Mangaluru",
    addressRegion: "Karnataka",
    addressCountry: "IN",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",

  name: "KPT Mangalore Clubs",

  alternateName: "KPT Mangaluru Clubs",

  url: "https://clubs.kptmangaluru.in",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable}`}
        >
          {children}

          {/* Educational Organization Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema),
            }}
          />

          {/* Website Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(websiteSchema),
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}