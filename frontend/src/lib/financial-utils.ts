import {
  type DateRangeFilter,
  type FacetsResponse,
  type FinancialMovement,
  type ISODate,
  type KPIMetrics,
  type MonthlyDataPoint,
} from "./financial-types";

function formatMonthYearLabel(yearMonthKey: string): string {
  const [yearText, monthText] = yearMonthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function computeKPIs(movements: FinancialMovement[]): KPIMetrics {
  const totalIncome = movements
    .filter((m) => m.operation_type === "income")
    .reduce((sum, m) => sum + m.amount, 0);

  const totalOutcome = movements
    .filter((m) => m.operation_type === "outcome")
    .reduce((sum, m) => sum + m.amount, 0);

  const profit = totalIncome - totalOutcome;
  const profitPercent = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

  return { totalIncome, totalOutcome, profit, profitPercent };
}

export function computeMonthlyData(
  movements: FinancialMovement[],
): MonthlyDataPoint[] {
  const monthlyMap: Record<string, { income: number; outcome: number }> = {};

  for (const m of movements) {
    // Slicing avoids `new Date("YYYY-MM-DD")` parsing as UTC and shifting month in negative offsets.
    const yearMonthKey = m.create_date.slice(0, 7);
    if (!monthlyMap[yearMonthKey]) {
      monthlyMap[yearMonthKey] = { income: 0, outcome: 0 };
    }

    if (m.operation_type === "income") {
      monthlyMap[yearMonthKey].income += m.amount;
    } else {
      monthlyMap[yearMonthKey].outcome += m.amount;
    }
  }

  return Object.keys(monthlyMap)
    .sort()
    .map((yearMonthKey) => {
      const { income, outcome } = monthlyMap[yearMonthKey];
      const profit = income - outcome;
      const profitPercent = income > 0 ? (profit / income) * 100 : 0;
      return {
        month: formatMonthYearLabel(yearMonthKey),
        income,
        outcome,
        profitPercent,
      };
    });
}

export function formatMonthRange(data: MonthlyDataPoint[]): string {
  if (data.length === 0) return "No data";
  return `${data[0].month} - ${data[data.length - 1].month}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseISODate(value: string): ISODate | undefined {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isRealDate ? (value as ISODate) : undefined;
}

export type DateRangeError =
  | "start_after_end"
  | "start_before_min"
  | "end_after_max";

// ISO dates compare correctly as strings.
export function validateDateRange(
  filter: DateRangeFilter,
  facets: FacetsResponse | null,
): DateRangeError | null {
  const { start_date, end_date } = filter;
  if (start_date && end_date && start_date > end_date) return "start_after_end";
  if (facets && start_date && start_date < facets.min_date) {
    return "start_before_min";
  }
  if (facets && end_date && end_date > facets.max_date) return "end_after_max";
  return null;
}

export function formatISODate(value: ISODate): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
