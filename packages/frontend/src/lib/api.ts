import type {
  ChainEvent,
  ChainId,
  EventType,
  PaginatedEvents,
  Significance,
  WhaleLabel,
  XcmCorrelation,
  EventAggregation,
} from "@polkadot-feed/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export interface FetchEventsParams {
  chains?: ChainId[];
  eventTypes?: EventType[];
  minSignificance?: Significance;
  accounts?: string[];
  limit?: number;
  cursor?: string;
}

/** Fetch paginated events from the backend REST API */
export async function fetchEvents(
  params: FetchEventsParams = {},
): Promise<PaginatedEvents> {
  const url = new URL("/api/events", BACKEND_URL);

  if (params.chains && params.chains.length > 0) {
    url.searchParams.set("chains", params.chains.join(","));
  }
  if (params.eventTypes && params.eventTypes.length > 0) {
    url.searchParams.set("eventTypes", params.eventTypes.join(","));
  }
  if (params.minSignificance !== undefined) {
    url.searchParams.set("minSignificance", String(params.minSignificance));
  }
  if (params.accounts && params.accounts.length > 0) {
    url.searchParams.set("accounts", params.accounts.join(","));
  }
  if (params.limit !== undefined) {
    url.searchParams.set("limit", String(params.limit));
  }
  if (params.cursor) {
    url.searchParams.set("cursor", params.cursor);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<PaginatedEvents>;
}

/** Fetch a single event by ID */
export async function fetchEvent(id: string): Promise<ChainEvent> {
  const res = await fetch(`${BACKEND_URL}/api/events/${id}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch event ${id}: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<ChainEvent>;
}

/** Fetch all verified whale labels */
export async function fetchLabels(): Promise<WhaleLabel[]> {
  const res = await fetch(`${BACKEND_URL}/api/labels`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch labels: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<WhaleLabel[]>;
}

/** Fetch label for a specific address */
export async function fetchLabel(address: string): Promise<WhaleLabel> {
  const res = await fetch(`${BACKEND_URL}/api/labels/${address}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch label for ${address}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<WhaleLabel>;
}

/** Fetch recent XCM correlations */
export async function fetchXcmCorrelations(): Promise<XcmCorrelation[]> {
  const res = await fetch(`${BACKEND_URL}/api/xcm/correlations`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch XCM correlations: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<XcmCorrelation[]>;
}

/** Fetch a specific XCM correlation by ID */
export async function fetchXcmCorrelation(id: string): Promise<XcmCorrelation> {
  const res = await fetch(`${BACKEND_URL}/api/xcm/correlations/${id}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch XCM correlation ${id}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<XcmCorrelation>;
}

/** Fetch recent event aggregations */
export async function fetchAggregations(): Promise<EventAggregation[]> {
  const res = await fetch(`${BACKEND_URL}/api/aggregations`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch aggregations: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<EventAggregation[]>;
}

/** Fetch a specific aggregation by ID */
export async function fetchAggregation(id: string): Promise<EventAggregation> {
  const res = await fetch(`${BACKEND_URL}/api/aggregations/${id}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch aggregation ${id}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<EventAggregation>;
}
