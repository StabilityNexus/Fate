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
export type { Token };