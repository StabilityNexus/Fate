/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";

const usePoolDataChanges = (currentData: any, previousData: any) => {
  return useMemo(() => {
    if (!currentData || !previousData) return { hasChanges: true, changes: {} };

    const changes: Record<string, any> = {};
    const keys = [
      "current_price",
      "bull_reserve",
      "bear_reserve",
      "bull_supply",
      "bear_supply",
    ];

    keys.forEach((key) => {
      if (currentData[key] !== previousData[key]) {
        changes[key] = {
          from: previousData[key],
          to: currentData[key],
        };
      }
    });

    return {
      hasChanges: Object.keys(changes).length > 0,
      changes,
    };
  }, [currentData, previousData]);
};

export { usePoolDataChanges };