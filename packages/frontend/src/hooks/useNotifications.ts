"use client";

import { useState, useEffect, useCallback } from "react";
import type { NotificationConfig, NotificationChannel, NotificationChannelConfig } from "@polkadot-feed/shared";
import { fetchWithAuth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface CreateNotificationPayload {
  channel: NotificationChannel;
  presetId: string;
  config: NotificationChannelConfig;
}

interface UseNotificationsResult {
  notifications: NotificationConfig[];
  isLoading: boolean;
  error: string | null;
  createNotification: (payload: CreateNotificationPayload) => Promise<void>;
  updateNotification: (
    id: string,
    data: Partial<{ enabled: boolean; config: NotificationChannelConfig; presetId: string }>,
  ) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/notifications`);
      if (!res.ok) throw new Error("Failed to load notification configs");
      const data = (await res.json()) as NotificationConfig[];
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createNotification = useCallback(
    async (payload: CreateNotificationPayload) => {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/notifications`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to create notification");
      }
      const created = (await res.json()) as NotificationConfig;
      setNotifications((prev) => [...prev, created]);
    },
    [],
  );

  const updateNotification = useCallback(
    async (
      id: string,
      data: Partial<{ enabled: boolean; config: NotificationChannelConfig; presetId: string }>,
    ) => {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/notifications/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update notification");
      const updated = (await res.json()) as NotificationConfig;
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    },
    [],
  );

  const deleteNotification = useCallback(async (id: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/notifications/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete notification");
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    isLoading,
    error,
    createNotification,
    updateNotification,
    deleteNotification,
    refresh,
  };
}
