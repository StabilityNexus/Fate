"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InteractionClient from "./InteractionClient";
import { useParams } from "next/navigation";
import { usePool } from "@/fateHooks/usePool";

const UseFatePools = () => {
  const params = useParams();
  const { pool, loading, error } = usePool(params?.id as string);

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

  const fees = {
    entry: parseInt(pool.pool_creator_fee) / 100,
    exit: parseInt(pool.pool_creator_fee) / 100,
    performance: parseInt(pool.protocol_fee) / 100,
  };

  const bullReserve = parseInt(pool.bull_reserve);
  const bearReserve = parseInt(pool.bear_reserve);
  const totalReserves = bullReserve + bearReserve;
  const bullPercentage =
    totalReserves > 0 ? (bullReserve / totalReserves) * 100 : 50;
  const bearPercentage = 100 - bullPercentage;

  return (
    <>
      <Navbar />
      <InteractionClient
        tokens={{
          bullToken: {
            id: pool.bull_token.fields.id.id,
            name: pool.bull_token.fields.name,
            symbol: pool.bull_token.fields.symbol,
            balance: 0,
            price:
              bullReserve /
                parseInt(pool.bull_token.fields.total_supply) || 1,
            vault_creator: pool.pool_creator,
            vault_fee: 0,
            vault_creator_fee: parseInt(pool.pool_creator_fee),
            treasury_fee: parseInt(pool.protocol_fee),
            asset_balance: bullReserve,
            supply: parseInt(pool.bull_token.fields.total_supply),
            prediction_pool: pool.id.id,
            other_token: pool.bear_token.fields.id.id,
          },
          bearToken: {
            id: pool.bear_token.fields.id.id,
            name: pool.bear_token.fields.name,
            symbol: pool.bear_token.fields.symbol,
            balance: 0,
            price:
              bearReserve /
                parseInt(pool.bear_token.fields.total_supply) || 1,
            vault_creator: pool.pool_creator,
            vault_fee: 0,
            vault_creator_fee: parseInt(pool.pool_creator_fee),
            treasury_fee: parseInt(pool.protocol_fee),
            asset_balance: bearReserve,
            supply: parseInt(pool.bear_token.fields.total_supply),
            prediction_pool: pool.id.id,
            other_token: pool.bull_token.fields.id.id,
          },
        }}
        vault={{
          id: pool.id.id,
          asset_id: pool.asset_address,
          bullToken: {
            id: pool.bull_token.fields.id.id,
            name: pool.bull_token.fields.name,
            symbol: pool.bull_token.fields.symbol,
            balance: 0,
            price:
              bullReserve /
                parseInt(pool.bull_token.fields.total_supply) || 1,
            vault_creator: pool.pool_creator,
            vault_fee: 0,
            vault_creator_fee: parseInt(pool.pool_creator_fee),
            treasury_fee: parseInt(pool.protocol_fee),
            asset_balance: bullReserve,
            supply: parseInt(pool.bull_token.fields.total_supply),
            prediction_pool: pool.id.id,
            other_token: pool.bear_token.fields.id.id,
          },
          bearToken: {
            id: pool.bear_token.fields.id.id,
            name: pool.bear_token.fields.name,
            symbol: pool.bear_token.fields.symbol,
            balance: 0,
            price:
              bearReserve /
                parseInt(pool.bear_token.fields.total_supply) || 1,
            vault_creator: pool.pool_creator,
            vault_fee: 0,
            vault_creator_fee: parseInt(pool.pool_creator_fee),
            treasury_fee: parseInt(pool.protocol_fee),
            asset_balance: bearReserve,
            supply: parseInt(pool.bear_token.fields.total_supply),
            prediction_pool: pool.id.id,
            other_token: pool.bull_token.fields.id.id,
          },
          bullPercentage,
          bearPercentage,
          totalValue: totalReserves,
          fees,
          previous_price: parseInt(pool.current_price),
          vault_creator: pool.pool_creator,
        }}
      />
      <Footer />
    </>
  );
};

export default UseFatePools;
