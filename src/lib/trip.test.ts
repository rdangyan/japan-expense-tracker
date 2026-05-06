import { describe, expect, it, vi } from 'vitest'
import {
  convertHomeToJpy,
  convertJpyToHome,
  createTripSettings,
  formatHomeCurrency,
  formatJpy,
  validateTripSetup,
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
