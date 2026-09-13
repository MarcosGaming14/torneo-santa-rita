const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware: permitir peticiones desde tu app y entender JSON
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'torneo.json');

// Asegurar que la carpeta de datos exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- Funciones auxiliares ---
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { console.error('Error leyendo datos:', e); }
  return { results: {}, scorers: {}, lastUpdate: null };
}

function writeData(data) {
  data.lastUpdate = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Rutas de la API ---

// 1. Health check (útil para que el servicio no se duerma)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Obtener todos los datos del torneo
app.get('/api/torneo', (req, res) => {
  res.json(readData());
});

// 3. Guardar o actualizar un resultado
app.post('/api/resultado', (req, res) => {
  const { matchId, home, away, scorers } = req.body;
  if (!matchId || !Number.isFinite(home) || !Number.isFinite(away)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const data = readData();
  data.results[matchId] = [home, away];
  if (scorers && (scorers.home || scorers.away)) {
    data.scorers[matchId] = scorers;
  }
  writeData(data);
  res.json({ ok: true, data });
});

// 4. Eliminar un resultado
app.delete('/api/resultado/:matchId', (req, res) => {
  const data = readData();
  delete data.results[req.params.matchId];
  delete data.scorers[req.params.matchId];
  writeData(data);
  res.json({ ok: true, data });
});

// 5. Reiniciar todos los datos (útil para pruebas)
app.post('/api/reset', (req, res) => {
  writeData({ results: {}, scorers: {} });
  res.json({ ok: true });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
