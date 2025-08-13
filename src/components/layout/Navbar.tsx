"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import logoWhite from "../../../public/logo-white.png";
import { useTheme } from "next-themes";
import { ModeToggle } from "../darkModeToggle";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import navLinks from "@/constants/NavLinks";

const Navbar = () => {
  const { resolvedTheme } = useTheme();
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (resolvedTheme) {
      setIsThemeReady(true);
    }
  }, [resolvedTheme]);

  if (!isThemeReady) return null;

  return (
    <header className="justify-between p-3 bg-black sticky top-0 z-50">
      <div className="mx-auto flex items-center justify-between relative px-5 bg-black">
        {/* Logo - Left Side */}
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

        {/* Mobile Menu Toggle */}
        <div className="flex items-center space-x-4 md:hidden">
          <button className="z-20" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu
                className="w-8 h-8 fill-current text-black"
                style={{ color: "black" }}
              />
            )}
          </button>
          <ModeToggle />
        </div>

        {isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-10 flex items-center justify-center">
            <nav className="bg-white p-8 rounded-lg w-4/5 max-w-md shadow-lg relative">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute top-4 right-4 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded"
              >
                <X className="w-8 h-8" />
              </button>
              <ul
                className="flex flex-col space-y-4 text-lg text-center"
                style={{ fontFamily: "var(--font-bebas-nueue)" }}
              >
                {navLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="block py-2 hover:text-gray-600 dark:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <div>
                    <ConnectButton
                      className={`font-medium rounded-full px-4 py-2 transition-colors ${
                        resolvedTheme === "dark"
                          ? "bg-white text-black hover:bg-gray-200"
                          : "bg-black text-white hover:bg-gray-200"
                      }`}
                    />
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        )}
        <nav
          className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8 text-md text-center px-8 py-2 rounded-full bg-opacity-[10%] bg-black"
          style={{ fontFamily: "var(--font-bebas-nueue)" }}
        >
          {navLinks.map(({ label, href }) => (
            <Link key={label} href={href} className="hover:text-gray-600">
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center space-x-4  ">
          <div>
            <ConnectButton
              className={`font-medium rounded-full transition-colors ${
                resolvedTheme === "dark"
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-black text-white hover:bg-gray-200"
              }`}
            >
              Connect Wallet
            </ConnectButton>
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
