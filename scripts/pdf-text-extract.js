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

// pdf-text-extract.js — Extraction de texte "maison" depuis un PDF, sans
// dépendance npm (cohérent avec scripts/build-question-server.js : outil
// double-clic, zéro installation). Ne remplace PAS un vrai moteur PDF
// (pdf.js...) : on décompresse les flux de contenu (FlateDecode) et on lit
// les opérateurs d'affichage de texte (Tj/TJ) directement, en supposant un
// encodage WinAnsi/Latin-1 standard. Limite connue et acceptée : un PDF
// utilisant des polices ré-encodées "sur mesure" (fréquent avec certains
// export LaTeX) ou un PDF scanné (image) donnera un texte incomplet ou
// illisible — c'est pourquoi le texte extrait reste TOUJOURS visible et
// modifiable dans la zone de texte avant envoi à l'IA (voir build-question-
// server.js), et qu'un avertissement est ajouté si l'extraction semble ratée.

'use strict';

const zlib = require('zlib');

// ── WinAnsiEncoding diffère de Latin-1 uniquement sur la plage 0x80-0x9F
// (ponctuation typographique, œ, €...) — fréquente en français. ───────────
const WINANSI_HIGH = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…',
  0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8A: 'Š',
  0x8B: '‹', 0x8C: 'Œ', 0x8E: 'Ž', 0x91: '‘', 0x92: '’',
  0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
  0x98: '˜', 0x99: '™', 0x9A: 'š', 0x9B: '›', 0x9C: 'œ',
  0x9E: 'ž', 0x9F: 'Ÿ',
};

function winAnsiFix(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    out += code >= 0x80 && code <= 0x9F && WINANSI_HIGH[code] ? WINANSI_HIGH[code] : s[i];
  }
  return out;
}

// ── Décode les séquences d'échappement d'une chaîne PDF littérale (...). ──
function decodePdfLiteralString(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== '\\') { out += c; continue; }
    const n = s[i + 1];
    if (n === 'n') { out += '\n'; i++; }
    else if (n === 'r') { out += '\n'; i++; }
    else if (n === 't') { out += ' '; i++; }
    else if (n === '(' || n === ')' || n === '\\') { out += n; i++; }
    else if (n >= '0' && n <= '7') {
      let oct = n, j = i + 2, k = 0;
      while (k < 2 && s[j] >= '0' && s[j] <= '7') { oct += s[j]; j++; k++; }
      out += String.fromCharCode(parseInt(oct, 8) & 0xff);
      i = j - 1;
    } else if (n === '\n' || n === '\r') { i++; /* saut de ligne échappé : ignoré */ }
    else { out += n || ''; i++; }
  }
  return winAnsiFix(out);
}

// ── Convertit une chaîne hex <...> en chaîne "octets" (même espace que les
// littéraux, pour réutiliser decodePdfLiteralString/winAnsiFix ensuite). ───
function hexToRawString(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  let out = '';
  for (let i = 0; i < clean.length - 1; i += 2) out += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
  return out;
}

// ── Extrait le texte affiché (opérateurs Tj / TJ) d'un flux de contenu PDF
// déjà décompressé. TJ prend un tableau [ (str) nombre (str) ... ] où les
// nombres sont des ajustements d'espacement (ignorés ici). ────────────────
function extractShowTextOps(content) {
  const parts = [];
  const literalOrHex = '(?:\\(((?:\\\\.|[^\\\\()])*)\\)|<([0-9a-fA-F\\s]*)>)';
  const tjRe = new RegExp(literalOrHex + '\\s*Tj', 'g');
  let m;
  while ((m = tjRe.exec(content))) {
    parts.push(m[1] != null ? decodePdfLiteralString(m[1]) : winAnsiFix(hexToRawString(m[2])));
    parts.push('\n');
  }
  const tjArrRe = /\[((?:\\.|[^\[\]])*)\]\s*TJ/g;
  while ((m = tjArrRe.exec(content))) {
    const inner = m[1];
    const strRe = new RegExp(literalOrHex, 'g');
    let sm;
    while ((sm = strRe.exec(inner))) {
      parts.push(sm[1] != null ? decodePdfLiteralString(sm[1]) : winAnsiFix(hexToRawString(sm[2])));
    }
    parts.push('\n');
  }
  return parts.join('');
}

// ── Parcourt le PDF brut, décompresse chaque flux FlateDecode, et cumule le
// texte extrait de tous les flux de contenu trouvés. ──────────────────────
function extractTextFromPdf(buffer) {
  const latin1 = buffer.toString('latin1');
  const streamRe = /([\s\S]{0,600}?)stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const chunks = [];
  let m;
  while ((m = streamRe.exec(latin1))) {
    const dictWindow = m[1];
    const rawStreamStr = m[2];
    const isFlate = /\/Filter\s*(?:\/FlateDecode|\[[^\]]*\/FlateDecode)/.test(dictWindow);
    const hasOtherFilter = /\/Filter\s*(?:\/(?!FlateDecode)\w+|\[[^\]]*\/(?!FlateDecode)\w+)/.test(dictWindow) && !isFlate;
    if (hasOtherFilter) continue; // image (DCTDecode...), police embarquée, etc. : pas du texte
    let dataStr = rawStreamStr;
    if (isFlate) {
      try {
        dataStr = zlib.inflateSync(Buffer.from(rawStreamStr, 'latin1')).toString('latin1');
      } catch (e) {
        continue; // flux corrompu/tronqué par la regex (rare) : ignoré, pas fatal
      }
    }
    if (/\bTj\b|\bTJ\b/.test(dataStr)) chunks.push(extractShowTextOps(dataStr));
  }
  return chunks.join('\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Avertissement français si l'extraction semble ratée (PDF scanné, police
// ré-encodée sur mesure...) — pour que l'enseignant vérifie avant de générer. ─
function checkExtractionQuality(text, byteLength) {
  if (!text || text.length < 20) {
    return "⚠️ Aucun texte exploitable n'a pu être extrait de ce PDF (probablement un document scanné/image). Utilise plutôt un fichier Markdown, ou copie-colle le texte à la main.";
  }
  const letters = (text.match(/[a-zA-ZÀ-ÖØ-öø-ÿ]/g) || []).length;
  const ratio = letters / text.length;
  if (text.length > 200 && ratio < 0.45) {
    return "⚠️ L'extraction de ce PDF semble incomplète ou déformée (police non standard ?) — relis et corrige le texte ci-dessous avant de générer.";
  }
  return null;
}

module.exports = { extractTextFromPdf, checkExtractionQuality };
