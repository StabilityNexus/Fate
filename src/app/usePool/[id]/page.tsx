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
  bullToken: Token;
  bearToken: Token;
  bullPercentage: number;
  bearPercentage: number;
  previous_price: number;
  vault_creator: string;
  vault_fee: number;
  vault_creator_fee: number;
  treasury_fee: number;
  totalValue: number;
}

const calculateTokenValue = (token: Token) => {
  // Simple calculation - can be replaced with actual pricing logic
  return token.supply > 0 ? (token.asset_balance / token.supply) : 1;
};

const UseFatePools = () => {
  const params = useParams();
  const [pool, setPool] = useState<Pool>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = new SuiClient({
    url: "https://fullnode.testnet.sui.io",
  });

  useEffect(() => {
    const fetchAllPredictionPools = async () => {
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
        if (!response.data?.content) {
          throw new Error("No content found in response");
        }

        const poolFields = (response.data.content as any).fields;

        // Fetch token details in parallel
        const [bullResponse, bearResponse] = await Promise.all([
          client.getObject({
            id: poolFields.bull_token_id,
            options: { showContent: true },
          }),
          client.getObject({
            id: poolFields.bear_token_id,
            options: { showContent: true },
          }),
        ]);
        if (!bullResponse.data?.content || !bearResponse.data?.content) {
          throw new Error("Failed to fetch token details");
        }

        const parseTokenData = (tokenData: any): Token => ({
          id: tokenData.fields.id.id,
          name: tokenData.fields.name,
          symbol: tokenData.fields.symbol,
          balance: parseInt(tokenData.fields.supply),
          price: calculateTokenValue({
            supply: parseInt(tokenData.fields.supply),
            asset_balance: parseInt(tokenData.fields.asset_balance),
          } as Token),
          vault_creator: tokenData.fields.vault_creator,
          vault_fee: parseInt(tokenData.fields.vault_fee),
          vault_creator_fee: parseInt(tokenData.fields.vault_creator_fee),
          treasury_fee: parseInt(tokenData.fields.treasury_fee),
          asset_balance: parseInt(tokenData.fields.asset_balance),
          supply: parseInt(tokenData.fields.supply),
          prediction_pool: tokenData.fields.prediction_pool,
          other_token: tokenData.fields.other_token,
        });

        const bullToken = parseTokenData(bullResponse.data.content);
        const bearToken = parseTokenData(bearResponse.data.content);

        // Calculate percentages based on actual token values
        const totalValue = bullToken.price * bullToken.balance + bearToken.price * bearToken.balance;
        const bullPercentage = totalValue > 0 ?
          (bullToken.price * bullToken.balance) / totalValue * 100 : 50;
        const bearPercentage = 100 - bullPercentage;

        const newPool: Pool = {
          id: objectID,
          bullToken,
          bearToken,
          bullPercentage,
          bearPercentage,
          previous_price: parseInt(poolFields.previous_price),
          vault_creator: poolFields.vault_creator,
          vault_fee: parseInt(poolFields.vault_fee),
          vault_creator_fee: parseInt(poolFields.vault_creator_fee),
          treasury_fee: parseInt(poolFields.treasury_fee),
          totalValue,
        };

        setPool(newPool);

      } catch (err) {
        console.error("Error fetching prediction pool:", err);
        setError("Failed to fetch prediction pool.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllPredictionPools();
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
    entry: pool.vault_fee / 100,       // 3 => 0.03%
    exit: pool.vault_fee / 100,         // 3 => 0.03%
    performance: pool.vault_creator_fee / 100  // 1 => 0.01%
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
          bullToken: pool.bullToken,
          bearToken: pool.bearToken,
          bullPercentage: pool.bullPercentage,
          bearPercentage: pool.bearPercentage,
          totalValue: pool.totalValue,
          fees,
          previous_price: pool.previous_price,
          vault_creator: pool.vault_creator
        }}
      />
      <Footer />
    </>
  );
};

export default UseFatePools;