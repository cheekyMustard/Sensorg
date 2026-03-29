# BIKEREQUESTLIST_PLAN.md

## 0) Ziel & Scope
- **Ziel:** Funktionierende „BikeRequestList“ mit Home-Übersicht aller offenen/aktiven Requests, Add-Flow, Edit/Löschen, Statuswechsel mit Bestätigungs-Popups, Datumsbasierte Farbverläufe, einfache Navbar (Home · Add · Profile/Admin).
- **Tech-Stack (Annahme):** React (Vite, optional TS & Tailwind), Node/Express, PostgreSQL.
- **Rollen (mind.):** `admin`, `manager`, `driver`, `mechanic`, `shopUser`.

---

## 1) Datenmodell

### 1.1 Tabellen
- **users**
  - `id` UUID PK
  - `username` unique, `password_hash`, `role` (enum oder separate Tabelle), `shop_id` (nullable für Admins)
  - `created_at`, `updated_at`, `is_active` bool

- **shops**
  - `id` UUID PK, `name` (z. B. Arcos/THB/…)
  - `created_at`, `updated_at`

- **bikes**
  - `id` UUID PK
  - `label` TEXT unique (z. B. „SG3U-50-10”)
  - `notes` TEXT nullable
  - `current_shop_id` FK → shops (nullable) — aktueller physischer Standort; wird automatisch auf `to_shop_id` gesetzt, wenn ein Request auf `done` gesetzt wird
  - `created_at`, `updated_at`, `is_active` bool

- **requests**
  - `id` UUID PK
  - `from_shop_id` FK → shops
  - `to_shop_id` FK → shops
  - `reason` ENUM(`rental`,`repair`,`return`)
  - `status` ENUM(`open`,`in_progress`,`done`,`cancelled`)  ← UI nutzt open/in_progress/done
  - **Datumsfelder**
    - `date_created` DATE (Erstellung)
    - `date_rental` DATE (Zieldatum/Abholdatum)  ← für Farblogik
  - `created_by_user_id` FK → users
  - `updated_by_user_id` FK → users
  - `created_at`, `updated_at`
  - **Optimistische Sperre:** `version` INT (für Concurrency)

- **request_bikes** (n:m zwischen requests und bikes)
  - `id` UUID PK
  - `request_id` FK → requests
  - `bike_id` FK → bikes
  - `position` INT (Reihenfolge im UI)
  - unique(`request_id`,`bike_id`)

- **request_audit_log** (optional, aber empfohlen)
  - `id` UUID PK, `request_id` FK
  - `action` TEXT (created, updated, status_changed, deleted, bike_added, bike_removed, etc.)
  - `payload` JSONB (Diff/Details)
  - `user_id` FK → users
  - `created_at`

### 1.2 Indizes
- `requests(date_rental)`, `requests(status)`, `request_bikes(request_id)`, `bikes(label)` (GIN Trigram für Suggest)

### 1.3 Status-State-Machine
- **Erlaubte Übergänge:**  
  `open → in_progress → done`  
  `open → cancelled`, `in_progress → cancelled`  
  (Zurücksetzen nur für Admin/Manager: `in_progress → open`, `done → in_progress`)

---

## 2) API-Design (REST)

> Alle Routen **JWT-geschützt**; Rollenprüfung per Middleware.  
> Basis: `/api`.

### 2.1 Auth/Me
- `POST /auth/login` → `{token}`  
- `GET /auth/me` → User + Rolle + Shop

### 2.2 Bikes
- `GET /bikes?query=SG3` → Liste (für Autosuggest; fuzzy/ILIKE)
- `POST /bikes` (role ≥ shopUser) → Bike anlegen (wenn beim Tippen Neues entsteht)
- (optional) `GET /bikes/:id`

### 2.3 Requests
- **List/Startseite**
  - `GET /requests?status=active&shop=Arcos`  
    - `status=active` meint `open|in_progress` (Option: `all`, `open`, `in_progress`, `done`, `cancelled`)
    - **Sortierung:** Primär `date_rental ASC`, Sekundär `status` (open→in_progress), dann `created_at DESC`.
- **Create**
  - `POST /requests`
  - Body:
    ```json
    {
      "from_shop_id": "...",
      "to_shop_id": "...",
      "reason": "rental",
      "date_rental": "2025-09-02",
      "bikes": ["SG3U-50-10","SG31-48-03"]
    }
    ```
  - Server:
    - Bikes per label upsert (existiert? → verknüpfen; neu? → create)
    - Rückgabe: kompletter Request inkl. `request_bikes`
- **Read**
  - `GET /requests/:id`
- **Update (Edit)**
  - `PATCH /requests/:id`
  - Body: Teiländerungen (from/to shop, reason, date_rental, bikes-Liste neu setzen, etc.)
  - **Version** erforderlich: `If-Match: <version>` Header oder Body `version`
- **Status-Wechsel**
  - `POST /requests/:id/status` Body: `{ "to": "in_progress" }`
  - Serverseitig gültige Transition prüfen; Audit loggen.
- **Delete**
  - `DELETE /requests/:id` (soft delete? → hier „cancelled“ bevorzugen; echtes Delete nur Admin)
- **Batch-Save (für UI „Save“ am Ende)**
  - `POST /requests/batch` Body:
    ```json
    {
      "operations": [
        {"op":"update","id":"...","patch":{"date_rental":"2025-09-02"},"version":3},
        {"op":"status","id":"...","to":"in_progress","version":3},
        {"op":"delete","id":"..."}
      ]
    }
    ```
  - Transaktional, alles-oder-nichts.

---


## 3) Business-/UI-Regeln

### 3.1 Farbverlauf nach Heutiges Datum vs. `date_rental`
- `diff = date_rental - today` (in Tagen)
  - `diff <= 0` → **rot** (überfällig/Tag X)
  - `1 ≤ diff ≤ 2` → **rot → gelb** (Warnbereich)
  - `3 ≤ diff ≤ 5` → **blau** (mittelfristig)
  - `diff > 5` → **grün**
- Optional: echte **Gradienten** je Box; Minimalvariante: diskrete Farben wie oben.
- **Status priorisiert Darstellung:** `done` → neutral grau mit Häkchen; `cancelled` → blass/ausgegraut.

### 3.2 Edit/Save/Cancel
- Jede Karte hat **lokalen Draft-State** (kopie des Objekts).
- Buttons:
  - **Save:** sendet *gesammelte Änderungen* (Batch oder Einzel-PATCH) → Seite/State aktualisieren.
  - **Cancel:** verwirft lokalen Draft (kein API-Call).
- **Pop-Ups bei Statuswechsel**
  - `open → in_progress`: „Are you sure you want to take this job?“ (OK → Request claimen, setzt `updated_by_user_id`)
  - `in_progress → done`: „Is the bike changed in the system?“
  - (Konfigurierbar je Übergang; Confirm before request.)

### 3.3 Klappfunktion (Accordion)
- **Accordion bezieht sich auf die gesamte „Deliveries“-Box** (Sektion), nicht auf einzelne Requests.
- Eingeklappt zeigt die Sektion nur den **Header „Deliveries“** mit Chevron, optional:
  - Anzahl offener/aktiver Requests (z. B. `Deliveries (5)`),
  - frühestes `date_rental` als Hinweis,
  - kleine Farblegende für die Dringlichkeit.
- Ausgeklappt werden darunter die **einzelnen Request-Karten** vollständig sichtbar.
- **Wichtig:** Die **Request-Karten selbst sind nicht einklappbar**; ihre Edit/Löschen-Aktionen bleiben wie beschrieben verfügbar.

### 3.4 Add-Button (zentral)
 (zentral)
- Bottom-Navbar: „Home“, **„Add“** (runder FAB in Mitte), „Profile/Admin“.
- Klick → Modal mit Optionen (rolleabhängig):
  - `Bike Delivery`, `Note`, `Witz`, `Nice-to-Know` (weitere Module später)
- „Bike Delivery“ öffnet Formular:
  - `From` (default = eigener Shop), `To`, `Reason`, `Date rental`, **Bikes (Tags-Input mit Suggest)**

### 3.5 Bikes-Eingabe + Suggest
- **Tags/Chips-Input**:
  - Tippen → `GET /bikes?query=…` (debounced).
  - **Enter** / **Komma** erzeugt neuen Eintrag, der beim **Submit** per Server-Upsert persistiert.
  - Duplikate verhindern.

---

## 4) Rechte & Sicherheit
- **Rollenmatrix (Kurzfassung)**
  - `shopUser`: Requests des eigenen Shops (als `from` oder `to`) sehen/erstellen/„take job“/auf *in_progress* setzen.
  - `driver/shopUser/manager/admin`: zusätzlich *done* setzen.
  - `manager`: alles im eigenen Standort; Reopen erlaubt.
  - `admin`: global, Delete Hard erlaubt.
- **Server-Enforce:** Shop-Scope per JWT (kein Trust in Client).
- Rate-Limiting bei Suggest, Input-Validation, Audit-Trail.

---

## 5) Validierung
- Pflichtfelder: `from_shop_id`, `to_shop_id` (≠), `reason`, `date_rental`, min. 1 Bike.
- `date_rental` ≥ `date_created` (Warnung, aber erlauben wenn nötig).
- Bikes: Label 2–40 Zeichen, A–Z/0–9/„-_/ “ erlaubt.
- Dedup der Bikes pro Request.

---

## 6) Frontend Aufgaben (Checkliste)

- [x] **Projektstruktur**: `pages/Home`, `components/RequestCard`, `components/AddModal`, `components/BikeTagsInput`, `components/ConfirmDialog`, `components/Navbar`.
- [x] **State Mgmt**: React Query für Server-Sync, lokaler Draft-State je Karte.
- [x] **Home-Fetch**: `GET /requests?status=active`
- [x] **Sortierung**: nach `date_rental` ASC (serverseitig).
- [x] **Farblogik**: Helper `getColorByDue(date_rental, status, today)`.
- [x] **Accordion + Icons** (Edit/Löschen).
- [x] **Statuswechsel** mit `ConfirmDialog` → `POST /requests/:id/status`.
- [x] **Edit-Flow**: Felder editierbar, Save/Cancel-Buttons je Karte.
- [x] **Delete/Cancel**: Soft-Delete (`cancelled`) oder Hard-Delete (rolleabhängig).
- [x] **Add-Modal (FAB)**: Formular für Bike Delivery (From/To/Reason/Date/Bikes).
- [x] **BikeTagsInput**: Debounce Suggest (300ms), neue Labels erlaubt, Backspace/Chip-X.
- [x] **Toasts** für Erfolg/Fehler (`sonner` — success/error in allen Mutations-Hooks).
- [x] **Loading/Skeletons**.
- [x] **Role-aware UI** (Buttons ausblenden/sperren).

---

## 7) Backend Aufgaben (Checkliste)

- [x] **DB-Migrations** (shops, users, bikes, requests, request_bikes, request_audit_log).
- [x] **Seed**: Standard-Shops (Arcos, THB, Plaza), Admin-User, Beispiel-Bikes.
- [x] **Auth**: `/auth/login`, JWT-Middleware, `authenticateToken`.
- [x] **RBAC** Middleware: `requireRole(...roles)` + Shop-Scope.
- [x] **Bikes API**: fuzzy search (ILIKE + pg_trgm GIN), upsert by label.
- [x] **Shops API**: `GET /api/shops` (Liste aller Shops).
- [x] **Requests API**:
  - [x] List + Sort/Filter (status, shop-scope per Rolle)
  - [x] Create (mit Bikes-Upsert + n:m Verknüpfung)
  - [x] Read
  - [x] Patch (mit Version/Optimistic Locking)
  - [x] Status-Endpoint (Transitions + Audit)
  - [x] Delete/Cancel (rolleabhängig)
  - [ ] Batch-Endpoint (Transaktion) — optional, noch offen
- [x] **Audit-Log** (in Status-Endpoint + Create).
- [x] **Input-Validation** (Zod).
- [x] **Error-Handling** konsistent (JSON-Fehlerobjekte).
- [x] **Unit/Integration-Tests** (Statusmaschine):
  - `src/__tests__/transitions.test.js` — 26 unit tests für `canTransition` (alle Übergänge, Rollen, Edge-Cases).
  - `src/__tests__/requests.status.test.js` — 8 Supertest-Integrationstests für `POST /requests/:id/status`; DB-Pool via `jest.unstable_mockModule` gemockt, kein Live-DB nötig.
  - `src/utils/transitions.js` — `canTransition` + `TRANSITIONS` als named exports extrahiert (requests.js importiert von dort).
- [x] **Unit/Integration-Tests** (Suggest) — `bikes.suggest.test.js` (12 Tests: GET empty/query/trim, POST upsert/uppercase/validation).
- [x] **Performance**: Pagination (Load-More) — `GET /api/requests?limit=&offset=` + `useInfiniteQuery` + „Load more"-Button in DeliveriesSection.

---

## 8) Typen & Beispiele

### 8.1 TypeScript Interfaces (Frontend)
```ts
type Role = 'admin'|'manager'|'driver'|'mechanic'|'shopUser';
type Reason = 'rental'|'repair'|'return';
type Status = 'open'|'in_progress'|'done'|'cancelled';

interface Shop { id: string; name: string; }

interface Bike { id: string; label: string; is_active: boolean; }

interface RequestBike { id: string; bike: Bike; position: number; }

interface Request {
  id: string;
  from_shop: Shop;
  to_shop: Shop;
  reason: Reason;
  status: Status;
  date_created: string;   // ISO
  date_rental: string;    // ISO
  bikes: RequestBike[];
  version: number;
  created_by: { id: string; username: string; };
  updated_at: string;
}
```

### 8.2 API-Antwort (gekürzt)
```json
{
  "id":"req_123",
  "from_shop":{"id":"s1","name":"Arcos"},
  "to_shop":{"id":"s2","name":"THB"},
  "reason":"rental",
  "status":"open",
  "date_created":"2025-08-25",
  "date_rental":"2025-09-02",
  "bikes":[{"id":"rb1","bike":{"id":"b1","label":"SG3U-50-10"},"position":1}],
  "version":1
}
```

---

## 9) UX-Details (Feinschliff)
- **Keyboard-Flow** im Bike-Input (Enter = Chip erstellen; Pfeile = Vorschläge navigieren).
- **Undo-Snackbar** nach Delete/Cancel (5 s).
- **Sticky-Footer** mit Save/Cancel nur anzeigen falls Draft ≠ Original.
- **Icon-Legende** (✏️ Edit, 🗑️ Delete, 📦 Reason-Badge).
- **Accessible Focus-States**; Kontrast der Farbbereiche.
- **Mobile Optimierung** (iPhone 13/14 Layout wie Wireframe).

---

## 10) Tests (Akzeptanz)

- [ ] Requests mit 1..n Bikes anlegen (neue + existierende Labels).
- [ ] Sortierung nach `date_rental`.
- [x] Farblogik für Grenzwerte (≤0, 1–2, 3–5, >5) — 15 Vitest-Tests in `frontend/src/utils/getColorByDue.test.js`.
- [x] Status-Transitions inkl. Rechte (Backend) — Supertest-Integrationstests; Frontend-Confirm-Dialog-Flow nicht automatisiert getestet.
- [ ] Edit mehrerer Karten → erst nach „Save“ persistiert.
- [ ] Cancel verwirft lokal, keine API-Calls.
- [x] Suggest liefert passende Bikes, keine Duplikate.
- [ ] Concurrency: `version` Konflikt erzeugt Hinweis + Reload-Option.
- [ ] RBAC: Nutzer sieht nur relevante Requests/Buttons.

---

## 11) Deployment/Operate
- [ ] Env-Vars (DB_URL, JWT_SECRET, APP_URL).
- [ ] Migration Scripts & Seed.
- [ ] Logging (req id, user id, action).
- [ ] Backups & Retention.
- [ ] Monitoring (uptime, Fehlerquote).

---

## 11b) Push-Benachrichtigungen ✅ implementiert

### Ziel
Wenn ein Deliverer eine Delivery auf **done"** setzt (Status `in_progress → done`), erhalten alle Mitarbeiter des **Ziel-Shops** (`to_shop_id`) eine Push-Nachricht — aber nur bei den Reasons **`rental`** und **`return`** (nicht bei `repair`).

### Technologie-Optionen
- **Web Push API** (VAPID) — kein nativer App-Store nötig, funktioniert im Browser/PWA
- **Firebase Cloud Messaging (FCM)** — breiter Geräte-Support, etwas mehr Setup
- Empfehlung: Web Push via `web-push` npm-Paket (Backend) + Service Worker (Frontend)

### Grober Ablauf
1. **Subscription**: Nutzer erlaubt Push-Benachrichtigungen im Browser → Browser erzeugt ein `PushSubscription`-Objekt → wird per `POST /api/push/subscribe` im Backend gespeichert (neue Tabelle `push_subscriptions`)
2. **Trigger**: Backend-Endpoint `POST /requests/:id/status` → wenn `to === 'done'` und `reason in ('rental', 'return')`:
   - Alle aktiven User des `to_shop` ermitteln
   - Deren Push-Subscriptions laden
   - Notification versenden: z.B. „🚲 Bike arrived at [Shop]: [from_shop] → [to_shop] – [bike labels]"
3. **Service Worker**: Frontend registriert SW, empfängt `push`-Event und zeigt Notification an

### Neue Datenbank-Tabelle (später)
```sql
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);
```

### Bike-Standort-Update
Wenn ein Request auf `done` gesetzt wird, soll `bikes.current_shop_id` automatisch auf `to_shop_id` gesetzt werden (für alle Bikes des Requests). Das passiert im selben DB-Transaktionsschritt wie der Status-Wechsel.

---

## 12) Annahmen & Optionen
- **Soft-Delete** via `cancelled` statt echtes Delete – UI zeigt „Löschen“ → setzt `cancelled`.  
- **Batch-Endpoint** ist optional; alternativ einzelne PATCH-Calls pro Karte beim Save.  
- **Farbverlauf**: zunächst diskrete Farben; Gradients später.

---

## 13) Nächste Schritte (empfohlene Reihenfolge)
1. ✅ **DB-Migrations + Seeds** (Shops, Admin).
2. ✅ **Auth + RBAC**.
3. ✅ **Bikes Suggest API**.
4. ✅ **Requests: Create/List/Read**.
5. ✅ **Status-Transitions + Audit**.
6. ✅ **Frontend Home + Karten + Farblogik**.
7. ✅ **Add-Modal + Create-Flow**.
8. ✅ **Edit/Save/Cancel (Draft-State)**.
9. ✅ **Delete/Cancel & Confirm-Dialogs**.
10. ✅ **Push-Benachrichtigungen** (Web Push, VAPID, bike location tracking).
11. ✅ **Admin-Panel** (Users/Shops/Bikes, verlinkt aus Profile).
12. ✅ **Notes-System** (CRUD, shop-scoped, NoteCard + NotesSection + AddModal-Integration).
13. ✅ **"What else can be done"** (Tasks + tägliche Completions, Checkbox-UI, Manager/Admin können Tasks anlegen).
14. ✅ **Tests** (Statusmaschine + Farblogik) — `transitions.test.js`, `requests.status.test.js`, `getColorByDue.test.js`.
15. ✅ **Feinschliff & Pagination** — Load-More (`useInfiniteQuery`, `limit/offset` auf Backend), 409-Conflict-UX in RequestCard, Suggest-Tests (`bikes.suggest.test.js`, 12 Tests).
16. ✅ **Frontend-E2E** — Playwright-Setup (`playwright.config.js`, `npm run test:e2e`), 21 Tests: Login-Flow, Home-Sections, Create-Delivery, Inline-Edit, 409-Conflict, Status-Transitions, Delete. Alle API-Calls via `page.route()` gemockt.
