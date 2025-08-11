/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@suiet/wallet-kit";
import {
  SuiPriceServiceConnection,
  SuiPythClient,
} from "@pythnetwork/pyth-sui-js";
import { SuiClient } from "@mysten/sui/client";

interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  price: number;
  vault_creator: string;
  vault_fee: number;
  vault_creator_fee: number;
  treasury_fee: number;
  asset_balance: number;
  supply: number;
  prediction_pool: string;
  other_token: string;
}

interface Vault {
  id: string;
  asset_id: string;
  bullToken: Token;
  bearToken: Token;
  bullPercentage: number;
  bearPercentage: number;
  totalValue: number;
  previous_price: number;
  vault_creator: string;
  fees: {
    entry: number;
    exit: number;
    performance: number;
  };
}

interface DualTokenVaultProps {
  tokens: {
    bullToken: Token;
    bearToken: Token;
  };
  vault: Vault;
}

export default function DualTokenVault({ tokens, vault }: DualTokenVaultProps) {
  const [bullAmount, setBullAmount] = useState<number>();
  const [bearAmount, setBearAmount] = useState<number>();
  const bullValue = tokens.bullToken.price * tokens.bullToken.balance;
  const bearValue = tokens.bearToken.price * tokens.bearToken.balance;
  const totalValue = bullValue + bearValue;

  const { account, signAndExecuteTransaction } = useWallet();
  const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

  async function updatePythPrice(assetIds?: string[]) {
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
          "0x50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266", // default price ID
        ];

    // 2. Get update data for price feeds
    const priceUpdateData = await connection.getPriceFeedsUpdateData(priceIDs);

    // 3. Set up Sui client and Pyth client
    const suiClient = new SuiClient({
      url: "https://fullnode.testnet.sui.io:443",
    });

    const pythClient = new SuiPythClient(
      suiClient,
      PYTH_STATE_ID,
      WORMHOLE_STATE_ID
    );

    // 4. Build transaction for updating price feeds
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

    // 5. Sign & execute transaction
    const updateResult = await signAndExecuteTransaction({
      transaction: updateTx,
    });

    console.log("Pyth price update result:", updateResult);

    return {
      suiPriceObjectId,
      updateResult,
    };
  }

  const handleBuyBull = async (amount: number) => {
    if (!amount || amount <= 0 || !account?.address) {
      alert("Please enter a valid amount and connect your wallet");
      return;
    }

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const CLOCK_ID =
      "0x0000000000000000000000000000000000000000000000000000000000000006";

    if (!PACKAGE_ID) {
      alert("Missing PACKAGE_ID in environment variables");
      return;
    }

    try {
      console.log("Starting bull token purchase...", {
        amount,
        vault: vault.id,
      });

      const assetId =
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b";
      const amountInMist = BigInt(amount * 1_000_000_000);

      const suiClient = new SuiClient({
        url: "https://fullnode.testnet.sui.io:443",
      });

      // Check balance
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });

      const totalBalance = coins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        0n
      );
      if (totalBalance < amountInMist + BigInt(200_000_000)) {
        throw new Error(
          `Insufficient balance. Required: ${amountInMist.toString()}, Available: ${totalBalance.toString()}`
        );
      }

      // Step 1: Update Pyth price using reusable function
      const { suiPriceObjectId, updateResult } = await updatePythPrice([
        assetId,
      ]);

      // Step 2: Purchase bull token
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::purchase_token`,
        arguments: [
          tx.object(vault.id),
          tx.pure.bool(true), // true for bull token
          tx.object(suiPriceObjectId),
          tx.object(CLOCK_ID),
          tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]),
        ],
      });

      tx.setGasBudget(100_000_000);
      console.log("Executing purchase transaction...");
      const result = await signAndExecuteTransaction({ transaction: tx });

      console.log("Transaction result:", result);

      alert("Bull token purchase successful!");
      window.location.reload();
    } catch (error: any) {
      console.error("Buy bull failed:", error);

      let errorMessage = "Unknown error occurred";
      if (error.message?.includes("InsufficientGas")) {
        errorMessage =
          "Transaction failed: Insufficient gas. Please try again with a higher gas budget.";
      } else if (error.message?.includes("InsufficientBalance")) {
        errorMessage = "Insufficient SUI balance for this transaction.";
      } else if (error.message?.includes("price")) {
        errorMessage =
          "Transaction failed: Price feed error. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Bull token purchase failed: ${errorMessage}`);
    }
  };

  const handleBuyBear = async (amount: number) => {
    if (!amount || amount <= 0 || !account?.address) {
      alert("Please enter a valid amount and connect your wallet");
      return;
    }

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const CLOCK_ID =
      "0x0000000000000000000000000000000000000000000000000000000000000006";

    if (!PACKAGE_ID) {
      alert("Missing PACKAGE_ID in environment variables");
      return;
    }

    try {
      console.log("Starting bull token purchase...", {
        amount,
        vault: vault.id,
      });

      const assetId =
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b";
      const amountInMist = BigInt(amount * 1_000_000_000);

      const suiClient = new SuiClient({
        url: "https://fullnode.testnet.sui.io:443",
      });

      // Check balance
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });

      const totalBalance = coins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        0n
      );
      if (totalBalance < amountInMist + BigInt(200_000_000)) {
        throw new Error(
          `Insufficient balance. Required: ${amountInMist.toString()}, Available: ${totalBalance.toString()}`
        );
      }

      // Step 1: Update Pyth price using reusable function
      const { suiPriceObjectId } = await updatePythPrice([assetId]);

      // Step 2: Purchase bull token
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::purchase_token`,
        arguments: [
          tx.object(vault.id),
          tx.pure.bool(false), // false for bear token
          tx.object(suiPriceObjectId),
          tx.object(CLOCK_ID),
          tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]),
        ],
      });

      tx.setGasBudget(100_000_000);
      console.log("Executing purchase transaction...");
      const result = await signAndExecuteTransaction({ transaction: tx });

      console.log("Transaction result:", result);

      alert("Bull token purchase successful!");
      window.location.reload();
    } catch (error: any) {
      console.error("Buy bull failed:", error);

      let errorMessage = "Unknown error occurred";
      if (error.message?.includes("InsufficientGas")) {
        errorMessage =
          "Transaction failed: Insufficient gas. Please try again with a higher gas budget.";
      } else if (error.message?.includes("InsufficientBalance")) {
        errorMessage = "Insufficient SUI balance for this transaction.";
      } else if (error.message?.includes("price")) {
        errorMessage =
          "Transaction failed: Price feed error. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Bull token purchase failed: ${errorMessage}`);
    }
  };

  const handleSellBull = async (amount: number) => {
    if (!amount || amount <= 0 || !account?.address) {
      alert("Please enter a valid amount and connect your wallet");
      return;
    }

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const CLOCK_ID =
      "0x0000000000000000000000000000000000000000000000000000000000000006";

    if (!PACKAGE_ID) {
      alert("Missing PACKAGE_ID in environment variables");
      return;
    }

    try {
      console.log("Starting bull token sale...", {
        amount,
        vault: vault.id,
      });

      const assetId =
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b";

      // Convert amount to token units (assuming same precision as your buy function)
      const tokenAmount = BigInt(Math.floor(amount * 1_000_000_000));

      const suiClient = new SuiClient({
        url: "https://fullnode.testnet.sui.io:443",
      });

      // Optional: Check if user has enough tokens to sell
      // You might want to implement token balance checking here similar to SUI balance check in buy function

      // Step 1: Update Pyth price using the same reusable function
      const { suiPriceObjectId, updateResult } = await updatePythPrice([
        assetId,
      ]);

      // Step 2: Sell bull token
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::redeem_token`,
        arguments: [
          tx.object(vault.id),
          tx.pure.bool(true), // true for bull token
          tx.pure.u64(tokenAmount),
          tx.object(suiPriceObjectId), // Required price_info_object
          tx.object(CLOCK_ID), // Required clock
        ],
      });

      tx.setGasBudget(100_000_000);
      console.log("Executing sell transaction...");
      const result = await signAndExecuteTransaction({ transaction: tx });

      console.log("Transaction result:", result);

      alert("Bull token sale successful!");
      window.location.reload();
    } catch (error: any) {
      console.error("Sell bull failed:", error);

      let errorMessage = "Unknown error occurred";
      if (error.message?.includes("InsufficientGas")) {
        errorMessage =
          "Transaction failed: Insufficient gas. Please try again with a higher gas budget.";
      } else if (error.message?.includes("InsufficientBalance")) {
        errorMessage = "Insufficient token balance for this transaction.";
      } else if (error.message?.includes("price")) {
        errorMessage =
          "Transaction failed: Price feed error. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Bull token sale failed: ${errorMessage}`);
    }
  };

  // Similarly, here's the bear token sell function
  const handleSellBear = async (amount: number) => {
    if (!amount || amount <= 0 || !account?.address) {
      alert("Please enter a valid amount and connect your wallet");
      return;
    }

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const CLOCK_ID =
      "0x0000000000000000000000000000000000000000000000000000000000000006";

    if (!PACKAGE_ID) {
      alert("Missing PACKAGE_ID in environment variables");
      return;
    }

    try {
      console.log("Starting bear token sale...", {
        amount,
        vault: vault.id,
      });

      const assetId =
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b";
      const tokenAmount = BigInt(Math.floor(amount * 1_000_000_000));

      const suiClient = new SuiClient({
        url: "https://fullnode.testnet.sui.io:443",
      });

      // Step 1: Update Pyth price
      const { suiPriceObjectId, updateResult } = await updatePythPrice([
        assetId,
      ]);

      // Step 2: Sell bear token
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::redeem_token`,
        arguments: [
          tx.object(vault.id),
          tx.pure.bool(false), // false for bear token
          tx.pure.u64(tokenAmount),
          tx.object(suiPriceObjectId),
          tx.object(CLOCK_ID),
        ],
      });

      tx.setGasBudget(100_000_000);
      console.log("Executing sell transaction...");
      const result = await signAndExecuteTransaction({ transaction: tx });

      console.log("Transaction result:", result);

      alert("Bear token sale successful!");
      window.location.reload();
    } catch (error: any) {
      console.error("Sell bear failed:", error);

      let errorMessage = "Unknown error occurred";
      if (error.message?.includes("InsufficientGas")) {
        errorMessage =
          "Transaction failed: Insufficient gas. Please try again with a higher gas budget.";
      } else if (error.message?.includes("InsufficientBalance")) {
        errorMessage = "Insufficient token balance for this transaction.";
      } else if (error.message?.includes("price")) {
        errorMessage =
          "Transaction failed: Price feed error. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Bear token sale failed: ${errorMessage}`);
    }
  };

  const handleDistribute = async () => {
    if (!account?.address) {
      alert("Please connect your wallet");
      return;
    }

    const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
    const CLOCK_ID =
      "0x0000000000000000000000000000000000000000000000000000000000000006";

    if (!PACKAGE_ID) {
      alert("Missing PACKAGE_ID in environment variables");
      return;
    }

    // // Check if user is the vault creator
    // if (account.address !== vault.vault_creator) {
    //   alert("Only the vault creator can settle outcomes : " + JSON.stringify(vault));
    //   return;
    // }

    try {
      console.log("Starting outcome settlement...", {
        vault: vault.id,
        creator: vault.vault_creator,
      });

      const assetId =
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b";

      const suiClient = new SuiClient({
        url: "https://fullnode.testnet.sui.io:443",
      });

      // Check balance for gas
      const coins = await suiClient.getCoins({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });

      const totalBalance = coins.data.reduce(
        (sum, coin) => sum + BigInt(coin.balance),
        0n
      );
      if (totalBalance < BigInt(200_000_000)) {
        throw new Error(
          `Insufficient balance for gas. Required: 200000000, Available: ${totalBalance.toString()}`
        );
      }

      // Step 1: Update Pyth price using reusable function
      const { suiPriceObjectId } = await updatePythPrice([assetId]);

      console.log("Price updated, settling outcome...");

      // Step 2: Settle outcome
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::settle_outcome_entry`,
        arguments: [
          tx.object(vault.id), // The prediction pool object
          tx.object(suiPriceObjectId), // Pyth price info object
          tx.object(CLOCK_ID), // Clock object
        ],
      });

      tx.setGasBudget(100_000_000);

      console.log("Executing settlement transaction...");
      const result = await signAndExecuteTransaction({ transaction: tx });

      console.log("Settlement result:", result);
      alert("Outcome settlement successful!");
      window.location.reload();
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

      alert(`Outcome settlement failed: ${errorMessage}`);
    }
  };

  return (
    <div className="w-full pt-14 bg-white dark:bg-black">
      <div className="w-full md:px-24 lg:px-24">
        <div className="container mx-auto px-8 py-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Coins className="h-8 w-8 text-black dark:text-white" />
            <h1 className="text-3xl font-bold text-black dark:text-white">
              {tokens.bullToken.name} / {tokens.bearToken.name} Vault
            </h1>
          </div>

          <div className="flex space-x-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-5 py-3 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                {tokens.bullToken.name} Balance
              </div>
              <div className="font-mono text-lg text-black dark:text-white">
                {tokens.bullToken.balance.toFixed(2)} {tokens.bullToken.symbol}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  $
                  {(tokens.bullToken.price * tokens.bullToken.balance).toFixed(
                    2
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-5 py-3 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                {tokens.bearToken.name} Balance
              </div>
              <div className="font-mono text-lg text-black dark:text-white">
                {tokens.bearToken.balance.toFixed(2)} {tokens.bearToken.symbol}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  $
                  {(tokens.bearToken.price * tokens.bearToken.balance).toFixed(
                    2
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-8 py-6 space-y-8">
          <section className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              Vault Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Market Position
                </h3>
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black dark:bg-white"
                    style={{ width: `${vault.bullPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{vault.bullPercentage.toFixed(2)}% Bull</span>
                  <span>{vault.bearPercentage.toFixed(2)}% Bear</span>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Total Value
                </h3>
                <p className="text-2xl font-mono text-black dark:text-white">
                  $
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Current Price: $
                  {(vault.previous_price / 1_000_000_000).toFixed(4)}
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Token Prices
                </h3>
                <div className="space-y-2">
                  <p className="text-black dark:text-white">
                    {tokens.bullToken.symbol}: $
                    {tokens.bullToken.price.toFixed(4)}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      Supply: {tokens.bullToken.supply.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-black dark:text-white">
                    {tokens.bearToken.symbol}: $
                    {tokens.bearToken.price.toFixed(4)}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      Supply: {tokens.bearToken.supply.toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-900 shadow-lg">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-6 text-center">
              Vault Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bear Pool Card */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    Bear Pool
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={bearAmount || ""}
                        onChange={(e) => setBearAmount(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                        SUI
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        bearAmount !== undefined && handleBuyBear(bearAmount)
                      }
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!bearAmount || bearAmount <= 0}
                    >
                      <span className="font-medium">Buy Bear</span>
                    </button>
                    <button
                      onClick={() =>
                        bearAmount !== undefined && handleSellBear(bearAmount)
                      }
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!bearAmount || bearAmount <= 0}
                    >
                      <span className="font-medium">Sell Bear</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bull Pool Card */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <h3 className="text-lg font-semibold text-black dark:text-white">
                    Bull Pool
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={bullAmount || ""}
                        onChange={(e) => setBullAmount(Number(e.target.value))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                      <span className="absolute right-3 top-3 text-gray-400 dark:text-gray-500">
                        SUI
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() =>
                        bullAmount !== undefined && handleBuyBull(bullAmount)
                      }
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!bullAmount || bullAmount <= 0}
                    >
                      <span className="font-medium">Buy Bull</span>
                    </button>
                    <button
                      onClick={() =>
                        bullAmount !== undefined && handleSellBull(bullAmount)
                      }
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!bullAmount || bullAmount <= 0}
                    >
                      <span className="font-medium">Sell Bull</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Settle Outcome Button - Only show for vault creator */}

            <div className="mt-8 flex justify-center">
              <button
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center"
                onClick={handleDistribute}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Settle Outcome
              </button>
            </div>
          </section>

          <section className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              Vault Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Fees
                </h3>
                <div className="space-y-2 text-black dark:text-white">
                  <p>Vault Creator Fee: {vault.fees.entry}%</p>
                  <p>Treasury Fee: {vault.fees.performance}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Fees are applied on transactions
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  Pool Info
                </h3>
                <div className="space-y-2 text-black dark:text-white">
                  <p>
                    <span className="font-medium">Pool ID:</span>
                    <span className="text-sm font-mono block truncate">
                      {vault.id}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Bull Reserve:</span>{" "}
                    {tokens.bullToken.asset_balance.toLocaleString()} SUI
                  </p>
                  <p>
                    <span className="font-medium">Bear Reserve:</span>{" "}
                    {tokens.bearToken.asset_balance.toLocaleString()} SUI
                  </p>
                  <p>
                    <span className="font-medium">Vault Creator:</span>
                    <span className="text-sm font-mono block truncate">
                      {vault.vault_creator}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                  About This Pool
                </h3>
                <p className="text-black dark:text-white text-sm">
                  This prediction pool allows you to take positions on asset
                  price movements. Bull tokens gain value when the asset price
                  increases, while Bear tokens gain value when the price
                  decreases. The pool uses Pyth oracles for price feeds and
                  automatically rebalances based on price changes.
                </p>
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    Current Price: $
                    {(vault.previous_price / 1_000_000_000).toFixed(6)}
                  </p>
                  <p>Total Pool Value: ${vault.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
