import type { Timeframe } from './types'

export function getMultiplier(timeframe: Timeframe, hoursPerWeek: number): number {
    switch (timeframe) {
        case 'hourly': return hoursPerWeek * 52
        case 'weekly': return 52
        case 'biweekly': return 26
        case 'monthly': return 12
        case 'yearly': return 1
    }
}

export function convertValue(
    value: number,
    from: Timeframe,
    to: Timeframe,
    hoursPerWeek: number,
): number {
    if (from === to) return value
    const fromMult = getMultiplier(from, hoursPerWeek)
    const toMult = getMultiplier(to, hoursPerWeek)
    if (!fromMult || !toMult) return value
    return parseFloat((value * (fromMult / toMult)).toFixed(2))
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}
