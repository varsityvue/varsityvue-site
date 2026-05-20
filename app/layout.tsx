import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "VarsityVue",
  description:
    "Texas high school sports coverage, school hubs, schedules, scores, standings, sponsors, and game previews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}