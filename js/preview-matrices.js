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

function renderPreviewHTML_matrices(state) {
  var realParts = {};
  try { realParts = (typeof genMatricesCore === 'function') ? genMatricesCore(1, _matBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('mat', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  // _hsPrtBoxes lit prt.nodes, désormais bruts (sans encadré, cf. js/fb-box.js) :
  // on applique l'encadré uniquement ici, au point d'affichage de l'aperçu — même
  // convention que preview-basen.js/preview-statistiques.js, nécessaire pour pouvoir
  // substituer state.realFbWrongHTML (déjà encadré côté serveur) sans double-boîte.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var wrongFbHTML = _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars);
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _matRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée (coefficients tirés via ri(...)).
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realGeneralFeedback, knownVars);
    if (state.realFbWrongHTML) wrongFbHTML = state.realFbWrongHTML;
  } else {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    var bodyFrag = (realParts.textFrag || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
    scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realGeneralFeedback, knownVars) + note;
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.matrices'), badgeColor: '#7c2d12', noteBg: '#fff7ed', noteColor: '#7c2d12',
    prefix: 'mat', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: wrongFbHTML, fbGen: state.fbGen, fbBoxesPreWrapped: true,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: applyFbBox(n.kind, _calcTokenizeForPreview(n.fb, knownVars)) };
    })
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// Même mécanisme que preview-basen.js/preview-statistiques.js : le HTML de /render
// (questionrender) déjà substitué par Maxima pour l'énoncé, et
// questionsamplesolutiontext pour le bloc "Correction". Le nom de l'input dépend
// du scénario (ans_det/ans_prod/ans_tr/ans_t/ans_sys, cf. gen-math-matrices.js) :
// on le lit dynamiquement dans le XML généré via _extractInputNames plutôt que le
// coder en dur.
(function () {
  var _matPreviewSeed = null;
  var _matRealPreviewGen = 0;
  var _matLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _matEnsurePreviewSeed() {
    if (!_matPreviewSeed) _matPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _matPreviewSeed;
  }

  function _matSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('mat-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _matCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _matCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais syntaxiquement valide, adaptée au type d'input
  // du scénario : un nombre pour les scénarios à réponse numérique (déterminant,
  // trace), une matrice littérale des bonnes dimensions sinon (produit, transposée,
  // système) — un simple "-999999" ferait échouer le parsing STACK pour un input
  // de type matrix.
  function _matBuildWrongProbe(scenario) {
    if (scenario === 'produit-2x2') return 'matrix([9999,9999],[9999,9999])';
    if (scenario === 'transpose-3x3') return 'matrix([9999,9999,9999],[9999,9999,9999],[9999,9999,9999])';
    if (scenario === 'systeme-2x2') return 'matrix([9999],[9999])';
    return '-999999'; // det-2x2, det-3x3, trace-3x3 : réponse numérique
  }

  async function _matFetchRealFbWrong(xml, seed, p) {
    try {
      var inputNames = (typeof _extractInputNames === 'function') ? _extractInputNames(xml) : [];
      if (!inputNames.length) return null;
      var answers = {};
      answers[inputNames[0]] = _matBuildWrongProbe(p.scenario);
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _matCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _matRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'matrices') return;
    var gen = ++_matRealPreviewGen;

    var p;
    try { p = _matBuildParams(); } catch (e) { return; }

    _matSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genMatricesCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_matEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _matRealPreviewGen) _matSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _matPreviewSeed);
      if (gen !== _matRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _matLastReal = {
        bodyHTML: _matCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.matRefreshPreview === 'function') window.matRefreshPreview();
      _matSetRealPreviewStatus('', false);

      var fbWrongHTML = await _matFetchRealFbWrong(xml, _matPreviewSeed, p);
      if (gen !== _matRealPreviewGen || !_matLastReal) return;
      if (fbWrongHTML) {
        _matLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.matRefreshPreview === 'function') window.matRefreshPreview();
      }
    } catch (e) {
      if (gen !== _matRealPreviewGen) return;
      _matSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function matRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'matrices') return;
    _matPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _matRefreshRealPreview();
  }
  window.matRerollPreviewSeed = matRerollPreviewSeed;

  function matShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'matrices') return;
    _matEnsurePreviewSeed();
    _matRefreshRealPreview();
  }
  window.matShowRealPreview = matShowRealPreview;

  function _matAugmentStateWithReal(state) {
    if (_matLastReal) {
      state.realBodyHTML = _matLastReal.bodyHTML;
      state.realFbGenHTML = _matLastReal.fbGenHTML;
      state.realFbWrongHTML = _matLastReal.fbWrongHTML;
    }
  }

  window.matRefreshPreview = _hsWireSimplePreview('matrices', 'mat', 'mat-preview-container', 'fp-matrices', renderPreviewHTML_matrices, false, _matAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-matrices');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _matPreviewSeed = null;
          _matLastReal = null;
          var rerollBtn = document.getElementById('mat-reroll-preview-btn');
          var showRealBtn = document.getElementById('mat-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genMatricesCore(1, _matBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _matSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
