import { type Timeframe, type TaxRow, type ExpenseRow, type IncomeRow, type IncomeCategory, INCOME_CATEGORIES } from './types'

export interface BudgetData {
    timeframe: Timeframe
    incomeRows: IncomeRow[]
    taxes: TaxRow[]
    expenses: ExpenseRow[]
}

const VALID_TIMEFRAMES: Timeframe[] = ['hourly', 'weekly', 'biweekly', 'monthly', 'yearly']

function escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current)
            current = ''
        } else {
            current += char
        }
    }
    result.push(current)
    return result
}

export function exportToCSV(data: BudgetData): string {
    const rows: string[] = ['rowType,field1,field2,field3,field4,field5,field6']

    rows.push(`meta,timeframe,${data.timeframe}`)

    for (const row of data.incomeRows) {
        rows.push(
            ['income', escapeCsvValue(row.id), escapeCsvValue(row.name), escapeCsvValue(row.category), row.amount, row.timeframe, row.hoursPerWeek].join(','),
        )
    }

    for (const tax of data.taxes) {
        rows.push(
            ['tax', escapeCsvValue(tax.id), escapeCsvValue(tax.name), tax.mode, tax.value].join(','),
        )
    }

    for (const expense of data.expenses) {
        rows.push(
            [
                'expense',
                escapeCsvValue(expense.id),
                escapeCsvValue(expense.name),
                escapeCsvValue(expense.type),
                expense.amount,
            ].join(','),
        )
    }

    return rows.join('\n')
}

export function importFromCSV(content: string): BudgetData | null {
    try {
        const lines = content
            .trim()
            .split('\n')
            .filter(l => l.trim() && !l.startsWith('#'))

        if (lines.length === 0) return null

        const startIndex = lines[0].startsWith('rowType') ? 1 : 0
        let timeframe: Timeframe = 'monthly'
        let legacyIncome: number | null = null
        let legacyHoursPerWeek = 40
        const incomeRows: IncomeRow[] = []
        const taxes: TaxRow[] = []
        const expenses: ExpenseRow[] = []
        const validCats = INCOME_CATEGORIES as readonly string[]

        for (let i = startIndex; i < lines.length; i++) {
            const parts = parseCsvLine(lines[i])
            const rowType = parts[0]?.trim()

            if (rowType === 'meta') {
                const key = parts[1]?.trim()
                const value = parts[2]?.trim()
                if (key === 'timeframe' && VALID_TIMEFRAMES.includes(value as Timeframe)) {
                    // Clamp legacy hourly display timeframe to monthly
                    timeframe = value === 'hourly' ? 'monthly' : (value as Timeframe)
                } else if (key === 'hoursPerWeek') {
                    const n = parseFloat(value)
                    if (!isNaN(n) && n > 0) legacyHoursPerWeek = n
                } else if (key === 'income') {
                    const n = parseFloat(value)
                    if (!isNaN(n) && n >= 0) legacyIncome = n
                }
            } else if (rowType === 'income') {
                const id = parts[1]?.trim()
                const name = parts[2]?.trim().slice(0, 50)
                const category = parts[3]?.trim()
                const amount = parseFloat(parts[4]?.trim())
                const tf = parts[5]?.trim()
                const hrs = parseFloat(parts[6]?.trim()) || 40
                if (id && name !== undefined && validCats.includes(category) && !isNaN(amount) && amount >= 0 && VALID_TIMEFRAMES.includes(tf as Timeframe)) {
                    incomeRows.push({ id, name, category: category as IncomeCategory, amount, timeframe: tf as Timeframe, hoursPerWeek: hrs })
                }
            } else if (rowType === 'tax') {
                const id = parts[1]?.trim()
                const name = parts[2]?.trim().slice(0, 40)
                const mode = parts[3]?.trim()
                const value = parseFloat(parts[4]?.trim())
                if (id && name && (mode === 'dollar' || mode === 'percent') && !isNaN(value) && value >= 0) {
                    taxes.push({ id, name, mode, value })
                }
            } else if (rowType === 'expense') {
                const id = parts[1]?.trim()
                const name = parts[2]?.trim().slice(0, 50)
                const type = parts[3]?.trim().slice(0, 30)
                const amount = parseFloat(parts[4]?.trim())
                if (id && name !== undefined && type && !isNaN(amount) && amount >= 0) {
                    expenses.push({ id, name, type, amount })
                }
            }
        }

        // Backward compat: convert old single-income meta rows to an IncomeRow
        if (incomeRows.length === 0 && legacyIncome !== null) {
            incomeRows.push({
                id: 'legacy-income',
                name: 'Income',
                category: 'Payroll',
                amount: legacyIncome,
                timeframe,
                hoursPerWeek: legacyHoursPerWeek,
            })
        }

        return { timeframe, incomeRows, taxes, expenses }
    } catch {
        return null
    }
}

export function generateFilename(): string {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 5).replace(':', '')
    return `budget-export-${date}-${time}.csv`
}
