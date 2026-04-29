import type { ChainConfig, ChainId, ExpandedChainId } from "./types.js";

/** Chain config that can represent both MVP and expanded chains */
export interface ExpandedChainConfig extends Omit<ChainConfig, "id"> {
  id: ExpandedChainId;
}

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

/** Additional chains beyond the MVP set */
export const EXPANDED_CHAINS: ExpandedChainConfig[] = [
  {
    id: "astar",
    name: "Astar",
    displayName: "Astar Network",
    wsEndpoint: "wss://astar.api.onfinality.io/public-ws",
    ss58Prefix: 5,
    nativeToken: "ASTR",
    decimals: 18,
    color: "#00E8FF",
  },
  {
    id: "phala",
    name: "Phala",
    displayName: "Phala Network",
    wsEndpoint: "wss://api.phala.network/ws",
    ss58Prefix: 30,
    nativeToken: "PHA",
    decimals: 12,
    color: "#C2F848",
  },
  {
    id: "interlay",
    name: "Interlay",
    displayName: "Interlay (iBTC)",
    wsEndpoint: "wss://api.interlay.io/parachain",
    ss58Prefix: 2032,
    nativeToken: "INTR",
    decimals: 10,
    color: "#1A3966",
  },
  {
    id: "centrifuge",
    name: "Centrifuge",
    displayName: "Centrifuge",
    wsEndpoint: "wss://fullnode.centrifuge.io",
    ss58Prefix: 36,
    nativeToken: "CFG",
    decimals: 18,
    color: "#FF8C00",
  },
  {
    id: "bifrost",
    name: "Bifrost",
    displayName: "Bifrost Polkadot",
    wsEndpoint: "wss://bifrost-polkadot.api.onfinality.io/public-ws",
    ss58Prefix: 6,
    nativeToken: "BNC",
    decimals: 12,
    color: "#5A4AE3",
  },
  {
    id: "zeitgeist",
    name: "Zeitgeist",
    displayName: "Zeitgeist",
    wsEndpoint: "wss://main.rpc.zeitgeist.pm/ws",
    ss58Prefix: 73,
    nativeToken: "ZTG",
    decimals: 10,
    color: "#0001FE",
  },
  {
    id: "pendulum",
    name: "Pendulum",
    displayName: "Pendulum",
    wsEndpoint: "wss://rpc-pendulum.prd.pendulumchain.tech",
    ss58Prefix: 56,
    nativeToken: "PEN",
    decimals: 12,
    color: "#7A36A6",
  },
  {
    id: "unique",
    name: "Unique",
    displayName: "Unique Network",
    wsEndpoint: "wss://unique-rpc.unique.network",
    ss58Prefix: 7391,
    nativeToken: "UNQ",
    decimals: 18,
    color: "#00BFFF",
  },
  {
    id: "kilt",
    name: "KILT",
    displayName: "KILT Spiritnet",
    wsEndpoint: "wss://spiritnet.api.onfinality.io/public-ws",
    ss58Prefix: 38,
    nativeToken: "KILT",
    decimals: 15,
    color: "#8B2BE2",
  },
  {
    id: "nodle",
    name: "Nodle",
    displayName: "Nodle Network",
    wsEndpoint: "wss://nodle-parachain.api.onfinality.io/public-ws",
    ss58Prefix: 37,
    nativeToken: "NODL",
    decimals: 11,
    color: "#00D4AA",
  },
];

/** All chains: MVP + expanded */
export const ALL_CHAINS: ExpandedChainConfig[] = [
  ...MVP_CHAINS,
  ...EXPANDED_CHAINS,
];

/** Map of expanded chain ID to config */
export const EXPANDED_CHAIN_MAP = new Map<ExpandedChainId, ExpandedChainConfig>(
  ALL_CHAINS.map((c) => [c.id, c]),
);

/** All expanded chain IDs */
export const ALL_CHAIN_IDS: ExpandedChainId[] = ALL_CHAINS.map((c) => c.id);
