import { describe, it, expect } from "vitest";
import { truncateAddress, cn } from "../src/lib/utils";

describe("truncateAddress", () => {
  it("truncates long addresses", () => {
    const addr = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    const result = truncateAddress(addr);
    expect(result).toMatch(/^5Grwv.*utQY$/);
    expect(result.length).toBeLessThan(addr.length);
  });

  it("returns short strings as-is", () => {
    expect(truncateAddress("short")).toBe("short");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles undefined values", () => {
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
  });
});
