"use client";
import { useCallback } from "react";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { SuiPriceServiceConnection, SuiPythClient } from "@pythnetwork/pyth-sui-js";
import { useWallet } from "@suiet/wallet-kit"; 

export function useUpdatePythPrice() {
  const { signAndExecuteTransaction } = useWallet();

  const updatePythPrice = useCallback(
    async (assetIds?: string[]) => {
      const PYTH_STATE_ID = process.env.NEXT_PUBLIC_PYTH_STATE_ID;
      const WORMHOLE_STATE_ID =
        "0x31358d198147da50db32eda2562951d53973a0c0ad5ed738e9b17d88b213d790";

      if (!PYTH_STATE_ID) {
        throw new Error("Missing PYTH_STATE_ID in environment variables");
      }

      // 1. Connect to Pyth price service
      const connection = new SuiPriceServiceConnection(
        "https://hermes-beta.pyth.network",
        { priceFeedRequestConfig: { binary: true } }
      );

      const priceIDs = assetIds?.length
        ? assetIds
        : [
            "0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266", 
          ];

      const priceUpdateData = await connection.getPriceFeedsUpdateData(priceIDs);

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

      if (!priceInfoObjectIds.length) {
        throw new Error("No price info object IDs returned from Pyth update");
      }

      const suiPriceObjectId = priceInfoObjectIds[0];
      updateTx.setGasBudget(50_000_000);

      const updateResult = await signAndExecuteTransaction({
        transaction: updateTx,
      });

      console.log("Pyth price update result:", updateResult);

      return { suiPriceObjectId, updateResult };
    },
    [signAndExecuteTransaction]
  );

  return { updatePythPrice };
}
