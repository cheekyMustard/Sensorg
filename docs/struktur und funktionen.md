# ✅ ToDo-Liste für BikeApp

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
        - [ ] mechanic  
        - [ ] driver  
        - [ ] manager  
        - [ ] socialmedia  
        - [ ] organiser
        - [ ] seller
        - [ ] cleaner 
  - [ ] Profile   
    - [ ] Witze-Sammlung  
      - [ ] Hinzufügen von Witzen (Bild oder Text)
  - [ ] Barcode-Scanner
    - [ ] Einfacher Barcode Scanner zum schnellen Kopieren und einfügen und Teilen mit anderen
  - [ ] Foto-Check
    - [ ] Datenbank mit Fotos mit Bezug zum Mieter/Kunden, Temporär, bis zum nächsten ausleihen, um Werkschäden zu prüfen.


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
      - [ ] Beim Klick auf "done" -> Frage, ob Bike im System umgelegt wurde. Falls ja, auf "done" setzen, Falls nein -> auf "in Progress" lassen  
  - [ ] Datenbankeinträge:  
    - [ ] Creator  
    - [ ] Editor (der die delivery annimmt)  
    - [ ] Date  
    - [ ] Status   

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
    - [ ] Editor kann bearbeiten  
  - [ ] Wenn Status auf "done":  
    - [ ] Bleibt 1 Tag auf Startseite und Notes-Page unter allen offenen oder in progress  
  - [ ] Alte Einträge ins Archiv:  
    - [ ] Einsicht für Creator, Editor und Admin über Notes-Seite  

- [ ] "What else can be done" Box  
  - [ ] Auf Startseite und Unterseite verfügbar  
  - [ ] Datenbankeinträge durch Admin oder bestimmte Mitarbeiter eintragbar  
  - [ ] Sind meistens Shop-Bezogen
  - [ ] wenn "in progress" kann es nicht von anderen übernommen werden
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

- [ ] Barcode Scanner
  - [ ] Fuer Inventur
     
- [ ] Foto-Check
  - [ ] Zur Absicherung, falls Fahrrad zurueck kommt und nicht sicher ist, woher Schaeden kamen.
  - [ ] Temporaere Datenbank mit Bild, Fahrrad und Name des Kunden bis Fahrrad erneut ausgeliehen wird, um zu prüfen, ob keine Lagerschäden entstanden sind.
