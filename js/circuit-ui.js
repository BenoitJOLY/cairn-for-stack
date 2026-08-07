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

// circuit-ui.js — UI de l'atelier de construction de circuits électriques
// (canvas enseignant dans la modale de config + aperçu élève), construit
// au-dessus du moteur partagé js/circuit-atelier.js (cirEngineRun/CIR_ENGINE_JS).

// CSS portée à l'identique depuis le prototype de référence
// (test/mise à jour/Physique-chimie/circuit élec/questions-Atelier_circuits_electriques_v6.xml).
var CIR_ATELIER_CSS = ':root{ --ink:#1f2937; --ok:#15803d; --bad:#dc2626; --info:#1e40af; --line:#e5e7eb; } *{box-sizing:border-box;} body{ margin:0; font-family:"Segoe UI",system-ui,Arial,sans-serif; color:var(--ink); padding:10px; } h1.sc{font-size:18px;margin:0 0 4px;} h2.sc{font-size:13px;margin:0 0 8px;color:#475569;text-transform:uppercase;letter-spacing:.04em;} p.sub{margin:0 0 14px;color:#64748b;font-size:14px;} .layout{display:flex;gap:18px;align-items:flex-start;} .left{flex:1 1 auto;min-width:0;} .right{flex:0 0 260px;border-left:1px solid var(--line);padding-left:18px;} .toolbar{display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap;} button{border:none;border-radius:8px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;transition:transform .08s ease;} button:active{transform:scale(.97);} #btnReset{background:#e2e8f0;color:var(--ink);} #btnUndo{background:#fef3c7;color:#92400e;} #btnScissors{background:#e2e8f0;color:var(--ink);} #btnScissors.active{background:#dc2626;color:#fff;} #board.cutting{cursor:crosshair;} #btnExport{background:var(--ok);color:#fff;width:100%;margin-bottom:10px;} #board{width:100%;height:520px;background:#fff;border:1px solid var(--line);border-radius:10px;touch-action:none;} #feedback{margin-top:12px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;background:#f1f5f9;color:#475569;border:1px solid var(--line);} .palette{display:flex;flex-direction:column;gap:7px;margin-bottom:18px;} #valBox{margin-bottom:18px;} #valName{font-size:12.5px;font-weight:600;color:var(--ink);margin-bottom:6px;} .valrow{display:flex;gap:7px;align-items:center;} #valInput{flex:1;min-width:0;padding:7px 9px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;font-family:inherit;} #valInput:disabled{background:#f1f5f9;color:#94a3b8;} #valUnit{font-size:13px;font-weight:600;color:#475569;min-width:24px;} #valHint{font-size:11.5px;color:#64748b;margin-top:6px;line-height:1.4;} .card{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:8px;padding:7px;cursor:pointer;background:#fff;transition:box-shadow .15s,border-color .15s;} .card:hover{border-color:#94a3b8;box-shadow:0 1px 4px rgba(0,0,0,.08);} .card img{width:50px;height:26px;object-fit:contain;flex-shrink:0;} .card span{font-size:12.5px;font-weight:600;color:var(--ink);}';

// Construit le document HTML complet de l'atelier (canvas enseignant ou aperçu élève),
// destiné à être injecté via iframe.srcdoc (mountPreviewIframeScripted).
// opts = { mode:'teacher'|'student-preview', initialStateB64, inputNames }
function cirBuildAtelierHTML(opts) {
  opts = opts || {};
  var mode = opts.mode || 'student-preview';
  var isTeacher = (mode === 'teacher');
  var initialStateB64 = opts.initialStateB64 || '';
  var inputNames = opts.inputNames || { s: 'cir_prev_s', c: 'cir_prev_c', w: 'cir_prev_w', v: 'cir_prev_v' };

  var consigne = isTeacher
    ? I18N.t('cir.teacher_atelier_instructions')
    : I18N.t('cir.atelier_instructions');

  var feedbackDefault = isTeacher
    ? I18N.t('cir.status_empty')
    : I18N.t('cir.feedback_placeholder');

  var validationSection = isTeacher ? '' : (
    '<h2 class="sc">' + I18N.t('cir.heading_validation') + '</h2>\n' +
    '    <button id="btnExport" type="button">✅ ' + I18N.t('cir.btn_export') + '</button>\n'
  );

  var hiddenInputs = '';
  var stubScript = '';
  if (!isTeacher) {
    hiddenInputs = ['s', 'c', 'w', 'v'].map(function (k) {
      return '<input type="hidden" id="' + inputNames[k] + '" value="">';
    }).join('\n');
    stubScript = 'window.stack_js = { request_access_to_input: function (name) { return Promise.resolve(name); } };';
  }

  var bootCfg = {
    mode: mode,
    inputNames: inputNames,
    initialStateB64: initialStateB64,
    jsxCssUrl: 'lib/jsxgraph/jsxgraph.css',
    jsxJsUrl: 'lib/jsxgraph/jsxgraphcore.js',
    labels: cirBuildLabels(I18N)
  };

  return '<!doctype html>\n'
    + '<html><head><meta charset="utf-8">\n'
    + '<style>' + CIR_ATELIER_CSS + '</style>\n'
    + '</head><body>\n'
    + hiddenInputs + '\n'
    + '<h1 class="sc">🔌 ' + I18N.t('cir.atelier_title') + '</h1>\n'
    + '<p class="sub">' + consigne + '</p>\n'
    + '<div class="layout">\n'
    + '  <div class="left">\n'
    + '    <div class="toolbar">\n'
    + '      <button id="btnScissors" type="button">✂️ ' + I18N.t('cir.btn_scissors') + '</button>\n'
    + '      <button id="btnUndo" type="button">← ' + I18N.t('cir.btn_undo') + '</button>\n'
    + '      <button id="btnReset" type="button">↺ ' + I18N.t('cir.btn_reset') + '</button>\n'
    + '    </div>\n'
    + '    <div id="board" role="img"></div>\n'
    + '    <div id="feedback">' + feedbackDefault + '</div>\n'
    + '  </div>\n'
    + '  <div class="right">\n'
    + '    <h2 class="sc">' + I18N.t('cir.heading_components') + '</h2>\n'
    + '    <div class="palette" id="palette"></div>\n'
    + '    <h2 class="sc">' + I18N.t('cir.heading_value') + '</h2>\n'
    + '    <div id="valBox">\n'
    + '      <div id="valName">' + I18N.t('cir.valname_placeholder') + '</div>\n'
    + '      <div class="valrow">\n'
    + '        <input id="valInput" type="number" step="any" min="0" disabled aria-label="' + I18N.t('cir.val_input_aria') + '">\n'
    + '        <span id="valUnit"></span>\n'
    + '      </div>\n'
    + '      <div id="valHint">' + I18N.t('cir.valhint') + '</div>\n'
    + '    </div>\n'
    + '    ' + validationSection
    + '  </div>\n'
    + '</div>\n'
    + (stubScript ? '<script>' + stubScript + '<\/script>\n' : '')
    + '<script src="js/circuit-atelier.js"><\/script>\n'
    + '<script>cirEngineRun(' + JSON.stringify(bootCfg) + ');<\/script>\n'
    + '</body></html>';
}

// Monte (ou remonte) le canvas enseignant dans la modale de config, en restaurant
// le circuit modèle précédemment sauvegardé pour cette question (s'il existe).
function cirTeacherInit(qid) {
  var q = (typeof questions !== 'undefined') ? questions[qid] : null;
  var model = (q && q.state && q.state.cirModel) || null;
  var initialStateB64 = (model && model.state) || '';
  mountPreviewIframeScripted('cir-teacher-canvas-container', cirBuildAtelierHTML({ mode: 'teacher', initialStateB64: initialStateB64 }));
}

// Lit l'état courant du circuit modèle construit par l'enseignant, via le pont
// window.__cirGetModelState() exposé par cirEngineRun en mode 'teacher'.
// Retourne null si le canvas n'est pas monté ou si aucun composant n'a été placé.
function cirReadModelFromCanvas() {
  var cont = document.getElementById('cir-teacher-canvas-container');
  if (!cont) return null;
  var iframe = cont.querySelector('iframe.hs-preview-iframe');
  if (!iframe) return null;
  try {
    var win = iframe.contentWindow;
    if (!win) return null;
    if (typeof win.__cirGetModelState !== 'function') return null;
    return win.__cirGetModelState();
  } catch (e) {
    return null;
  }
}

// Remonte un canvas enseignant vierge (utilisé par le reset de formulaire).
function cirClearCanvas() {
  mountPreviewIframeScripted('cir-teacher-canvas-container', cirBuildAtelierHTML({ mode: 'teacher', initialStateB64: '' }));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CIR_ATELIER_CSS: CIR_ATELIER_CSS, cirBuildAtelierHTML: cirBuildAtelierHTML, cirTeacherInit: cirTeacherInit, cirReadModelFromCanvas: cirReadModelFromCanvas, cirClearCanvas: cirClearCanvas };
}
