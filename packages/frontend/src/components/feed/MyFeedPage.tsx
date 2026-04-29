"use client";

import { useState } from "react";
import { useAuthContext } from "@/lib/AuthContext";
import { useWallets } from "@/hooks/useWallets";
import { useEvents } from "@/hooks/useEvents";
import { EventFeed } from "./EventFeed";
import { FeedFilters } from "./FeedFilters";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { FeedFilterState } from "./FeedPage";

const DEFAULT_FILTERS: FeedFilterState = {
  chains: [],
  eventTypes: [],
  minSignificance: 0,
};

export function MyFeedPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { wallets, isLoading: walletsLoading } = useWallets(user?.tier ?? "free");
  const [filters, setFilters] = useState<FeedFilterState>(DEFAULT_FILTERS);

  const accounts = wallets.map((w) => w.address);
  const { events, hasMore, isLoading: eventsLoading, loadMore } = useEvents({
    ...filters,
    accounts: accounts.length > 0 ? accounts : undefined,
  });

  if (authLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-800" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Connect to see your feed</h1>
        <p className="mb-6 text-gray-400">
          Sign in with your Polkadot wallet to view personalized activity.
        </p>
        <Link href="/">
          <Button variant="primary">Go to Main Feed</Button>
        </Link>
      </main>
    );
  }

  const noWallets = !walletsLoading && wallets.length === 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">My Feed</h1>
        <p className="text-gray-400">
          Events involving your followed wallets
          {wallets.length > 0 && (
            <span className="ml-2 text-xs text-gray-600">
              ({wallets.length} wallet{wallets.length !== 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      {noWallets ? (
        <div className="rounded-lg border border-dashed border-gray-700 py-16 text-center">
          <p className="mb-2 text-lg font-medium text-gray-300">
            No wallets followed yet
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Follow wallet addresses to see their activity here.
          </p>
          <Link href="/wallets">
            <Button variant="primary">Add Wallets</Button>
          </Link>
        </div>
      ) : (
        <>
          <FeedFilters filters={filters} onChange={setFilters} />
          <div className="mt-4">
            <EventFeed
              initialEvents={events}
              hasMore={hasMore}
              onLoadMore={loadMore}
              isLoading={eventsLoading || walletsLoading}
            />
          </div>
        </>
      )}
    </main>
  );
}
