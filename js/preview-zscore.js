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

// ── APERÇU "Z-score" — simulé (JS local) + réel (via Maxima) ──
// Même limitation que preview-incertitude.js : q${X}_z est enveloppé dans
// float(...) côté Maxima (gen-zscore-calc.js), donc _calcExtractKnownVars
// (js/preview.js) ne peut jamais résoudre localement la valeur de z —
// l'aperçu réel (👁️, /render + /grade) est la seule façon de voir la valeur
// calculée. Type autonome sans randomisation (MVP en valeur fixe uniquement,
// cf. décision utilisateur) → pas de bouton "reroll" (toujours masqué).
function _zsStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#6d28d9;border-left:5px solid #5b21b6;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_zscore(state) {
  var realParts = {};
  try { realParts = (typeof genZscoreCore === 'function' && typeof _zsBuildParams === 'function') ? genZscoreCore(1, _zsBuildParams()) : {}; } catch (e) { realParts = {}; }

  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _zsStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('zs.preview_empty') || 'Cochez au moins une étape à évaluer pour voir l’aperçu.') + '</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars) + note;
  }

  var steps = (realParts.prts || []).map(function (prt) {
    var node = prt.nodes[0];
    var okBox = applyFbBox('true', _calcTokenizeForPreview(node.truefeedback || '', knownVars));
    var wrongBox = (state.realWrongByPrt && state.realWrongByPrt[prt.meta.name])
      ? state.realWrongByPrt[prt.meta.name]
      : applyFbBox('false', _calcTokenizeForPreview(node.falsefeedback || '', knownVars));
    return { desc: (node.description || '') + ' — ' + parseFloat(prt.meta.value) + ' pt', fb: okBox + wrongBox };
  });

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.zscore') || 'Z-score', badgeColor: '#6d28d9', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'zs', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('zs.preview_steps_title') || 'Étapes évaluées',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-zscore.js pour X=1 (ans_z1/ans_ccl1, prt1_z/prt1_ccl). Sonde de réponse
// fausse par étape cochée (numérique pour 'z', chaîne opposée pour
// 'conclusion' — cf. _incBuildWrongProbe dans preview-incertitude.js).
(function () {
  var _zsPreviewSeed = null;
  var _zsRealPreviewGen = 0;
  var _zsLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _zsEnsurePreviewSeed() {
    if (!_zsPreviewSeed) _zsPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _zsPreviewSeed;
  }

  function _zsSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('zs-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _zsCleanBodyHTML(html) {
    return _zsStripBannerAndInputs(html);
  }

  function _zsCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  function _zsBuildWrongProbe(node) {
    return node.answertest === 'String' ? '"__reponse_fausse__"' : '-999999';
  }

  async function _zsFetchRealFbWrong(xml, seed, realParts) {
    try {
      var answers = {};
      (realParts.prts || []).forEach(function (prt) {
        answers[prt.nodes[0].sans] = _zsBuildWrongProbe(prt.nodes[0]);
      });
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts) return null;
      var byPrt = {};
      (realParts.prts || []).forEach(function (prt) {
        var html = gradeRes.prts[prt.meta.name];
        if (html) byPrt[prt.meta.name] = _zsCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _zsRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'zscore') return;
    var gen = ++_zsRealPreviewGen;

    var p;
    try { p = _zsBuildParams(); } catch (e) { return; }

    _zsSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genZscoreCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_zsEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _zsRealPreviewGen) _zsSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _zsPreviewSeed);
      if (gen !== _zsRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _zsLastReal = {
        bodyHTML: _zsCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.zsRefreshPreview === 'function') window.zsRefreshPreview();
      _zsSetRealPreviewStatus('', false);

      var wrongByPrt = await _zsFetchRealFbWrong(xml, _zsPreviewSeed, realParts);
      if (gen !== _zsRealPreviewGen || !_zsLastReal) return;
      if (wrongByPrt) {
        _zsLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.zsRefreshPreview === 'function') window.zsRefreshPreview();
      }
    } catch (e) {
      if (gen !== _zsRealPreviewGen) return;
      _zsSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function zsShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'zscore') return;
    _zsEnsurePreviewSeed();
    _zsRefreshRealPreview();
  }
  window.zsShowRealPreview = zsShowRealPreview;

  function _zsAugmentStateWithReal(state) {
    if (_zsLastReal) {
      state.realBodyHTML = _zsLastReal.bodyHTML;
      state.realFbGenHTML = _zsLastReal.fbGenHTML;
      state.realWrongByPrt = _zsLastReal.wrongByPrt;
    }
  }

  window.zsRefreshPreview = _hsWireSimplePreview('zscore', 'zs', 'zs-preview-container', 'fp-zscore', renderPreviewHTML_zscore, false, _zsAugmentStateWithReal);

  // Pas de bouton reroll (aucune randomisation possible dans ce MVP) : seul
  // le bouton "aperçu réel" est affiché/masqué selon la config Maxima.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-zscore');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _zsPreviewSeed = null;
          _zsLastReal = null;
          var showRealBtn = document.getElementById('zs-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _zsSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
