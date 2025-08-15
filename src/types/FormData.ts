export type FormData = {
  poolName: string;
  poolDescription?: string;
  assetId: string;
  assetAddress: string;
  bullCoinName: string;
  bullCoinSymbol: string;
  bearCoinName: string;
  bearCoinSymbol: string;
  protocolFee: string;
  stableOrderFee: string;
  poolCreatorFee: string;
  poolCreatorAddress?: string;
};