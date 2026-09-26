export type OperationType = 'income' | 'outcome'
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'
export type BusinessType = 'B2B' | 'B2C'

/** Calendar date in `YYYY-MM-DD` format (OpenAPI `format: date`). */
export type ISODate = `${number}-${number}-${number}`

export interface FinancialMovement {
  create_date: string // ISO date
  amount: number
  operation_type: OperationType
  category: Category
  business_type: BusinessType
}

export interface KPIMetrics {
  totalIncome: number
  totalOutcome: number
  profit: number
  profitPercent: number
}

export interface MonthlyDataPoint {
  month: string
  income: number
  outcome: number
  profitPercent: number
}

/** Inclusive date bounds for metrics endpoints; omit a key instead of sending `""`. */
export interface DateRangeFilter {
  start_date?: ISODate
  end_date?: ISODate
}

/** Mirrors `MetricsFacets` in `backend/app/routes.py`; computed over the full dataset. */
export interface FacetsResponse {
  operation_types: OperationType[]
  business_types: BusinessType[]
  categories: Category[]
  categories_by_business_type: Partial<Record<BusinessType, Partial<Record<OperationType, Category[]>>>>
  min_date: ISODate
  max_date: ISODate
}
