import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/** Channel naming convention for event pub/sub */
export const CHANNELS = {
  /** All events across all chains */
  all: "events:all",
  /** Events for a specific chain: events:<chain_id> */
  chain: (chainId: string) => `events:${chainId}`,
} as const;

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

function createClient(label: string): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5_000);
      return delay;
    },
    lazyConnect: false,
  });

  client.on("connect", () => {
    console.log(`Redis ${label}: connected`);
  });

  client.on("error", (err) => {
    console.error(`Redis ${label} error:`, err.message);
  });

  return client;
}

export function getPublisher(): Redis {
  if (!publisher) {
    publisher = createClient("publisher");
  }
  return publisher;
}

export function getSubscriber(): Redis {
  if (!subscriber) {
    subscriber = createClient("subscriber");
  }
  return subscriber;
}

export async function publishEvent(
  chainId: string,
  payload: string,
): Promise<void> {
  const pub = getPublisher();
  await Promise.all([
    pub.publish(CHANNELS.all, payload),
    pub.publish(CHANNELS.chain(chainId), payload),
  ]);
}

export async function healthCheck(): Promise<boolean> {
  try {
    const result = await getPublisher().ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (publisher) {
    publisher.disconnect();
    publisher = null;
  }
  if (subscriber) {
    subscriber.disconnect();
    subscriber = null;
  }
}
