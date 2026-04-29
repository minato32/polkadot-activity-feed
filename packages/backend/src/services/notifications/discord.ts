import type { ChainEvent } from "@polkadot-feed/shared";

/** Discord embed color per chain */
const CHAIN_COLORS: Record<string, number> = {
  polkadot: 0xe6007a,
  "asset-hub": 0x77b255,
  moonbeam: 0x53cbc9,
  hydration: 0x4ade80,
  acala: 0xf59e0b,
};

export interface DiscordEmbed {
  title: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  footer: { text: string };
  timestamp: string;
}

/** Formats a ChainEvent as a Discord embed object */
export function formatEventEmbed(event: ChainEvent): DiscordEmbed {
  const color = CHAIN_COLORS[event.chainId] ?? 0x888888;

  return {
    title: `${event.pallet}.${event.method} on ${event.chainId.toUpperCase()}`,
    color,
    fields: [
      { name: "Event Type", value: event.eventType, inline: true },
      { name: "Block", value: String(event.blockNumber), inline: true },
      { name: "Significance", value: String(event.significance), inline: true },
      {
        name: "Accounts",
        value: event.accounts.length > 0 ? event.accounts.join("\n") : "None",
        inline: false,
      },
    ],
    footer: { text: "Polkadot Activity Feed" },
    timestamp: event.timestamp,
  };
}

/** POSTs an embed to a Discord webhook URL */
export async function sendDiscordWebhook(
  webhookUrl: string,
  embed: DiscordEmbed,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord webhook error ${response.status}: ${body}`);
  }
}
