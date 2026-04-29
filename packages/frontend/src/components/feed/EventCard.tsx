"use client";

import type { ChainEvent } from "@polkadot-feed/shared";
import { CHAIN_MAP } from "@polkadot-feed/shared";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import {
  formatTimestamp,
  truncateAddress,
  SIGNIFICANCE_LABEL,
  SIGNIFICANCE_DOT,
  cn,
} from "@/lib/utils";

interface EventCardProps {
  event: ChainEvent;
  isExpanded?: boolean;
  onToggle: () => void;
}

/** Human-readable label for an event type */
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Render a small summary of the most important data fields */
function EventSummary({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).slice(0, 3);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
      {entries.map(([key, val]) => (
        <span key={key}>
          <span className="text-gray-600">{key}:</span>{" "}
          <span className="text-gray-400 font-mono">
            {typeof val === "bigint"
              ? val.toString()
              : typeof val === "object"
              ? JSON.stringify(val).slice(0, 40)
              : String(val).slice(0, 40)}
          </span>
        </span>
      ))}
    </div>
  );
}

export function EventCard({ event, onToggle }: EventCardProps) {
  const chain = CHAIN_MAP.get(event.chainId);
  const chainColor = chain?.color ?? "#888";
  const chainName = chain?.name ?? event.chainId;

  return (
    <Card onClick={onToggle} className="group">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chain badge */}
          <Badge
            style={{ backgroundColor: chainColor + "26", color: chainColor }}
            className="font-semibold"
          >
            {chainName}
          </Badge>

          {/* Event type badge */}
          <Badge variant="outline">
            {formatEventType(event.eventType)}
          </Badge>

          {/* Significance indicator */}
          <span className="flex items-center gap-1">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                SIGNIFICANCE_DOT[event.significance],
              )}
            />
            {event.significance > 0 && (
              <span
                className={cn(
                  "text-xs font-medium",
                  event.significance === 2 ? "text-red-400" : "text-yellow-400",
                )}
              >
                {SIGNIFICANCE_LABEL[event.significance]}
              </span>
            )}
          </span>
        </div>

        {/* Timestamp */}
        <span
          className="shrink-0 text-xs text-gray-500"
          title={new Date(event.timestamp).toLocaleString()}
        >
          {formatTimestamp(event.timestamp)}
        </span>
      </CardHeader>

      <CardContent>
        {/* Accounts */}
        {event.accounts.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-2">
            {event.accounts.slice(0, 3).map((addr, i) => (
              <span
                key={i}
                className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-xs text-gray-300"
                title={addr}
              >
                {truncateAddress(addr)}
              </span>
            ))}
            {event.accounts.length > 3 && (
              <span className="text-xs text-gray-600">
                +{event.accounts.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Key data summary */}
        <EventSummary data={event.data} />

        {/* Block number */}
        <div className="mt-2 text-xs text-gray-600">
          Block #{event.blockNumber.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
