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

// ── APERÇU "Malthus" — simulé (JS local) + réel (via Maxima) ──
// Même situation que ondesismique (preview-ondesismique.js) : toutes les
// grandeurs (n0, q, t, N_t) sont tirées par un random() natif côté Maxima
// (js/gen-malthus-calc.js), jamais résolues localement — l'aperçu simulé
// laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade) est la
// seule façon de voir des valeurs effectivement calculées. Une seule sous-question
// (un seul PRT).
function _malStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#a16207;border-left:5px solid #713f12;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_malthus(state) {
  var realParts = {};
  try { realParts = (typeof genMalthusCore === 'function' && typeof _malBuildParams === 'function') ? genMalthusCore(1, _malBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('mal', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _malStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('mal.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.malthus') || 'Malthus', badgeColor: '#a16207', noteBg: '#fef3c7', noteColor: '#713f12',
    prefix: 'mal', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('mal.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-malthus.js pour X=1 (ans_mal1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par la population finale qui est positive).
(function () {
  var _malPreviewSeed = null;
  var _malRealPreviewGen = 0;
  var _malLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _malEnsurePreviewSeed() {
    if (!_malPreviewSeed) _malPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _malPreviewSeed;
  }

  function _malSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('mal-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _malCleanBodyHTML(html) {
    return _malStripBannerAndInputs(html);
  }

  function _malCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _malFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _malCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _malRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'malthus') return;
    var gen = ++_malRealPreviewGen;

    var p;
    try { p = _malBuildParams(); } catch (e) { return; }

    _malSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genMalthusCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_malEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _malRealPreviewGen) _malSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _malPreviewSeed);
      if (gen !== _malRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _malLastReal = {
        bodyHTML: _malCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.malRefreshPreview === 'function') window.malRefreshPreview();
      _malSetRealPreviewStatus('', false);

      var wrongByPrt = await _malFetchRealFbWrong(xml, _malPreviewSeed, realParts);
      if (gen !== _malRealPreviewGen || !_malLastReal) return;
      if (wrongByPrt) {
        _malLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.malRefreshPreview === 'function') window.malRefreshPreview();
      }
    } catch (e) {
      if (gen !== _malRealPreviewGen) return;
      _malSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function malRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'malthus') return;
    _malPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _malRefreshRealPreview();
  }
  window.malRerollPreviewSeed = malRerollPreviewSeed;

  function malShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'malthus') return;
    _malEnsurePreviewSeed();
    _malRefreshRealPreview();
  }
  window.malShowRealPreview = malShowRealPreview;

  function _malAugmentStateWithReal(state) {
    if (_malLastReal) {
      state.realBodyHTML = _malLastReal.bodyHTML;
      state.realFbGenHTML = _malLastReal.fbGenHTML;
      state.realWrongByPrt = _malLastReal.wrongByPrt;
    }
  }

  window.malRefreshPreview = _hsWireSimplePreview('malthus', 'mal', 'mal-preview-container', 'fp-malthus', renderPreviewHTML_malthus, false, _malAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-malthus');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _malPreviewSeed = null;
          _malLastReal = null;
          var rerollBtn = document.getElementById('mal-reroll-preview-btn');
          var showRealBtn = document.getElementById('mal-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _malSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
