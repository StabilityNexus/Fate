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
import type {FormData} from "@/types/FormData";

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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">
          Pool Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Set up the basic details for your Fate Pool
        </p>
      </div>

      <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default PoolConfigurationStep;
