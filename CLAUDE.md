# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SensOrg** (Sensational Organiser) is a bike rental shop management app for multi-location shops. Features: bike delivery requests, notes, recurring tasks, knowledge base. The BikeRequestList module is the core sprint; notes/tasks/KB are also live.

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

All routes live under `/api`, require JWT (except `/api/auth/login`). `req.user` = `{ id, role, shop_id }`.

| Route prefix | File | Notes |
|---|---|---|
| `/api/auth` | `routes/auth.js` | login, `/me` |
| `/api/bikes` | `routes/bikes.js` | fuzzy search, upsert |
| `/api/requests` | `routes/requests.js` | CRUD + status machine + audit log |
| `/api/shops` | `routes/shops.js` | |
| `/api/notes` | `routes/notes.js` | |
| `/api/tasks` | `routes/tasks.js` | recurring tasks with recurrence interval |
| `/api/kb` | `routes/kb.js` | knowledge base articles |
| `/api/push` | `routes/push.js` | web-push subscriptions |
| `/api/admin` | `routes/admin.js` | admin-only user/shop management |

Auth middleware: `backend/src/middleware/`. DB connection pool: `backend/src/db.js` (single `pg.Pool` from `DATABASE_URL`).

**Status machine** (`src/utils/transitions.js`): `canTransition(from, to, role)` is extracted as a named export so it can be unit-tested without Express. The `TRANSITIONS` map and all role guards live here; `routes/requests.js` imports from it.

### Database Migrations (applied order)

1. `001_initial.sql` — shops, users, bikes, requests, request_bikes, request_audit_log
2. `002_push_and_bike_location.sql` — push subscriptions, bike location field
3. `003_notes.sql`
4. `004_tasks.sql`
5. `005_task_recurrence.sql`
6. `006_task_recurrence_interval.sql`
7. `007_kb_articles.sql`

### Frontend

**API layer** (`src/api/`): Axios client in `client.js` with auth header injection. Per-resource modules: `auth.js`, `requests.js`, `bikes.js`, `shops.js`, `notes.js`, `tasks.js`, `kb.js`, `push.js`, `admin.js`.

**Hooks** (`src/hooks/`): React Query wrappers — `useRequests`, `useNotes`, `useTasks`, `useKb`, `useAdmin`, `usePush`.

**Pages:**
- `Login.jsx` — unauthenticated entry point
- `Home.jsx` — renders four accordion sections: DeliveriesSection, NotesSection, TasksSection, KbSection
- `Profile.jsx`
- `Admin/AdminPage.jsx` — tabbed panels: UsersPanel, ShopsPanel, BikesPanel (admin role only)

**Auth:** `context/AuthContext.jsx` provides `{ user, loading }`. `App.jsx` wraps routes in `ProtectedLayout` which redirects to `/login` if unauthenticated.

**Key components:**
- `DeliveriesSection` — accordion for active requests, renders `RequestCard` list
- `RequestCard` — inline editing with local draft state; Save/Cancel appear when draft ≠ original; status transitions via `ConfirmDialog`
- `BikeTagsInput` — debounced (300ms) fuzzy bike search; Enter/comma creates chip, Backspace removes last
- `AddModal` — FAB modal for creating requests/notes/tasks/kb entries
- `ConfirmDialog` — generic confirm with `{ title, message, confirmLabel, onConfirm }`
- `BottomNav` — bottom navigation with central FAB

**Color logic** (`utils/getColorByDue.js`): `done/cancelled` → gray; `≤0 days` → red; `1–2d` → yellow; `3–5d` → blue; `>5d` → green.

---

## Key Behaviours

- **Optimistic locking**: PATCH `/api/requests/:id` requires `version` in body
- **Status state machine**: `open → in_progress → done`; `any → cancelled`. Each transition requires a `ConfirmDialog`
- **Bikes are upsert-by-label** (trim, case-invariant). New labels created on request submit
- **RBAC**: `shopUser` can create/open→in_progress; `driver|mechanic` + in_progress→done; `manager` shop-wide + reopen; `admin` global + hard delete
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
