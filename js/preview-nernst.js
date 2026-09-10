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

// ── APERÇU "Potentiel de repos (équation de Nernst)" — simulé (JS local) + réel (via Maxima) ──
// Même situation que chi2 (preview-chi2.js) : toutes les grandeurs (k_ext,
// k_int, E_K) sont tirées par un random() natif côté Maxima
// (js/gen-nernst-calc.js), jamais résolues localement — l'aperçu simulé
// laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade)
// est la seule façon de voir des valeurs effectivement calculées. Une seule
// sous-question (un seul PRT).
function _nstStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#6366f1;border-left:5px solid #3730a3;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_nernst(state) {
  var realParts = {};
  try { realParts = (typeof genNernstCore === 'function' && typeof _nstBuildParams === 'function') ? genNernstCore(1, _nstBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('nst', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _nstStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('nst.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.nernst') || 'Potentiel de Nernst', badgeColor: '#6366f1', noteBg: '#e0e7ff', noteColor: '#3730a3',
    prefix: 'nst', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('nst.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-nernst.js pour X=1 (ans_nst1, prt1). Sonde de réponse fausse
// (numérique positive, jamais atteinte par un E_K qui est négatif).
(function () {
  var _nstPreviewSeed = null;
  var _nstRealPreviewGen = 0;
  var _nstLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _nstEnsurePreviewSeed() {
    if (!_nstPreviewSeed) _nstPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _nstPreviewSeed;
  }

  function _nstSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('nst-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _nstCleanBodyHTML(html) {
    return _nstStripBannerAndInputs(html);
  }

  function _nstCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _nstFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _nstCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _nstRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'nernst') return;
    var gen = ++_nstRealPreviewGen;

    var p;
    try { p = _nstBuildParams(); } catch (e) { return; }

    _nstSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genNernstCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_nstEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _nstRealPreviewGen) _nstSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _nstPreviewSeed);
      if (gen !== _nstRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _nstLastReal = {
        bodyHTML: _nstCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.nstRefreshPreview === 'function') window.nstRefreshPreview();
      _nstSetRealPreviewStatus('', false);

      var wrongByPrt = await _nstFetchRealFbWrong(xml, _nstPreviewSeed, realParts);
      if (gen !== _nstRealPreviewGen || !_nstLastReal) return;
      if (wrongByPrt) {
        _nstLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.nstRefreshPreview === 'function') window.nstRefreshPreview();
      }
    } catch (e) {
      if (gen !== _nstRealPreviewGen) return;
      _nstSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function nstRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'nernst') return;
    _nstPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _nstRefreshRealPreview();
  }
  window.nstRerollPreviewSeed = nstRerollPreviewSeed;

  function nstShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'nernst') return;
    _nstEnsurePreviewSeed();
    _nstRefreshRealPreview();
  }
  window.nstShowRealPreview = nstShowRealPreview;

  function _nstAugmentStateWithReal(state) {
    if (_nstLastReal) {
      state.realBodyHTML = _nstLastReal.bodyHTML;
      state.realFbGenHTML = _nstLastReal.fbGenHTML;
      state.realWrongByPrt = _nstLastReal.wrongByPrt;
    }
  }

  window.nstRefreshPreview = _hsWireSimplePreview('nernst', 'nst', 'nst-preview-container', 'fp-nernst', renderPreviewHTML_nernst, false, _nstAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-nernst');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _nstPreviewSeed = null;
          _nstLastReal = null;
          var rerollBtn = document.getElementById('nst-reroll-preview-btn');
          var showRealBtn = document.getElementById('nst-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _nstSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
