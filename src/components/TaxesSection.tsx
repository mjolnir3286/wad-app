import type { TaxRow } from '../types'
import { formatCurrency } from '../utils'

interface TaxesSectionProps {
    taxes: TaxRow[]
    setTaxes: React.Dispatch<React.SetStateAction<TaxRow[]>>
    income: number
}

const inputClass =
    'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-money text-sm'

export default function TaxesSection({ taxes, setTaxes, income }: TaxesSectionProps) {
    const totalTaxes = taxes.reduce((sum, t) => {
        return sum + (t.mode === 'percent' ? (income * t.value) / 100 : t.value)
    }, 0)

    function addTax() {
        setTaxes(prev => [
            ...prev,
            { id: crypto.randomUUID(), name: 'New Tax', mode: 'dollar', value: 0 },
        ])
    }

    function removeTax(id: string) {
        setTaxes(prev => prev.filter(t => t.id !== id))
    }

    function updateTax(id: string, updates: Partial<TaxRow>) {
        setTaxes(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)))
    }

    return (
        <div className="space-y-2">
            {taxes.map(tax => (
                <div key={tax.id} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={tax.name}
                        onChange={e => updateTax(tax.id, { name: e.target.value })}
                        maxLength={40}
                        className={`${inputClass} flex-1 min-w-0 px-3 py-2`}
                    />

                    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-600 shrink-0">
                        <button
                            onClick={() => updateTax(tax.id, { mode: 'dollar' })}
                            className={`px-2.5 py-2 text-xs font-bold cursor-pointer transition-colors ${tax.mode === 'dollar'
                                ? 'bg-accent text-gray-900'
                                : 'bg-white dark:bg-neutral-800 text-gray-400 hover:text-accent'
                                }`}
                        >
                            $
                        </button>
                        <button
                            onClick={() => updateTax(tax.id, { mode: 'percent' })}
                            className={`px-2.5 py-2 text-xs font-bold cursor-pointer transition-colors ${tax.mode === 'percent'
                                ? 'bg-accent text-gray-900'
                                : 'bg-white dark:bg-neutral-800 text-gray-400 hover:text-accent'
                                }`}
                        >
                            %
                        </button>
                    </div>

                    <div className="relative shrink-0">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            {tax.mode === 'dollar' ? '$' : '%'}
                        </span>
                        <input
                            type="number"
                            min="0"
                            max={tax.mode === 'percent' ? 100 : undefined}
                            step={tax.mode === 'percent' ? '0.1' : '0.01'}
                            value={tax.value || ''}
                            onChange={e => updateTax(tax.id, { value: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className={`${inputClass} w-24 pl-6 pr-2 py-2`}
                        />
                    </div>

                    {tax.mode === 'percent' && income > 0 && (
                        <span className="text-xs text-gray-400 dark:text-neutral-500 w-16 text-right shrink-0">
                            {formatCurrency((income * tax.value) / 100)}
                        </span>
                    )}

                    <button
                        onClick={() => removeTax(tax.id)}
                        className="p-2 text-gray-300 dark:text-neutral-600 hover:text-danger transition-colors cursor-pointer shrink-0"
                        aria-label="Delete tax"
                    >
                        ✕
                    </button>
                </div>
            ))}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800 mt-3">
                <button
                    onClick={addTax}
                    className="px-2.5 py-2 rounded border border-accent text-accent hover:bg-accent hover:text-gray-900 text-xs font-bold cursor-pointer transition-colors"
                    aria-label="Add tax"
                >
                    +
                </button>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Total: <span className="text-danger">{formatCurrency(totalTaxes)}</span>
                </div>
            </div>
        </div>
    )
}
