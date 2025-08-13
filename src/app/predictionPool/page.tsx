/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useMemo, useState } from "react";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import { Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SuiClient } from "@mysten/sui/client";
import { useRouter } from "next/navigation";
import { Token } from "@/types/Token";
import { Pool, PoolCreatedEvent } from "@/types/Pool";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

const ExploreFatePools = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const client = useMemo(
    () =>
      new SuiClient({
        url: "https://fullnode.testnet.sui.io",
      }),
    []
  );

  useEffect(() => {
    const fetchPredictionPools = async () => {
      if (!PACKAGE_ID) {
        console.warn("Missing NEXT_PUBLIC_PACKAGE_ID in env");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Method 1: Query PoolCreated events (Primary approach)
        const poolCreatedEvents = await queryPoolCreatedEvents();

        // Method 2: Fallback - Query objects by type if events fail
        let poolIds: string[] = [];

        if (poolCreatedEvents.length > 0) {
          poolIds = poolCreatedEvents.map((event) => event.pool_id);
        } else {
          console.log("No events found, falling back to object query...");
          poolIds = await queryPoolsByObjectType();
        }

        console.log(`Found ${poolIds.length} pools:`, poolIds);

        if (poolIds.length === 0) {
          setPools([]);
          setLoading(false);
          return;
        }

        // Fetch detailed pool data
        const enrichedPools = await Promise.all(
          poolIds.map(async (poolId, index) => {
            try {
              return await fetchPoolDetails(poolId, poolCreatedEvents[index]);
            } catch (err) {
              console.error(`Error fetching details for pool ${poolId}:`, err);
              return null;
            }
          })
        );

        // Filter out failed fetches
        const validPools = enrichedPools.filter(
          (pool): pool is Pool => pool !== null
        );

        // Sort by creation time (newest first)
        validPools.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

        setPools(validPools);
      } catch (err) {
        console.error("Error fetching prediction pools:", err);
      } finally {
        setLoading(false);
      }
    };

    // Query PoolCreated events
    const queryPoolCreatedEvents = async (): Promise<PoolCreatedEvent[]> => {
      try {
        const eventType = `${PACKAGE_ID}::prediction_pool::PoolCreated`;

        const eventsResponse = await client.queryEvents({
          query: { MoveEventType: eventType },
          limit: 50,
          order: "descending",
        });

        const events: PoolCreatedEvent[] = eventsResponse.data
          .map((event) => {
            if (event.parsedJson && typeof event.parsedJson === "object") {
              const parsed = event.parsedJson as any;
              return {
                pool_id: parsed.pool_id,
                name: parsed.name,
                creator: parsed.creator,
                initial_price: parsed.initial_price,
              };
            }
            return null;
          })
          .filter((event): event is PoolCreatedEvent => event !== null);

        console.log(`Found ${events.length} PoolCreated events`);
        return events;
      } catch (err) {
        console.error("Error querying PoolCreated events:", err);
        return [];
      }
    };

    // Fallback: Query pools by object type
    const queryPoolsByObjectType = async (): Promise<string[]> => {
      try {
        const PREDICTION_POOL_TYPE = `${PACKAGE_ID}::prediction_pool::PredictionPool`;

        // Query recent transactions that might have created pools
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

        for (const tx of txnResponse.data) {
          if (!tx.objectChanges) continue;

          for (const change of tx.objectChanges) {
            if (
              change.type === "created" &&
              "objectType" in change &&
              change.objectType === PREDICTION_POOL_TYPE
            ) {
              poolIds.push(change.objectId);
            }
          }
        }

        console.log(`Found ${poolIds.length} pools via object changes`);
        return poolIds;
      } catch (err) {
        console.error("Error querying pools by object type:", err);
        return [];
      }
    };

    // Fetch detailed pool information
    const bytesToHex0x = (arr?: number[] | string) => {
      if (!arr) return "";
      if (typeof arr === "string") return arr; // already hex
      return "0x" + arr.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const toIntSafe = (v: any, def = 0) => {
      const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
      return Number.isFinite(n) ? n : def;
    };

    const fetchPoolDetails = async (
      poolId: string,
      eventData?: PoolCreatedEvent
    ): Promise<Pool | null> => {
      try {
        const response = await client.getObject({
          id: poolId,
          options: { showContent: true },
        });

        if (!response.data?.content || !("fields" in response.data.content)) {
          console.warn(`No content found for pool ${poolId}`);
          return null;
        }

        const poolFields = (response.data.content as any).fields;
        console.log(
          `Fetched pool fields for ${poolId}:`,
          JSON.stringify(poolFields)
        );

        // Basic pool info
        const poolName =
          poolFields.name || eventData?.name || `Pool ${poolId.slice(-8)}`;
        const description = poolFields.description || "";
        const currentPrice = toIntSafe(poolFields.current_price, 0);

        // Prefer asset_address (already hex), else convert asset_id (bytes[]) to hex
        const assetAddress: string =
          poolFields.asset_address || bytesToHex0x(poolFields.asset_id) || "";

        const creator = poolFields.pool_creator || eventData?.creator || "";

        // Reserves (strings → numbers)
        const bullReserve = toIntSafe(poolFields.bull_reserve, 0);
        const bearReserve = toIntSafe(poolFields.bear_reserve, 0);
        const totalReserve = bullReserve + bearReserve;

        // Percentages
        const bullPercentage =
          totalReserve > 0 ? (bullReserve / totalReserve) * 100 : 50;
        const bearPercentage = 100 - bullPercentage;

        // Token info
        let bullToken: Token | undefined;
        let bearToken: Token | undefined;

        try {
          if (poolFields.bull_token?.fields) {
            const f = poolFields.bull_token.fields;
            bullToken = {
              id: f.id?.id || "",
              name: f.name || "Bull Token",
              symbol: f.symbol || "BULL",
              balance: toIntSafe(f.total_supply, 0),
              price: 1,
              vault_creator: creator,
              vault_fee: 0,
              vault_creator_fee: 0,
              treasury_fee: 0,
              asset_balance: bullReserve,
              supply: toIntSafe(f.total_supply, 0),
              prediction_pool: poolId,
              other_token: "",
            };
          }

          if (poolFields.bear_token?.fields) {
            const f = poolFields.bear_token.fields;
            bearToken = {
              id: f.id?.id || "",
              name: f.name || "Bear Token",
              symbol: f.symbol || "BEAR",
              balance: toIntSafe(f.total_supply, 0),
              price: 1,
              vault_creator: creator,
              vault_fee: 0,
              vault_creator_fee: 0,
              treasury_fee: 0,
              asset_balance: bearReserve,
              supply: toIntSafe(f.total_supply, 0),
              prediction_pool: poolId,
              other_token: "",
            };
          }
        } catch (tokenErr) {
          console.warn(
            `Could not map token details for pool ${poolId}:`,
            tokenErr
          );
        }

        const pool: Pool = {
          id: poolId,
          name: poolName,
          description,
          current_price: currentPrice,
          asset_id: assetAddress,
          creator,
          bullPercentage,
          bearPercentage,
          bull_reserve: bullReserve,
          bear_reserve: bearReserve,
          bullToken,
          bearToken,
          created_at: eventData ? Date.now() : undefined,
        };

        return pool;
      } catch (err) {
        console.error(`Error fetching pool details for ${poolId}:`, err);
        return null;
      }
    };

    fetchPredictionPools();
  }, [client]);

  const filteredPools = pools.filter(
    (pool) =>
      pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800/50 rounded-xl p-6 shadow-lg">
              <div className="relative w-full md:w-auto ">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search pools by name, description, or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-40 pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:text-white dark:bg-gray-900/60 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 outline-none transition-all"
                />
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Active Pools
                  </p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {pools.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[400px] bg-white dark:bg-gray-700/30 rounded-xl shadow-lg animate-pulse"
                >
                  <div className="h-48 bg-gray-200 dark:bg-gray-600/50 rounded-t-xl" />
                  <div className="p-6 space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600/50 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-600/50 rounded w-1/2" />
                    <div className="h-24 bg-gray-200 dark:bg-gray-600/50 rounded" />
                  </div>
                </div>
              ))
            ) : filteredPools.length > 0 ? (
              filteredPools.map((pool) => (
                <div key={pool.id} className="group">
                  <PredictionCard
                    name={pool.name}
                    description={pool.description}
                    bullPercentage={pool.bullPercentage}
                    bearPercentage={pool.bearPercentage}
                    bullCoinSymbol={pool.bullToken?.symbol || "BULL"}
                    bearCoinSymbol={pool.bearToken?.symbol || "BEAR"}
                    onUse={() => {
                      router.push(
                        `/predictionPool/${encodeURIComponent(pool.id)}`
                      );
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-8 shadow-lg">
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery
                      ? `No pools found matching "${searchQuery}"`
                      : "No prediction pools found"}
                  </p>
                  {!searchQuery && (
                    <button
                      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all dark:bg-white dark:text-black"
                      onClick={() => router.push("/createPool")}
                    >
                      Create the First Pool
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ExploreFatePools;
