import type { ChainConfig, ChainId } from "./types.js";

export const MVP_CHAINS: ChainConfig[] = [
  {
    id: "polkadot",
    name: "Polkadot",
    displayName: "Polkadot Relay Chain",
    wsEndpoint: "wss://polkadot.api.onfinality.io/public-ws",
    ss58Prefix: 0,
    nativeToken: "DOT",
    decimals: 10,
    color: "#E6007A",
  },
  {
    id: "asset-hub",
    name: "Asset Hub",
    displayName: "Polkadot Asset Hub",
    wsEndpoint: "wss://statemint.api.onfinality.io/public-ws",
    ss58Prefix: 0,
    nativeToken: "DOT",
    decimals: 10,
    color: "#00B2FF",
  },
  {
    id: "moonbeam",
    name: "Moonbeam",
    displayName: "Moonbeam",
    wsEndpoint: "wss://moonbeam.api.onfinality.io/public-ws",
    ss58Prefix: 1284,
    nativeToken: "GLMR",
    decimals: 18,
    color: "#53CBC9",
  },
  {
    id: "hydration",
    name: "Hydration",
    displayName: "Hydration (HydraDX)",
    wsEndpoint: "wss://hydradx.api.onfinality.io/public-ws",
    ss58Prefix: 63,
    nativeToken: "HDX",
    decimals: 12,
    color: "#4CFAC7",
  },
  {
    id: "acala",
    name: "Acala",
    displayName: "Acala Network",
    wsEndpoint: "wss://acala-polkadot.api.onfinality.io/public-ws",
    ss58Prefix: 10,
    nativeToken: "ACA",
    decimals: 12,
    color: "#E40C5B",
  },
];

/** Map of chain ID to config for quick lookups */
export const CHAIN_MAP = new Map<ChainId, ChainConfig>(
  MVP_CHAINS.map((c) => [c.id, c]),
);

/** All MVP chain IDs */
export const MVP_CHAIN_IDS: ChainId[] = MVP_CHAINS.map((c) => c.id);
