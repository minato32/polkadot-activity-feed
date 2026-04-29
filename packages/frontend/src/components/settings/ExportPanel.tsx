"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MVP_CHAINS, EVENT_CATEGORIES, CATEGORY_EVENT_TYPES } from "@polkadot-feed/shared";
import type { ChainId, EventType, UserTier } from "@polkadot-feed/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const TIER_LIMITS: Record<UserTier, string> = {
  free: "Last 7 days",
  pro: "Last 90 days",
  whale: "Unlimited",
  enterprise: "Unlimited",
};

interface ExportPanelProps {
  tier: UserTier;
}

export function ExportPanel({ tier }: ExportPanelProps) {
  const [selectedChains, setSelectedChains] = useState<ChainId[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const toggleChain = (chainId: ChainId) => {
    setSelectedChains((prev) =>
      prev.includes(chainId) ? prev.filter((c) => c !== chainId) : [...prev, chainId],
    );
  };

  const toggleCategory = (types: EventType[]) => {
    const allActive = types.every((t) => selectedTypes.includes(t));
    setSelectedTypes((prev) =>
      allActive
        ? prev.filter((t) => !types.includes(t))
        : Array.from(new Set([...prev, ...types])),
    );
  };

  const isCategoryActive = (types: EventType[]) =>
    types.every((t) => selectedTypes.includes(t));

  const handleExport = () => {
    const url = new URL("/api/export", BACKEND_URL);
    if (selectedChains.length > 0) url.searchParams.set("chains", selectedChains.join(","));
    if (selectedTypes.length > 0) url.searchParams.set("eventTypes", selectedTypes.join(","));
    if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
    if (dateTo) url.searchParams.set("dateTo", dateTo);
    url.searchParams.set("format", "csv");
    window.open(url.toString(), "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Tier info */}
      <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-3">
        <span className="text-sm text-gray-400">
          Your plan allows exporting:{" "}
          <span className="font-semibold text-gray-100">{TIER_LIMITS[tier]}</span>
        </span>
        <span className="rounded-full border border-gray-700 px-2 py-0.5 text-xs capitalize text-gray-400">
          {tier}
        </span>
      </div>

      {/* Chain filter */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Chains
        </p>
        <div className="flex flex-wrap gap-2">
          {MVP_CHAINS.map((chain) => {
            const active = selectedChains.includes(chain.id);
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
                onClick={() => toggleCategory(types)}
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
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Date Range
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-pink-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-xs text-gray-100 focus:border-pink-500 focus:outline-none"
            />
          </div>
        </div>
        {tier === "free" && (
          <p className="mt-1 text-xs text-gray-600">
            Free tier: date range is limited to the last 7 days.
          </p>
        )}
      </div>

      <Button variant="primary" size="md" onClick={handleExport}>
        Export CSV
      </Button>
    </div>
  );
}
