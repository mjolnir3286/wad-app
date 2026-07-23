import { useState, useRef } from 'react'
import Header from './components/Header'
import IncomeSection from './components/IncomeSection'
import TaxesSection from './components/TaxesSection'
import ExpensesSection from './components/ExpensesSection'
import PlanningTab from './components/PlanningTab'
import type { Timeframe, MobileTab, DesktopView, TaxRow, ExpenseRow, IncomeRow } from './types'
import { convertValue } from './utils'
import { exportToCSV, importFromCSV, generateFilename } from './csvUtils'

const DEFAULT_TAXES: TaxRow[] = [
  { id: 'federal', name: 'Federal Income', mode: 'dollar', value: 0 },
  { id: 'state', name: 'State Income', mode: 'dollar', value: 0 },
  { id: 'social-security', name: 'Social Security', mode: 'dollar', value: 0 },
  { id: 'medicare', name: 'Medicare', mode: 'dollar', value: 0 },
]

const MOBILE_TABS: MobileTab[] = ['income', 'taxes', 'expenses', 'planning']

export default function App() {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly')
  const [incomeRows, setIncomeRows] = useState<IncomeRow[]>(() => [
    { id: crypto.randomUUID(), name: '', category: 'Payroll', amount: 0, timeframe: 'monthly', hoursPerWeek: 40 },
  ])
  const [taxes, setTaxes] = useState<TaxRow[]>(DEFAULT_TAXES)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [mobileTab, setMobileTab] = useState<MobileTab>('income')
  const [desktopView, setDesktopView] = useState<DesktopView>('budget')
  const [importError, setImportError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalIncome = incomeRows.reduce((sum, row) => {
    if (row.timeframe === 'hourly') {
      return sum + convertValue(row.amount * row.hoursPerWeek, 'weekly', timeframe, 0)
    }
    return sum + convertValue(row.amount, row.timeframe, timeframe, 0)
  }, 0)
  const totalTaxes = taxes.reduce((sum, t) => {
    return sum + (t.mode === 'percent' ? (totalIncome * t.value) / 100 : t.value)
  }, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.amount), 0)
  const netIncome = totalIncome - totalTaxes - totalExpenses

  function handleTimeframeChange(newTimeframe: Timeframe) {
    if (newTimeframe === timeframe) return
    const convert = (v: number) => convertValue(v, timeframe, newTimeframe, 0)
    setTaxes(prev =>
      prev.map(t => ({ ...t, value: t.mode === 'dollar' ? convert(t.value) : t.value }))
    )
    setExpenses(prev => prev.map(e => ({ ...e, amount: convert(e.amount) })))
    setTimeframe(newTimeframe)
  }

  function handleExport() {
    const csv = exportToCSV({ timeframe, incomeRows, taxes, expenses })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generateFilename()
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const data = importFromCSV(ev.target?.result as string)
      if (data) {
        setTimeframe(data.timeframe)
        setIncomeRows(data.incomeRows)
        setTaxes(data.taxes)
        setExpenses(data.expenses)
        setImportError(false)
      } else {
        setImportError(true)
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <Header
        income={totalIncome}
        totalTaxes={totalTaxes}
        totalExpenses={totalExpenses}
        netIncome={netIncome}
        timeframe={timeframe}
        onExport={handleExport}
        onImportClick={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportFile}
      />
      {importError && (
        <div className="bg-danger/10 border-b border-danger/30 text-danger text-sm text-center py-2 px-4">
          Could not import file. Make sure it\'s a valid budget export.
          <button onClick={() => setImportError(false)} className="ml-3 underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Desktop tab bar */}
      <nav className="hidden md:flex border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto w-full px-4 flex">
          <button
            onClick={() => setDesktopView('budget')}
            className={`py-3 px-6 font-semibold text-sm transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${desktopView === 'budget'
              ? 'text-accent border-accent'
              : 'text-gray-500 dark:text-neutral-400 border-transparent hover:text-accent'
              }`}
          >
            <img src="/budget.png" alt="" className="h-5 w-5 object-contain" />
            Budget
          </button>
          <button
            onClick={() => setDesktopView('planning')}
            className={`py-3 px-6 font-semibold text-sm transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${desktopView === 'planning'
              ? 'text-accent border-accent'
              : 'text-gray-500 dark:text-neutral-400 border-transparent hover:text-accent'
              }`}
          >
            <img src="/plan.png" alt="" className="h-5 w-5 object-contain" />
            Plan
          </button>
        </div>
      </nav>

      {/* Mobile tab bar */}
      <nav className="md:hidden flex border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 sticky top-16 z-40">
        {([
          { id: 'income' as MobileTab, label: 'Income', icon: '/income.png', activeClass: 'text-money border-b-2 border-money' },
          { id: 'taxes' as MobileTab, label: 'Taxes', icon: '/tax.png', activeClass: 'text-danger border-b-2 border-danger' },
          { id: 'expenses' as MobileTab, label: 'Expenses', icon: '/expenses.png', activeClass: 'text-danger border-b-2 border-danger' },
          { id: 'planning' as MobileTab, label: 'Plan', icon: '/plan.png', activeClass: 'text-accent border-b-2 border-accent' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 font-semibold transition-colors cursor-pointer ${mobileTab === tab.id ? tab.activeClass : 'text-gray-500 dark:text-neutral-400'
              }`}
          >
            <img src={tab.icon} alt="" className="h-7 w-7 object-contain" />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-8">

        {/* Desktop: Budget wrapper — mirrors the Plan section structure */}
        <section
          className={`hidden bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700
            ${desktopView === 'budget' ? 'md:block' : 'md:hidden'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-accent text-xl font-bold flex items-center gap-2">
              <img src="/budget.png" alt="" className="h-9 w-9 object-contain" />
              Budget
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Per</span>
              <select
                value={timeframe}
                onChange={e => handleTimeframeChange(e.target.value as Timeframe)}
                className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1.5 cursor-pointer focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-money text-lg font-bold mb-4 flex items-center gap-2">
                <img src="/income.png" alt="" className="h-7 w-7 object-contain" />
                Income
              </h3>
              <IncomeSection
                incomeRows={incomeRows}
                setIncomeRows={setIncomeRows}
                timeframe={timeframe}
                onTimeframeChange={handleTimeframeChange}
                totalIncome={totalIncome}
              />
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-danger text-lg font-bold mb-4 flex items-center gap-2">
                <img src="/tax.png" alt="" className="h-7 w-7 object-contain" />
                Taxes
              </h3>
              <TaxesSection
                taxes={taxes}
                setTaxes={setTaxes}
                income={totalIncome}
              />
            </div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-danger text-lg font-bold mb-4 flex items-center gap-2">
                <img src="/expenses.png" alt="" className="h-7 w-7 object-contain" />
                Expenses
              </h3>
              <ExpensesSection
                expenses={expenses}
                setExpenses={setExpenses}
              />
            </div>
          </div>
        </section>

        {/* Mobile: Individual budget sections (hidden on desktop) */}
        <section
          className={`md:hidden bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700
            ${mobileTab === 'income' ? 'block' : 'hidden'}`}
        >
          <h2 className="text-money text-xl font-bold mb-4 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <img src="/income.png" alt="" className="h-9 w-9 object-contain" />
              Income
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Per</span>
              <select
                value={timeframe}
                onChange={e => handleTimeframeChange(e.target.value as Timeframe)}
                className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1.5 cursor-pointer focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </h2>
          <IncomeSection
            incomeRows={incomeRows}
            setIncomeRows={setIncomeRows}
            timeframe={timeframe}
            totalIncome={totalIncome}
          />
        </section>

        <section
          className={`md:hidden bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700
            ${mobileTab === 'taxes' ? 'block' : 'hidden'}`}
        >
          <h2 className="text-danger text-xl font-bold mb-4 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <img src="/tax.png" alt="" className="h-9 w-9 object-contain" />
              Taxes
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Per</span>
              <select
                value={timeframe}
                onChange={e => handleTimeframeChange(e.target.value as Timeframe)}
                className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1.5 cursor-pointer focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </h2>
          <TaxesSection
            taxes={taxes}
            setTaxes={setTaxes}
            income={totalIncome}
          />
        </section>

        <section
          className={`md:hidden bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700
            ${mobileTab === 'expenses' ? 'block' : 'hidden'}`}
        >
          <h2 className="text-danger text-xl font-bold mb-4 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <img src="/expenses.png" alt="" className="h-9 w-9 object-contain" />
              Expenses
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-neutral-400 font-semibold">Per</span>
              <select
                value={timeframe}
                onChange={e => handleTimeframeChange(e.target.value as Timeframe)}
                className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-1.5 cursor-pointer focus:outline-none"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </h2>
          <ExpensesSection
            expenses={expenses}
            setExpenses={setExpenses}
          />
        </section>

        {/* Plan section */}
        <section
          className={`bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700
            ${mobileTab === 'planning' ? 'block' : 'hidden'}
            ${desktopView === 'planning' ? 'md:block' : 'md:hidden'}`}
        >
          <h2 className="text-accent text-xl font-bold mb-4 flex items-center gap-2">
            <img src="/plan.png" alt="" className="h-9 w-9 object-contain" />
            Plan
          </h2>
          <PlanningTab />
        </section>
      </main>
    </div>
  )
}
