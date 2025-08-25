"use client";
import { useCallback } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@suiet/wallet-kit";
import { useUpdatePythPrice } from "./useUpdatePythPrice";
import toast from "react-hot-toast";

interface SellTokensParams {
  amount: number;
  isBull: boolean;
  vaultId: string;
  assetId: string;
}

export function useSellTokens() {
  const { account, signAndExecuteTransaction } = useWallet();
  const { updatePythPrice } = useUpdatePythPrice();

  const sellTokens = useCallback(
    async ({ amount, isBull, vaultId, assetId }: SellTokensParams) => {
      if (!amount || amount <= 0 || !account?.address) {
        toast.error("Please enter a valid amount and connect your wallet");
        return;
      }

      const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
      const CLOCK_ID =
        "0x0000000000000000000000000000000000000000000000000000000000000006";

      if (!PACKAGE_ID) {
        toast.error("Missing PACKAGE_ID in environment variables");
        return;
      }

      try {
        console.log(`Starting ${isBull ? "bull" : "bear"} token sale...`, {
          amount,
          vaultId,
        });

        const tokenAmount = BigInt(Math.floor(amount * 1_000_000_000));

        const { suiPriceObjectId } = await updatePythPrice([assetId]);

        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::prediction_pool::redeem_token`,
          arguments: [
            tx.object(vaultId),
            tx.pure.bool(isBull),
            tx.pure.u64(tokenAmount),
            tx.object(suiPriceObjectId),
            tx.object(CLOCK_ID),
          ],
        });

        tx.setGasBudget(100_000_000);

        console.log("Executing sell transaction...");
        const result = await signAndExecuteTransaction({ transaction: tx });

        console.log("Transaction result:", result);
        toast.success(`${isBull ? "Bull" : "Bear"} token sale successful!`);
        window.location.reload();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Sell token failed:", error);

        toast.error(
          `${isBull ? "Bull" : "Bear"} token sale failed: ${error.message}`
        );
      }
    },
    [account?.address, signAndExecuteTransaction, updatePythPrice]
  );

  return { sellTokens };
}
