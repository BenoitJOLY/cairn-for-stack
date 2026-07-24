const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_LIMIT = 5;

function loadUsage() {
  if (!fs.existsSync(USAGE_FILE)) return {};
  return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
}

function saveUsage(usage) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

// Fenêtre glissante de 7 jours, comptée par compte — voir PLAN.md, section
// auto-inscription. N'appelle jamais recordUsage() ici : lecture seule,
// pour vérifier le quota avant de générer.
function isUnderQuota(username) {
  const usage = loadUsage();
  const now = Date.now();
  const timestamps = (usage[username] || []).filter((t) => now - t < WEEK_MS);
  return timestamps.length < WEEKLY_LIMIT;
}

// N'enregistrer qu'après une génération réussie (voir server.js) — une
// requête invalide ou une erreur serveur ne doit pas consommer le quota.
function recordUsage(username) {
  const usage = loadUsage();
  const now = Date.now();
  const timestamps = (usage[username] || []).filter((t) => now - t < WEEK_MS);
  timestamps.push(now);
  usage[username] = timestamps;
  saveUsage(usage);
}

module.exports = { isUnderQuota, recordUsage, WEEKLY_LIMIT };
