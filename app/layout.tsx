import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import HomepageRecordCleanup from "../components/HomepageRecordCleanup";

export const revalidate = 300;

const siteTitle = "VarsityVue | Texas High School Football Scores & Coverage";
const siteDescription =
  "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage on VarsityVue.";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: "%s | VarsityVue",
  },
  applicationName: "VarsityVue",
  description: siteDescription,
  metadataBase: new URL("https://varsityvue.com"),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/varsityvue-v-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/varsityvue-v-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "VarsityVue",
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-mobile-web-app-title": "VarsityVue",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://varsityvue.com",
    siteName: "VarsityVue",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#8B1020",
  colorScheme: "dark",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VarsityVue",
  url: "https://varsityvue.com",
  description:
    "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage.",
  sameAs: [
    "https://x.com/varsityvue",
    "https://instagram.com/varsityvueapp",
    "https://facebook.com/VarsityVue",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        <SiteHeader />
        {children}
        <HomepageRecordCleanup />
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
