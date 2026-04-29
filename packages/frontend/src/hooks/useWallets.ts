"use client";

import { useState, useEffect, useCallback } from "react";
import type { FollowedWallet, TierLimits, UserTier } from "@polkadot-feed/shared";
import { fetchWithAuth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: { wallets: 3, presets: 3 },
  pro: { wallets: 20, presets: 20 },
  whale: { wallets: 100, presets: 100 },
  enterprise: { wallets: null, presets: null },
};

interface UseWalletsResult {
  wallets: FollowedWallet[];
  isLoading: boolean;
  error: string | null;
  tierLimit: TierLimits;
  addWallet: (address: string, label?: string) => Promise<void>;
  removeWallet: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWallets(tier: UserTier = "free"): UseWalletsResult {
  const [wallets, setWallets] = useState<FollowedWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tierLimit = TIER_LIMITS[tier];

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/wallets`);
      if (!res.ok) throw new Error("Failed to load wallets");
      const data = (await res.json()) as FollowedWallet[];
      setWallets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addWallet = useCallback(
    async (address: string, label?: string) => {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/wallets`, {
        method: "POST",
        body: JSON.stringify({ address, label }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to add wallet");
      }
      const added = (await res.json()) as FollowedWallet;
      setWallets((prev) => [...prev, added]);
    },
    [],
  );

  const removeWallet = useCallback(async (id: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/wallets/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to remove wallet");
    setWallets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return { wallets, isLoading, error, tierLimit, addWallet, removeWallet, refresh };
}
