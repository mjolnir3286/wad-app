import type { IncomeRow, IncomeCategory, Timeframe } from '../types'
import { INCOME_CATEGORIES, HOURLY_INCOME_CATEGORIES, TIMEFRAME_OPTIONS, TIMEFRAME_LABELS } from '../types'
import { formatCurrency } from '../utils'

interface IncomeSectionProps {
    incomeRows: IncomeRow[]
    setIncomeRows: React.Dispatch<React.SetStateAction<IncomeRow[]>>
    timeframe: Timeframe
    totalIncome: number
}

const inputClass =
    'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-money text-sm'

// Display period options — hourly excluded since it doesn't make sense as a budget view period
const PERIOD_OPTIONS = TIMEFRAME_OPTIONS.filter(o => o.value !== 'hourly')

export default function IncomeSection({
    incomeRows,
    setIncomeRows,
    timeframe,
    totalIncome,
}: IncomeSectionProps) {
    function addRow() {
        setIncomeRows(prev => [
            ...prev,
            { id: crypto.randomUUID(), name: '', category: 'Payroll', amount: 0, timeframe: 'monthly', hoursPerWeek: 40 },
        ])
    }

    function removeRow(id: string) {
        setIncomeRows(prev => prev.filter(r => r.id !== id))
    }

    function updateRow(id: string, updates: Partial<IncomeRow>) {
        setIncomeRows(prev =>
            prev.map(r => {
                if (r.id !== id) return r
                const next = { ...r, ...updates }
                // If category changes away from an hourly-eligible category, reset timeframe
                if (updates.category && !HOURLY_INCOME_CATEGORIES.has(next.category) && next.timeframe === 'hourly') {
                    next.timeframe = 'monthly'
                }
                return next
            })
        )
    }

    return (
        <div className="space-y-2">

            {incomeRows.length === 0 && (
                <p className="text-gray-400 dark:text-neutral-500 text-sm text-center py-4">
                    No income sources added yet.
                </p>
            )}

            {incomeRows.map(row => {
                const canBeHourly = HOURLY_INCOME_CATEGORIES.has(row.category)
                const tfOptions = canBeHourly ? TIMEFRAME_OPTIONS : PERIOD_OPTIONS

                return (
                    <div key={row.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input
                            type="text"
                            value={row.name}
                            onChange={e => updateRow(row.id, { name: e.target.value })}
                            placeholder="Source name"
                            maxLength={50}
                            className={`${inputClass} w-full sm:flex-1 min-w-0 px-3 py-2`}
                        />

                        <select
                            value={row.category}
                            onChange={e => updateRow(row.id, { category: e.target.value as IncomeCategory })}
                            className={`${inputClass} px-3 py-2 cursor-pointer shrink-0`}
                        >
                            {INCOME_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <div className="relative shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-money text-xs font-bold select-none">
                                $
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={row.amount || ''}
                                onChange={e => updateRow(row.id, { amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className={`${inputClass} w-28 pl-6 pr-2 py-2 text-money font-semibold`}
                            />
                        </div>

                        <select
                            value={row.timeframe}
                            onChange={e => updateRow(row.id, { timeframe: e.target.value as Timeframe })}
                            className={`${inputClass} px-3 py-2 cursor-pointer shrink-0`}
                        >
                            {tfOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {row.timeframe === 'hourly' && (
                            <input
                                type="number"
                                min="1"
                                max="168"
                                value={row.hoursPerWeek || ''}
                                onChange={e => updateRow(row.id, { hoursPerWeek: parseFloat(e.target.value) || 0 })}
                                placeholder="hrs/wk"
                                title="Hours per week"
                                className={`${inputClass} w-20 px-2 py-2 text-center shrink-0`}
                            />
                        )}

                        <button
                            onClick={() => removeRow(row.id)}
                            className="p-2 text-gray-300 dark:text-neutral-600 hover:text-danger transition-colors cursor-pointer shrink-0"
                            aria-label="Delete income source"
                        >
                            ✕
                        </button>
                    </div>
                )
            })}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800 mt-3">
                <button
                    onClick={addRow}
                    className="px-2.5 py-2 rounded border border-accent text-accent hover:bg-accent hover:text-gray-900 text-xs font-bold cursor-pointer transition-colors"
                    aria-label="Add income source"
                >
                    +
                </button>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total: <span className="text-money">{formatCurrency(totalIncome)}</span>
                    <span className="text-xs text-gray-400 dark:text-neutral-500 font-normal ml-1">
                        / {TIMEFRAME_LABELS[timeframe]}
                    </span>
                </div>
            </div>
        </div>
    )
}
