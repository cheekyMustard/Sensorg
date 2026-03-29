# Claude Code Task List

## 1. Roles & Permissions

### Roles
- Admin
- Driver — only this role can take delivery jobs
- Mechanic — only this role can see and handle repair requests
- Cleaner — should not see deliveries; intended for new people
- Organiser
- General

### Role Rules
- A user can have multiple roles.
- User should be deletable

### Creation Permissions
- **Notes:** all roles except Cleaner
- **Deliveries:** all roles except Cleaner
- **Nice to know:** Admin, Organiser, Mechanic
- **Excursions:** Organiser, General, Admin
- **Tasks:** Organiser, General, Admin

## 2. Approval Workflow
- A User can create task entries and excursion entries.
- Task entries must be approved by Admin or Organiser.
- Excursion entries must be approved by Organiser.

## 3. Delivery Notifications
- Notify Drivers and Admins when a new delivery is created.

## 4. Repair Delivery Workflow
- When creating a repair delivery, the text field is mandatory and must describe the bike problem.
- For repair deliveries, show the relevant date as **Created at** instead of rental date.
- The repair delivery age should be color-coded:
  - green = created today
  - older = progressively more red

### After Repair Delivery Is Finished
- Create a new section on Home called **Repair Requests**.
- When a repair delivery is finished, automatically create a repair request entry there.
- The repair request must include:
  - arrival date
  - text/problem description
- Only Mechanics can take and handle repair requests.
- Also create a one-time shop task:
  - `Change bike in system to "repair"`

## 5. Image Uploads
- Add image upload support for:
  - Excursions
  - Nice to know
- Requirements:
  - max file size: 5 MB
  - allow file upload
  - allow camera prompt via photo icon
  - direct photo capture from device camera
  - cropping should be supported if possible

## 6. Nice to Know Categories
- Add predefined categories for sorting Nice to know entries.
- Initial categories:
  - BRM (Bike Rental Manager)
  - Bikes
  - Shop
  - General

