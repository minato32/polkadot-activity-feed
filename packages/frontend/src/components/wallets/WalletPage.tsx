"use client";

import { useAuthContext } from "@/lib/AuthContext";
import { useWallets } from "@/hooks/useWallets";
import { WalletList } from "./WalletList";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function WalletPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { wallets, isLoading, tierLimit, addWallet, removeWallet } = useWallets(
    user?.tier ?? "free",
  );

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
        <h1 className="mb-2 text-2xl font-bold">Connect to view your wallets</h1>
        <p className="mb-6 text-gray-400">
          Sign in with your Polkadot wallet to start following addresses.
        </p>
        <Link href="/">
          <Button variant="primary">Go to Feed</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">My Wallets</h1>
        <p className="text-sm text-gray-400">
          Follow wallet addresses to track their activity across Polkadot parachains.
        </p>
      </div>

      <WalletList
        wallets={wallets}
        isLoading={isLoading}
        tierLimit={tierLimit}
        ownAddress={user.address}
        onAdd={addWallet}
        onRemove={removeWallet}
      />
    </main>
  );
}
