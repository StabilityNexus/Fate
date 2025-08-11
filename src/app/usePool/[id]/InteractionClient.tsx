/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { useBuyTokens } from "@/fateHooks/useBuyTokens";
import { useSellTokens } from "@/fateHooks/useSellTokens";
import { useDistribute } from "@/fateHooks/useDistribute";

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
  const { buyTokens } = useBuyTokens();
  const { sellTokens } = useSellTokens();
  const { distribute } = useDistribute();

  const [bullAmount, setBullAmount] = useState<number>();
  const [bearAmount, setBearAmount] = useState<number>();
  const bullValue = tokens.bullToken.price * tokens.bullToken.balance;
  const bearValue = tokens.bearToken.price * tokens.bearToken.balance;
  const totalValue = bullValue + bearValue;


  const handleBuyBull = (amount: number) => {
    buyTokens({
      amount,
      isBull: true,
      vaultId: vault.id,
      assetId:
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
    });
  };

  const handleBuyBear = (amount: number) => {
    buyTokens({
      amount,
      isBull: false,
      vaultId: vault.id,
      assetId:
        "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b",
    });
  };

  const handleSellBull = (amount: number) => {
    sellTokens({
      amount,
      isBull: true,
      vaultId: vault.id,
      assetId: "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b"
    });
  };

  const handleSellBear = (amount: number) => {
    sellTokens({
      amount,
      isBull: false,
      vaultId: vault.id,
      assetId: "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b"
    });
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
                onClick={() =>
                  distribute({
                    ...vault,
                    pool_creator: vault.vault_creator,
                    assetId: vault.asset_id,
                  })
                }
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
