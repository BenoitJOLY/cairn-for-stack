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

function createAccount(username, password) {
  const accounts = loadAccounts();
  if (accounts.some((a) => a.username === username)) {
    throw new Error(`Le compte "${username}" existe déjà.`);
  }
  accounts.push({ username, passwordHash: bcrypt.hashSync(password, 12) });
  saveAccounts(accounts);
}

function verifyPassword(username, password) {
  const account = loadAccounts().find((a) => a.username === username);
  if (!account) return false;
  return bcrypt.compareSync(password, account.passwordHash);
}

module.exports = { loadAccounts, saveAccounts, createAccount, verifyPassword };
