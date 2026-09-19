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

// ── APERÇU "Élasticité-prix de la demande" — simulé (JS local) + réel (via Maxima) ──
// Même situation que bilanpuissance (preview-bilanpuissance.js) : toutes les
// grandeurs (P0, P1, Q0, Q1, élasticité) sont tirées par un rand() natif
// côté Maxima (js/gen-elasticite-calc.js), jamais résolues localement —
// l'aperçu simulé laisse les jetons {@...@} tels quels, l'aperçu réel (👁️,
// /render + /grade) est la seule façon de voir des valeurs effectivement
// calculées. Une seule sous-question (un seul PRT).
function _elaStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#a21caf;border-left:5px solid #701a75;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_elasticite(state) {
  var realParts = {};
  try { realParts = (typeof genElasticiteCore === 'function' && typeof _elaBuildParams === 'function') ? genElasticiteCore(1, _elaBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('ela', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _elaStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('ela.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.elasticite') || 'Élasticité-prix', badgeColor: '#a21caf', noteBg: '#fae8ff', noteColor: '#701a75',
    prefix: 'ela', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('ela.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-elasticite.js pour X=1 (ans_ela1, prt1). Sonde de réponse fausse
// (numérique très négative, jamais atteinte par une élasticité-prix
// plausible de cette ampleur).
(function () {
  var _elaPreviewSeed = null;
  var _elaRealPreviewGen = 0;
  var _elaLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _elaEnsurePreviewSeed() {
    if (!_elaPreviewSeed) _elaPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _elaPreviewSeed;
  }

  function _elaSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('ela-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _elaCleanBodyHTML(html) {
    return _elaStripBannerAndInputs(html);
  }

  function _elaCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _elaFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _elaCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _elaRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'elasticite') return;
    var gen = ++_elaRealPreviewGen;

    var p;
    try { p = _elaBuildParams(); } catch (e) { return; }

    _elaSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genElasticiteCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_elaEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _elaRealPreviewGen) _elaSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _elaPreviewSeed);
      if (gen !== _elaRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _elaLastReal = {
        bodyHTML: _elaCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.elaRefreshPreview === 'function') window.elaRefreshPreview();
      _elaSetRealPreviewStatus('', false);

      var wrongByPrt = await _elaFetchRealFbWrong(xml, _elaPreviewSeed, realParts);
      if (gen !== _elaRealPreviewGen || !_elaLastReal) return;
      if (wrongByPrt) {
        _elaLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.elaRefreshPreview === 'function') window.elaRefreshPreview();
      }
    } catch (e) {
      if (gen !== _elaRealPreviewGen) return;
      _elaSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function elaRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'elasticite') return;
    _elaPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _elaRefreshRealPreview();
  }
  window.elaRerollPreviewSeed = elaRerollPreviewSeed;

  function elaShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'elasticite') return;
    _elaEnsurePreviewSeed();
    _elaRefreshRealPreview();
  }
  window.elaShowRealPreview = elaShowRealPreview;

  function _elaAugmentStateWithReal(state) {
    if (_elaLastReal) {
      state.realBodyHTML = _elaLastReal.bodyHTML;
      state.realFbGenHTML = _elaLastReal.fbGenHTML;
      state.realWrongByPrt = _elaLastReal.wrongByPrt;
    }
  }

  window.elaRefreshPreview = _hsWireSimplePreview('elasticite', 'ela', 'ela-preview-container', 'fp-elasticite', renderPreviewHTML_elasticite, false, _elaAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-elasticite');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _elaPreviewSeed = null;
          _elaLastReal = null;
          var rerollBtn = document.getElementById('ela-reroll-preview-btn');
          var showRealBtn = document.getElementById('ela-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _elaSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
