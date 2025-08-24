/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, TrendingUp, TrendingDown, Filter, X } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SuiClient } from "@mysten/sui/client";
import { useRouter } from "next/navigation";
import { Token } from "@/types/Token";
import { Pool, PoolCreatedEvent } from "@/types/Pool";
import StickyCursor from "@/components/StickyCursor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
import { ASSET_CONFIG } from "@/config/assets";

interface EnhancedPool extends Pool {
  total_fees: number;
  asset_name: string;
  total_liquidity: number;
  volume_24h?: number;
  apr?: number;
}

interface FilterState {
  maxError: any;
  minError: any;
  asset: string;
  minLiquidity: number;
  maxLiquidity: number;
  minFees: number;
  maxFees: number;
  creator: string;
}

const ExploreFatePools = () => {
  const stickyRef = useRef<HTMLElement | null>(null);
  const [pools, setPools] = useState<EnhancedPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    asset: "",
    minLiquidity: 0,
    maxLiquidity: 0,
    minFees: 0,
    maxFees: 0,
    creator: "",
    minError: null,
    maxError: null,
  });

  const router = useRouter();
  const client = useMemo(
    () => new SuiClient({ url: "https://fullnode.testnet.sui.io" }),
    []
  );

  const formatNumber = (num: number) => {
    const val = num / 1e9;
    return `${parseFloat(val.toFixed(3))} SUI`;
  };

  const toIntSafe = (v: any, def = 0) => {
    const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
    return Number.isFinite(n) ? n : def;
  };

  const bytesToHex0x = (arr?: number[] | string) => {
    if (!arr) return "";
    if (typeof arr === "string") return arr;
    return "0x" + arr.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  useEffect(() => {
    const fetchPools = async () => {
      if (!PACKAGE_ID) {
        console.warn("Missing NEXT_PUBLIC_PACKAGE_ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let poolData = await fetchPoolsFromEvents();
        if (poolData.length === 0) {
          poolData = await fetchPoolsFromObjects();
        }

        const enhancedPools = await Promise.allSettled(
          poolData.map(({ poolId, eventData }) =>
            enhancePoolData(poolId, eventData)
          )
        );

        const validPools = enhancedPools
          .filter(
            (result): result is PromiseFulfilledResult<EnhancedPool> =>
              result.status === "fulfilled" && result.value !== null
          )
          .map((result) => result.value)
          .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

        setPools(validPools);
      } catch (err) {
        console.error("Error fetching pools:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPoolsFromEvents = async (): Promise<
      Array<{ poolId: string; eventData?: PoolCreatedEvent }>
    > => {
      try {
        const eventsResponse = await client.queryEvents({
          query: {
            MoveEventType: `${PACKAGE_ID}::prediction_pool::PoolCreated`,
          },
          limit: 50,
          order: "descending",
        });

        return eventsResponse.data
          .map((event) => {
            if (event.parsedJson && typeof event.parsedJson === "object") {
              const parsed = event.parsedJson as any;
              return {
                poolId: parsed.pool_id,
                eventData: {
                  pool_id: parsed.pool_id,
                  name: parsed.name,
                  creator: parsed.creator,
                  initial_price: parsed.initial_price,
                },
              };
            }
            return null;
          })
          .filter(
            (item): item is { poolId: string; eventData: PoolCreatedEvent } =>
              item !== null
          );
      } catch (err) {
        console.error("Error fetching events:", err);
        return [];
      }
    };

    const fetchPoolsFromObjects = async (): Promise<
      Array<{ poolId: string }>
    > => {
      try {
        const txnResponse = await client.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: PACKAGE_ID || "",
              module: "prediction_pool",
              function: "create_pool",
            },
          },
          options: { showObjectChanges: true },
          order: "descending",
        });

        const poolIds: string[] = [];
        const PREDICTION_POOL_TYPE = `${PACKAGE_ID}::prediction_pool::PredictionPool`;

        txnResponse.data.forEach((tx) => {
          tx.objectChanges?.forEach((change) => {
            if (
              change.type === "created" &&
              "objectType" in change &&
              change.objectType === PREDICTION_POOL_TYPE
            ) {
              poolIds.push(change.objectId);
            }
          });
        });

        return poolIds.map((poolId) => ({ poolId }));
      } catch (err) {
        console.error("Error fetching from objects:", err);
        return [];
      }
    };

    const enhancePoolData = async (
      poolId: string,
      eventData?: PoolCreatedEvent
    ): Promise<EnhancedPool | null> => {
      try {
        const response = await client.getObject({
          id: poolId,
          options: { showContent: true },
        });

        if (!response.data?.content || !("fields" in response.data.content)) {
          return null;
        }

        const fields = (response.data.content as any).fields;
        console.log("Enhancing pool:", poolId, JSON.stringify(fields));
        const name =
          fields.name || eventData?.name || `Pool ${poolId.slice(-8)}`;
        const description = fields.description || "";
        const currentPrice = toIntSafe(fields.current_price, 0);
        const assetAddress =
          fields.asset_address || bytesToHex0x(fields.asset_id) || "";
        const creator = fields.pool_creator || eventData?.creator || "";

        // Calculate reserves and fees
        const bullReserve = toIntSafe(fields.bull_reserve, 0);
        const bearReserve = toIntSafe(fields.bear_reserve, 0);
        const totalLiquidity = bullReserve + bearReserve;

        const protocolFee = toIntSafe(fields.protocol_fee, 0);
        const stableOrderFee = toIntSafe(fields.stable_order_fee, 0);
        const creatorFee = toIntSafe(fields.pool_creator_fee, 0);
        const totalFees = protocolFee * 2 + stableOrderFee + creatorFee;
        // Calculate percentages
        const bullPercentage =
          totalLiquidity > 0 ? (bullReserve / totalLiquidity) * 100 : 50;
        const bearPercentage = 100 - bullPercentage;

        // Get asset info
        const assetInfo = ASSET_CONFIG[assetAddress] || {
          name: "Unknown",
          symbol: "UNK",
        };

        // Create token objects (simplified)
        const createToken = (
          tokenFields: any,
          type: "BULL" | "BEAR",
          reserve: number
        ): Token | undefined => {
          if (!tokenFields?.fields) return undefined;

          const f = tokenFields.fields;
          return {
            id: f.id?.id || "",
            name: f.name || `${type} Token`,
            symbol: f.symbol || type,
            balance: toIntSafe(f.total_supply, 0),
            price: 1,
            vault_creator: creator,
            vault_fee: 0,
            vault_creator_fee: 0,
            treasury_fee: 0,
            asset_balance: reserve,
            supply: toIntSafe(f.total_supply, 0),
            prediction_pool: poolId,
            other_token: "",
          };
        };

        const enhancedPool: EnhancedPool = {
          id: poolId,
          name,
          description,
          current_price: currentPrice,
          asset_id: assetAddress,
          creator,
          bullPercentage,
          bearPercentage,
          bull_reserve: bullReserve,
          bear_reserve: bearReserve,
          bullToken: createToken(fields.bull_token, "BULL", bullReserve),
          bearToken: createToken(fields.bear_token, "BEAR", bearReserve),
          created_at: eventData ? Date.now() : undefined,
          total_fees: totalFees,
          asset_name: assetInfo.name,
          total_liquidity: totalLiquidity,
        };

        return enhancedPool;
      } catch (err) {
        console.error(`Error enhancing pool ${poolId}:`, err);
        return null;
      }
    };

    fetchPools();
  }, [client]);

  const filteredPools = useMemo(() => {
    return pools.filter((pool) => {
      const matchesSearch =
        pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.asset_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAsset = !filters.asset || pool?.asset_id === filters.asset;
      const matchesCreator =
        !filters.creator ||
        pool.creator.toLowerCase().includes(filters.creator.toLowerCase());
      const matchesLiquidity =
        pool.total_liquidity >= filters.minLiquidity &&
        (filters.maxLiquidity === 0 ||
          pool.total_liquidity <= filters.maxLiquidity);
      const matchesFees =
        pool.total_fees >= filters.minFees &&
        (filters.maxFees === 0 || pool.total_fees <= filters.maxFees);

      return (
        matchesSearch &&
        matchesAsset &&
        matchesCreator &&
        matchesLiquidity &&
        matchesFees
      );
    });
  }, [pools, searchQuery, filters]);

  const availableAssets = useMemo(() => {
    const assets = new Set(pools.map((pool) => pool.asset_id));
    return Array.from(assets).map((address) => ({
      address,
      ...(ASSET_CONFIG[address] || { name: "Unknown", symbol: "UNK" }),
    }));
  }, [pools]);

  const clearFilters = () => {
    setFilters({
      asset: "",
      minLiquidity: 0,
      maxLiquidity: 0,
      minFees: 0,
      maxFees: 0,
      creator: "",
      minError: null,
      maxError: null,
    });
  };

  return (
    <>
      <Navbar />
      <StickyCursor stickyRef={stickyRef} />

      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-full mx-auto px-4">
          {/* Header with Search and Stats */}
          <div className="mb-8">
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-80">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, price, creator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                >
                  <Filter size={16} />
                  Filters
                </button>

                {/* Stats */}
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Total Pools
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {pools.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Filtered
                    </p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {filteredPools.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Price
                      </label>
                      <Select
                        value={filters.asset || "all"}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            asset: value === "all" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black text-neutral-700 dark:text-neutral-300">
                          <SelectValue placeholder="All Price" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black text-neutral-700 dark:text-neutral-300">
                          <SelectItem value="all">All Price</SelectItem>
                          {availableAssets.map((asset) => (
                            <SelectItem
                              key={asset.address}
                              value={asset.address}
                            >
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Min Value (SUI)
                      </label>

                      <Input
                        type="number"
                        value={
                          filters.minLiquidity ? filters.minLiquidity / 1e9 : ""
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFilters((prev) => ({
                            ...prev,
                            minLiquidity: e.target.value === "" ? 0 : val * 1e9,
                            minError: val < 0 ? "Value cannot be negative" : "",
                          }));
                        }}
                        placeholder="0"
                      />

                      {filters.minError && (
                        <p className="text-red-500 text-sm mt-1">
                          {filters.minError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Max Value (SUI)
                      </label>

                      <Input
                        type="number"
                        value={
                          filters.maxLiquidity === 0
                            ? ""
                            : filters.maxLiquidity / 1e9
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFilters((prev) => ({
                            ...prev,
                            maxLiquidity: e.target.value === "" ? 0 : val * 1e9,
                            maxError: val < 0 ? "Value cannot be negative" : "",
                          }));
                        }}
                        placeholder="No limit"
                      />

                      {filters.maxError && (
                        <p className="text-red-500 text-sm mt-1">
                          {filters.maxError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-all"
                    >
                      <X size={16} />
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optimized Table */}
          <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Pool Info
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Bull/Bear
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-20"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filteredPools.length > 0 ? (
                    filteredPools.map((pool) => (
                      <tr
                        key={pool.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/predictionPool/${encodeURIComponent(pool.id)}`
                          )
                        }
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-black dark:text-white">
                              {pool.name}
                            </div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate max-w-xs">
                              {pool.description || "No description"}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {pool.asset_name}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {formatNumber(pool.total_liquidity)}
                          </div>
                          <div className="text-xs text-neutral-500">
                            BULL: {formatNumber(pool.bull_reserve)} | BEAR:{" "}
                            {formatNumber(pool.bear_reserve)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {pool.bullPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <span className="text-neutral-400">/</span>
                            <div className="flex items-center gap-1">
                              <TrendingDown className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                {pool.bearPercentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-lg text-neutral-600 dark:text-neutral-400">
                            {searchQuery ||
                            Object.values(filters).some(
                              (f) => f !== "" && f !== 0
                            )
                              ? "No pools match your filters"
                              : "No prediction pools found"}
                          </div>
                          {!searchQuery &&
                            Object.values(filters).every(
                              (f) => f === "" || f === 0
                            ) && (
                              <button
                                className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all"
                                onClick={() =>
                                  router.push("/predictionPool/create")
                                }
                              >
                                Create the First Pool
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ExploreFatePools;
