"use client";

import { useState } from "react";
import type { NotificationConfig, FilterPreset, NotificationChannel } from "@polkadot-feed/shared";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface NotificationSettingsProps {
  notifications: NotificationConfig[];
  presets: FilterPreset[];
  isLoading: boolean;
  onCreate: (channel: NotificationChannel, presetId: string, config: Record<string, string>) => Promise<void>;
  onToggle: (id: string, enabled: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type AddingChannel = NotificationChannel | null;

export function NotificationSettings({
  notifications,
  presets,
  isLoading,
  onCreate,
  onToggle,
  onDelete,
}: NotificationSettingsProps) {
  const [adding, setAdding] = useState<AddingChannel>(null);
  const [chatId, setChatId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function resetForm() {
    setChatId("");
    setWebhookUrl("");
    setSelectedPreset("");
    setFormError(null);
    setAdding(null);
  }

  async function handleAdd() {
    if (!selectedPreset) {
      setFormError("Please select a preset to link");
      return;
    }
    const config: Record<string, string> = adding === "telegram"
      ? { chatId }
      : { webhookUrl };

    const configValue = adding === "telegram" ? chatId : webhookUrl;
    if (!configValue.trim()) {
      setFormError(adding === "telegram" ? "Telegram Chat ID is required" : "Webhook URL is required");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onCreate(adding!, selectedPreset, config);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add notification");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    setTogglingId(id);
    try {
      await onToggle(id, !enabled);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  function getConfigDisplay(n: NotificationConfig): string {
    const cfg = n.config as Record<string, string>;
    if (n.channel === "telegram") return `Chat ID: ${cfg.chatId ?? ""}`;
    return `Webhook: ${(cfg.webhookUrl ?? "").slice(0, 40)}…`;
  }

  function getPresetName(presetId: string): string {
    return presets.find((p) => p.id === presetId)?.name ?? presetId;
  }

  return (
    <div className="space-y-6">
      {/* Add notification buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setAdding("telegram"); setFormError(null); }}
        >
          + Telegram
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setAdding("discord"); setFormError(null); }}
        >
          + Discord
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200 capitalize">
            Add {adding} Alert
          </h3>

          {adding === "telegram" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Telegram Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001234567890"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <p className="mt-1 text-xs text-gray-600">
                Start a chat with @userinfobot to find your Chat ID
              </p>
            </div>
          )}

          {adding === "discord" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-400">
                Discord Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">
              Linked Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              <option value="">Select a preset…</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {presets.length === 0 && (
              <p className="mt-1 text-xs text-gray-600">
                Save a filter preset first to link it to this alert.
              </p>
            )}
          </div>

          {formError && <p className="text-xs text-red-400">{formError}</p>}

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleAdd}
            >
              {isSubmitting ? "Adding…" : "Add Alert"}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 py-8 text-center">
          <p className="text-sm text-gray-500">No alerts configured yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      n.channel === "telegram"
                        ? "bg-blue-700 text-blue-100"
                        : "bg-indigo-700 text-indigo-100"
                    }
                  >
                    {n.channel}
                  </Badge>
                  <span className="text-sm font-medium text-gray-200">
                    {getPresetName(n.presetId)}
                  </span>
                  {!n.enabled && (
                    <Badge className="bg-gray-700 text-gray-400">Paused</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(n.id, n.enabled)}
                    disabled={togglingId === n.id}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      n.enabled ? "bg-pink-600" : "bg-gray-600"
                    }`}
                    aria-label={n.enabled ? "Disable" : "Enable"}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        n.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deletingId === n.id}
                    onClick={() => handleDelete(n.id)}
                    className="text-red-500 hover:bg-red-900/20 hover:text-red-400"
                  >
                    {deletingId === n.id ? "…" : "Delete"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>{getConfigDisplay(n)}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
