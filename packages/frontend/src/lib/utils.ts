import type { Significance } from "@polkadot-feed/shared";

/** Merge Tailwind class strings, filtering out falsy values */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Format an ISO timestamp to a human-readable relative or absolute string */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format an ISO timestamp to a full readable string for tooltips */
export function formatTimestampFull(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/** Truncate a substrate/EVM address to show first 6 and last 4 chars */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Map significance level to a label */
export const SIGNIFICANCE_LABEL: Record<Significance, string> = {
  0: "Normal",
  1: "Notable",
  2: "Major",
};

/** Map significance level to Tailwind color classes */
export const SIGNIFICANCE_COLOR: Record<Significance, string> = {
  0: "text-gray-400",
  1: "text-yellow-400",
  2: "text-red-400",
};

/** Map significance level to dot/ring classes for the indicator */
export const SIGNIFICANCE_DOT: Record<Significance, string> = {
  0: "bg-gray-500",
  1: "bg-yellow-400",
  2: "bg-red-500",
};
