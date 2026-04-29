"use client";

import { useState } from "react";
import type { EventAggregation } from "@polkadot-feed/shared";
import { CHAIN_MAP } from "@polkadot-feed/shared";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatTimestamp, SIGNIFICANCE_LABEL, SIGNIFICANCE_DOT, cn } from "@/lib/utils";

interface AggregationCardProps {
  aggregation: EventAggregation;
}

function formatEventType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AggregationCard({ aggregation: agg }: AggregationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const chain = agg.chainId ? CHAIN_MAP.get(agg.chainId) : null;
  const chainColor = chain?.color ?? "#888";

  const windowStart = formatTimestamp(agg.timeWindowStart);
  const windowEnd = formatTimestamp(agg.timeWindowEnd);

  return (
    <Card className="border-l-2 border-l-violet-600">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aggregation badge */}
          <Badge className="bg-violet-900/50 text-violet-300 border border-violet-700/50">
            Cluster
          </Badge>

          {chain && (
            <Badge
              style={{ backgroundColor: chainColor + "26", color: chainColor }}
              className="font-semibold"
            >
              {chain.name}
            </Badge>
          )}

          <Badge variant="outline">{formatEventType(agg.eventType)}</Badge>

          {/* Significance */}
          <span className="flex items-center gap-1" title={`Significance: ${SIGNIFICANCE_LABEL[agg.significance]}`}>
            <span
              className={cn("inline-block h-2 w-2 rounded-full", SIGNIFICANCE_DOT[agg.significance])}
              aria-label={SIGNIFICANCE_LABEL[agg.significance]}
            />
            {agg.significance > 0 && (
              <span
                className={cn(
                  "text-xs font-medium",
                  agg.significance === 2 ? "text-red-400" : "text-yellow-400",
                )}
              >
                {SIGNIFICANCE_LABEL[agg.significance]}
              </span>
            )}
          </span>
        </div>

        <span className="shrink-0 text-xs text-gray-500">
          {windowStart} — {windowEnd}
        </span>
      </CardHeader>

      <CardContent>
        {/* Summary line */}
        <p className="text-sm text-gray-300 font-medium">{agg.summary}</p>

        {/* Count */}
        <p className="mt-1 text-xs text-gray-500">
          {agg.eventCount} event{agg.eventCount !== 1 ? "s" : ""} in cluster
        </p>

        {/* Expand/collapse */}
        {agg.eventIds.length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? "Collapse events" : `Show ${agg.eventIds.length} event IDs`}
            </Button>

            {expanded && (
              <ul className="mt-2 space-y-0.5 max-h-40 overflow-y-auto rounded border border-gray-800 bg-gray-950/50 p-2">
                {agg.eventIds.map((id) => (
                  <li key={id} className="font-mono text-xs text-gray-400 break-all">
                    {id}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
