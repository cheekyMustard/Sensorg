# 🚴 Sensational Organiser App – Fahrplan

## 1. 📌 Konzeptphase

- [ ] Zielsetzung und Funktionsumfang klären
  - [ ] Klare Definition aller App-Ziele (siehe Instruktionen)
  - [ ] Featureliste validieren (aus beiden Dokumenten kombinieren)
  - [ ] Rollenmodell definieren (Admin, Mechaniker, Fahrer, etc.)

- [ ] Technologiestack festlegen
  - [ ] Frontend: React + Vite
  - [ ] Styling: TailwindCSS
  - [ ] Backend: Express (Node.js)
  - [ ] Datenbank: PostgreSQL
  - [ ] Auth: JWT

## 2. 🧩 Wireframe & UI/UX

- [ ] Grobes Design für alle Seiten
  - [ ] Login Page
  - [ ] Home mit:
    - [ ] Delivery Vorschau (zeitlich sortiert, Accordion, Farblogik)
    - [ ] Notes Vorschau (rollen- und prioritätsbasiert)
    - [ ] Zufallswitz (Meme oder Text)
    - [ ] "What else can be done"-Box
    - [ ] "Nice to know"-Box
  - [ ] Seitenstruktur:
    - [ ] Notes
    - [ ] Delivery
    - [ ] Admin
    - [ ] Witze Sammlung
    - [ ] Barcode Scanner fuer Inventur oder anderes.
    - [ ] Foto-absicherung bei Fahrradverleih (mit Signatureingabe)

## 3. 🔐 Authentifizierung & Rollen

- [ ] Backend Setup mit Express & JWT
- [ ] User Modell mit Rollen:
  - [ ] Mechanic, Driver, Manager, Cleaner, Organiser, Seller, socialmedia etc.
- [ ] Login-/Sessionlogik mit Frontend verknüpfen
- [ ] Zugriffsrechte und Darstellung je nach Rolle

## 4. 📦 Datenbankmodellierung

- [ ] PostgreSQL Tabellen:
  - [ ] `shops`
  - [ ] `users`
  - [ ] `bikes`
  - [ ] `requests`
  - [ ] `request_bikes`
  - [ ] `request_audit_log`
- [ ] Indizes (z. B. pg_trgm für Bikes)
- [ ] Seed-Daten: Zwei Shops, ein Admin, Beispiel-Bikes

## 5. 🛠 Funktionale Features – Kernmodule

### 5.1 📬 Delivery-System

- [ ] Bike Delivery Anfrage erstellen (AddModal, FAB)
- [ ] Accordion für Deliveries auf Home
- [ ] Farblogik nach Fälligkeit
- [ ] Statuswechsel mit ConfirmDialog
- [ ] Editieren/Löschen direkt auf Home
- [ ] Autosuggest für Bikes (Tags-Input)
- [ ] Audit-Log für Statuswechsel

### 5.2 📝 Notes-System

- [ ] Allgemeine Notizen (Material, Reparatur etc.)
- [ ] Checkbox: open, in progress, done
- [ ] Prioritäten: Low, Medium, High
- [ ] Creator/Editor System
- [ ] Antwortbereich (andersfarbig)
- [ ] Archivfunktion für alte Einträge

### 5.3 ✅ What else can be done

- [ ] Tägliche/wiederkehrende Aufgaben
- [ ] Typen: Daily, 2nd Day, now and again, every X day
- [ ] Als erledigt markieren

### 5.4 💡 Nice to know

- [ ] Admins & berechtigte User können Inhalte posten
- [ ] Wissenswerte Einträge zu Technik, Verhalten, etc.

### 5.5 😂 Witze & Memes

- [ ] Täglich ein Witz/Meme auf Home anzeigen
- [ ] User können eigene Beiträge hochladen

## 6. 🖼️ Upload- & Medienhandling

- [ ] Foto-Absicherung bei Vermietung:
  - [ ] Upload-Funktion mit Bike-Zuordnung
  - [ ] Speicherung & Einsicht

## 7. 🧑‍💼 Adminbereich

- [ ] Benutzer anlegen mit Rollen
- [ ] Übersicht & Verwaltung 
- [ ] Rechtezuweisung
- [ ] Passwort ändern / zurücksetzen


## 8. 📱 Profilseite

- [ ] Erstellen von Witzen
- [ ] Anzeige vo laufenden Requests oder notes die man angenommen hat
- [ ] Mögliche Anzeige von vergangenen abgeschlossenen Requests oder Notes
- [ ] Nice to know & What else can be done Erstellen (nur admins oder berechtigte User)

## 9. 🧪 Testing & Validierung

- [ ] Unit Tests Backend (z. B. mit Jest)
- [ ] Integrationstests API
- [ ] End-to-End Tests (Cypress o. ä.)
- [ ] Manuelles Durchtesten aller Rollen

## 10. 🗃️ Deployment & Hosting

- [ ] Umgebungen vorbereiten (Dev / Prod)
- [ ] Deployment-Strategie:
  - [ ] Frontend (z. B. Vercel oder eigener Server)
  - [ ] Backend (z. B. Render, Railway, eigener VPS)
  - [ ] PostgreSQL Datenbank (z. B. Supabase, ElephantSQL)
- [ ] .env Setup mit Secrets

## 11. 📖 Dokumentation

- [ ] Developer-Doku (README, API-Routen, .env Beispiele)
- [ ] User-Doku (Kurzanleitung für Mitarbeitende)
- [ ] Änderungsprotokoll (Changelog.md)

## 12. 🔄 Iterative Verbesserungen

- [ ] UX-Feedback von Mitarbeitenden einholen
- [ ] Features nachrüsten / verschlanken
- [ ] Performanceoptimierung

---

**Siehe auch:**  
- [docs/instructions.md](./instructions.md) für detaillierte technische Vorgaben und Sprint-Ziele.
## 12. 🔄 Iterative Verbesserungen

- [ ] UX-Feedback von Mitarbeitenden einholen
- [ ] Features nachrüsten / verschlanken
- [ ] Performanceoptimierung
  - [ ] Frontend (z. B. Vercel oder eigener Server)
  - [ ] Backend (z. B. Render, Railway, eigener VPS)
  - [ ] PostgreSQL Datenbank (z. B. Supabase, ElephantSQL)
- [ ] .env Setup mit Secrets

## 11. 📖 Dokumentation

- [ ] Developer-Doku (README, API-Routen, .env Beispiele)
- [ ] User-Doku (Kurzanleitung für Mitarbeitende)
- [ ] Änderungsprotokoll (Changelog.md)

## 12. 🔄 Iterative Verbesserungen

- [ ] UX-Feedback von Mitarbeitenden einholen
- [ ] Features nachrüsten / verschlanken
- [ ] Performanceoptimierung
