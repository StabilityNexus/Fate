"use client";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import { SuiClient } from "@mysten/sui/client";
import { Transaction, TransactionObjectInput } from "@mysten/sui/transactions";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const suiClient = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

export default function PredictionPoolDashboard() {
  const { account, connected } = useWallet();
  const params = useParams();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeVault, setActiveVault] = useState("bull");
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [poolData, setPoolData] = useState({
    name: "",
    description: "",
    asset_id: "",
    current_price: 0,
    bull_reserve: 0,
    bear_reserve: 0,
    bull_supply: 0,
    bear_supply: 0,
    vault_creator_fee: 0,
    treasury_fee: 0,
    bull_price: 0,
    bear_price: 0,
  });

  // User data from smart contract
  const [userData, setUserData] = useState({
    bull_tokens: 0,
    bear_tokens: 0,
    bull_value: 0,
    bear_value: 0,
  });

  // Helper function to safely parse numeric values from Sui responses
  const parseNumericValue = (value) => {
    if (value === null || value === undefined) {
      return 0;
    }

    // Handle string numbers
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }

    // Handle number type
    if (typeof value === "number") {
      return isNaN(value) ? 0 : value;
    }

    // Handle array format that Sui sometimes returns
    if (Array.isArray(value) && value.length > 0) {
      return parseNumericValue(value[0]);
    }

    // Handle object format with nested values
    if (typeof value === "object" && value !== null) {
      if ("value" in value) {
        return parseNumericValue(value.value);
      }
      if ("fields" in value && value.fields) {
        if ("value" in value.fields) {
          return parseNumericValue(value.fields.value);
        }
      }
    }

    return 0;
  };

  const loadPoolData = async (id: string[] | TransactionObjectInput) => {
    console.log(`Account Id : ${account?.address}`);
    setIsLoading(true);
    setError("");

    try {
      // Validate inputs
      if (!id || typeof id !== "string") {
        throw new Error("Invalid pool ID provided");
      }

      if (!PACKAGE_ID) {
        throw new Error("Missing PACKAGE_ID in environment variables");
      }

      console.log(`Loading pool data for ID: ${id}`);

      // Verify pool object exists
      const poolObject = await suiClient.getObject({
        id: id,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!poolObject.data) {
        throw new Error("Pool not found. Please verify the pool ID.");
      }

      console.log("Pool object found:", JSON.stringify(poolObject.data));
      const fields = poolObject?.data?.content?.fields;

      // Verify it's a PredictionPool object
      if (!poolObject.data.type?.includes("prediction_pool::PredictionPool")) {
        throw new Error("Invalid pool type. Expected PredictionPool.");
      }

      // Create transaction for view function calls
      const tx = new Transaction();

      console.log("Creating move calls for pool data...");

      // Set up all the move calls for fetching data
      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_pool_info`,
        arguments: [tx.object(id)],
      });

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_reserves`,
        arguments: [tx.object(id)],
      });

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_token_supplies`,
        arguments: [tx.object(id)],
      });

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_token_prices`,
        arguments: [tx.object(id)],
      });

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_fees`,
        arguments: [tx.object(id)],
      });

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_asset_id`,
        arguments: [tx.object(id)],
      });

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_current_price`,
        arguments: [tx.object(id)],
      });

      // User balances call (only if wallet is connected)
      if (account?.address) {
        tx.moveCall({
          target: `${PACKAGE_ID}::prediction_pool::get_user_balances`,
          arguments: [tx.object(id), tx.pure.address(account.address)],
        });
      }

      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::get_asset_address`,
        arguments: [tx.object(id)],
      });

      console.log("Executing devInspect transaction...");

      // Use devInspect to simulate the transaction and get results
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender:
          account?.address ||
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      console.log("DevInspect result:", JSON.stringify(result));

      if (result.effects.status.status !== "success") {
        throw new Error(
          `Transaction simulation failed: ${
            result.effects.status.error || "Unknown error"
          }`
        );
      }

      // Parse the results
      const results = result.results || [];

      if (results.length < 7) {
        throw new Error(
          `Insufficient data returned from smart contract. Expected at least 7 results, got ${results.length}`
        );
      }

      console.log(
        `Processing ${results.length} results from smart contract...`
      );

      // Helper function to parse return values correctly
      const parseReturnValues = (result) => {
        if (!result?.returnValues) return [];

        return result.returnValues.map(([valueArray, type]) => {
          if (type === "u64") {
            // Convert byte array to u64
            let value = 0;
            for (let i = 0; i < valueArray.length; i++) {
              value += valueArray[i] * Math.pow(256, i);
            }
            return value;
          } else if (type === "0x1::string::String") {
            // Move/Sui strings have a length prefix, skip the first byte(s)
            // The first byte usually indicates the string length
            const stringBytes = valueArray.slice(1); // Skip length prefix
            return new TextDecoder().decode(new Uint8Array(stringBytes));
          } else if (type === "vector<u8>") {
            // Return byte array as is for asset_id
            return valueArray;
          }
          return valueArray;
        });
      };

      // Helper function to parse numeric values safely
      const parseNumericValue = (value, defaultValue = 0) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") return parseInt(value) || defaultValue;
        return defaultValue;
      };

      // Helper function to parse string values safely
      const parseStringValue = (value, defaultValue = "") => {
        if (typeof value === "string") {
          // Remove any control characters or length prefixes
          return value.replace(/^[\x00-\x1F]+/, "");
        }
        if (Array.isArray(value)) {
          try {
            // For Move/Sui strings, skip the first byte (length prefix)
            const stringBytes = value.slice(1);
            const decoded = new TextDecoder().decode(
              new Uint8Array(stringBytes)
            );
            return decoded.replace(/^[\x00-\x1F]+/, ""); // Remove any remaining control chars
          } catch {
            return defaultValue;
          }
        }
        return defaultValue;
      };

      // Extract data from each result with improved parsing
      const poolInfoData = parseReturnValues(results[0]);
      const reservesData = parseReturnValues(results[1]);
      const suppliesData = parseReturnValues(results[2]);
      const pricesData = parseReturnValues(results[3]);
      const feesData = parseReturnValues(results[4]);
      const assetIdData = parseReturnValues(results[5]);
      const currentPriceData = parseReturnValues(results[6]);

      let userBalancesData = [];
      if (account?.address && results.length > 7) {
        userBalancesData = parseReturnValues(results[7]);
      }

      console.log("Parsed data:", {
        poolInfo: poolInfoData,
        reserves: reservesData,
        supplies: suppliesData,
        prices: pricesData,
        fees: feesData,
        assetId: assetIdData,
        currentPrice: currentPriceData,
        userBalances: userBalancesData,
      });

      // Validate essential data with better error messages
      if (!poolInfoData || poolInfoData.length < 3) {
        console.error("Pool info data:", poolInfoData);
        throw new Error(
          "Failed to fetch pool information - insufficient data returned"
        );
      }
      if (!reservesData || reservesData.length < 2) {
        console.error("Reserves data:", reservesData);
        throw new Error(
          "Failed to fetch pool reserves - insufficient data returned"
        );
      }
      if (!suppliesData || suppliesData.length < 2) {
        console.error("Supplies data:", suppliesData);
        throw new Error(
          "Failed to fetch token supplies - insufficient data returned"
        );
      }
      if (!pricesData || pricesData.length < 2) {
        console.error("Prices data:", pricesData);
        throw new Error(
          "Failed to fetch token prices - insufficient data returned"
        );
      }

      // Extract values with proper fallbacks to object fields
      const name =
        parseStringValue(poolInfoData[0]) ||
        parseStringValue(fields?.name) ||
        "Prediction Pool";

      const description =
        parseStringValue(poolInfoData[1]) ||
        parseStringValue(fields?.description) ||
        "Price prediction market";

      // Use contract fields for reserves since they're already correctly parsed
      const bullReserve =
        parseNumericValue(fields?.bull_reserve) ||
        parseNumericValue(reservesData[0]);
      const bearReserve =
        parseNumericValue(fields?.bear_reserve) ||
        parseNumericValue(reservesData[1]);

      // Token supplies from smart contract calls
      const bullSupply = parseNumericValue(suppliesData[0]);
      const bearSupply = parseNumericValue(suppliesData[1]);

      // Token prices from smart contract calls
      const bullPrice = parseNumericValue(pricesData[0]);
      const bearPrice = parseNumericValue(pricesData[1]);

      const vaultCreatorFee =
        parseNumericValue(fields?.vault_creator_fee) ||
        parseNumericValue(feesData[0]);
      const treasuryFee =
        parseNumericValue(fields?.treasury_fee) ||
        parseNumericValue(feesData[1]);

      // Asset ID - use the contract field as it's already correctly formatted
      const assetId = assetIdData[0] || [];

      // Current price - use contract field as primary source
      const currentPrice =
        parseNumericValue(fields?.current_price) ||
        parseNumericValue(currentPriceData[0]);

      // User balances
      const userBullTokens = parseNumericValue(userBalancesData[0]);
      const userBearTokens = parseNumericValue(userBalancesData[1]);

      console.log("Final parsed values:", {
        name,
        description,
        currentPrice,
        bullReserve,
        bearReserve,
        bullSupply,
        bearSupply,
        bullPrice,
        bearPrice,
        vaultCreatorFee,
        treasuryFee,
        assetId,
        userBullTokens,
        userBearTokens,
      });

      // Set pool data with proper number formatting
      setPoolData({
        name: name,
        description: description,
        asset_id: assetId,
        current_price: currentPrice,
        bull_reserve: bullReserve,
        bear_reserve: bearReserve,
        bull_supply: bullSupply,
        bear_supply: bearSupply,
        vault_creator_fee: vaultCreatorFee,
        treasury_fee: treasuryFee,
        bull_price: bullPrice,
        bear_price: bearPrice,
      });

      // Calculate user token values safely
      const bullValue = (userBullTokens * bullPrice) / 1000000000; // Convert to display units
      const bearValue = (userBearTokens * bearPrice) / 1000000000;

      setUserData({
        bull_tokens: userBullTokens,
        bear_tokens: userBearTokens,
        bull_value: Math.floor(bullValue * 1000000000), // Convert back to mist for consistency
        bear_value: Math.floor(bearValue * 1000000000),
      });

      console.log(`Successfully loaded pool ${id}:`, {
        name,
        currentPrice: currentPrice / 1000000000,
        totalReserves: (bullReserve + bearReserve) / 1000000000,
        userConnected: !!account?.address,
        userTokens: userBullTokens + userBearTokens,
      });
    } catch (err) {
      console.error("Error loading pool data:", err);

      let errorMessage = "Failed to load pool data. ";

      if (err.message?.includes("not found")) {
        errorMessage += "Pool not found. Please check the pool ID.";
      } else if (
        err.message?.includes("network") ||
        err.message?.includes("fetch")
      ) {
        errorMessage +=
          "Network error. Please check your connection and try again.";
      } else if (
        err.message?.includes("Package") ||
        err.message?.includes("PACKAGE_ID")
      ) {
        errorMessage +=
          "Smart contract configuration error. Please contact support.";
      } else if (err.message?.includes("Invalid pool type")) {
        errorMessage += "The provided ID is not a valid prediction pool.";
      } else if (err.message?.includes("simulation failed")) {
        errorMessage +=
          "Contract interaction failed. The pool may be in an invalid state.";
      } else {
        errorMessage +=
          err.message || "An unexpected error occurred. Please try again.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const poolIdParam = params.id;
    if (poolIdParam) {
      loadPoolData(poolIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, account]);

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
        vault: params.id,
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
      if (!params.id || typeof params.id !== "string") {
        throw new Error("Invalid pool ID for transaction.");
      }
      tx.moveCall({
        target: `${PACKAGE_ID}::prediction_pool::purchase_token`,
        arguments: [
          tx.object(params.id as string),
          tx.pure.bool(true),
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

  // Mock function to handle bear token purchase
  const handleBuyBear = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // In real implementation, this would call:
      // buy_bear(pool, sui_payment, ctx)

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const amount = parseFloat(buyAmount);
      setUserData((prev) => ({
        ...prev,
        bear_tokens: prev.bear_tokens + amount * 1000000000,
        bear_value: prev.bear_value + amount * 1000000000,
      }));

      setBuyAmount("");
      alert("Bear tokens purchased successfully!");
    } catch (err) {
      setError("Failed to purchase bear tokens. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock function to handle bull token sale
  const handleSellBull = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      setError("Please enter a valid token amount");
      return;
    }

    const tokensToSell = parseFloat(sellAmount) * 1000000000; // Convert to mist
    if (tokensToSell > userData.bull_tokens) {
      setError("Insufficient bull tokens");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // In real implementation, this would call:
      // sell_bull(pool, amount, ctx)

      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUserData((prev) => ({
        ...prev,
        bull_tokens: prev.bull_tokens - tokensToSell,
        bull_value:
          prev.bull_value - (tokensToSell * poolData.bull_price) / 1000000000,
      }));

      setSellAmount("");
      alert("Bull tokens sold successfully!");
    } catch (err) {
      setError("Failed to sell bull tokens. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock function to handle bear token sale
  const handleSellBear = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      setError("Please enter a valid token amount");
      return;
    }

    const tokensToSell = parseFloat(sellAmount) * 1000000000;
    if (tokensToSell > userData.bear_tokens) {
      setError("Insufficient bear tokens");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // In real implementation, this would call:
      // sell_bear(pool, amount, ctx)

      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUserData((prev) => ({
        ...prev,
        bear_tokens: prev.bear_tokens - tokensToSell,
        bear_value:
          prev.bear_value - (tokensToSell * poolData.bear_price) / 1000000000,
      }));

      setSellAmount("");
      alert("Bear tokens sold successfully!");
    } catch (err) {
      setError("Failed to sell bear tokens. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format numbers for display with NaN checks
  const formatTokens = (amount) => {
    const value = parseNumericValue(amount) / 1000000000;
    return isNaN(value) ? "0.00" : value.toFixed(2);
  };

  const formatPrice = (price) => {
    const value = parseNumericValue(price) / 1000000;
    return `${isNaN(value) ? "0.00" : value.toFixed(2)} SUI`;
  };

  const formatValue = (value) => {
    const val = parseNumericValue(value) / 1000000000;
    return `${isNaN(val) ? "0.00" : val.toFixed(2)} SUI`;
  };
  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-300 ${
          isDarkMode
            ? "bg-slate-900 text-slate-100"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <Navbar />

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Chart and Pool Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price Chart - Fixed height container */}
              <Card
                className={`transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="w-full h-[500px] p-0">
                  <TradingViewWidget
                    assetId={poolData.asset_id}
                    theme={isDarkMode ? "dark" : "light"}
                    height="500px"
                    width="100%"
                    showHeader={true}
                    className="h-full"
                  />
                </div>
              </Card>

              {/* Pool Details */}
              <Card
                className={`transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-blue-600" />
                    <span>Pool Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {poolData.name}
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {poolData.description}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        Current Price:
                      </span>
                      <span className="ml-2 font-semibold">
                        ${(poolData.current_price / 1000000000).toFixed(8)}
                      </span>
                    </div>
                  </div>

                  <Separator
                    className={isDarkMode ? "bg-slate-700" : "bg-slate-200"}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Bull Reserve
                        </span>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="font-semibold">
                            {(poolData.bull_reserve / 1000000000).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Bear Reserve
                        </span>
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="font-semibold">
                            {(poolData.bear_reserve / 1000000000).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Bull Supply
                        </span>
                        <span className="font-semibold">
                          {(poolData.bull_supply / 1000000000).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Bear Supply
                        </span>
                        <span className="font-semibold">
                          {(poolData.bear_supply / 1000000000).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Bull Price
                        </span>
                        <span className="font-semibold text-green-600">
                          ${(poolData.bull_price / 1000000000).toFixed(8)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Bear Price
                        </span>
                        <span className="font-semibold text-red-600">
                          ${(poolData.bear_price / 1000000000).toFixed(8)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Vault Fee
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {poolData.vault_creator_fee}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          Treasury Fee
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {poolData.treasury_fee}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Vault Trading */}
            <div className="space-y-6">
              <Card
                className={`transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Prediction Vaults</span>
                  </CardTitle>
                  <CardDescription>
                    Buy and sell prediction tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={activeVault}
                    onValueChange={setActiveVault}
                    className="w-full"
                  >
                    <TabsList
                      className={`grid w-full grid-cols-2 ${
                        isDarkMode ? "bg-slate-700" : "bg-slate-100"
                      }`}
                    >
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
                      <div
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-slate-700" : "bg-green-50"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Your Bull Tokens
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {formatTokens(userData.bull_tokens)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Current Price
                            </span>
                            <span className="text-lg font-bold">
                              {formatPrice(poolData.bull_price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Total Value
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {formatValue(userData.bull_value)}
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
                            className={`${
                              isDarkMode
                                ? "bg-slate-700 border-slate-600"
                                : "bg-white border-slate-300"
                            }`}
                          />
                        </div>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleBuyBull}
                          disabled={isLoading || !buyAmount}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Buy Bull Tokens
                        </Button>
                      </div>

                      <Separator
                        className={isDarkMode ? "bg-slate-700" : "bg-slate-200"}
                      />

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
                            className={`${
                              isDarkMode
                                ? "bg-slate-700 border-slate-600"
                                : "bg-white border-slate-300"
                            }`}
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900"
                          onClick={handleSellBull}
                          disabled={isLoading || !sellAmount}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Sell Bull Tokens
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="bear" className="space-y-6 mt-6">
                      <div
                        className={`p-4 rounded-lg ${
                          isDarkMode ? "bg-slate-700" : "bg-red-50"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Your Bear Tokens
                            </span>
                            <span className="text-lg font-bold text-red-600">
                              {formatTokens(userData.bear_tokens)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Current Price
                            </span>
                            <span className="text-lg font-bold">
                              {formatPrice(poolData.bear_price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Total Value
                            </span>
                            <span className="text-lg font-bold text-red-600">
                              {formatValue(userData.bear_value)}
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
                            className={`${
                              isDarkMode
                                ? "bg-slate-700 border-slate-600"
                                : "bg-white border-slate-300"
                            }`}
                          />
                        </div>
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleBuyBear}
                          disabled={isLoading || !buyAmount}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Buy Bear Tokens
                        </Button>
                      </div>

                      <Separator
                        className={isDarkMode ? "bg-slate-700" : "bg-slate-200"}
                      />

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
                            className={`${
                              isDarkMode
                                ? "bg-slate-700 border-slate-600"
                                : "bg-white border-slate-300"
                            }`}
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="w-full border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                          onClick={handleSellBear}
                          disabled={isLoading || !sellAmount}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Sell Bear Tokens
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              <Card
                className={`transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="font-semibold">
                    Settle Prediction Outcome
                  </CardTitle>
                  <CardDescription>
                    Distribute rewards based on the outcome.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4">
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                    onClick={handleSellBull}
                  >
                    {isLoading && (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Settle Outcome
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card
                className={`transition-colors duration-300 ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Pool Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Total Pool Value
                    </span>
                    <span className="font-bold text-blue-600">
                      {formatValue(
                        poolData.bull_reserve + poolData.bear_reserve
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Total Supply
                    </span>
                    <span className="font-bold">
                      {formatTokens(
                        poolData.bull_supply + poolData.bear_supply
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Pool Ratio
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {(
                          (poolData.bull_reserve /
                            (poolData.bull_reserve + poolData.bear_reserve)) *
                          100
                        ).toFixed(1)}
                        % Bull
                      </Badge>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {(
                          (poolData.bear_reserve /
                            (poolData.bull_reserve + poolData.bear_reserve)) *
                          100
                        ).toFixed(1)}
                        % Bear
                      </Badge>
                    </div>
                  </div>
                  <Separator
                    className={isDarkMode ? "bg-slate-700" : "bg-slate-200"}
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Asset ID
                    </span>
                    <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {poolData.asset_id.slice(0, 10)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Your Portfolio Value
                    </span>
                    <span className="font-bold text-blue-600">
                      {formatValue(userData.bull_value + userData.bear_value)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
function updatePythPrice(
  arg0: string[]
):
  | { suiPriceObjectId: any; updateResult: any }
  | PromiseLike<{ suiPriceObjectId: any; updateResult: any }> {
  throw new Error("Function not implemented.");
}

function signAndExecuteTransaction(arg0: { transaction: Transaction }) {
  throw new Error("Function not implemented.");
}
