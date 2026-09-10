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

// ── APERÇU "Débit cardiaque" — simulé (JS local) + réel (via Maxima) ──
// Même situation que chi2 (preview-chi2.js) : toutes les grandeurs (fc,
// ves_ml, q_correct) sont tirées par un random() natif côté Maxima
// (js/gen-debit-calc.js), jamais résolues localement — l'aperçu simulé
// laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade)
// est la seule façon de voir des valeurs effectivement calculées. Une seule
// sous-question (un seul PRT).
function _debStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#be123c;border-left:5px solid #881337;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_debit(state) {
  var realParts = {};
  try { realParts = (typeof genDebitCore === 'function' && typeof _debBuildParams === 'function') ? genDebitCore(1, _debBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('deb', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _debStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('deb.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.debit') || 'Débit cardiaque', badgeColor: '#be123c', noteBg: '#ffe4e6', noteColor: '#881337',
    prefix: 'deb', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('deb.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-debit.js pour X=1 (ans_deb1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par un débit qui est positif).
(function () {
  var _debPreviewSeed = null;
  var _debRealPreviewGen = 0;
  var _debLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _debEnsurePreviewSeed() {
    if (!_debPreviewSeed) _debPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _debPreviewSeed;
  }

  function _debSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('deb-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _debCleanBodyHTML(html) {
    return _debStripBannerAndInputs(html);
  }

  function _debCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _debFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _debCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _debRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'debit') return;
    var gen = ++_debRealPreviewGen;

    var p;
    try { p = _debBuildParams(); } catch (e) { return; }

    _debSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genDebitCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_debEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _debRealPreviewGen) _debSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _debPreviewSeed);
      if (gen !== _debRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _debLastReal = {
        bodyHTML: _debCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.debRefreshPreview === 'function') window.debRefreshPreview();
      _debSetRealPreviewStatus('', false);

      var wrongByPrt = await _debFetchRealFbWrong(xml, _debPreviewSeed, realParts);
      if (gen !== _debRealPreviewGen || !_debLastReal) return;
      if (wrongByPrt) {
        _debLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.debRefreshPreview === 'function') window.debRefreshPreview();
      }
    } catch (e) {
      if (gen !== _debRealPreviewGen) return;
      _debSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function debRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'debit') return;
    _debPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _debRefreshRealPreview();
  }
  window.debRerollPreviewSeed = debRerollPreviewSeed;

  function debShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'debit') return;
    _debEnsurePreviewSeed();
    _debRefreshRealPreview();
  }
  window.debShowRealPreview = debShowRealPreview;

  function _debAugmentStateWithReal(state) {
    if (_debLastReal) {
      state.realBodyHTML = _debLastReal.bodyHTML;
      state.realFbGenHTML = _debLastReal.fbGenHTML;
      state.realWrongByPrt = _debLastReal.wrongByPrt;
    }
  }

  window.debRefreshPreview = _hsWireSimplePreview('debit', 'deb', 'deb-preview-container', 'fp-debit', renderPreviewHTML_debit, false, _debAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-debit');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _debPreviewSeed = null;
          _debLastReal = null;
          var rerollBtn = document.getElementById('deb-reroll-preview-btn');
          var showRealBtn = document.getElementById('deb-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _debSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
