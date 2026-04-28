import type { ChainConfig } from "./types.js";

export const MVP_CHAINS: ChainConfig[] = [
  {
    id: "polkadot",
    name: "Polkadot",
    wsEndpoint: "wss://polkadot.api.onfinality.io/public-ws",
    color: "#E6007A",
  },
  {
    id: "asset-hub",
    name: "Asset Hub",
    wsEndpoint: "wss://statemint.api.onfinality.io/public-ws",
    color: "#00B2FF",
  },
  {
    id: "moonbeam",
    name: "Moonbeam",
    wsEndpoint: "wss://moonbeam.api.onfinality.io/public-ws",
    color: "#53CBC9",
  },
  {
    id: "hydration",
    name: "Hydration",
    wsEndpoint: "wss://hydradx.api.onfinality.io/public-ws",
    color: "#4CFAC7",
  },
  {
    id: "acala",
    name: "Acala",
    wsEndpoint: "wss://acala-polkadot.api.onfinality.io/public-ws",
    color: "#E40C5B",
  },
];

export const CHAIN_MAP = new Map(MVP_CHAINS.map((c) => [c.id, c]));
