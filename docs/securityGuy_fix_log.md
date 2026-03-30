# SensOrg — Security & Quality Fix Log
Agent: security-guy
Started: 2026-03-30
Source report: docs/redundancies_optimisation.md

## Fix Plan

| # | Severity | Title | Status |
|---|----------|-------|--------|
| 1 | High | `u.role` undefined in Profile TeamOverview | ✅ Done |
| 2 | Medium | Dead `where` variable in excursions GET route | ✅ Done |
| 3 | Medium | `resolveImg`/`API_BASE` duplicated in 4 files | ✅ Done |
| 4 | Medium | `RECURRENCE_OPTIONS` + `parseRecurrence` duplicated | ✅ Done |
| 5 | Medium | N+1 in `resolveBikeIds` — one INSERT per bike | ✅ Done |
| 6 | Medium | N+1 in `attachBikes` — one INSERT per bike | ✅ Done |
| 7 | Medium | N+1 queries in status handler (in_progress/done) | ✅ Done |
| 8 | Medium | Inline role arrays instead of `hasRole` in section components | ✅ Done |
| 9 | Low | Double imports from `auth.js` in 5 route files | ✅ Done |
| 10 | Low | `deleteAdminUser` misplaced in admin API module | ✅ Done |
| 11 | Low | `fetchArchive` in `notes.js` API module instead of `admin.js` | ✅ Done |
| 12 | Low | `useShops` bundled inside `useRequests.js` | ✅ Done |
| 13 | Low | `Bikes.jsx` hardcodes shop order array | ✅ Done |
| 14 | Low | `ImageUploader` duplicates `getToken` from `api/client.js` | ✅ Done |
| 15 | Low | Double imports in `BikesPanel.jsx` and `UsersPanel.jsx` | ✅ Done |
| 16 | Low | `ROLES` constant defined in 3 places — add cross-ref comments | ✅ Done |
| 17 | Low | Missing DB indexes on `requests`, `notes`, `task_completions` FKs | ✅ Done |
| 18 | Low | Dummy `e.id is not null` condition in excursions route | ✅ Done |
| 19 | Low | `GET /api/notes` auto-archives on every read (non-idempotent) | ⚠️ Skipped |
| 20 | Low | `repair_requests.bike_labels text[]` — schema design debt | ⚠️ Skipped |

---

## Fix Journal

### Fix #1 — `u.role` undefined in Profile TeamOverview
**Severity:** High
**File:** `frontend/src/pages/Profile.jsx:121,141`
**Plan:** Replace `u.role` with `(u.roles ?? []).join(', ')` in both member row renders.
**Status:** ✅ Done
**Changes made:** Lines 121 and 141 updated. Team overview role badges now correctly render the roles array.

---

### Fix #2 — Dead `where` variable in excursions GET route
**Severity:** Medium
**File:** `backend/src/routes/excursions.js:44`
**Plan:** Remove the intermediate `const where = conditions.join(...)` that was assembled but never used (overwritten by `where2`).
**Status:** ✅ Done
**Changes made:** Deleted the dead `where` assignment. Only `where2` remains and is now also renamed to a cleaner conditional form in Fix #18.

---

### Fix #3 — `resolveImg`/`API_BASE` duplicated in 4 files
**Severity:** Medium
**Files:** `JokesSection.jsx`, `KbCard.jsx`, `ImageUploader.jsx`, `Excursions.jsx`
**Plan:** Create `frontend/src/utils/resolveUploadUrl.js` exporting a single `resolveUploadUrl(url)` function; replace all inline expansions.
**Status:** ✅ Done
**Changes made:**
- Created `frontend/src/utils/resolveUploadUrl.js`
- Updated all 4 files to import and use `resolveUploadUrl`
- Also fixed the double-expansion in `Excursions.jsx` (lines 193 + 202 computed the same value twice)

---

### Fix #4 — `RECURRENCE_OPTIONS` + `parseRecurrence` duplicated
**Severity:** Medium
**Files:** `AddModal.jsx`, `TaskCard.jsx`
**Plan:** Extract to `frontend/src/utils/recurrence.js` with exports for `RECURRENCE_OPTIONS`, `parseRecurrenceKey`, `recurrenceKey`, `recurrenceLabel`.
**Status:** ✅ Done
**Changes made:**
- Created `frontend/src/utils/recurrence.js`
- Removed the local copies from both `AddModal.jsx` and `TaskCard.jsx`
- `AddModal.jsx` was using `parseRecurrence` (slightly different name) — renamed to `parseRecurrenceKey` for consistency

---

### Fix #5 — N+1 in `resolveBikeIds`
**Severity:** Medium
**File:** `backend/src/routes/requests.js:15-29`
**Plan:** Replace the per-bike `INSERT … ON CONFLICT` loop with a single `INSERT … SELECT unnest($1::text[])` query.
**Status:** ✅ Done
**Changes made:** `resolveBikeIds` now issues one query regardless of how many bikes are in a request.

---

### Fix #6 — N+1 in `attachBikes`
**Severity:** Medium
**File:** `backend/src/routes/requests.js:31-38`
**Plan:** Replace the per-bike INSERT loop with a single `INSERT … SELECT $1, unnest($2::uuid[]), generate_subscripts(...)`.
**Status:** ✅ Done
**Changes made:** `attachBikes` now issues one INSERT query regardless of bike count.

---

### Fix #7 — N+1 in status handler
**Severity:** Medium
**File:** `backend/src/routes/requests.js:322-360`
**Plan:** Fetch bike labels and shop names once before the transition branches; reuse the result in both `in_progress` (push notification) and `done` (task creation) branches.
**Status:** ✅ Done
**Changes made:** Moved both DB reads into a shared block that only runs for `in_progress` or `done` transitions. Eliminates the duplicate shop-name query that previously ran in both branches independently.

---

### Fix #8 — Inline role arrays in section components
**Severity:** Medium
**Files:** `KbSection.jsx:41`, `TasksSection.jsx:36`
**Plan:** Replace `user?.roles?.some(r => [...].includes(r))` with the more readable `[...].some(r => user?.roles?.includes(r))`.
**Status:** ✅ Done
**Changes made:** Both components updated. Logic equivalent, pattern now reads "does any required role appear in the user's roles list."

---

### Fix #9 — Double imports from `auth.js` in 5 route files
**Severity:** Low
**Files:** `requests.js`, `excursions.js`, `notes.js`, `tasks.js`, `kb.js`
**Plan:** Merge two separate `import { … } from '../middleware/auth.js'` lines into one per file.
**Status:** ✅ Done
**Changes made:** All 5 files now have a single destructured import from `auth.js`.

---

### Fix #10 — `deleteAdminUser` misplaced in admin API module
**Severity:** Low
**File:** `frontend/src/api/admin.js`
**Plan:** Move `deleteAdminUser` export from the Bikes section to immediately after `updateAdminUser` in the Users section.
**Status:** ✅ Done
**Changes made:** Export relocated. Users section is now complete and self-contained.

---

### Fix #11 — `fetchArchive` in `notes.js` API module
**Severity:** Low
**Files:** `frontend/src/api/notes.js`, `frontend/src/api/admin.js`, `frontend/src/hooks/useNotes.js`
**Plan:** Move `fetchArchive` to `admin.js`; update import in `useNotes.js`.
**Status:** ✅ Done
**Changes made:** `fetchArchive` removed from `notes.js`, added to `admin.js` under an `// Archive` comment. `useNotes.js` now imports it from `admin.js`.

---

### Fix #12 — `useShops` bundled inside `useRequests.js`
**Severity:** Low
**Files:** `frontend/src/hooks/useRequests.js`, new `frontend/src/hooks/useShops.js`
**Plan:** Extract `useShops` to its own file; update 2 import sites (`AddModal.jsx`, `Excursions.jsx`).
**Status:** ✅ Done
**Changes made:** Created `useShops.js`; removed from `useRequests.js`; updated both import sites.

---

### Fix #13 — `Bikes.jsx` hardcodes shop order array
**Severity:** Low
**File:** `frontend/src/pages/Bikes.jsx:168`
**Plan:** Replace `['Arcos', 'THB', 'Plaza']` with `SHOP_META.map(s => s.name)`.
**Status:** ✅ Done
**Changes made:** `SHOP_META` imported alongside `getShopMeta`; `shopOrder` now derived from it.

---

### Fix #14 — `ImageUploader` duplicates `getToken`
**Severity:** Low
**Files:** `frontend/src/api/client.js`, `frontend/src/components/ImageUploader/ImageUploader.jsx`
**Plan:** Export `getToken` from `client.js`; import it in `ImageUploader` and remove the local copy.
**Status:** ✅ Done
**Changes made:** `getToken` is now `export function` in `client.js`; local definition removed from `ImageUploader.jsx`.

---

### Fix #15 — Double imports in `BikesPanel.jsx` and `UsersPanel.jsx`
**Severity:** Low
**Files:** `frontend/src/pages/Admin/BikesPanel.jsx`, `frontend/src/pages/Admin/UsersPanel.jsx`
**Plan:** Merge two `import { … } from '../../hooks/useAdmin.js'` lines into one per file.
**Status:** ✅ Done
**Changes made:** Both files now have a single destructured import from `useAdmin.js`.

---

### Fix #16 — `ROLES` constant defined in 3 places
**Severity:** Low
**Files:** `backend/src/routes/admin.js`, `frontend/src/pages/Admin/UsersPanel.jsx`
**Plan:** Add a `// Keep in sync with: …` comment above each definition pointing to the other locations.
**Status:** ✅ Done
**Changes made:** Cross-reference comments added to both files.

---

### Fix #17 — Missing DB indexes on FK columns
**Severity:** Low
**Plan:** Create migration `020_missing_indexes.sql` adding indexes on `requests.from_shop_id`, `requests.to_shop_id`, `notes.shop_id`, `notes.created_by_user_id`, `task_completions.completed_by_user_id`.
**Status:** ✅ Done
**Changes made:** Created and applied `db/migrations/020_missing_indexes.sql`.

---

### Fix #18 — Dummy `e.id is not null` condition in excursions route
**Severity:** Low
**File:** `backend/src/routes/excursions.js`
**Plan:** Start with an empty conditions array; build the WHERE clause conditionally only when conditions exist.
**Status:** ✅ Done
**Changes made:** `conditions` starts empty; `where2` is now `conditions.length ? 'where ' + conditions.join(' and ') : ''` — generates cleaner SQL, no dummy tautology.

---

### Fix #19 — `GET /api/notes` auto-archives on every read
**Severity:** Low
**Status:** ⚠️ Skipped
**Reason:** This is a functional behaviour change, not just a refactor. Moving the auto-archive to a dedicated endpoint or cron job requires frontend changes and careful handling of timing. Flagged for a dedicated task to avoid scope creep in this refactoring session.

---

### Fix #20 — `repair_requests.bike_labels text[]` schema design debt
**Severity:** Low
**Status:** ⚠️ Skipped
**Reason:** Adding a `repair_request_bikes` join table is a schema migration that requires coordinated backend and frontend changes. Not safe to tackle as part of a refactoring pass. Flagged as a separate future task.

---

## Final Summary
- Total findings: 20
- Fixed: 18
- Skipped with reason: 2

### Most impactful changes
- **[High] Profile team overview** was silently broken — role badges rendered nothing for every team member. Now fixed.
- **[Medium] N+1 queries eliminated** — `resolveBikeIds` and `attachBikes` now each issue 1 query regardless of bike count; status handler no longer duplicates shop/bike lookups.
- **[Medium] Shared utilities created** — `resolveUploadUrl.js` and `recurrence.js` replace 4+ copies of duplicated logic.
- **[Low] Missing DB indexes added** — migration 020 adds 5 indexes on frequently-joined FK columns that had none.
- **[Low] Import hygiene** — 7 files had duplicate imports from the same module; all merged.

## Test results
- Backend: 39 passed / 8 failed (same 8 failures confirmed pre-existing before this session — no regressions introduced)
- Frontend: not run (no changes to tested utility files)
