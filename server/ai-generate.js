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

// Génération IA v1 — scopée à RA (radio/algébrique) et DD (drag&drop), les
// deux seuls types ayant déjà un import JSON existant côté client
// (js/prompt.js, applyRAJSON/applyDDJSON). Cascade de clé : institutionnelle
// (server/instance-config.js) → personnelle du compte (server/accounts.js) →
// {fallback:true} (pas une erreur : signal au client de revenir au flux
// manuel window.prompt() déjà en place) — voir plan §8.
const { jsonrepair } = require('jsonrepair');
const instanceConfig = require('./instance-config');
const accounts = require('./accounts');

function resolveCredentials(username) {
  const pub = instanceConfig.getPublicConfig();
  const instKey = instanceConfig.getSecret('aiKey');
  if (instKey) {
    return { tier: 'institutional', key: instKey, baseUrl: pub.ai.baseUrl, model: pub.ai.model };
  }
  const personalKey = accounts.getAiKey(username);
  if (personalKey) {
    const prov = accounts.getAiProvider(username);
    return {
      tier: 'personal',
      key: personalKey,
      baseUrl: prov.baseUrl || pub.ai.baseUrl,
      model: prov.model || pub.ai.model,
    };
  }
  return null;
}

function status(username) {
  const creds = resolveCredentials(username);
  return { available: !!creds, tier: creds ? creds.tier : 'none' };
}

// Formes attendues, telles que documentées dans le prompt construit par
// pbBuild() (js/prompt.js) : RA a un champ "xe" en plus de vrais/faux.
const SHAPES = {
  RA: (obj) => !!obj && typeof obj === 'object' && Array.isArray(obj.vrais) && Array.isArray(obj.faux)
    && obj.vrais.length > 0 && (typeof obj.xe === 'number' || typeof obj.xe === 'string'),
  DD: (obj) => !!obj && typeof obj === 'object' && Array.isArray(obj.vrais) && Array.isArray(obj.faux)
    && obj.vrais.length > 0,
};

async function generate(username, promptText, targetType) {
  if (!SHAPES[targetType]) {
    throw Object.assign(new Error('Type cible invalide.'), { status: 400 });
  }
  if (typeof promptText !== 'string' || !promptText.trim()) {
    throw Object.assign(new Error('Prompt manquant.'), { status: 400 });
  }
  const creds = resolveCredentials(username);
  if (!creds) return { fallback: true };
  if (!creds.baseUrl || !creds.model) {
    throw Object.assign(new Error('Fournisseur IA incomplet (URL de base / modèle manquant, voir réglages admin).'), { status: 500 });
  }

  let res;
  try {
    res = await fetch(creds.baseUrl.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + creds.key },
      body: JSON.stringify({ model: creds.model, messages: [{ role: 'user', content: promptText }] }),
    });
  } catch (err) {
    throw Object.assign(new Error('Fournisseur IA injoignable : ' + err.message), { status: 502 });
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw Object.assign(new Error(`Erreur du fournisseur IA (HTTP ${res.status}) : ${errText.slice(0, 300)}`), { status: 502 });
  }

  const data = await res.json();
  const raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw Object.assign(new Error('Réponse IA vide.'), { status: 502 });
  }

  const stripped = raw.replace(/```(?:json)?\s*([\s\S]*?)```/i, '$1').trim();
  let obj;
  try {
    obj = JSON.parse(jsonrepair(stripped));
  } catch (err) {
    throw Object.assign(new Error('Réponse IA non exploitable (JSON invalide même après réparation).'), { status: 502 });
  }
  if (!SHAPES[targetType](obj)) {
    throw Object.assign(new Error(`Forme JSON inattendue pour le type ${targetType}.`), { status: 502 });
  }
  return { fallback: false, data: obj };
}

module.exports = { status, generate };
