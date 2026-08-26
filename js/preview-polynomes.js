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

function renderPreviewHTML_polynomes(state) {
  var realParts = {};
  try { realParts = (typeof genPolynomesCore === 'function') ? genPolynomesCore(1, _polBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('pol', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  // _hsPrtBoxes lit prt.nodes, bruts (sans encadré) : on applique l'encadré ici, au
  // point d'affichage de l'aperçu — même convention que preview-basen.js/
  // preview-statistiques.js, nécessaire pour pouvoir substituer state.realFbWrongHTML
  // (déjà encadré côté serveur) sans double encadré.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var wrongFbHTML = _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars);
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _polRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée (coefficients tirés via ri(...)/rand(...)).
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
    badge: I18N.t('type.polynomes'), badgeColor: '#166534', noteBg: '#f0fdf4', noteColor: '#166534',
    prefix: 'pol', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: wrongFbHTML, fbGen: state.fbGen, fbBoxesPreWrapped: true,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// Même mécanisme que preview-basen.js/preview-statistiques.js : le HTML de /render
// (questionrender) déjà substitué par Maxima pour l'énoncé (coefficients tirés via
// ri(...)/rand(...), jamais résolus par le recalcul JS local ci-dessus), et
// questionsamplesolutiontext pour le bloc "Correction". Le scénario "racines" a DEUX
// champs de réponse (ans_r1/ans_r2) : on lit tous les noms d'input via
// _extractInputNames(xml) plutôt qu'un nom fixe, et on sonde chacun (même pattern que
// preview-calcul.js).
(function () {
  var _polPreviewSeed = null;
  var _polRealPreviewGen = 0;
  var _polLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _polEnsurePreviewSeed() {
    if (!_polPreviewSeed) _polPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _polPreviewSeed;
  }

  function _polSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('pol-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _polCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _polCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais toujours syntaxiquement valide (AlgEquiv, la
  // plupart des champs interdisant les flottants) : un entier très négatif, jamais
  // atteint par un discriminant/une racine/une somme/un produit de racines calculé
  // avec les bornes usuelles. Appliquée à tous les inputs (scénario "racines" en a 2).
  async function _polFetchRealFbWrong(xml, seed) {
    try {
      var inputNames = (typeof _extractInputNames === 'function') ? _extractInputNames(xml) : [];
      if (!inputNames.length) return null;
      var answers = {};
      inputNames.forEach(function(name) { answers[name] = '-999999'; });
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _polCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _polRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'polynomes') return;
    var gen = ++_polRealPreviewGen;

    var p;
    try { p = _polBuildParams(); } catch (e) { return; }

    _polSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genPolynomesCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_polEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _polRealPreviewGen) _polSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _polPreviewSeed);
      if (gen !== _polRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _polLastReal = {
        bodyHTML: _polCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.polRefreshPreview === 'function') window.polRefreshPreview();
      _polSetRealPreviewStatus('', false);

      var fbWrongHTML = await _polFetchRealFbWrong(xml, _polPreviewSeed);
      if (gen !== _polRealPreviewGen || !_polLastReal) return;
      if (fbWrongHTML) {
        _polLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.polRefreshPreview === 'function') window.polRefreshPreview();
      }
    } catch (e) {
      if (gen !== _polRealPreviewGen) return;
      _polSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function polRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'polynomes') return;
    _polPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _polRefreshRealPreview();
  }
  window.polRerollPreviewSeed = polRerollPreviewSeed;

  function polShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'polynomes') return;
    _polEnsurePreviewSeed();
    _polRefreshRealPreview();
  }
  window.polShowRealPreview = polShowRealPreview;

  function _polAugmentStateWithReal(state) {
    if (_polLastReal) {
      state.realBodyHTML = _polLastReal.bodyHTML;
      state.realFbGenHTML = _polLastReal.fbGenHTML;
      state.realFbWrongHTML = _polLastReal.fbWrongHTML;
    }
  }

  window.polRefreshPreview = _hsWireSimplePreview('polynomes', 'pol', 'pol-preview-container', 'fp-polynomes', renderPreviewHTML_polynomes, false, _polAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-polynomes');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _polPreviewSeed = null;
          _polLastReal = null;
          var rerollBtn = document.getElementById('pol-reroll-preview-btn');
          var showRealBtn = document.getElementById('pol-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genPolynomesCore(1, _polBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _polSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
