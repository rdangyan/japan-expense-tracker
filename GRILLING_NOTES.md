# Grilling Notes

## Status

The grilling session is paused. Do not write implementation code until grilling resumes, the remaining questions are resolved, and the user explicitly asks to proceed with implementation.

## Project Context

- Project: Japan Trip Expense Tracker with Analytics.
- Intended app: mobile-first, installable PWA, offline-capable, portfolio-quality, useful for tracking travel spending in Japan.
- Preferred v1 architecture: React, TypeScript, Vite, no backend unless strongly justified.
- Product posture: polished and shippable for a new-grad portfolio, without over-engineering.

## Codebase Findings

- The repo is a React 19 + TypeScript + Vite app.
- Tailwind CSS is installed.
- Current `package.json` scripts are `dev`, `build`, `lint`, and `preview`.
- No test runner is configured yet.
- No router, backend, persistence layer, PWA setup, or domain modules exist yet.
- Current UI is still mostly the Vite starter screen using Vite/React assets.
- `src/components/SkillCreator.tsx` exists but is unrelated and unused.
- Current styling uses `src/index.css` and `src/App.css`.
- `zod` exists transitively in `node_modules`, but is not a direct dependency in `package.json`.

## Decisions Made So Far

### Product Scope

- v1 includes manual expense entry plus trip budget and daily spend target.
- v1 supports one active trip only.
- v1 is offline-first and should not include a backend.
- First run shows a focused trip setup screen before the main app.
- First-run setup includes a "Load demo trip" action.
- Demo trip data writes into the normal local database after confirmation.
- No onboarding carousel; use minimal contextual empty-state/help copy only.
- Include polished empty states with clear "Add expense" actions.
- No local notifications or reminders in v1.
- No recurring expenses in v1.
- No split expenses in v1.
- No tax-included/tax-excluded tracking; users enter final paid amount only.
- No separate merchant/place field; use the note field for that context.

### Trip Setup And Settings

- Trip setup requires trip name, start date, end date, total budget in home currency, and exchange rate.
- The user enters budget in home currency because that is what makes the most sense to them.
- Budget analytics convert the home-currency budget to JPY for comparison against JPY expenses.
- Home currency presets are USD, CAD, EUR, GBP, AUD, plus custom.
- Custom home currency must be a 3-letter uppercase currency code.
- Display currency codes everywhere, including `JPY`, `CAD`, and `USD`.
- Exchange rate is entered as `1 home currency = X JPY`.
- Exchange rate can be edited later.
- All home-currency summaries use the current trip exchange rate.
- Settings can edit trip name, dates, total budget, home currency, exchange rate, and reset/delete trip data.
- Settings edits update derived analytics immediately, including historical status.
- Destructive actions require confirmation; normal settings edits do not need warnings.
- Deleting/resetting trip data uses a simple confirmation dialog.
- If trip dates change and existing entries fall outside the new range, allow it and flag those entries as outside trip dates.
- Entries outside trip dates remain in total spending but are excluded from daily pacing calculations.
- Expenses outside trip dates are allowed with a non-blocking warning.

### Currency And Amounts

- Expenses are entered in JPY.
- Home-currency display is based on the configured exchange rate.
- JPY amounts are whole yen only.
- Home-currency budget accepts decimals.
- Converted home-currency display amounts round to 2 decimals.
- Dashboard key totals show JPY primary and home currency secondary.
- Trip budget card shows home currency primary and JPY secondary.

### Entry Types And Fields

- v1 distinguishes entry type from category.
- Entry type is `expense` or `cashWithdrawal`.
- Categories apply only to expense entries.
- Fixed expense categories are food, transit, lodging, shopping, attractions, convenience stores, and other.
- Cash withdrawals are not an expense category.
- Expense entry requires amount, category, and date.
- Expense note is optional.
- Expense payment method is optional.
- Payment method options are cash, card, IC card, other, or blank.
- Cash withdrawal entry requires amount JPY and date.
- Cash withdrawal note is optional.
- Cash withdrawals are visible in history but excluded from spending totals.
- ATM fees should be logged as separate expenses, likely category `other`.
- Notes are short single-line memos.
- Notes are limited to 80 characters.
- Date is user-visible; time is not user-visible.
- Expenses default to today in Japan Standard Time.
- Internal creation time is stored for stable ordering.
- `createdAt` is immutable after creation.
- Entries also store `updatedAt` when edited.
- `updatedAt` appears in CSV export only, not in the mobile UI.
- Internal timestamps are stored as UTC ISO strings.

### Expense Management

- Users can edit and delete expenses.
- Deleting an individual entry uses a simple confirmation dialog.
- No swipe gestures in v1.
- Entry list items use an overflow menu for edit/delete actions.
- No separate entry detail view; edit bottom sheet is enough.
- Dashboard recent activity is read-only; users go to Expenses to edit/delete.
- Add Entry uses a prominent floating action button available from Dashboard and Expenses.
- Add/Edit Entry uses a mobile-optimized bottom sheet.
- The add-entry bottom sheet uses a segmented control for Expense vs Cash withdrawal.

### Lists, Filters, And Search

- Expenses and cash withdrawals appear in one chronological entry list with visual badges for entry type.
- Expense list supports search, category filter, payment method filter, date range filter, and sorting by newest, oldest, or amount.
- Filters include entry type: all, expenses, cash withdrawals.
- Payment method filter applies only to expense entries and excludes cash withdrawals while active.
- Search matches notes, category labels, entry type labels, and payment method labels.
- Expenses tab shows filtered total and entry count above the list.
- Filtered total always means spending total and excludes cash withdrawals.
- When entry type filter is cash withdrawals, the Expenses tab shows withdrawal total.

### Dashboard And Analytics

- Dashboard shows total spent, remaining budget, daily average, daily target, days left, category breakdown, and a simple spending-over-time chart.
- Dashboard also shows recent activity with latest entries.
- Recent activity includes all entry types with badges.
- Dashboard does not show total withdrawn cash.
- Daily target shows both original daily budget and current remaining daily allowance.
- Dashboard uses visual budget status only: on track, caution, and over budget.
- Budget status compares actual spend to expected spend by today:
  - on track: under 90%
  - caution: 90-110%
  - over budget: above 110%
- Primary dashboard chart shows cumulative spending over trip days versus expected budget pace.
- Category breakdown uses horizontal bars with category totals and percentage of spending.
- Category analytics include only `expense` entries and exclude cash withdrawals.
- All spending totals exclude cash withdrawal entries by default.
- Dashboard includes trip progress as days elapsed / total days with a simple progress bar.
- Trip pacing uses Japan Standard Time for "today."

### CSV Export

- v1 includes CSV export only; no JSON import/restore.
- CSV export includes all entries, including cash withdrawals.
- Cash withdrawal rows are marked as excluded from spending totals.
- CSV export includes derived home-currency amount at the current exchange rate.
- CSV export includes user-entered date and internal created-at timestamp.
- CSV export includes `updatedAt`.
- CSV export includes home currency and exchange rate as columns on each row.
- CSV export includes a stable entry ID for each row.
- CSV export includes trip ID and trip name on each row.
- Exported rows are sorted by user-entered date ascending, then `createdAt` ascending.
- CSV export always exports all entries, regardless of current filters/search.
- No "last exported" timestamp in v1.

### PWA And Offline

- v1 PWA behavior is installable app shell only, loading offline after first visit with IndexedDB data available.
- Use `vite-plugin-pwa` for manifest and service worker generation.
- Show a subtle install card when PWA install is available.

### Navigation And Layout

- Mobile navigation uses bottom tabs for Dashboard, Expenses, and Settings.
- No client-side router; use local React state for tabs.
- Desktop/tablet keeps the same mobile-first tabbed experience, expanded modestly for larger screens.

### Visual Design

- Visual direction is a quiet travel utility with clean mobile UI and subtle Japan-inspired accents.
- Use hybrid styling: global CSS tokens plus Tailwind utilities for layout and spacing.
- Respect system dark mode automatically; no manual theme toggle.

### Dependencies And UI Primitives

- Use simple custom SVG charts rather than a chart library.
- Add `lucide-react` for common UI icons.
- Use a headless component library for dialogs, menus, and sheets.
- Use Radix UI primitives.
- Include `@radix-ui/react-dialog` and `@radix-ui/react-dropdown-menu` only.
- Build tabs and segmented controls without Radix tabs.
- No full component library.

### Forms, Validation, And Domain Logic

- Forms use controlled React state plus shared validation helpers, no form library.
- Add `zod` as a direct dependency.
- Use Zod for trip, entry, settings, and CSV validation helpers.
- Centralize validation schemas and derived TypeScript types in the domain layer.
- Use discriminated unions on `type` for `expense` and `cashWithdrawal` entries.
- Setup and expense forms show inline field-level validation messages and disable submit until valid.

### Persistence And State

- Use IndexedDB for offline trip and expense storage.
- Use `idb` as the IndexedDB helper library.
- Use local React state with custom hooks/context; no external state library.
- IndexedDB should use a basic versioned schema with a clear upgrade path, but no complex migration UI.
- IndexedDB uses separate stores for trip settings and entries.
- Trip settings store uses a fixed key like `activeTrip`.
- The trip object contains its generated `tripId`.
- Entry IDs use `crypto.randomUUID()`.
- The active trip has a stable trip ID generated with `crypto.randomUUID()`.

### Testing

- Use Vitest for unit tests.
- v1 should include unit tests for pure calculation/storage modules.
- Component tests are deferred as a possible later enhancement.
- Extract and test budget analytics, currency conversion, expense filtering/sorting, CSV export, persistence adapter, form validation, and demo data generation.
- Good tests should cover external behavior, not implementation details.

### Repo Cleanup

- Remove the unused `SkillCreator` component during implementation.
- Fully replace Vite starter UI and remove unused starter assets.

## User Preferences

- Favor v1 choices that produce a polished, shippable new-grad portfolio project.
- Avoid over-engineering.
- Prefer offline-first local data over backend complexity.
- Prefer mobile-first UX.
- Prefer simple but robust abstractions that make logic testable.
- Prefer JPY as the primary expense currency and home currency as helpful context.
- Prefer user-controlled exchange rates instead of live exchange-rate APIs.
- Prefer clear, predictable UI over hidden gestures or advanced flows.
- Prefer portfolio polish: empty states, demo data, PWA installability, accessible dialogs, and clean repo removal of starter artifacts.

## Recommendations Made

- Keep v1 focused on one active Japan trip.
- Use IndexedDB with `idb`.
- Use `vite-plugin-pwa`.
- Use custom SVG charts rather than a chart library.
- Use Radix only for interactions where accessibility details matter most.
- Use `lucide-react` for icons.
- Use Zod schemas as the shared source of truth for validation and types.
- Keep forms controlled and explicit rather than adding React Hook Form.
- Keep state local in React via hooks/context.
- Use deep domain modules for analytics, conversion, filtering/sorting, CSV export, persistence, validation, and demo data.
- Use a clean discriminated-union data model for entries.

## Assumptions

- v1 has no backend and no account system.
- v1 has no cloud sync, import/restore, OCR, receipt photos, or live exchange-rate API.
- The app UI language is English.
- Date and currency formatting should feel Japan-trip-aware without a full i18n architecture.
- The app is for a single traveler or single shared trip budget, not group expense splitting.
- Cash withdrawals are historical entries, not spend, and there is no cash balance ledger in v1.
- The user will resume grilling before implementation begins.
- The final implementation brief has not yet been produced.

## Current Branch Of Questioning

The current branch is technical data modeling and IndexedDB persistence.

The immediately previous resolved decision was:

- Trip settings store uses a fixed key like `activeTrip`, while the trip object contains its generated `tripId`.

The active unresolved question was about whether entries should include and index `tripId` despite v1 only supporting one active trip.

## Unanswered Questions

- Should entries be indexed by trip ID in IndexedDB even though v1 has one active trip?
- What additional IndexedDB indexes are needed for efficient v1 queries?
- What exact object store schema/version should v1 use?
- What should the implementation module boundaries and folder structure be?
- Which modules should get tests first if time is constrained?
- What exact app title/name should appear in the UI and PWA manifest?
- What PWA theme color and icon strategy should be used?
- What demo trip dates, budget, exchange rate, and sample entries should demo data use?
- What exact category labels and colors should be used?
- What exact budget status colors and labels should be used?
- What should the implementation sequence be?

## Exact Next Question To Ask On Resume

Question: Should entries be indexed by trip ID in IndexedDB even though v1 has one active trip?

Options:
- A: Yes, include `tripId` on entries and index it.
- B: Include `tripId` but no index.
- C: No trip ID on entries.

Recommendation: Choose A. It costs little and creates a clean future path for multi-trip support, export, and filtering.
