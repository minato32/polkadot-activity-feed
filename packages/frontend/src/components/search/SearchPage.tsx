"use client";

import { useState } from "react";
import { useSearch } from "@/hooks/useSearch";
import { EventCard } from "@/components/feed/EventCard";
import { EventDetail } from "@/components/feed/EventDetail";
import { useLabels } from "@/hooks/useLabels";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MVP_CHAINS, EVENT_CATEGORIES, CATEGORY_EVENT_TYPES } from "@polkadot-feed/shared";
import type { ChainId, EventType } from "@polkadot-feed/shared";

const SUGGESTIONS = [
  "xcm transfer",
  "governance vote",
  "whale transfer",
  "staking reward",
  "runtime upgrade",
];

export function SearchPage() {
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    search,
    recentSearches,
    clearRecent,
  } = useSearch();

  const { getLabel } = useLabels();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleChain = (chainId: ChainId) => {
    const current = (filters.chains ?? []) as ChainId[];
    const next = current.includes(chainId)
      ? current.filter((c) => c !== chainId)
      : [...current, chainId];
    setFilters({ ...filters, chains: next.length > 0 ? next : undefined });
  };

  const toggleEventType = (types: EventType[]) => {
    const current = filters.eventTypes ?? [];
    const allSelected = types.every((t) => current.includes(t));
    const next = allSelected
      ? current.filter((t) => !types.includes(t))
      : Array.from(new Set([...current, ...types]));
    setFilters({ ...filters, eventTypes: next.length > 0 ? next : undefined });
  };

  const isCategoryActive = (types: EventType[]) => {
    const current = filters.eventTypes ?? [];
    return types.every((t) => current.includes(t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void search(query, filters);
  };

  const handleSuggestion = (s: string) => {
    setQuery(s);
    void search(s, filters);
  };

  const showEmptyState = !isLoading && results.length === 0 && !query.trim();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Search Events</h1>
        <p className="text-gray-400">Full-text search across all Polkadot ecosystem events</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, addresses, transactions…"
            className="w-full rounded-xl border border-gray-700 bg-gray-900 py-4 pl-12 pr-4 text-lg text-gray-100 placeholder-gray-500 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
          {isLoading && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              Searching…
            </span>
          )}
        </div>
      </form>

      {/* Advanced filters toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-100"
        >
          <svg
            className={cn(
              "h-4 w-4 transition-transform",
              showAdvanced && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          Advanced filters
        </button>

        {showAdvanced && (
          <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900/50 p-4 space-y-4">
            {/* Chain filter */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Chains
              </p>
              <div className="flex flex-wrap gap-2">
                {MVP_CHAINS.map((chain) => {
                  const active = ((filters.chains ?? []) as ChainId[]).includes(chain.id);
                  return (
                    <button
                      key={chain.id}
                      onClick={() => toggleChain(chain.id)}
                      style={{
                        borderColor: active ? chain.color : undefined,
                        color: active ? chain.color : undefined,
                        backgroundColor: active ? chain.color + "1A" : undefined,
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        active
                          ? "shadow-sm"
                          : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300",
                      )}
                    >
                      {chain.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event type filter */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Event Types
              </p>
              <div className="flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map((category) => {
                  const types = CATEGORY_EVENT_TYPES[category];
                  const active = isCategoryActive(types);
                  return (
                    <button
                      key={category}
                      onClick={() => toggleEventType(types)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
                        active
                          ? "border-pink-600 bg-pink-600/10 text-pink-400"
                          : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300",
                      )}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date Range
                </p>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, dateFrom: e.target.value || undefined })
                    }
                    className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-pink-500 focus:outline-none"
                  />
                  <span className="self-center text-gray-600">to</span>
                  <input
                    type="date"
                    value={filters.dateTo ?? ""}
                    onChange={(e) =>
                      setFilters({ ...filters, dateTo: e.target.value || undefined })
                    }
                    className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount range */}
              <div className="col-span-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount Range
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.amountMin ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        amountMin: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-pink-500 focus:outline-none"
                  />
                  <span className="self-center text-gray-600">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.amountMax ?? ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        amountMax: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({})}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Recent searches */}
      {recentSearches.length > 0 && !query && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Recent Searches
            </p>
            <button
              onClick={clearRecent}
              className="text-xs text-gray-600 hover:text-gray-400"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-gray-700 px-3 py-1 text-xs text-gray-400 hover:border-gray-500 hover:text-gray-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-gray-800 bg-gray-900"
            />
          ))}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-2">
          <p className="mb-3 text-sm text-gray-500">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((event) => (
            <div key={event.id}>
              <EventCard
                event={event}
                isExpanded={expandedId === event.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === event.id ? null : event.id))
                }
                getLabel={getLabel}
              />
              {expandedId === event.id && (
                <EventDetail event={event} getLabel={getLabel} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {showEmptyState && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-12 text-center">
          <p className="mb-4 text-gray-500">
            Search across all Polkadot parachains. Try one of these:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:border-pink-600 hover:text-pink-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {!isLoading && results.length === 0 && query.trim() && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-12 text-center text-gray-500">
          No results found for &quot;{query}&quot;. Try different keywords or adjust your filters.
        </div>
      )}
    </main>
  );
}
