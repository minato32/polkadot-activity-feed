"use client";

import { useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { usePresets } from "@/hooks/usePresets";
import { useNotifications } from "@/hooks/useNotifications";
import { PresetManager } from "@/components/presets/PresetManager";
import { NotificationSettings } from "./NotificationSettings";
import { DigestSettings } from "./DigestSettings";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { FilterPreset, NotificationChannel } from "@polkadot-feed/shared";
import type { FeedFilterState } from "@/components/feed/FeedPage";

type Tab = "presets" | "notifications" | "digest";

const DEFAULT_FILTERS: FeedFilterState = {
  chains: [],
  eventTypes: [],
  minSignificance: 0,
};

export function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState<Tab>("presets");
  const [activeFilters] = useState<FeedFilterState>(DEFAULT_FILTERS);

  const {
    presets,
    isLoading: presetsLoading,
    tierLimit,
    createPreset,
    updatePreset,
    deletePreset,
  } = usePresets(user?.tier ?? "free");

  const {
    notifications,
    isLoading: notifsLoading,
    createNotification,
    updateNotification,
    deleteNotification,
  } = useNotifications();

  if (authLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-800" />
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Connect to access settings</h1>
        <p className="mb-6 text-gray-400">
          Sign in with your Polkadot wallet to manage presets and alerts.
        </p>
        <Link href="/">
          <Button variant="primary">Go to Feed</Button>
        </Link>
      </main>
    );
  }

  function handleApplyPreset(preset: FilterPreset) {
    // Route to feed with preset applied — stored in sessionStorage for FeedPage to pick up
    sessionStorage.setItem("applyPreset", JSON.stringify(preset.filters));
    window.location.href = "/";
  }

  async function handleCreatePreset(name: string, filters: FeedFilterState) {
    await createPreset(name, {
      chains: filters.chains.length > 0 ? filters.chains : undefined,
      eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
      minSignificance: filters.minSignificance > 0 ? filters.minSignificance : undefined,
    });
  }

  async function handleCreateNotification(
    channel: NotificationChannel,
    presetId: string,
    config: Record<string, string>,
  ) {
    const typedConfig =
      channel === "telegram"
        ? { chatId: config.chatId ?? "" }
        : { webhookUrl: config.webhookUrl ?? "" };
    await createNotification({ channel, presetId, config: typedConfig });
  }

  async function handleToggle(id: string, enabled: boolean) {
    await updateNotification(id, { enabled });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400">
          Manage filter presets and notification alerts.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
        {(["presets", "notifications", "digest"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-gray-700 text-gray-100"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab === "notifications" ? "Alerts" : tab === "digest" ? "Digest" : "Presets"}
          </button>
        ))}
      </div>

      {activeTab === "presets" && (
        <PresetManager
          presets={presets}
          isLoading={presetsLoading}
          tierLimit={tierLimit}
          activeFilters={activeFilters}
          onApply={handleApplyPreset}
          onCreate={handleCreatePreset}
          onDelete={deletePreset}
          onRename={(id, name) => updatePreset(id, { name })}
        />
      )}

      {activeTab === "notifications" && (
        <NotificationSettings
          notifications={notifications}
          presets={presets}
          isLoading={notifsLoading}
          onCreate={handleCreateNotification}
          onToggle={handleToggle}
          onDelete={deleteNotification}
        />
      )}

      {activeTab === "digest" && <DigestSettings />}
    </main>
  );
}
