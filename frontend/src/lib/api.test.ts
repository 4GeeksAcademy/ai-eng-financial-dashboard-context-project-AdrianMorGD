import { describe, expect, it } from "vitest";

import { toQueryString } from "./api";

describe("toQueryString", () => {
  it("returns an empty string when no bounds are set", () => {
    expect(toQueryString({})).toBe("");
  });

  it("omits undefined keys", () => {
    expect(toQueryString({ start_date: "2026-01-01", end_date: undefined })).toBe(
      "?start_date=2026-01-01",
    );
  });

  it("serializes both bounds", () => {
    expect(
      toQueryString({ start_date: "2026-01-01", end_date: "2026-03-31" }),
    ).toBe("?start_date=2026-01-01&end_date=2026-03-31");
  });
});
