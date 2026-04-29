"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChainEvent, EventType } from "@polkadot-feed/shared";
import type { ExpandedChainId } from "@polkadot-feed/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
const DEBOUNCE_MS = 500;
const RECENT_KEY = "polkadot_feed_recent_searches";
const MAX_RECENT = 5;

export interface SearchFilters {
  chains?: ExpandedChainId[];
  eventTypes?: EventType[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  results: ChainEvent[];
  isLoading: boolean;
  search: (q: string, f?: SearchFilters) => Promise<void>;
  recentSearches: string[];
  clearRecent: () => void;
}

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveRecent(query: string, current: string[]): string[] {
  const filtered = current.filter((q) => q !== query);
  const next = [query, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export function useSearch(): UseSearchResult {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<ChainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecent);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string, f?: SearchFilters) => {
    const activeFilters = f ?? filters;
    const url = new URL("/api/search", BACKEND_URL);

    if (q.trim()) url.searchParams.set("q", q.trim());
    if (activeFilters.chains?.length) {
      url.searchParams.set("chains", activeFilters.chains.join(","));
    }
    if (activeFilters.eventTypes?.length) {
      url.searchParams.set("eventTypes", activeFilters.eventTypes.join(","));
    }
    if (activeFilters.dateFrom) url.searchParams.set("dateFrom", activeFilters.dateFrom);
    if (activeFilters.dateTo) url.searchParams.set("dateTo", activeFilters.dateTo);
    if (activeFilters.amountMin !== undefined) {
      url.searchParams.set("amountMin", String(activeFilters.amountMin));
    }
    if (activeFilters.amountMax !== undefined) {
      url.searchParams.set("amountMax", String(activeFilters.amountMax));
    }

    setIsLoading(true);
    try {
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = (await res.json()) as { items: ChainEvent[] };
      setResults(data.items ?? []);
      if (q.trim()) {
        setRecentSearches((prev) => saveRecent(q.trim(), prev));
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Debounced search on query/filter changes
  useEffect(() => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void search(query, filters);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(filters)]);

  const clearRecent = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecentSearches([]);
  };

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    search,
    recentSearches,
    clearRecent,
  };
}
