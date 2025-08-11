/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  SuiPythClient,
  SuiPriceServiceConnection,
} from "@pythnetwork/pyth-sui-js";
import { SuiClient } from "@mysten/sui/client";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const stepTitles = ["Pool", "Tokens", "Address", "Fees", "Review"];
  const totalSteps = 5;

  const [formData, setFormData] = useState<FormData>({
    poolName: "",
    poolDescription: "",
    assetId: "",
    assetAddress: "",
    bullCoinName: "",
    bullCoinSymbol: "",
    bearCoinName: "",
    bearCoinSymbol: "",
    poolCreatorFee: "",
    poolCreatorAddress: "",
    protocolFee: "",
    stableOrderFee: "",
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
        if (!formData.poolCreatorFee.trim()) {
          newErrors.poolCreatorFee = "Creator stake fee is required";
        }
        if (!formData.protocolFee.trim()) {
          newErrors.protocolFee = "Creator unstake fee is required";
        }
        if (!formData.stableOrderFee.trim()) {
          newErrors.stableOrderFee = "Stake fee is required";
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
    setIsSubmitting(true);
    console.log("Form submitted:", formData);

    if (!account?.address) {
      alert("Please connect your wallet.");
      setIsSubmitting(false);
      return;
    }

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const PYTH_STATE_ID = process.env.NEXT_PUBLIC_PYTH_STATE_ID;
    const CLOCK_ID =
      "0x0000000000000000000000000000000000000000000000000000000000000006";
    const WORMHOLE_STATE_ID =
      "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";

    if (!PACKAGE_ID || !PYTH_STATE_ID) {
      alert("Missing environment variables for PACKAGE_ID or PYTH_STATE_ID");
      setIsSubmitting(false);
      return;
    }

    try {
      const poolName = formData.poolName || "Default Pool";
      const poolDescription = formData.poolDescription || "A prediction pool";
      const assetAddress = formData.assetAddress || "0x0000000000000000000000000000000000000000";
      const protocolFee = parseInt(formData.protocolFee || "100");
      const stableOrderFee = parseInt(formData.stableOrderFee || "50");
      const poolCreatorFee = parseInt(formData.poolCreatorFee || "50");
      const poolCreator = formData.poolCreatorAddress || account.address;
      const bullTokenName = `${poolName} Bull`;
      const bullTokenSymbol = "BULL";
      const bearTokenName = `${poolName} Bear`;
      const bearTokenSymbol = "BEAR";

      const connection = new SuiPriceServiceConnection(
        "https://hermes-beta.pyth.network",
        { priceFeedRequestConfig: { binary: true } }
      );

      const priceIDs: string[] = formData?.assetId
        ? Array.isArray(formData.assetId)
          ? formData.assetId
          : [formData.assetId]
        : [
            "0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266",
          ];

      const priceUpdateData = await connection.getPriceFeedsUpdateData(
        priceIDs
      );

      const suiClient = new SuiClient({
        url: "https://fullnode.testnet.sui.io:443",
      });
      const pythClient = new SuiPythClient(
        suiClient,
        PYTH_STATE_ID,
        WORMHOLE_STATE_ID
      );

      const updateTx = new Transaction();
      const priceInfoObjectIds = await pythClient.updatePriceFeeds(
        updateTx,
        priceUpdateData,
        priceIDs
      );

      const suiPriceObjectId = priceInfoObjectIds[0];
      if (!suiPriceObjectId) {
        throw new Error("Failed to get price object ID from Pyth update");
      }

      updateTx.setGasBudget(50_000_000);
      const updateResult = await signAndExecuteTransaction({
        transaction: updateTx,
      });
      console.log("Price update result:", updateResult);

      const tx = new Transaction();
      const assetIdBytes = Array.from(Buffer.from(priceIDs[0].slice(2), "hex"));

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::create_pool`,
        arguments: [
          tx.pure.vector("u8", Array.from(Buffer.from(poolName, "utf8"))),
          tx.pure.vector(
            "u8",
            Array.from(Buffer.from(poolDescription, "utf8"))
          ),
          tx.pure.vector("u8", assetIdBytes),
          tx.pure.address(assetAddress),
          tx.pure.u64(protocolFee),
          tx.pure.u64(stableOrderFee),
          tx.pure.u64(poolCreatorFee),
          tx.pure.address(poolCreator),
          tx.pure.vector("u8", Array.from(Buffer.from(bullTokenName, "utf8"))),
          tx.pure.vector(
            "u8",
            Array.from(Buffer.from(bullTokenSymbol, "utf8"))
          ),
          tx.pure.vector("u8", Array.from(Buffer.from(bearTokenName, "utf8"))),
          tx.pure.vector(
            "u8",
            Array.from(Buffer.from(bearTokenSymbol, "utf8"))
          ),
          tx.object(suiPriceObjectId),
          tx.object(CLOCK_ID),
        ],
      });

      tx.setGasBudget(100_000_000);
      const result = await signAndExecuteTransaction({ transaction: tx });

      console.log("Pool created successfully:", result);

      const resultObj = typeof result === "string" ? JSON.parse(result) : result;

      const poolId = resultObj.effects?.created?.[0]?.reference?.objectId;
      if (poolId) {
        console.log("New pool ID:", poolId);
      }

      alert("Prediction Pool created successfully!");
      router.push("/explorePools");
    } catch (err: any) {
      console.error("Transaction error:", err);

      if (err.message?.includes("InsufficientGas")) {
        alert(
          "Transaction failed: Insufficient gas. Please try again with a higher gas budget."
        );
      } else if (err.message?.includes("price")) {
        alert("Transaction failed: Price feed error. Please try again.");
      } else {
        alert(`Transaction failed: ${err.message || err}`);
      }
    } finally {
      setIsSubmitting(false);
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
