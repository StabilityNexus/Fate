/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

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

export interface UserBalances {
  bull_tokens: number;
  bear_tokens: number;
}

interface UsePoolResult {
  pool: Pool | null;
  userBalances: UserBalances;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePool = (
  id: string | undefined,
  userAddress?: string | undefined
): UsePoolResult => {
  const [pool, setPool] = useState<Pool | null>(null);
  const [userBalances, setUserBalances] = useState<UserBalances>({
    bull_tokens: 0,
    bear_tokens: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID;

  const fetchUserBalances = async (
    client: SuiClient,
    poolObjectId: string,
    userAddr: string
  ): Promise<UserBalances> => {
    if (!packageId) {
      console.warn("Package ID not found in environment variables");
      return { bull_tokens: 0, bear_tokens: 0 };
    }

    try {
      // Use Transaction (matching your working code)
      const tx = new Transaction();

      tx.moveCall({
        target: `${packageId}::prediction_pool::get_user_balances`,
        arguments: [tx.object(poolObjectId), tx.pure.address(userAddr)],
      });

      console.log(
        "Calling move function:",
        `${packageId}::prediction_pool::get_user_balances`
      );
      console.log("With pool ID:", poolObjectId);
      console.log("With user address:", userAddr);

      const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddr,
      });

      console.log("Dev inspect result:", result);

      // Check for errors in the result
      if (result.error) {
        console.error("Move call error:", result.error);
        return { bull_tokens: 0, bear_tokens: 0 };
      }

      if (result.results && result.results[0]) {
        const moveResult = result.results[0];

        // Check if the move call was successful
        if (moveResult.returnValues && moveResult.returnValues.length >= 2) {
          const returnValues = moveResult.returnValues;

          function parseU64LEBigInt(bytes: any) {
            return new DataView(new Uint8Array(bytes).buffer).getBigUint64(
              0,
              true
            );
          }

          const bullTokens = returnValues[0]
            ? parseU64LEBigInt(returnValues[0][0])
            : BigInt(0);

          const bearTokens = returnValues[0]
            ? parseU64LEBigInt(returnValues[1][0])
            : BigInt(0);

          console.log("Parsed balances:", { bullTokens, bearTokens });

          return {
            bull_tokens: Number(bullTokens),
            bear_tokens: Number(bearTokens),
          };
        } else {
          console.warn("No return values found in result");
        }
      }

      return { bull_tokens: 0, bear_tokens: 0 };
    } catch (error) {
      console.error("Error fetching user balances:", error);

      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      return { bull_tokens: 0, bear_tokens: 0 };
    }
  };

  const fetchData = useCallback(async () => {
    if (!id) {
      setError("Missing pool ID.");
      return;
    }

    console.log("Fetching pool data for ID:", id);
    console.log("Package ID:", packageId);
    console.log("User address:", userAddress);

    setLoading(true);
    setError(null);

    try {
      const client = new SuiClient({
        url: "https://fullnode.testnet.sui.io:443", // Add port for clarity
      });
      const objectID = decodeURIComponent(id);

      console.log("Fetching pool object:", objectID);

      const response = await client.getObject({
        id: objectID,
        options: { showContent: true },
      });

      console.log("Pool object response:", response);

      if (
        !response.data?.content ||
        response.data.content.dataType !== "moveObject"
      ) {
        throw new Error("No pool content found in response");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const poolFields = (response.data.content as any).fields;
      const poolData = poolFields as Pool;
      setPool(poolData);

      console.log("Pool data loaded successfully:", poolData.name);

      // Fetch user balances if both userAddress and packageId are available
      if (userAddress && packageId) {
        console.log("Fetching user balances...");
        try {
          const balances = await fetchUserBalances(
            client,
            objectID,
            userAddress
          );
          setUserBalances(balances);
          console.log("User balances loaded:", balances);
        } catch (balanceError) {
          console.warn("Failed to fetch user balances:", balanceError);
          // Don't set error state, just keep default balances
        }
      } else {
        console.log("Skipping user balance fetch:", {
          hasUserAddress: !!userAddress,
          hasPackageId: !!packageId,
        });
      }
    } catch (err) {
      console.error("Error in fetchData:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [id, userAddress, packageId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return {
    pool,
    userBalances,
    loading,
    error,
    refetch,
  };
};
