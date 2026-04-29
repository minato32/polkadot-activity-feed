"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChainEvent } from "@polkadot-feed/shared";
import { fetchEvents } from "@/lib/api";
import { useEventStream } from "./useEventStream";
import type { FeedFilterState } from "@/components/feed/FeedPage";

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

interface UseEventsResult {
  events: ChainEvent[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => Promise<void>;
}

/** Combines REST pagination with WebSocket live updates, with debounced filter changes */
export function useEvents(filters: FeedFilterState): UseEventsResult {
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  // Deduplicate by id using a set
  const seenIds = useRef<Set<string>>(new Set());
  // Track pending loadMore to prevent double-fetches
  const loadingMore = useRef(false);

  const addEvents = useCallback(
    (incoming: ChainEvent[], prepend = false) => {
      const fresh = incoming.filter((e) => !seenIds.current.has(e.id));
      fresh.forEach((e) => seenIds.current.add(e.id));
      if (fresh.length === 0) return;
      setEvents((prev) =>
        prepend ? [...fresh, ...prev] : [...prev, ...fresh],
      );
    },
    [],
  );

  const filtersKey = JSON.stringify(filters);

  // Debounced initial load and filter change reload
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const doFetch = async () => {
      seenIds.current = new Set();
      setIsLoading(true);
      setEvents([]);
      setCursor(null);

      try {
        const result = await fetchEvents({
          chains: filters.chains.length > 0 ? filters.chains : undefined,
          eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
          minSignificance: filters.minSignificance > 0 ? filters.minSignificance : undefined,
          accounts: filters.accounts && filters.accounts.length > 0 ? filters.accounts : undefined,
          limit: PAGE_SIZE,
        });

        if (cancelled) return;

        result.items.forEach((e) => seenIds.current.add(e.id));
        setEvents(result.items);
        setHasMore(result.hasMore);
        setCursor(result.nextCursor);
      } catch {
        // Silently handle fetch error — feed shows empty state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    timeoutId = setTimeout(() => {
      void doFetch();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMore.current) return;
    loadingMore.current = true;
    try {
      const result = await fetchEvents({
        chains: filters.chains.length > 0 ? filters.chains : undefined,
        eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
        minSignificance: filters.minSignificance > 0 ? filters.minSignificance : undefined,
        accounts: filters.accounts && filters.accounts.length > 0 ? filters.accounts : undefined,
        limit: PAGE_SIZE,
        cursor,
      });
      addEvents(result.items);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch {
      // Error handled silently; user can retry via the button
    } finally {
      loadingMore.current = false;
    }
  }, [hasMore, cursor, filters, addEvents]);

  // WebSocket live updates
  const subscribePayload = {
    chains: filters.chains.length > 0 ? filters.chains : undefined,
    eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
    minSignificance: filters.minSignificance > 0 ? filters.minSignificance : undefined,
  };

  useEventStream({
    subscribePayload,
    onEvent: (event) => addEvents([event], true),
  });

  return { events, hasMore, isLoading, loadMore };
}
