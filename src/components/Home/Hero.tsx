"use client";
import React, { useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PoolAddressModal from "./PoolAddressModal";
import { cn } from "@/lib/utils";
const Hero = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vaultAddress, setVaultAddress] = useState("");

  const handleSubmit = () => {
    if (vaultAddress) {
      router.push(`/usePool/${vaultAddress}`);
    }
  };

  if (!resolvedTheme) return null;
  const buttonBaseStyles =
    "px-6 py-3 border-2 rounded-full text-lg transition-all duration-300";
  const buttonThemeStyles =
    resolvedTheme === "dark"
      ? "border-white text-white hover:bg-white hover:text-black"
      : "border-black text-black hover:bg-black hover:text-white";
  return (
    <div className="w-full h-full flex flex-col items-center text-center mt-24">
      <h1 className="text-[15vw] font-bold font-fate fate-title">FATE</h1>
      <p className="dark:text-white text-black text-2xl -mt-16 mb-4">
        Perpetual Prediction Pool
      </p>

      <div className="flex gap-4 justify-center">
        <Link href="/createPool">
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

        <Link href="/explore-pools">
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

        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(buttonBaseStyles, buttonThemeStyles)}
        >
          Use
        </button>
      </div>

      {isModalOpen && (
        <PoolAddressModal
          vaultAddress={vaultAddress}
          setVaultAddress={setVaultAddress}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default Hero;
