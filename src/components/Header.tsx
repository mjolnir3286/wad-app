import { formatCurrency } from '../utils'
import type { Timeframe } from '../types'
import { TIMEFRAME_LABELS } from '../types'

interface HeaderProps {
    income: number
    totalTaxes: number
    totalExpenses: number
    netIncome: number
    timeframe: Timeframe
    onExport: () => void
    onImportClick: () => void
}

export default function Header({
    income,
    totalTaxes,
    totalExpenses,
    netIncome,
    timeframe,
    onExport,
    onImportClick,
}: HeaderProps) {
    const period = TIMEFRAME_LABELS[timeframe]
    const isNegative = netIncome < 0

    return (
        <header className="sticky top-0 z-50 bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-1 grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-4">

                {/* Left: Logo */}
                <div className="shrink-0 h-14 w-28 md:h-20 md:w-40 overflow-hidden flex justify-center">
                    <img
                        src={`${import.meta.env.BASE_URL}wad.png`}
                        alt="Wad logo"
                        className="h-full w-auto object-contain scale-[2] origin-center"
                    />
                </div>

                {/* Center: Net income */}
                <div className="text-center py-2 md:py-3">
                    <div className={`text-2xl md:text-4xl font-bold tabular-nums ${isNegative ? 'text-danger' : 'text-money'}`}>
                        {formatCurrency(netIncome)}
                        <span className="text-sm md:text-base text-gray-500 dark:text-neutral-400 font-normal ml-2">/ {period}</span>
                    </div>
                    {/* Sub-values: desktop only — mobile gets its own row below */}
                    <div className="hidden md:flex flex-wrap gap-4 mt-0.5 text-xs text-gray-500 dark:text-neutral-400 justify-center">
                        <span>Gross: <span className="text-money font-medium">{formatCurrency(income)}</span></span>
                        <span>Taxes: <span className="text-danger font-medium">{formatCurrency(totalTaxes)}</span></span>
                        <span>Expenses: <span className="text-danger font-medium">{formatCurrency(totalExpenses)}</span></span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 py-2">
                    <button
                        onClick={onExport}
                        className="px-3 py-2 rounded text-xs font-semibold text-gray-500 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700 hover:text-money hover:border-money transition-colors cursor-pointer"
                        title="Export to CSV"
                    >
                        Export
                    </button>
                    <button
                        onClick={onImportClick}
                        className="px-3 py-2 rounded text-xs font-semibold text-gray-500 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700 hover:text-accent hover:border-accent transition-colors cursor-pointer"
                        title="Import CSV"
                    >
                        Import
                    </button>
                </div>
            </div>

            {/* Mobile sub-values row */}
            <div className="md:hidden flex justify-around px-4 pb-2 text-xs text-gray-500 dark:text-neutral-400">
                <span>Gross: <span className="text-money font-medium">{formatCurrency(income)}</span></span>
                <span>Taxes: <span className="text-danger font-medium">{formatCurrency(totalTaxes)}</span></span>
                <span>Expenses: <span className="text-danger font-medium">{formatCurrency(totalExpenses)}</span></span>
            </div>
        </header>
    )
}
