"use client";

import { useState } from "react";
import { useWebhooks } from "@/hooks/useWebhooks";
import { Button } from "@/components/ui/Button";
import { formatTimestamp } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function WebhookManager() {
  const { webhooks, isLoading, deliveries, create, update, remove, fetchDeliveries } =
    useWebhooks();

  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDeliveries, setExpandedDeliveries] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await create({ url: url.trim(), secret: secret.trim() });
      setUrl("");
      setSecret("");
      setShowForm(false);
    } catch {
      setError("Failed to create webhook. Check the URL and try again.");
    } finally {
      setCreating(false);
    }
  };

  const toggleDeliveries = async (id: string) => {
    if (expandedDeliveries === id) {
      setExpandedDeliveries(null);
      return;
    }
    setExpandedDeliveries(id);
    if (!deliveries[id]) {
      await fetchDeliveries(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add webhook */}
      {!showForm ? (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          + Add Webhook
        </Button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-gray-200">New Webhook</p>
          <div>
            <label className="mb-1 block text-xs text-gray-500">URL *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              required
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-pink-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Secret (optional)</label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Signing secret"
              className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-pink-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Webhook list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-gray-800 bg-gray-900"
            />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <p className="text-sm text-gray-500">No webhooks configured.</p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="rounded-lg border border-gray-800 bg-gray-900">
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-gray-200">{wh.url}</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Created {formatTimestamp(wh.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {/* Enabled toggle */}
                  <button
                    onClick={() => void update(wh.id, { enabled: !wh.enabled })}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      wh.enabled ? "bg-pink-600" : "bg-gray-700",
                    )}
                    aria-label={wh.enabled ? "Disable" : "Enable"}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        wh.enabled ? "translate-x-4" : "translate-x-0",
                      )}
                    />
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void toggleDeliveries(wh.id)}
                  >
                    History
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void remove(wh.id)}
                    className="text-red-500 hover:text-red-400"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Delivery history */}
              {expandedDeliveries === wh.id && (
                <div className="border-t border-gray-800 px-4 py-3">
                  {!deliveries[wh.id] ? (
                    <p className="text-xs text-gray-500">Loading…</p>
                  ) : deliveries[wh.id]?.length === 0 ? (
                    <p className="text-xs text-gray-500">No deliveries yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {deliveries[wh.id]?.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span
                            className={cn(
                              "font-medium",
                              d.status === "delivered"
                                ? "text-green-400"
                                : d.status === "failed"
                                ? "text-red-400"
                                : "text-yellow-400",
                            )}
                          >
                            {d.status}
                          </span>
                          <span className="text-gray-600">
                            {d.attempts} attempt{d.attempts !== 1 ? "s" : ""} ·{" "}
                            {d.lastAttemptAt
                              ? formatTimestamp(d.lastAttemptAt)
                              : "pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
