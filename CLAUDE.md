# CLAUDE.md

# Adjust eagerness up:
By default, implement changes rather than only suggesting them. If the user's intent is unclear, infer the most useful likely action and proceed, using tools to discover any missing details instead of guessing. Try to infer the user's intent about whether a tool call (e.g. file edit or read) is intended or not, and act accordingly.


# Use parallel tool calls:
If you intend to call multiple tools and there are no dependencies
between the tool calls, make all of the independent tool calls in
parallel. Prioritize calling tools simultaneously whenever the
actions can be done in parallel rather than sequentially. For
example, when reading 3 files, run 3 tool calls in parallel to read
all 3 files into context at the same time. Maximize use of parallel
tool calls where possible to increase speed and efficiency.
However, if some tool calls depend on previous calls to inform
dependent values like the parameters, do not call these tools in
parallel and instead call them sequentially. Never use placeholders
or guess missing parameters in tool calls.

# Reduce hallucinations:
Never speculate about code you have not opened. If the user
references a specific file, you MUST read the file before
answering. Make sure to investigate and read relevant files BEFORE
answering questions about the codebase. Never make any claims about
code before investigating unless you are certain of the correct
answer - give grounded and hallucination-free answers.
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Project Overview

**SensOrg** (Sensational Organiser) is a bike rental shop management app for multi-location shops (Arcos, THB, Plaza). Features: bike delivery requests, repair requests, notes, recurring tasks, knowledge base, excursions, jokes.

---

## Tech Stack

- **Frontend:** React 19 + Vite, TailwindCSS v4, Framer Motion, Lucide icons, React Query v5, Axios, Sonner (toasts)
- **Backend:** Express.js + Node.js (ESM), JWT auth, Zod validation, web-push
- **Database:** PostgreSQL, `pg_trgm` for fuzzy search, no ORM
- **Testing:** Vitest + Playwright (frontend), Jest + Supertest (backend); DB is mocked in backend tests — no live DB required

---

## Commands

```bash
# Frontend (from frontend/)
npm run dev          # Vite dev server
npm run build
npm run lint         # ESLint
npm test             # Vitest (run once)
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright E2E (starts Vite automatically)
npm run test:e2e:ui  # Playwright with interactive UI

# Backend (from backend/)
npm run dev          # nodemon src/index.js
npm run migrate      # run DB migrations (node migrate.js)
npm run seed         # run migrations then seed (node migrate.js --seed)
npm test             # Jest + Supertest (no live DB needed — pool is mocked)
```

The migration runner (`backend/migrate.js`) reads SQL files from `db/migrations/*.sql` and `db/seeds/*.sql` relative to the repo root. It tracks applied migrations in a `_migrations` table.

### Environment Variables

**`backend/.env`:**
```
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/bikeapp
JWT_SECRET=supersecretkey
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

**`frontend/.env`:**
```
VITE_API_URL=http://localhost:3000
```

---

## Architecture

### Backend

All routes live under `/api`, require JWT (except `/api/auth/login`). `req.user` = `{ id, username, roles, shop_id }`.

| Route prefix | File | Notes |
|---|---|---|
| `/api/auth` | `routes/auth.js` | login, `/me` |
| `/api/bikes` | `routes/bikes.js` | fuzzy search, upsert, inventory |
| `/api/requests` | `routes/requests.js` | CRUD + status machine + audit log |
| `/api/repair_requests` | `routes/repair_requests.js` | repair tracking; auto-created from done delivery |
| `/api/shops` | `routes/shops.js` | |
| `/api/notes` | `routes/notes.js` | notes with category + archive |
| `/api/tasks` | `routes/tasks.js` | recurring tasks with recurrence interval |
| `/api/kb` | `routes/kb.js` | knowledge base articles |
| `/api/excursions` | `routes/excursions.js` | company excursion records |
| `/api/jokes` | `routes/jokes.js` | joke collection with categories |
| `/api/push` | `routes/push.js` | web-push subscriptions |
| `/api/uploads` | `routes/uploads.js` | image upload (used by kb, excursions, jokes) |
| `/api/users` | `routes/users.js` | user profile (self-service) |
| `/api/admin` | `routes/admin.js` | admin-only user/shop management |

Auth middleware: `backend/src/middleware/auth.js` — `requireAuth`, `requireRole(...roles)`, `hasRole(user, ...roles)`. DB connection pool: `backend/src/db.js` (single `pg.Pool` from `DATABASE_URL`).

**Status machine** (`src/utils/transitions.js`): `canTransition(from, to, role)` is extracted as a named export so it can be unit-tested without Express. The `TRANSITIONS` map and all role guards live here; `routes/requests.js` imports from it.

### Database Migrations (applied order)

1. `001_initial.sql` — shops, users, bikes, requests, request_bikes, request_audit_log
2. `002_push_and_bike_location.sql` — push subscriptions, bike location field
3. `003_notes.sql`
4. `004_tasks.sql`
5. `005_task_recurrence.sql`
6. `006_task_recurrence_interval.sql`
7. `007_kb_articles.sql`
8. `008_request_note.sql` — note field on requests
9. `009_request_brm_blocked.sql` — BRM/blocked flags on requests
10. `010_user_session.sql` — session tracking
11. `011_task_completions_per_shop.sql` — per-shop task completion
12. `012_one_time_tasks.sql` — one-time (non-recurring) tasks
13. `013_notes_done_archive.sql` — `is_done`, `done_at`, `is_archived` on notes
14. `014_excursions.sql` — excursions table (company, topic, note, image_url)
15. `015_multi_role.sql` — replaces single `role` with `roles text[]`; valid roles: `admin`, `driver`, `mechanic`, `cleaner`, `organiser`, `general`
16. `016_repair_requests.sql` — repair_requests table (auto-created from done delivery)
17. `017_approval_status.sql` — approval status on requests
18. `018_image_url_kb.sql` — image_url on KB articles
19. `019_jokes.sql` — joke_categories and jokes tables
20. `020_missing_indexes.sql` — performance indexes
21. `021_repair_requests_archive.sql` — `done_at`, `is_archived` on repair_requests
22. `022_repair_requests_roadbike.sql` — `is_roadbike` flag on repair_requests
23. `023_notes_category.sql` — `category` on notes (`need_stuff` | `information` | `other`)

### Frontend

**API layer** (`src/api/`): Axios client in `client.js` with auth header injection. Per-resource modules: `auth.js`, `requests.js`, `bikes.js`, `shops.js`, `notes.js`, `tasks.js`, `kb.js`, `push.js`, `admin.js`, `repairRequests.js`, `excursions.js`, `jokes.js`.

**Hooks** (`src/hooks/`): React Query wrappers — `useRequests`, `useNotes`, `useTasks`, `useKb`, `useAdmin`, `usePush`, `useRepairRequests`, `useBikes`, `useExcursions`, `useJokes`.

**Pages:**
- `Login.jsx` — unauthenticated entry point
- `Home.jsx` — accordion sections: DeliveriesSection, RepairRequestsSection, NotesSection, TasksSection, KbSection, JokesSection
- `Bikes.jsx` — inventory view grouped by shop with active/inactive filter; admin can move/delete bikes
- `Excursions.jsx` — excursion records per shop
- `Profile.jsx`
- `Admin/AdminPage.jsx` — tabbed panels: UsersPanel, ShopsPanel, BikesPanel, ArchivePanel (admin role only)

**Auth:** `context/AuthContext.jsx` provides `{ user, loading }`. `user.roles` is a string array. `App.jsx` wraps routes in `ProtectedLayout` which redirects to `/login` if unauthenticated.

**Key components:**
- `DeliveriesSection` — accordion for active requests, renders `RequestCard` list
- `RequestCard` — inline editing with local draft state; Save/Cancel appear when draft ≠ original; status transitions via `ConfirmDialog`
- `RepairRequestsSection` — repair request list with status tracking
- `BikeTagsInput` — debounced (300ms) fuzzy bike search; Enter/comma creates chip, Backspace removes last
- `AddModal` — FAB modal for creating requests/notes/tasks/kb entries
- `ConfirmDialog` — generic confirm with `{ title, message, confirmLabel, onConfirm }`
- `BottomNav` — bottom navigation with central FAB
- `ImageUploader` — shared image upload component (used by KB, excursions, jokes)

**Utilities:**
- `utils/getColorByDue.js` — `done/cancelled` → gray; `≤0 days` → red; `1–2d` → yellow; `3–5d` → blue; `>5d` → green
- `utils/shopColors.js` — fixed `SHOP_META` array (Arcos/THB/Plaza) with brand colors; `getShopMeta(name)` / `getShopMetaById(id)`
- `utils/formatDate.js` — `formatDate(iso)` → "29 Mar 2026"; `formatDateTime(iso)` → "29 Mar 2026, 11:41"
- `utils/noteCategories.js` — `NOTE_CATEGORIES` array and `categoryMeta(value)` for note category badges
- `utils/recurrence.js` — recurrence interval helpers for tasks

---

## Key Behaviours

- **Optimistic locking**: PATCH `/api/requests/:id` requires `version` in body
- **Status state machine**: `open → in_progress → done`; `any → cancelled`. Each transition requires a `ConfirmDialog`
- **Bikes are upsert-by-label** (trim, case-invariant). New labels created on request submit
- **RBAC**: roles are now a multi-value array (`roles text[]`). Valid roles: `admin`, `driver`, `mechanic`, `cleaner`, `organiser`, `general`. Use `hasRole(user, ...roles)` from `middleware/auth.js` for checks. `general` ≈ old `shopUser`; `organiser` ≈ old `manager`.
- **Requests default filter**: `status=active` (open + in_progress), scoped to user's shop; admin/manager can override with `?shop=`

---

## Testing

| Suite | Runner | File(s) | Coverage |
|---|---|---|---|
| `canTransition` unit | Jest | `backend/src/__tests__/transitions.test.js` | All valid transitions, role denials, invalid state-machine jumps, edge cases (26 tests) |
| Status endpoint integration | Jest + Supertest | `backend/src/__tests__/requests.status.test.js` | 401/403/404/400 + happy paths for shopUser/driver/manager (8 tests); pool mocked via `jest.unstable_mockModule` |
| Bikes suggest integration | Jest + Supertest | `backend/src/__tests__/bikes.suggest.test.js` | GET empty/query/trim/no-match, POST upsert/uppercase/trim/notes/validation (12 tests); pool mocked |
| `getColorByDue` unit | Vitest | `frontend/src/utils/getColorByDue.test.js` | All boundary values (≤0, 1–2, 3–5, >5 days), done/cancelled override, return shape (15 tests) |
| E2E (Playwright) | Playwright | `frontend/e2e/app.spec.js` | Login, home sections, create delivery, inline edit, 409 conflict, status transitions, delete (21 tests); all API calls mocked via `page.route()` |

**Backend test pattern** — ESM modules require `jest.unstable_mockModule` called *before* any dynamic `import()` of the module under test. The test script uses `node --experimental-vm-modules node_modules/jest/bin/jest.js` (not the `.bin/jest` shim, which is a bash script that breaks on Windows).

**E2E pattern** — `VITE_API_URL=http://localhost:3000` means the app makes requests to port 3000. Route mocks must use the full `http://localhost:3000/api/…*` pattern — **not** `**/api/…**` glob, which accidentally matches Vite's module-server paths like `/src/api/requests.js` and breaks the app. Vite must be running (`npm run dev`) before E2E tests; `playwright.config.js` starts it automatically via `webServer`.

---

## Commit Convention

Prefix: `db:`, `api:`, `ui:`, `feat:`, `fix:`, `test:`
