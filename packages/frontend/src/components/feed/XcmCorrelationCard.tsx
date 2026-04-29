"use client";

import { useState } from "react";
import type { XcmCorrelation } from "@polkadot-feed/shared";
import { CHAIN_MAP } from "@polkadot-feed/shared";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface XcmCorrelationCardProps {
  correlation: XcmCorrelation;
}

const STATUS_STYLES: Record<XcmCorrelation["status"], string> = {
  matched: "bg-green-900/60 text-green-300 border border-green-700/50",
  pending: "bg-yellow-900/60 text-yellow-300 border border-yellow-700/50",
  failed: "bg-red-900/60 text-red-300 border border-red-700/50",
};

function ChainPill({ chainId }: { chainId: string }) {
  const chain = CHAIN_MAP.get(chainId as Parameters<typeof CHAIN_MAP.get>[0]);
  const color = chain?.color ?? "#888";
  const name = chain?.name ?? chainId;
  return (
    <span
      className="rounded px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: color + "26", color }}
    >
      {name}
    </span>
  );
}

export function XcmCorrelationCard({ correlation }: XcmCorrelationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const msgShort = correlation.messageHash.slice(0, 10) + "…" + correlation.messageHash.slice(-6);

  return (
    <Card
      onClick={() => setExpanded((v) => !v)}
      className={cn(
        "border-l-2",
        correlation.status === "failed" ? "border-l-red-500" : "border-l-cyan-600",
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cross-chain arrow */}
          <ChainPill chainId={correlation.sourceChainId} />
          <span className="text-gray-500 text-sm" aria-hidden="true">→</span>
          <ChainPill chainId={correlation.destChainId} />

          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize",
              STATUS_STYLES[correlation.status],
            )}
            aria-label={`Status: ${correlation.status}`}
          >
            {correlation.status}
          </span>

          {/* XCM label */}
          <Badge className="bg-cyan-900/40 text-cyan-300 border border-cyan-700/40">
            XCM
          </Badge>
        </div>

        <span className="shrink-0 text-xs text-gray-500" title={correlation.id}>
          {expanded ? "Collapse" : "Expand"}
        </span>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Hash:</span>
          <span className="font-mono text-gray-400" title={correlation.messageHash}>
            {msgShort}
          </span>
        </div>

        {expanded && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded border border-gray-800 bg-gray-950/50 p-3 text-xs">
            <div>
              <p className="mb-1 text-gray-500 font-semibold uppercase tracking-wider">Source</p>
              <div className="space-y-0.5 text-gray-400">
                <div>Chain: <span className="text-gray-300">{correlation.sourceChainId}</span></div>
                <div className="break-all">
                  Event: <span className="font-mono text-gray-300">{correlation.sourceEventId}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1 text-gray-500 font-semibold uppercase tracking-wider">Destination</p>
              <div className="space-y-0.5 text-gray-400">
                <div>Chain: <span className="text-gray-300">{correlation.destChainId}</span></div>
                {correlation.destEventId ? (
                  <div className="break-all">
                    Event: <span className="font-mono text-gray-300">{correlation.destEventId}</span>
                  </div>
                ) : (
                  <div className="text-gray-600 italic">Awaiting destination event</div>
                )}
              </div>
            </div>
            <div className="col-span-2 break-all text-gray-600">
              Full hash: <span className="font-mono">{correlation.messageHash}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
