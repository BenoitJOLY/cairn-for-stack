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

// ── APERÇU "Test du χ² en écologie" — simulé (JS local) + réel (via Maxima) ──
// Même situation que malthus (preview-malthus.js) : toutes les grandeurs
// (n_total, o1..o4, t1..t4, χ²) sont tirées par un random() natif côté Maxima
// (js/gen-chi2-calc.js), jamais résolues localement — l'aperçu simulé laisse
// les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade) est la
// seule façon de voir des valeurs effectivement calculées. Une seule
// sous-question (un seul PRT).
function _chiStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#4c1d95;border-left:5px solid #2e1065;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_chi2(state) {
  var realParts = {};
  try { realParts = (typeof genChi2Core === 'function' && typeof _chiBuildParams === 'function') ? genChi2Core(1, _chiBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('chi', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _chiStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('chi.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.chi2') || 'Test du χ²', badgeColor: '#4c1d95', noteBg: '#ede9fe', noteColor: '#2e1065',
    prefix: 'chi', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('chi.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-chi2.js pour X=1 (ans_chi1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par un χ² qui est positif).
(function () {
  var _chiPreviewSeed = null;
  var _chiRealPreviewGen = 0;
  var _chiLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _chiEnsurePreviewSeed() {
    if (!_chiPreviewSeed) _chiPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _chiPreviewSeed;
  }

  function _chiSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('chi-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _chiCleanBodyHTML(html) {
    return _chiStripBannerAndInputs(html);
  }

  function _chiCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _chiFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _chiCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _chiRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'chi2') return;
    var gen = ++_chiRealPreviewGen;

    var p;
    try { p = _chiBuildParams(); } catch (e) { return; }

    _chiSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genChi2Core(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_chiEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _chiRealPreviewGen) _chiSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _chiPreviewSeed);
      if (gen !== _chiRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _chiLastReal = {
        bodyHTML: _chiCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.chiRefreshPreview === 'function') window.chiRefreshPreview();
      _chiSetRealPreviewStatus('', false);

      var wrongByPrt = await _chiFetchRealFbWrong(xml, _chiPreviewSeed, realParts);
      if (gen !== _chiRealPreviewGen || !_chiLastReal) return;
      if (wrongByPrt) {
        _chiLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.chiRefreshPreview === 'function') window.chiRefreshPreview();
      }
    } catch (e) {
      if (gen !== _chiRealPreviewGen) return;
      _chiSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function chiRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'chi2') return;
    _chiPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _chiRefreshRealPreview();
  }
  window.chiRerollPreviewSeed = chiRerollPreviewSeed;

  function chiShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'chi2') return;
    _chiEnsurePreviewSeed();
    _chiRefreshRealPreview();
  }
  window.chiShowRealPreview = chiShowRealPreview;

  function _chiAugmentStateWithReal(state) {
    if (_chiLastReal) {
      state.realBodyHTML = _chiLastReal.bodyHTML;
      state.realFbGenHTML = _chiLastReal.fbGenHTML;
      state.realWrongByPrt = _chiLastReal.wrongByPrt;
    }
  }

  window.chiRefreshPreview = _hsWireSimplePreview('chi2', 'chi', 'chi-preview-container', 'fp-chi2', renderPreviewHTML_chi2, false, _chiAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-chi2');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _chiPreviewSeed = null;
          _chiLastReal = null;
          var rerollBtn = document.getElementById('chi-reroll-preview-btn');
          var showRealBtn = document.getElementById('chi-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _chiSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
