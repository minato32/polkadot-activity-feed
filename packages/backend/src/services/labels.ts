import type { WhaleLabel, LabelCategory } from "@polkadot-feed/shared";
import { query } from "./database.js";

interface WhaleLabelRow {
  id: string;
  address: string;
  label: string;
  category: string;
  source: string;
  verified: boolean;
  created_at: string;
}

function rowToLabel(row: WhaleLabelRow): WhaleLabel {
  return {
    id: row.id,
    address: row.address,
    label: row.label,
    category: row.category as LabelCategory,
    source: row.source as "official" | "community",
    verified: row.verified,
    createdAt: row.created_at,
  };
}

/** Look up a label by exact address */
export async function getLabel(address: string): Promise<WhaleLabel | null> {
  const result = await query<WhaleLabelRow>(
    "SELECT id, address, label, category, source, verified, created_at FROM whale_labels WHERE address = $1",
    [address],
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToLabel(row);
}

/** Bulk lookup for a list of addresses */
export async function getLabels(addresses: string[]): Promise<WhaleLabel[]> {
  if (addresses.length === 0) return [];
  const result = await query<WhaleLabelRow>(
    "SELECT id, address, label, category, source, verified, created_at FROM whale_labels WHERE address = ANY($1::text[])",
    [addresses],
  );
  return result.rows.map(rowToLabel);
}

/** List all verified labels */
export async function getAllLabels(): Promise<WhaleLabel[]> {
  const result = await query<WhaleLabelRow>(
    "SELECT id, address, label, category, source, verified, created_at FROM whale_labels WHERE verified = true ORDER BY label ASC",
  );
  return result.rows.map(rowToLabel);
}

/** Submit an unverified community label */
export async function submitLabel(
  address: string,
  label: string,
  category: LabelCategory,
): Promise<WhaleLabel> {
  const result = await query<WhaleLabelRow>(
    `INSERT INTO whale_labels (address, label, category, source, verified)
     VALUES ($1, $2, $3, 'community', false)
     ON CONFLICT (address) DO UPDATE SET label = EXCLUDED.label, category = EXCLUDED.category
     RETURNING id, address, label, category, source, verified, created_at`,
    [address, label, category],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Label insert failed");
  return rowToLabel(row);
}

/** Admin: mark a label as verified */
export async function verifyLabel(id: string): Promise<WhaleLabel | null> {
  const result = await query<WhaleLabelRow>(
    `UPDATE whale_labels SET verified = true WHERE id = $1
     RETURNING id, address, label, category, source, verified, created_at`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return rowToLabel(row);
}
