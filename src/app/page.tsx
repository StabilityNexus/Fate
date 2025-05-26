import AboutSection from "@/components/Home/About";
import Hero from "@/components/Home/Hero";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import DEPLOYED from "../utils/scripts/deployed_addresses.json"

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <AboutSection />
      <Footer />
    </>
  );
}
