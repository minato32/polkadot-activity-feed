"use client";

import { useState } from "react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { Button } from "@/components/ui/Button";
import { formatTimestamp } from "@/lib/utils";
import type { UserTier } from "@polkadot-feed/shared";

interface ApiKeyManagerProps {
  tier: UserTier;
}

export function ApiKeyManager({ tier }: ApiKeyManagerProps) {
  const { keys, isLoading, newKeyValue, create, revoke, copyKey, dismissNewKey } =
    useApiKeys();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = tier !== "free";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await create(newName.trim());
      setNewName("");
    } catch {
      setError("Failed to create API key. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (key: string) => {
    await copyKey(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isPro) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
        <p className="mb-2 font-semibold text-gray-200">API Keys require Pro or higher</p>
        <p className="text-sm text-gray-500">
          Upgrade your account to generate API keys and access the developer API.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New key alert */}
      {newKeyValue && (
        <div className="rounded-lg border border-green-800 bg-green-950/30 p-4">
          <p className="mb-2 text-sm font-semibold text-green-400">
            New API key created — copy it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-auto rounded bg-gray-900 px-3 py-1.5 font-mono text-xs text-gray-100">
              {newKeyValue}
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopy(newKeyValue)}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={dismissNewKey}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Key name (e.g., Production)"
          className="flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-pink-500 focus:outline-none"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={creating || !newName.trim()}
        >
          {creating ? "Creating…" : "Create Key"}
        </Button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Key list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-gray-800 bg-gray-900" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-500">No API keys yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-900 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-100">{k.name}</p>
                <p className="mt-0.5 font-mono text-xs text-gray-500">
                  {k.key.slice(0, 8)}••••••••
                </p>
                <p className="mt-0.5 text-xs text-gray-600">
                  Created {formatTimestamp(k.createdAt)} ·{" "}
                  {k.requestsToday}/{k.requestsLimit} requests today
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {confirmRevoke === k.id ? (
                  <>
                    <span className="self-center text-xs text-gray-400">Confirm revoke?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRevoke(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void revoke(k.id);
                        setConfirmRevoke(null);
                      }}
                      className="border-red-800 text-red-400 hover:bg-red-950"
                    >
                      Revoke
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRevoke(k.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
