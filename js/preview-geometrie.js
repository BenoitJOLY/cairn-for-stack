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

function renderPreviewHTML_geometrie(state) {
  var realParts = {};
  try { realParts = (typeof genGeometrieCore === 'function') ? genGeometrieCore(1, _geoBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('geo', _hsHasRandomization(realParts.vars || ''));
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
    // Tirage réellement calculé par Maxima (voir _geoRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée (coordonnées tirées via ri(...)).
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
    badge: I18N.t('type.geometrie'), badgeColor: '#1e40af', noteBg: '#eff6ff', noteColor: '#1e40af',
    prefix: 'geo', bareme: state.bareme || 1,
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
// (questionrender) déjà substitué par Maxima pour l'énoncé, et
// questionsamplesolutiontext pour le bloc "Correction". Le nom de l'input dépend
// du scénario (ans_dist/ans_mid/ans_norm/ans_pente/ans_oao/ans_aire, cf.
// gen-math-geometrie.js) : on le lit dynamiquement dans le XML généré via
// _extractInputNames plutôt que le coder en dur.
(function () {
  var _geoPreviewSeed = null;
  var _geoRealPreviewGen = 0;
  var _geoLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _geoEnsurePreviewSeed() {
    if (!_geoPreviewSeed) _geoPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _geoPreviewSeed;
  }

  function _geoSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('geo-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _geoCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _geoCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais syntaxiquement valide, adaptée au type d'input
  // du scénario : seul "milieu" attend une matrice colonne (dimension 2D/3D selon
  // p.dimSel) ; les autres (distance, norme, pente, ordonnée, aire) attendent un
  // nombre ou une expression algébrique, pour lesquels un entier très négatif
  // convient (jamais atteint par une distance/norme/aire, toujours positives).
  function _geoBuildWrongProbe(scenario, dimSel) {
    if (scenario === 'milieu') {
      return (dimSel === '3d') ? 'matrix([9999],[9999],[9999])' : 'matrix([9999],[9999])';
    }
    return '-999999';
  }

  async function _geoFetchRealFbWrong(xml, seed, p) {
    try {
      var inputNames = (typeof _extractInputNames === 'function') ? _extractInputNames(xml) : [];
      if (!inputNames.length) return null;
      var answers = {};
      answers[inputNames[0]] = _geoBuildWrongProbe(p.scenario, p.dimSel);
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _geoCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _geoRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'geometrie') return;
    var gen = ++_geoRealPreviewGen;

    var p;
    try { p = _geoBuildParams(); } catch (e) { return; }

    _geoSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genGeometrieCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_geoEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _geoRealPreviewGen) _geoSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _geoPreviewSeed);
      if (gen !== _geoRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _geoLastReal = {
        bodyHTML: _geoCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.geoRefreshPreview === 'function') window.geoRefreshPreview();
      _geoSetRealPreviewStatus('', false);

      var fbWrongHTML = await _geoFetchRealFbWrong(xml, _geoPreviewSeed, p);
      if (gen !== _geoRealPreviewGen || !_geoLastReal) return;
      if (fbWrongHTML) {
        _geoLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.geoRefreshPreview === 'function') window.geoRefreshPreview();
      }
    } catch (e) {
      if (gen !== _geoRealPreviewGen) return;
      _geoSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function geoRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'geometrie') return;
    _geoPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _geoRefreshRealPreview();
  }
  window.geoRerollPreviewSeed = geoRerollPreviewSeed;

  function geoShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'geometrie') return;
    _geoEnsurePreviewSeed();
    _geoRefreshRealPreview();
  }
  window.geoShowRealPreview = geoShowRealPreview;

  function _geoAugmentStateWithReal(state) {
    if (_geoLastReal) {
      state.realBodyHTML = _geoLastReal.bodyHTML;
      state.realFbGenHTML = _geoLastReal.fbGenHTML;
      state.realFbWrongHTML = _geoLastReal.fbWrongHTML;
    }
  }

  window.geoRefreshPreview = _hsWireSimplePreview('geometrie', 'geo', 'geo-preview-container', 'fp-geometrie', renderPreviewHTML_geometrie, false, _geoAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-geometrie');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _geoPreviewSeed = null;
          _geoLastReal = null;
          var rerollBtn = document.getElementById('geo-reroll-preview-btn');
          var showRealBtn = document.getElementById('geo-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genGeometrieCore(1, _geoBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _geoSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
