"use client";

import Link from "next/link";
import { ConnectButton } from "@/components/auth/ConnectButton";
import { useAuthContext } from "@/lib/AuthContext";

export function TopNav() {
  const { isAuthenticated } = useAuthContext();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-gray-100 hover:text-white"
          >
            Polkadot Activity Feed
          </Link>
          {isAuthenticated && (
            <nav className="hidden items-center gap-4 sm:flex">
              <Link
                href="/my-feed"
                className="text-sm text-gray-400 transition-colors hover:text-gray-100"
              >
                My Feed
              </Link>
              <Link
                href="/wallets"
                className="text-sm text-gray-400 transition-colors hover:text-gray-100"
              >
                Wallets
              </Link>
            </nav>
          )}
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
