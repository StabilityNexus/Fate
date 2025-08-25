"use client";

import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** Minimum time (ms) the loader stays visible to avoid flicker */
  minDuration?: number;
};

export default function AppLoader({ children, minDuration = 600 }: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = performance.now();
    const onReady = () => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, minDuration - elapsed);
      const t = setTimeout(() => setLoading(false), remaining);
      return () => clearTimeout(t);
    };

    // Let the UI mount first; you can also gate on actual app readiness if needed.
    const cleanup = onReady();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [minDuration]);

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden
                   bg-white text-black dark:bg-black dark:text-white"
        aria-busy="true"
        aria-live="polite"
        role="status"
      >
        {/* Subtle vignette + grain */}
        <div className="pointer-events-none absolute inset-0 fate-vignette" />
        <div className="pointer-events-none absolute inset-0 fate-noise opacity-[0.05]" />

        {/* Loader core */}
        <div className="relative w-[160px] h-[160px] flex items-center justify-center">
          {/* Outer rotating ring */}
          <svg
            className="absolute inset-0 animate-fate-spin-slow"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="62 276"
              className="animate-fate-dash"
            />
          </svg>

          {/* Inner counter-rotating ring */}
          <svg
            className="absolute inset-[18px] animate-fate-spin-rev"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="40 200"
              className="animate-fate-dash-slower"
            />
          </svg>

          {/* “Dual coin” core */}
          <div className="relative w-20 h-20 rounded-full border border-current/20 bg-current/[0.03] backdrop-blur-[1px]">
            <div className="absolute inset-0 rounded-full fate-core-glow" />
            {/* Split motif */}
            <div className="absolute inset-0 grid grid-cols-2 rounded-full overflow-hidden">
              <div className="bg-current/5" />
              <div className="bg-transparent" />
            </div>
          </div>
          {/* FATE wordmark with shimmer */}
          <div className="absolute -bottom-10 flex items-center justify-center ">
            <span className="text-xs uppercase tracking-widest opacity-60">
              FATE Protocol
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
