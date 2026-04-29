"use client";

import { useState } from "react";
import type { FilterPreset, TierLimits } from "@polkadot-feed/shared";
import type { FeedFilterState } from "@/components/feed/FeedPage";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface PresetManagerProps {
  presets: FilterPreset[];
  isLoading: boolean;
  tierLimit: TierLimits;
  activeFilters: FeedFilterState;
  onApply: (preset: FilterPreset) => void;
  onCreate: (name: string, filters: FeedFilterState) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
}

function buildFilterSummary(filters: FilterPreset["filters"]): string {
  const parts: string[] = [];
  if (filters.chains && filters.chains.length > 0) {
    parts.push(`Chains: ${filters.chains.join(", ")}`);
  }
  if (filters.eventTypes && filters.eventTypes.length > 0) {
    parts.push(`Types: ${filters.eventTypes.slice(0, 3).join(", ")}${filters.eventTypes.length > 3 ? "…" : ""}`);
  }
  if (filters.minSignificance && filters.minSignificance > 0) {
    parts.push(`Min significance: ${filters.minSignificance}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "All events";
}

export function PresetManager({
  presets,
  isLoading,
  tierLimit,
  activeFilters,
  onApply,
  onCreate,
  onDelete,
  onRename,
}: PresetManagerProps) {
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const atLimit = tierLimit.presets !== null && presets.length >= tierLimit.presets;

  async function handleSave() {
    if (!newName.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onCreate(newName.trim(), activeFilters);
      setNewName("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save preset");
    } finally {
      setIsSaving(false);
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

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    try {
      await onRename(id, editName.trim());
      setEditingId(null);
    } catch {
      // Error silently ignored — the UI stays open
    }
  }

  return (
    <div className="space-y-4">
      {/* Tier usage */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Saved presets:{" "}
          <span className="font-semibold text-gray-200">
            {presets.length}
            {tierLimit.presets !== null ? `/${tierLimit.presets}` : ""}
          </span>
        </span>
        {atLimit && (
          <span className="rounded bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400">
            Upgrade for more presets
          </span>
        )}
      </div>

      {/* Save current filters */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <p className="mb-2 text-sm font-medium text-gray-300">Save current filters as a preset</p>
        {atLimit ? (
          <p className="text-xs text-yellow-400">Preset limit reached. Upgrade to save more.</p>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Preset name"
              maxLength={80}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
              onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving || !newName.trim()}
              onClick={handleSave}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
        {saveError && <p className="mt-1 text-xs text-red-400">{saveError}</p>}
      </div>

      {/* Presets list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      ) : presets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 py-8 text-center">
          <p className="text-sm text-gray-500">No presets saved yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <Card key={preset.id}>
              <CardHeader>
                {editingId === preset.id ? (
                  <div className="flex flex-1 gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleRename(preset.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <Button size="sm" variant="primary" onClick={() => handleRename(preset.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <span className="font-medium text-gray-100">{preset.name}</span>
                )}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onApply(preset)}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingId(preset.id); setEditName(preset.name); }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deletingId === preset.id}
                    onClick={() => handleDelete(preset.id)}
                    className="text-red-500 hover:bg-red-900/20 hover:text-red-400"
                  >
                    {deletingId === preset.id ? "…" : "Delete"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>{buildFilterSummary(preset.filters)}</CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
