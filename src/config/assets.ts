export interface AssetConfig {
  coinId: string;   
  name: string;     
  color: string;    
}

export const ASSET_CONFIG: Record<string, AssetConfig> = {
  "0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b": {
    coinId: "bitcoin",
    name: "BTC/USD",
    color: "#f7931a",
  },
  "0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6": {
    coinId: "ethereum",
    name: "ETH/USD",
    color: "#627eea",
  },
  "0x73dc009953c83c944690037ea477df627657f45c14f16ad3a61089c5a3f9f4f2": {
    coinId: "cardano",
    name: "ADA/USD",
    color: "#0033ad",
  },
};
