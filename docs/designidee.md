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

* 🏠 Home

* 🚚 Bike Requests

* 📝 Notizen

* ⚙️ Admin/Profile

* <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M40-120v-200h80v120h120v80H40Zm680 0v-80h120v-120h80v200H720ZM160-240v-480h80v480h-80Zm120 0v-480h40v480h-40Zm120 0v-480h80v480h-80Zm120 0v-480h120v480H520Zm160 0v-480h40v480h-40Zm80 0v-480h40v480h-40ZM40-640v-200h200v80H120v120H40Zm800 0v-120H720v-80h200v200h-80Z"/></svg> Barcode Scanner

* <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M456-600h320q-27-69-82.5-118.5T566-788L456-600Zm-92 80 160-276q-11-2-22-3t-22-1q-66 0-123 25t-101 67l108 188ZM170-400h218L228-676q-32 41-50 90.5T160-480q0 21 2.5 40.5T170-400Zm224 228 108-188H184q27 69 82.5 118.5T394-172Zm86 12q66 0 123-25t101-67L596-440 436-164q11 2 21.5 3t22.5 1Zm252-124q32-41 50-90.5T800-480q0-21-2.5-40.5T790-560H572l160 276ZM480-480Zm0 400q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z"/></svg> Foto-Absicherung

**Stil:**

Navigationsleiste siehe docs wireframe.

