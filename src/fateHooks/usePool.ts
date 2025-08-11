import { useEffect, useState } from "react";
import { SuiClient } from "@mysten/sui.js/client";

interface TokenFields {
  id: {
    id: string;
  };
  name: string;
  symbol: string;
  total_supply: string;
}

interface Token {
  type: string;
  fields: TokenFields;
}

export interface Pool {
  asset_address: string;
  bear_reserve: string;
  bear_token: Token;
  bull_reserve: string;
  bull_token: Token;
  current_price: string;
  description: string;
  id: {
    id: string;
  };
  name: string;
  pool_creator: string;
  pool_creator_fee: string;
  protocol_fee: string;
  stable_order_fee: string;
}

export const usePool = (id: string | undefined) => {
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing object ID.");
      return;
    }

    const fetchPool = async () => {
      setLoading(true);
      setError(null);

      try {
        const client = new SuiClient({
          url: "https://fullnode.testnet.sui.io",
        });
        const objectID = decodeURIComponent(id);

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
        setPool(poolFields as Pool);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPool();
  }, [id]);

  return { pool, loading, error };
};
