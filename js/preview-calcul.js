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

function renderPreviewHTML_calcul(state) {
  var fbGenTab = document.getElementById('calc-fb-gen');
  var fbGenActive = !!(fbGenTab && fbGenTab.classList.contains('on'));
  var realParts = {};
  try { realParts = (typeof genCalculCore === 'function') ? genCalculCore(1, _calcBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('calc', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  // fbOk/fbWrong ne viennent PAS de _hsPrtBoxes ici (contrairement à basen/statistiques) :
  // selon le scénario, le nœud PRT n°0 n'est pas toujours celui qui porte le feedback
  // "réponse correcte" final (ex. tangente-ext, convexite-tangente, encadrement-tvi,
  // aire-courbes testent d'abord une valeur intermédiaire) — on continue donc d'afficher
  // directement le texte saisi par l'enseignant (état déjà utilisé avant l'aperçu réel),
  // simplement encadré via applyFbBox pour pouvoir accueillir realFbWrongHTML sans double
  // encadré (cf. commentaire fbBoxesPreWrapped dans js/preview.js).
  var fbOkHTML = applyFbBox('true', stripLeadingFbIcon(state.fbOk || FB_JUSTE_DEFAULT()));
  var wrongFbHTML = applyFbBox('false', stripLeadingFbIcon(state.fbWrong || FB_FAUX_DEFAULT()));
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _calcRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée, quel que soit le scénario choisi.
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realGeneralFeedback, knownVars);
    if (state.realFbWrongHTML) wrongFbHTML = state.realFbWrongHTML;
  } else {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    var bodyFrag = (realParts.textFrag || '')
      .replace(/^<div style="background:#475569;border-left:5px solid #334155;[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + I18N.t('calc.preview_auto_maxima') + '</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('calc.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realGeneralFeedback, knownVars) + note;
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('badge.calcul'), badgeColor: '#4338ca', noteBg: '#eef2ff', noteColor: '#4338ca',
    prefix: 'calc', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    onlyFbGen: fbGenActive,
    hideFbGen: !fbGenActive,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: fbOkHTML, fbWrong: wrongFbHTML, fbGen: state.fbGen, fbBoxesPreWrapped: true,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: applyFbBox(n.kind, _calcTokenizeForPreview(n.fb, knownVars)) };
    })
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// Même mécanisme que preview-basen.js/preview-statistiques.js : le HTML de /render
// (questionrender) déjà substitué par Maxima pour l'énoncé, et
// questionsamplesolutiontext pour le bloc "Correction". Plusieurs scénarios ont
// PLUSIEURS champs de réponse (ex. encadrement-tvi : 4 inputs ; tangente-ext,
// convexite-tangente, aire-courbes : 2 inputs) : on lit tous les noms d'input via
// _extractInputNames(xml) plutôt qu'un nom fixe, et on sonde CHAQUE input — un seul
// champ faux suffit à faire échouer l'équivalence globale et à déclencher le
// feedback "faux" du PRT (unique par question, même s'il a plusieurs nœuds internes).
(function () {
  var _calcPreviewSeed = null;
  var _calcRealPreviewGen = 0;
  var _calcLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _calcEnsurePreviewSeed() {
    if (!_calcPreviewSeed) _calcPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _calcPreviewSeed;
  }

  function _calcSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('calc-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _calcCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _calcCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais toujours syntaxiquement valide pour un champ
  // algébrique (AlgEquiv) ou numérique : un entier négatif littéral, jamais atteint
  // par une dérivée/primitive/racine/aire calculée. Appliquée à TOUS les inputs du
  // scénario (cf. commentaire ci-dessus).
  async function _calcFetchRealFbWrong(xml, seed) {
    try {
      var inputNames = (typeof _extractInputNames === 'function') ? _extractInputNames(xml) : [];
      if (!inputNames.length) return null;
      var answers = {};
      inputNames.forEach(function(name) { answers[name] = '-999999'; });
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _calcCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _calcRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'calcul') return;
    var gen = ++_calcRealPreviewGen;

    var p;
    try { p = _calcBuildParams(); } catch (e) { return; }

    _calcSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genCalculCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_calcEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _calcRealPreviewGen) _calcSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _calcPreviewSeed);
      if (gen !== _calcRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _calcLastReal = {
        bodyHTML: _calcCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.calcRefreshPreview === 'function') window.calcRefreshPreview();
      _calcSetRealPreviewStatus('', false);

      var fbWrongHTML = await _calcFetchRealFbWrong(xml, _calcPreviewSeed);
      if (gen !== _calcRealPreviewGen || !_calcLastReal) return;
      if (fbWrongHTML) {
        _calcLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.calcRefreshPreview === 'function') window.calcRefreshPreview();
      }
    } catch (e) {
      if (gen !== _calcRealPreviewGen) return;
      _calcSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function calcRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'calcul') return;
    _calcPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _calcRefreshRealPreview();
  }
  window.calcRerollPreviewSeed = calcRerollPreviewSeed;

  function calcShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'calcul') return;
    _calcEnsurePreviewSeed();
    _calcRefreshRealPreview();
  }
  window.calcShowRealPreview = calcShowRealPreview;

  function _calcAugmentStateWithReal(state) {
    if (_calcLastReal) {
      state.realBodyHTML = _calcLastReal.bodyHTML;
      state.realFbGenHTML = _calcLastReal.fbGenHTML;
      state.realFbWrongHTML = _calcLastReal.fbWrongHTML;
    }
  }

  window.calcRefreshPreview = _hsWireSimplePreview('calcul', 'calc', 'calc-preview-container', 'fp-calcul', renderPreviewHTML_calcul, false, _calcAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-calcul');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _calcPreviewSeed = null;
          _calcLastReal = null;
          var rerollBtn = document.getElementById('calc-reroll-preview-btn');
          var showRealBtn = document.getElementById('calc-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genCalculCore(1, _calcBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _calcSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
