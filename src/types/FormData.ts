export type FormData = {
  poolName: string;
  poolDescription?: string;
  assetId?: string;
  bullCoinName: string;
  bullCoinSymbol: string;
  bearCoinName: string;
  bearCoinSymbol: string;
  creatorAddress: string;
  creatorStakeFee: string;
  creatorUnstakeFee: string;
  stakeFee: string;
  unstakeFee: string;
  treasuryAddress?: string;
  priceInfoObjectId: string;
};