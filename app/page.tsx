"use client";

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import FeaturedSchools from "@/components/FeaturedSchools";
import Sponsors from "@/components/Sponsors";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
    
      <Hero />
      <Features />
      <FeaturedSchools />
      <Sponsors />
    </main>
  );
}