"use client";

import type { ChainId, EventType, Significance } from "@polkadot-feed/shared";
import { MVP_CHAINS, EVENT_CATEGORIES, CATEGORY_EVENT_TYPES } from "@polkadot-feed/shared";
import type { FeedFilterState } from "./FeedPage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface FeedFiltersProps {
  filters: FeedFilterState;
  onChange: (filters: FeedFilterState) => void;
}

const SIGNIFICANCE_OPTIONS: { value: Significance; label: string }[] = [
  { value: 0, label: "All" },
  { value: 1, label: "Notable+" },
  { value: 2, label: "Major only" },
];

export function FeedFilters({ filters, onChange }: FeedFiltersProps) {
  const toggleChain = (chainId: ChainId) => {
    const next = filters.chains.includes(chainId)
      ? filters.chains.filter((c) => c !== chainId)
      : [...filters.chains, chainId];
    onChange({ ...filters, chains: next });
  };

  const toggleCategory = (eventTypes: EventType[]) => {
    const allSelected = eventTypes.every((et) => filters.eventTypes.includes(et));
    if (allSelected) {
      onChange({
        ...filters,
        eventTypes: filters.eventTypes.filter((et) => !eventTypes.includes(et)),
      });
    } else {
      const merged = Array.from(new Set([...filters.eventTypes, ...eventTypes]));
      onChange({ ...filters, eventTypes: merged });
    }
  };

  const isCategoryActive = (eventTypes: EventType[]) =>
    eventTypes.every((et) => filters.eventTypes.includes(et));

  const hasActiveFilters =
    filters.chains.length > 0 ||
    filters.eventTypes.length > 0 ||
    filters.minSignificance > 0;

  const clearFilters = () =>
    onChange({ chains: [], eventTypes: [], minSignificance: 0 });

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
        {/* Chain filter */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Chains
          </p>
          <div className="flex flex-wrap gap-2">
            {MVP_CHAINS.map((chain) => {
              const active = filters.chains.includes(chain.id);
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

        {/* Category filter */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((category) => {
              const categoryTypes = CATEGORY_EVENT_TYPES[category];
              const active = isCategoryActive(categoryTypes);
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(categoryTypes)}
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

        {/* Significance filter */}
        <div className="shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Significance
          </p>
          <div className="flex gap-2">
            {SIGNIFICANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filters, minSignificance: opt.value })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  filters.minSignificance === opt.value
                    ? "border-gray-400 bg-gray-700 text-gray-100"
                    : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
