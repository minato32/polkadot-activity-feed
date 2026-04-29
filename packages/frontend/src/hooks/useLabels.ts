"use client";

import { useState, useEffect, useCallback } from "react";
import type { WhaleLabel } from "@polkadot-feed/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface UseLabelsResult {
  labels: Map<string, WhaleLabel>;
  isLoading: boolean;
  getLabel: (address: string) => WhaleLabel | undefined;
}

/** Fetch all whale labels once on mount and build an address→label map. */
export function useLabels(): UseLabelsResult {
  const [labels, setLabels] = useState<Map<string, WhaleLabel>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/labels`);
        if (!res.ok) return;
        const data = (await res.json()) as WhaleLabel[];
        if (cancelled) return;
        const map = new Map<string, WhaleLabel>();
        for (const wl of data) {
          map.set(wl.address, wl);
        }
        setLabels(map);
      } catch {
        // Silently ignore — labels are enhancement only
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const getLabel = useCallback(
    (address: string) => labels.get(address),
    [labels],
  );

  return { labels, isLoading, getLabel };
}
