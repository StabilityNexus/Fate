"use client";
import { useEffect, useState } from "react";
import { PredictionCard } from "@/components/FatePoolCard/FatePoolCard";
import { Search, Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

interface Pool {
  id: number;
  name: string;
  bullPercentage: number;
  bearPercentage: number;
  volume?: string;
  participants?: number;
}

const ExploreFatePools = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch pools (replace with actual API call)
    setTimeout(() => {
      setPools([
        {
          id: 1,
          name: "Alpha Pool",
          bullPercentage: 55.5,
          bearPercentage: 44.5,
          volume: "$1.2M",
          participants: 234,
        },
        {
          id: 2,
          name: "Beta Pool",
          bullPercentage: 60.2,
          bearPercentage: 39.8,
          volume: "$890K",
          participants: 156,
        },
        {
          id: 3,
          name: "Gamma Pool",
          bullPercentage: 48.3,
          bearPercentage: 51.7,
          volume: "$2.1M",
          participants: 412,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredPools = pools.filter((pool) =>
    pool.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-green-50 dark:from-green-900 dark:to-teal-900">
        <div className="max-w-7xl mx-auto px-4 py-12 ">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 mt-10">
            <div>
              <h1 className="text-4xl font-bold text-green-900 dark:text-green-100 mb-2">
                Explore Fate Pools
              </h1>
            </div>
            <button className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-md">
              <Plus size={20} />
              Create New Pool
            </button>
          </div>

          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-green-800/30 rounded-xl p-6 shadow-lg">
              <div className="relative ">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search pools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-green-700 bg-white dark:bg-green-800/50 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 outline-none transition-all"
                />
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-green-300">
                    Active Pools
                  </p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-200">
                    {pools.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[400px] bg-white dark:bg-green-800/30 rounded-xl shadow-lg animate-pulse"
                  >
                    <div className="h-48 bg-gray-200 dark:bg-green-700/50 rounded-t-xl" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-200 dark:bg-green-700/50 rounded w-2/3" />
                      <div className="h-4 bg-gray-200 dark:bg-green-700/50 rounded w-1/2" />
                      <div className="h-24 bg-gray-200 dark:bg-green-700/50 rounded" />
                    </div>
                  </div>
                ))
              : filteredPools.map((pool) => (
                  <div key={pool.id} className="">
                    <PredictionCard
                      name={pool.name}
                      bullPercentage={pool.bullPercentage}
                      bearPercentage={pool.bearPercentage}
                      bullCoinName="Bull Coin"
                      bullCoinSymbol="BULL"
                      bearCoinName="Bear Coin"
                      bearCoinSymbol="BEAR"
                      onUse={() => console.log(`Using ${pool.name}`)}
                    />
                  </div>
                ))}
          </div>

          {!loading && filteredPools.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-green-300">
                No pools found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExploreFatePools;
