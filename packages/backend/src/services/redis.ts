import Redis from "ioredis";

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(REDIS_URL);
  }
  return publisher;
}

export function getSubscriber(): Redis {
  if (!subscriber) {
    subscriber = new Redis(REDIS_URL);
  }
  return subscriber;
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
