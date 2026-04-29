"use client";

import { useState, useEffect } from "react";
import type { DigestConfig, DigestEntry } from "@polkadot-feed/shared";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DigestSettings() {
  const [config, setConfig] = useState<DigestConfig | null>(null);
  const [history, setHistory] = useState<DigestEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [email, setEmail] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const headers = { ...getAuthHeaders() };
        const [cfgRes, histRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/digests/config`, { headers }),
          fetch(`${BACKEND_URL}/api/digests/history`, { headers }),
        ]);

        if (!cancelled) {
          if (cfgRes.ok) {
            const cfg = (await cfgRes.json()) as DigestConfig;
            setConfig(cfg);
            setFrequency(cfg.frequency);
            setEmail(cfg.email ?? "");
            setTelegramChatId(cfg.telegramChatId ?? "");
            setEnabled(cfg.enabled);
          }
          if (histRes.ok) {
            const h = (await histRes.json()) as DigestEntry[];
            setHistory(h);
          }
        }
      } catch {
        // Not authenticated or API not available — show form with defaults
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const body: Partial<DigestConfig> = {
      frequency,
      enabled,
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(telegramChatId.trim() ? { telegramChatId: telegramChatId.trim() } : {}),
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/digests/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const updated = (await res.json()) as DigestConfig;
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save digest config");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Config form */}
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Digest Configuration</h3>
          {config && (
            <Badge className="bg-green-900/50 text-green-300 border border-green-700/50">
              Active
            </Badge>
          )}
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Enable digest delivery</span>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
              enabled ? "bg-pink-600" : "bg-gray-600"
            }`}
            aria-label={enabled ? "Disable digest" : "Enable digest"}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Frequency */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-400">
            Frequency
          </label>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  frequency === f
                    ? "border-pink-600 bg-pink-600/20 text-pink-300"
                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>

        {/* Telegram */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-400">
            Telegram Chat ID <span className="text-gray-600">(optional)</span>
          </label>
          <input
            type="text"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
            placeholder="-1001234567890"
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>

        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        {saveSuccess && <p className="text-xs text-green-400">Digest settings saved.</p>}

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving…" : "Save Digest Settings"}
        </Button>
      </div>

      {/* History */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-300">Digest History</h3>

        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 py-8 text-center">
            <p className="text-sm text-gray-500">No digests delivered yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-200">
                      {formatDate(entry.generatedAt)}
                    </span>
                    <Badge
                      className={
                        entry.deliveredAt
                          ? "bg-green-900/50 text-green-300 border border-green-700/40"
                          : "bg-yellow-900/50 text-yellow-300 border border-yellow-700/40"
                      }
                    >
                      {entry.deliveredAt ? "Delivered" : "Pending"}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {entry.eventCount} event{entry.eventCount !== 1 ? "s" : ""}
                  </span>
                </CardHeader>
                <CardContent>
                  {entry.deliveredAt
                    ? `Delivered ${formatDate(entry.deliveredAt)}`
                    : "Awaiting delivery"}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
