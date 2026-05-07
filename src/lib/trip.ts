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

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  icCard: 'IC card',
  other: 'Other',
}

export const entryTypeLabels: Record<TripEntryType, string> = {
  expense: 'Expense',
  cashWithdrawal: 'Cash withdrawal',
}

export type TripEntryType = 'expense' | 'cashWithdrawal'

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

export type EntryTypeFilter = 'all' | TripEntryType

export type EntryCategoryFilter = 'all' | ExpenseCategory

export type EntryPaymentMethodFilter = 'all' | PaymentMethod

export type EntrySortOrder = 'newest' | 'oldest' | 'amount'

export type EntryListOptions = {
  searchQuery?: string
  entryType?: EntryTypeFilter
  category?: EntryCategoryFilter
  paymentMethod?: EntryPaymentMethodFilter
  startDate?: string
  endDate?: string
  sortOrder?: EntrySortOrder
}

export type EntryListView = {
  entries: TripEntry[]
  filteredCount: number
  expenseTotalJpy: number
  withdrawalTotalJpy: number
  contextualTotalJpy: number
  contextualTotalLabel: 'Spending total' | 'Withdrawal total'
}

export type BudgetStatus = 'onTrack' | 'caution' | 'overBudget'

export type CategoryBreakdown = {
  category: ExpenseCategory
  totalJpy: number
  percentage: number
}

export type CumulativeSpendingPoint = {
  date: string
  actualJpy: number
  expectedJpy: number
}

export type DashboardAnalytics = {
  budgetJpy: number
  totalSpentJpy: number
  remainingJpy: number
  dailyAverageJpy: number
  originalDailyBudgetJpy: number
  currentRemainingDailyAllowanceJpy: number
  daysElapsed: number
  daysLeft: number
  totalTripDays: number
  tripProgressPercent: number
  budgetStatus: BudgetStatus
  expectedSpendToDateJpy: number
  inTripSpentToDateJpy: number
  outsideTripExpenseTotalJpy: number
  categoryBreakdown: CategoryBreakdown[]
  cumulativeSpending: CumulativeSpendingPoint[]
  recentEntries: TripEntry[]
}

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

export function updateExpenseEntry(
  existingEntry: ExpenseEntry,
  input: ExpenseInput,
  now = new Date(),
): ExpenseEntry {
  const entry: ExpenseEntry = {
    id: existingEntry.id,
    tripId: existingEntry.tripId,
    type: 'expense',
    date: input.date,
    amountJpy: Number(input.amountJpy),
    category: input.category as ExpenseCategory,
    createdAt: existingEntry.createdAt,
    updatedAt: now.toISOString(),
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

export function updateCashWithdrawalEntry(
  existingEntry: CashWithdrawalEntry,
  input: CashWithdrawalInput,
  now = new Date(),
): CashWithdrawalEntry {
  const entry: CashWithdrawalEntry = {
    id: existingEntry.id,
    tripId: existingEntry.tripId,
    type: 'cashWithdrawal',
    date: input.date,
    amountJpy: Number(input.amountJpy),
    createdAt: existingEntry.createdAt,
    updatedAt: now.toISOString(),
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

export function getEntryListView(
  entries: TripEntry[],
  options: EntryListOptions = {},
): EntryListView {
  const searchQuery = normalizeSearchText(options.searchQuery ?? '')
  const entryType = options.entryType ?? 'all'
  const category = options.category ?? 'all'
  const paymentMethod = options.paymentMethod ?? 'all'
  const sortOrder = options.sortOrder ?? 'newest'

  const filteredEntries = entries
    .filter((entry) => {
      if (entryType !== 'all' && entry.type !== entryType) {
        return false
      }

      if (category !== 'all' && (entry.type !== 'expense' || entry.category !== category)) {
        return false
      }

      if (
        paymentMethod !== 'all' &&
        (entry.type !== 'expense' || entry.paymentMethod !== paymentMethod)
      ) {
        return false
      }

      if (options.startDate && entry.date < options.startDate) {
        return false
      }

      if (options.endDate && entry.date > options.endDate) {
        return false
      }

      if (searchQuery && !getEntrySearchText(entry).includes(searchQuery)) {
        return false
      }

      return true
    })
    .sort((first, second) => compareEntriesForSort(first, second, sortOrder))
  const expenseTotalJpy = calculateExpenseTotalJpy(filteredEntries)
  const withdrawalTotalJpy = filteredEntries.reduce(
    (total, entry) => (entry.type === 'cashWithdrawal' ? total + entry.amountJpy : total),
    0,
  )
  const showingWithdrawalTotal = entryType === 'cashWithdrawal'

  return {
    entries: filteredEntries,
    filteredCount: filteredEntries.length,
    expenseTotalJpy,
    withdrawalTotalJpy,
    contextualTotalJpy: showingWithdrawalTotal ? withdrawalTotalJpy : expenseTotalJpy,
    contextualTotalLabel: showingWithdrawalTotal ? 'Withdrawal total' : 'Spending total',
  }
}

export function updateTripSettings(
  existingTrip: TripSettings,
  input: TripSetupInput,
  now = new Date(),
): TripSettings {
  return {
    ...existingTrip,
    tripName: input.tripName.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    homeCurrency: input.homeCurrency.trim().toUpperCase(),
    totalBudgetHome: Number(input.totalBudgetHome),
    exchangeRateJpy: Number(input.exchangeRateJpy),
    updatedAt: now.toISOString(),
  }
}

export function getDashboardAnalytics(
  trip: TripSettings,
  entries: TripEntry[],
  now = new Date(),
): DashboardAnalytics {
  const budgetJpy = convertHomeToJpy(trip.totalBudgetHome, trip.exchangeRateJpy)
  const totalSpentJpy = calculateExpenseTotalJpy(entries)
  const remainingJpy = budgetJpy - totalSpentJpy
  const totalTripDays = getInclusiveDateSpan(trip.startDate, trip.endDate)
  const japanToday = getJapanDateString(now)
  const daysElapsed = getDaysElapsed(trip, japanToday)
  const daysLeft = totalTripDays - daysElapsed
  const originalDailyBudgetJpy = roundWholeYen(budgetJpy / totalTripDays)
  const inTripExpensesToDate = getInTripExpenses(entries, trip).filter(
    (entry) => entry.date <= japanToday,
  )
  const inTripSpentToDateJpy = calculateExpenseTotalJpy(inTripExpensesToDate)
  const expectedSpendToDateJpy = roundWholeYen(originalDailyBudgetJpy * daysElapsed)
  const dailyAverageJpy =
    daysElapsed > 0 ? roundWholeYen(inTripSpentToDateJpy / daysElapsed) : 0
  const currentRemainingDailyAllowanceJpy =
    daysLeft > 0 ? roundWholeYen(remainingJpy / daysLeft) : remainingJpy
  const expenseEntries = entries.filter((entry): entry is ExpenseEntry => entry.type === 'expense')
  const outsideTripExpenseTotalJpy = calculateExpenseTotalJpy(
    expenseEntries.filter((entry) => !isEntryWithinTrip(entry, trip)),
  )

  return {
    budgetJpy,
    totalSpentJpy,
    remainingJpy,
    dailyAverageJpy,
    originalDailyBudgetJpy,
    currentRemainingDailyAllowanceJpy,
    daysElapsed,
    daysLeft,
    totalTripDays,
    tripProgressPercent: totalTripDays > 0 ? roundPercent(daysElapsed / totalTripDays) : 0,
    budgetStatus: getBudgetStatus(inTripSpentToDateJpy, expectedSpendToDateJpy),
    expectedSpendToDateJpy,
    inTripSpentToDateJpy,
    outsideTripExpenseTotalJpy,
    categoryBreakdown: getCategoryBreakdown(expenseEntries),
    cumulativeSpending: getCumulativeSpending(trip, entries, originalDailyBudgetJpy, budgetJpy),
    recentEntries: getRecentEntries(entries, 5),
  }
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

function roundWholeYen(amount: number): number {
  return Math.round(amount)
}

function roundPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value * 100)))
}

function getJapanDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
  }).formatToParts(date)
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${partMap.year}-${partMap.month}-${partMap.day}`
}

function getDaysElapsed(trip: TripSettings, today: string): number {
  if (today < trip.startDate) {
    return 0
  }

  if (today > trip.endDate) {
    return getInclusiveDateSpan(trip.startDate, trip.endDate)
  }

  return getInclusiveDateSpan(trip.startDate, today)
}

function getInclusiveDateSpan(startDate: string, endDate: string): number {
  const start = getUtcDateMs(startDate)
  const end = getUtcDateMs(endDate)
  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.max(1, Math.round((end - start) / millisecondsPerDay) + 1)
}

function getUtcDateMs(value: string): number {
  return new Date(`${value}T00:00:00.000Z`).getTime()
}

export function isEntryWithinTrip(entry: TripEntry, trip: TripSettings): boolean {
  return isDateWithinTrip(entry.date, trip)
}

export function isDateWithinTrip(date: string, trip: TripSettings): boolean {
  if (!isValidIsoDate(date)) {
    return false
  }

  return date >= trip.startDate && date <= trip.endDate
}

function getInTripExpenses(entries: TripEntry[], trip: TripSettings): ExpenseEntry[] {
  return entries.filter(
    (entry): entry is ExpenseEntry => entry.type === 'expense' && isEntryWithinTrip(entry, trip),
  )
}

function getBudgetStatus(actualJpy: number, expectedJpy: number): BudgetStatus {
  if (expectedJpy <= 0) {
    return actualJpy > 0 ? 'overBudget' : 'onTrack'
  }

  const ratio = actualJpy / expectedJpy

  if (ratio < 0.9) {
    return 'onTrack'
  }

  if (ratio <= 1.1) {
    return 'caution'
  }

  return 'overBudget'
}

function getCategoryBreakdown(expenseEntries: ExpenseEntry[]): CategoryBreakdown[] {
  const totalSpentJpy = calculateExpenseTotalJpy(expenseEntries)

  return expenseCategories
    .map((category) => {
      const totalJpy = expenseEntries.reduce(
        (total, entry) => (entry.category === category ? total + entry.amountJpy : total),
        0,
      )

      return {
        category,
        totalJpy,
        percentage: totalSpentJpy > 0 ? roundPercent(totalJpy / totalSpentJpy) : 0,
      }
    })
    .filter((breakdown) => breakdown.totalJpy > 0)
    .sort(
      (first, second) =>
        second.totalJpy - first.totalJpy || first.category.localeCompare(second.category),
    )
}

function getCumulativeSpending(
  trip: TripSettings,
  entries: TripEntry[],
  originalDailyBudgetJpy: number,
  budgetJpy: number,
): CumulativeSpendingPoint[] {
  const inTripExpenses = getInTripExpenses(entries, trip)
  const points: CumulativeSpendingPoint[] = []
  let runningActualJpy = 0

  for (const date of eachDateInRange(trip.startDate, trip.endDate)) {
    runningActualJpy += inTripExpenses.reduce(
      (total, entry) => (entry.date === date ? total + entry.amountJpy : total),
      0,
    )

    points.push({
      date,
      actualJpy: runningActualJpy,
      expectedJpy: Math.min(budgetJpy, originalDailyBudgetJpy * (points.length + 1)),
    })
  }

  return points
}

function eachDateInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

function getRecentEntries(entries: TripEntry[], limit: number): TripEntry[] {
  return [...entries]
    .sort(
      (first, second) =>
        compareEntriesByDateThenCreated(second, first) ||
        second.updatedAt.localeCompare(first.updatedAt),
    )
    .slice(0, limit)
}

function isKnownExpenseCategory(category: string): category is ExpenseCategory {
  return expenseCategories.includes(category as ExpenseCategory)
}

function isKnownPaymentMethod(method: string): method is PaymentMethod {
  return paymentMethods.includes(method as PaymentMethod)
}

function getEntrySearchText(entry: TripEntry): string {
  const searchableParts = [
    entry.note ?? '',
    entryTypeLabels[entry.type],
    entry.type === 'expense' ? entry.category : '',
    entry.type === 'expense' && entry.paymentMethod ? paymentMethodLabels[entry.paymentMethod] : '',
  ]

  return normalizeSearchText(searchableParts.join(' '))
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function compareEntriesForSort(
  first: TripEntry,
  second: TripEntry,
  sortOrder: EntrySortOrder,
): number {
  if (sortOrder === 'oldest') {
    return compareEntriesByDateThenCreated(first, second)
  }

  if (sortOrder === 'amount') {
    return (
      second.amountJpy - first.amountJpy ||
      compareEntriesByDateThenCreated(second, first)
    )
  }

  return compareEntriesByDateThenCreated(second, first)
}

function compareEntriesByDateThenCreated(first: TripEntry, second: TripEntry): number {
  return first.date.localeCompare(second.date) || first.createdAt.localeCompare(second.createdAt)
}

function createStableId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
