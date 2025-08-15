/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Pool } from "@/types/Pool";

type Props = {
  pools: Pool[];
  speed?: number; // pixels per second (default 50)
  pauseOnHover?: boolean;
};

export default function PoolsMarquee({
  pools,
  speed = 50,
  pauseOnHover = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Create enough duplicates to ensure seamless scrolling
  const [displayPools, setDisplayPools] = useState<Pool[]>([]);

  useEffect(() => {
    if (!pools || pools.length === 0) return;
    // Start with 2 copies
    setDisplayPools([...pools, ...pools]);
  }, [pools]);

  // Watch for translateX reaching the end of the current set
  useEffect(() => {
    const singleSetWidth =
      Number(contentRef?.current?.scrollWidth) /
      (displayPools.length / pools.length);

    if (
      singleSetWidth &&
      Math.abs(translateX) >=
        singleSetWidth * (displayPools.length / pools.length - 1)
    ) {
      // Append another full set
      setDisplayPools((prev) => [...prev, ...pools]);
    }
  }, [translateX, pools, displayPools]);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content || !pools || pools.length === 0) return;

    let animationId: number;
    let lastTime = 0;
    let currentTranslate = 0;

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      if (!isPaused) {
        currentTranslate -= (speed * deltaTime) / 1000;
        setTranslateX(currentTranslate);
      }

      animationId = requestAnimationFrame(animate);
      animationRef.current = animationId;
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [pools, speed, isPaused]);

  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  return (
    <section
      aria-label="Available pools marquee"
      className="relative bg-white dark:bg-black py-8 overflow-x-hidden"
    >
      <div
        ref={containerRef}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="list"
      >
        <div
          ref={contentRef}
          className="flex gap-6 px-4 transition-transform duration-100 ease-linear"
          style={{
            transform: `translateX(${translateX}px)`,
            width: "max-content",
          }}
        >
          {[...displayPools, ...displayPools].map((pool, index) => (
            <article
              key={`${pool.id}-${index}`}
              role="listitem"
              onClick={() =>
                (window.location.href = `/predictionPool/${encodeURIComponent(
                  pool.id
                )}`)
              }
              className="group min-w-[320px] bg-white dark:bg-black border border-black dark:border-white 
             rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] 
             transition-all duration-1000 ease-in-out flex-shrink-0 cursor-pointer
             hover:bg-black hover:text-white 
             dark:hover:bg-white dark:hover:text-black"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-lg font-bold text-black dark:text-white truncate mb-1 
                     group-hover:text-inherit transition-colors duration-1000 ease-in-out"
                  >
                    {pool.name}
                  </h4>
                  <p
                    className="text-sm text-black/70 dark:text-white/70 group-hover:text-inherit 
                    transition-colors duration-1000 ease-in-out line-clamp-2 leading-relaxed"
                  >
                    {pool.description || "No description available"}
                  </p>
                </div>
              </div>

              {/* Bull & Bear percentages */}
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <span
                    className="block text-xs font-medium text-black/60 dark:text-white/60 
                       group-hover:text-inherit transition-colors duration-1000 ease-in-out"
                  >
                    Bull
                  </span>
                  <p
                    className="text-xl font-bold text-black dark:text-white 
                    group-hover:text-inherit transition-colors duration-1000 ease-in-out"
                  >
                    {Math.round(pool.bullPercentage)}%
                  </p>
                </div>
                <div className="text-center">
                  <span
                    className="block text-xs font-medium text-black/60 dark:text-white/60 
                       group-hover:text-inherit transition-colors duration-1000 ease-in-out"
                  >
                    Bear
                  </span>
                  <p
                    className="text-xl font-bold text-black dark:text-white 
                    group-hover:text-inherit transition-colors duration-1000 ease-in-out"
                  >
                    {Math.round(100 - pool.bullPercentage)}%
                  </p>
                </div>
              </div>

              {/* Reserve info */}
              <div
                className="flex justify-between items-center p-3 bg-black/5 dark:bg-white/10 rounded-lg 
                  group-hover:bg-transparent transition-colors duration-1000 ease-in-out"
              >
                <span
                  className="text-sm font-medium text-black/70 dark:text-white/70 
                     group-hover:text-inherit transition-colors duration-1000 ease-in-out"
                >
                  Total Reserve
                </span>
                <span
                  className="text-lg font-bold text-black dark:text-white 
                     group-hover:text-inherit transition-colors duration-1000 ease-in-out"
                >
                  {(
                    (pool.bull_reserve + pool.bear_reserve) /
                    1e10
                  ).toLocaleString()}{" "}
                  SUI
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
