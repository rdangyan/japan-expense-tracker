import { ACTIVE_TRIP_KEY, type TripEntry, type TripSettings } from './trip'

const databaseName = 'japan-expense-tracker'
const databaseVersion = 2
const tripStoreName = 'tripSettings'
const entriesStoreName = 'entries'

export function getActiveTrip(): Promise<TripSettings | null> {
  return withTripStore('readonly', (store) => {
    const request = store.get(ACTIVE_TRIP_KEY)

    return requestToPromise<TripSettings | undefined>(request).then((trip) => trip ?? null)
  })
}

export function saveActiveTrip(trip: TripSettings): Promise<void> {
  return withStores('readwrite', [tripStoreName, entriesStoreName], (stores) => {
    const request = stores.tripSettings.put(trip)

    return requestToPromise<IDBValidKey>(request).then(() => undefined)
  })
}

export function getEntriesForTrip(tripId: string): Promise<TripEntry[]> {
  return withStores('readonly', [tripStoreName, entriesStoreName], (stores) => {
    const index = stores.entries.index('tripId')
    const request = index.getAll(tripId)

    return requestToPromise<TripEntry[]>(request).then((entries) =>
      entries.sort(compareEntriesByDateThenCreated),
    )
  })
}

export function saveTripEntry(entry: TripEntry): Promise<void> {
  return withStores('readwrite', [tripStoreName, entriesStoreName], (stores) => {
    const request = stores.entries.put(entry)

    return requestToPromise<IDBValidKey>(request).then(() => undefined)
  })
}

export function deleteTripEntry(entryId: string): Promise<void> {
  return withStores('readwrite', [tripStoreName, entriesStoreName], (stores) => {
    const request = stores.entries.delete(entryId)

    return requestToPromise<undefined>(request).then(() => undefined)
  })
}

export function deleteActiveTripData(): Promise<void> {
  return withStores('readwrite', [tripStoreName, entriesStoreName], (stores) => {
    const writes: Promise<unknown>[] = [
      requestToPromise(stores.tripSettings.delete(ACTIVE_TRIP_KEY)),
      requestToPromise(stores.entries.clear()),
    ]

    return Promise.all(writes).then(() => undefined)
  })
}

export function saveTripSnapshot(trip: TripSettings, entries: TripEntry[]): Promise<void> {
  return withStores('readwrite', [tripStoreName, entriesStoreName], (stores) => {
    const writes: Promise<unknown>[] = [
      requestToPromise(stores.tripSettings.put(trip)),
      requestToPromise(stores.entries.clear()),
      ...entries.map((entry) => requestToPromise(stores.entries.put(entry))),
    ]

    return Promise.all(writes).then(() => undefined)
  })
}

function withTripStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  return withStores(mode, [tripStoreName, entriesStoreName], (stores) => action(stores.tripSettings))
}

type StoreMap = {
  entries: IDBObjectStore
  tripSettings: IDBObjectStore
}

function withStores<T>(
  mode: IDBTransactionMode,
  storeNames: string[],
  action: (stores: StoreMap) => Promise<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(storeNames, mode)
        const stores = {
          entries: transaction.objectStore(entriesStoreName),
          tripSettings: transaction.objectStore(tripStoreName),
        }
        let actionResult: T
        let actionSettled = false

        transaction.oncomplete = () => {
          database.close()
          resolve(actionResult)
        }

        transaction.onerror = () => {
          database.close()
          reject(transaction.error)
        }

        transaction.onabort = () => {
          database.close()
          reject(transaction.error)
        }

        action(stores).then(
          (result) => {
            actionResult = result
            actionSettled = true
          },
          (error: unknown) => {
            if (!actionSettled) {
              transaction.abort()
            }
            reject(error)
          },
        )
      }),
  )
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(tripStoreName)) {
        database.createObjectStore(tripStoreName, { keyPath: 'key' })
      }

      if (!database.objectStoreNames.contains(entriesStoreName)) {
        const entriesStore = database.createObjectStore(entriesStoreName, { keyPath: 'id' })

        entriesStore.createIndex('tripId', 'tripId', { unique: false })
        entriesStore.createIndex('date', 'date', { unique: false })
        entriesStore.createIndex('createdAt', 'createdAt', { unique: false })
      } else {
        const transaction = request.transaction
        const entriesStore = transaction?.objectStore(entriesStoreName)

        if (entriesStore && !entriesStore.indexNames.contains('tripId')) {
          entriesStore.createIndex('tripId', 'tripId', { unique: false })
        }

        if (entriesStore && !entriesStore.indexNames.contains('date')) {
          entriesStore.createIndex('date', 'date', { unique: false })
        }

        if (entriesStore && !entriesStore.indexNames.contains('createdAt')) {
          entriesStore.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function compareEntriesByDateThenCreated(first: TripEntry, second: TripEntry): number {
  return first.date.localeCompare(second.date) || first.createdAt.localeCompare(second.createdAt)
}
