import { Token } from "./Token";

interface Pool {
  id: string;
  name: string;
  description: string;
  current_price: number;
  asset_id: string;
  creator: string;
  bullPercentage: number;
  bearPercentage: number;
  bull_reserve: number;
  bear_reserve: number;
  bullToken?: Token;
  bearToken?: Token;
  volume?: string;
  participants?: number;
  created_at?: number;
}

interface PoolCreatedEvent {
  pool_id: string;
  name: string;
  creator: string;
  initial_price: number;
}


export type { Pool , PoolCreatedEvent };