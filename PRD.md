# Japan Expense Tracker PRD

## Product Summary

Japan Expense Tracker is a mobile-first, installable PWA for tracking travel spending during a Japan trip. The app supports one active trip, offline-first expense entry, budget pacing, lightweight analytics, CSV export, and realistic demo data. It should feel polished enough for a new-grad portfolio while staying practical, focused, and intentionally not over-engineered.

## Target User

The primary user is an international traveler visiting Japan who wants to understand their spending without relying on cloud sync, accounts, or live financial integrations. They likely think about their trip budget in a home currency such as CAD or USD, but pay day-to-day expenses in JPY.

The secondary audience is recruiters, hiring managers, and technical reviewers evaluating the project as a portfolio app. The product should demonstrate sound product judgment, clean UX, offline-capable architecture, tested domain logic, and careful handling of edge cases.

## Problem Statement

Travelers in Japan often spend in yen while mentally budgeting in their home currency. Generic notes apps and spreadsheets are cumbersome on mobile, and many finance apps are too heavy for short-term trip tracking. Travelers need a fast offline tool that makes it easy to record expenses, see whether they are pacing against their trip budget, and export the history later.

## Goals

- Make it fast to set up one Japan trip and start tracking expenses.
- Let users enter JPY expenses and cash withdrawals while preserving home-currency context.
- Provide clear budget pacing: total spent, remaining budget, daily average, daily target, days left, and visual status.
- Support useful analytics: cumulative spending over time, category breakdown, recent activity, and filtered totals.
- Work offline after first visit using local IndexedDB data.
- Provide deterministic demo data so reviewers can immediately see the full experience.
- Keep the app mobile-first, accessible, polished, and portfolio-ready.
- Keep the technical design simple, testable, and appropriate for a frontend-only v1.

## Non-Goals

- No backend, accounts, login, or cloud sync.
- No multi-trip management UI.
- No receipt scanning, OCR, or receipt photo storage.
- No live exchange-rate API.
- No JSON import or restore flow.
- No group splitting, shared balances, or settlement flows.
- No recurring expenses.
- No local notifications or reminders.
- No cash balance ledger.
- No tax-included versus tax-excluded tracking.
- No separate merchant or place field; short notes carry that context.

## V1 Scope

V1 includes a single active Japan trip with manual expense entry, cash withdrawal logging, trip budget settings, analytics, filtering, CSV export, demo data, and PWA installability.

Trip setup must collect trip name, start date, end date, home currency, total budget in home currency, and exchange rate entered as `1 home currency = X JPY`. The app should support presets for USD, CAD, EUR, GBP, and AUD, plus a custom three-letter uppercase currency code.

Expenses are entered in whole JPY amounts. Expense entries require amount, category, and date. Notes and payment method are optional. Payment method options are cash, card, IC card, other, or blank. Notes are single-line memos limited to 80 characters.

Cash withdrawals are a separate entry type, not an expense category. Cash withdrawal entries require amount JPY and date, may include an optional note, appear in history and CSV export, and are excluded from spending totals.

Users can edit and delete entries. Add and edit interactions should use a mobile-optimized bottom sheet. Delete actions and full trip reset/delete actions require confirmation.

The main navigation uses bottom tabs for Dashboard, Expenses, and Settings. Desktop and tablet layouts should preserve the same mobile-first structure while making modest use of the larger screen.

## User Stories

1. As a traveler, I want to set up my trip before seeing the main app, so that my budget analytics are meaningful immediately.
2. As a traveler, I want to enter my budget in my home currency, so that the budget matches how I think about trip spending.
3. As a traveler, I want to enter the exchange rate manually, so that I can use the rate I actually care about.
4. As a traveler, I want all expenses entered in JPY, so that entry matches the currency I see while traveling.
5. As a traveler, I want to see JPY as the primary expense currency and home currency as secondary context, so that I can understand both local and personal budget impact.
6. As a traveler, I want to add expenses quickly from the Dashboard or Expenses tab, so that I can log spending in the moment.
7. As a traveler, I want to categorize expenses, so that I can understand where my money is going.
8. As a traveler, I want to optionally record payment method, so that I can later distinguish cash, card, IC card, and other spending.
9. As a traveler, I want to add a short note, so that I can remember context such as a merchant, place, or meal.
10. As a traveler, I want to log ATM cash withdrawals separately from expenses, so that my history is complete without overstating spending.
11. As a traveler, I want ATM fees logged as normal expenses, so that fees count against my budget.
12. As a traveler, I want to edit mistakes, so that my trip history stays accurate.
13. As a traveler, I want confirmation before deleting entries or trip data, so that I do not lose data accidentally.
14. As a traveler, I want to search and filter entries, so that I can find specific spending quickly.
15. As a traveler, I want to filter by category, payment method, date range, and entry type, so that I can answer practical questions about my trip.
16. As a traveler, I want sorting by newest, oldest, and amount, so that I can inspect my history in useful ways.
17. As a traveler, I want filtered totals and counts, so that I can understand the current result set.
18. As a traveler, I want dashboard totals, remaining budget, daily average, and daily target, so that I can quickly judge whether my trip spending is healthy.
19. As a traveler, I want budget status labels, so that I can understand pacing without doing math.
20. As a traveler, I want a cumulative spending chart versus expected budget pace, so that I can see whether spending is accelerating.
21. As a traveler, I want a category breakdown, so that I can identify major spending areas.
22. As a traveler, I want recent activity on the dashboard, so that I can verify my latest entries at a glance.
23. As a traveler, I want settings to edit trip details and exchange rate, so that the app can adapt as my plans change.
24. As a traveler, I want exchange-rate edits to update derived summaries, so that the app remains internally consistent.
25. As a traveler, I want entries outside trip dates allowed but flagged, so that real-world edge cases do not block entry.
26. As a traveler, I want offline access after first visit, so that the app works while traveling without reliable connectivity.
27. As a traveler, I want CSV export, so that I can keep or analyze my trip history later.
28. As a reviewer, I want a loadable demo trip, so that I can evaluate the app quickly without manual setup.
29. As a reviewer, I want realistic demo data, so that analytics, filters, charts, and empty states are meaningfully exercised.
30. As a reviewer, I want the app to show thoughtful UX and technical choices, so that the project demonstrates production-oriented frontend judgment.

## Core User Flows

### First Run Setup

The user opens the app for the first time and sees a focused setup screen. They enter trip name, date range, home currency, total budget, and exchange rate. They can alternatively load the demo trip after confirming that demo data will populate the normal local database. After setup, they land in the main tabbed app.

### Add Expense

The user taps the prominent add action from Dashboard or Expenses. A bottom sheet opens with a segmented control for Expense versus Cash withdrawal. For an expense, the user enters whole-yen amount, category, date, optional payment method, and optional note. The form shows inline validation and disables submission until valid. On save, the entry appears in history and updates analytics immediately.

### Add Cash Withdrawal

The user opens the add bottom sheet, selects Cash withdrawal, enters amount JPY, date, and optional note, then saves. The withdrawal appears in history with a distinct badge and is included in CSV export, but does not affect spending totals, category analytics, or budget pacing.

### Browse And Filter Entries

The user opens the Expenses tab to see expenses and cash withdrawals in one chronological list. They can search notes, category labels, entry type labels, and payment method labels. They can filter by entry type, category, payment method, and date range, and sort by newest, oldest, or amount. The tab displays a filtered count and relevant total above the list.

### Edit Or Delete Entry

The user opens an entry overflow menu and chooses edit or delete. Edit opens the same bottom sheet pattern with existing values loaded. Delete uses a simple confirmation dialog. Dashboard recent activity remains read-only; editing and deleting happen from the Expenses tab.

### Review Dashboard

The user opens Dashboard to see total spent, remaining budget, daily average, original daily budget, current remaining daily allowance, days left, trip progress, spending status, cumulative spending chart, category breakdown, and recent activity.

### Update Settings

The user opens Settings to edit trip name, dates, home currency, budget, and exchange rate. Normal settings edits apply immediately without warning. Reset/delete actions require confirmation. If edited dates exclude existing entries, those entries remain in totals and history but are flagged and excluded from pacing calculations.

### Export CSV

The user exports all entries regardless of current filters. The CSV includes expenses and cash withdrawals, marks withdrawals as excluded from spending totals, includes trip metadata, currency metadata, the current derived home-currency amount, stable entry IDs, user-entered date, creation timestamp, and update timestamp.

## Data Model

The app stores one active trip locally. Trip settings use a fixed active-trip key and contain a generated stable trip ID.

Trip settings include:

- Trip ID
- Trip name
- Start date
- End date
- Home currency code
- Total budget in home currency
- Exchange rate expressed as `1 home currency = X JPY`
- Creation and update timestamps as needed for persistence consistency

Entries are discriminated by type: `expense` or `cashWithdrawal`.

Shared entry fields include:

- Stable entry ID
- Trip ID
- Entry type
- User-visible date
- Amount in whole JPY
- Optional note
- Immutable creation timestamp stored as a UTC ISO string
- Update timestamp stored as a UTC ISO string when edited

Expense entries additionally include:

- Category
- Optional payment method

Cash withdrawal entries do not include category or payment method and are excluded from spending totals.

Fixed expense categories are:

- Food
- Transit
- Lodging
- Shopping
- Attractions
- Convenience stores
- Other

IndexedDB v1 uses separate stores for trip settings and entries. Entries are keyed by stable ID and indexed by trip ID, user-entered date, and creation timestamp. Additional filtering and sorting happen in application logic for v1.

## Analytics Requirements

Dashboard analytics must exclude cash withdrawals from spending totals unless specifically presenting withdrawal totals in filtered entry contexts.

Required dashboard metrics:

- Total spent
- Remaining budget
- Daily average
- Original daily budget
- Current remaining daily allowance
- Days left
- Trip progress as days elapsed over total days
- Budget status
- Category breakdown
- Cumulative spending over trip days versus expected budget pace
- Recent activity

Budget status compares actual spend against expected spend by the current Japan Standard Time date:

- On track: under 90% of expected spend
- Caution: 90% to 110% of expected spend
- Over budget: above 110% of expected spend

Dashboard key totals show JPY primary and home currency secondary. The trip budget card shows home currency primary and JPY secondary. Converted home-currency display amounts round to two decimals.

Category analytics include only expense entries. Entries outside the trip date range remain in total spending but are excluded from daily pacing calculations. Trip pacing and default expense dates use Japan Standard Time.

## PWA And Offline Requirements

The app must be installable as a PWA with an app shell that loads offline after the first visit. User data must remain available offline through IndexedDB.

PWA requirements:

- App name: Japan Expense Tracker
- Warm red accent theme color inspired by Japan travel
- Custom app icons using a simple yen/travel motif
- Generated service worker and manifest
- Subtle install card when browser install prompt is available
- No backend dependency for core functionality
- No live network dependency for exchange rates or analytics

Offline behavior should prioritize reliability and clarity. If the app loads after first visit, trip settings and entries should be available from local storage. The app should not imply cloud backup or sync.

## UX Requirements

The visual direction is a quiet travel utility with clean mobile UI and subtle Japan-inspired accents. The app should feel practical, polished, and calm rather than like a marketing landing page.

Required UX characteristics:

- Mobile-first layout
- Bottom tab navigation for Dashboard, Expenses, and Settings
- Prominent floating add action on Dashboard and Expenses
- Mobile-optimized bottom sheets for add/edit entry
- Segmented control for Expense versus Cash withdrawal
- Overflow menu for entry edit/delete actions
- Clear visual badges for entry types
- Polished empty states with direct add actions
- Minimal contextual help copy only where useful
- No onboarding carousel
- No swipe gestures in v1
- System dark mode support with no manual theme toggle
- Display currency codes everywhere, including JPY, CAD, and USD
- Use balanced category colors rather than a one-hue chart palette
- Budget statuses use green for On track, amber for Caution, and red for Over budget
- Charts use simple custom SVG rather than a charting library
- Desktop and tablet layouts modestly expand the mobile-first experience without becoming a separate desktop product

The deterministic demo trip is `Japan Spring Trip`, April 6-15, 2026, with a 3500 CAD budget and exchange rate of `1 CAD = 110 JPY`. It should include about 25 varied sample entries across categories, payment methods, cities, and dates so reviewers can see realistic analytics and filtering behavior.

## Accessibility Requirements

The app should use accessible primitives for dialogs, dropdown menus, and bottom-sheet style interactions where focus management and keyboard behavior matter.

Accessibility requirements:

- Forms use visible labels and inline field-level validation messages.
- Submit actions are disabled until required fields are valid.
- Dialogs and destructive confirmations are keyboard accessible and manage focus correctly.
- Menus are keyboard accessible and announce item labels clearly.
- Icon buttons include accessible names.
- Color is not the only way to communicate entry type, budget status, validation, or destructive actions.
- Text contrast must be readable in light and dark system themes.
- Touch targets should be comfortable on mobile.
- Layout must avoid overlapping or clipped text across mobile and desktop sizes.
- Charts should be accompanied by textual values so the information is not available only visually.

## Testing Requirements

Use Vitest for unit tests. Prioritize pure domain logic first because it carries the most business behavior, is stable, and gives the strongest engineering signal for a portfolio project.

Good tests should verify external behavior and user-visible outcomes, not implementation details.

Modules and behavior to test first:

- Budget analytics and pacing calculations
- Currency conversion and rounding
- Expense filtering and sorting
- CSV export row generation and ordering
- Validation schemas for trip setup, settings, expenses, cash withdrawals, and CSV data
- Demo data generation
- Persistence adapter behavior where practical

Component tests are deferred as a possible later enhancement. The initial testing strategy should still leave UI behavior easier to test later by keeping calculations, validation, filtering, export, and storage behavior in isolated modules.

## Edge Cases

- Expenses outside trip dates are allowed with a non-blocking warning.
- Entries outside trip dates remain in total spending but are excluded from daily pacing.
- Trip date edits may cause existing entries to fall outside the new date range.
- Cash withdrawals appear in history and CSV but are excluded from spending totals and category analytics.
- When the entry type filter is Cash withdrawals, the Expenses tab shows withdrawal total instead of spending total.
- Payment method filter applies only to expense entries and excludes cash withdrawals while active.
- Search must match notes, category labels, entry type labels, and payment method labels.
- Exchange-rate edits update all derived home-currency summaries immediately, including historical entries.
- Home-currency budget accepts decimals; JPY entry amounts are whole yen only.
- Custom home currency must be a three-letter uppercase code.
- Created timestamps are immutable after entry creation.
- Updated timestamps appear in CSV export but not in the mobile UI.
- Export always includes all entries regardless of filters or search.
- Export sorting is by user-entered date ascending, then creation timestamp ascending.
- Deleting/resetting trip data must require confirmation.
- Demo data writes into the normal local database after confirmation.
- The app should behave predictably when no entries exist, when only withdrawals exist, or when all visible results are filtered out.

## Success Criteria

- A first-time user can set up a trip or load demo data and understand the main app without onboarding.
- A traveler can add an expense in under a minute on mobile.
- Dashboard metrics update immediately after adding, editing, deleting, or changing trip settings.
- Spending totals correctly exclude cash withdrawals.
- Entries outside trip dates are handled consistently and visibly.
- CSV export contains complete trip and entry data in stable order.
- The app loads offline after first visit with local data available.
- The installed PWA has a distinct name, theme color, and icon.
- The UI looks polished in both mobile and larger viewports.
- Core domain behavior is covered by focused unit tests.
- The repo no longer feels like a starter template after implementation.
- A portfolio reviewer can load the demo trip and quickly see meaningful product, UX, and engineering decisions.

## Future Improvements

- Multi-trip support.
- Optional JSON import and restore.
- Cloud sync or account-based backup.
- Live exchange-rate lookup with manual override.
- Receipt photo attachment or OCR.
- Cash balance tracking.
- Group splitting and settlement.
- Recurring expenses.
- Local reminders.
- More advanced analytics, such as merchant summaries or weekly comparisons.
- Component and end-to-end tests.
- Optional localization beyond English.
- More configurable categories and payment methods.
