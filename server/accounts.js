/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
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
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('./secrets');

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

const VALID_ROLES = ['admin', 'validateur'];

function createAccount(username, password, opts) {
  opts = opts || {};
  if (opts.role != null && !VALID_ROLES.includes(opts.role)) {
    throw new Error(`Rôle "${opts.role}" invalide (attendu: ${VALID_ROLES.join('|')}).`);
  }
  const accounts = loadAccounts();
  if (accounts.some((a) => a.username === username)) {
    throw new Error(`Le compte "${username}" existe déjà.`);
  }
  accounts.push({
    username,
    passwordHash: bcrypt.hashSync(password, 12),
    selfRegistered: !!opts.selfRegistered,
    role: opts.role || null,
  });
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

// Rôle unique par compte (null = enseignant). 'admin' est traité comme un
// sur-ensemble de 'validateur' par les middlewares côté serveur (server.js),
// pas ici — cette fonction retourne le rôle brut tel qu'enregistré.
function getRole(username) {
  const account = loadAccounts().find((a) => a.username === username);
  return (account && account.role) || null;
}

function setRole(username, role) {
  if (role != null && !VALID_ROLES.includes(role)) {
    throw new Error(`Rôle "${role}" invalide (attendu: ${VALID_ROLES.join('|')}).`);
  }
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.username === username);
  if (!account) throw new Error(`Le compte "${username}" n'existe pas.`);
  account.role = role || null;
  saveAccounts(accounts);
}

// Clé IA personnelle par compte (repli après la clé institutionnelle — voir
// plan §8), chiffrée au repos via server/secrets.js. Jamais renvoyée en HTTP.
function setAiKey(username, value) {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.username === username);
  if (!account) throw new Error(`Le compte "${username}" n'existe pas.`);
  account.aiKeyEncrypted = value ? encrypt(value) : null;
  saveAccounts(accounts);
}

function clearAiKey(username) {
  setAiKey(username, null);
}

function hasAiKey(username) {
  const account = loadAccounts().find((a) => a.username === username);
  return !!(account && account.aiKeyEncrypted);
}

function getAiKey(username) {
  const account = loadAccounts().find((a) => a.username === username);
  if (!account || !account.aiKeyEncrypted) return null;
  return decrypt(account.aiKeyEncrypted);
}

// Fournisseur perso optionnel (baseUrl/model) : si absents, la cascade IA
// hérite des valeurs institutionnelles non-secrètes (server/ai-generate.js).
function setAiProvider(username, fields) {
  const accounts = loadAccounts();
  const account = accounts.find((a) => a.username === username);
  if (!account) throw new Error(`Le compte "${username}" n'existe pas.`);
  account.aiBaseUrl = (fields && fields.baseUrl) || '';
  account.aiModel = (fields && fields.model) || '';
  saveAccounts(accounts);
}

function getAiProvider(username) {
  const account = loadAccounts().find((a) => a.username === username);
  return { baseUrl: (account && account.aiBaseUrl) || '', model: (account && account.aiModel) || '' };
}

module.exports = {
  loadAccounts, saveAccounts, createAccount, verifyPassword, isSelfRegistered, deleteAccount,
  getRole, setRole, VALID_ROLES,
  setAiKey, clearAiKey, hasAiKey, getAiKey, setAiProvider, getAiProvider,
};
