"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, AuthResponse } from "@polkadot-feed/shared";
import { getToken, setToken, clearToken, fetchWithAuth } from "@/lib/auth";
import { detectWallets, enableExtension, signMessage } from "@/lib/wallet";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  availableWallets: string[];
  login: (extensionKey: string, address: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/auth/me`);
      if (res.ok) {
        const data = (await res.json()) as User;
        setUser(data);
      } else {
        clearToken();
        setUser(null);
      }
    } catch {
      // Network error — keep cached state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setAvailableWallets(detectWallets());
    void checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (extensionKey: string, address: string) => {
      setIsLoading(true);
      try {
        // Step 1: Get challenge
        const challengeRes = await fetch(`${BACKEND_URL}/api/auth/challenge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });
        if (!challengeRes.ok) throw new Error("Failed to get challenge");
        const { message } = (await challengeRes.json()) as { message: string };

        // Step 2: Sign with wallet extension
        const extension = await enableExtension(extensionKey);
        const signature = await signMessage(extension, address, message);

        // Step 3: Verify signature → get JWT
        const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, signature, message }),
        });
        if (!verifyRes.ok) throw new Error("Signature verification failed");
        const { token, user: authedUser } = (await verifyRes.json()) as AuthResponse;

        setToken(token);
        setUser(authedUser);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    availableWallets,
    login,
    logout,
    checkAuth,
  };
}
