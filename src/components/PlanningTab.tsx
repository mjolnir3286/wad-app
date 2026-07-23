import { useState, useEffect } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatCurrency } from '../utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useDarkMode() {
    const [isDark, setIsDark] = useState(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
    )
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])
    return isDark
}

function fmtShort(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
    return `$${Math.round(v)}`
}

function fmtPeriodLabel(n: number, freq: ContribFreq, ppy: number): string {
    if (freq === 'monthly' && n < 24) return `${n}mo`
    if (freq === 'weekly' && n < 52) return `${n}wk`
    return `${(n / ppy).toFixed(0)}y`
}

function fmtTimeToGoal(periods: number, freq: ContribFreq, ppy: number): string {
    if (periods <= 0) return '—'
    if (freq === 'monthly') {
        if (periods === 1) return '1 month'
        if (periods < 24) return `${periods} months`
    }
    if (freq === 'weekly') {
        if (periods < 52) return `${periods} weeks`
    }
    if (freq === 'biweekly') {
        const months = Math.round(periods / ppy * 12)
        if (months < 24) return `${months} month${months !== 1 ? 's' : ''}`
    }
    const years = periods / ppy
    return years < 1.5 ? '1 year' : `${years.toFixed(1)} years`
}

function StatBadge({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-neutral-400">{label}</div>
            <div className={`text-sm font-bold mt-0.5 ${color ?? 'text-gray-800 dark:text-gray-200'}`}>{value}</div>
        </div>
    )
}

const MONEY = '#00e64d'
const ACCENT = '#ff8c00'

const inputClass =
    'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-money text-sm w-full px-3 py-2.5'

const labelClass =
    'block text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5'

// ─── Savings Goal ─────────────────────────────────────────────────────────────

type ContribFreq = 'weekly' | 'biweekly' | 'monthly'
const CONTRIB_PERIODS: Record<ContribFreq, number> = { weekly: 52, biweekly: 26, monthly: 12 }

function SavingsGoal() {
    const isDark = useDarkMode()
    const [goal, setGoal] = useState(0)
    const [contribution, setContribution] = useState(0)
    const [freq, setFreq] = useState<ContribFreq>('monthly')
    const [rate, setRate] = useState(0)

    const periodsPerYear = CONTRIB_PERIODS[freq]
    const r = rate / 100 / periodsPerYear

    let totalPeriods = 0
    if (goal > 0 && contribution > 0) {
        if (r === 0) {
            totalPeriods = Math.ceil(goal / contribution)
        } else {
            const inside = 1 + (goal * r) / contribution
            if (inside > 0) totalPeriods = Math.ceil(Math.log(inside) / Math.log(1 + r))
        }
    }

    const chartData = (() => {
        if (!totalPeriods || totalPeriods <= 0) return []
        const steps = Math.min(totalPeriods, 60)
        const step = Math.max(1, Math.ceil(totalPeriods / steps))
        const data = []
        for (let n = 0; n <= totalPeriods; n += step) {
            const balance = r === 0
                ? contribution * n
                : contribution * (Math.pow(1 + r, n) - 1) / r
            data.push({
                label: n === 0 ? 'Now' : fmtPeriodLabel(n, freq, periodsPerYear),
                balance: Math.min(balance, goal),
            })
        }
        if ((data[data.length - 1]?.balance ?? 0) < goal)
            data.push({ label: fmtPeriodLabel(totalPeriods, freq, periodsPerYear), balance: goal })
        return data
    })()

    const totalContributed = contribution * totalPeriods
    const interest = Math.max(0, goal - totalContributed)

    const gridColor = isDark ? '#2a2a2a' : '#f0f0f0'
    const axisColor = isDark ? '#555' : '#aaa'
    const tooltipBg = isDark ? '#1a1a1a' : '#fff'
    const tooltipBorder = isDark ? '#333' : '#e5e7eb'

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Goal Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" min="0" step="1" value={goal || ''} onChange={e => setGoal(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-6`} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Contribution</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" min="0" step="1" value={contribution || ''} onChange={e => setContribution(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-6`} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Frequency</label>
                    <select value={freq} onChange={e => setFreq(e.target.value as ContribFreq)} className={`${inputClass} cursor-pointer`}>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Annual Interest %</label>
                    <div className="relative">
                        <input type="number" min="0" max="100" step="0.1" value={rate || ''} onChange={e => setRate(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pr-6`} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                    </div>
                </div>
            </div>

            {chartData.length > 1 && (
                <>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={MONEY} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={MONEY} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} width={48} />
                            <Tooltip formatter={(v: unknown) => [formatCurrency(v as number), 'Balance']} contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                            <ReferenceLine y={goal} stroke={ACCENT} strokeDasharray="4 4" label={{ value: 'Goal', fill: ACCENT, fontSize: 10, position: 'insideTopRight' }} />
                            <Area type="monotone" dataKey="balance" stroke={MONEY} strokeWidth={2} fill="url(#sgGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex justify-around pt-1">
                        <StatBadge label="Time to goal" value={fmtTimeToGoal(totalPeriods, freq, periodsPerYear)} color="text-money" />
                        <StatBadge label="Total contributed" value={formatCurrency(totalContributed)} />
                        {rate > 0 && <StatBadge label="Interest earned" value={formatCurrency(interest)} color="text-money" />}
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Compound Interest ────────────────────────────────────────────────────────

type CompoundFreq = 'daily' | 'monthly' | 'annually'
const COMPOUND_N: Record<CompoundFreq, number> = { daily: 365, monthly: 12, annually: 1 }

function CompoundInterest() {
    const isDark = useDarkMode()
    const [principal, setPrincipal] = useState(0)
    const [rate, setRate] = useState(0)
    const [compFreq, setCompFreq] = useState<CompoundFreq>('monthly')
    const [years, setYears] = useState(0)

    const chartData = (() => {
        if (principal <= 0 || years <= 0) return []
        const n = COMPOUND_N[compFreq]
        const r = rate / 100
        return Array.from({ length: years + 1 }, (_, yr) => ({
            year: yr === 0 ? 'Now' : `${yr}y`,
            withInterest: principal * Math.pow(1 + r / n, n * yr),
            withoutInterest: principal,
        }))
    })()

    const final = chartData[chartData.length - 1]?.withInterest ?? 0
    const interest = final - principal

    const gridColor = isDark ? '#2a2a2a' : '#f0f0f0'
    const axisColor = isDark ? '#555' : '#aaa'
    const tooltipBg = isDark ? '#1a1a1a' : '#fff'
    const tooltipBorder = isDark ? '#333' : '#e5e7eb'
    const flatColor = isDark ? '#4b5563' : '#d1d5db'

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Starting Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" min="0" step="1" value={principal || ''} onChange={e => setPrincipal(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-6`} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Annual Rate</label>
                    <div className="relative">
                        <input type="number" min="0" max="100" step="0.1" value={rate || ''} onChange={e => setRate(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pr-6`} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Compounding</label>
                    <select value={compFreq} onChange={e => setCompFreq(e.target.value as CompoundFreq)} className={`${inputClass} cursor-pointer`}>
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="annually">Annually</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Years</label>
                    <input type="number" min="0" step="1" value={years || ''} onChange={e => setYears(parseInt(e.target.value) || 0)} placeholder="0" className={inputClass} />
                </div>
            </div>

            {chartData.length > 1 && (
                <>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={MONEY} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={MONEY} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} width={48} />
                            <Tooltip formatter={(v: unknown, name: string) => [formatCurrency(v as number), name === 'withInterest' ? 'With Interest' : 'Principal']} contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                            <Area type="monotone" dataKey="withoutInterest" stroke={flatColor} strokeWidth={1.5} fill={flatColor} fillOpacity={0.2} dot={false} />
                            <Area type="monotone" dataKey="withInterest" stroke={MONEY} strokeWidth={2} fill="url(#ciGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex justify-around pt-1">
                        <StatBadge label="Final balance" value={formatCurrency(final)} color="text-money" />
                        <StatBadge label="Starting amount" value={formatCurrency(principal)} />
                        <StatBadge label="Interest earned" value={formatCurrency(interest)} color="text-money" />
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Investment Return ────────────────────────────────────────────────────────

function InvestmentReturn() {
    const isDark = useDarkMode()
    const [initial, setInitial] = useState(0)
    const [monthly, setMonthly] = useState(0)
    const [rate, setRate] = useState(0)
    const [years, setYears] = useState(0)

    const chartData = (() => {
        if (years <= 0 || (initial <= 0 && monthly <= 0)) return []
        const r = rate / 100 / 12
        return Array.from({ length: years + 1 }, (_, yr) => {
            const n = yr * 12
            const fv = r === 0
                ? initial + monthly * n
                : initial * Math.pow(1 + r, n) + (monthly * (Math.pow(1 + r, n) - 1)) / r
            return { year: yr === 0 ? 'Now' : `${yr}y`, value: fv, contributed: initial + monthly * n }
        })
    })()

    const last = chartData[chartData.length - 1]
    const totalContributed = last?.contributed ?? 0
    const totalReturn = (last?.value ?? 0) - totalContributed

    const gridColor = isDark ? '#2a2a2a' : '#f0f0f0'
    const axisColor = isDark ? '#555' : '#aaa'
    const tooltipBg = isDark ? '#1a1a1a' : '#fff'
    const tooltipBorder = isDark ? '#333' : '#e5e7eb'
    const contribColor = isDark ? '#4b5563' : '#d1d5db'

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Initial Investment</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" min="0" step="1" value={initial || ''} onChange={e => setInitial(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-6`} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Monthly Contribution</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" min="0" step="1" value={monthly || ''} onChange={e => setMonthly(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pl-6`} />
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Annual Return %</label>
                    <div className="relative">
                        <input type="number" min="0" max="100" step="0.1" value={rate || ''} onChange={e => setRate(parseFloat(e.target.value) || 0)} placeholder="0" className={`${inputClass} pr-6`} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Years</label>
                    <input type="number" min="0" step="1" value={years || ''} onChange={e => setYears(parseInt(e.target.value) || 0)} placeholder="0" className={inputClass} />
                </div>
            </div>

            {chartData.length > 1 && (
                <>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="irGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={MONEY} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={MONEY} stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="year" tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: axisColor }} tickLine={false} axisLine={false} width={48} />
                            <Tooltip formatter={(v: unknown, name: string) => [formatCurrency(v as number), name === 'value' ? 'Total Value' : 'Contributed']} contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                            <Area type="monotone" dataKey="contributed" stroke={contribColor} strokeWidth={1.5} fill={contribColor} fillOpacity={0.25} dot={false} />
                            <Area type="monotone" dataKey="value" stroke={MONEY} strokeWidth={2} fill="url(#irGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex justify-around pt-1">
                        <StatBadge label="Future value" value={formatCurrency(last?.value ?? 0)} color="text-money" />
                        <StatBadge label="Total contributed" value={formatCurrency(totalContributed)} />
                        <StatBadge label="Total return" value={formatCurrency(totalReturn)} color={totalReturn >= 0 ? 'text-money' : 'text-danger'} />
                    </div>
                </>
            )}
        </div>
    )
}


// ─── Main Planning Tab ────────────────────────────────────────────────────────

export default function PlanningTab() {
    return (
        <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
                <h3 className="text-accent font-bold text-lg mb-1">Savings Goal</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">How long will it take to save a target amount?</p>
                <SavingsGoal />
            </div>

            <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
                <h3 className="text-accent font-bold text-lg mb-1">Compound Interest</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">How much will a lump sum grow over time?</p>
                <CompoundInterest />
            </div>

            <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-6 border border-gray-200 dark:border-neutral-700">
                <h3 className="text-accent font-bold text-lg mb-1">Investment Return</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">Project the future value of regular investments.</p>
                <InvestmentReturn />
            </div>
        </div>
    )
}
