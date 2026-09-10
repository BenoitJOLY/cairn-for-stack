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

// ── APERÇU "Horloge moléculaire" — simulé (JS local) + réel (via Maxima) ──
// Même situation que distancegenetique (preview-distancegenetique.js) : toutes les
// grandeurs (longueur de séquence, taux, % de divergence, T) sont tirées par un
// random() natif côté Maxima (js/gen-horlogemoleculaire-calc.js), jamais résolues
// localement — l'aperçu simulé laisse les jetons {@...@} tels quels, l'aperçu réel
// (👁️, /render + /grade) est la seule façon de voir des valeurs effectivement calculées.
function _hmStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#78350f;border-left:5px solid #451a03;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_horlogemoleculaire(state) {
  var realParts = {};
  try { realParts = (typeof genHorlogeMoleculaireCore === 'function' && typeof _hmBuildParams === 'function') ? genHorlogeMoleculaireCore(1, _hmBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('hm', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _hmStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('hm.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars) + note;
  }

  var steps = (realParts.prts || []).map(function (prt) {
    var node = prt.nodes[0];
    var okBox = applyFbBox('true', _calcTokenizeForPreview(node.truefeedback || '', knownVars));
    var wrongBox = (state.realWrongByPrt && state.realWrongByPrt[prt.meta.name])
      ? state.realWrongByPrt[prt.meta.name]
      : applyFbBox('false', _calcTokenizeForPreview((prt.nodes.length > 1 ? prt.nodes[1].truefeedback : node.falsefeedback) || '', knownVars));
    return { desc: (node.description || '') + ' — ' + parseFloat(prt.meta.value) + ' pt', fb: okBox + wrongBox };
  });

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.horlogemoleculaire') || 'Horloge moléculaire', badgeColor: '#78350f', noteBg: '#fef3c7', noteColor: '#451a03',
    prefix: 'hm', bareme: state.bareme || 2,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('hm.preview_steps_title') || 'Sous-questions',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-horlogemoleculaire.js pour X=1 (ans_hmf1/ans_hmv1, prt1form/prt1val).
// Sonde de réponse fausse par sous-question (numérique, jamais atteint par
// la formule littérale/la valeur, qui utilisent des tans symboliques/numériques distincts).
(function () {
  var _hmPreviewSeed = null;
  var _hmRealPreviewGen = 0;
  var _hmLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _hmEnsurePreviewSeed() {
    if (!_hmPreviewSeed) _hmPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _hmPreviewSeed;
  }

  function _hmSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('hm-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _hmCleanBodyHTML(html) {
    return _hmStripBannerAndInputs(html);
  }

  function _hmCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _hmFetchRealFbWrong(xml, seed, realParts) {
    try {
      var answers = {};
      (realParts.prts || []).forEach(function (prt) {
        answers[prt.nodes[0].sans] = '-999999';
      });
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts) return null;
      var byPrt = {};
      (realParts.prts || []).forEach(function (prt) {
        var html = gradeRes.prts[prt.meta.name];
        if (html) byPrt[prt.meta.name] = _hmCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _hmRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'horlogemoleculaire') return;
    var gen = ++_hmRealPreviewGen;

    var p;
    try { p = _hmBuildParams(); } catch (e) { return; }

    _hmSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genHorlogeMoleculaireCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_hmEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _hmRealPreviewGen) _hmSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _hmPreviewSeed);
      if (gen !== _hmRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _hmLastReal = {
        bodyHTML: _hmCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.hmRefreshPreview === 'function') window.hmRefreshPreview();
      _hmSetRealPreviewStatus('', false);

      var wrongByPrt = await _hmFetchRealFbWrong(xml, _hmPreviewSeed, realParts);
      if (gen !== _hmRealPreviewGen || !_hmLastReal) return;
      if (wrongByPrt) {
        _hmLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.hmRefreshPreview === 'function') window.hmRefreshPreview();
      }
    } catch (e) {
      if (gen !== _hmRealPreviewGen) return;
      _hmSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function hmRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'horlogemoleculaire') return;
    _hmPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _hmRefreshRealPreview();
  }
  window.hmRerollPreviewSeed = hmRerollPreviewSeed;

  function hmShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'horlogemoleculaire') return;
    _hmEnsurePreviewSeed();
    _hmRefreshRealPreview();
  }
  window.hmShowRealPreview = hmShowRealPreview;

  function _hmAugmentStateWithReal(state) {
    if (_hmLastReal) {
      state.realBodyHTML = _hmLastReal.bodyHTML;
      state.realFbGenHTML = _hmLastReal.fbGenHTML;
      state.realWrongByPrt = _hmLastReal.wrongByPrt;
    }
  }

  window.hmRefreshPreview = _hsWireSimplePreview('horlogemoleculaire', 'hm', 'hm-preview-container', 'fp-horlogemoleculaire', renderPreviewHTML_horlogemoleculaire, false, _hmAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même convention
  // que preview-distancegenetique.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-horlogemoleculaire');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _hmPreviewSeed = null;
          _hmLastReal = null;
          var rerollBtn = document.getElementById('hm-reroll-preview-btn');
          var showRealBtn = document.getElementById('hm-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _hmSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
