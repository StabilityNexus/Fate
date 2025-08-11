"use client";
import Link from "next/link";
import { navigation } from "@/constants/Navigation";
import footerLinks from "@/constants/Footerlinks";
export default function Footer() {
  return (
    <div
      className="relative h-[800px]"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="relative h-[calc(100vh+800px)] -top-[100vh]">
        <div className="h-[800px] sticky top-[calc(100vh-800px)]">
          <footer className="h-full w-full flex flex-col justify-between bg-[#4E4E5A] px-12 py-12 pt-56 text-white">
            <Section1 />
            <Section2 />
          </footer>
        </div>
      </div>
    </div>
  );
}

const Section1 = () => {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:justify-between mt-16 md:mt-32">
      <div className="flex flex-col gap-8 md:flex-row md:gap-20">
        {footerLinks.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h3 className="mb-2 uppercase text-[#ffffff80]">{section.title}</h3>
            {section.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
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
      <h1 className="text-6xl md:text-8xl lg:text-[14vw] leading-[0.8] mt-10">
        Fate Protocol*
      </h1>
    </div>
  );
};
