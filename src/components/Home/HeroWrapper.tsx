"use client";
import React from "react";
import { useTheme } from "next-themes";
import { Vortex } from "../ui/vortex";

type HeroWrapperProps = {
  children: React.ReactNode;
};

const HeroWrapper: React.FC<HeroWrapperProps> = ({ children }) => {
  const { resolvedTheme } = useTheme();

  if (!resolvedTheme) return null;

  const commonClasses = "flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full";

  return (
    <div className="relative w-full h-screen overflow-hidden dark:bg-black bg-white flex -mt-10">
      {resolvedTheme === "dark" ? (
        <Vortex backgroundColor="black" rangeY={200} className={commonClasses}>
          {children}
        </Vortex>
      ) : (
        <div className={commonClasses}>{children}</div>
      )}
    </div>
  );
};

export default HeroWrapper;
