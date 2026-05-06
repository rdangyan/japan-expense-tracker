import { ACTIVE_TRIP_KEY, type TripSettings } from './trip'

const databaseName = 'japan-expense-tracker'
const databaseVersion = 1
const tripStoreName = 'tripSettings'

export function getActiveTrip(): Promise<TripSettings | null> {
  return withTripStore('readonly', (store) => {
    const request = store.get(ACTIVE_TRIP_KEY)

    return requestToPromise<TripSettings | undefined>(request).then((trip) => trip ?? null)
  })
}

export function saveActiveTrip(trip: TripSettings): Promise<void> {
  return withTripStore('readwrite', (store) => {
    const request = store.put(trip)

    return requestToPromise<IDBValidKey>(request).then(() => undefined)
  })
}

function withTripStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => Promise<T>,
): Promise<T> {
  return openDatabase().then(
    (database) =>
      new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(tripStoreName, mode)
        const store = transaction.objectStore(tripStoreName)
        let actionResult: T

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

        action(store).then(
          (result) => {
            actionResult = result
          },
          (error: unknown) => {
            transaction.abort()
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
