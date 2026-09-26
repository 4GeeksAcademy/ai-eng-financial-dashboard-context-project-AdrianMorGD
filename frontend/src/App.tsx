import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { KPIRow } from "@/components/dashboard/kpi-row";
import { IncomeOutcomeChart } from "@/components/dashboard/income-outcome-chart";
import { ProfitPercentChart } from "@/components/dashboard/profit-percent-chart";
import { fetchFacets, fetchMovements } from "@/lib/api";
import {
  type DateRangeFilter as DateRangeValue,
  type FacetsResponse,
  type KPIMetrics,
  type MonthlyDataPoint,
} from "@/lib/financial-types";
import {
  computeKPIs,
  computeMonthlyData,
  formatMonthRange,
} from "@/lib/financial-utils";

function App() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeValue>({});
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [facetsLoading, setFacetsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchFacets(controller.signal)
      .then(setFacets)
      .catch(() => {
        // Leaving facets null makes the filter show "range unavailable".
      })
      .finally(() => {
        if (!controller.signal.aborted) setFacetsLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchMovements(dateRange, controller.signal)
      .then((movements) => {
        setMetrics(computeKPIs(movements));
        setMonthlyData(computeMonthlyData(movements));
        setError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [dateRange]);

  function handleDateRangeChange(next: DateRangeValue) {
    setLoading(true);
    setDateRange(next);
  }

  const isEmpty = !loading && !error && monthlyData.length === 0;

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader
            period={loading ? "Loading..." : formatMonthRange(monthlyData)}
          />

          <DateRangeFilter
            value={dateRange}
            onChange={handleDateRangeChange}
            facets={facets}
            loading={facetsLoading}
          />

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
              {error}
            </div>
          ) : null}

          {isEmpty ? (
            <div className="rounded-lg border border-border bg-secondary p-4 text-sm text-secondary-foreground">
              No movements in the selected range.
            </div>
          ) : null}

          <section aria-label="Key performance indicators">
            <KPIRow metrics={metrics} loading={loading} />
          </section>

          <section
            aria-label="Financial charts"
            className="grid grid-cols-1 gap-4 xl:grid-cols-2"
          >
            <IncomeOutcomeChart data={monthlyData} loading={loading} />
            <ProfitPercentChart data={monthlyData} loading={loading} />
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
