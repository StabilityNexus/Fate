"use client";
import React from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

const Hero = () => {
  const { resolvedTheme } = useTheme();

  if (!resolvedTheme) return null;

  return (
    <div className="w-full h-full flex flex-col items-center text-center mt-24">
      <h1 className="text-[15vw] font-bold font-fate fate-title">FATE</h1>
      <p className="dark:text-white text-black text-2xl -mt-16 mb-4">
        Perpetual Prediction Pool
      </p>

      <div className="flex gap-4 justify-center">
        <Link href="/predictionPool/create">
          <button
            className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300 ${
              resolvedTheme === "dark"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"
            }`}
          >
            Create
          </button>
        </Link>

        <Link href="/predictionPool">
          <button
            className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300 ${
              resolvedTheme === "dark"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"
            }`}
          >
            Explore
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Hero;
