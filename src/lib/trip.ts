export const ACTIVE_TRIP_KEY = 'active-trip'

export const currencyPresets = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'] as const

export type CurrencyPreset = (typeof currencyPresets)[number]

export type TripSettings = {
  key: typeof ACTIVE_TRIP_KEY
  tripId: string
  tripName: string
  startDate: string
  endDate: string
  homeCurrency: string
  totalBudgetHome: number
  exchangeRateJpy: number
  createdAt: string
  updatedAt: string
}

export type TripSetupInput = {
  tripName: string
  startDate: string
  endDate: string
  homeCurrency: string
  totalBudgetHome: string
  exchangeRateJpy: string
}

export type TripValidationErrors = Partial<Record<keyof TripSetupInput, string>>

export type TripValidationResult = {
  isValid: boolean
  errors: TripValidationErrors
}

export const expenseCategories = [
  'Food',
  'Transit',
  'Lodging',
  'Shopping',
  'Attractions',
  'Convenience stores',
  'Other',
] as const

export const paymentMethods = ['cash', 'card', 'icCard', 'other'] as const

export type ExpenseCategory = (typeof expenseCategories)[number]

export type PaymentMethod = (typeof paymentMethods)[number]

export type BaseTripEntry = {
  id: string
  tripId: string
  date: string
  amountJpy: number
  note?: string
  createdAt: string
  updatedAt: string
}

export type ExpenseEntry = BaseTripEntry & {
  type: 'expense'
  category: ExpenseCategory
  paymentMethod?: PaymentMethod
}

export type CashWithdrawalEntry = BaseTripEntry & {
  type: 'cashWithdrawal'
}

export type TripEntry = ExpenseEntry | CashWithdrawalEntry

export type ExpenseInput = {
  amountJpy: string
  category: string
  date: string
  paymentMethod: string
  note: string
}

export type ExpenseValidationErrors = Partial<Record<keyof ExpenseInput, string>>

export type ExpenseValidationResult = {
  isValid: boolean
  errors: ExpenseValidationErrors
}

export type CashWithdrawalInput = {
  amountJpy: string
  date: string
  note: string
}

export type CashWithdrawalValidationErrors = Partial<Record<keyof CashWithdrawalInput, string>>

export type CashWithdrawalValidationResult = {
  isValid: boolean
  errors: CashWithdrawalValidationErrors
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const currencyPattern = /^[A-Z]{3}$/

export function validateTripSetup(input: TripSetupInput): TripValidationResult {
  const errors: TripValidationErrors = {}
  const tripName = input.tripName.trim()
  const homeCurrency = input.homeCurrency.trim()
  const totalBudgetHome = Number(input.totalBudgetHome)
  const exchangeRateJpy = Number(input.exchangeRateJpy)

  if (!tripName) {
    errors.tripName = 'Enter a trip name.'
  } else if (tripName.length > 60) {
    errors.tripName = 'Keep the trip name to 60 characters or fewer.'
  }

  if (!isValidIsoDate(input.startDate)) {
    errors.startDate = 'Choose a valid start date.'
  }

  if (!isValidIsoDate(input.endDate)) {
    errors.endDate = 'Choose a valid end date.'
  }

  if (
    isValidIsoDate(input.startDate) &&
    isValidIsoDate(input.endDate) &&
    input.endDate < input.startDate
  ) {
    errors.endDate = 'End date must be on or after the start date.'
  }

  if (!currencyPattern.test(homeCurrency)) {
    errors.homeCurrency = 'Use a three-letter uppercase currency code.'
  }

  if (!Number.isFinite(totalBudgetHome) || totalBudgetHome <= 0) {
    errors.totalBudgetHome = 'Enter a budget greater than 0.'
  }

  if (!Number.isFinite(exchangeRateJpy) || exchangeRateJpy <= 0) {
    errors.exchangeRateJpy = 'Enter an exchange rate greater than 0.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function createTripSettings(input: TripSetupInput, now = new Date()): TripSettings {
  const normalizedCurrency = input.homeCurrency.trim().toUpperCase()
  const timestamp = now.toISOString()

  return {
    key: ACTIVE_TRIP_KEY,
    tripId: createStableId('trip'),
    tripName: input.tripName.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    homeCurrency: normalizedCurrency,
    totalBudgetHome: Number(input.totalBudgetHome),
    exchangeRateJpy: Number(input.exchangeRateJpy),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function validateExpenseInput(input: ExpenseInput): ExpenseValidationResult {
  const errors: ExpenseValidationErrors = {}
  const amountJpy = Number(input.amountJpy)
  const note = input.note.trim()

  if (!Number.isInteger(amountJpy) || amountJpy <= 0) {
    errors.amountJpy = 'Enter a whole-yen amount greater than 0.'
  }

  if (!isKnownExpenseCategory(input.category)) {
    errors.category = 'Choose a category.'
  }

  if (!isValidIsoDate(input.date)) {
    errors.date = 'Choose a valid date.'
  }

  if (input.paymentMethod && !isKnownPaymentMethod(input.paymentMethod)) {
    errors.paymentMethod = 'Choose a payment method.'
  }

  if (note.length > 80) {
    errors.note = 'Keep the note to 80 characters or fewer.'
  }

  if (/[\r\n]/.test(input.note)) {
    errors.note = 'Keep the note to one line.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function createExpenseEntry(
  tripId: string,
  input: ExpenseInput,
  now = new Date(),
): ExpenseEntry {
  const timestamp = now.toISOString()
  const entry: ExpenseEntry = {
    id: createStableId('expense'),
    tripId,
    type: 'expense',
    date: input.date,
    amountJpy: Number(input.amountJpy),
    category: input.category as ExpenseCategory,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const note = input.note.trim()

  if (input.paymentMethod) {
    entry.paymentMethod = input.paymentMethod as PaymentMethod
  }

  if (note) {
    entry.note = note
  }

  return entry
}

export function validateCashWithdrawalInput(
  input: CashWithdrawalInput,
): CashWithdrawalValidationResult {
  const errors: CashWithdrawalValidationErrors = {}
  const amountJpy = Number(input.amountJpy)
  const note = input.note.trim()

  if (!Number.isInteger(amountJpy) || amountJpy <= 0) {
    errors.amountJpy = 'Enter a whole-yen amount greater than 0.'
  }

  if (!isValidIsoDate(input.date)) {
    errors.date = 'Choose a valid date.'
  }

  if (note.length > 80) {
    errors.note = 'Keep the note to 80 characters or fewer.'
  }

  if (/[\r\n]/.test(input.note)) {
    errors.note = 'Keep the note to one line.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function createCashWithdrawalEntry(
  tripId: string,
  input: CashWithdrawalInput,
  now = new Date(),
): CashWithdrawalEntry {
  const timestamp = now.toISOString()
  const entry: CashWithdrawalEntry = {
    id: createStableId('withdrawal'),
    tripId,
    type: 'cashWithdrawal',
    date: input.date,
    amountJpy: Number(input.amountJpy),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const note = input.note.trim()

  if (note) {
    entry.note = note
  }

  return entry
}

export function calculateExpenseTotalJpy(entries: TripEntry[]): number {
  return entries.reduce(
    (total, entry) => (entry.type === 'expense' ? total + entry.amountJpy : total),
    0,
  )
}

export function convertHomeToJpy(amountHome: number, exchangeRateJpy: number): number {
  return Math.round(amountHome * exchangeRateJpy)
}

export function convertJpyToHome(amountJpy: number, exchangeRateJpy: number): number {
  return roundCurrency(amountJpy / exchangeRateJpy)
}

export function formatHomeCurrency(amount: number, currency: string): string {
  return `${currency.toUpperCase()} ${roundCurrency(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatJpy(amount: number): string {
  return `JPY ${Math.round(amount).toLocaleString()}`
}

function isValidIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}

function isKnownExpenseCategory(category: string): category is ExpenseCategory {
  return expenseCategories.includes(category as ExpenseCategory)
}

function isKnownPaymentMethod(method: string): method is PaymentMethod {
  return paymentMethods.includes(method as PaymentMethod)
}

function createStableId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
