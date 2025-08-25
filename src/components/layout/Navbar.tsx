"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import logoWhite from "../../../public/logo-white.png";
import { useTheme } from "next-themes";
import { ModeToggle } from "../darkModeToggle";
import { ConnectButton } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import navLinks from "@/constants/NavLinks";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const { resolvedTheme } = useTheme();
  const [isThemeReady, setIsThemeReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (resolvedTheme) {
      setIsThemeReady(true);
    }
  }, [resolvedTheme]);

  if (!isThemeReady) return null;

  return (
    <header className="justify-between p-3 bg-black sticky top-0 z-50">
      <div className="mx-auto flex items-center justify-between relative px-5 bg-black">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            <div className="text-center">
              <Image
                src={logoWhite}
                alt="Fate Protocol"
                width={50}
                height={50}
                className="p-2"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav
          className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8 text-md text-center px-8 py-2 rounded-full bg-opacity-[10%] bg-black"
          style={{ fontFamily: "var(--font-bebas-nueue)" }}
        >
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`hover:text-neutral-400 transition-all duration-200 ${
                  isActive
                    ? "border-b-2 border-white pb-1 text-white"
                    : "text-neutral-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet & Theme */}
        <div className="hidden md:flex items-center space-x-4">
          <ConnectButton
            className={`font-medium rounded-full transition-colors ${
              resolvedTheme === "dark"
                ? "bg-white text-black hover:bg-neutral-200"
                : "bg-black text-white hover:bg-neutral-200"
            }`}
          >
            Connect Wallet
          </ConnectButton>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
