"use client";

import { useState, useEffect, useCallback } from "react";
import type { XcmCorrelation } from "@polkadot-feed/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
const POLL_INTERVAL_MS = 30_000;

interface UseXcmCorrelationsResult {
  correlations: XcmCorrelation[];
  isLoading: boolean;
  refresh: () => void;
}

export function useXcmCorrelations(): UseXcmCorrelationsResult {
  const [correlations, setCorrelations] = useState<XcmCorrelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/xcm/correlations`);
        if (!res.ok) return;
        const data = (await res.json()) as XcmCorrelation[];
        if (!cancelled) setCorrelations(data);
      } catch {
        // Enhancement only — silent failure
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Periodic refresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return { correlations, isLoading, refresh };
}
