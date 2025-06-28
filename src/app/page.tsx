"use client";

import { useRef } from "react";
import AboutSection from "@/components/Home/About";
import Hero from "@/components/Home/Hero";
import Navbar from "@/components/layout/Navbar";
import Marquee from "@/components/Home/Marque";
import StickyCursor from "@/components/StickyCursor";
import FooterWrapper from "@/components/layout/FooterWrapper";
import HeroWrapper from "@/components/Home/HeroWrapper";

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
      <FooterWrapper />
    </main>
  );
}
