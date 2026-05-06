import { describe, expect, it, vi } from 'vitest'
import {
  convertHomeToJpy,
  convertJpyToHome,
  calculateExpenseTotalJpy,
  createCashWithdrawalEntry,
  createExpenseEntry,
  createTripSettings,
  formatHomeCurrency,
  formatJpy,
  getDashboardAnalytics,
  getEntryListView,
  updateCashWithdrawalEntry,
  updateExpenseEntry,
  validateCashWithdrawalInput,
  validateExpenseInput,
  validateTripSetup,
  type CashWithdrawalInput,
  type ExpenseInput,
  type TripSetupInput,
  type TripSettings,
} from './trip'

const validInput: TripSetupInput = {
  tripName: 'Japan Spring Trip',
  startDate: '2026-04-06',
  endDate: '2026-04-15',
  homeCurrency: 'CAD',
  totalBudgetHome: '3500',
  exchangeRateJpy: '110',
}

describe('validateTripSetup', () => {
  it('accepts a complete valid trip setup', () => {
    expect(validateTripSetup(validInput)).toEqual({
      isValid: true,
      errors: {},
    })
  })

  it('requires dates in order and positive numeric budget fields', () => {
    const result = validateTripSetup({
      ...validInput,
      startDate: '2026-04-15',
      endDate: '2026-04-06',
      totalBudgetHome: '0',
      exchangeRateJpy: '-110',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.endDate).toBe('End date must be on or after the start date.')
    expect(result.errors.totalBudgetHome).toBe('Enter a budget greater than 0.')
    expect(result.errors.exchangeRateJpy).toBe('Enter an exchange rate greater than 0.')
  })

  it('requires a three-letter uppercase currency code', () => {
    const result = validateTripSetup({
      ...validInput,
      homeCurrency: 'cad',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.homeCurrency).toBe('Use a three-letter uppercase currency code.')
  })
})

describe('trip settings', () => {
  it('normalizes persisted trip data and keeps timestamps stable', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'trip-123' })

    const trip = createTripSettings(
      {
        ...validInput,
        tripName: '  Japan Spring Trip  ',
      },
      new Date('2026-01-02T03:04:05.000Z'),
    )

    expect(trip).toMatchObject({
      key: 'active-trip',
      tripId: 'trip-123',
      tripName: 'Japan Spring Trip',
      homeCurrency: 'CAD',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:04:05.000Z',
    })

    vi.unstubAllGlobals()
  })
})

describe('currency conversion', () => {
  it('converts home-currency budget to whole JPY', () => {
    expect(convertHomeToJpy(3500, 110)).toBe(385000)
  })

  it('converts JPY to home currency rounded to two decimals', () => {
    expect(convertJpyToHome(12345, 110)).toBe(112.23)
  })

  it('formats currency with explicit codes', () => {
    expect(formatHomeCurrency(3500, 'CAD')).toBe('CAD 3,500.00')
    expect(formatJpy(385000)).toBe('JPY 385,000')
  })
})

const validExpenseInput: ExpenseInput = {
  amountJpy: '1480',
  category: 'Food',
  date: '2026-04-06',
  paymentMethod: 'cash',
  note: 'Ameyoko ramen',
}

const validWithdrawalInput: CashWithdrawalInput = {
  amountJpy: '10000',
  date: '2026-04-07',
  note: '7-Bank ATM Shinjuku',
}

describe('expense validation', () => {
  it('accepts a valid whole-yen expense', () => {
    expect(validateExpenseInput(validExpenseInput)).toEqual({
      isValid: true,
      errors: {},
    })
  })

  it('requires whole-yen amount, category, and valid date', () => {
    const result = validateExpenseInput({
      ...validExpenseInput,
      amountJpy: '12.5',
      category: '',
      date: '2026-02-31',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.amountJpy).toBe('Enter a whole-yen amount greater than 0.')
    expect(result.errors.category).toBe('Choose a category.')
    expect(result.errors.date).toBe('Choose a valid date.')
  })

  it('limits notes to one line and 80 characters', () => {
    const result = validateExpenseInput({
      ...validExpenseInput,
      note: `${'a'.repeat(81)}\nextra`,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.note).toBe('Keep the note to one line.')
  })
})

describe('cash withdrawal validation', () => {
  it('accepts a valid whole-yen withdrawal', () => {
    expect(validateCashWithdrawalInput(validWithdrawalInput)).toEqual({
      isValid: true,
      errors: {},
    })
  })

  it('requires whole-yen amount and valid date', () => {
    const result = validateCashWithdrawalInput({
      ...validWithdrawalInput,
      amountJpy: '12.5',
      date: '2026-02-31',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.amountJpy).toBe('Enter a whole-yen amount greater than 0.')
    expect(result.errors.date).toBe('Choose a valid date.')
  })

  it('limits withdrawal notes to one line and 80 characters', () => {
    const result = validateCashWithdrawalInput({
      ...validWithdrawalInput,
      note: `${'a'.repeat(81)}\nextra`,
    })

    expect(result.isValid).toBe(false)
    expect(result.errors.note).toBe('Keep the note to one line.')
  })
})

describe('expense entries', () => {
  it('creates a persisted expense shape with stable timestamps', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'expense-123' })

    const entry = createExpenseEntry(
      'trip-123',
      {
        ...validExpenseInput,
        note: '  Ameyoko ramen  ',
      },
      new Date('2026-04-06T01:02:03.000Z'),
    )

    expect(entry).toEqual({
      id: 'expense-123',
      tripId: 'trip-123',
      type: 'expense',
      date: '2026-04-06',
      amountJpy: 1480,
      category: 'Food',
      paymentMethod: 'cash',
      note: 'Ameyoko ramen',
      createdAt: '2026-04-06T01:02:03.000Z',
      updatedAt: '2026-04-06T01:02:03.000Z',
    })

    vi.unstubAllGlobals()
  })

  it('creates a persisted cash withdrawal shape with stable timestamps', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'withdrawal-123' })

    const entry = createCashWithdrawalEntry(
      'trip-123',
      {
        ...validWithdrawalInput,
        note: '  7-Bank ATM Shinjuku  ',
      },
      new Date('2026-04-07T01:02:03.000Z'),
    )

    expect(entry).toEqual({
      id: 'withdrawal-123',
      tripId: 'trip-123',
      type: 'cashWithdrawal',
      date: '2026-04-07',
      amountJpy: 10000,
      note: '7-Bank ATM Shinjuku',
      createdAt: '2026-04-07T01:02:03.000Z',
      updatedAt: '2026-04-07T01:02:03.000Z',
    })

    vi.unstubAllGlobals()
  })

  it('calculates spending totals from expenses only', () => {
    const expense = createExpenseEntry('trip-123', validExpenseInput)
    const withdrawal = createCashWithdrawalEntry('trip-123', validWithdrawalInput)

    expect(
      calculateExpenseTotalJpy([
        expense,
        withdrawal,
      ]),
    ).toBe(1480)
  })

  it('updates an expense without changing immutable identity fields', () => {
    const original = createExpenseEntry(
      'trip-123',
      validExpenseInput,
      new Date('2026-04-06T01:02:03.000Z'),
    )

    const updated = updateExpenseEntry(
      original,
      {
        amountJpy: '2100',
        category: 'Transit',
        date: '2026-04-08',
        paymentMethod: '',
        note: '  subway day pass  ',
      },
      new Date('2026-04-09T05:06:07.000Z'),
    )

    expect(updated).toEqual({
      id: original.id,
      tripId: 'trip-123',
      type: 'expense',
      date: '2026-04-08',
      amountJpy: 2100,
      category: 'Transit',
      note: 'subway day pass',
      createdAt: '2026-04-06T01:02:03.000Z',
      updatedAt: '2026-04-09T05:06:07.000Z',
    })
    expect('paymentMethod' in updated).toBe(false)
  })

  it('updates a cash withdrawal without changing immutable identity fields', () => {
    const original = createCashWithdrawalEntry(
      'trip-123',
      validWithdrawalInput,
      new Date('2026-04-07T01:02:03.000Z'),
    )

    const updated = updateCashWithdrawalEntry(
      original,
      {
        amountJpy: '20000',
        date: '2026-04-09',
        note: '',
      },
      new Date('2026-04-09T05:06:07.000Z'),
    )

    expect(updated).toEqual({
      id: original.id,
      tripId: 'trip-123',
      type: 'cashWithdrawal',
      date: '2026-04-09',
      amountJpy: 20000,
      createdAt: '2026-04-07T01:02:03.000Z',
      updatedAt: '2026-04-09T05:06:07.000Z',
    })
    expect('note' in updated).toBe(false)
  })
})

describe('entry list view', () => {
  const ramen = createExpenseEntry(
    'trip-123',
    {
      amountJpy: '1480',
      category: 'Food',
      date: '2026-04-06',
      paymentMethod: 'cash',
      note: 'Ameyoko ramen',
    },
    new Date('2026-04-06T01:00:00.000Z'),
  )
  const train = createExpenseEntry(
    'trip-123',
    {
      amountJpy: '14200',
      category: 'Transit',
      date: '2026-04-09',
      paymentMethod: 'card',
      note: 'Tokyo to Kyoto shinkansen',
    },
    new Date('2026-04-09T01:00:00.000Z'),
  )
  const atm = createCashWithdrawalEntry(
    'trip-123',
    {
      amountJpy: '10000',
      date: '2026-04-07',
      note: '7-Bank ATM Shinjuku',
    },
    new Date('2026-04-07T01:00:00.000Z'),
  )
  const entries = [ramen, train, atm]

  it('searches notes, category labels, entry type labels, and payment method labels', () => {
    expect(getEntryListView(entries, { searchQuery: 'ramen' }).entries).toEqual([ramen])
    expect(getEntryListView(entries, { searchQuery: 'transit' }).entries).toEqual([train])
    expect(getEntryListView(entries, { searchQuery: 'cash withdrawal' }).entries).toEqual([atm])
    expect(getEntryListView(entries, { searchQuery: 'card' }).entries).toEqual([train])
  })

  it('filters by entry type, category, payment method, and date range', () => {
    expect(getEntryListView(entries, { entryType: 'cashWithdrawal' }).entries).toEqual([atm])
    expect(getEntryListView(entries, { category: 'Food' }).entries).toEqual([ramen])
    expect(getEntryListView(entries, { paymentMethod: 'card' }).entries).toEqual([train])
    expect(
      getEntryListView(entries, {
        startDate: '2026-04-07',
        endDate: '2026-04-09',
      }).entries,
    ).toEqual([train, atm])
  })

  it('excludes cash withdrawals while a payment method filter is active', () => {
    const view = getEntryListView(entries, { paymentMethod: 'cash' })

    expect(view.entries).toEqual([ramen])
    expect(view.withdrawalTotalJpy).toBe(0)
  })

  it('sorts by newest, oldest, and amount descending', () => {
    expect(getEntryListView(entries, { sortOrder: 'newest' }).entries).toEqual([train, atm, ramen])
    expect(getEntryListView(entries, { sortOrder: 'oldest' }).entries).toEqual([ramen, atm, train])
    expect(getEntryListView(entries, { sortOrder: 'amount' }).entries).toEqual([train, atm, ramen])
  })

  it('returns contextual filtered totals and counts', () => {
    const expenseView = getEntryListView(entries, { searchQuery: 'to' })
    const withdrawalView = getEntryListView(entries, { entryType: 'cashWithdrawal' })

    expect(expenseView.filteredCount).toBe(1)
    expect(expenseView.contextualTotalLabel).toBe('Spending total')
    expect(expenseView.contextualTotalJpy).toBe(14200)
    expect(withdrawalView.filteredCount).toBe(1)
    expect(withdrawalView.contextualTotalLabel).toBe('Withdrawal total')
    expect(withdrawalView.contextualTotalJpy).toBe(10000)
  })
})

describe('dashboard analytics', () => {
  const trip: TripSettings = {
    key: 'active-trip',
    tripId: 'trip-analytics',
    tripName: 'Analytics Trip',
    startDate: '2026-04-06',
    endDate: '2026-04-10',
    homeCurrency: 'CAD',
    totalBudgetHome: 1000,
    exchangeRateJpy: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  const firstDayFood = createExpenseEntry(
    trip.tripId,
    {
      amountJpy: '10000',
      category: 'Food',
      date: '2026-04-06',
      paymentMethod: 'cash',
      note: 'ramen',
    },
    new Date('2026-04-06T01:00:00.000Z'),
  )
  const secondDayTransit = createExpenseEntry(
    trip.tripId,
    {
      amountJpy: '20000',
      category: 'Transit',
      date: '2026-04-07',
      paymentMethod: 'card',
      note: 'rail pass',
    },
    new Date('2026-04-07T01:00:00.000Z'),
  )
  const outsideTripExpense = createExpenseEntry(
    trip.tripId,
    {
      amountJpy: '5000',
      category: 'Food',
      date: '2026-04-12',
      paymentMethod: '',
      note: 'airport snack',
    },
    new Date('2026-04-12T01:00:00.000Z'),
  )
  const withdrawal = createCashWithdrawalEntry(
    trip.tripId,
    {
      amountJpy: '50000',
      date: '2026-04-07',
      note: 'ATM',
    },
    new Date('2026-04-07T02:00:00.000Z'),
  )
  const entries = [firstDayFood, secondDayTransit, outsideTripExpense, withdrawal]

  it('calculates budget totals and currency-derived pacing values', () => {
    const view = getDashboardAnalytics(
      trip,
      entries,
      new Date('2026-04-07T00:00:00.000Z'),
    )

    expect(view.budgetJpy).toBe(100000)
    expect(view.totalSpentJpy).toBe(35000)
    expect(view.remainingJpy).toBe(65000)
    expect(view.originalDailyBudgetJpy).toBe(20000)
    expect(view.daysElapsed).toBe(2)
    expect(view.daysLeft).toBe(3)
    expect(view.tripProgressPercent).toBe(40)
    expect(view.dailyAverageJpy).toBe(15000)
    expect(view.currentRemainingDailyAllowanceJpy).toBe(21667)
  })

  it('excludes cash withdrawals and outside-trip expenses from pacing', () => {
    const view = getDashboardAnalytics(
      trip,
      entries,
      new Date('2026-04-07T00:00:00.000Z'),
    )

    expect(view.inTripSpentToDateJpy).toBe(30000)
    expect(view.expectedSpendToDateJpy).toBe(40000)
    expect(view.budgetStatus).toBe('onTrack')
    expect(view.outsideTripExpenseTotalJpy).toBe(5000)
  })

  it('uses caution and over-budget thresholds against expected spending', () => {
    const cautionView = getDashboardAnalytics(
      trip,
      [
        createExpenseEntry(
          trip.tripId,
          {
            amountJpy: '40000',
            category: 'Food',
            date: '2026-04-06',
            paymentMethod: '',
            note: '',
          },
          new Date('2026-04-06T01:00:00.000Z'),
        ),
      ],
      new Date('2026-04-07T00:00:00.000Z'),
    )
    const overView = getDashboardAnalytics(
      trip,
      [
        createExpenseEntry(
          trip.tripId,
          {
            amountJpy: '45000',
            category: 'Food',
            date: '2026-04-06',
            paymentMethod: '',
            note: '',
          },
          new Date('2026-04-06T01:00:00.000Z'),
        ),
      ],
      new Date('2026-04-07T00:00:00.000Z'),
    )

    expect(cautionView.budgetStatus).toBe('caution')
    expect(overView.budgetStatus).toBe('overBudget')
  })

  it('returns expense-only category totals and cumulative trip-day series', () => {
    const view = getDashboardAnalytics(
      trip,
      entries,
      new Date('2026-04-07T00:00:00.000Z'),
    )

    expect(view.categoryBreakdown).toEqual([
      { category: 'Transit', totalJpy: 20000, percentage: 57 },
      { category: 'Food', totalJpy: 15000, percentage: 43 },
    ])
    expect(view.cumulativeSpending).toEqual([
      { date: '2026-04-06', actualJpy: 10000, expectedJpy: 20000 },
      { date: '2026-04-07', actualJpy: 30000, expectedJpy: 40000 },
      { date: '2026-04-08', actualJpy: 30000, expectedJpy: 60000 },
      { date: '2026-04-09', actualJpy: 30000, expectedJpy: 80000 },
      { date: '2026-04-10', actualJpy: 30000, expectedJpy: 100000 },
    ])
  })
})
