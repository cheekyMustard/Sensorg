# SensOrg — Implementation Phases

---

## Phase 1 · Role System Overhaul ✅ COMPLETE (2026-03-29)
**Why first:** Everything else — visibility rules, approval flows, notifications, repair handling — depends on the role model being correct. Doing this first means all later phases can be built on a solid foundation without rework.

- ✅ Expand roles to: `admin`, `driver`, `mechanic`, `cleaner`, `organiser`, `general` and delete old ones that are not mentioned here
- ✅ Allow a user to hold **multiple roles** simultaneously (currently single role)
- ✅ Make users deletable
- ✅ Apply creation permissions per role:
  | Feature | Allowed roles |
  |---|---|
  | Notes | All except Cleaner |
  | Deliveries | All except Cleaner |
  | Nice to Know | Admin, Organiser, Mechanic |
  | Excursions | Organiser, General, Admin |
  | Tasks | Organiser, General, Admin |
- ✅ `Cleaner` has no create permissions — only views relevant sections
- ✅ `Mechanic` only sees repair-related content (Phase 3 depends on this)

---

## Phase 2 · Nice to Know Categories ✅ COMPLETE (2026-03-29)
**Why second:** Fully self-contained, no dependencies. Quick win that makes the KB immediately more useful while Phase 3 is being planned.

- ✅ Add predefined categories for sorting Nice to Know entries:
  - BRM (Bike Rental Manager)
  - Bikes
  - Shop
  - General
- ✅ Filter bar by category on the KB/Nice to Know page

---

## Phase 3 · Repair Delivery Workflow
**Why third:** Builds directly on Phase 1 (mechanic role). A significant feature that also introduces a new Home section, so it needs the role model to be stable before building the gating logic on top.

### On creation
- Make the **note/problem description field mandatory** for repair deliveries
- Show **Created at** date instead of rental date for repair type
- Color-code repair delivery age:
  - Green = created today
  - Progressively red as it ages

### On completion (status → done)
- Auto-create a **Repair Request** entry containing:
  - Arrival date
  - Problem description (from the delivery note)
- Auto-create a one-time shop task: `Change bike in system to "repair"`
- Add a new **Repair Requests** section to Home
- Only `mechanic` role can take and handle repair requests

---

## Phase 4 · Approval Workflow
**Why fourth:** Depends on Phase 1 (roles must exist) and benefits from Phase 3 being stable so approval logic can be applied uniformly. Introduces a `pending` state to entries, which is a meaningful data model change.

- Task entries created by non-admin/organiser users start in `pending` state
- Excursion entries created by non-organiser users start in `pending` state
- `admin` and `organiser` can approve or reject task entries
- `organiser` (and `admin`) can approve or reject excursion entries
- Pending entries are visible only to the creator and approvers until approved

---

## Phase 5 · Delivery Notifications
**Why fifth:** Lightweight — push infrastructure already exists. Just needs Phase 1 complete so we know who counts as a driver or admin. Good to do before the heaviest phase.

- Send push notification to all `driver` and `admin` users when a new delivery is created
- Notification body: from shop → to shop, reason, bike count

---

## Phase 6 · Image Uploads
**Why last:** Requires new backend infrastructure (file storage/CDN or blob handling) and the most frontend complexity. Doing this last means all business logic is stable before adding upload mechanics.

- Add image upload support for **Excursions** and **Nice to Know**
- Requirements:
  - Max file size: 5 MB
  - File picker upload
  - Camera prompt via photo icon
  - Direct capture from device camera
  - Crop support (if feasible with chosen library)
