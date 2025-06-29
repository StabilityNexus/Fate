"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, Wallet } from "lucide-react";
import type {FormData} from "@/types/FormData";

type AddressConfigurationStepProps = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
};

const AddressConfigurationStep = ({
  formData,
  updateFormData,
}: AddressConfigurationStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Address Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Set up fee recipient address
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Fee Recipient Address
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <p className="w-64 text-sm">
                    The address that will receive the creator&apos;s portion of vault
                    fees. Leave empty to use your connected wallet address.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            type="text"
            placeholder="0x... (optional - will use your wallet address if empty)"
            value={formData.creatorAddress}
            onChange={(e) => updateFormData({ creatorAddress: e.target.value })}
            className="transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default AddressConfigurationStep;
