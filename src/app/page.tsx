/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AboutSection from "@/components/Home/About";
import Hero from "@/components/Home/Hero";
import Navbar from "@/components/layout/Navbar";
import Marquee from "@/components/Home/Marque";
import StickyCursor from "@/components/StickyCursor";
import HeroWrapper from "@/components/Home/HeroWrapper";
import Footer from "@/components/layout/Footer";
import PoolsMarquee from "@/components/PoolMarquee";
import { Pool, PoolCreatedEvent } from "@/types/Pool";
import { Token } from "@/types/Token";
import { SuiClient } from "@mysten/sui/client";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

export default function Home() {
  const stickyRef = useRef<HTMLElement | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
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
        return;
      }

      try {
        const poolCreatedEvents = await queryPoolCreatedEvents();

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
          return;
        }

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

        const validPools = enrichedPools.filter(
          (pool): pool is Pool => pool !== null
        );

        setPools(validPools);
      } catch (err) {
        console.error("Error fetching prediction pools:", err);
      } finally {
      }
    };

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]); 

  return (
    <main className="relative h-[200vh]">
      <StickyCursor stickyRef={stickyRef} />
      <Navbar />
      <HeroWrapper>
        <Hero />
      </HeroWrapper>
      <Marquee />
      <PoolsMarquee pools={pools} speed={30} pauseOnHover={true} />
      <AboutSection />
      <Footer />
    </main>
  );
}
