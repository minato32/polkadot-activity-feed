"use client";

import { useState } from "react";
import type { FollowedWallet, TierLimits } from "@polkadot-feed/shared";
import { AddWalletForm } from "./AddWalletForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { truncateAddress } from "@/lib/utils";

interface WalletListProps {
  wallets: FollowedWallet[];
  isLoading: boolean;
  tierLimit: TierLimits;
  ownAddress?: string;
  onAdd: (address: string, label?: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export function WalletList({
  wallets,
  isLoading,
  tierLimit,
  ownAddress,
  onAdd,
  onRemove,
}: WalletListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const atLimit = tierLimit.wallets !== null && wallets.length >= tierLimit.wallets;
  const alreadyFollowingOwn = ownAddress
    ? wallets.some((w) => w.address === ownAddress)
    : false;

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await onRemove(id);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAddOwn() {
    if (!ownAddress) return;
    await onAdd(ownAddress, "My wallet");
  }

  return (
    <div className="space-y-6">
      {/* Tier usage bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          Followed wallets:{" "}
          <span className="font-semibold text-gray-200">
            {wallets.length}
            {tierLimit.wallets !== null ? `/${tierLimit.wallets}` : ""}
          </span>
        </span>
        {atLimit && (
          <span className="rounded bg-yellow-900/40 px-2 py-0.5 text-xs text-yellow-400">
            Upgrade to follow more
          </span>
        )}
      </div>

      {/* Quick-add own wallet */}
      {ownAddress && !alreadyFollowingOwn && !atLimit && (
        <button
          onClick={handleAddOwn}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-gray-300"
        >
          <span className="text-pink-400">+</span>
          Follow my own wallet ({truncateAddress(ownAddress)})
        </button>
      )}

      {/* Wallet list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 py-10 text-center">
          <p className="text-sm font-medium text-gray-400">No wallets followed yet</p>
          <p className="mt-1 text-xs text-gray-600">
            Add a wallet below to track its activity
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {wallets.map((wallet) => (
            <Card key={wallet.id}>
              <CardHeader>
                <div className="flex flex-col gap-0.5">
                  {wallet.label && (
                    <span className="text-sm font-medium text-gray-100">{wallet.label}</span>
                  )}
                  <span className="font-mono text-xs text-gray-400">
                    {truncateAddress(wallet.address)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {wallet.chainId && (
                    <Badge variant="outline">{wallet.chainId}</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removingId === wallet.id}
                    onClick={() => handleRemove(wallet.id)}
                    className="text-red-500 hover:bg-red-900/20 hover:text-red-400"
                  >
                    {removingId === wallet.id ? "…" : "Remove"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                Added {new Date(wallet.createdAt).toLocaleDateString()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add wallet form */}
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-200">Add Wallet</h3>
        {atLimit ? (
          <p className="text-xs text-yellow-400">
            You&apos;ve reached your wallet limit. Upgrade your plan to follow more wallets.
          </p>
        ) : (
          <AddWalletForm onAdd={onAdd} disabled={atLimit} />
        )}
      </div>
    </div>
  );
}
