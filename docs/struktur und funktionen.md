# ✅ ToDo-Liste für BikeApp Wireframe und Funktionen

## Wireframe Designen

- [ ] Grundlegende Struktur darstellen  
  - [ ] Einfache Login Page  
  - [ ] Home  
    - [ ] Direkte Darstellung von anstehenden oder laufenden Deliveries mit dem naheliegensten Datum  
    - [ ] Direkte Darstellung von Notes (abhängig von Benutzerrolle und Priorität)  
    - [ ] 1 zufälliger Witz/Text oder Meme von Benutzern anzeigen  
  - [ ] Notes  
  - [ ] Delivery  
  - [ ] Admin (gleicher Button wie Profile, aber mit zusätzlichen Optionen für Admins)  
    - [ ] Create User  
      - [ ] Name  
      - [ ] Password  
      - [ ] Role (mehrfach möglich):  
        - [ ] Mechanic  
        - [ ] Driver  
        - [ ] Manager  
        - [ ] Cleaner  
        - [ ] Weitere...  
  - [ ] Profile  
    - [ ] Profilbild und Name bearbeiten  
    - [ ] Witze-Sammlung  
      - [ ] Hinzufügen von Witzen (Bild oder Text)  

## Funktionen der App

- [ ] Bike Delivery Anfragen  
  - [ ] Von A -> B  
  - [ ] Welches Bike  
  - [ ] Benötigtes Datum + Dauer des Rentals  
  - [ ] Checkboxen mit Prozessstatus:  
    - [ ] open  
    - [ ] in progress  
      - [ ] Reminder am Schichtanfang und -ende für zugewiesene Benutzer  
    - [ ] done  
      - [ ] Beim Klick auf "open" -> Frage, ob Bike im System umgelegt wurde. Falls ja, auf "done" setzen  

- [ ] Allgemeine Notizen im jeweiligen Shop  
  - [ ] Materialanfrage  
  - [ ] Reperaturanfrage  
  - [ ] Sonstige Frage  
  - [ ] Checkbox:  
    - [ ] open  
    - [ ] in progress  
    - [ ] done  
  - [ ] Prioritäten:  
    - [ ] low  
    - [ ] medium  
    - [ ] high  
  - [ ] Datenbankeinträge:  
    - [ ] Creator  
    - [ ] Editor (der die Note annimmt)  
    - [ ] Date  
    - [ ] Status  
    - [ ] Priority  
    - [ ] Content  
  - [ ] Inhalt:  
    - [ ] Creator kann Inhalt bearbeiten  
    - [ ] Editor kann bearbeiten → Änderungen werden sichtbar in anderer Schrift/Farbe dargestellt  
  - [ ] Wenn Status auf "done":  
    - [ ] Bleibt 1 Tag auf Startseite und Notes-Page unter allen offenen oder in progress  
  - [ ] Alte Einträge ins Archiv:  
    - [ ] Einsicht für Creator, Editor und Admin über Notes-Seite  

- [ ] "What else can be done" Box  
  - [ ] Auf Startseite und Unterseite verfügbar  
  - [ ] Datenbankeinträge durch Admin oder bestimmte Mitarbeiter eintragbar  
  - [ ] Kategorien:  
    - [ ] Daily Check  
      - [ ] Check Reservations for next Day  
    - [ ] Every 2nd Day  
      - [ ] Check Reservations for the coming Week  
    - [ ] Now and again  
      - [ ] Check Materials  
    - [ ] Every X Day  
      - [ ] Clean the Toilet  
  - [ ] Als erledigt markierbar → verschwindet für angegebene Tage  

- [ ] "Nice to Know" Box  
  - [ ] Auf Startseite  
  - [ ] Datenbankeinträge durch Admin oder bestimmte Mitarbeiter  
  - [ ] Inhalte:  
    - [ ] Wissenswertes über Fahrräder  
    - [ ] Technisches Wissen  
    - [ ] Tipps zur Reinigung  
    - [ ] Worauf man im Shop achten sollte  
