"use client";

import { useState, useCallback, useEffect } from "react";
import type { ApiKey } from "@polkadot-feed/shared";
import { fetchWithAuth } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface UseApiKeysResult {
  keys: ApiKey[];
  isLoading: boolean;
  newKeyValue: string | null;
  create: (name: string) => Promise<void>;
  revoke: (id: string) => Promise<void>;
  copyKey: (key: string) => Promise<void>;
  dismissNewKey: () => void;
  refresh: () => Promise<void>;
}

export function useApiKeys(): UseApiKeysResult {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/keys`);
      if (!res.ok) throw new Error("Failed to fetch keys");
      const data = (await res.json()) as ApiKey[];
      setKeys(data);
    } catch {
      setKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (name: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/keys`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create key");
    const created = (await res.json()) as ApiKey;
    setNewKeyValue(created.key);
    setKeys((prev) => [...prev, created]);
  }, []);

  const revoke = useCallback(async (id: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/keys/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to revoke key");
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const copyKey = useCallback(async (key: string) => {
    await navigator.clipboard.writeText(key);
  }, []);

  const dismissNewKey = useCallback(() => {
    setNewKeyValue(null);
  }, []);

  return { keys, isLoading, newKeyValue, create, revoke, copyKey, dismissNewKey, refresh };
}
