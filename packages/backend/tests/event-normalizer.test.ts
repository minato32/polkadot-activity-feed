import { describe, it, expect } from "vitest";
import { normalizeEvent, isTrackedEvent } from "../src/handlers/event-normalizer.js";

describe("isTrackedEvent", () => {
  it("returns true for tracked pallet.method", () => {
    expect(isTrackedEvent("balances", "Transfer")).toBe(true);
    expect(isTrackedEvent("referenda", "Submitted")).toBe(true);
    expect(isTrackedEvent("staking", "Slashed")).toBe(true);
  });

  it("returns false for untracked pallet.method", () => {
    expect(isTrackedEvent("system", "ExtrinsicSuccess")).toBe(false);
    expect(isTrackedEvent("timestamp", "Set")).toBe(false);
  });
});

describe("normalizeEvent", () => {
  it("normalizes a balances.Transfer event", () => {
    const result = normalizeEvent({
      chainId: "polkadot",
      blockNumber: 12345,
      timestamp: new Date("2026-01-01T00:00:00Z"),
      pallet: "balances",
      method: "Transfer",
      data: { from: "5GrwvaEF...", to: "5FHneW46...", amount: "1000000000000" },
    });

    expect(result).not.toBeNull();
    expect(result!.eventType).toBe("transfer");
    expect(result!.accounts).toContain("5GrwvaEF...");
    expect(result!.accounts).toContain("5FHneW46...");
  });

  it("returns null for untracked events", () => {
    const result = normalizeEvent({
      chainId: "polkadot",
      blockNumber: 12345,
      timestamp: new Date("2026-01-01T00:00:00Z"),
      pallet: "system",
      method: "ExtrinsicSuccess",
      data: {},
    });

    expect(result).toBeNull();
  });

  it("scores staking_slash as Major", () => {
    const result = normalizeEvent({
      chainId: "polkadot",
      blockNumber: 12345,
      timestamp: new Date("2026-01-01T00:00:00Z"),
      pallet: "staking",
      method: "Slashed",
      data: { validator: "5GrwvaEF...", amount: "500000000000" },
    });

    expect(result).not.toBeNull();
    expect(result!.significance).toBe(2);
  });
});
