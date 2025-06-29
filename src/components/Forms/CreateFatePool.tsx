"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PoolConfigurationStep from "./Steps/PoolConfigurationStep";
import TokenConfigurationStep from "./Steps/TokenConfigurationStep";
import AddressConfigurationStep from "./Steps/AddressConfigurationStep";
import FeeConfigurationStep from "./Steps/FeeConfigurationStep";
import ReviewStep from "./Steps/ReviewStep";
import StepIndicator from "./Steps/StepIndicator";
import type { FormData } from "@/types/FormData";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@suiet/wallet-kit";
import { useRouter } from "next/navigation";
type FormErrors = Partial<Record<keyof FormData, string>>;

export default function CreateFatePoolForm() {
  const router = useRouter();
  const { account, signAndExecuteTransaction } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const stepTitles = ["Pool", "Tokens", "Address", "Fees", "Review"];
  const totalSteps = 5;

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    poolName: "",
    bullCoinName: "",
    bullCoinSymbol: "",
    bearCoinName: "",
    bearCoinSymbol: "",
    creatorAddress: "",
    creatorStakeFee: "",
    creatorUnstakeFee: "",
    stakeFee: "",
    unstakeFee: "",
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    const updatedFields = Object.keys(updates) as (keyof FormData)[];
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedFields.forEach((field) => {
        delete newErrors[field];
      });
      return newErrors;
    });
  };
  const validateStep = (step: number) => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.poolName.trim()) {
          newErrors.poolName = "Pool name is required";
        }
        break;
      case 2:
        if (!formData.bullCoinName.trim()) {
          newErrors.bullCoinName = "Bull coin name is required";
        }
        if (!formData.bullCoinSymbol.trim()) {
          newErrors.bullCoinSymbol = "Bull coin symbol is required";
        }
        if (!formData.bearCoinName.trim()) {
          newErrors.bearCoinName = "Bear coin name is required";
        }
        if (!formData.bearCoinSymbol.trim()) {
          newErrors.bearCoinSymbol = "Bear coin symbol is required";
        }
        break;
      case 4:
        if (!formData.creatorStakeFee.trim()) {
          newErrors.creatorStakeFee = "Creator stake fee is required";
        }
        if (!formData.creatorUnstakeFee.trim()) {
          newErrors.creatorUnstakeFee = "Creator unstake fee is required";
        }
        if (!formData.stakeFee.trim()) {
          newErrors.stakeFee = "Stake fee is required";
        }
        if (!formData.unstakeFee.trim()) {
          newErrors.unstakeFee = "Unstake fee is required";
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    if (!account?.address) {
      alert("Please connect your wallet.");
      return;
    }

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

    if (!PACKAGE_ID) {
      alert("PACKAGE_ID not defined in .env");
      return;
    }

    try {
      const tx = new Transaction();

      const vault_creator = formData.creatorAddress || account.address;
      const vault_fee = parseInt(formData.stakeFee || "0");
      const vault_creator_fee = parseInt(formData.creatorStakeFee || "0");
      const treasury_fee = parseInt(formData.unstakeFee || "0");

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::create_prediction_pool`,
        arguments: [
          tx.pure.address(vault_creator),
          tx.pure.u64(vault_fee),
          tx.pure.u64(vault_creator_fee),
          tx.pure.u64(treasury_fee),
        ],
      });
      tx.setGasBudget(11_000_000);
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      router.push("/explorePools");
      console.log("Transaction result:", result);
      alert("Prediction Pool created successfully!");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Transaction error:", err);
      alert(`Transaction failed: ${err.message || err}`);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PoolConfigurationStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 2:
        return (
          <TokenConfigurationStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <AddressConfigurationStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 4:
        return (
          <FeeConfigurationStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 5:
        return (
          <ReviewStep
            formData={formData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-[150vh] dark:bg-black bg-white">
      <div className="bg-white dark:bg-black p-6 rounded-xl my-10">
        <Card className="shadow-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-2xl font-bold text-black dark:text-white">
              Create Fate Pool
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Follow the steps to configure your new Fate Pool
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <StepIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepTitles={stepTitles}
            />

            <div className="">{renderCurrentStep()}</div>

            {currentStep < totalSteps && (
              <>
                <Separator className="bg-gray-200 dark:bg-gray-700 my-6" />
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
