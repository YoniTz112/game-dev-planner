const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ atividades: [] }, null, 2));
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro lendo data.json', e);
    return { atividades: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Erro escrevendo data.json', e);
    return false;
  }
}

app.get('/api/atividades', (req, res) => {
  const data = readData();
  res.json(data.atividades || []);
});

app.post('/api/atividades', (req, res) => {
  const data = readData();
  const incoming = req.body;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: 'Expected an array' });
  data.atividades = incoming;
  if (writeData(data)) return res.json({ ok: true });
  res.status(500).json({ error: 'failed to write file' });
});

// simple health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
