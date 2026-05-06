import { useState } from 'react'
import './App.css'

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
    title: 'Trip details have not been configured.',
    body: 'A future setup step will store trip dates, home currency, budget, and exchange rate locally for offline use.',
    action: 'Setup coming soon',
  },
} satisfies Record<TabId, { eyebrow: string; title: string; body: string; action: string }>

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const emptyState = emptyStates[activeTab]

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
            disabled
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
            <p className="section-kicker">Japan Spring Trip</p>
            <h1 id="overview-title">TBD.</h1>
          </div>
          <p>
            TBD
          </p>
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
                disabled
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
            <h3>{emptyState.title}</h3>
            <p>{emptyState.body}</p>
            <button className="secondary-action" type="button" disabled>
              {emptyState.action}
            </button>
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
    </div>
  )
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
