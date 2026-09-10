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

// ── APERÇU "Titrage et dilutions en série" — simulé (JS local) + réel (via Maxima) ──
// Même situation que nernst/chi2 : le tube tiré (n) et le facteur de
// dilution attendu sont tirés par un random() natif côté Maxima
// (js/gen-dilutions-calc.js), jamais résolus localement — l'aperçu simulé
// laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade)
// est la seule façon de voir des valeurs effectivement calculées. Une seule
// sous-question (un seul PRT).
function _dilStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#ca8a04;border-left:5px solid #854d0e;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_dilutions(state) {
  var realParts = {};
  try { realParts = (typeof genDilutionsCore === 'function' && typeof _dilBuildParams === 'function') ? genDilutionsCore(1, _dilBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('dil', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _dilStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('dil.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.dilutions') || 'Dilutions en série', badgeColor: '#ca8a04', noteBg: '#fef3c7', noteColor: '#854d0e',
    prefix: 'dil', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('dil.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-dilutions.js pour X=1 (ans_dil1, prt1). Sonde de réponse fausse
// (numérique, jamais atteinte par un facteur de dilution 1/10^n).
(function () {
  var _dilPreviewSeed = null;
  var _dilRealPreviewGen = 0;
  var _dilLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _dilEnsurePreviewSeed() {
    if (!_dilPreviewSeed) _dilPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _dilPreviewSeed;
  }

  function _dilSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('dil-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _dilCleanBodyHTML(html) {
    return _dilStripBannerAndInputs(html);
  }

  function _dilCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _dilFetchRealFbWrong(xml, seed, realParts) {
    try {
      var answers = {};
      (realParts.prts || []).forEach(function (prt) {
        answers[prt.nodes[0].sans] = '999999';
      });
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts) return null;
      var byPrt = {};
      (realParts.prts || []).forEach(function (prt) {
        var html = gradeRes.prts[prt.meta.name];
        if (html) byPrt[prt.meta.name] = _dilCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _dilRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'dilutions') return;
    var gen = ++_dilRealPreviewGen;

    var p;
    try { p = _dilBuildParams(); } catch (e) { return; }

    _dilSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genDilutionsCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_dilEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _dilRealPreviewGen) _dilSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _dilPreviewSeed);
      if (gen !== _dilRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _dilLastReal = {
        bodyHTML: _dilCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.dilRefreshPreview === 'function') window.dilRefreshPreview();
      _dilSetRealPreviewStatus('', false);

      var wrongByPrt = await _dilFetchRealFbWrong(xml, _dilPreviewSeed, realParts);
      if (gen !== _dilRealPreviewGen || !_dilLastReal) return;
      if (wrongByPrt) {
        _dilLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.dilRefreshPreview === 'function') window.dilRefreshPreview();
      }
    } catch (e) {
      if (gen !== _dilRealPreviewGen) return;
      _dilSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function dilRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'dilutions') return;
    _dilPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _dilRefreshRealPreview();
  }
  window.dilRerollPreviewSeed = dilRerollPreviewSeed;

  function dilShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'dilutions') return;
    _dilEnsurePreviewSeed();
    _dilRefreshRealPreview();
  }
  window.dilShowRealPreview = dilShowRealPreview;

  function _dilAugmentStateWithReal(state) {
    if (_dilLastReal) {
      state.realBodyHTML = _dilLastReal.bodyHTML;
      state.realFbGenHTML = _dilLastReal.fbGenHTML;
      state.realWrongByPrt = _dilLastReal.wrongByPrt;
    }
  }

  window.dilRefreshPreview = _hsWireSimplePreview('dilutions', 'dil', 'dil-preview-container', 'fp-dilutions', renderPreviewHTML_dilutions, false, _dilAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-dilutions');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _dilPreviewSeed = null;
          _dilLastReal = null;
          var rerollBtn = document.getElementById('dil-reroll-preview-btn');
          var showRealBtn = document.getElementById('dil-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _dilSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
