import type { ExpenseRow } from '../types'
import { EXPENSE_TYPES } from '../types'
import { formatCurrency } from '../utils'

interface ExpensesSectionProps {
    expenses: ExpenseRow[]
    setExpenses: React.Dispatch<React.SetStateAction<ExpenseRow[]>>
}

const inputClass =
    'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-money text-sm'

const STANDARD_TYPES = EXPENSE_TYPES.filter(t => t !== 'Other')
const ALLOWED_CHARS = /^[a-zA-Z0-9\s\-'/.&]*$/

export default function ExpensesSection({ expenses, setExpenses }: ExpensesSectionProps) {
    const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.amount), 0)

    function addExpense() {
        setExpenses(prev => [
            ...prev,
            { id: crypto.randomUUID(), name: '', type: 'Bill', amount: 0 },
        ])
    }

    function removeExpense(id: string) {
        setExpenses(prev => prev.filter(e => e.id !== id))
    }

    function updateExpense(id: string, updates: Partial<ExpenseRow>) {
        setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)))
    }

    return (
        <div className="space-y-2">
            {expenses.length === 0 && (
                <p className="text-gray-400 dark:text-neutral-500 text-sm text-center py-4">
                    No expenses added yet.
                </p>
            )}

            {expenses.map(expense => {
                const isCustomType = !STANDARD_TYPES.includes(expense.type as typeof STANDARD_TYPES[number])
                const selectValue = isCustomType ? 'Other' : expense.type
                const showCustomInput = isCustomType || expense.type === 'Other'

                return (
                    <div key={expense.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input
                            type="text"
                            value={expense.name}
                            onChange={e => updateExpense(expense.id, { name: e.target.value })}
                            placeholder="Expense name"
                            maxLength={50}
                            className={`${inputClass} w-full sm:flex-1 min-w-0 px-3 py-2`}
                        />

                        {showCustomInput ? (
                            <div className="flex items-center gap-1 shrink-0">
                                <input
                                    type="text"
                                    value={expense.type === 'Other' ? '' : expense.type}
                                    onChange={e => {
                                        const val = e.target.value
                                        if (ALLOWED_CHARS.test(val) && val.length <= 30) {
                                            updateExpense(expense.id, { type: val || 'Other' })
                                        }
                                    }}
                                    placeholder="Describe..."
                                    maxLength={30}
                                    className={`${inputClass} w-28 px-3 py-2 focus:ring-accent border-accent`}
                                />
                                <button
                                    onClick={() => updateExpense(expense.id, { type: 'Bill' })}
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer px-1"
                                    aria-label="Back to list"
                                    title="Back to list"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <select
                                value={selectValue}
                                onChange={e => updateExpense(expense.id, { type: e.target.value })}
                                className={`${inputClass} px-3 py-2 cursor-pointer shrink-0`}
                            >
                                {EXPENSE_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        )}

                        <div className="relative shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-danger text-xs font-bold select-none">
                                -$
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={Math.abs(expense.amount) || ''}
                                onChange={e =>
                                    updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })
                                }
                                placeholder="0.00"
                                className={`${inputClass} w-28 pl-7 pr-2 py-2 text-danger font-semibold`}
                            />
                        </div>

                        <button
                            onClick={() => removeExpense(expense.id)}
                            className="p-2 text-gray-300 dark:text-neutral-600 hover:text-danger transition-colors cursor-pointer shrink-0"
                            aria-label="Delete expense"
                        >
                            ✕
                        </button>
                    </div>
                )
            })}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800 mt-3">
                <button
                    onClick={addExpense}
                    className="px-2.5 py-2 rounded border border-accent text-accent hover:bg-accent hover:text-gray-900 text-xs font-bold cursor-pointer transition-colors"
                    aria-label="Add expense"
                >
                    +
                </button>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total: <span className="text-danger">{formatCurrency(totalExpenses)}</span>
                </div>
            </div>
        </div>
    )
}
