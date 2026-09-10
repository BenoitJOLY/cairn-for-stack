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

// ── APERÇU "Règle du 10%" — simulé (JS local) + réel (via Maxima) ──
// Même situation que radiochronologie (preview-radiochronologie.js) : toutes les
// grandeurs (b0, n_partA, k_target, m_val, biomasse_a, n_max) sont tirées par un
// random() natif côté Maxima (js/gen-regle10-calc.js), jamais résolues localement
// — l'aperçu simulé laisse les jetons {@...@} tels quels, l'aperçu réel (👁️,
// /render + /grade) est la seule façon de voir des valeurs effectivement
// calculées. Deux sous-questions (deux PRTs), chacune à un seul nœud (pas de
// cascade diagnostique, cf. gen-regle10.js).
function _regStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#065f46;border-left:5px solid #022c22;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_regle10(state) {
  var realParts = {};
  try { realParts = (typeof genRegle10Core === 'function' && typeof _regBuildParams === 'function') ? genRegle10Core(1, _regBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('reg', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _regStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('reg.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.regle10') || 'Règle du 10%', badgeColor: '#065f46', noteBg: '#d1fae5', noteColor: '#022c22',
    prefix: 'reg', bareme: state.bareme || 2,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('reg.preview_steps_title') || 'Sous-questions',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-regle10.js pour X=1 (ans_reg1_1/ans_reg2_1, prt1a/prt1b). Sonde de réponse
// fausse par sous-question (numérique, jamais atteinte par les tans respectifs).
(function () {
  var _regPreviewSeed = null;
  var _regRealPreviewGen = 0;
  var _regLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _regEnsurePreviewSeed() {
    if (!_regPreviewSeed) _regPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _regPreviewSeed;
  }

  function _regSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('reg-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _regCleanBodyHTML(html) {
    return _regStripBannerAndInputs(html);
  }

  function _regCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _regFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _regCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _regRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'regle10') return;
    var gen = ++_regRealPreviewGen;

    var p;
    try { p = _regBuildParams(); } catch (e) { return; }

    _regSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genRegle10Core(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_regEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _regRealPreviewGen) _regSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _regPreviewSeed);
      if (gen !== _regRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _regLastReal = {
        bodyHTML: _regCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.regRefreshPreview === 'function') window.regRefreshPreview();
      _regSetRealPreviewStatus('', false);

      var wrongByPrt = await _regFetchRealFbWrong(xml, _regPreviewSeed, realParts);
      if (gen !== _regRealPreviewGen || !_regLastReal) return;
      if (wrongByPrt) {
        _regLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.regRefreshPreview === 'function') window.regRefreshPreview();
      }
    } catch (e) {
      if (gen !== _regRealPreviewGen) return;
      _regSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function regRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'regle10') return;
    _regPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _regRefreshRealPreview();
  }
  window.regRerollPreviewSeed = regRerollPreviewSeed;

  function regShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'regle10') return;
    _regEnsurePreviewSeed();
    _regRefreshRealPreview();
  }
  window.regShowRealPreview = regShowRealPreview;

  function _regAugmentStateWithReal(state) {
    if (_regLastReal) {
      state.realBodyHTML = _regLastReal.bodyHTML;
      state.realFbGenHTML = _regLastReal.fbGenHTML;
      state.realWrongByPrt = _regLastReal.wrongByPrt;
    }
  }

  window.regRefreshPreview = _hsWireSimplePreview('regle10', 'reg', 'reg-preview-container', 'fp-regle10', renderPreviewHTML_regle10, false, _regAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-regle10');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _regPreviewSeed = null;
          _regLastReal = null;
          var rerollBtn = document.getElementById('reg-reroll-preview-btn');
          var showRealBtn = document.getElementById('reg-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _regSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
