export type Timeframe = 'hourly' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'
export type MobileTab = 'income' | 'taxes' | 'expenses' | 'planning'
export type DesktopView = 'budget' | 'planning'

export interface TaxRow {
    id: string
    name: string
    mode: 'dollar' | 'percent'
    value: number
}

export interface ExpenseRow {
    id: string
    name: string
    type: string
    amount: number
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
    hourly: 'Hour',
    weekly: 'Week',
    biweekly: 'Bi-Week',
    monthly: 'Month',
    yearly: 'Year',
}

export const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]

export const EXPENSE_TYPES = [
    'Bill',
    'Subscription',
    'Payment',
    'Food',
    'Gas',
    'Entertainment',
    'Other',
] as const

export const INCOME_CATEGORIES = [
    'Payroll',
    'Freelance',
    'Allowance',
    'Tips',
    'Dividend',
    'Pension',
    'Rental',
    'Benefits',
    'Other',
] as const
export type IncomeCategory = typeof INCOME_CATEGORIES[number]

// Categories for which the Hourly timeframe is available
export const HOURLY_INCOME_CATEGORIES = new Set<IncomeCategory>(['Payroll', 'Freelance'])

export interface IncomeRow {
    id: string
    name: string
    category: IncomeCategory
    amount: number
    timeframe: Timeframe
    hoursPerWeek: number
}
