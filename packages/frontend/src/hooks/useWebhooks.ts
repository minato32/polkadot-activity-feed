"use client";

import { useState, useCallback, useEffect } from "react";
import type { WebhookConfig, WebhookDelivery } from "@polkadot-feed/shared";
import { fetchWithAuth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface CreateWebhookParams {
  url: string;
  secret: string;
  presetId?: string;
}

interface UseWebhooksResult {
  webhooks: WebhookConfig[];
  isLoading: boolean;
  deliveries: Record<string, WebhookDelivery[]>;
  create: (params: CreateWebhookParams) => Promise<void>;
  update: (id: string, patch: Partial<Pick<WebhookConfig, "enabled" | "url">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  fetchDeliveries: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWebhooks(): UseWebhooksResult {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/webhooks`);
      if (!res.ok) throw new Error("Failed to fetch webhooks");
      const data = (await res.json()) as WebhookConfig[];
      setWebhooks(data);
    } catch {
      setWebhooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (params: CreateWebhookParams) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/webhooks`, {
      method: "POST",
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to create webhook");
    const created = (await res.json()) as WebhookConfig;
    setWebhooks((prev) => [...prev, created]);
  }, []);

  const update = useCallback(
    async (id: string, patch: Partial<Pick<WebhookConfig, "enabled" | "url">>) => {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/webhooks/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update webhook");
      const updated = (await res.json()) as WebhookConfig;
      setWebhooks((prev) => prev.map((w) => (w.id === id ? updated : w)));
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/webhooks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete webhook");
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const fetchDeliveries = useCallback(async (id: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/webhooks/${id}/deliveries`);
    if (!res.ok) throw new Error("Failed to fetch deliveries");
    const data = (await res.json()) as WebhookDelivery[];
    setDeliveries((prev) => ({ ...prev, [id]: data }));
  }, []);

  return { webhooks, isLoading, deliveries, create, update, remove, fetchDeliveries, refresh };
}
