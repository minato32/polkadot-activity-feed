"use client";

import { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

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
    <div className="rounded-lg border border-gray-800 bg-gray-900/50">
      {/* Header with collapse toggle on mobile */}
      <div
        className="flex cursor-pointer items-center justify-between p-3 sm:cursor-default sm:p-4"
        onClick={() => setCollapsed((v) => !v)}
        role="button"
        aria-expanded={!collapsed}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setCollapsed((v) => !v)}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:hidden">
          Filters {hasActiveFilters ? `(${filters.chains.length + (filters.eventTypes.length > 0 ? 1 : 0) + (filters.minSignificance > 0 ? 1 : 0)} active)` : ""}
        </span>
        <svg
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform sm:hidden",
            collapsed && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Filter body — collapsible on mobile */}
      <div className={cn("px-3 pb-3 sm:block sm:p-4 sm:pt-0", collapsed ? "hidden" : "block")}>
        <div className="flex flex-col gap-4">
          {/* Chain filter — horizontally scrollable on mobile */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Chains
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {MVP_CHAINS.map((chain) => {
                const active = filters.chains.includes(chain.id);
                return (
                  <button
                    key={chain.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChain(chain.id);
                    }}
                    style={{
                      borderColor: active ? chain.color : undefined,
                      color: active ? chain.color : undefined,
                      backgroundColor: active ? chain.color + "1A" : undefined,
                    }}
                    className={cn(
                      "min-h-[36px] shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all",
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

          {/* Category + Significance side by side on mobile, stacked options */}
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCategory(categoryTypes);
                      }}
                      className={cn(
                        "min-h-[36px] rounded-full border px-3 py-1 text-xs font-medium capitalize transition-all",
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ ...filters, minSignificance: opt.value });
                    }}
                    className={cn(
                      "min-h-[36px] rounded-full border px-3 py-1 text-xs font-medium transition-all",
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
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); clearFilters(); }}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
