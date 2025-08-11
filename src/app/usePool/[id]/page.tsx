"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SuiClient } from "@mysten/sui/client";
import { useParams } from "next/navigation";
import InteractionClient from "./InteractionClient";

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

interface Pool {
  id: string;
  name: string;
  description: string;
  asset_id: string;
  current_price: number;
  bullToken: Token;
  bearToken: Token;
  bull_reserve: number;
  bear_reserve: number;
  vault_creator_fee: number;
  treasury_fee: number;
  vault_creator: string;
  treasury: string;
  bullPercentage: number;
  bearPercentage: number;
  totalValue: number;
}

const UseFatePools = () => {
  const params = useParams();
  const [pool, setPool] = useState<Pool>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = new SuiClient({
    url: "https://fullnode.testnet.sui.io",
  });

  useEffect(() => {
    const fetchPredictionPool = async () => {
      const rawId = params?.id as string;

      if (!rawId) {
        setError("Missing object ID.");
        setLoading(false);
        return;
      }

      const objectID = decodeURIComponent(rawId);

      setLoading(true);
      setError(null);

      try {
        // Fetch the main pool object
        const response = await client.getObject({
          id: objectID,
          options: { showContent: true },
        });

        if (
          !response.data?.content ||
          response.data.content.dataType !== "moveObject"
        ) {
          throw new Error("No content found in response");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const poolFields = (response.data.content as any).fields;
        console.log(`Pool Fields: ${JSON.stringify(poolFields, null, 2)}`);
        // Extract bull and bear token data from the pool
        const bullTokenFields = poolFields.bull_token.fields;
        const bearTokenFields = poolFields.bear_token.fields;

        // Create token objects
        const bullToken: Token = {
          id: bullTokenFields.id.id,
          name: bullTokenFields.name,
          symbol: bullTokenFields.symbol,
          balance: 0, // This would be user-specific, set to 0 for now
          price:
            parseFloat(poolFields.bull_reserve) /
              parseFloat(bullTokenFields.total_supply) || 1,
          vault_creator: poolFields.vault_creator,
          vault_fee: 0, // Not stored in token anymore
          vault_creator_fee: parseInt(poolFields.vault_creator_fee),
          treasury_fee: parseInt(poolFields.treasury_fee),
          asset_balance: parseInt(poolFields.bull_reserve),
          supply: parseInt(bullTokenFields.total_supply),
          prediction_pool: objectID,
          other_token: bearTokenFields.id.id,
        };

        const bearToken: Token = {
          id: bearTokenFields.id.id,
          name: bearTokenFields.name,
          symbol: bearTokenFields.symbol,
          balance: 0, // This would be user-specific, set to 0 for now
          price:
            parseFloat(poolFields.bear_reserve) /
              parseFloat(bearTokenFields.total_supply) || 1,
          vault_creator: poolFields.vault_creator,
          vault_fee: 0, // Not stored in token anymore
          vault_creator_fee: parseInt(poolFields.vault_creator_fee),
          treasury_fee: parseInt(poolFields.treasury_fee),
          asset_balance: parseInt(poolFields.bear_reserve),
          supply: parseInt(bearTokenFields.total_supply),
          prediction_pool: objectID,
          other_token: bullTokenFields.id.id,
        };

        // Calculate percentages based on reserves
        const bullReserve = parseInt(poolFields.bull_reserve);
        const bearReserve = parseInt(poolFields.bear_reserve);
        const totalReserves = bullReserve + bearReserve;

        const bullPercentage =
          totalReserves > 0 ? (bullReserve / totalReserves) * 100 : 50;
        const bearPercentage = 100 - bullPercentage;
        const newPool: Pool = {
          id: objectID,
          name: poolFields.name,
          description: poolFields.description,
          asset_id: poolFields.asset_id,
          current_price: parseInt(poolFields.current_price),
          bullToken,
          bearToken,
          bull_reserve: bullReserve,
          bear_reserve: bearReserve,
          vault_creator_fee: parseInt(poolFields.vault_creator_fee),
          treasury_fee: parseInt(poolFields.treasury_fee),
          vault_creator: poolFields.vault_creator,
          treasury: poolFields.treasury,
          bullPercentage,
          bearPercentage,
          totalValue: totalReserves,
        };

        setPool(newPool);
      } catch (err) {
        console.error("Error fetching prediction pool:", err);
        setError("Failed to fetch prediction pool.");
      } finally {
        setLoading(false);
      }
    };

    fetchPredictionPool();
  }, [params]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-xl">Loading pool data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-xl">Pool data not available</div>
      </div>
    );
  }

  // Prepare fees data (converting from basis points to percentages)
  const fees = {
    entry: pool.vault_creator_fee / 100, // Convert basis points to percentage
    exit: pool.vault_creator_fee / 100, // Convert basis points to percentage
    performance: pool.treasury_fee / 100, // Convert basis points to percentage
  };

  return (
    <>
      <Navbar />
      <InteractionClient
        tokens={{
          bullToken: pool.bullToken,
          bearToken: pool.bearToken,
        }}
        vault={{
          id: pool.id,
          asset_id: pool.asset_id,
          bullToken: pool.bullToken,
          bearToken: pool.bearToken,
          bullPercentage: pool.bullPercentage,
          bearPercentage: pool.bearPercentage,
          totalValue: pool.totalValue,
          fees,
          previous_price: pool.current_price,
          vault_creator: pool.vault_creator,
        }}
      />
      <Footer />
    </>
  );
};

export default UseFatePools;
