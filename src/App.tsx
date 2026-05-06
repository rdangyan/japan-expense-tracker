import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'
import './App.css'
import {
  convertHomeToJpy,
  convertJpyToHome,
  createExpenseEntry,
  createTripSettings,
  currencyPresets,
  expenseCategories,
  formatHomeCurrency,
  formatJpy,
  paymentMethods,
  validateExpenseInput,
  validateTripSetup,
  calculateExpenseTotalJpy,
  type ExpenseInput,
  type ExpenseValidationErrors,
  type ExpenseEntry,
  type PaymentMethod,
  type TripEntry,
  type TripSettings,
  type TripSetupInput,
  type TripValidationErrors,
} from './lib/trip'
import { createDemoTrip } from './lib/demoTrip'
import {
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
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const emptyState = emptyStates[activeTab]
  const hasEntries = entries.length > 0

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

  const budgetJpy = convertHomeToJpy(trip.totalBudgetHome, trip.exchangeRateJpy)
  const totalSpentJpy = calculateExpenseTotalJpy(entries)
  const remainingJpy = budgetJpy - totalSpentJpy

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
            onClick={() => setIsExpenseSheetOpen(true)}
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
                {formatJpy(totalSpentJpy)}
                <span>{formatHomeCurrency(convertJpyToHome(totalSpentJpy, trip.exchangeRateJpy), trip.homeCurrency)}</span>
              </dd>
            </div>
            <div>
              <dt>Remaining</dt>
              <dd>
                {formatJpy(remainingJpy)}
                <span>{formatHomeCurrency(convertJpyToHome(remainingJpy, trip.exchangeRateJpy), trip.homeCurrency)}</span>
              </dd>
            </div>
            <div>
              <dt>JPY equivalent</dt>
              <dd>{formatJpy(budgetJpy)}</dd>
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
          className="tab-panel"
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
                onClick={() => setIsExpenseSheetOpen(true)}
              >
                <PlusIcon />
                <span>Add</span>
              </button>
            )}
          </div>

          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <TabIcon icon={currentTab.icon} />
            </div>
            <p className="empty-eyebrow">{emptyState.eyebrow}</p>
            <h3>
              {activeTab !== 'settings' && hasEntries
                ? activeTab === 'dashboard'
                  ? 'Spending totals are up to date.'
                  : 'Your saved entries are ready.'
                : emptyState.title}
            </h3>
            <p>
              {activeTab !== 'settings' && hasEntries
                ? 'New expenses persist locally and update these JPY-first totals immediately.'
                : emptyState.body}
            </p>
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
            {activeTab !== 'settings' && hasEntries && (
              <PopulatedEntryPreview entries={entries} trip={trip} view={activeTab} />
            )}
            {activeTab !== 'settings' && !hasEntries && (
              <button className="secondary-action" type="button" onClick={() => setIsExpenseSheetOpen(true)}>
                Add expense
              </button>
            )}
            {activeTab === 'settings' && (
              <button className="secondary-action" type="button" disabled>
                {emptyState.action}
              </button>
            )}
          </div>
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
        trip={trip}
        onClose={() => setIsExpenseSheetOpen(false)}
        onSaved={(entry) => {
          setEntries((current) => [...current, entry].sort(compareEntriesByDateThenCreated))
          setIsExpenseSheetOpen(false)
        }}
      />
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
  trip: TripSettings
  onClose: () => void
  onSaved: (entry: ExpenseEntry) => void
}

const blankExpenseForm: ExpenseInput = {
  amountJpy: '',
  category: '',
  date: '',
  paymentMethod: '',
  note: '',
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  icCard: 'IC card',
  other: 'Other',
}

function ExpenseBottomSheet({ isOpen, trip, onClose, onSaved }: ExpenseBottomSheetProps) {
  const [form, setForm] = useState<ExpenseInput>(() => ({
    ...blankExpenseForm,
    date: trip.startDate,
  }))
  const [touched, setTouched] = useState<Partial<Record<keyof ExpenseInput, boolean>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const validation = useMemo(() => validateExpenseInput(form), [form])
  const visibleErrors = getVisibleExpenseErrors(validation.errors, touched)
  const convertedAmount =
    Number(form.amountJpy) > 0
      ? formatHomeCurrency(convertJpyToHome(Number(form.amountJpy), trip.exchangeRateJpy), trip.homeCurrency)
      : formatHomeCurrency(0, trip.homeCurrency)

  useEffect(() => {
    if (isOpen) {
      setForm({ ...blankExpenseForm, date: trip.startDate })
      setTouched({})
      setSubmitError(null)
    }
  }, [isOpen, trip.startDate])

  if (!isOpen) {
    return null
  }

  function updateField(name: keyof ExpenseInput, value: string) {
    setForm((current) => ({
      ...current,
      [name]: name === 'note' ? value.replace(/[\r\n]/g, ' ').slice(0, 80) : value,
    }))
  }

  function markTouched(name: keyof ExpenseInput) {
    setTouched((current) => ({ ...current, [name]: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({
      amountJpy: true,
      category: true,
      date: true,
      paymentMethod: true,
      note: true,
    })

    if (!validation.isValid) {
      return
    }

    const entry = createExpenseEntry(trip.tripId, form)
    setIsSaving(true)
    setSubmitError(null)

    saveTripEntry(entry)
      .then(() => onSaved(entry))
      .catch(() => setSubmitError('Expense could not be saved in this browser.'))
      .finally(() => setIsSaving(false))
  }

  return (
    <div className="sheet-layer" role="presentation">
      <button className="sheet-backdrop" type="button" aria-label="Close add expense form" onClick={onClose} />
      <section
        className="bottom-sheet"
        aria-labelledby="expense-sheet-title"
        aria-modal="true"
        role="dialog"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <div>
            <p className="section-kicker">Add entry</p>
            <h2 id="expense-sheet-title">New expense</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close add expense form" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="entry-type-control" aria-label="Entry type">
          <button type="button" data-active="true">
            Expense
          </button>
          <button type="button" disabled>
            Cash withdrawal
          </button>
        </div>

        <form className="expense-form" onSubmit={handleSubmit} noValidate>
          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}

          <ExpenseField error={visibleErrors.amountJpy} label="Amount (JPY)" name="amountJpy">
            <input
              id="amountJpy"
              name="amountJpy"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={form.amountJpy}
              onBlur={() => markTouched('amountJpy')}
              onChange={(event) => updateField('amountJpy', event.target.value)}
            />
          </ExpenseField>

          <ExpenseField error={visibleErrors.category} label="Category" name="category">
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
          </ExpenseField>

          <div className="form-grid">
            <ExpenseField error={visibleErrors.date} label="Date" name="date">
              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onBlur={() => markTouched('date')}
                onChange={(event) => updateField('date', event.target.value)}
              />
            </ExpenseField>

            <ExpenseField error={visibleErrors.paymentMethod} label="Payment method" name="paymentMethod">
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
            </ExpenseField>
          </div>

          <ExpenseField error={visibleErrors.note} label="Note" name="note">
            <input
              id="note"
              name="note"
              type="text"
              maxLength={80}
              value={form.note}
              onBlur={() => markTouched('note')}
              onChange={(event) => updateField('note', event.target.value)}
            />
          </ExpenseField>

          <div className="budget-preview" aria-live="polite">
            <span>Home-currency preview</span>
            <strong>{convertedAmount}</strong>
          </div>

          <button className="setup-submit" type="submit" disabled={!validation.isValid || isSaving}>
            {isSaving ? 'Saving expense...' : 'Save expense'}
          </button>
        </form>
      </section>
    </div>
  )
}

type PopulatedEntryPreviewProps = {
  entries: TripEntry[]
  trip: TripSettings
  view: Exclude<TabId, 'settings'>
}

function PopulatedEntryPreview({ entries, trip, view }: PopulatedEntryPreviewProps) {
  const expenseEntries = entries.filter((entry): entry is ExpenseEntry => entry.type === 'expense')
  const withdrawalCount = entries.length - expenseEntries.length
  const totalSpentJpy = expenseEntries.reduce((total, entry) => total + entry.amountJpy, 0)
  const recentEntries = [...entries]
    .sort(
      (first, second) =>
        second.date.localeCompare(first.date) || second.createdAt.localeCompare(first.createdAt),
    )
    .slice(0, view === 'dashboard' ? 4 : 8)

  return (
    <div className="entry-preview" aria-label="Loaded demo entry preview">
      <dl className="entry-stats">
        <div>
          <dt>Entries</dt>
          <dd>{entries.length}</dd>
        </div>
        <div>
          <dt>Expenses</dt>
          <dd>{expenseEntries.length}</dd>
        </div>
        <div>
          <dt>Withdrawals</dt>
          <dd>{withdrawalCount}</dd>
        </div>
        <div>
          <dt>Expense total</dt>
          <dd>
            {formatJpy(totalSpentJpy)}
            <span>{formatHomeCurrency(totalSpentJpy / trip.exchangeRateJpy, trip.homeCurrency)}</span>
          </dd>
        </div>
      </dl>

      <ul className="entry-list">
        {recentEntries.map((entry) => (
          <li key={entry.id}>
            <span className="entry-badge" data-entry-type={entry.type}>
              {entry.type === 'expense' ? entry.category : 'Cash withdrawal'}
            </span>
            <span className="entry-note">
              {entry.note || (entry.type === 'expense' ? `${entry.category} expense` : 'Cash withdrawal')}
            </span>
            <span className="entry-meta">
              {formatDate(entry.date)} &middot; {formatJpy(entry.amountJpy)}
            </span>
          </li>
        ))}
      </ul>
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

type ExpenseFieldProps = {
  children: ReactElement
  error?: string
  label: string
  name: keyof ExpenseInput
}

function ExpenseField({ children, error, label, name }: ExpenseFieldProps) {
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

function compareEntriesByDateThenCreated(first: TripEntry, second: TripEntry): number {
  return first.date.localeCompare(second.date) || first.createdAt.localeCompare(second.createdAt)
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
