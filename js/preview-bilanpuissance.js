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

// ── APERÇU "Bilan de puissance et rendement global" — simulé (JS local) + réel (via Maxima) ──
// Même situation que ieee754 (preview-ieee754.js) : toutes les grandeurs
// (m, v, rendements, puissance) sont tirées par un rand() natif côté Maxima
// (js/gen-bilanpuissance-calc.js), jamais résolues localement — l'aperçu
// simulé laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render +
// /grade) est la seule façon de voir des valeurs effectivement calculées.
// Une seule sous-question (un seul PRT).
function _bpuStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#9f1239;border-left:5px solid #4c0519;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_bilanpuissance(state) {
  var realParts = {};
  try { realParts = (typeof genBilanpuissanceCore === 'function' && typeof _bpuBuildParams === 'function') ? genBilanpuissanceCore(1, _bpuBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('bpu', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _bpuStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('bpu.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.bilanpuissance') || 'Bilan de puissance', badgeColor: '#9f1239', noteBg: '#ffe4e6', noteColor: '#4c0519',
    prefix: 'bpu', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('bpu.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-bilanpuissance.js pour X=1 (ans_bpu1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par une puissance qui est positive).
(function () {
  var _bpuPreviewSeed = null;
  var _bpuRealPreviewGen = 0;
  var _bpuLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _bpuEnsurePreviewSeed() {
    if (!_bpuPreviewSeed) _bpuPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _bpuPreviewSeed;
  }

  function _bpuSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('bpu-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _bpuCleanBodyHTML(html) {
    return _bpuStripBannerAndInputs(html);
  }

  function _bpuCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _bpuFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _bpuCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _bpuRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'bilanpuissance') return;
    var gen = ++_bpuRealPreviewGen;

    var p;
    try { p = _bpuBuildParams(); } catch (e) { return; }

    _bpuSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genBilanpuissanceCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_bpuEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _bpuRealPreviewGen) _bpuSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _bpuPreviewSeed);
      if (gen !== _bpuRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _bpuLastReal = {
        bodyHTML: _bpuCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.bpuRefreshPreview === 'function') window.bpuRefreshPreview();
      _bpuSetRealPreviewStatus('', false);

      var wrongByPrt = await _bpuFetchRealFbWrong(xml, _bpuPreviewSeed, realParts);
      if (gen !== _bpuRealPreviewGen || !_bpuLastReal) return;
      if (wrongByPrt) {
        _bpuLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.bpuRefreshPreview === 'function') window.bpuRefreshPreview();
      }
    } catch (e) {
      if (gen !== _bpuRealPreviewGen) return;
      _bpuSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function bpuRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'bilanpuissance') return;
    _bpuPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _bpuRefreshRealPreview();
  }
  window.bpuRerollPreviewSeed = bpuRerollPreviewSeed;

  function bpuShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'bilanpuissance') return;
    _bpuEnsurePreviewSeed();
    _bpuRefreshRealPreview();
  }
  window.bpuShowRealPreview = bpuShowRealPreview;

  function _bpuAugmentStateWithReal(state) {
    if (_bpuLastReal) {
      state.realBodyHTML = _bpuLastReal.bodyHTML;
      state.realFbGenHTML = _bpuLastReal.fbGenHTML;
      state.realWrongByPrt = _bpuLastReal.wrongByPrt;
    }
  }

  window.bpuRefreshPreview = _hsWireSimplePreview('bilanpuissance', 'bpu', 'bpu-preview-container', 'fp-bilanpuissance', renderPreviewHTML_bilanpuissance, false, _bpuAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-bilanpuissance');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _bpuPreviewSeed = null;
          _bpuLastReal = null;
          var rerollBtn = document.getElementById('bpu-reroll-preview-btn');
          var showRealBtn = document.getElementById('bpu-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _bpuSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
