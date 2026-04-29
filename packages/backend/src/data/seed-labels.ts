import type { LabelCategory } from "@polkadot-feed/shared";
import { query } from "../services/database.js";

interface SeedLabel {
  address: string;
  label: string;
  category: LabelCategory;
  source: "official" | "community";
  verified: boolean;
}

/**
 * Known addresses for seeding the whale_labels table.
 * Addresses are approximate / well-known examples for Polkadot.
 */
const SEED_LABELS: SeedLabel[] = [
  {
    address: "1qnJN7FViy3HZaxZK9tGAA71zxHSBeUweirKqCaox4t8GT7",
    label: "Binance Hot Wallet",
    category: "exchange",
    source: "community",
    verified: true,
  },
  {
    address: "HWyLYmpW68JGJYoVJcot6am1wdBbKRK7XqNnFDMKkiTtkNF",
    label: "Kraken",
    category: "exchange",
    source: "community",
    verified: true,
  },
  {
    address: "13UVJyLnbVp9RBZYFwFGyDvVd1y27Tt8tkntv6Q7JVPhFsTB",
    label: "Polkadot Treasury",
    category: "treasury",
    source: "official",
    verified: true,
  },
  {
    address: "1REAJ1k691g5Eqqg9gL7vvZL1hS1b2XiCE7NjFSdCcCdBz",
    label: "Web3 Foundation Validator",
    category: "validator",
    source: "official",
    verified: true,
  },
  {
    address: "14Ns6zKQAvs3sYkbuF9n6EYjBiYnhZkFQHFxjpkeLy1EBNMS",
    label: "Parity Technologies Validator",
    category: "team",
    source: "official",
    verified: true,
  },
];

/** Insert seed labels, skipping conflicts (address already exists) */
export async function seedLabels(): Promise<void> {
  for (const seed of SEED_LABELS) {
    await query(
      `INSERT INTO whale_labels (address, label, category, source, verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (address) DO NOTHING`,
      [seed.address, seed.label, seed.category, seed.source, seed.verified],
    );
  }
  console.log("Seed labels inserted");
}
