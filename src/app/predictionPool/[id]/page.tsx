/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Coins,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useWallet } from "@suiet/wallet-kit";
import { useParams } from "next/navigation";
import TradingViewWidget from "@/components/TradingViewWidget";
import { useBuyTokens } from "@/fateHooks/useBuyTokens";
import { useSellTokens } from "@/fateHooks/useSellTokens";
import { useDistribute } from "@/fateHooks/useDistribute";
import { usePool } from "@/fateHooks/usePool";
import Footer from "@/components/layout/Footer";
import { UserData } from "@/types/User";

interface PoolData {
  id: string;
  name: string;
  description: string;
  asset_id: string;
  current_price: number;
  bull_reserve: number;
  bear_reserve: number;
  bull_supply: number;
  bear_supply: number;
  bull_price: number;
  bear_price: number;
  vault_creator_fee: number;
  treasury_fee: number;
}

export default function PredictionPoolDashboard() {
  const { buyTokens } = useBuyTokens();
  const { sellTokens } = useSellTokens();
  const { distribute } = useDistribute();
  const { theme } = useTheme();
  const params = useParams();
  const { account, connected } = useWallet();
  const { pool, userBalances, loading, error } = usePool(
    params?.id as string,
    account?.address as string
  );
  const [activeVault, setActiveVault] = useState("bull");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState("");

  const poolData: PoolData = pool
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
        bull_price:
          parseInt(pool.bull_reserve) /
          parseInt(pool.bull_token?.fields?.total_supply || "1"),
        bear_price:
          parseInt(pool.bear_reserve) /
          parseInt(pool.bear_token?.fields?.total_supply || "1"),
        vault_creator_fee: parseInt(pool.pool_creator_fee) || 0,
        treasury_fee: parseInt(pool.protocol_fee) || 0,
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
        bull_price: 0,
        bear_price: 0,
        vault_creator_fee: 0,
        treasury_fee: 0,
      };
  const [userData, setUserData] = useState<UserData>({} as UserData);

  useEffect(() => {
    setUserData(userBalances);
  }, [userBalances]);

  const bullReserve = poolData.bull_reserve;
  const bearReserve = poolData.bear_reserve;
  const totalReserves = bullReserve + bearReserve;
  const bullPercentage =
    totalReserves > 0 ? (bullReserve / totalReserves) * 100 : 50;
  const bearPercentage =
    totalReserves > 0 ? (bearReserve / totalReserves) * 100 : 50;

  const fees = {
    entry: poolData.vault_creator_fee,
    exit: poolData.vault_creator_fee,
    performance: poolData.treasury_fee,
  };

  const tokens = pool
    ? {
        bullToken: {
          id: pool.bull_token?.fields?.id?.id || "",
          name: pool.bull_token?.fields?.name || "Bull Token",
          symbol: pool.bull_token?.fields?.symbol || "BULL",
          balance: 0,
          price:
            bullReserve /
            parseInt(pool.bull_token?.fields?.total_supply || "1"),
          pool_creator: pool.pool_creator || "",
          pool_fee: 0,
          pool_creator_fee: parseInt(pool.pool_creator_fee) || 0,
          treasury_fee: parseInt(pool.protocol_fee) || 0,
          asset_balance: bullReserve,
          supply: parseInt(pool.bull_token?.fields?.total_supply || "0"),
          prediction_pool: pool.id?.id || "",
          other_token: pool.bear_token?.fields?.id?.id || "",
        },
        bearToken: {
          id: pool.bear_token?.fields?.id?.id || "",
          name: pool.bear_token?.fields?.name || "Bear Token",
          symbol: pool.bear_token?.fields?.symbol || "BEAR",
          balance: 0,
          price:
            bearReserve /
            parseInt(pool.bear_token?.fields?.total_supply || "1"),
          pool_creator: pool.pool_creator || "",
          pool_fee: 0,
          pool_creator_fee: parseInt(pool.pool_creator_fee) || 0,
          treasury_fee: parseInt(pool.protocol_fee) || 0,
          asset_balance: bearReserve,
          supply: parseInt(pool.bear_token?.fields?.total_supply || "0"),
          prediction_pool: pool.id?.id || "",
          other_token: pool.bull_token?.fields?.id?.id || "",
        },
      }
    : null;

  const vault = pool
    ? {
        id: pool.id?.id || "",
        asset_id: pool.asset_address || "",
        bullToken: tokens?.bullToken || null,
        bearToken: tokens?.bearToken || null,
        bullPercentage,
        bearPercentage,
        totalValue: totalReserves,
        fees,
        previous_price: parseInt(pool.current_price) || 0,
        pool_creator: pool.pool_creator || "",
      }
    : null;

  const formatTokens = (amount: number) => {
    return safeNumber((amount / 1000000000).toFixed(9), 0);
  };

  const formatValue = (value: number) => {
    return `$${safeNumber(value / 1000000000, 0).toFixed(9)}`;
  };

  const handleBuyBull = async () => {
    if (!buyAmount || !vault) return;
    setIsLoading(true);
    setTransactionError("");
    try {
      await buyTokens({
        amount: parseFloat(buyAmount),
        isBull: true,
        vaultId: vault.id,
        assetId: pool?.asset_address || "",
      });
      setBuyAmount("");
    } catch (err) {
      setTransactionError("Failed to buy bull tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyBear = async () => {
    if (!buyAmount || !vault) return;
    setIsLoading(true);
    setTransactionError("");
    try {
      await buyTokens({
        amount: parseFloat(buyAmount),
        isBull: false,
        vaultId: vault.id,
        assetId: pool?.asset_address || "",
      });
      setBuyAmount("");
    } catch (err) {
      setTransactionError("Failed to buy bear tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellBull = async () => {
    if (!sellAmount || !vault) return;
    setIsLoading(true);
    setTransactionError("");
    try {
      await sellTokens({
        amount: parseFloat(sellAmount),
        isBull: true,
        vaultId: vault.id,
        assetId: pool?.asset_address || "",
      });
      setSellAmount("");
    } catch (err) {
      setTransactionError("Failed to sell bull tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellBear = async () => {
    if (!sellAmount || !vault) return;
    setIsLoading(true);
    setTransactionError("");
    try {
      await sellTokens({
        amount: parseFloat(sellAmount),
        isBull: false,
        vaultId: vault.id,
        assetId: pool?.asset_address || "",
      });
      setSellAmount("");
    } catch (err) {
      setTransactionError("Failed to sell bear tokens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistribute = async () => {
    if (!pool) return;
    setIsLoading(true);
    setTransactionError("");
    try {
      await distribute({
        ...pool,
        id: pool.id?.id || "",
        pool_creator: pool.pool_creator || "",
        assetId: pool.asset_address || "",
      });
    } catch (err) {
      setTransactionError("Failed to distribute rewards");
    } finally {
      setIsLoading(false);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeNumber = (num: any, fallback = 1) =>
    !isFinite(num) || isNaN(num) ? fallback : num;

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 dark:bg-gray-900 dark:text-white bg-gray-50 text-gray-900`}
      >
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading pool data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 dark:bg-gray-900 dark:text-white" : "bg-gray-50 text-gray-900"
        `}
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Pool</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 dark:bg-gray-900 dark:text-white bg-gray-50 text-gray-900
      }`}
    >
      <Navbar />

      <div className="container mx-auto px-6 py-8">
        {transactionError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {transactionError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Chart and Pool Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {poolData.name}
                  </h3>
                  <Separator className="bg-gray-200 dark:bg-gray-700" />

                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {poolData.description}
                  </p>
                  <div className="mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Previous On-Chain Price :
                    </span>
                    <span className="ml-2 font-semibold">
                      $
                      {(poolData.current_price / 10000).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 8,
                          maximumFractionDigits: 8,
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Price Chart */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-full h-[500px] p-0">
                <TradingViewWidget
                  assetId={poolData.asset_id}
                  theme={theme === "dark" ? "dark" : "light"}
                  height="500px"
                  width="100%"
                  showHeader={true}
                  className="h-full"
                />
              </div>
            </div>

            {/* Pool Details */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-2 mb-6">
                <Coins className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Pool Details</h2>
              </div>

              <div className="space-y-3">
                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Bull Reserve
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {(poolData.bull_reserve / 1000000000).toFixed(9)} SUI
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Bear Reserve
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {(poolData.bear_reserve / 1000000000).toFixed(9)} SUI
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Bull Supply
                      </span>
                      <span className="font-semibold">
                        {(poolData.bull_supply / 1000000000).toFixed(9)}{" "}
                        {pool?.bull_token?.fields?.symbol || "BULL"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Bear Supply
                      </span>
                      <span className="font-semibold">
                        {(poolData.bear_supply / 1000000000).toFixed(9)}{" "}
                        {pool?.bear_token?.fields?.symbol || "BEAR"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Bull Price
                      </span>
                      <span className="font-semibold text-green-600">
                        {safeNumber(
                          poolData.bull_reserve /
                            1e9 /
                            (poolData.bull_supply / 1e9)
                        ).toFixed(9)}{" "}
                        SUI
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Bear Price
                      </span>
                      <span className="font-semibold text-red-600">
                        {safeNumber(
                          poolData.bear_reserve /
                            1e9 /
                            (poolData.bear_supply / 1e9)
                        ).toFixed(9)}{" "}
                        SUI
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Creator Fee
                      </span>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {poolData.vault_creator_fee}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Treasury Fee
                      </span>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {poolData.treasury_fee}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Trading and Stats */}
          <div className="space-y-6">
            {/* Prediction Vaults Trading */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-2 mb-4">
                <h2 className="text-xl font-semibold">Prediction Vaults</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Buy and sell prediction tokens
              </p>

              <Tabs
                value={activeVault}
                onValueChange={setActiveVault}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
                  <TabsTrigger
                    value="bull"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Bull Vault
                  </TabsTrigger>
                  <TabsTrigger
                    value="bear"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Bear Vault
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bull" className="space-y-6 mt-6">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Your Bull Tokens
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {(userData.bull_tokens / 1e9).toFixed(9)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Estimated Price
                        </span>
                        <span className="text-lg font-bold">
                          {safeNumber(
                            poolData.bull_reserve /
                              1e9 /
                              (poolData.bull_supply / 1e9)
                          ).toFixed(9)}{" "}
                          SUI
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Value</span>
                        <span className="text-lg font-bold text-green-600">
                          {safeNumber(
                            (userData.bull_tokens / 1e9) *
                              (poolData.bull_reserve /
                                1e9 /
                                (poolData.bull_supply / 1e9),
                              0)
                          ).toFixed(9)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Buy Amount (SUI)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleBuyBull}
                      disabled={isLoading || !buyAmount || !connected}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Buy Bull Tokens
                    </Button>
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-700" />

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Sell Amount (Tokens)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter token amount"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={handleSellBull}
                      disabled={isLoading || !sellAmount || !connected}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Sell Bull Tokens
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="bear" className="space-y-6 mt-6">
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Your Bear Tokens
                        </span>
                        <span className="text-lg font-bold text-red-600">
                          {(userData.bear_tokens / 1e9).toFixed(9)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Estimated Price
                        </span>
                        <span className="text-lg font-bold">
                          {safeNumber(
                            poolData.bear_reserve /
                              1e9 /
                              (poolData.bear_supply / 1e9)
                          ).toFixed(9)}{" "}
                          SUI
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Value</span>
                        <span className="text-lg font-bold text-red-600">
                          {safeNumber(
                            (userData.bear_tokens / 1e9) *
                              (poolData.bear_reserve /
                                1e9 /
                                (poolData.bear_supply / 1e9)),
                            0
                          ).toFixed(9)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Buy Amount (SUI)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleBuyBear}
                      disabled={isLoading || !buyAmount || !connected}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Buy Bear Tokens
                    </Button>
                  </div>

                  <Separator className="bg-gray-200 dark:bg-gray-700" />

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Sell Amount (Tokens)
                      </label>
                      <Input
                        type="number"
                        placeholder="Enter token amount"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={handleSellBear}
                      disabled={isLoading || !sellAmount || !connected}
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Sell Bear Tokens
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Settle Outcome */}
           {pool?.pool_creator === account?.address ? <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
              <h3 className="font-semibold mb-2">Settle Prediction Outcome</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Distribute rewards based on the outcome.
              </p>
              <Button
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={handleDistribute}
                disabled={isLoading || !connected}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Settle Outcome
              </Button>
            </div>: null}

            {/* Pool Statistics */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-2 mb-6">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Pool Statistics</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Pool Value
                  </span>
                  <span className="font-bold text-blue-600">
                    {formatValue(poolData.bull_reserve + poolData.bear_reserve)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Supply
                  </span>
                  <span className="font-bold">
                    {formatTokens(poolData.bull_supply + poolData.bear_supply)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Pool Ratio
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {bullPercentage.toFixed(1)}% Bull
                    </Badge>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {bearPercentage.toFixed(1)}% Bear
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Price
                  </span>
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {poolData.asset_id.slice(0, 10)}...
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Your Portfolio Value
                  </span>
                  <span className="font-bold text-blue-600">
                    {safeNumber(
                      (userData.bull_tokens / 1e9) *
                        (poolData.bull_reserve /
                          1e9 /
                          (poolData.bull_supply / 1e9)) +
                        (userData.bear_tokens / 1e9) *
                          (poolData.bear_reserve /
                            1e9 /
                            (poolData.bear_supply / 1e9)),
                      0
                    ).toFixed(9)}{" "}
                    SUI
                  </span>
                </div>

                {!connected && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Connect your wallet to trade tokens
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
