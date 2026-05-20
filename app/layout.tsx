import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: {
    default: "VarsityVue",
    template: "%s | VarsityVue",
  },
  description:
    "Texas high school sports coverage, school hubs, schedules, scores, standings, sponsors, and game previews.",
  metadataBase: new URL("https://varsityvue.com"),
  openGraph: {
    title: "VarsityVue",
    description:
      "Texas high school sports coverage, school hubs, schedules, scores, standings, sponsors, and game previews.",
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
    "Texas high school sports coverage, school hubs, schedules, scores, standings, sponsors, and game previews.",
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

        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}