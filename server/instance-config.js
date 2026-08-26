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
const { encrypt, decrypt } = require('./secrets');

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'instance-config.json');

const DEFAULTS = {
  mutualisation: {
    ghOwner: '', ghRepo: '', ghReviewBranch: '', ghReviewFolder: '',
    ghBanqueFolder: '', ghBanqueBranch: '',
  },
  maximaUrl: '',
  jsmolUrl: '',
  // URL optionnelle d'un JSON personnalisé d'arborescence de tags (voir
  // js/tags-data/_modele.js pour le format attendu). Vide = l'appli garde
  // l'arborescence codée en dur de js/tags-data/<langue>.js.
  tagsUrl: '',
  ai: { baseUrl: '', model: '' },
  // Affiché dans la modale "Mentions légales" (RGPD) côté client. Le responsable
  // de traitement est qui héberge/administre CETTE instance, jamais l'auteur du
  // logiciel Cairn for Stack — chaque exploitant renseigne ses propres coordonnées et
  // son autorité de contrôle nationale (CNIL en France, mais Cairn for Stack est
  // destiné à des déploiements internationaux).
  legal: {
    responsableNom: '', responsableEmail: '', pays: '',
    autoriteNom: '', autoriteUrl: '',
  },
  secrets: { ghInstitutionalToken: null, aiApiKey: null },
};

function load() {
  if (!fs.existsSync(CONFIG_FILE)) return JSON.parse(JSON.stringify(DEFAULTS));
  const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  return {
    mutualisation: Object.assign({}, DEFAULTS.mutualisation, raw.mutualisation),
    maximaUrl: raw.maximaUrl || '',
    jsmolUrl: raw.jsmolUrl || '',
    tagsUrl: raw.tagsUrl || '',
    ai: Object.assign({}, DEFAULTS.ai, raw.ai),
    legal: Object.assign({}, DEFAULTS.legal, raw.legal),
    secrets: Object.assign({}, DEFAULTS.secrets, raw.secrets),
  };
}

function save(cfg) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

// Contrat write-only : les secrets ne sont jamais renvoyés, seulement des
// booléens "configuré/non configuré" — voir plan, principe de secret.
function getPublicConfig() {
  const cfg = load();
  return {
    mutualisation: cfg.mutualisation,
    maximaUrl: cfg.maximaUrl,
    jsmolUrl: cfg.jsmolUrl,
    tagsUrl: cfg.tagsUrl,
    ai: cfg.ai,
    legal: cfg.legal,
    ghTokenConfigured: !!cfg.secrets.ghInstitutionalToken,
    aiKeyConfigured: !!cfg.secrets.aiApiKey,
  };
}

function setMutualisationConfig(fields) {
  const cfg = load();
  cfg.mutualisation = Object.assign({}, cfg.mutualisation, fields);
  save(cfg);
}

function setLegalConfig(fields) {
  const cfg = load();
  cfg.legal = Object.assign({}, cfg.legal, fields);
  save(cfg);
}

function setMaximaUrl(url) {
  const cfg = load();
  cfg.maximaUrl = String(url || '').trim();
  save(cfg);
}

function setJsmolUrl(url) {
  const cfg = load();
  cfg.jsmolUrl = String(url || '').trim();
  save(cfg);
}

function setTagsUrl(url) {
  const cfg = load();
  cfg.tagsUrl = String(url || '').trim();
  save(cfg);
}

function setAiProviderConfig(fields) {
  const cfg = load();
  cfg.ai = Object.assign({}, cfg.ai, fields);
  save(cfg);
}

const SECRET_KEYS = { ghToken: 'ghInstitutionalToken', aiKey: 'aiApiKey' };

function setSecret(name, value) {
  if (!SECRET_KEYS[name]) throw new Error(`Secret "${name}" inconnu.`);
  const cfg = load();
  cfg.secrets[SECRET_KEYS[name]] = value ? encrypt(value) : null;
  save(cfg);
}

function clearSecret(name) {
  setSecret(name, null);
}

// Jamais exposé en HTTP — usage interne uniquement (promotion GitHub, appel IA).
function getSecret(name) {
  if (!SECRET_KEYS[name]) throw new Error(`Secret "${name}" inconnu.`);
  const cfg = load();
  const payload = cfg.secrets[SECRET_KEYS[name]];
  return payload ? decrypt(payload) : null;
}

module.exports = {
  getPublicConfig, setMutualisationConfig, setMaximaUrl, setJsmolUrl, setTagsUrl, setAiProviderConfig, setLegalConfig,
  setSecret, clearSecret, getSecret,
};
