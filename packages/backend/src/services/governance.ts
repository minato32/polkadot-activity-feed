import type { GovernanceContext } from "@polkadot-feed/shared";
import type { NormalizedEvent } from "../handlers/event-normalizer.js";

/**
 * Enrich a governance event with on-chain context.
 *
 * Currently a stub that extracts the referendum index from event data and
 * returns placeholder context. A future iteration can query Polkassembly or
 * on-chain storage for full referendum details (title, track, tally, status).
 */
export function enrichGovernanceEvent(event: NormalizedEvent): GovernanceContext {
  // Extract referendum index from event data — field name varies by pallet
  const rawIndex =
    event.data["referendumIndex"] ??
    event.data["index"] ??
    event.data["pollIndex"] ??
    event.data["ref_index"];

  const referendumIndex =
    typeof rawIndex === "number"
      ? rawIndex
      : typeof rawIndex === "string"
        ? parseInt(rawIndex, 10)
        : -1;

  // Placeholder: title, track, tally, and status will be filled by
  // Polkassembly API integration or on-chain storage queries in a future pass.
  return {
    referendumIndex,
    title: null,
    track: null,
    currentTally: null,
    status: null,
  };
}
