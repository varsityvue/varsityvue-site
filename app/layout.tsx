import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: {
    default: "VarsityVue | Texas High School Football Scores & Coverage",
    template: "%s | VarsityVue",
  },
  description:
    "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage on VarsityVue.",
  metadataBase: new URL("https://varsityvue.com"),
  openGraph: {
    title: "VarsityVue | Texas High School Football Scores & Coverage",
    description:
      "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage on VarsityVue.",
    url: "https://varsityvue.com",
    siteName: "VarsityVue",
    type: "website",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
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
        <Footer />
      </body>
    </html>
  );
}