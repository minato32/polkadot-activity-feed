"use client";

import type { ChainEvent, WhaleLabel } from "@polkadot-feed/shared";
import { CHAIN_MAP } from "@polkadot-feed/shared";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { WhaleTag } from "./WhaleTag";
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
  getLabel?: (address: string) => WhaleLabel | undefined;
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
          <span className="font-mono text-gray-400">
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

export function EventCard({ event, onToggle, getLabel }: EventCardProps) {
  const chain = CHAIN_MAP.get(event.chainId);
  const chainColor = chain?.color ?? "#888";
  const chainName = chain?.name ?? event.chainId;

  return (
    <Card
      onClick={onToggle}
      className="group min-h-[44px] cursor-pointer active:bg-gray-800/50"
    >
      <CardHeader>
        {/* Badges row — wraps on mobile */}
        <div className="flex flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Chain badge */}
          <Badge
            style={{ backgroundColor: chainColor + "26", color: chainColor }}
            className="text-[10px] font-semibold sm:text-xs"
          >
            {chainName}
          </Badge>

          {/* Event type badge */}
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {formatEventType(event.eventType)}
          </Badge>

          {/* Significance indicator */}
          <span
            className="flex items-center gap-1"
            title={`Significance: ${SIGNIFICANCE_LABEL[event.significance]}`}
          >
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2",
                SIGNIFICANCE_DOT[event.significance],
              )}
              aria-label={SIGNIFICANCE_LABEL[event.significance]}
            />
            {event.significance > 0 && (
              <span
                className={cn(
                  "text-[10px] font-medium sm:text-xs",
                  event.significance === 2 ? "text-red-400" : "text-yellow-400",
                )}
              >
                {SIGNIFICANCE_LABEL[event.significance]}
              </span>
            )}
          </span>
        </div>

        {/* Timestamp — right-aligned, shrinks gracefully */}
        <span
          className="shrink-0 text-[10px] text-gray-500 sm:text-xs"
          title={new Date(event.timestamp).toLocaleString()}
        >
          {formatTimestamp(event.timestamp)}
        </span>
      </CardHeader>

      <CardContent>
        {/* Accounts with optional whale labels */}
        {event.accounts.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1.5 sm:gap-2">
            {event.accounts.slice(0, 3).map((addr, i) => {
              const wl = getLabel?.(addr);
              return (
                <span key={i} className="flex items-center gap-1">
                  <span
                    className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[10px] text-gray-300 sm:text-xs"
                    title={addr}
                  >
                    {truncateAddress(addr)}
                  </span>
                  {wl && <WhaleTag label={wl.label} category={wl.category} />}
                </span>
              );
            })}
            {event.accounts.length > 3 && (
              <span className="text-[10px] text-gray-600 sm:text-xs">
                +{event.accounts.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Key data summary */}
        <EventSummary data={event.data} />

        {/* Block number */}
        <div className="mt-1.5 text-[10px] text-gray-600 sm:mt-2 sm:text-xs">
          Block #{event.blockNumber.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
