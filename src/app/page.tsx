"use client";

import { useRef } from "react";
import AboutSection from "@/components/Home/About";
import Hero from "@/components/Home/Hero";
import Navbar from "@/components/layout/Navbar";
import Marquee from "@/components/Home/Marque";
import StickyCursor from "@/components/StickyCursor";
import FooterWrapper from "@/components/layout/FooterWrapper";

export default function Home() {
  const stickyRef = useRef<HTMLElement>(null);

  return (
    <main className="relative h-[200vh]">
      <StickyCursor stickyRef={stickyRef} />
      <Navbar />
      <Hero stickyRef={stickyRef} />
      <Marquee />
      <AboutSection />
      <FooterWrapper />
    </main>
  );
}
