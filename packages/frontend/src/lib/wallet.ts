/**
 * Polkadot wallet extension detection and interaction.
 * Supports Talisman, SubWallet, and polkadot.js extensions via window.injectedWeb3.
 */

export interface InjectedExtension {
  name: string;
  displayName: string;
  accounts: {
    get: () => Promise<InjectedAccount[]>;
  };
  signer: {
    signRaw?: (payload: SignRawPayload) => Promise<SignRawResult>;
  };
}

export interface InjectedAccount {
  address: string;
  name?: string;
  type?: string;
}

interface SignRawPayload {
  address: string;
  data: string;
  type: "bytes";
}

interface SignRawResult {
  signature: string;
}

declare global {
  interface Window {
    injectedWeb3?: Record<string, { enable: (origin: string) => Promise<InjectedExtension> }>;
  }
}

const KNOWN_EXTENSIONS: Record<string, string> = {
  "talisman": "Talisman",
  "subwallet-js": "SubWallet",
  "polkadot-js": "Polkadot.js",
};

export function detectWallets(): string[] {
  if (typeof window === "undefined" || !window.injectedWeb3) return [];
  return Object.keys(window.injectedWeb3).filter((key) => key in KNOWN_EXTENSIONS);
}

export function getWalletDisplayName(key: string): string {
  return KNOWN_EXTENSIONS[key] ?? key;
}

export async function enableExtension(key: string): Promise<InjectedExtension> {
  if (!window.injectedWeb3?.[key]) {
    throw new Error(`Extension "${key}" not found`);
  }
  return window.injectedWeb3[key].enable("Polkadot Activity Feed");
}

export async function signMessage(
  extension: InjectedExtension,
  address: string,
  message: string,
): Promise<string> {
  if (!extension.signer.signRaw) {
    throw new Error("Extension does not support signRaw");
  }
  const { signature } = await extension.signer.signRaw({
    address,
    data: message,
    type: "bytes",
  });
  return signature;
}
