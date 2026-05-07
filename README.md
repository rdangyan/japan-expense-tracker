# Japan Expense Tracker

Japan Expense Tracker is a mobile-first PWA for tracking spending during a Japan trip. It stores one active trip locally, works offline after the first visit, treats JPY as the primary expense currency, and keeps the traveler's home-currency budget visible for pacing decisions.

The app is intentionally frontend-only: no accounts, backend, cloud sync, live exchange-rate calls, or receipt storage. It is built to be practical for travel and readable as a portfolio project.

## Product Highlights

- First-run trip setup with trip dates, home currency, total budget, and manual exchange rate.
- Deterministic `Japan Spring Trip` demo data for quick review.
- Expense and cash withdrawal entry with edit and delete flows.
- Cash withdrawals appear in history and CSV export but are excluded from spending totals.
- Dashboard analytics for total spend, remaining budget, daily pacing, category breakdown, and recent activity.
- Search, filters, sorting, contextual totals, and complete CSV export.
- Local IndexedDB persistence with PWA app-shell caching.
- Light and dark system theme support.

## Demo Path

1. Run the app locally with `npm run dev`.
2. Open the local Vite URL in a browser.
3. Choose `Load demo trip` from the first-run setup screen.
4. Review the Dashboard for budget pace, category totals, and recent activity.
5. Open Expenses to search, filter, sort, edit, delete, add entries, and export CSV.
6. Open Settings to adjust trip details or reset local trip data.
7. Build or preview the production bundle to inspect PWA install/offline behavior.

The demo trip is `Japan Spring Trip`, April 6-15, 2026, with a `3500 CAD` budget and `1 CAD = 110 JPY`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Run unit tests:

```bash
npm run test
```

Build the production app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Testing

Vitest covers the core domain modules first: trip setup validation, currency conversion, budget analytics, filtering/sorting behavior, CSV generation, and deterministic demo data.

The UI keeps calculations and persistence boundaries separated so component and end-to-end tests can be added later without reworking the product logic.

## PWA Behavior

The app uses `vite-plugin-pwa` to generate a web app manifest and service worker during production builds. The service worker caches the app shell so the interface can load offline after the first visit. Trip settings and entries are stored in the browser through IndexedDB and remain local to that browser.

PWA icons live in `public/`, including standard, maskable, and Apple touch variants.

## Tech Stack

- React 19
- TypeScript
- Vite
- Vitest
- ESLint
- `vite-plugin-pwa`
- IndexedDB through a small local persistence adapter
