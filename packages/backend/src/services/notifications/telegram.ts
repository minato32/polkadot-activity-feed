import type { ChainEvent } from "@polkadot-feed/shared";

const TELEGRAM_API = "https://api.telegram.org";

/** Sends a plain-text message to a Telegram chat via the Bot API */
export async function sendTelegramMessage(
  chatId: string,
  message: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API error ${response.status}: ${body}`);
  }
}

/** Formats a ChainEvent into a human-readable Telegram message */
export function formatEventMessage(event: ChainEvent): string {
  const accounts =
    event.accounts.length > 0
      ? `Accounts: ${event.accounts.join(", ")}`
      : "No accounts";

  return [
    `*[${event.chainId.toUpperCase()}]* ${event.pallet}.${event.method}`,
    `Type: ${event.eventType}`,
    `Block: ${event.blockNumber}`,
    accounts,
    `Significance: ${event.significance}`,
    `Time: ${event.timestamp}`,
  ].join("\n");
}
