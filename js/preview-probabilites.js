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

function renderPreviewHTML_probabilites(state) {
  var realParts = {};
  try { realParts = (typeof genProbabilitesCore === 'function') ? genProbabilitesCore(1, _probBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('prob', _hsHasRandomization(realParts.vars || ''));
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
    // Tirage réellement calculé par Maxima (voir _probRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée (fractions/effectifs tirés via ri(...)).
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
    badge: I18N.t('type.probabilites'), badgeColor: '#0369a1', noteBg: '#eff6ff', noteColor: '#0369a1',
    prefix: 'prob', bareme: state.bareme || 1,
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
// du scénario (ans_ck/ans_prob/ans_ex/ans_vx/ans_cond/ans_union, cf.
// gen-math-probabilites.js) : on le lit dynamiquement dans le XML généré via
// _extractInputNames plutôt que le coder en dur.
(function () {
  var _probPreviewSeed = null;
  var _probRealPreviewGen = 0;
  var _probLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _probEnsurePreviewSeed() {
    if (!_probPreviewSeed) _probPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _probPreviewSeed;
  }

  function _probSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('prob-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _probCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _probCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais syntaxiquement valide (tous les scénarios
  // Probabilités attendent un nombre — entier, fraction ou décimal — comparé via
  // AlgEquiv) : un entier très négatif, jamais atteint par un dénombrement ou une
  // probabilité (toujours positive/nulle par construction).
  async function _probFetchRealFbWrong(xml, seed) {
    try {
      var inputNames = (typeof _extractInputNames === 'function') ? _extractInputNames(xml) : [];
      if (!inputNames.length) return null;
      var answers = {};
      answers[inputNames[0]] = '-999999';
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _probCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _probRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'probabilites') return;
    var gen = ++_probRealPreviewGen;

    var p;
    try { p = _probBuildParams(); } catch (e) { return; }

    _probSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genProbabilitesCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_probEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _probRealPreviewGen) _probSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _probPreviewSeed);
      if (gen !== _probRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _probLastReal = {
        bodyHTML: _probCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.probRefreshPreview === 'function') window.probRefreshPreview();
      _probSetRealPreviewStatus('', false);

      var fbWrongHTML = await _probFetchRealFbWrong(xml, _probPreviewSeed);
      if (gen !== _probRealPreviewGen || !_probLastReal) return;
      if (fbWrongHTML) {
        _probLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.probRefreshPreview === 'function') window.probRefreshPreview();
      }
    } catch (e) {
      if (gen !== _probRealPreviewGen) return;
      _probSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function probRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'probabilites') return;
    _probPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _probRefreshRealPreview();
  }
  window.probRerollPreviewSeed = probRerollPreviewSeed;

  function probShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'probabilites') return;
    _probEnsurePreviewSeed();
    _probRefreshRealPreview();
  }
  window.probShowRealPreview = probShowRealPreview;

  function _probAugmentStateWithReal(state) {
    if (_probLastReal) {
      state.realBodyHTML = _probLastReal.bodyHTML;
      state.realFbGenHTML = _probLastReal.fbGenHTML;
      state.realFbWrongHTML = _probLastReal.fbWrongHTML;
    }
  }

  window.probRefreshPreview = _hsWireSimplePreview('probabilites', 'prob', 'prob-preview-container', 'fp-probabilites', renderPreviewHTML_probabilites, false, _probAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-probabilites');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _probPreviewSeed = null;
          _probLastReal = null;
          var rerollBtn = document.getElementById('prob-reroll-preview-btn');
          var showRealBtn = document.getElementById('prob-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genProbabilitesCore(1, _probBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _probSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
