# SensOrg Development Instructions

## 1. Project Overview
- **Monorepo:**
  - `frontend/`: React + Vite, TailwindCSS, Framer Motion, Lucide icons
  - `backend/`: Express.js API, JWT auth, planned PostgreSQL
  - `docs/`: Specs, wireframes, design guidelines

## 2. Key Features & Flows
- **BikeRequestList:** Home overview, add/edit/delete, status transitions, color logic by date, batch save, popups for status changes
- **Roles:** `admin`, `manager`, `driver`, `mechanic`, `shopUser` (RBAC enforced server-side)
- **Requests:**
  - Status: `open`, `in_progress`, `done`, `cancelled`
  - Color: Red (overdue), Yellow (1-2 days), Blue (3-5 days), Green (>5 days), Gray (done/cancelled)
  - Accordion for deliveries section
  - Edit/Save/Cancel per card, batch or single PATCH
  - Add modal (FAB) for new requests, notes, jokes, nice-to-know
  - Bike input: tags/chips, suggest via `/bikes?query=...`, upsert on submit

## 3. API Endpoints
- All endpoints JWT-protected, role-checked
- `/auth/login`, `/auth/me`
- `/bikes?query=...` (suggest)
- `/requests?status=active&shop=<shop>` (list)
- `/requests` (create)
- `/requests/:id` (read)
- `/requests/:id` (patch)
- `/requests/:id/status` (status change)
- `/requests/:id` (delete/cancel)
- `/requests/batch` (batch save)

## 4. Data Model (Planned)
- **Users, Shops, Bikes, Requests, RequestBikes, AuditLog**
- Requests link bikes via n:m table
- Optimistic locking via `version` field

## 5. UI/UX
- Home: Delivery, Notes, Nice to Know, Joke of the Day
- BottomNav: Home, Excursions, Profile/Admin
- Role-aware UI: show/hide features by user role
- Confirm dialogs for status changes
- Toasts for success/error
- Mobile optimized (see wireframes)

## 6. Development
- **Frontend:**
  - Dev: `npm run dev` (in `frontend/`)
  - Test: `npm run test` (Vitest)
- **Backend:**
  - Dev: `npm run dev` (in `backend/`)
  - Test: `npm run test` (Jest/Supertest)
- **Docs:**
  - See `docs/README.md`, `BIKEREQUESTLIST_PLAN.md`, wireframes

## 7. Best Practices
- Use React Query for server sync, local draft state per card
- RBAC enforced server-side, never trust client
- Input validation, audit trail, error handling
- Accessible focus states, color contrast
- Concurrency: handle version conflicts

## 8. References
- `docs/BIKEREQUESTLIST_PLAN.md`: Full feature and API spec
- `frontend/src/pages/Home.jsx`: Main page layout
- `frontend/src/components/BikeRequestList.jsx`: Request list UI
- `frontend/src/components/BottomNav.jsx`: Navigation logic
- `backend/src/index.js`: API endpoints

---
**Update this file as features, APIs, or workflows change.**
