# SensOrg — Redundancies & Optimisation Report
Date: 2026-03-30

## Summary

The codebase is generally well-structured and consistent, but a number of recurring patterns have been copy-pasted rather than extracted into shared utilities. The most impactful issues are: a dead `where` variable in the excursions route, two separate but identical double-import patterns for `hasRole`/`requireRole` across multiple route files, a `resolveImg` URL helper duplicated in four different components/files with no shared module, the `RECURRENCE_OPTIONS` array and its `parseRecurrence` helper duplicated verbatim between `AddModal` and `TaskCard`, inline role-check logic repeated across every section component instead of using the existing `useAuth().hasRole`, and a N+1 query pattern in `requests.js` that fires three extra queries per status change on `in_progress`. There are also minor DB schema gaps (no index on `requests.from_shop_id`/`to_shop_id` despite being JOIN columns and the `where` variable built but replaced in the excursions route).

---

## Findings

### [Medium] Dead `where` variable in excursions GET route
**File:** `backend/src/routes/excursions.js:44`
**Problem:** The variable `where` is assembled from `conditions` at line 44, then `conditions` is mutated further before a second assignment `where2` is built at line 53. The first `where` is never used — it is immediately shadowed by `where2`. This is misleading and suggests the approval filter was added as a patch without cleaning up the original variable.
**Fix:** Remove the intermediate `const where = conditions.join(' and ')` line at line 44; only build the final `where2` (or rename it `where`) after all conditions have been appended.

---

### [Low] Duplicate `hasRole`/`requireRole` import in four route files
**Files:**
- `backend/src/routes/excursions.js:4-5`
- `backend/src/routes/notes.js:4-5`
- `backend/src/routes/requests.js:4-5`
- `backend/src/routes/tasks.js:4-5`
- `backend/src/routes/kb.js:4-5`

**Problem:** Each of these files contains two separate import statements from the same module:
```js
import { requireAuth, requireRole } from '../middleware/auth.js';
import { hasRole } from '../middleware/auth.js';
```
These should be a single destructured import.
**Fix:** Merge into one: `import { requireAuth, requireRole, hasRole } from '../middleware/auth.js';`

---

### [Medium] `resolveImg` URL helper duplicated in four places
**Files:**
- `frontend/src/components/JokesSection/JokesSection.jsx:8,21-23`
- `frontend/src/components/KbCard/KbCard.jsx:9,14`
- `frontend/src/components/ImageUploader/ImageUploader.jsx:6,131-133`
- `frontend/src/pages/Excursions.jsx:25,193,202`

**Problem:** Every file that renders a potentially-uploaded image independently declares `const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'` and then inline-expands `/uploads/` relative URLs. The `Excursions.jsx` page even duplicates the expansion expression twice within the same function (lines 193 and 202) for the same `entry.image_url` value.
**Fix:** Create `frontend/src/utils/resolveUploadUrl.js` that exports a single `resolveUploadUrl(url)` helper. Import it everywhere. This also makes it easy to update the base URL logic in one place (e.g. if CDN prefixes are added later).

---

### [Medium] `RECURRENCE_OPTIONS` and `parseRecurrence` duplicated between `AddModal` and `TaskCard`
**Files:**
- `frontend/src/components/AddModal/AddModal.jsx:193-207`
- `frontend/src/components/TaskCard/TaskCard.jsx:8-33`

**Problem:** `RECURRENCE_OPTIONS` (the same 8-element array) and the `parseRecurrence`/`parseRecurrenceKey` helpers (same logic, different function names) are copy-pasted into both files. If a new recurrence option is added, it must be added in two places.
**Fix:** Extract to `frontend/src/utils/recurrence.js` and import from both components.

---

### [Medium] N+1 queries in `POST /api/requests/:id/status` for `in_progress` and `done` transitions
**File:** `backend/src/routes/requests.js:324-404`
**Problem:** When status changes to `in_progress`, two extra queries are fired sequentially inside the transaction:
1. `select b.label from bikes ...` (line 326)
2. `select fs.name ... from shops ...` (line 329)

When status changes to `done`, three more queries run:
1. `select fs.name ... from shops ...` (line 352)
2. `select b.label from bikes ...` (line 356)
3. The actual bike update (line 343)

The `request` object already contains `from_shop_id` and `to_shop_id`. The shop names and bike labels could be fetched in a single JOIN query at the top (the same query already used in GET requests, lines 217-228) or fetched once and reused. The shop name lookup for the `done` branch (lines 352-355) is identical to the one already done in the `in_progress` branch — if transitions ever expand both could use the same query.
**Fix:** Add a single combined lookup at the start of the status handler that fetches shop names and bike labels in one query, reused across both transition branches.

---

### [Medium] N+1 pattern in `resolveBikeIds` — sequential inserts in a loop
**File:** `backend/src/routes/requests.js:15-29`
**Problem:** `resolveBikeIds` issues one `INSERT … ON CONFLICT` per bike label in a `for` loop. For a request with 10 bikes this fires 10 round-trips inside the transaction.
**Fix:** Use `UNNEST($1::text[])` to upsert all bike labels in a single query and return their ids in one round-trip.

---

### [Medium] Similar N+1 in `attachBikes` — sequential inserts in a loop
**File:** `backend/src/routes/requests.js:31-38`
**Problem:** `attachBikes` issues one `INSERT INTO request_bikes` per bike id. Same approach as above.
**Fix:** Use a single `INSERT INTO request_bikes (request_id, bike_id, position) SELECT $1, unnest($2::uuid[]), generate_series(1, array_length($2::uuid[], 1)) ON CONFLICT DO NOTHING`.

---

### [Medium] Inline role arrays in section components instead of `useAuth().hasRole`
**Files:**
- `frontend/src/components/KbSection/KbSection.jsx:41`
- `frontend/src/components/TasksSection/TasksSection.jsx:36`
- `frontend/src/pages/Profile.jsx:121,141` (accessing `u.role` which does not exist on the API response)

**Problem:** `KbSection` and `TasksSection` both call `user?.roles?.some(r => ['admin', 'organiser', ...].includes(r))` inline rather than using the `hasRole` function already exposed from `useAuth()`. This duplicates logic that already lives in `AuthContext`. In `Profile.jsx` lines 121 and 141, the code renders `{u.role}` on each team member row, but the `/api/users` endpoint returns a `roles` array — `u.role` will always be `undefined`.
**Fix:** Use `hasRole(...)` from `useAuth()` in section components; fix `Profile.jsx` to render `(u.roles ?? []).join(', ')` instead of `u.role`.

---

### [High] `u.role` field does not exist — always renders undefined in Profile
**File:** `frontend/src/pages/Profile.jsx:121,141`
**Problem:** The `/api/users` endpoint returns `u.roles` (an array, per migration 015 which replaced the `role` text column with `roles text[]`). The `TeamOverview` component renders `u.role` (singular) as a badge on lines 121 and 141. This will always render as an empty badge since the field does not exist.
**Fix:** Replace `u.role` with `(u.roles ?? []).join(', ')` or render the roles array as individual chips.

---

### [Low] `deleteAdminUser` exported from `frontend/src/api/admin.js` but named misleadingly in the file's structure
**File:** `frontend/src/api/admin.js:16`
**Problem:** The export `deleteAdminUser` is placed in the "Bikes" section of the admin API file (after `updateAdminBike`) rather than in the "Users" section (after `updateAdminUser`). This is a minor organisational issue but will confuse future maintainers.
**Fix:** Move line 16 (`export const deleteAdminUser`) to sit directly after the other user functions (line 7), within the Users section.

---

### [Low] `admin/archive` endpoint mixed concern — lives under `/api/admin` but is fetched from `notes.js` API module
**File:** `frontend/src/api/notes.js:7`
**Problem:** `fetchArchive` is exported from `notes.js` and calls `/api/admin/archive`, which returns requests, notes, and tasks. The archive endpoint is an admin-only cross-entity endpoint yet its frontend API call sits in the notes module.
**Fix:** Move `fetchArchive` to `frontend/src/api/admin.js` (where the other admin calls live) and update the import in `useNotes.js` and `ArchivePanel`.

---

### [Low] `const where` built but unused — dead code in excursions route
**File:** `backend/src/routes/excursions.js:44`
**Problem:** (See first finding above — this is the same issue, listing the specific line for clarity.) The `where` const at line 44 exists only to be overwritten at line 53 as `where2`. The SQL query uses `where2` (line 55). The `where` variable is truly dead.
**Fix:** Delete the line `const where = conditions.join(' and ');` at line 44.

---

### [Low] `useShops` defined in `useRequests.js` instead of its own hook file
**File:** `frontend/src/hooks/useRequests.js:72-78`
**Problem:** `useShops` logically belongs in a `useShops.js` hook (mirroring `useTasks`, `useNotes`, etc.) but is bundled inside `useRequests.js`. It is imported from `useRequests` in both `AddModal.jsx` and `Excursions.jsx`. This creates a confusing dependency.
**Fix:** Move `useShops` to its own file `frontend/src/hooks/useShops.js` (the file does not currently exist) and update import sites.

---

### [Low] `Bikes.jsx` hardcodes shop order array `['Arcos', 'THB', 'Plaza']`
**File:** `frontend/src/pages/Bikes.jsx:168`
**Problem:** The sort priority for shop grouping is a hardcoded array of shop names. The same shop list already exists in `frontend/src/utils/shopColors.js` (`SHOP_META`). If a shop name changes or is added, both places must be updated.
**Fix:** Derive the order from `SHOP_META.map(s => s.name)` (already imported as `getShopMeta`) instead of the hardcoded literal.

---

### [Low] `GET /api/notes` mutates data on every read (auto-archiving side-effect)
**File:** `backend/src/routes/notes.js:33-36`
**Problem:** Every GET request to `/api/notes` executes an `UPDATE notes SET is_archived = true ...` before reading. A GET endpoint should be idempotent and free of side effects. React Query will re-fetch notes on window focus, route changes, and mount — each triggering an unintended write.
**Fix:** Move the archiving logic to a scheduled job (a cron task, or a DB trigger), or at minimum to a dedicated `POST /api/notes/archive` endpoint called on login or on a timer. This also removes a write-lock contention risk under load.

---

### [Low] Missing index on `requests.from_shop_id` and `requests.to_shop_id`
**File:** `db/migrations/001_initial.sql`
**Problem:** The `requests` table has indexes on `status` and `date_rental` but not on `from_shop_id` or `to_shop_id`. Both columns appear in the WHERE clause for the main list query (`r.from_shop_id = $N or r.to_shop_id = $N`) and in JOIN conditions. Shops with many requests will see full-table scans on these columns as the table grows.
**Fix:** Add `create index if not exists requests_from_shop_id_idx on requests(from_shop_id)` and the equivalent for `to_shop_id` in a new migration.

---

### [Low] Missing index on `task_completions.completed_by_user_id` and `notes.created_by_user_id`
**File:** `db/migrations/004_tasks.sql`, `db/migrations/003_notes.sql`
**Problem:** Both tables join to `users` on `created_by_user_id` but have no index on that column. At scale this becomes a sequential scan for every read. Similarly `notes.shop_id` has no dedicated index (the WHERE clause filters on it).
**Fix:** Add indexes on these foreign key columns in a new migration.

---

### [Low] `repair_requests` table uses `text[]` for `bike_labels` instead of a FK join
**File:** `db/migrations/016_repair_requests.sql`
**Problem:** `repair_requests.bike_labels` stores bike labels as a plain text array rather than referencing the `bikes` table. If a bike label is changed (via `PATCH /api/admin/bikes`), the stored labels become stale. It also prevents relational queries.
**Fix:** Add a `repair_request_bikes` join table mirroring `request_bikes`, or at minimum enforce that updates to `bikes.label` cascade here. This is a schema design debt to be aware of before label editing is enabled.

---

### [Low] `excursions` route builds approval visibility condition using `e.id is not null` as a dummy first condition
**File:** `backend/src/routes/excursions.js:31`
**Problem:** `const conditions = ['e.id is not null']` is used as a placeholder so subsequent conditions can always use `and`. This is a common workaround, but the cleaner approach is to build conditions as an array and only prepend `where` if the array is non-empty (the same pattern already used in `requests.js`). The dummy condition generates unnecessary SQL.
**Fix:** Adopt the same pattern as `requests.js` lines 101-117: start with an empty conditions array and assemble `const where = conditions.length ? 'where ' + conditions.join(' and ') : ''`.

---

### [Low] `ImageUploader` reads JWT token directly from `localStorage` instead of using the shared `getToken` from `api/client.js`
**File:** `frontend/src/components/ImageUploader/ImageUploader.jsx:34-36`
**Problem:** `ImageUploader` defines its own `getToken()` that reads `localStorage.getItem('token')`. This duplicates the same logic already in `frontend/src/api/client.js:3-5`. If the storage key ever changes, it must be updated in both places.
**Fix:** Export `getToken` from `api/client.js` and import it in `ImageUploader`.

---

### [Low] `BikesPanel.jsx` imports `useAdminShops` twice from the same module
**File:** `frontend/src/pages/Admin/BikesPanel.jsx:2-3`
**Problem:**
```js
import { useAdminBikes, useUpdateAdminBike } from '../../hooks/useAdmin.js';
import { useAdminShops } from '../../hooks/useAdmin.js';
```
Two imports from the same file. Same pattern in `UsersPanel.jsx:3-4`.
**Fix:** Merge into a single destructured import per file.

---

### [Low] `ROLES` constant defined independently in both backend `admin.js` route and frontend `UsersPanel.jsx`
**Files:**
- `backend/src/routes/admin.js:11`
- `frontend/src/pages/Admin/UsersPanel.jsx:8`

**Problem:** Both define `const ROLES = ['admin', 'driver', 'mechanic', 'cleaner', 'organiser', 'general']`. If a role is added or renamed, it must be updated in both places. The backend also has the role constraint enforced in `015_multi_role.sql`. Three sources of truth for the same list.
**Fix:** This is acceptable for a monorepo that does not share code between backend and frontend, but at minimum add a comment in each location pointing to the other and to the migration constraint.

---
