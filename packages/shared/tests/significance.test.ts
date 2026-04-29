import { describe, it, expect } from "vitest";
import { computeSignificance } from "../src/significance.js";

describe("computeSignificance", () => {
  it("scores runtime_upgrade as Major", () => {
    expect(computeSignificance("runtime_upgrade", {})).toBe(2);
  });

  it("scores staking_slash as Major", () => {
    expect(computeSignificance("staking_slash", {})).toBe(2);
  });

  it("scores xcm_failed as Major", () => {
    expect(computeSignificance("xcm_failed", {})).toBe(2);
  });

  it("scores governance_confirmed as Major", () => {
    expect(computeSignificance("governance_confirmed", {})).toBe(2);
  });

  it("scores governance_rejected as Major", () => {
    expect(computeSignificance("governance_rejected", {})).toBe(2);
  });

  it("scores governance_submitted as Notable", () => {
    expect(computeSignificance("governance_submitted", {})).toBe(1);
  });

  it("scores validator_offline as Notable", () => {
    expect(computeSignificance("validator_offline", {})).toBe(1);
  });

  it("scores coretime_purchased as Notable", () => {
    expect(computeSignificance("coretime_purchased", {})).toBe(1);
  });

  it("scores small transfer as Normal", () => {
    expect(computeSignificance("transfer", { amount: "1000000000000" })).toBe(0);
  });

  it("scores medium transfer as Notable", () => {
    // 10K DOT = 10_000 * 10^10 = 100_000_000_000_000
    expect(computeSignificance("transfer", { amount: "100000000000000" })).toBe(1);
  });

  it("scores large transfer as Major", () => {
    // 100K DOT = 1_000_000_000_000_000
    expect(computeSignificance("transfer", { amount: "1000000000000000" })).toBe(2);
  });

  it("scores treasury_awarded as at least Notable", () => {
    expect(computeSignificance("treasury_awarded", { amount: "1000" })).toBe(1);
  });

  it("scores staking_reward as Normal", () => {
    expect(computeSignificance("staking_reward", {})).toBe(0);
  });

  it("scores identity_set as Normal", () => {
    expect(computeSignificance("identity_set", {})).toBe(0);
  });

  it("scores governance_vote as Normal", () => {
    expect(computeSignificance("governance_vote", {})).toBe(0);
  });
});
