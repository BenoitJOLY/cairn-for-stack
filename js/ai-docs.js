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

// ════════════════════════════════════════════════════════════════
//  AJOUT D'UN DOCUMENT SOURCE (COURS) AUX GÉNÉRATEURS DE PROMPT IA
//  Permet à l'enseignant de coller son cours : l'IA génère alors
//  les questions À PARTIR de ce contenu.
//
//  Fichier autonome : il injecte un champ « cours » dans les trois
//  modales de prompt (QCM, Mots croisés, Relier), puis enrobe les
//  fonctions de génération existantes pour insérer le cours dans le
//  prompt produit. Aucune autre source n'est modifiée.
// ════════════════════════════════════════════════════════════════

// Configuration par générateur :
//  - cours   : id du <textarea> où l'enseignant colle son cours
//  - read    : récupère le prompt actuellement généré
//  - write   : réécrit le prompt (aperçu + variable de copie)
//  - markers : endroits où insérer le bloc « cours » (avant la 1re trouvée)
const _AI_TARGETS = {
  pb: {
    cours: 'pb-cours',
    read:  () => (window._pbPromptText || (document.getElementById('pb-preview')?.textContent || '')),
    write: (t) => {
      const el = document.getElementById('pb-preview'); if (el) el.textContent = t;
      window._pbPromptText = t;
      const btn = document.getElementById('pb-copy-btn'); if (btn) btn.disabled = false;
    },
    markers: ['CONTRAINTE TECHNIQUE (STRICT JSON)', '\nCONSIGNES DE RÉDACTION']
  },
  cw: {
    cours: 'cw-pb-cours',
    read:  () => (document.getElementById('cw-pb-result')?.value || ''),
    write: (t) => { const el = document.getElementById('cw-pb-result'); if (el) el.value = t; },
    markers: ['Génère UNIQUEMENT un tableau JSON', 'Règles strictes']
  },
  match: {
    cours: 'match-pb-cours',
    read:  () => (document.getElementById('match-pb-result')?.value || ''),
    write: (t) => { const el = document.getElementById('match-pb-result'); if (el) el.value = t; },
    markers: ['### CONTRAINTES TECHNIQUES STRICTES', '### TÂCHE']
  }
};

// ── Construction du bloc « cours » inséré dans le prompt ──────────
function _aiCourseBlock(text){
  const t = (text || '').trim();
  if (!t) return '';
  return (
    "DOCUMENT SOURCE (COURS FOURNI PAR L'ENSEIGNANT) :\n" +
    "Base-toi EXCLUSIVEMENT sur le cours ci-dessous (délimité par <<<COURS>>> et <<<FIN COURS>>>) pour concevoir les questions et les feedbacks. " +
    "N'invente aucune notion absente de ce document. Si aucun thème précis n'est indiqué, couvre l'ensemble du document ; " +
    "sinon limite-toi aux passages en lien avec le thème demandé.\n" +
    "<<<COURS>>>\n" + t + "\n<<<FIN COURS>>>\n\n"
  );
}

function _aiInsertBefore(prompt, markers, block){
  for (const m of markers){
    const i = prompt.indexOf(m);
    if (i !== -1) return prompt.slice(0, i) + block + prompt.slice(i);
  }
  return prompt + "\n\n" + block; // repli : à la fin
}

// ── Injection du cours dans le prompt déjà généré ────────────────
function _aiInjectCourse(key){
  const cfg = _AI_TARGETS[key];
  if (!cfg) return;
  const ta = document.getElementById(cfg.cours);
  const block = _aiCourseBlock(ta ? ta.value : '');
  let p = cfg.read();
  if (!p) return;
  // On retire un éventuel bloc déjà inséré pour éviter les doublons.
  p = p.replace(/DOCUMENT SOURCE \(COURS FOURNI[\s\S]*?<<<FIN COURS>>>\n\n/, '');
  if (!block){ cfg.write(p); return; }   // cours vide → prompt nettoyé
  cfg.write(_aiInsertBefore(p, cfg.markers, block));
}

// ── Enrobage des fonctions de génération existantes ──────────────
function _aiWrap(fnName, key){
  const orig = window[fnName];
  if (typeof orig !== 'function') return;
  window[fnName] = function(){
    const r = orig.apply(this, arguments);
    try { _aiInjectCourse(key); } catch(e){ /* silencieux */ }
    return r;
  };
}

// ── Fonctions appelées par l'interface (import, compteur, effacer) ─
const _AI_LONG = 15000; // seuil d'avertissement (caractères)
function aiUpdateCount(taId, countId){
  const ta = document.getElementById(taId), c = document.getElementById(countId);
  if (ta && c){
    const n = ta.value.length;
    const lang = (window.I18N && I18N.getLang) ? I18N.getLang() : 'fr';
    let txt = n.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR') + ' ' + I18N.t(n <= 1 ? 'ai.doc_char_sg' : 'ai.doc_char_pl');
    if (n > _AI_LONG){
      txt += ' — ' + I18N.t('ai.doc_cours_long');
      c.classList.add('warn');
    } else {
      c.classList.remove('warn');
    }
    c.textContent = txt;
  }
}
// ── Extraction de texte depuis un PDF (pdf.js, embarqué dans lib/) ─
function _aiEnsurePdf(){
  const lib = window.pdfjsLib;
  if (lib && lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc){
    lib.GlobalWorkerOptions.workerSrc = 'lib/pdfjs/pdf.worker.min.js';
  }
  return lib;
}
async function _aiExtractPdf(file){
  const lib = _aiEnsurePdf();
  if (!lib) throw new Error('pdfjs-absent');
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    let line = '';
    tc.items.forEach(it => { line += it.str + (it.hasEOL ? '\n' : ' '); });
    pages.push(line.replace(/[ \t]+/g, ' ').trim());
  }
  return pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Extraction de texte depuis un ODT (LibreOffice/OpenOffice) ────
// Un .odt est une archive ZIP contenant content.xml. On décompresse
// avec fflate (embarqué dans lib/), puis on convertit le XML en texte.
async function _aiExtractOdt(file){
  const lib = window.fflate;
  if (!lib) throw new Error('fflate-absent');
  const buf = new Uint8Array(await file.arrayBuffer());
  const files = lib.unzipSync(buf, { filter: f => f.name === 'content.xml' });
  const xmlBytes = files['content.xml'];
  if (!xmlBytes) throw new Error('content.xml introuvable');
  const xml = new TextDecoder('utf-8').decode(xmlBytes);
  return _aiOdtXmlToText(xml);
}
function _aiOdtXmlToText(xmlString){
  let doc = null;
  try { doc = new DOMParser().parseFromString(xmlString, 'application/xml'); } catch(e){ doc = null; }
  if (doc && doc.getElementsByTagName('parsererror').length === 0){
    const walk = (node) => {
      let s = '';
      Array.prototype.forEach.call(node.childNodes, ch => {
        if (ch.nodeType === 3){ s += ch.nodeValue; }
        else if (ch.nodeType === 1){
          const ln = ch.localName;
          if (ln === 'line-break') s += '\n';
          else if (ln === 'tab') s += '\t';
          else if (ln === 's'){
            const c = parseInt(ch.getAttribute('c') || ch.getAttribute('text:c') || '1', 10) || 1;
            s += ' '.repeat(c);
          } else {
            s += walk(ch);
            if (ln === 'p' || ln === 'h') s += '\n'; // paragraphes et titres
          }
        }
      });
      return s;
    };
    const body = doc.getElementsByTagName('office:body')[0] || doc.documentElement;
    return walk(body).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  // Repli : si le parseur XML échoue, nettoyage par expressions régulières.
  return xmlString
    .replace(/<text:line-break\s*\/>/g, '\n')
    .replace(/<text:tab\s*\/>/g, '\t')
    .replace(/<\/text:(p|h)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function aiReadDocFile(input, taId, countId, buildFnName){
  const f = input.files && input.files[0];
  if (!f) return;
  input.value = '';
  const ta = document.getElementById(taId);
  if (!ta) return;
  const name = f.name || '', type = f.type || '';
  const isPdf = (type === 'application/pdf') || /\.pdf$/i.test(name);
  const isOdt = (type === 'application/vnd.oasis.opendocument.text') || /\.odt$/i.test(name);

  const finish = (text) => {
    ta.value = text || '';
    aiUpdateCount(taId, countId);
    if (typeof window[buildFnName] === 'function') window[buildFnName]();
    if (typeof toast === 'function') toast(I18N.t('ai.doc_cours_importe', {name: name}));
  };
  const fail = (msg) => { if (typeof toast === 'function') toast(msg); aiUpdateCount(taId, countId); };
  const busy = (msg) => { const c = document.getElementById(countId); if (c) c.textContent = msg; };

  if (isPdf){
    if (!window.pdfjsLib){ fail(I18N.t('ai.doc_pdf_absent')); return; }
    busy(I18N.t('ai.doc_pdf_lecture'));
    _aiExtractPdf(f)
      .then(txt => {
        if (!txt || !txt.trim()){ fail(I18N.t('ai.doc_pdf_scanne')); return; }
        finish(txt);
      })
      .catch(() => fail(I18N.t('ai.doc_pdf_erreur')));
    return;
  }

  if (isOdt){
    if (!window.fflate){ fail(I18N.t('ai.doc_odt_absent')); return; }
    busy(I18N.t('ai.doc_odt_lecture'));
    _aiExtractOdt(f)
      .then(txt => {
        if (!txt || !txt.trim()){ fail(I18N.t('ai.doc_odt_vide')); return; }
        finish(txt);
      })
      .catch(() => fail(I18N.t('ai.doc_odt_erreur')));
    return;
  }

  // Fichiers texte
  const reader = new FileReader();
  reader.onload = e => finish((e.target.result || '').toString());
  reader.onerror = () => fail(I18N.t('ai.doc_fichier_erreur'));
  reader.readAsText(f);
}
function aiClearDoc(taId, countId, buildFnName){
  const ta = document.getElementById(taId);
  if (ta) ta.value = '';
  aiUpdateCount(taId, countId);
  if (typeof window[buildFnName] === 'function') window[buildFnName]();
}

// ── Injection de l'interface (champ cours) dans chaque modale ────
function _aiInjectUI(modalId, key, buildFnName){
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const body = modal.querySelector('.pb-body');
  if (!body || body.querySelector('#' + key + '-doc-wrap')) return;

  const taId = _AI_TARGETS[key].cours;   // id du textarea (cohérent avec la config)
  const countId = key + '-ai-count';

  const dividers = body.querySelectorAll('.pb-section-divider');
  const anchor = dividers[dividers.length - 1] || null; // le séparateur « Aperçu / Prompt généré »

  const block = document.createElement('div');
  block.id = key + '-doc-wrap';
  block.innerHTML =
    '<div class="pb-section-divider" data-i18n="ai.doc_source">' + I18N.t('ai.doc_source') + '</div>' +
    '<div class="pb-field">' +
      '<div class="ai-doc-hint" data-i18n-html="ai.doc_hint">' + I18N.t('ai.doc_hint') + '</div>' +
      '<div class="ai-doc-bar">' +
        '<label class="ai-doc-import"><span data-i18n="ai.doc_import">' + I18N.t('ai.doc_import') + '</span>' +
          '<input type="file" accept=".pdf,.odt,.txt,.md,.markdown,.csv,.tsv,.json,application/pdf,application/vnd.oasis.opendocument.text,text/plain" style="display:none" ' +
          'onchange="aiReadDocFile(this,\'' + taId + '\',\'' + countId + '\',\'' + buildFnName + '\')"></label>' +
        '<span class="ai-doc-count" id="' + countId + '">0 ' + I18N.t('ai.doc_char_sg') + '</span>' +
        '<button type="button" class="ai-doc-clear" data-i18n="ai.doc_effacer" onclick="aiClearDoc(\'' + taId + '\',\'' + countId + '\',\'' + buildFnName + '\')">' + I18N.t('ai.doc_effacer') + '</button>' +
      '</div>' +
      '<textarea id="' + taId + '" class="pb-input ai-doc-ta" rows="6" ' +
        'data-i18n-ph="ai.doc_placeholder" ' +
        'placeholder="' + I18N.t('ai.doc_placeholder').replace(/"/g, '&quot;') + '" ' +
        'aria-label="' + I18N.t('ai.doc_source').replace(/"/g, '&quot;') + '" ' +
        'oninput="aiUpdateCount(\'' + taId + '\',\'' + countId + '\');' + buildFnName + '()"></textarea>' +
    '</div>';

  if (anchor) body.insertBefore(block, anchor);
  else body.appendChild(block);
}

// ── Styles ───────────────────────────────────────────────────────
function _aiInjectStyles(){
  if (document.getElementById('ai-doc-styles')) return;
  const st = document.createElement('style');
  st.id = 'ai-doc-styles';
  st.textContent =
    '.ai-doc-hint{font-size:.78rem;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:8px 11px;margin-bottom:8px;line-height:1.5;}' +
    '.ai-doc-bar{display:flex;align-items:center;gap:10px;margin-bottom:7px;flex-wrap:wrap;}' +
    '.ai-doc-import{font-size:.78rem;font-weight:700;color:#4338ca;background:#eef2ff;border:1px solid #c7d2fe;border-radius:7px;padding:6px 11px;cursor:pointer;}' +
    '.ai-doc-import:hover{background:#e0e7ff;}' +
    '.ai-doc-count{font-size:.74rem;color:#64748b;}' +
    '.ai-doc-count.warn{color:#b45309;font-weight:700;}' +
    '.ai-doc-clear{font-size:.74rem;font-weight:700;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:6px 10px;cursor:pointer;margin-left:auto;}' +
    '.ai-doc-clear:hover{background:#fee2e2;}' +
    '.ai-doc-ta{resize:vertical;min-height:90px;font-size:.83rem;line-height:1.5;}';
  document.head.appendChild(st);
}

// ── Initialisation ───────────────────────────────────────────────
// On enrobe immédiatement (les fonctions d'origine existent déjà,
// ce script étant chargé après prompt.js et crossword-ui.js).
_aiWrap('pbBuild', 'pb');
_aiWrap('buildCWPrompt', 'cw');
_aiWrap('updateMatchPrompt', 'match');

(function initAiDocs(){
  function build(){
    _aiInjectStyles();
    _aiInjectUI('promptModal',      'pb',    'pbBuild');
    _aiInjectUI('cwPromptModal',    'cw',    'buildCWPrompt');
    _aiInjectUI('matchPromptModal', 'match', 'updateMatchPrompt');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
