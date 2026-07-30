const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
}

function saveAccounts(accounts) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

function createAccount(username, password, opts) {
  opts = opts || {};
  const accounts = loadAccounts();
  if (accounts.some((a) => a.username === username)) {
    throw new Error(`Le compte "${username}" existe déjà.`);
  }
  accounts.push({ username, passwordHash: bcrypt.hashSync(password, 12), selfRegistered: !!opts.selfRegistered });
  saveAccounts(accounts);
}

function verifyPassword(username, password) {
  const account = loadAccounts().find((a) => a.username === username);
  if (!account) return false;
  return bcrypt.compareSync(password, account.passwordHash);
}

// Droit à l'effacement (RGPD) — supprime définitivement le compte. Le
// nettoyage des données d'usage associées (server/usage.js) est à la charge
// de l'appelant, pas de cette fonction (séparation des deux stores).
function deleteAccount(username) {
  const accounts = loadAccounts().filter((a) => a.username !== username);
  saveAccounts(accounts);
}

// Distingue les comptes créés via /api/register (auto-inscription, ouverte
// à tous) des comptes créés à la main via create-account.js (cercle
// restreint, confiance déjà établie) — seuls les premiers sont soumis au
// quota hebdomadaire, voir server/usage.js et PLAN.md.
function isSelfRegistered(username) {
  const account = loadAccounts().find((a) => a.username === username);
  return !!(account && account.selfRegistered);
}

module.exports = { loadAccounts, saveAccounts, createAccount, verifyPassword, isSelfRegistered, deleteAccount };
