import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// JSON-Body-Parsing erlauben (für POST später)
app.use(express.json());

// API: GET alle Bike-Anfragen
app.get('/api/bike-requests', (req, res) => {
  const filePath = path.join(__dirname, '../data/bikeRequests.json');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Datei konnte nicht gelesen werden.' });
    }
    res.json(JSON.parse(data));
  });
});

// OPTIONAL: API POST (neue Anfrage hinzufügen)
app.post('/api/bike-requests', (req, res) => {
  const filePath = path.join(__dirname, '../data/bikeRequests.json');
  const newEntry = req.body;

  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Fehler beim Lesen.' });

    const requests = JSON.parse(data);
    newEntry.id = requests.length + 1;
    requests.push(newEntry);

    fs.writeFile(filePath, JSON.stringify(requests, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Fehler beim Speichern.' });
      res.status(201).json({ success: true, newEntry });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🚲 Bike-Request API läuft auf Port ${PORT}`);
});
