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

// ── APERÇU "Relation de Fisher (croissance nominale vs réelle)" — simulé (JS local) + réel (via Maxima) ──
// Même situation que bilanpuissance (preview-bilanpuissance.js) : toutes les
// grandeurs (gr, π, gn) sont tirées par un rand() natif côté Maxima
// (js/gen-fisher-calc.js), jamais résolues localement — l'aperçu simulé
// laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render +
// /grade) est la seule façon de voir des valeurs effectivement calculées.
// Une seule sous-question (un seul PRT).
function _fisStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#92400e;border-left:5px solid #451a03;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_fisher(state) {
  var realParts = {};
  try { realParts = (typeof genFisherCore === 'function' && typeof _fisBuildParams === 'function') ? genFisherCore(1, _fisBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('fis', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _fisStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('fis.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.fisher') || 'Fisher', badgeColor: '#92400e', noteBg: '#fef3c7', noteColor: '#451a03',
    prefix: 'fis', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('fis.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-fisher.js pour X=1 (ans_fis1, prt1). Sonde de réponse fausse
// (numérique très négative, jamais atteinte par un taux de croissance
// nominale plausible).
(function () {
  var _fisPreviewSeed = null;
  var _fisRealPreviewGen = 0;
  var _fisLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _fisEnsurePreviewSeed() {
    if (!_fisPreviewSeed) _fisPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _fisPreviewSeed;
  }

  function _fisSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('fis-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _fisCleanBodyHTML(html) {
    return _fisStripBannerAndInputs(html);
  }

  function _fisCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _fisFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _fisCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _fisRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'fisher') return;
    var gen = ++_fisRealPreviewGen;

    var p;
    try { p = _fisBuildParams(); } catch (e) { return; }

    _fisSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genFisherCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_fisEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _fisRealPreviewGen) _fisSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _fisPreviewSeed);
      if (gen !== _fisRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _fisLastReal = {
        bodyHTML: _fisCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.fisRefreshPreview === 'function') window.fisRefreshPreview();
      _fisSetRealPreviewStatus('', false);

      var wrongByPrt = await _fisFetchRealFbWrong(xml, _fisPreviewSeed, realParts);
      if (gen !== _fisRealPreviewGen || !_fisLastReal) return;
      if (wrongByPrt) {
        _fisLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.fisRefreshPreview === 'function') window.fisRefreshPreview();
      }
    } catch (e) {
      if (gen !== _fisRealPreviewGen) return;
      _fisSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function fisRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'fisher') return;
    _fisPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _fisRefreshRealPreview();
  }
  window.fisRerollPreviewSeed = fisRerollPreviewSeed;

  function fisShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'fisher') return;
    _fisEnsurePreviewSeed();
    _fisRefreshRealPreview();
  }
  window.fisShowRealPreview = fisShowRealPreview;

  function _fisAugmentStateWithReal(state) {
    if (_fisLastReal) {
      state.realBodyHTML = _fisLastReal.bodyHTML;
      state.realFbGenHTML = _fisLastReal.fbGenHTML;
      state.realWrongByPrt = _fisLastReal.wrongByPrt;
    }
  }

  window.fisRefreshPreview = _hsWireSimplePreview('fisher', 'fis', 'fis-preview-container', 'fp-fisher', renderPreviewHTML_fisher, false, _fisAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-fisher');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _fisPreviewSeed = null;
          _fisLastReal = null;
          var rerollBtn = document.getElementById('fis-reroll-preview-btn');
          var showRealBtn = document.getElementById('fis-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _fisSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
