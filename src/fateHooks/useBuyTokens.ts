"use client";
import { useCallback } from "react";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@suiet/wallet-kit";
import { useUpdatePythPrice } from "./useUpdatePythPrice";
import toast from "react-hot-toast";
interface BuyTokensParams {
  amount: number;
  isBull: boolean;
  vaultId: string;
  assetId: string;
}

export function useBuyTokens() {
  const { account, signAndExecuteTransaction } = useWallet();
  const { updatePythPrice } = useUpdatePythPrice();

  const buyTokens = useCallback(
    async ({ amount, isBull, vaultId, assetId }: BuyTokensParams) => {
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
        console.log(`Starting ${isBull ? "bull" : "bear"} token purchase...`, {
          amount,
          vaultId,
        });

        const amountInMist = BigInt(amount * 1_000_000_000);

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

        if (totalBalance < amountInMist + BigInt(100_000_000)) {
          throw new Error(
            `Insufficient balance. Required: ${
              amountInMist + BigInt(100_000_000)
            }, Available: ${totalBalance.toString()}`
          );
        }

        const { suiPriceObjectId } = await updatePythPrice([assetId]);

        const tx = new Transaction();
        tx.moveCall({
          target: `${PACKAGE_ID}::prediction_pool::purchase_token`,
          arguments: [
            tx.object(vaultId),
            tx.pure.bool(isBull),
            tx.object(suiPriceObjectId),
            tx.object(CLOCK_ID),
            tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]),
          ],
        });

        tx.setGasBudget(100_000_000);

        console.log("Executing purchase transaction...");
        const result = await signAndExecuteTransaction({ transaction: tx });

        console.log("Transaction result:", result);
        toast.success(`${isBull ? "Bull" : "Bear"} token purchase successful!`);
        window.location.reload();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Buy token failed:", error);

        toast.error(
          `${isBull ? "Bull" : "Bear"} token purchase failed: ${
            error.message
          }`
        );
      }
    },
    [account?.address, signAndExecuteTransaction, updatePythPrice]
  );

  return { buyTokens };
}
