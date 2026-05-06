import { describe, expect, it, vi } from 'vitest'
import {
  convertHomeToJpy,
  convertJpyToHome,
  calculateExpenseTotalJpy,
  createExpenseEntry,
  createTripSettings,
  formatHomeCurrency,
  formatJpy,
  validateExpenseInput,
  validateTripSetup,
  type ExpenseInput,
  type TripSetupInput,
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

  it('calculates spending totals from expenses only', () => {
    const expense = createExpenseEntry('trip-123', validExpenseInput)

    expect(
      calculateExpenseTotalJpy([
        expense,
        {
          id: 'withdrawal-123',
          tripId: 'trip-123',
          type: 'cashWithdrawal',
          date: '2026-04-07',
          amountJpy: 10000,
          createdAt: '2026-04-07T00:00:00.000Z',
          updatedAt: '2026-04-07T00:00:00.000Z',
        },
      ]),
    ).toBe(1480)
  })
})
