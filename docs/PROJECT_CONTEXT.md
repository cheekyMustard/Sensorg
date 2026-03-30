# SensOrg — Project Context & Current State

Last updated: 2026-03-30

---

## What Is This App?

**SensOrg** (Sensational Organiser) is a bike rental shop management app built for a multi-location operation. It is a mobile-first PWA running in the browser. Staff log in on their phones and use it throughout their workday.

**Live deployment:** `https://sensorg.fly.dev` (Fly.io, region: Frankfurt)
**Fly app name:** `sensorg`
**Fly Postgres app name:** `sensorg-db` (or check with `fly postgres list`)
**Primary region:** `fra`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite, TailwindCSS v4, Framer Motion, Lucide icons, React Query v5, Axios, Sonner toasts |
| Backend | Express.js (ESM), JWT auth, Zod validation, web-push |
| Database | PostgreSQL, `pg_trgm` fuzzy search, no ORM |
| File uploads | multer, magic-byte validation, served as static `/uploads/` |
| Testing | Vitest + Playwright (frontend), Jest + Supertest (backend) |
| Deploy | Fly.io — migrations run automatically on deploy via `release_command` |

---

## Roles

| Role | What they can do |
|---|---|
| `admin` | Everything — global scope, hard deletes, approve/reject, switch shops |
| `organiser` | Approve/reject tasks & excursions, switch shops |
| `manager` | Shop-wide requests, reopen deliveries |
| `driver` | Mark deliveries in_progress → done |
| `mechanic` | Take and complete repair jobs |
| `cleaner` | Basic access |
| `general` | Create excursions (goes to pending), basic access |
| `shopUser` | Create and open→in_progress deliveries |

Multiple roles per user are supported (stored as `text[]` in `users.roles`).

---

## Database Migrations (in order)

| # | File | What it adds |
|---|---|---|
| 001 | `001_initial.sql` | shops, users, bikes, requests, request_bikes, request_audit_log |
| 002 | `002_push_and_bike_location.sql` | push_subscriptions, bikes.current_location |
| 003 | `003_notes.sql` | notes table |
| 004 | `004_tasks.sql` | tasks table |
| 005 | `005_task_recurrence.sql` | tasks.recurrence |
| 006 | `006_task_recurrence_interval.sql` | tasks.recurrence_interval |
| 007 | `007_kb_articles.sql` | kb_articles table |
| 008 | `008_request_note.sql` | requests.note field |
| 009 | `009_request_brm_blocked.sql` | requests.brm_blocked (BRM checkbox on profile) |
| 010 | `010_user_session.sql` | users.last_seen_at (who's working today) |
| 011 | `011_task_completions_per_shop.sql` | task_completions table (per-shop completion tracking) |
| 012 | `012_one_time_tasks.sql` | tasks.is_one_time, tasks.is_active |
| 013 | `013_notes_done_archive.sql` | notes.is_archived, notes.done_at |
| 014 | `014_excursions.sql` | excursions table |
| 015 | `015_multi_role.sql` | users.roles text[] replaces single role column |
| 016 | `016_repair_requests.sql` | repair_requests table (auto-created from repair deliveries) |
| 017 | `017_approval_status.sql` | tasks.approval_status, excursions.approval_status |
| 018 | `018_image_url_kb.sql` | kb_articles.image_url |

Run migrations: `npm run migrate` (from `backend/`). On Fly.io this runs automatically before each deploy.

---

## Backend Routes

All under `/api`, all require JWT except `/api/auth/login`.

| Prefix | File | Notes |
|---|---|---|
| `/api/auth` | `routes/auth.js` | login (rate-limited), `/me` |
| `/api/bikes` | `routes/bikes.js` | fuzzy suggest, upsert-by-label, DELETE (admin only) |
| `/api/requests` | `routes/requests.js` | CRUD + status machine + audit log; fires push on create |
| `/api/shops` | `routes/shops.js` | |
| `/api/notes` | `routes/notes.js` | |
| `/api/tasks` | `routes/tasks.js` | recurring + one-time; approve/reject endpoints |
| `/api/kb` | `routes/kb.js` | knowledge base articles with optional image_url |
| `/api/push` | `routes/push.js` | web-push subscriptions |
| `/api/admin` | `routes/admin.js` | users, shops, bikes CRUD; GET /archive |
| `/api/users` | `routes/users.js` | active user list (for "who's working today") |
| `/api/excursions` | `routes/excursions.js` | excursion entries; approve/reject endpoints |
| `/api/repair-requests` | `routes/repair_requests.js` | repair workflow for mechanics |
| `/api/uploads` | `routes/uploads.js` | POST image upload (multer, 5 MB, magic-byte validated) |
| `/uploads/*` | static | served with `Cross-Origin-Resource-Policy: cross-origin` |

### Key middleware

- `backend/src/middleware/auth.js` — JWT verify with `{ algorithms: ['HS256'] }`
- `backend/src/middleware/applyActiveShop.js` — X-Shop-Id header support; only `admin`/`organiser` can switch shops
- `backend/src/middleware/rateLimiter.js` — `loginLimiter`: 20 attempts per 15 min on `/api/auth/login`

### Security applied

- `helmet()` for security headers
- CORS restricted to `ALLOWED_ORIGINS` env var (defaults to localhost:5173/4173)
- `express.json({ limit: '50kb' })` body size cap
- JWT algorithm pinned to HS256
- All SQL uses parameterized queries (no string interpolation)
- X-Shop-Id shop-switching locked to admin/organiser only
- Image uploads: MIME type first-pass + magic byte second-pass validation

---

## Frontend Pages & Key Components

| Page/Component | Path | Purpose |
|---|---|---|
| `Login` | `pages/Login.jsx` | Unauthenticated entry |
| `Home` | `pages/Home.jsx` | Main dashboard — accordion sections |
| `Profile` | `pages/Profile.jsx` | Push notifications, active jobs, team overview |
| `Bikes` | `pages/Bikes.jsx` | Bike list; admin can move or delete bikes |
| `Excursions` | `pages/Excursions.jsx` | Excursion entries by company; image upload; approval badges |
| `AdminPage` | `pages/Admin/AdminPage.jsx` | Tabs: Users, Shops, Bikes, Archive |
| `ArchivePanel` | `pages/Admin/ArchivePanel.jsx` | Archive of done deliveries, notes, tasks — all show author |
| `TopBar` | `components/TopBar/TopBar.jsx` | Fixed header — shop badge, username, role, **logout button** |
| `BottomNav` | `components/Navbar/BottomNav.jsx` | Bottom navigation + central FAB |
| `RequestCard` | `components/RequestCard/RequestCard.jsx` | Inline-editable delivery card; repair age-coloring |
| `RepairRequestsSection` | `components/RepairRequestsSection/` | Red section for mechanics/admin — repair jobs |
| `TaskCard` | `components/TaskCard/TaskCard.jsx` | Task with approval status badges and approve/reject buttons |
| `KbCard` | `components/KbCard/KbCard.jsx` | KB article with inline edit and image lightbox |
| `ImageUploader` | `components/ImageUploader/ImageUploader.jsx` | File/camera picker → crop UI → upload to `/api/uploads` |
| `ImageLightbox` | `components/ImageLightbox/ImageLightbox.jsx` | Full-screen image overlay, Escape/backdrop to close |
| `AddModal` | `components/AddModal/AddModal.jsx` | FAB modal for creating any record type |
| `ConfirmDialog` | `components/ConfirmDialog/ConfirmDialog.jsx` | Generic confirm dialog used everywhere |

---

## Features in Detail

### Delivery requests (core)
- Statuses: `open → in_progress → done`; `any → cancelled`; manager can reopen
- Each transition requires a `ConfirmDialog`
- `reason` field: `repair` triggers special colour-coding (age-based red/orange/yellow) and auto-creates a `repair_request` record when done
- Bikes are upsert-by-label (trim + case-invariant)
- Optimistic locking via `version` field on PATCH
- When a new delivery is created, a push notification is sent to all active driver+admin users (excluding creator)
- `brm_blocked` checkbox lets drivers flag when they've blocked the transport in the BRM system

### Repair workflow
- When a delivery with `reason = 'repair'` is marked done, a `repair_request` record is auto-created
- A one-time task `"Change bike in system to repair: <labels>"` is also auto-created
- The `RepairRequestsSection` (visible to mechanic/admin only) shows open repair jobs
- Mechanics can take a job (→ in_progress) and complete it (→ done)
- On completion, another one-time task `"Change bike back to normal in BRM: <labels>"` is auto-created

### Approval workflow
- Tasks and excursions created by non-privileged users start with `approval_status = 'pending'`
- Admin/organiser see Approve/Reject buttons inline on pending items
- Pending items show yellow badge; rejected show red; non-privileged users only see their own pending/rejected items

### Knowledge base
- Articles have category (dropdown: BRM / Bikes / Shop / General), content, and optional image
- Images shown as small thumbnails, click to open lightbox

### Excursions
- Company-grouped entries (LCT, First Minute, Lanzabuggy, Paracraft + custom)
- Optional image upload per entry
- Approval workflow applies (general users → pending)
- Author shown on each card

### Image uploads
- `POST /api/uploads` — returns `{ url: '/uploads/<filename>' }`
- 5 MB limit, JPEG/PNG/GIF/WebP only (magic bytes validated server-side)
- Client-side crop UI before upload (`react-image-crop`)
- `Cross-Origin-Resource-Policy: cross-origin` set on `/uploads/*` static responses so Vite dev server can load them

### Archive (admin only)
- `GET /api/admin/archive` — returns last 200 done/cancelled deliveries, archived notes, completed one-time tasks
- All three sections now show the author username

### Who's working today (Profile page)
- `GET /api/users` returns users with `last_seen_at` within the last 8 hours
- Grouped by shop with colour coding

---

## Deployment (Fly.io)

```bash
# Deploy
fly deploy -a sensorg

# View logs
fly logs -a sensorg

# Connect to Postgres
fly postgres connect -a <postgres-app-name>

# Inside psql — select the right database first
\c sensorg

# Common DB operations
TRUNCATE bikes CASCADE;          -- clear bikes table, keep structure
DROP TABLE bikes CASCADE;        -- remove table entirely
DELETE FROM requests WHERE status IN ('done', 'cancelled');  -- clear archive data
```

### Required secrets (set via `fly secrets set -a sensorg KEY=value`)

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | JWT signing key |
| `VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |

Migrations run automatically on each deploy via `release_command = 'node /app/backend/migrate.js'` in `fly.toml`.

Frontend is built into `frontend-dist/` and served as static files by Express in production.

---

## Environment Variables

**`backend/.env` (local dev):**
```
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/bikeapp
JWT_SECRET=supersecretkey
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

**`frontend/.env`:**
```
VITE_API_URL=http://localhost:3000
```

---

## Testing

```bash
# Backend (from backend/) — no live DB needed, pool is mocked
npm test

# Frontend unit tests (from frontend/)
npm test

# E2E (from frontend/) — starts Vite automatically
npm run test:e2e
npm run test:e2e:ui
```

| Suite | What it covers |
|---|---|
| `transitions.test.js` | All valid status transitions, role denials (26 tests) |
| `requests.status.test.js` | Status endpoint 401/403/404 + happy paths (8 tests) |
| `bikes.suggest.test.js` | Suggest + upsert, trim/case/validation (12 tests) |
| `getColorByDue.test.js` | All colour boundary values (15 tests) |
| `app.spec.js` (Playwright) | Login, CRUD, conflicts, transitions, delete (21 tests) |

---

## Commit Convention

```
feat:   new feature
fix:    bug fix
ui:     frontend-only change
api:    backend-only change
db:     migration or schema change
test:   test-only change
```
