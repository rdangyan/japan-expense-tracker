import {
  ACTIVE_TRIP_KEY,
  expenseCategories,
  paymentMethods,
  type ExpenseCategory,
  type PaymentMethod,
  type TripEntry,
  type TripSettings,
} from './trip'

const demoTripId = 'demo-japan-spring-trip'
const demoTimestamp = '2026-03-20T12:00:00.000Z'

type DemoExpense = {
  date: string
  amountJpy: number
  category: ExpenseCategory
  paymentMethod?: PaymentMethod
  note: string
}

type DemoWithdrawal = {
  date: string
  amountJpy: number
  note: string
}

const demoRows: Array<DemoExpense | DemoWithdrawal> = [
  { date: '2026-04-06', amountJpy: 1180, category: 'Transit', paymentMethod: 'icCard', note: 'Narita Skyliner top-up' },
  { date: '2026-04-06', amountJpy: 16200, category: 'Lodging', paymentMethod: 'card', note: 'Ueno hotel night 1' },
  { date: '2026-04-06', amountJpy: 1480, category: 'Food', paymentMethod: 'cash', note: 'Ameyoko ramen' },
  { date: '2026-04-07', amountJpy: 920, category: 'Convenience stores', paymentMethod: 'icCard', note: 'Lawson breakfast' },
  { date: '2026-04-07', amountJpy: 3200, category: 'Attractions', paymentMethod: 'card', note: 'TeamLab Planets' },
  { date: '2026-04-07', amountJpy: 8700, note: '7-Bank ATM Shinjuku' },
  { date: '2026-04-08', amountJpy: 560, category: 'Transit', paymentMethod: 'icCard', note: 'Yamanote loop' },
  { date: '2026-04-08', amountJpy: 2380, category: 'Food', paymentMethod: 'card', note: 'Tsukiji sushi set' },
  { date: '2026-04-08', amountJpy: 4100, category: 'Shopping', paymentMethod: 'card', note: 'Ginza stationery' },
  { date: '2026-04-09', amountJpy: 13900, category: 'Lodging', paymentMethod: 'card', note: 'Kyoto machiya stay' },
  { date: '2026-04-09', amountJpy: 14200, category: 'Transit', paymentMethod: 'card', note: 'Tokyo to Kyoto shinkansen' },
  { date: '2026-04-09', amountJpy: 980, category: 'Food', paymentMethod: 'cash', note: 'Ekiben lunch' },
  { date: '2026-04-10', amountJpy: 600, category: 'Attractions', paymentMethod: 'cash', note: 'Kiyomizu-dera entry' },
  { date: '2026-04-10', amountJpy: 2650, category: 'Food', paymentMethod: 'cash', note: 'Nishiki Market snacks' },
  { date: '2026-04-10', amountJpy: 1540, category: 'Transit', paymentMethod: 'icCard', note: 'Kyoto buses' },
  { date: '2026-04-11', amountJpy: 7600, note: 'Post office ATM Kyoto' },
  { date: '2026-04-11', amountJpy: 5200, category: 'Shopping', paymentMethod: 'cash', note: 'Arashiyama ceramics' },
  { date: '2026-04-11', amountJpy: 1850, category: 'Food', paymentMethod: 'card', note: 'Gion udon dinner' },
  { date: '2026-04-12', amountJpy: 6800, category: 'Transit', paymentMethod: 'card', note: 'Kyoto to Osaka rail' },
  { date: '2026-04-12', amountJpy: 14700, category: 'Lodging', paymentMethod: 'card', note: 'Namba hotel' },
  { date: '2026-04-12', amountJpy: 2380, category: 'Other', paymentMethod: 'other', note: 'Coin laundry and soap' },
  { date: '2026-04-13', amountJpy: 4100, category: 'Attractions', paymentMethod: 'card', note: 'Osaka Aquarium' },
  { date: '2026-04-13', amountJpy: 2960, category: 'Food', paymentMethod: 'cash', note: 'Dotonbori takoyaki crawl' },
  { date: '2026-04-14', amountJpy: 1180, category: 'Convenience stores', paymentMethod: 'icCard', note: 'FamilyMart supplies' },
  { date: '2026-04-14', amountJpy: 9800, category: 'Shopping', paymentMethod: 'card', note: 'Den Den Town gifts' },
  { date: '2026-04-15', amountJpy: 15600, category: 'Transit', paymentMethod: 'card', note: 'Osaka to KIX express' },
]

export function createDemoTrip(): { trip: TripSettings; entries: TripEntry[] } {
  const trip: TripSettings = {
    key: ACTIVE_TRIP_KEY,
    tripId: demoTripId,
    tripName: 'Japan Spring Trip',
    startDate: '2026-04-06',
    endDate: '2026-04-15',
    homeCurrency: 'CAD',
    totalBudgetHome: 3500,
    exchangeRateJpy: 110,
    createdAt: demoTimestamp,
    updatedAt: demoTimestamp,
  }

  return {
    trip,
    entries: demoRows.map((row, index) => {
      const timestamp = `2026-03-20T12:${String(index).padStart(2, '0')}:00.000Z`
      const baseEntry = {
        id: `demo-entry-${String(index + 1).padStart(2, '0')}`,
        tripId: demoTripId,
        date: row.date,
        amountJpy: row.amountJpy,
        note: row.note,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      if ('category' in row) {
        return {
          ...baseEntry,
          type: 'expense',
          category: row.category,
          paymentMethod: row.paymentMethod,
        }
      }

      return {
        ...baseEntry,
        type: 'cashWithdrawal',
      }
    }),
  }
}

export function isKnownExpenseCategory(category: string): category is ExpenseCategory {
  return expenseCategories.includes(category as ExpenseCategory)
}

export function isKnownPaymentMethod(method: string): method is PaymentMethod {
  return paymentMethods.includes(method as PaymentMethod)
}
