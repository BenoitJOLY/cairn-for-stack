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

// ── APERÇU "Kirchhoff / Thévenin" — simulé (JS local) + réel (via Maxima) ──
// Même situation que ieee754 (preview-ieee754.js) : toutes les grandeurs
// (E, R1, R2, R3, I3) sont tirées par un rand() natif côté Maxima
// (js/gen-thevenin-calc.js), jamais résolues localement — l'aperçu simulé
// laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade)
// est la seule façon de voir des valeurs effectivement calculées. Une seule
// sous-question (un seul PRT).
function _thvStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#0c4a6e;border-left:5px solid #082f49;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_thevenin(state) {
  var realParts = {};
  try { realParts = (typeof genTheveninCore === 'function' && typeof _thvBuildParams === 'function') ? genTheveninCore(1, _thvBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('thv', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _thvStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('thv.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.thevenin') || 'Thévenin', badgeColor: '#0c4a6e', noteBg: '#e0f2fe', noteColor: '#082f49',
    prefix: 'thv', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('thv.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-thevenin.js pour X=1 (ans_thv1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par un courant positif).
(function () {
  var _thvPreviewSeed = null;
  var _thvRealPreviewGen = 0;
  var _thvLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _thvEnsurePreviewSeed() {
    if (!_thvPreviewSeed) _thvPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _thvPreviewSeed;
  }

  function _thvSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('thv-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _thvCleanBodyHTML(html) {
    return _thvStripBannerAndInputs(html);
  }

  function _thvCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _thvFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _thvCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _thvRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'thevenin') return;
    var gen = ++_thvRealPreviewGen;

    var p;
    try { p = _thvBuildParams(); } catch (e) { return; }

    _thvSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genTheveninCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_thvEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _thvRealPreviewGen) _thvSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _thvPreviewSeed);
      if (gen !== _thvRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _thvLastReal = {
        bodyHTML: _thvCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.thvRefreshPreview === 'function') window.thvRefreshPreview();
      _thvSetRealPreviewStatus('', false);

      var wrongByPrt = await _thvFetchRealFbWrong(xml, _thvPreviewSeed, realParts);
      if (gen !== _thvRealPreviewGen || !_thvLastReal) return;
      if (wrongByPrt) {
        _thvLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.thvRefreshPreview === 'function') window.thvRefreshPreview();
      }
    } catch (e) {
      if (gen !== _thvRealPreviewGen) return;
      _thvSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function thvRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'thevenin') return;
    _thvPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _thvRefreshRealPreview();
  }
  window.thvRerollPreviewSeed = thvRerollPreviewSeed;

  function thvShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'thevenin') return;
    _thvEnsurePreviewSeed();
    _thvRefreshRealPreview();
  }
  window.thvShowRealPreview = thvShowRealPreview;

  function _thvAugmentStateWithReal(state) {
    if (_thvLastReal) {
      state.realBodyHTML = _thvLastReal.bodyHTML;
      state.realFbGenHTML = _thvLastReal.fbGenHTML;
      state.realWrongByPrt = _thvLastReal.wrongByPrt;
    }
  }

  window.thvRefreshPreview = _hsWireSimplePreview('thevenin', 'thv', 'thv-preview-container', 'fp-thevenin', renderPreviewHTML_thevenin, false, _thvAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-thevenin');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _thvPreviewSeed = null;
          _thvLastReal = null;
          var rerollBtn = document.getElementById('thv-reroll-preview-btn');
          var showRealBtn = document.getElementById('thv-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _thvSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
