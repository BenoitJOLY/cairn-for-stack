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

// ai-question-client.js — Prend une liste de "requests" (une consigne précise
// par question : type + difficulté + mini-prompt de l'enseignant), plus
// éventuellement le Markdown du cours comme contexte facultatif, et fournit
// DEUX façons d'obtenir le contenu rédigé par une IA :
//   1. Mode manuel copier/coller (buildAIPromptText + adaptPastedAIResponse) —
//      AUCUNE clé API requise : le prompt est affiché à l'enseignant, qui le
//      colle lui-même dans l'IA de son choix (Claude, ChatGPT, etc. — même
//      un abonnement grand public suffit), puis colle la réponse ici.
//   2. Mode automatique (generateQuestionsFromMarkdown) — appelle directement
//      un fournisseur IA compatible OpenAI avec une clé API personnelle,
//      pour ceux qui en ont déjà une. Toujours reçue à chaque appel,
//      transmise une seule fois au fournisseur puis oubliée, jamais stockée
//      côté serveur.
// Dans les deux cas, la réponse JSON est adaptée via ai-question-adapter.js
// pour obtenir des cfg.questions garantis conformes au format réel de
// l'appli — l'IA ne rédige jamais le format, seulement le contenu. Sans
// dépendance npm (pas de jsonrepair : petite réparation JSON maison, pour que
// ce script reste utilisable sans "npm install").

'use strict';

const { buildPrompt, adaptAIQuestion } = require('./ai-question-adapter.js');

const MAX_MARKDOWN_CHARS = 45000;

// ── Petite réparation JSON "maison" (pas de dépendance npm ici) : tente le
// parse direct, puis recadre sur { ... }, puis retire les virgules traînantes. ─
function tryParseJson(raw) {
  const stripped = raw.replace(/```(?:json)?\s*([\s\S]*?)```/i, '$1').trim();
  const attempts = [stripped];
  const firstBrace = stripped.indexOf('{');
  const lastBrace = stripped.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) attempts.push(stripped.slice(firstBrace, lastBrace + 1));
  const withoutTrailingCommas = (s) => s.replace(/,(\s*[\]}])/g, '$1');
  attempts.push(withoutTrailingCommas(attempts[attempts.length - 1]));
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (e) { /* essai suivant */ }
  }
  throw new Error(
    'Réponse IA non exploitable (JSON invalide même après réparation). Début de la réponse reçue :\n' +
    stripped.slice(0, 400)
  );
}

// ── Filtre/valide les consignes (communes aux 3 modes ci-dessous). ────────
function cleanUpRequests(requests) {
  const cleanRequests = (requests || []).filter((r) => r && r.type && typeof r.prompt === 'string' && r.prompt.trim());
  if (!cleanRequests.length) {
    throw new Error('Ajoute au moins une question à générer (type + mini-consigne).');
  }
  return cleanRequests;
}

function truncateMarkdown(markdown) {
  let md = typeof markdown === 'string' ? markdown : '';
  let truncatedNotice = '';
  if (md.length > MAX_MARKDOWN_CHARS) {
    md = md.slice(0, MAX_MARKDOWN_CHARS);
    truncatedNotice = ` (cours tronqué à ${MAX_MARKDOWN_CHARS} caractères pour tenir dans la requête IA)`;
  }
  return { md, truncatedNotice };
}

// ── Relie les questions renvoyées par l'IA (tableau brut) à leurs consignes
// d'origine via le champ "id", puis les adapte au format réel de l'appli. ──
function matchAndAdapt(rawQuestions, cleanRequests, I18N) {
  const byId = {};
  rawQuestions.forEach((q) => { if (q && q.id != null) byId[String(q.id)] = q; });
  return cleanRequests.map((r) => {
    const raw = byId[String(r.id)];
    if (!raw) {
      throw new Error(
        `L'IA n'a pas renvoyé de question pour la consigne #${r.id} (type "${r.type}") ` +
        '(réessaie, ou reformule la consigne).'
      );
    }
    return adaptAIQuestion(raw, I18N, `#${r.id} (${r.type})`);
  });
}

// ── Mode manuel copier/coller, étape 1 : construit le texte du prompt à
// copier vers l'IA de son choix. AUCUNE clé API, AUCUN appel réseau ici. ───
function buildAIPromptText({ markdown, requests, matiere, niveau }) {
  const cleanRequests = cleanUpRequests(requests);
  const { md, truncatedNotice } = truncateMarkdown(markdown);
  const promptText = buildPrompt({ markdown: md, requests: cleanRequests, matiere, niveau });
  return { promptText, truncatedNotice };
}

// ── Mode manuel copier/coller, étape 2 : adapte le texte que l'enseignant a
// collé depuis sa conversation IA (même réparation JSON que le mode
// automatique, car un chat IA entoure souvent sa réponse de texte/```json). ─
function adaptPastedAIResponse({ rawText, requests, I18N }) {
  const cleanRequests = cleanUpRequests(requests);
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error("Colle la réponse de l'IA avant d'importer.");
  }
  const parsed = tryParseJson(rawText);
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error('Réponse IA : champ "questions" (tableau) absent ou invalide.');
  }
  return matchAndAdapt(parsed.questions, cleanRequests, I18N);
}

async function callProvider(ai, promptText, totalN) {
  if (!ai || !ai.key) throw new Error("Clé API IA manquante (renseigne-la dans les réglages IA).");
  if (!ai.baseUrl) throw new Error("URL de base du fournisseur IA manquante (réglages IA).");
  if (!ai.model) throw new Error('Modèle IA manquant (réglages IA).');

  let res;
  try {
    res = await fetch(ai.baseUrl.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ai.key },
      body: JSON.stringify({
        model: ai.model,
        messages: [{ role: 'user', content: promptText }],
        max_tokens: Math.min(8000, 800 + 700 * totalN),
      }),
    });
  } catch (err) {
    throw new Error('Fournisseur IA injoignable : ' + err.message);
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Erreur du fournisseur IA (HTTP ${res.status}) : ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('Réponse IA vide.');
  return content;
}

// ── Point d'entrée : renvoie un tableau de {type, params} prêt pour
// cfg.questions, dans le même ordre que `requests` (une consigne = une
// question, reliée à sa réponse IA via le champ "id"). ────────────────────
async function generateQuestionsFromMarkdown({ markdown, requests, ai, matiere, niveau, I18N }) {
  const cleanRequests = cleanUpRequests(requests);
  const { md, truncatedNotice } = truncateMarkdown(markdown);

  const promptText = buildPrompt({ markdown: md, requests: cleanRequests, matiere, niveau });
  const rawContent = await callProvider(ai, promptText, cleanRequests.length);
  const parsed = tryParseJson(rawContent);
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error('Réponse IA : champ "questions" (tableau) absent ou invalide.');
  }

  const result = matchAndAdapt(parsed.questions, cleanRequests, I18N);
  if (truncatedNotice) console.warn('[cairnforstack]' + truncatedNotice);
  return result;
}

module.exports = { generateQuestionsFromMarkdown, buildAIPromptText, adaptPastedAIResponse };
