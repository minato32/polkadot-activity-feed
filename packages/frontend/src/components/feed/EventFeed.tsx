"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChainEvent } from "@polkadot-feed/shared";
import { EventCard } from "./EventCard";
import { EventDetail } from "./EventDetail";
import { useLabels } from "@/hooks/useLabels";

const ITEM_HEIGHT = 96; // estimated px per item
const VISIBLE_COUNT = 20;
const BUFFER = 10; // items above/below visible window

interface EventFeedProps {
  initialEvents: ChainEvent[];
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  isLoading?: boolean;
}

/** Number of skeleton items to show matching viewport */
function getSkeletonCount(): number {
  if (typeof window === "undefined") return 8;
  return Math.ceil(window.innerHeight / ITEM_HEIGHT);
}

export function EventFeed({
  initialEvents,
  hasMore,
  onLoadMore,
  isLoading = false,
}: EventFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const { getLabel } = useLabels();

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Intersection Observer — auto-load more when sentinel visible
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          void onLoadMore().finally(() => {
            loadingMoreRef.current = false;
          });
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading && initialEvents.length === 0) {
    const skeletonCount = getSkeletonCount();
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
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

  // Virtual scrolling: compute visible window
  const totalItems = initialEvents.length;
  const totalHeight = totalItems * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIndex = Math.min(
    totalItems - 1,
    startIndex + VISIBLE_COUNT + BUFFER * 2,
  );

  const visibleEvents = initialEvents.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative overflow-auto"
      style={{ maxHeight: "80vh" }}
    >
      {/* Full-height spacer for scroll */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleEvents.map((event, localIdx) => {
          const absoluteIdx = startIndex + localIdx;
          const top = absoluteIdx * ITEM_HEIGHT;
          const isExpanded = expandedId === event.id;

          return (
            <div
              key={event.id}
              style={{ position: "absolute", top, left: 0, right: 0 }}
            >
              <EventCard
                event={event}
                isExpanded={isExpanded}
                onToggle={() => handleToggle(event.id)}
                getLabel={getLabel}
              />
              {isExpanded && (
                <EventDetail event={event} getLabel={getLabel} />
              )}
            </div>
          );
        })}
      </div>

      {/* Sentinel for Intersection Observer auto-load */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <span className="text-xs text-gray-600">Loading more…</span>
        </div>
      )}
    </div>
  );
}
