"use client";

import { useState } from "react";
import type { ChainEvent } from "@polkadot-feed/shared";
import { EventCard } from "./EventCard";
import { EventDetail } from "./EventDetail";
import { Button } from "@/components/ui/Button";

interface EventFeedProps {
  initialEvents: ChainEvent[];
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  isLoading?: boolean;
}

export function EventFeed({
  initialEvents,
  hasMore,
  onLoadMore,
  isLoading = false,
}: EventFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading && initialEvents.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-gray-800 bg-gray-900"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && initialEvents.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
        No events found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {initialEvents.map((event) => (
        <div key={event.id}>
          <EventCard
            event={event}
            isExpanded={expandedId === event.id}
            onToggle={() => handleToggle(event.id)}
          />
          {expandedId === event.id && (
            <EventDetail event={event} />
          )}
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            size="md"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
