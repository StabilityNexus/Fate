import React from "react";
import { RangeSlider } from "./RangeSlider";
import { ArrowRight } from "lucide-react";

interface PredictionCardProps {
  name: string;
  description: string;
  bullCoinSymbol: string;
  bearCoinSymbol: string;
  bullPercentage: number;
  bearPercentage: number;
  volume?: string;
  participants?: number;
  onUse?: () => void;
}

export function PredictionCard({
  name,
  description,
  bullCoinSymbol,
  bearCoinSymbol,
  bullPercentage,
  bearPercentage,
  onUse,
}: PredictionCardProps) {
  return (
    <div className="w-full max-w-sm bg-white hover:scale-[1.02] dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Title Section */}
      <div className="bg-gradient-to-r from-neutral-600 to-neutral-800 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
          <p className="text-neutral-200 text-sm">{description}</p>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-500"></div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {bullCoinSymbol}
              </span>
            </div>
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-400">
              {bullPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-600"></div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {bearCoinSymbol}
              </span>
            </div>
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-400">
              {bearPercentage.toFixed(1)}%
            </span>
          </div>

          <RangeSlider value={bullPercentage} onChange={() => {}} />
        </div>

        <button
          onClick={onUse}
          className="w-full py-3 px-4 bg-gradient-to-r from-neutral-600 to-neutral-700 text-white rounded-xl font-medium 
                   flex items-center justify-center gap-2 transform transition-all duration-300
                   hover:from-neutral-700 hover:to-neutral-800 hover:shadow-lg hover:-translate-y-0.5
                   focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-opacity-50"
        >
          Enter Pool
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
