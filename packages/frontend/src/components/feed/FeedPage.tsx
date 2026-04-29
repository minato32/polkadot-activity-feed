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
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">
          Polkadot Activity Feed
        </h1>
        <p className="text-gray-400">
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
