import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, Coins } from "lucide-react";
import type { FormData } from "@/types/FormData";

type PoolConfigurationStepProps = {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: { [key: string]: string };
};

const PoolConfigurationStep: React.FC<PoolConfigurationStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  return (
    <div className="space-y-4">
      {/* Pool Name */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <Label
            htmlFor="poolName"
            className="text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            Name of the Fate Pool *
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-gray-600/70 dark:text-gray-400/70 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                <p className="w-64 text-sm">
                  Enter a unique and descriptive name for your Fate Pool
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          type="text"
          id="poolName"
          name="poolName"
          placeholder="e.g. FateBTC"
          value={formData.poolName}
          onChange={(e) => updateFormData({ poolName: e.target.value })}
          className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
            errors.poolName ? "border-red-500" : ""
          }`}
        />
        {errors.poolName && (
          <p className="text-red-500 text-sm">{errors.poolName}</p>
        )}
      </div>

      {/* Pool Description */}
      <div className="space-y-2">
        <Label
          htmlFor="poolDescription"
          className="text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          Pool Description
        </Label>
        <Input
          type="text"
          id="poolDescription"
          name="poolDescription"
          placeholder="e.g. A BTC/USD prediction pool"
          value={formData.poolDescription || ""}
          onChange={(e) => updateFormData({ poolDescription: e.target.value })}
          className="transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white"
        />
      </div>

      {/* Asset ID */}
      <div className="space-y-2">
        <Label
          htmlFor="assetId"
          className="text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          Asset ID *
        </Label>
        <select
          id="assetId"
          name="assetId"
          value={formData.assetId || ""}
          onChange={(e) => updateFormData({ assetId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 text-black dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          <option value="" disabled>
            Select an Asset ID
          </option>
          <option value="0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b">
            BTC/USD
          </option>
          <option value="0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6">ETH/USD</option>
          <option value="0x73dc009953c83c944690037ea477df627657f45c14f16ad3a61089c5a3f9f4f2">ADA/USD</option>
        </select>
      </div>
    </div>
  );
};

export default PoolConfigurationStep;
