# 📚 Simple Navigation Bar Specification

This markdown defines the **structure and behavior** of the simplified navigation bar for the Bike Sensations Organizer App.

---

## 🔧 General Concept

The app uses a **bottom-fixed navigation bar** with **three main tabs**. Each tab routes the user to a specific section. The interface is designed to be responsive and accessible, with clean icons and labels.

---

## 🧭 Tabs & Structure

| Icon | Label          | Route Path     | Visible To |
|------|----------------|----------------|-------------|
| 🚚   | Requests       | `/requests`     | All Users   |
| 📝   | Notes          | `/notes`        | All Users   |
| 👤   | Profile/Admin  | `/profile`      | All Users (Admin sees more content) |

---

## 📐 Design Guidelines

- **Position**: Fixed at bottom of the screen
- **Layout**: Horizontal row with 3 equally spaced buttons
- **Style**: Minimal, readable, slightly rounded buttons/icons
- **Active Tab Highlight**: e.g., colored underline or background
- **Responsiveness**: 
  - On mobile: full-width buttons with larger icons
  - On desktop: compact, centered

---

## ⚙️ Functional Requirements

- Each tab acts as a **React Router link** (e.g., using `<NavLink>` from `react-router-dom`)
- Active tab is visually distinct
- The "Profile/Admin" tab opens a page where:
  - Users can:
    - Create/Edit jokes
    - Add "Nice to Know" entries (depends on the role)
    - Manage users (optional future extension) (if admin)
    - Create Users (if Admin)
    - Add Daily Task (depends on role)

---

## 🧪 Optional Enhancements

- Support for user roles (to show/hide admin options)
- Icons from Lucide, Heroicons or FontAwesome
- Transition animations (e.g., with Framer Motion)

---

## 🏁 Summary

This simple 3-tab navigation should be easily implemented using standard React + Tailwind techniques, and enhanced progressively if needed. It provides fast access to core app functionality with minimal clutter.
