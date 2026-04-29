import type { ChainEvent, EventFilter, NotificationChannelConfig } from "@polkadot-feed/shared";
import { query } from "../database.js";
import { sendTelegramMessage, formatEventMessage } from "./telegram.js";
import { sendDiscordWebhook, formatEventEmbed } from "./discord.js";

interface NotificationConfigRow {
  id: string;
  user_id: string;
  channel: string;
  preset_id: string;
  config: NotificationChannelConfig;
  enabled: boolean;
  filters: EventFilter;
}

/** Returns true if the event satisfies all criteria in the filter */
function eventMatchesFilter(event: ChainEvent, filters: EventFilter): boolean {
  if (filters.chains && !filters.chains.includes(event.chainId)) return false;
  if (filters.eventTypes && !filters.eventTypes.includes(event.eventType)) return false;
  if (
    filters.minSignificance !== undefined &&
    event.significance < filters.minSignificance
  ) {
    return false;
  }
  if (
    filters.accounts &&
    filters.accounts.length > 0 &&
    !filters.accounts.some((a) => event.accounts.includes(a))
  ) {
    return false;
  }
  return true;
}

/**
 * Loads all enabled notification configs, matches them against the event,
 * and dispatches to Telegram or Discord as configured.
 */
export async function processNotification(event: ChainEvent): Promise<void> {
  const result = await query<NotificationConfigRow>(
    `SELECT nc.id, nc.user_id, nc.channel, nc.preset_id, nc.config, nc.enabled,
            fp.filters
     FROM notification_configs nc
     JOIN filter_presets fp ON fp.id = nc.preset_id
     WHERE nc.enabled = TRUE`,
  );

  const dispatches: Promise<void>[] = [];

  for (const row of result.rows) {
    if (!eventMatchesFilter(event, row.filters)) continue;

    if (row.channel === "telegram") {
      const cfg = row.config as { chatId?: string };
      if (cfg.chatId) {
        dispatches.push(
          sendTelegramMessage(cfg.chatId, formatEventMessage(event)).catch(
            (err: unknown) => {
              console.error(`Telegram dispatch failed for config ${row.id}:`, err);
            },
          ),
        );
      }
    } else if (row.channel === "discord") {
      const cfg = row.config as { webhookUrl?: string };
      if (cfg.webhookUrl) {
        dispatches.push(
          sendDiscordWebhook(cfg.webhookUrl, formatEventEmbed(event)).catch(
            (err: unknown) => {
              console.error(`Discord dispatch failed for config ${row.id}:`, err);
            },
          ),
        );
      }
    }
  }

  await Promise.all(dispatches);
}
