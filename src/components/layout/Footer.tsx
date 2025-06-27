"use client";
import Link from "next/link";
import { navigation } from "@/constants/Navigation";

export default function Footer() {
  return (
    <footer className="h-full w-full flex flex-col justify-between bg-[#4E4E5A] px-12 py-8 text-white">
      <Section1 />
      <Section2 />
    </footer>
  );
}

const Section1 = () => {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:justify-between mt-32">
      <div className="flex gap-20">
        <div className="flex flex-col gap-2">
          <h3 className="mb-2 uppercase text-[#ffffff80]">About</h3>
          <p>Home</p>
          <p>Projects</p>
          <p>Our Mission</p>
          <p>Contact Us</p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="mb-2 uppercase text-[#ffffff80]">Education</h3>
          <p>News</p>
          <p>Learn</p>
          <p>Certification</p>
          <p>Publications</p>
        </div>
      </div>

      <div className="mt-8 md:mt-0 flex items-center space-x-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            target="_blank"
            className="rounded-full bg-white/10 dark:bg-black/10 p-2 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
          >
            <span className="sr-only">{item.name}</span>
            <item.icon
              className="size-6 text-white dark:text-white"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

const Section2 = () => {
  return (
    <div className="flex justify-between items-end">
      <h1 className="text-[14vw] leading-[0.8] mt-10">Fate Protocol</h1>
    </div>
  );
};
