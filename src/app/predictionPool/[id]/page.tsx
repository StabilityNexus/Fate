/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, InfoIcon, RefreshCw } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useWallet } from "@suiet/wallet-kit";
import { useParams } from "next/navigation";
import TradingViewWidget from "@/components/TradingViewWidget";
import { useDistribute } from "@/fateHooks/useDistribute";
import { usePool } from "@/fateHooks/usePool";
import Footer from "@/components/layout/Footer";
import StickyCursor from "@/components/StickyCursor";
import AppLoader from "@/components/Loader";
import VaultSection from "@/components/Dashboard/VaultSection";
import { ASSET_CONFIG } from "@/config/assets";

export default function PredictionPoolDashboard() {
  const stickyRef = useRef<HTMLElement | null>(null);
  const { distribute } = useDistribute();
  const { theme } = useTheme();
  const params = useParams();
  const { account, connected } = useWallet();
  const { pool, userBalances, userAvgPrices, loading, error } = usePool(
    params?.id as string,
    account?.address as string
  );

  const [isDistributeLoading, setIsDistributeLoading] = useState(false);
  const [distributeError, setDistributeError] = useState("");

  const safeNumber = (num: any, fallback = 0) =>
    !isFinite(num) || isNaN(num) ? fallback : Number(num);

  const formatNumber = (n: number, decimals = 9) => {
    if (!isFinite(n) || isNaN(n)) return "0";
    const rounded = Number(n.toFixed(decimals));
    let s = rounded.toString();
    if (s.indexOf("e") !== -1) s = rounded.toFixed(decimals);
    if (s.indexOf(".") >= 0) s = s.replace(/\.?0+$/, "");
    return s;
  };

  const formatValue = (value: number) =>
    `${formatNumber(safeNumber(value) / 1e9, 3)} SUI`;

  const poolData = pool
    ? {
        id: pool.id?.id || "",
        name: pool.name || "Prediction Pool",
        description: pool.description || "A prediction market pool",
        asset_id: pool.asset_address || "",
        current_price: parseInt(pool.current_price) || 0,
        bull_reserve: parseInt(pool.bull_reserve) || 0,
        bear_reserve: parseInt(pool.bear_reserve) || 0,
        bull_supply: parseInt(pool.bull_token?.fields?.total_supply) || 0,
        bear_supply: parseInt(pool.bear_token?.fields?.total_supply) || 0,
        vault_creator_fee: parseInt(pool.pool_creator_fee) || 0,
        protocol_fee: parseInt(pool.stable_order_fee) || 0,
        mint_fee: parseInt(pool.mint_fee || pool.protocol_fee) || 0,
        burn_fee: parseInt(pool.burn_fee || pool.protocol_fee) || 0,
      }
    : {
        id: "",
        name: "Loading...",
        description: "Loading pool data...",
        asset_id: "",
        current_price: 0,
        bull_reserve: 0,
        bear_reserve: 0,
        bull_supply: 0,
        bear_supply: 0,
        vault_creator_fee: 0,
        protocol_fee: 0,
        mint_fee: 0,
        burn_fee: 0,
      };

  // Calculations
  const totalReserves = poolData.bull_reserve + poolData.bear_reserve;
  const bullPercentage =
    totalReserves > 0 ? (poolData.bull_reserve / totalReserves) * 100 : 50;
  const bearPercentage =
    totalReserves > 0 ? (poolData.bear_reserve / totalReserves) * 100 : 50;

  const bullPrice = safeNumber(
    poolData.bull_reserve / 1e9 / (poolData.bull_supply / 1e9),
    0
  );
  const bearPrice = safeNumber(
    poolData.bear_reserve / 1e9 / (poolData.bear_supply / 1e9),
    0
  );

  const userBullTokens = userBalances.bull_tokens / 1e9;
  const userBearTokens = userBalances.bear_tokens / 1e9;
  const userBullValue = userBullTokens * bullPrice;
  const userBearValue = userBearTokens * bearPrice;
  const asset = ASSET_CONFIG[poolData.asset_id];
  const userBullReturns = (() => {
    if (userBullTokens === 0 || userAvgPrices.bull_avg_price === 0) return 0;
    const cost = userBullTokens * userAvgPrices.bull_avg_price;
    console.log("UserBullReturns :" + (userBullValue - cost) / cost);
    return ((userBullValue - cost) / cost) * 100;
  })();

  const userBearReturns = (() => {
    if (userBearTokens === 0 || userAvgPrices.bear_avg_price === 0) return 0;
    const cost = userBearTokens * userAvgPrices.bear_avg_price;
    console.log("UserBearReturns :" + (userBearValue - cost) / cost);
    return ((userBearValue - cost) / cost) * 100;
  })();

  const handleDistribute = async () => {
    if (!pool) return;
    setIsDistributeLoading(true);
    setDistributeError("");
    try {
      await distribute({
        ...pool,
        id: pool.id?.id || "",
        pool_creator: pool.pool_creator || "",
        assetId: pool.asset_address || "",
      });
    } catch (err: any) {
      setDistributeError(err?.message || "Failed to distribute rewards");
    } finally {
      setIsDistributeLoading(false);
    }
  };

  if (loading)
    return (
      <AppLoader minDuration={700}>
        <></>
      </AppLoader>
    );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-white">
            Error Loading Pool
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <AppLoader minDuration={700}>
      <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
        <Navbar />
        <StickyCursor stickyRef={stickyRef} />

        <div className="container mx-auto px-5 py-4">
          {distributeError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 font-medium">
              {distributeError}
            </div>
          )}

          {/* Pool Info */}
          <div className="border border-neutral-300 dark:border-neutral-600 rounded-lg p-3 bg-white dark:bg-neutral-900 mb-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 p-1">
                <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">
                  {poolData.name}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-2">
                  {poolData.description}
                </p>

                <div className="flex items-center space-x-2">
                  {/* Price */}
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Price: {asset?.name || ""}
                  </span>

                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    |
                  </span>

                  {/* Fees with tooltip */}
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 flex items-center space-x-1">
                    <span>Fees</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="w-4 h-4 text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 cursor-pointer transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          <div className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-2 rounded-xl shadow-lg text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="font-medium">Creator Fee:</span>
                              <span>{poolData.vault_creator_fee}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Protocol Fee:</span>
                              <span>{poolData.protocol_fee}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Mint Fee:</span>
                              <span>{poolData.mint_fee}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Burn Fee:</span>
                              <span>{poolData.burn_fee}%</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
              </div>
              <div className="lg:min-w-[300px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3 justify-center items-center flex flex-col">
                    <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Total Value Locked
                    </div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-white">
                      {formatValue(totalReserves)}
                    </div>

                    {/* Pool Ratio Bar */}
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 my-2 flex overflow-hidden">
                      <div
                        className="bg-green-500 h-2"
                        style={{ width: `${bullPercentage}%` }}
                      ></div>
                      <div
                        className="bg-red-500 h-2"
                        style={{ width: `${bearPercentage}%` }}
                      ></div>
                    </div>

                    {/* Bull/Bear Text */}
                    <div className="flex justify-between w-full text-xs font-medium">
                      <span className="text-green-600 dark:text-green-400">
                        {bullPercentage.toFixed(1)}% Bull
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        {bearPercentage.toFixed(1)}% Bear
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16">
            {/* Bull Vault */}
            <VaultSection
              isBull={true}
              poolData={poolData}
              userTokens={userBullTokens}
              price={bullPrice}
              value={userBullValue}
              returns={userBullReturns}
              symbol={pool?.bull_token?.fields?.symbol || "BULL"}
              connected={connected}
            />

            {/* Chart */}
            <div className="lg:col-span-2">
              <div className="border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 shadow-sm">
                <div className="p-6">
                  <TradingViewWidget
                    assetId={poolData.asset_id}
                    theme={theme === "dark" ? "dark" : "light"}
                    heightPx={453}
                    showHeader={true}
                  />

                  {/* Rebalance Section */}
                  <div className="mt-6 p-6 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                    <h4 className="font-bold mb-3 text-lg text-neutral-900 dark:text-white">
                      Rebalance Pool
                    </h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                      Fetch current oracle price and move funds from the losing
                      vault to the winning vault.
                    </p>
                    <div className="text-sm space-y-2 mb-4 bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-600">
                      {/* <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Current price:
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white">
                          1 BTC = 120,000 USD
                        </span>
                      </div> */}
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          Price at last rebalance:
                        </span>
                        <span
                          className="font-bold dark:text-white"
                          style={{ color: asset?.color || "#000" }}
                        >
                          1 {asset?.name.split("/")[0] || "?"} ={" "}
                          {(poolData.current_price / 10000).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 8,
                            }
                          )}{" "}
                          {asset?.name.split("/")[1] || "USD"}
                        </span>
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button
                              className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold py-3 transition-all duration-200 shadow-lg hover:shadow-xl"
                              onClick={handleDistribute}
                              disabled={
                                account?.address !== pool?.pool_creator ||
                                isDistributeLoading
                              }
                            >
                              {isDistributeLoading && (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                              )}
                              Rebalance Pool
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {account?.address !== pool?.pool_creator && (
                          <TooltipContent>
                            <p className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 p-2 rounded-md text-sm">
                              This action can only be performed by the pool
                              creator
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>

            {/* Bear Vault */}
            <VaultSection
              isBull={false}
              poolData={poolData}
              userTokens={userBearTokens}
              price={bearPrice}
              value={userBearValue}
              returns={userBearReturns}
              symbol={pool?.bear_token?.fields?.symbol || "BEAR"}
              connected={connected}
            />
          </div>
        </div>

        <Footer />
      </div>
    </AppLoader>
  );
}
