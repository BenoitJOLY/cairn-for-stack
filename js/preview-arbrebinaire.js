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

// ── APERÇU "Dénombrement sur les arbres binaires complets" — simulé (JS local) + réel (via Maxima) ──
// Même situation que chi2/ieee754/complexite : toutes les grandeurs (h,
// nombre de nœuds) sont tirées par un rand() natif côté Maxima
// (js/gen-arbrebinaire-calc.js), jamais résolues localement. Une seule
// sous-question (un seul PRT à 2 nœuds).
function _arbStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#7c2d12;border-left:5px solid #431407;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_arbrebinaire(state) {
  var realParts = {};
  try { realParts = (typeof genArbrebinaireCore === 'function' && typeof _arbBuildParams === 'function') ? genArbrebinaireCore(1, _arbBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('arb', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _arbStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('arb.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.arbrebinaire') || 'Arbres binaires', badgeColor: '#7c2d12', noteBg: '#ffedd5', noteColor: '#431407',
    prefix: 'arb', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('arb.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-arbrebinaire.js pour X=1 (ans_arb1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par un nombre de nœuds qui est positif).
(function () {
  var _arbPreviewSeed = null;
  var _arbRealPreviewGen = 0;
  var _arbLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _arbEnsurePreviewSeed() {
    if (!_arbPreviewSeed) _arbPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _arbPreviewSeed;
  }

  function _arbSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('arb-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _arbCleanBodyHTML(html) {
    return _arbStripBannerAndInputs(html);
  }

  function _arbCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _arbFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _arbCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _arbRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'arbrebinaire') return;
    var gen = ++_arbRealPreviewGen;

    var p;
    try { p = _arbBuildParams(); } catch (e) { return; }

    _arbSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genArbrebinaireCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_arbEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _arbRealPreviewGen) _arbSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _arbPreviewSeed);
      if (gen !== _arbRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _arbLastReal = {
        bodyHTML: _arbCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.arbRefreshPreview === 'function') window.arbRefreshPreview();
      _arbSetRealPreviewStatus('', false);

      var wrongByPrt = await _arbFetchRealFbWrong(xml, _arbPreviewSeed, realParts);
      if (gen !== _arbRealPreviewGen || !_arbLastReal) return;
      if (wrongByPrt) {
        _arbLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.arbRefreshPreview === 'function') window.arbRefreshPreview();
      }
    } catch (e) {
      if (gen !== _arbRealPreviewGen) return;
      _arbSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function arbRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'arbrebinaire') return;
    _arbPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _arbRefreshRealPreview();
  }
  window.arbRerollPreviewSeed = arbRerollPreviewSeed;

  function arbShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'arbrebinaire') return;
    _arbEnsurePreviewSeed();
    _arbRefreshRealPreview();
  }
  window.arbShowRealPreview = arbShowRealPreview;

  function _arbAugmentStateWithReal(state) {
    if (_arbLastReal) {
      state.realBodyHTML = _arbLastReal.bodyHTML;
      state.realFbGenHTML = _arbLastReal.fbGenHTML;
      state.realWrongByPrt = _arbLastReal.wrongByPrt;
    }
  }

  window.arbRefreshPreview = _hsWireSimplePreview('arbrebinaire', 'arb', 'arb-preview-container', 'fp-arbrebinaire', renderPreviewHTML_arbrebinaire, false, _arbAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-arbrebinaire');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _arbPreviewSeed = null;
          _arbLastReal = null;
          var rerollBtn = document.getElementById('arb-reroll-preview-btn');
          var showRealBtn = document.getElementById('arb-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _arbSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
