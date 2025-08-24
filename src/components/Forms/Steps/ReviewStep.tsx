"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { FormData } from "@/types/FormData";

interface ReviewStepProps {
  formData: FormData;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  isSubmitting: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  formData,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Review & Submit
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Review your configuration before creating the pool
        </p>
      </div>

      <div className="space-y-6">
        {/* Pool Configuration Review */}
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Pool Configuration
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">
                Pool Name:
              </span>
              <span className="font-medium text-black dark:text-white">
                {formData.poolName || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Token Configuration Review */}
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Token Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                Bull Token
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Name:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bullCoinName || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Symbol:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bullCoinSymbol || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                Bear Token
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Name:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bearCoinName || "Not specified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Symbol:
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {formData.bearCoinSymbol || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Configuration Review */}
        <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-3">
            Fee Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <div className="text-neutral-600 dark:text-neutral-400">
                Protocol Fee:
              </div>
              <span className="font-medium text-black dark:text-white">
                {formData.protocolFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">
                Stable Order Fee:
              </span>
              <span className="font-medium text-black dark:text-white">
                {formData.stableOrderFee || "0"}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">
                Pool Creator Fee:
              </span>
              <span className="font-medium text-black dark:text-white">
                {formData.poolCreatorFee || "0"}%
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Fee Recipient:
                </span>
                <span className="font-medium text-black dark:text-white break-all">
                  {formData.poolCreatorAddress || "Will use connected wallet"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full mt-6 text-lg h-12 bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-50"
        >
          {isSubmitting ? "Creating Pool..." : "Create Fate Pool"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
