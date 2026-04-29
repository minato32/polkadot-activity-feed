import type {
  ChainEvent,
  ChainId,
  EventType,
  PaginatedEvents,
  Significance,
} from "@polkadot-feed/shared";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export interface FetchEventsParams {
  chains?: ChainId[];
  eventTypes?: EventType[];
  minSignificance?: Significance;
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
