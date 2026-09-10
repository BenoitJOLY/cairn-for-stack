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

// ── APERÇU "Distance génétique (test-cross)" — simulé (JS local) + réel (via Maxima) ──
// Même situation que hardyweinberg/croisements (preview-croisements.js) : toutes les
// grandeurs (ntotal, rpct, effectifs, taux, distance) sont tirées par un random() natif
// côté Maxima (js/gen-distancegenetique-calc.js), jamais résolues localement — l'aperçu
// simulé laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade) est
// la seule façon de voir des valeurs effectivement calculées.
function _dgStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#9d174d;border-left:5px solid #831843;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_distancegenetique(state) {
  var realParts = {};
  try { realParts = (typeof genDistanceGenetiqueCore === 'function' && typeof _dgBuildParams === 'function') ? genDistanceGenetiqueCore(1, _dgBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('dg', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _dgStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('dg.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.distancegenetique') || 'Distance génétique', badgeColor: '#9d174d', noteBg: '#fdf2f8', noteColor: '#831843',
    prefix: 'dg', bareme: state.bareme || 2,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('dg.preview_steps_title') || 'Sous-questions',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-distancegenetique.js pour X=1 (ans_dga1/ans_dgd1, prt1taux/prt1dist).
// Sonde de réponse fausse par sous-question (numérique, jamais atteint par taux/distance).
(function () {
  var _dgPreviewSeed = null;
  var _dgRealPreviewGen = 0;
  var _dgLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _dgEnsurePreviewSeed() {
    if (!_dgPreviewSeed) _dgPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _dgPreviewSeed;
  }

  function _dgSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('dg-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _dgCleanBodyHTML(html) {
    return _dgStripBannerAndInputs(html);
  }

  function _dgCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _dgFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _dgCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _dgRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'distancegenetique') return;
    var gen = ++_dgRealPreviewGen;

    var p;
    try { p = _dgBuildParams(); } catch (e) { return; }

    _dgSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genDistanceGenetiqueCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_dgEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _dgRealPreviewGen) _dgSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _dgPreviewSeed);
      if (gen !== _dgRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _dgLastReal = {
        bodyHTML: _dgCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.dgRefreshPreview === 'function') window.dgRefreshPreview();
      _dgSetRealPreviewStatus('', false);

      var wrongByPrt = await _dgFetchRealFbWrong(xml, _dgPreviewSeed, realParts);
      if (gen !== _dgRealPreviewGen || !_dgLastReal) return;
      if (wrongByPrt) {
        _dgLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.dgRefreshPreview === 'function') window.dgRefreshPreview();
      }
    } catch (e) {
      if (gen !== _dgRealPreviewGen) return;
      _dgSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function dgRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'distancegenetique') return;
    _dgPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _dgRefreshRealPreview();
  }
  window.dgRerollPreviewSeed = dgRerollPreviewSeed;

  function dgShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'distancegenetique') return;
    _dgEnsurePreviewSeed();
    _dgRefreshRealPreview();
  }
  window.dgShowRealPreview = dgShowRealPreview;

  function _dgAugmentStateWithReal(state) {
    if (_dgLastReal) {
      state.realBodyHTML = _dgLastReal.bodyHTML;
      state.realFbGenHTML = _dgLastReal.fbGenHTML;
      state.realWrongByPrt = _dgLastReal.wrongByPrt;
    }
  }

  window.dgRefreshPreview = _hsWireSimplePreview('distancegenetique', 'dg', 'dg-preview-container', 'fp-distancegenetique', renderPreviewHTML_distancegenetique, false, _dgAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même convention
  // que preview-croisements.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-distancegenetique');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _dgPreviewSeed = null;
          _dgLastReal = null;
          var rerollBtn = document.getElementById('dg-reroll-preview-btn');
          var showRealBtn = document.getElementById('dg-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _dgSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
