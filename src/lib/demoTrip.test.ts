import { describe, expect, it } from 'vitest'
import { createDemoTrip, isKnownExpenseCategory, isKnownPaymentMethod } from './demoTrip'

describe('createDemoTrip', () => {
  it('creates the deterministic Japan Spring Trip settings', () => {
    const firstDemoTrip = createDemoTrip()
    const secondDemoTrip = createDemoTrip()

    expect(firstDemoTrip).toEqual(secondDemoTrip)
    expect(firstDemoTrip.trip).toMatchObject({
      tripId: 'demo-japan-spring-trip',
      tripName: 'Japan Spring Trip',
      startDate: '2026-04-06',
      endDate: '2026-04-15',
      homeCurrency: 'CAD',
      totalBudgetHome: 3500,
      exchangeRateJpy: 110,
    })
  })

  it('includes varied valid entries for the demo trip', () => {
    const { entries, trip } = createDemoTrip()
    const expenseEntries = entries.filter((entry) => entry.type === 'expense')
    const withdrawalEntries = entries.filter((entry) => entry.type === 'cashWithdrawal')
    const categories = new Set(
      expenseEntries.map((entry) => (entry.type === 'expense' ? entry.category : undefined)),
    )
    const paymentMethods = new Set(
      expenseEntries.map((entry) => (entry.type === 'expense' ? entry.paymentMethod : undefined)),
    )

    expect(entries).toHaveLength(26)
    expect(expenseEntries.length).toBeGreaterThanOrEqual(23)
    expect(withdrawalEntries.length).toBeGreaterThanOrEqual(2)
    expect(categories.size).toBeGreaterThanOrEqual(7)
    expect(paymentMethods.size).toBeGreaterThanOrEqual(4)

    entries.forEach((entry) => {
      expect(entry.tripId).toBe(trip.tripId)
      expect(entry.id).toMatch(/^demo-entry-\d{2}$/)
      expect(entry.date >= trip.startDate).toBe(true)
      expect(entry.date <= trip.endDate).toBe(true)
      expect(Number.isInteger(entry.amountJpy)).toBe(true)
      expect(entry.amountJpy).toBeGreaterThan(0)
      expect(entry.note?.length).toBeLessThanOrEqual(80)
      expect(entry.createdAt).toBe(entry.updatedAt)

      if (entry.type === 'expense') {
        expect(isKnownExpenseCategory(entry.category)).toBe(true)

        if (entry.paymentMethod) {
          expect(isKnownPaymentMethod(entry.paymentMethod)).toBe(true)
        }
      }
    })
  })
})
