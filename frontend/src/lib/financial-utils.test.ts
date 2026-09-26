import { describe, expect, it } from "vitest";

import {
  computeKPIs,
  computeMonthlyData,
  formatCurrency,
  formatISODate,
  formatMonthRange,
  formatPercent,
  parseISODate,
  validateDateRange,
} from "./financial-utils";
import type { FacetsResponse, FinancialMovement } from "./financial-types";

const sampleMovements: FinancialMovement[] = [
  {
    create_date: "2024-01-10",
    amount: 1000,
    operation_type: "income",
    category: "sales",
    business_type: "B2B",
  },
  {
    create_date: "2024-01-15",
    amount: 250,
    operation_type: "outcome",
    category: "suppliers",
    business_type: "B2B",
  },
  {
    create_date: "2024-02-01",
    amount: 500,
    operation_type: "income",
    category: "sales",
    business_type: "B2C",
  },
];

describe("computeKPIs", () => {
  it("calculates totals and profit values", () => {
    const metrics = computeKPIs(sampleMovements);

    expect(metrics).toEqual({
      totalIncome: 1500,
      totalOutcome: 250,
      profit: 1250,
      profitPercent: (1250 / 1500) * 100,
    });
  });

  it("returns 0 profitPercent when there is no income", () => {
    const onlyOutcomes: FinancialMovement[] = [
      {
        create_date: "2024-03-05",
        amount: 350,
        operation_type: "outcome",
        category: "operational",
        business_type: "B2B",
      },
    ];

    const metrics = computeKPIs(onlyOutcomes);
    expect(metrics.profitPercent).toBe(0);
  });
});

describe("computeMonthlyData", () => {
  it("returns chronological year-month points with aggregated totals", () => {
    const unsortedCrossYearMovements: FinancialMovement[] = [
      {
        create_date: "2026-01-08",
        amount: 300,
        operation_type: "income",
        category: "sales",
        business_type: "B2C",
      },
      {
        create_date: "2025-12-05",
        amount: 200,
        operation_type: "outcome",
        category: "operational",
        business_type: "B2B",
      },
      {
        create_date: "2025-12-03",
        amount: 1000,
        operation_type: "income",
        category: "sales",
        business_type: "B2B",
      },
    ];
    const monthlyData = computeMonthlyData(unsortedCrossYearMovements);

    expect(monthlyData).toHaveLength(2);
    expect(monthlyData[0]).toEqual({
      month: "Dec 2025",
      income: 1000,
      outcome: 200,
      profitPercent: 80,
    });
    expect(monthlyData[1]).toEqual({
      month: "Jan 2026",
      income: 300,
      outcome: 0,
      profitPercent: 100,
    });
  });
});

describe("formatMonthRange", () => {
  it("uses the first and last months present in the data", () => {
    const movements: FinancialMovement[] = [
      {
        create_date: "2026-01-08",
        amount: 300,
        operation_type: "income",
        category: "sales",
        business_type: "B2C",
      },
      {
        create_date: "2025-12-05",
        amount: 200,
        operation_type: "outcome",
        category: "operational",
        business_type: "B2B",
      },
    ];

    expect(formatMonthRange(computeMonthlyData(movements))).toBe(
      "Dec 2025 - Jan 2026",
    );
  });

  it("returns a fallback when there are no data points", () => {
    expect(formatMonthRange([])).toBe("No data");
  });
});

describe("formatters", () => {
  it("formats currency without decimals", () => {
    expect(formatCurrency(1234.56)).toBe("$1,235");
  });

  it("formats percent with one decimal", () => {
    expect(formatPercent(15.555)).toBe("15.6%");
  });
});

describe("computeMonthlyData month keys", () => {
  it("groups by the calendar month in create_date regardless of timezone", () => {
    const data = computeMonthlyData([
      {
        create_date: "2025-10-01",
        amount: 100,
        operation_type: "income",
        category: "sales",
        business_type: "B2B",
      },
    ]);

    expect(data.map((point) => point.month)).toEqual(["Oct 2025"]);
  });
});

describe("parseISODate", () => {
  it("accepts real YYYY-MM-DD dates", () => {
    expect(parseISODate("2024-02-29")).toBe("2024-02-29");
  });

  it.each(["", "2025-02-29", "2025-13-01", "2025-1-01", "2025/01/01", "01-01-2025"])(
    "rejects %j",
    (value) => {
      expect(parseISODate(value)).toBeUndefined();
    },
  );
});

describe("validateDateRange", () => {
  const facets: FacetsResponse = {
    operation_types: ["income", "outcome"],
    business_types: ["B2B", "B2C"],
    categories: ["sales"],
    categories_by_business_type: {},
    min_date: "2025-09-02",
    max_date: "2026-08-28",
  };

  it("accepts an empty filter and single bounds", () => {
    expect(validateDateRange({}, facets)).toBeNull();
    expect(validateDateRange({ start_date: "2025-09-02" }, facets)).toBeNull();
    expect(validateDateRange({ end_date: "2026-08-28" }, facets)).toBeNull();
  });

  it("accepts equal start and end dates", () => {
    expect(
      validateDateRange({ start_date: "2026-01-15", end_date: "2026-01-15" }, facets),
    ).toBeNull();
  });

  it("rejects a start after the end, even without facets", () => {
    expect(
      validateDateRange({ start_date: "2026-02-01", end_date: "2026-01-31" }, null),
    ).toBe("start_after_end");
  });

  it("rejects bounds outside the available range", () => {
    expect(validateDateRange({ start_date: "2025-09-01" }, facets)).toBe(
      "start_before_min",
    );
    expect(validateDateRange({ end_date: "2026-08-29" }, facets)).toBe(
      "end_after_max",
    );
  });

  it("skips range checks when facets are unavailable", () => {
    expect(validateDateRange({ start_date: "2000-01-01" }, null)).toBeNull();
  });
});

describe("formatISODate", () => {
  it("formats without shifting the day across timezones", () => {
    expect(formatISODate("2025-09-02")).toBe("Sep 2, 2025");
  });
});
