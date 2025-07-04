"use client";

import { useRef } from "react";
import AboutSection from "@/components/home/About";
import Hero from "@/components/home/Hero";
import Navbar from "@/components/layout/Navbar";
import Marquee from "@/components/home/Marque";
import StickyCursor from "@/components/stickyCursor";
import HeroWrapper from "@/components/home/HeroWrapper";
import Footer from "@/components/layout/Footer";

export default function Home() {
  const stickyRef = useRef<HTMLElement>(null);

  return (
    <main className="relative h-[200vh]">
      <StickyCursor stickyRef={stickyRef} />
      <Navbar />
      <HeroWrapper>
        <Hero />
      </HeroWrapper>
      <Marquee />
      <AboutSection />
      <Footer />
    </main>
  );
}
