Super, Jan\! Wir kombinieren jetzt:

1. **Das Design vom Logo**

2. **Die Instruktionen aus der PDF**

3. **Deinen Wunsch für eine Landingpage mit unterer Navigation und mittig gestapelten Boxen**

---

### **🧱 1\. Farb- & Designschema von Bike Sensations**

Aus dem Logo entnehme ich folgende Hauptfarben:

| Element | Farbe | Verwendungszweck |
| ----- | ----- | ----- |
| Hintergrund (Sonnenuntergang) | `#F37C25` – kräftiges Orange | Header-Akzent, CTA-Buttons |
| Palmen | `#1EB865` – sattes Grün | Icons, kleinere Akzente, Hover-Farben |
| Schriftzug “Sensations” | `#D1BBA2` – Beige/Steinfarben | Hintergrundcontainer, Cards |
| Schwarz (Schatten etc.) | `#2D2D2D` – Dunkelgrau | Text, Menü, Icons |

Das Design wirkt aktiv, outdoor-orientiert, humorvoll und energiegeladen – perfekt für eure Firma 🌴🚴‍♂️

---

### **📲 2\. Struktur & Design der Landingpage**

#### **➤ Layout-Aufbau**

css  
CopyEdit  
`┌───────────────────────────────┐`  
`│         Header (optional)     │`  
`├───────────────────────────────┤`  
`│                               │`  
`│    Main Content (mittig)      │`  
`│    ┌──────────────────────┐   │`  
`│    │  Delivery Requests   │   │`  
`│    ├──────────────────────┤   │`  
`│    │  Notes (To-Dos)      │   │`  
`│    ├──────────────────────┤   │`  
`│    │  Nice-to-know Feed   │   │`  
`│    ├──────────────────────┤   │`  
`│    │  Witz des Tages      │   │`  
`│    └──────────────────────┘   │`  
`│                               │`  
`├───────────────────────────────┤`  
`│    Bottom Navigation Bar      │`  
`└───────────────────────────────┘`

#### **➤ TailwindCSS Farben-Vorschlag**

ts  
CopyEdit  
`// tailwind.config.js (Ausschnitt)`  
`colors: {`  
  `primary: '#F37C25',     // Orange`  
  `accent: '#1EB865',      // Grün`  
  `neutral: '#2D2D2D',     // Dunkelgrau`  
  `base: '#D1BBA2',        // Beige`  
`}`

---

### **💡 3\. Erste UI-Komponenten (Box-Ideen)**

| Box-Titel | Inhalt | Farbdesign |
| ----- | ----- | ----- |
| 🚚 **Delivery Requests** | Offene Lieferanfragen zwischen Shops | Base-Hintergrund, primary border |
| 📝 **Notes** | To-Dos, Hinweise vom Shop-Team | Neutral Text, base Box |
| 🚲 **Nice to know** | Wissen über Exkursionen, Bikes, Tipps | Accent header, base body |
| 😂 **Witz des Tages** | Täglicher Lacher fürs Team | Orange Text auf hellem Hintergrund |

---

### **⚙️ Navigation am unteren Bildschirmrand**

#### **Buttons z. B.:**

* 🏠 Start

* 🚚 Anfragen

* 📝 Notizen

* ➕ Neues

* ⚙️ Admin

**Stil:**

* Vollflächiger Balken am unteren Bildschirmrand

* Icons \+ Labels

* Aktiver Tab farbig hervorgehoben (Orange)

