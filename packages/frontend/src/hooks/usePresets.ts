"use client";

import { useState, useEffect, useCallback } from "react";
import type { FilterPreset, EventFilter, TierLimits, UserTier } from "@polkadot-feed/shared";
import { fetchWithAuth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const TIER_PRESET_LIMITS: Record<UserTier, TierLimits> = {
  free: { wallets: 3, presets: 3 },
  pro: { wallets: 20, presets: 20 },
  whale: { wallets: 100, presets: 100 },
  enterprise: { wallets: null, presets: null },
};

interface UsePresetsResult {
  presets: FilterPreset[];
  isLoading: boolean;
  error: string | null;
  tierLimit: TierLimits;
  createPreset: (name: string, filters: EventFilter) => Promise<FilterPreset>;
  updatePreset: (id: string, data: Partial<{ name: string; filters: EventFilter; isDefault: boolean }>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePresets(tier: UserTier = "free"): UsePresetsResult {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tierLimit = TIER_PRESET_LIMITS[tier];

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/presets`);
      if (!res.ok) throw new Error("Failed to load presets");
      const data = (await res.json()) as FilterPreset[];
      setPresets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createPreset = useCallback(
    async (name: string, filters: EventFilter): Promise<FilterPreset> => {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/presets`, {
        method: "POST",
        body: JSON.stringify({ name, filters }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to create preset");
      }
      const created = (await res.json()) as FilterPreset;
      setPresets((prev) => [...prev, created]);
      return created;
    },
    [],
  );

  const updatePreset = useCallback(
    async (id: string, data: Partial<{ name: string; filters: EventFilter; isDefault: boolean }>) => {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/presets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update preset");
      const updated = (await res.json()) as FilterPreset;
      setPresets((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    [],
  );

  const deletePreset = useCallback(async (id: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/presets/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete preset");
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { presets, isLoading, error, tierLimit, createPreset, updatePreset, deletePreset, refresh };
}
