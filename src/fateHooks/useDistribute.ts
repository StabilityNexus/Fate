"use client";
import { useCallback } from "react";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@suiet/wallet-kit";
import { useUpdatePythPrice } from "./useUpdatePythPrice";
import toast from "react-hot-toast";

interface PredictionPool {
  id: string;
  pool_creator: string;
  assetId: string;
}

export function useDistribute() {
  const { account, signAndExecuteTransaction } = useWallet();
  const { updatePythPrice } = useUpdatePythPrice();

  const distribute = useCallback(
    async (pool: PredictionPool) => {
      if (!account?.address) {
        toast.error("Please connect your wallet");
        return;
      }

      const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
      const CLOCK_ID =
        "0x0000000000000000000000000000000000000000000000000000000000000006";

      if (!PACKAGE_ID) {
        toast.error("Missing PACKAGE_ID in environment variables");
        return;
      }

      if (account.address !== pool.pool_creator) {
        toast.error("Only the pool creator can settle outcomes.");
        return;
      }

      try {
        console.log("Starting outcome settlement...", {
          poolId: pool.id,
          creator: pool.pool_creator,
        });

        const suiClient = new SuiClient({
          url: "https://fullnode.testnet.sui.io:443",
        });

        const coins = await suiClient.getCoins({
          owner: account.address,
          coinType: "0x2::sui::SUI",
        });

        const totalBalance = coins.data.reduce(
          (sum, coin) => sum + BigInt(coin.balance),
          BigInt(0)
        );

        if (totalBalance < BigInt(200_000_000)) {
          throw new Error(
            `Insufficient balance for gas. Required: 200000000, Available: ${totalBalance.toString()}`
          );
        }

        const { suiPriceObjectId } = await updatePythPrice([pool.assetId]);
        console.log("Price updated, settling outcome...");

        // Step 2: Settle outcome
        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::prediction_pool::settle_outcome_entry`,
          arguments: [
            tx.object(pool.id),
            tx.object(suiPriceObjectId),
            tx.object(CLOCK_ID),
          ],
        });

        tx.setGasBudget(100_000_000);

        console.log("Executing settlement transaction...");
        const result = await signAndExecuteTransaction({ transaction: tx });

        console.log("Settlement result:", result);
        toast.success("Outcome settlement successful!");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Settle outcome failed:", error);

        let errorMessage = "Unknown error occurred";
        if (error.message?.includes("InsufficientGas")) {
          errorMessage =
            "Transaction failed: Insufficient gas. Please try again with a higher gas budget.";
        } else if (error.message?.includes("InsufficientBalance")) {
          errorMessage = "Insufficient SUI balance for this transaction.";
        } else if (error.message?.includes("EUnauthorized")) {
          errorMessage =
            "Transaction failed: Only the pool creator can settle outcomes.";
        } else if (error.message?.includes("price")) {
          errorMessage =
            "Transaction failed: Price feed error. Please try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(`Outcome settlement failed: ${errorMessage}`);
      }
    },
    [account?.address, signAndExecuteTransaction, updatePythPrice]
  );

  return { distribute };
}
