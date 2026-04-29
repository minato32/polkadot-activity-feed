"use client";

import { useState } from "react";
import type { ChainEvent } from "@polkadot-feed/shared";
import { CHAIN_MAP } from "@polkadot-feed/shared";
import { Button } from "@/components/ui/Button";
import { truncateAddress, SIGNIFICANCE_LABEL } from "@/lib/utils";

interface EventDetailProps {
  event: ChainEvent;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1 rounded px-1.5 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
      title="Copy to clipboard"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5 text-sm">
      <span className="w-36 shrink-0 text-gray-500">{label}</span>
      <span className="break-all font-mono text-gray-300">{value}</span>
    </div>
  );
}

export function EventDetail({ event }: EventDetailProps) {
  const [showRaw, setShowRaw] = useState(false);
  const chain = CHAIN_MAP.get(event.chainId);
  const subscanBase = getSubscanBase(event.chainId);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="mx-1 mb-2 rounded-b-lg border border-t-0 border-gray-800 bg-gray-900/60 px-4 py-3"
    >
      {/* Core event metadata */}
      <div className="mb-3 divide-y divide-gray-800/60">
        <DataRow label="Event ID" value={event.id} />
        <DataRow label="Chain" value={chain?.displayName ?? event.chainId} />
        <DataRow label="Pallet" value={event.pallet} />
        <DataRow label="Method" value={event.method} />
        <DataRow label="Block" value={`#${event.blockNumber.toLocaleString()}`} />
        <DataRow label="Timestamp" value={new Date(event.timestamp).toLocaleString()} />
        <DataRow label="Significance" value={SIGNIFICANCE_LABEL[event.significance]} />
      </div>

      {/* Accounts */}
      {event.accounts.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Accounts
          </p>
          <div className="space-y-1">
            {event.accounts.map((addr, i) => (
              <div key={i} className="flex items-center gap-1">
                <span
                  className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs text-gray-300"
                  title={addr}
                >
                  {truncateAddress(addr)}
                </span>
                <CopyButton text={addr} />
                {subscanBase && (
                  <a
                    href={`${subscanBase}/account/${addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-xs text-pink-500 hover:text-pink-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Subscan
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event data key-value pairs */}
      {Object.keys(event.data).length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Event Data
          </p>
          <div className="divide-y divide-gray-800/60 rounded border border-gray-800 bg-gray-950/50">
            {Object.entries(event.data).map(([key, val]) => (
              <div key={key} className="flex items-start gap-2 px-3 py-1.5 text-xs">
                <span className="w-32 shrink-0 text-gray-500">{key}</span>
                <span className="break-all font-mono text-gray-300">
                  {typeof val === "bigint"
                    ? val.toString()
                    : typeof val === "object"
                    ? JSON.stringify(val)
                    : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links + Raw JSON toggle */}
      <div className="flex items-center gap-3 pt-1">
        {subscanBase && (
          <a
            href={`${subscanBase}/block/${event.blockNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-pink-500 hover:text-pink-400"
            onClick={(e) => e.stopPropagation()}
          >
            View block on Subscan
          </a>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowRaw((v) => !v);
          }}
        >
          {showRaw ? "Hide raw JSON" : "Show raw JSON"}
        </Button>
      </div>

      {showRaw && (
        <pre className="mt-3 max-h-64 overflow-auto rounded border border-gray-800 bg-gray-950 p-3 text-xs text-gray-400">
          {JSON.stringify(event, null, 2)}
        </pre>
      )}
    </div>
  );
}

function getSubscanBase(chainId: string): string | null {
  const subscanMap: Record<string, string> = {
    polkadot: "https://polkadot.subscan.io",
    "asset-hub": "https://assethub-polkadot.subscan.io",
    moonbeam: "https://moonbeam.subscan.io",
    hydration: "https://hydradx.subscan.io",
    acala: "https://acala.subscan.io",
  };
  return subscanMap[chainId] ?? null;
}
