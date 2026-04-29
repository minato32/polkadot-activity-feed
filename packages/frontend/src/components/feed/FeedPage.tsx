"use client";

import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { EventFeed } from "./EventFeed";
import { FeedFilters } from "./FeedFilters";
import type { ChainId, EventType, Significance } from "@polkadot-feed/shared";

export interface FeedFilterState {
  chains: ChainId[];
  eventTypes: EventType[];
  minSignificance: Significance;
  accounts?: string[];
}

const DEFAULT_FILTERS: FeedFilterState = {
  chains: [],
  eventTypes: [],
  minSignificance: 0,
};

export function FeedPage() {
  const [filters, setFilters] = useState<FeedFilterState>(DEFAULT_FILTERS);
  const { events, hasMore, isLoading, loadMore } = useEvents(filters);

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Polkadot Activity Feed
        </h1>
        <p className="text-sm text-gray-400 sm:text-base">
          Real-time events across Polkadot parachains
        </p>
      </div>

      <FeedFilters filters={filters} onChange={setFilters} />

      <div className="mt-4">
        <EventFeed
          initialEvents={events}
          hasMore={hasMore}
          onLoadMore={loadMore}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}
