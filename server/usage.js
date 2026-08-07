/*
 * StackForge — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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

// Droit à l'effacement (RGPD) — appelée avec deleteAccount() (accounts.js)
// pour ne laisser aucune trace d'usage une fois le compte supprimé.
function deleteUsage(username) {
  const usage = loadUsage();
  delete usage[username];
  saveUsage(usage);
}

module.exports = { isUnderQuota, recordUsage, deleteUsage, WEEKLY_LIMIT };
