"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WalletSelector } from "./WalletSelector";
import { truncateAddress } from "@/lib/utils";
import Link from "next/link";

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-600 text-gray-200",
  pro: "bg-blue-700 text-blue-100",
  whale: "bg-purple-700 text-purple-100",
  enterprise: "bg-yellow-700 text-yellow-100",
};

export function ConnectButton() {
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const [showSelector, setShowSelector] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoading) {
    return (
      <div className="h-9 w-32 animate-pulse rounded bg-gray-800" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Button variant="primary" size="sm" onClick={() => setShowSelector(true)}>
          Connect Wallet
        </Button>
        {showSelector && (
          <WalletSelector onClose={() => setShowSelector(false)} />
        )}
      </>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm transition-colors hover:border-gray-600 hover:bg-gray-700"
      >
        <span className="font-mono text-gray-200">{truncateAddress(user.address)}</span>
        <Badge
          className={TIER_COLORS[user.tier] ?? "bg-gray-600 text-gray-200"}
        >
          {user.tier}
        </Badge>
        <svg
          className="h-3.5 w-3.5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
          <nav className="py-1">
            <Link
              href="/wallets"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100"
            >
              My Wallets
            </Link>
            <Link
              href="/settings"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100"
            >
              Presets &amp; Alerts
            </Link>
            <Link
              href="/settings"
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100"
            >
              Settings
            </Link>
            <div className="my-1 h-px bg-gray-800" />
            <button
              onClick={() => { logout(); setShowDropdown(false); }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800 hover:text-red-300"
            >
              Disconnect
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
