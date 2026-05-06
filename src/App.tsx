import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import './App.css'
import {
  convertHomeToJpy,
  convertJpyToHome,
  createCashWithdrawalEntry,
  createExpenseEntry,
  createTripSettings,
  currencyPresets,
  entryTypeLabels,
  expenseCategories,
  formatHomeCurrency,
  formatJpy,
  getDashboardAnalytics,
  getEntryListView,
  paymentMethodLabels,
  paymentMethods,
  updateCashWithdrawalEntry,
  updateExpenseEntry,
  validateCashWithdrawalInput,
  validateExpenseInput,
  validateTripSetup,
  type BudgetStatus,
  type CashWithdrawalInput,
  type CashWithdrawalValidationErrors,
  type DashboardAnalytics,
  type EntryCategoryFilter,
  type EntryPaymentMethodFilter,
  type EntrySortOrder,
  type EntryTypeFilter,
  type ExpenseInput,
  type ExpenseValidationErrors,
  type TripEntry,
  type TripSettings,
  type TripSetupInput,
  type TripValidationErrors,
} from './lib/trip'
import { createDemoTrip } from './lib/demoTrip'
import {
  deleteTripEntry,
  getActiveTrip,
  getEntriesForTrip,
  saveActiveTrip,
  saveTripEntry,
  saveTripSnapshot,
} from './lib/tripStore'

type TabId = 'dashboard' | 'expenses' | 'settings'

type Tab = {
  id: TabId
  label: string
  icon: 'dashboard' | 'expenses' | 'settings'
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'expenses', label: 'Expenses', icon: 'expenses' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const emptyStates = {
  dashboard: {
    eyebrow: 'Trip overview',
    title: 'Your Japan spending snapshot will live here.',
    body: 'After trip setup and entries are added, this view will show budget pace, recent activity, and category highlights.',
    action: 'Add expense coming soon',
  },
  expenses: {
    eyebrow: 'Expense history',
    title: 'No expenses or cash withdrawals yet.',
    body: 'This tab will become the searchable trip ledger for meals, trains, lodging, shopping, and ATM withdrawals.',
    action: 'Entry form coming soon',
  },
  settings: {
    eyebrow: 'Trip settings',
    title: 'Trip details are stored locally.',
    body: 'This read-only view shows the first-run setup details. Editing arrives in a later issue.',
    action: 'Settings editing coming soon',
  },
} satisfies Record<TabId, { eyebrow: string; title: string; body: string; action: string }>

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [trip, setTrip] = useState<TripSettings | null>(null)
  const [entries, setEntries] = useState<TripEntry[]>([])
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TripEntry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<TripEntry | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const emptyState = emptyStates[activeTab]
  const hasEntries = entries.length > 0
  const analytics = useMemo(
    () => (trip ? getDashboardAnalytics(trip, entries) : null),
    [entries, trip],
  )

  useEffect(() => {
    let isMounted = true

    getActiveTrip()
      .then((activeTrip) => {
        if (isMounted) {
          setTrip(activeTrip)
        }

        if (!activeTrip) {
          return []
        }

        return getEntriesForTrip(activeTrip.tripId)
      })
      .then((loadedEntries) => {
        if (isMounted) {
          setEntries(loadedEntries)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('Trip data could not be loaded from this browser.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingTrip(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (isLoadingTrip) {
    return (
      <main className="setup-page" aria-busy="true">
        <div className="setup-card">
          <p className="section-kicker">Japan Expense Tracker</p>
          <h1>Loading trip.</h1>
          <p className="setup-intro">Checking this browser for your active Japan trip.</p>
        </div>
      </main>
    )
  }

  if (!trip) {
    return (
      <TripSetupScreen
        loadError={loadError}
        onTripCreated={(nextTrip, nextEntries = []) => {
          setTrip(nextTrip)
          setEntries(nextEntries)
        }}
      />
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#main-content" aria-label="Japan Expense Tracker home">
          <span className="brand-mark" aria-hidden="true">
            <YenIcon />
          </span>
          <span>
            <span className="brand-name">Japan Expense Tracker</span>
            <span className="brand-subtitle">JPY-first travel budgeting</span>
          </span>
        </a>

        <div className="header-actions" aria-label="Quick actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Open add expense form"
            onClick={() => {
              setEditingEntry(null)
              setIsExpenseSheetOpen(true)
            }}
          >
            <PlusIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Open trip settings"
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <main className="content" id="main-content">
        <section className="overview-panel" aria-labelledby="overview-title">
          <div>
            <p className="section-kicker">{trip.tripName}</p>
            <h1 id="overview-title">{formatHomeCurrency(trip.totalBudgetHome, trip.homeCurrency)}</h1>
          </div>
          <dl className="trip-summary" aria-label="Trip budget summary">
            <div>
              <dt>Spent</dt>
              <dd>
                {formatJpy(analytics.totalSpentJpy)}
                <span>
                  {formatHomeCurrency(
                    convertJpyToHome(analytics.totalSpentJpy, trip.exchangeRateJpy),
                    trip.homeCurrency,
                  )}
                </span>
              </dd>
            </div>
            <div>
              <dt>Remaining</dt>
              <dd>
                {formatJpy(analytics.remainingJpy)}
                <span>
                  {formatHomeCurrency(
                    convertJpyToHome(analytics.remainingJpy, trip.exchangeRateJpy),
                    trip.homeCurrency,
                  )}
                </span>
              </dd>
            </div>
            <div>
              <dt>JPY equivalent</dt>
              <dd>{formatJpy(analytics.budgetJpy)}</dd>
            </div>
            <div>
              <dt>Trip dates</dt>
              <dd>
                {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
              </dd>
            </div>
            <div>
              <dt>Exchange rate</dt>
              <dd>
                1 {trip.homeCurrency} = {formatJpy(trip.exchangeRateJpy)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          className={`tab-panel ${activeTab === 'expenses' ? 'expenses-tab-panel' : ''}`}
          aria-labelledby={`${activeTab}-tab-title`}
          key={activeTab}
        >
          <div className="tab-heading">
            <div>
              <p className="section-kicker">{emptyState.eyebrow}</p>
              <h2 id={`${activeTab}-tab-title`}>{currentTab.label}</h2>
            </div>
            {activeTab !== 'settings' && (
              <button
                className="primary-action"
                type="button"
                aria-label="Open add expense form"
                onClick={() => {
                  setEditingEntry(null)
                  setIsExpenseSheetOpen(true)
                }}
              >
                <PlusIcon />
                <span>Add</span>
              </button>
            )}
          </div>

          {activeTab === 'dashboard' ? (
            <DashboardAnalyticsPanel analytics={analytics} trip={trip} />
          ) : activeTab === 'expenses' && hasEntries ? (
            <EntryManagementList
              entries={entries}
              trip={trip}
              onEdit={(entry) => {
                setEditingEntry(entry)
                setIsExpenseSheetOpen(true)
              }}
              onDelete={(entry) => {
                setDeleteError(null)
                setDeletingEntry(entry)
              }}
              onAdd={() => {
                setEditingEntry(null)
                setIsExpenseSheetOpen(true)
              }}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <TabIcon icon={currentTab.icon} />
              </div>
              <p className="empty-eyebrow">{emptyState.eyebrow}</p>

              {activeTab === 'settings' && (
                <dl className="settings-summary" aria-label="Persisted trip settings">
                  <div>
                    <dt>Trip</dt>
                    <dd>{trip.tripName}</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>{formatHomeCurrency(trip.totalBudgetHome, trip.homeCurrency)}</dd>
                  </div>
                  <div>
                    <dt>Rate</dt>
                    <dd>
                      1 {trip.homeCurrency} = {formatJpy(trip.exchangeRateJpy)}
                    </dd>
                  </div>
                </dl>
              )}
              {activeTab !== 'settings' && !hasEntries && (
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => {
                    setEditingEntry(null)
                    setIsExpenseSheetOpen(true)
                  }}
                >
                  Add expense
                </button>
              )}
              {activeTab === 'settings' && (
                <button className="secondary-action" type="button" disabled>
                  {emptyState.action}
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <nav className="bottom-tabs" aria-label="Main navigation">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className="tab-button"
              aria-label={`Show ${tab.label}`}
              aria-current={selected ? 'page' : undefined}
              data-active={selected}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <ExpenseBottomSheet
        isOpen={isExpenseSheetOpen}
        editingEntry={editingEntry}
        trip={trip}
        onClose={() => {
          setIsExpenseSheetOpen(false)
          setEditingEntry(null)
        }}
        onSaved={(entry) => {
          setEntries((current) =>
            upsertEntry(current, entry).sort(compareEntriesByDateThenCreated),
          )
          setIsExpenseSheetOpen(false)
          setEditingEntry(null)
        }}
      />

      {deletingEntry && (
        <DeleteEntryDialog
          entry={deletingEntry}
          error={deleteError}
          isDeleting={isDeleting}
          onCancel={() => {
            setDeletingEntry(null)
            setDeleteError(null)
          }}
          onConfirm={() => {
            setIsDeleting(true)
            setDeleteError(null)
            deleteTripEntry(deletingEntry.id)
              .then(() => {
                setEntries((current) => current.filter((entry) => entry.id !== deletingEntry.id))
                setDeletingEntry(null)
              })
              .catch(() => setDeleteError('Entry could not be deleted in this browser.'))
              .finally(() => setIsDeleting(false))
          }}
        />
      )}
    </div>
  )
}

type TripSetupScreenProps = {
  loadError: string | null
  onTripCreated: (trip: TripSettings, entries?: TripEntry[]) => void
}

const initialTripSetup: TripSetupInput = {
  tripName: '',
  startDate: '',
  endDate: '',
  homeCurrency: 'CAD',
  totalBudgetHome: '',
  exchangeRateJpy: '',
}

function TripSetupScreen({ loadError, onTripCreated }: TripSetupScreenProps) {
  const [form, setForm] = useState<TripSetupInput>(initialTripSetup)
  const [touched, setTouched] = useState<Partial<Record<keyof TripSetupInput, boolean>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const validation = useMemo(() => validateTripSetup(form), [form])
  const visibleErrors = getVisibleErrors(validation.errors, touched)
  const customCurrency = !currencyPresets.includes(form.homeCurrency as (typeof currencyPresets)[number])
  const budgetPreview =
    Number(form.totalBudgetHome) > 0 && Number(form.exchangeRateJpy) > 0
      ? formatJpy(convertHomeToJpy(Number(form.totalBudgetHome), Number(form.exchangeRateJpy)))
      : 'JPY 0'

  function updateField(name: keyof TripSetupInput, value: string) {
    setForm((current) => ({
      ...current,
      [name]: name === 'homeCurrency' ? value.toUpperCase().slice(0, 3) : value,
    }))
  }

  function markTouched(name: keyof TripSetupInput) {
    setTouched((current) => ({ ...current, [name]: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({
      tripName: true,
      startDate: true,
      endDate: true,
      homeCurrency: true,
      totalBudgetHome: true,
      exchangeRateJpy: true,
    })

    if (!validation.isValid) {
      return
    }

    const nextTrip = createTripSettings(form)
    setIsSaving(true)
    setSubmitError(null)

    saveActiveTrip(nextTrip)
      .then(() => onTripCreated(nextTrip))
      .catch(() => {
        setSubmitError('Trip setup could not be saved in this browser.')
      })
      .finally(() => setIsSaving(false))
  }

  function handleLoadDemoTrip() {
    const shouldLoadDemo = window.confirm(
      'Load the Japan Spring Trip demo into this browser? This will replace the current local trip data.',
    )

    if (!shouldLoadDemo) {
      return
    }

    const demoTrip = createDemoTrip()
    setIsLoadingDemo(true)
    setSubmitError(null)

    saveTripSnapshot(demoTrip.trip, demoTrip.entries)
      .then(() => onTripCreated(demoTrip.trip, demoTrip.entries))
      .catch(() => {
        setSubmitError('Demo trip could not be saved in this browser.')
      })
      .finally(() => setIsLoadingDemo(false))
  }

  return (
    <main className="setup-page">
      <section className="setup-card" aria-labelledby="setup-title">
        <div className="setup-copy">
          <p className="section-kicker">First run setup</p>
          <h1 id="setup-title">Set up your Japan trip.</h1>
          <p className="setup-intro">
            Create one active local trip before entering the app shell. Your budget is saved in this
            browser for offline-first tracking.
          </p>
        </div>

        <form className="setup-form" onSubmit={handleSubmit} noValidate>
          {(loadError || submitError) && (
            <p className="form-error" role="alert">
              {submitError ?? loadError}
            </p>
          )}

          <Field
            error={visibleErrors.tripName}
            label="Trip name"
            name="tripName"
          >
            <input
              id="tripName"
              name="tripName"
              type="text"
              maxLength={60}
              value={form.tripName}
              onBlur={() => markTouched('tripName')}
              onChange={(event) => updateField('tripName', event.target.value)}
            />
          </Field>

          <div className="form-grid">
            <Field error={visibleErrors.startDate} label="Start date" name="startDate">
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onBlur={() => markTouched('startDate')}
                onChange={(event) => updateField('startDate', event.target.value)}
              />
            </Field>

            <Field error={visibleErrors.endDate} label="End date" name="endDate">
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={form.endDate}
                onBlur={() => markTouched('endDate')}
                onChange={(event) => updateField('endDate', event.target.value)}
              />
            </Field>
          </div>

          <fieldset className="currency-fieldset">
            <legend>Home currency</legend>
            <div className="currency-options">
              {currencyPresets.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  className="currency-chip"
                  data-active={form.homeCurrency === currency}
                  onClick={() => {
                    updateField('homeCurrency', currency)
                    markTouched('homeCurrency')
                  }}
                >
                  {currency}
                </button>
              ))}
              <button
                type="button"
                className="currency-chip"
                data-active={customCurrency}
                onClick={() => updateField('homeCurrency', '')}
              >
                Custom
              </button>
            </div>
            <input
              id="homeCurrency"
              name="homeCurrency"
              type="text"
              inputMode="text"
              maxLength={3}
              aria-describedby={visibleErrors.homeCurrency ? 'homeCurrency-error' : undefined}
              value={form.homeCurrency}
              onBlur={() => markTouched('homeCurrency')}
              onChange={(event) => updateField('homeCurrency', event.target.value)}
            />
            {visibleErrors.homeCurrency && (
              <p className="field-error" id="homeCurrency-error">
                {visibleErrors.homeCurrency}
              </p>
            )}
          </fieldset>

          <div className="form-grid">
            <Field
              error={visibleErrors.totalBudgetHome}
              label={`Total budget (${form.homeCurrency || 'home'})`}
              name="totalBudgetHome"
            >
              <input
                id="totalBudgetHome"
                name="totalBudgetHome"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.totalBudgetHome}
                onBlur={() => markTouched('totalBudgetHome')}
                onChange={(event) => updateField('totalBudgetHome', event.target.value)}
              />
            </Field>

            <Field
              error={visibleErrors.exchangeRateJpy}
              label="JPY per 1 home currency"
              name="exchangeRateJpy"
            >
              <input
                id="exchangeRateJpy"
                name="exchangeRateJpy"
                type="number"
                min="0"
                step="0.0001"
                inputMode="decimal"
                value={form.exchangeRateJpy}
                onBlur={() => markTouched('exchangeRateJpy')}
                onChange={(event) => updateField('exchangeRateJpy', event.target.value)}
              />
            </Field>
          </div>

          <div className="budget-preview" aria-live="polite">
            <span>Budget preview</span>
            <strong>{budgetPreview}</strong>
          </div>

          <button className="setup-submit" type="submit" disabled={!validation.isValid || isSaving}>
            {isSaving ? 'Saving trip...' : 'Create trip'}
          </button>

          <div className="demo-load-panel">
            <div>
              <strong>Reviewer shortcut</strong>
              <span>Load a deterministic Japan Spring Trip with realistic local entries.</span>
            </div>
            <button
              className="demo-load-button"
              type="button"
              disabled={isSaving || isLoadingDemo}
              onClick={handleLoadDemoTrip}
            >
              {isLoadingDemo ? 'Loading demo...' : 'Load demo trip'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

type ExpenseBottomSheetProps = {
  isOpen: boolean
  editingEntry: TripEntry | null
  trip: TripSettings
  onClose: () => void
  onSaved: (entry: TripEntry) => void
}

const blankExpenseForm: ExpenseInput = {
  amountJpy: '',
  category: '',
  date: '',
  paymentMethod: '',
  note: '',
}

const blankCashWithdrawalForm: CashWithdrawalInput = {
  amountJpy: '',
  date: '',
  note: '',
}

type AddEntryType = 'expense' | 'cashWithdrawal'

function ExpenseBottomSheet({
  isOpen,
  editingEntry,
  trip,
  onClose,
  onSaved,
}: ExpenseBottomSheetProps) {
  const [entryType, setEntryType] = useState<AddEntryType>('expense')
  const [form, setForm] = useState<ExpenseInput>(() => ({
    ...blankExpenseForm,
    date: trip.startDate,
  }))
  const [withdrawalForm, setWithdrawalForm] = useState<CashWithdrawalInput>(() => ({
    ...blankCashWithdrawalForm,
    date: trip.startDate,
  }))
  const [touched, setTouched] = useState<Partial<Record<keyof ExpenseInput, boolean>>>({})
  const [withdrawalTouched, setWithdrawalTouched] = useState<
    Partial<Record<keyof CashWithdrawalInput, boolean>>
  >({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const isEditing = editingEntry !== null
  const expenseValidation = useMemo(() => validateExpenseInput(form), [form])
  const withdrawalValidation = useMemo(
    () => validateCashWithdrawalInput(withdrawalForm),
    [withdrawalForm],
  )
  const visibleErrors = getVisibleExpenseErrors(expenseValidation.errors, touched)
  const visibleWithdrawalErrors = getVisibleCashWithdrawalErrors(
    withdrawalValidation.errors,
    withdrawalTouched,
  )
  const activeAmountJpy = entryType === 'expense' ? form.amountJpy : withdrawalForm.amountJpy
  const activeValidation =
    entryType === 'expense' ? expenseValidation : withdrawalValidation
  const convertedAmount =
    Number(activeAmountJpy) > 0
      ? formatHomeCurrency(convertJpyToHome(Number(activeAmountJpy), trip.exchangeRateJpy), trip.homeCurrency)
      : formatHomeCurrency(0, trip.homeCurrency)

  useEffect(() => {
    if (isOpen) {
      if (editingEntry?.type === 'expense') {
        setEntryType('expense')
        setForm({
          amountJpy: String(editingEntry.amountJpy),
          category: editingEntry.category,
          date: editingEntry.date,
          paymentMethod: editingEntry.paymentMethod ?? '',
          note: editingEntry.note ?? '',
        })
      } else if (editingEntry?.type === 'cashWithdrawal') {
        setEntryType('cashWithdrawal')
        setWithdrawalForm({
          amountJpy: String(editingEntry.amountJpy),
          date: editingEntry.date,
          note: editingEntry.note ?? '',
        })
      } else {
        setEntryType('expense')
        setForm({ ...blankExpenseForm, date: trip.startDate })
        setWithdrawalForm({ ...blankCashWithdrawalForm, date: trip.startDate })
      }
      setTouched({})
      setWithdrawalTouched({})
      setSubmitError(null)
      window.setTimeout(() => closeButtonRef.current?.focus(), 0)
    }
  }, [editingEntry, isOpen, trip.startDate])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  function updateField(name: keyof ExpenseInput, value: string) {
    setForm((current) => ({
      ...current,
      [name]: name === 'note' ? value.replace(/[\r\n]/g, ' ').slice(0, 80) : value,
    }))
  }

  function updateWithdrawalField(name: keyof CashWithdrawalInput, value: string) {
    setWithdrawalForm((current) => ({
      ...current,
      [name]: name === 'note' ? value.replace(/[\r\n]/g, ' ').slice(0, 80) : value,
    }))
  }

  function markTouched(name: keyof ExpenseInput) {
    setTouched((current) => ({ ...current, [name]: true }))
  }

  function markWithdrawalTouched(name: keyof CashWithdrawalInput) {
    setWithdrawalTouched((current) => ({ ...current, [name]: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (entryType === 'expense') {
      setTouched({
        amountJpy: true,
        category: true,
        date: true,
        paymentMethod: true,
        note: true,
      })

      if (!expenseValidation.isValid) {
        return
      }

      saveEntry(
        editingEntry?.type === 'expense'
          ? updateExpenseEntry(editingEntry, form)
          : createExpenseEntry(trip.tripId, form),
      )
      return
    }

    setWithdrawalTouched({
      amountJpy: true,
      date: true,
      note: true,
    })

    if (!withdrawalValidation.isValid) {
      return
    }

    saveEntry(
      editingEntry?.type === 'cashWithdrawal'
        ? updateCashWithdrawalEntry(editingEntry, withdrawalForm)
        : createCashWithdrawalEntry(trip.tripId, withdrawalForm),
    )
  }

  function saveEntry(entry: TripEntry) {
    setIsSaving(true)
    setSubmitError(null)

    saveTripEntry(entry)
      .then(() => onSaved(entry))
      .catch(() => setSubmitError('Entry could not be saved in this browser.'))
      .finally(() => setIsSaving(false))
  }

  const sheetTitle =
    entryType === 'expense'
      ? isEditing
        ? 'Edit expense'
        : 'New expense'
      : isEditing
        ? 'Edit cash withdrawal'
        : 'New cash withdrawal'
  const amountLabel = entryType === 'expense' ? 'Amount (JPY)' : 'Withdrawal amount (JPY)'

  return (
    <div className="sheet-layer" role="presentation">
      <button className="sheet-backdrop" type="button" aria-label="Close entry form" onClick={onClose} />
      <section
        className="bottom-sheet"
        aria-labelledby="expense-sheet-title"
        aria-modal="true"
        role="dialog"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="section-kicker">{isEditing ? 'Edit entry' : 'Add entry'}</p>
            <h2 id="expense-sheet-title">{sheetTitle}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            aria-label="Close entry form"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="entry-type-control" aria-label="Entry type">
          <button
            type="button"
            data-active={entryType === 'expense'}
            disabled={isEditing}
            onClick={() => setEntryType('expense')}
          >
            Expense
          </button>
          <button
            type="button"
            data-active={entryType === 'cashWithdrawal'}
            disabled={isEditing}
            onClick={() => setEntryType('cashWithdrawal')}
          >
            Cash withdrawal
          </button>
        </div>

        <form className="expense-form" onSubmit={handleSubmit} noValidate>
          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}

          <EntryField
            error={
              entryType === 'expense' ? visibleErrors.amountJpy : visibleWithdrawalErrors.amountJpy
            }
            label={amountLabel}
            name="amountJpy"
          >
            <input
              id="amountJpy"
              name="amountJpy"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={entryType === 'expense' ? form.amountJpy : withdrawalForm.amountJpy}
              onBlur={() =>
                entryType === 'expense'
                  ? markTouched('amountJpy')
                  : markWithdrawalTouched('amountJpy')
              }
              onChange={(event) =>
                entryType === 'expense'
                  ? updateField('amountJpy', event.target.value)
                  : updateWithdrawalField('amountJpy', event.target.value)
              }
            />
          </EntryField>

          {entryType === 'expense' && (
            <EntryField error={visibleErrors.category} label="Category" name="category">
              <select
                id="category"
                name="category"
                value={form.category}
                onBlur={() => markTouched('category')}
                onChange={(event) => updateField('category', event.target.value)}
              >
                <option value="">Choose category</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </EntryField>
          )}

          <div className="form-grid">
            <EntryField
              error={entryType === 'expense' ? visibleErrors.date : visibleWithdrawalErrors.date}
              label="Date"
              name="date"
            >
              <input
                id="date"
                name="date"
                type="date"
                value={entryType === 'expense' ? form.date : withdrawalForm.date}
                onBlur={() =>
                  entryType === 'expense' ? markTouched('date') : markWithdrawalTouched('date')
                }
                onChange={(event) =>
                  entryType === 'expense'
                    ? updateField('date', event.target.value)
                    : updateWithdrawalField('date', event.target.value)
                }
              />
            </EntryField>

            {entryType === 'expense' && (
              <EntryField error={visibleErrors.paymentMethod} label="Payment method" name="paymentMethod">
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onBlur={() => markTouched('paymentMethod')}
                  onChange={(event) => updateField('paymentMethod', event.target.value)}
                >
                  <option value="">Blank</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </select>
              </EntryField>
            )}
          </div>

          <EntryField
            error={entryType === 'expense' ? visibleErrors.note : visibleWithdrawalErrors.note}
            label="Note"
            name="note"
          >
            <input
              id="note"
              name="note"
              type="text"
              maxLength={80}
              value={entryType === 'expense' ? form.note : withdrawalForm.note}
              onBlur={() =>
                entryType === 'expense' ? markTouched('note') : markWithdrawalTouched('note')
              }
              onChange={(event) =>
                entryType === 'expense'
                  ? updateField('note', event.target.value)
                  : updateWithdrawalField('note', event.target.value)
              }
            />
          </EntryField>

          <div className="budget-preview" aria-live="polite">
            <span>Home-currency preview</span>
            <strong>{convertedAmount}</strong>
          </div>

          <button className="setup-submit" type="submit" disabled={!activeValidation.isValid || isSaving}>
            {isSaving
              ? isEditing
                ? 'Updating entry...'
                : 'Saving entry...'
              : entryType === 'expense'
                ? isEditing
                  ? 'Update expense'
                  : 'Save expense'
                : isEditing
                  ? 'Update withdrawal'
                  : 'Save withdrawal'}
          </button>
        </form>
      </section>
    </div>
  )
}

type EntryManagementListProps = {
  entries: TripEntry[]
  trip: TripSettings
  onEdit: (entry: TripEntry) => void
  onDelete: (entry: TripEntry) => void
  onAdd: () => void
}

function EntryManagementList({ entries, trip, onEdit, onDelete, onAdd }: EntryManagementListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [entryType, setEntryType] = useState<EntryTypeFilter>('all')
  const [category, setCategory] = useState<EntryCategoryFilter>('all')
  const [paymentMethod, setPaymentMethod] = useState<EntryPaymentMethodFilter>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortOrder, setSortOrder] = useState<EntrySortOrder>('newest')
  const entryListView = useMemo(
    () =>
      getEntryListView(entries, {
        searchQuery,
        entryType,
        category,
        paymentMethod,
        startDate,
        endDate,
        sortOrder,
      }),
    [category, endDate, entries, entryType, paymentMethod, searchQuery, sortOrder, startDate],
  )
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    entryType !== 'all' ||
    category !== 'all' ||
    paymentMethod !== 'all' ||
    startDate !== '' ||
    endDate !== ''

  function clearFilters() {
    setSearchQuery('')
    setEntryType('all')
    setCategory('all')
    setPaymentMethod('all')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="entry-management">
      <div className="entry-controls" aria-label="Search and filter entries">
        <label className="field entry-search-field" htmlFor="entrySearch">
          <span>Search entries</span>
          <input
            id="entrySearch"
            name="entrySearch"
            type="search"
            placeholder="Search notes, categories, methods"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="entry-filter-grid">
          <label className="field" htmlFor="entryTypeFilter">
            <span>Type</span>
            <select
              id="entryTypeFilter"
              name="entryTypeFilter"
              value={entryType}
              onChange={(event) => setEntryType(event.target.value as EntryTypeFilter)}
            >
              <option value="all">All entries</option>
              <option value="expense">{entryTypeLabels.expense}</option>
              <option value="cashWithdrawal">{entryTypeLabels.cashWithdrawal}</option>
            </select>
          </label>

          <label className="field" htmlFor="categoryFilter">
            <span>Category</span>
            <select
              id="categoryFilter"
              name="categoryFilter"
              value={category}
              onChange={(event) => setCategory(event.target.value as EntryCategoryFilter)}
            >
              <option value="all">All categories</option>
              {expenseCategories.map((expenseCategory) => (
                <option key={expenseCategory} value={expenseCategory}>
                  {expenseCategory}
                </option>
              ))}
            </select>
          </label>

          <label className="field" htmlFor="paymentMethodFilter">
            <span>Payment</span>
            <select
              id="paymentMethodFilter"
              name="paymentMethodFilter"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as EntryPaymentMethodFilter)
              }
            >
              <option value="all">All methods</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </select>
          </label>

          <label className="field" htmlFor="entryStartDate">
            <span>From</span>
            <input
              id="entryStartDate"
              name="entryStartDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="field" htmlFor="entryEndDate">
            <span>To</span>
            <input
              id="entryEndDate"
              name="entryEndDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <label className="field" htmlFor="entrySortOrder">
            <span>Sort</span>
            <select
              id="entrySortOrder"
              name="entrySortOrder"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as EntrySortOrder)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount">Amount</option>
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <button className="clear-filters-button" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      <dl className="entry-stats" aria-label="Filtered entry totals">
        <div>
          <dt>Filtered entries</dt>
          <dd>
            {entryListView.filteredCount}
            <span>{entries.length} total</span>
          </dd>
        </div>
        <div>
          <dt>{entryListView.contextualTotalLabel}</dt>
          <dd>
            {formatJpy(entryListView.contextualTotalJpy)}
            <span>
              {formatHomeCurrency(
                convertJpyToHome(entryListView.contextualTotalJpy, trip.exchangeRateJpy),
                trip.homeCurrency,
              )}
            </span>
          </dd>
        </div>
        <div>
          <dt>Expense total</dt>
          <dd>{formatJpy(entryListView.expenseTotalJpy)}</dd>
        </div>
        <div>
          <dt>Withdrawals</dt>
          <dd>{formatJpy(entryListView.withdrawalTotalJpy)}</dd>
        </div>
      </dl>

      {entryListView.entries.length > 0 ? (
        <ul className="managed-entry-list" aria-label="Expense and cash withdrawal history">
          {entryListView.entries.map((entry) => (
            <li key={entry.id} className="managed-entry-card">
              <div className="managed-entry-main">
                <span className="entry-badge" data-entry-type={entry.type}>
                  {entryTypeLabels[entry.type]}
                </span>
                <strong>{formatJpy(entry.amountJpy)}</strong>
                <span className="entry-note">
                  {entry.note || (entry.type === 'expense' ? `${entry.category} expense` : 'Cash withdrawal')}
                </span>
                <span className="entry-meta">
                  {formatDate(entry.date)}
                  {entry.type === 'expense' && (
                    <>
                      {' '}
                      &middot; {entry.category}
                      {entry.paymentMethod && (
                        <>
                          {' '}
                          &middot; {paymentMethodLabels[entry.paymentMethod]}
                        </>
                      )}
                    </>
                  )}
                </span>
              </div>
              <details className="entry-actions">
                <summary aria-label={`Open actions for ${entry.note || formatJpy(entry.amountJpy)}`}>
                  <MoreIcon />
                </summary>
                <div className="entry-actions-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => onEdit(entry)}>
                    Edit
                  </button>
                  <button
                    className="danger-menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => onDelete(entry)}
                  >
                    Delete
                  </button>
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <div className="filtered-empty-state">
          <div>
            <p className="empty-eyebrow">No matching entries</p>
            <h3>Try a wider search.</h3>
            <p>
              Adjust the filters, clear the current view, or add another entry if this trip is
              missing something.
            </p>
          </div>
          <div className="filtered-empty-actions">
            <button className="secondary-action" type="button" onClick={clearFilters}>
              Clear filters
            </button>
            <button className="primary-action" type="button" onClick={onAdd}>
              <PlusIcon />
              <span>Add</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type DeleteEntryDialogProps = {
  entry: TripEntry
  error: string | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

function DeleteEntryDialog({
  entry,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteEntryDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="dialog-layer" role="presentation">
      <div className="dialog-backdrop" />
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-entry-title"
        aria-describedby="delete-entry-description"
      >
        <div>
          <p className="section-kicker">Delete entry</p>
          <h2 id="delete-entry-title">Remove this trip entry?</h2>
        </div>
        <p id="delete-entry-description">
          {formatJpy(entry.amountJpy)} from {formatDate(entry.date)} will be permanently removed from
          this browser.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            ref={cancelButtonRef}
            className="secondary-action"
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="danger-action"
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </section>
    </div>
  )
}

type DashboardAnalyticsPanelProps = {
  analytics: DashboardAnalytics
  trip: TripSettings
}

const budgetStatusLabels: Record<BudgetStatus, string> = {
  onTrack: 'On track',
  caution: 'Caution',
  overBudget: 'Over budget',
}

function DashboardAnalyticsPanel({ analytics, trip }: DashboardAnalyticsPanelProps) {
  return (
    <div className="dashboard-grid">
      <dl className="dashboard-metrics" aria-label="Dashboard budget metrics">
        <div>
          <dt>Total spent</dt>
          <dd>
            {formatJpy(analytics.totalSpentJpy)}
            <span>
              {formatHomeCurrency(
                convertJpyToHome(analytics.totalSpentJpy, trip.exchangeRateJpy),
                trip.homeCurrency,
              )}
            </span>
          </dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>
            {formatJpy(analytics.remainingJpy)}
            <span>
              {formatHomeCurrency(
                convertJpyToHome(analytics.remainingJpy, trip.exchangeRateJpy),
                trip.homeCurrency,
              )}
            </span>
          </dd>
        </div>
        <div>
          <dt>Daily average</dt>
          <dd>{formatJpy(analytics.dailyAverageJpy)}</dd>
        </div>
        <div>
          <dt>Daily budget</dt>
          <dd>{formatJpy(analytics.originalDailyBudgetJpy)}</dd>
        </div>
        <div>
          <dt>Remaining daily</dt>
          <dd>{formatJpy(analytics.currentRemainingDailyAllowanceJpy)}</dd>
        </div>
        <div>
          <dt>Days left</dt>
          <dd>{analytics.daysLeft}</dd>
        </div>
      </dl>

      <section className="dashboard-card status-card" aria-labelledby="budget-status-title">
        <div className="dashboard-card-heading">
          <div>
            <p className="section-kicker">Budget status</p>
            <h3 id="budget-status-title">{budgetStatusLabels[analytics.budgetStatus]}</h3>
          </div>
          <span className="status-pill" data-status={analytics.budgetStatus}>
            {budgetStatusLabels[analytics.budgetStatus]}
          </span>
        </div>
        <div
          className="progress-track"
          aria-label={`${analytics.tripProgressPercent}% of trip elapsed`}
        >
          <span style={{ inlineSize: `${analytics.tripProgressPercent}%` }} />
        </div>
        <p>
          {analytics.daysElapsed} of {analytics.totalTripDays} trip days elapsed. Expected spend by
          today is {formatJpy(analytics.expectedSpendToDateJpy)}; in-trip spending to date is{' '}
          {formatJpy(analytics.inTripSpentToDateJpy)}.
        </p>
        {analytics.outsideTripExpenseTotalJpy > 0 && (
          <p className="dashboard-note">
            {formatJpy(analytics.outsideTripExpenseTotalJpy)} is outside trip dates and excluded
            from pacing.
          </p>
        )}
      </section>

      <section className="dashboard-card chart-card" aria-labelledby="spending-chart-title">
        <div className="dashboard-card-heading">
          <div>
            <p className="section-kicker">Cumulative spend</p>
            <h3 id="spending-chart-title">Actual vs expected pace</h3>
          </div>
        </div>
        <CumulativeSpendingChart analytics={analytics} />
      </section>

      <section className="dashboard-card" aria-labelledby="category-breakdown-title">
        <div className="dashboard-card-heading">
          <div>
            <p className="section-kicker">Categories</p>
            <h3 id="category-breakdown-title">Spending breakdown</h3>
          </div>
        </div>
        {analytics.categoryBreakdown.length > 0 ? (
          <ul className="category-breakdown-list">
            {analytics.categoryBreakdown.map((category) => (
              <li key={category.category}>
                <div>
                  <strong>{category.category}</strong>
                  <span>
                    {formatJpy(category.totalJpy)} · {category.percentage}%
                  </span>
                </div>
                <div className="category-bar" aria-hidden="true">
                  <span style={{ inlineSize: `${category.percentage}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-copy">Add an expense to see category totals.</p>
        )}
      </section>

      <section className="dashboard-card" aria-labelledby="recent-activity-title">
        <div className="dashboard-card-heading">
          <div>
            <p className="section-kicker">Recent activity</p>
            <h3 id="recent-activity-title">Latest entries</h3>
          </div>
        </div>
        {analytics.recentEntries.length > 0 ? (
          <ul className="dashboard-entry-list">
            {analytics.recentEntries.map((entry) => (
              <li key={entry.id}>
                <span className="entry-badge" data-entry-type={entry.type}>
                  {entryTypeLabels[entry.type]}
                </span>
                <strong>{formatJpy(entry.amountJpy)}</strong>
                <span className="entry-note">
                  {entry.note ||
                    (entry.type === 'expense' ? `${entry.category} expense` : 'Cash withdrawal')}
                </span>
                <span className="entry-meta">
                  {formatDate(entry.date)}
                  {entry.type === 'expense' && <> · {entry.category}</>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-copy">Add an expense or withdrawal to see recent activity.</p>
        )}
      </section>
    </div>
  )
}

function CumulativeSpendingChart({ analytics }: { analytics: DashboardAnalytics }) {
  const width = 320
  const height = 150
  const padding = 18
  const maxY = Math.max(
    analytics.budgetJpy,
    ...analytics.cumulativeSpending.map((point) => Math.max(point.actualJpy, point.expectedJpy)),
    1,
  )
  const actualPoints = getChartPoints(
    analytics.cumulativeSpending,
    'actualJpy',
    width,
    height,
    padding,
    maxY,
  )
  const expectedPoints = getChartPoints(
    analytics.cumulativeSpending,
    'expectedJpy',
    width,
    height,
    padding,
    maxY,
  )
  const lastPoint = analytics.cumulativeSpending.at(-1)

  return (
    <div className="spending-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">Cumulative spending chart</title>
        <desc id="chart-desc">
          Actual spending is {formatJpy(lastPoint?.actualJpy ?? 0)} and expected trip pace is{' '}
          {formatJpy(lastPoint?.expectedJpy ?? 0)}.
        </desc>
        <line x1={padding} x2={padding} y1={padding} y2={height - padding} />
        <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <polyline className="expected-line" points={expectedPoints} />
        <polyline className="actual-line" points={actualPoints} />
      </svg>
      <dl className="chart-legend">
        <div>
          <dt>Actual</dt>
          <dd>{formatJpy(lastPoint?.actualJpy ?? 0)}</dd>
        </div>
        <div>
          <dt>Expected</dt>
          <dd>{formatJpy(lastPoint?.expectedJpy ?? 0)}</dd>
        </div>
      </dl>
    </div>
  )
}

type FieldProps = {
  children: ReactElement
  error?: string
  label: string
  name: keyof TripSetupInput
}

function Field({ children, error, label, name }: FieldProps) {
  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      {children}
      {error && (
        <span className="field-error" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

type EntryFieldProps = {
  children: ReactElement
  error?: string
  label: string
  name: keyof ExpenseInput | keyof CashWithdrawalInput
}

function EntryField({ children, error, label, name }: EntryFieldProps) {
  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      {children}
      {error && (
        <span className="field-error" id={`${name}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

function getVisibleErrors(
  errors: TripValidationErrors,
  touched: Partial<Record<keyof TripSetupInput, boolean>>,
): TripValidationErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => touched[field as keyof TripSetupInput]),
  ) as TripValidationErrors
}

function getVisibleExpenseErrors(
  errors: ExpenseValidationErrors,
  touched: Partial<Record<keyof ExpenseInput, boolean>>,
): ExpenseValidationErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => touched[field as keyof ExpenseInput]),
  ) as ExpenseValidationErrors
}

function getVisibleCashWithdrawalErrors(
  errors: CashWithdrawalValidationErrors,
  touched: Partial<Record<keyof CashWithdrawalInput, boolean>>,
): CashWithdrawalValidationErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => touched[field as keyof CashWithdrawalInput]),
  ) as CashWithdrawalValidationErrors
}

function compareEntriesByDateThenCreated(first: TripEntry, second: TripEntry): number {
  return first.date.localeCompare(second.date) || first.createdAt.localeCompare(second.createdAt)
}

function upsertEntry(entries: TripEntry[], nextEntry: TripEntry): TripEntry[] {
  const existingIndex = entries.findIndex((entry) => entry.id === nextEntry.id)

  if (existingIndex === -1) {
    return [...entries, nextEntry]
  }

  return entries.map((entry, index) => (index === existingIndex ? nextEntry : entry))
}

function getChartPoints(
  points: DashboardAnalytics['cumulativeSpending'],
  key: 'actualJpy' | 'expectedJpy',
  width: number,
  height: number,
  padding: number,
  maxY: number,
): string {
  const drawableWidth = width - padding * 2
  const drawableHeight = height - padding * 2
  const denominator = Math.max(points.length - 1, 1)

  return points
    .map((point, index) => {
      const x = padding + (drawableWidth * index) / denominator
      const y = height - padding - (drawableHeight * point[key]) / maxY

      return `${roundChartCoordinate(x)},${roundChartCoordinate(y)}`
    })
    .join(' ')
}

function roundChartCoordinate(value: number): number {
  return Math.round(value * 10) / 10
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`))
}

function TabIcon({ icon }: { icon: Tab['icon'] }) {
  if (icon === 'dashboard') {
    return <DashboardIcon />
  }

  if (icon === 'expenses') {
    return <ReceiptIcon />
  }

  return <SettingsIcon />
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M4 13.5h6.5V20H4z" />
      <path d="M13.5 4H20v16h-6.5z" />
      <path d="M4 4h6.5v6.5H4z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-3-1.5L13 20l-3-1.5L7 20l-2-1V6a2 2 0 0 1 2-2Z" />
      <path d="M8 9h8" />
      <path d="M8 13h6" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M12 12h.01" />
      <path d="M19 12h.01" />
      <path d="M5 12h.01" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="m19.4 15 .1 2.2-2.3 1.3-1.9-1.1a7.8 7.8 0 0 1-1.5.8L13 20.4h-2l-.8-2.2a7.8 7.8 0 0 1-1.5-.8l-1.9 1.1-2.3-1.3.1-2.2a7.3 7.3 0 0 1-.8-1.5L2 12l1.8-1.5c.2-.5.5-1 .8-1.5l-.1-2.2 2.3-1.3 1.9 1.1c.5-.3 1-.6 1.5-.8L11 3.6h2l.8 2.2c.5.2 1 .5 1.5.8l1.9-1.1 2.3 1.3-.1 2.2c.3.5.6 1 .8 1.5L22 12l-1.8 1.5c-.2.5-.5 1-.8 1.5Z" />
    </svg>
  )
}

function YenIcon() {
  return (
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="m6.5 4 5.5 8 5.5-8" />
      <path d="M8 12h8" />
      <path d="M8 16h8" />
      <path d="M12 12v8" />
    </svg>
  )
}

export default App
