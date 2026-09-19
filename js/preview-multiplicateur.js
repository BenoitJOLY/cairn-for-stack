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

// ── APERÇU "Multiplicateur keynésien" — simulé (JS local) + réel (via Maxima) ──
// Même situation que bilanpuissance (preview-bilanpuissance.js) : toutes les
// grandeurs (c, ΔI0, ΔY) sont tirées par un rand() natif côté Maxima
// (js/gen-multiplicateur-calc.js), jamais résolues localement — l'aperçu
// simulé laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render +
// /grade) est la seule façon de voir des valeurs effectivement calculées.
// Une seule sous-question (un seul PRT).
function _mulStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#3f6212;border-left:5px solid #14532d;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_multiplicateur(state) {
  var realParts = {};
  try { realParts = (typeof genMultiplicateurCore === 'function' && typeof _mulBuildParams === 'function') ? genMultiplicateurCore(1, _mulBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('mul', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _mulStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('mul.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.multiplicateur') || 'Multiplicateur keynésien', badgeColor: '#3f6212', noteBg: '#ecfccb', noteColor: '#14532d',
    prefix: 'mul', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('mul.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-multiplicateur.js pour X=1 (ans_mul1, prt1). Sonde de réponse fausse
// (numérique très négative, jamais atteinte par un effet multiplicateur
// positif).
(function () {
  var _mulPreviewSeed = null;
  var _mulRealPreviewGen = 0;
  var _mulLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _mulEnsurePreviewSeed() {
    if (!_mulPreviewSeed) _mulPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _mulPreviewSeed;
  }

  function _mulSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('mul-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _mulCleanBodyHTML(html) {
    return _mulStripBannerAndInputs(html);
  }

  function _mulCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _mulFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _mulCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _mulRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'multiplicateur') return;
    var gen = ++_mulRealPreviewGen;

    var p;
    try { p = _mulBuildParams(); } catch (e) { return; }

    _mulSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genMultiplicateurCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_mulEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _mulRealPreviewGen) _mulSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _mulPreviewSeed);
      if (gen !== _mulRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _mulLastReal = {
        bodyHTML: _mulCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.mulRefreshPreview === 'function') window.mulRefreshPreview();
      _mulSetRealPreviewStatus('', false);

      var wrongByPrt = await _mulFetchRealFbWrong(xml, _mulPreviewSeed, realParts);
      if (gen !== _mulRealPreviewGen || !_mulLastReal) return;
      if (wrongByPrt) {
        _mulLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.mulRefreshPreview === 'function') window.mulRefreshPreview();
      }
    } catch (e) {
      if (gen !== _mulRealPreviewGen) return;
      _mulSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function mulRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'multiplicateur') return;
    _mulPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _mulRefreshRealPreview();
  }
  window.mulRerollPreviewSeed = mulRerollPreviewSeed;

  function mulShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'multiplicateur') return;
    _mulEnsurePreviewSeed();
    _mulRefreshRealPreview();
  }
  window.mulShowRealPreview = mulShowRealPreview;

  function _mulAugmentStateWithReal(state) {
    if (_mulLastReal) {
      state.realBodyHTML = _mulLastReal.bodyHTML;
      state.realFbGenHTML = _mulLastReal.fbGenHTML;
      state.realWrongByPrt = _mulLastReal.wrongByPrt;
    }
  }

  window.mulRefreshPreview = _hsWireSimplePreview('multiplicateur', 'mul', 'mul-preview-container', 'fp-multiplicateur', renderPreviewHTML_multiplicateur, false, _mulAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-multiplicateur');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _mulPreviewSeed = null;
          _mulLastReal = null;
          var rerollBtn = document.getElementById('mul-reroll-preview-btn');
          var showRealBtn = document.getElementById('mul-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _mulSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
