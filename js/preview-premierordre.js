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

// ── APERÇU "Système du premier ordre — erreur statique" — simulé (JS local)
// + réel (via Maxima) ──
// Même situation que ieee754 (preview-ieee754.js) : toutes les grandeurs
// (K, E0, erreur statique) sont tirées par un rand() natif côté Maxima
// (js/gen-premierordre-calc.js), jamais résolues localement — l'aperçu
// simulé laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render +
// /grade) est la seule façon de voir des valeurs effectivement calculées.
// Une seule sous-question (un seul PRT).
function _pmoStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#365314;border-left:5px solid #1a2e05;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_premierordre(state) {
  var realParts = {};
  try { realParts = (typeof genPremierordreCore === 'function' && typeof _pmoBuildParams === 'function') ? genPremierordreCore(1, _pmoBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('pmo', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _pmoStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('pmo.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.premierordre') || 'Premier ordre', badgeColor: '#365314', noteBg: '#ecfccb', noteColor: '#1a2e05',
    prefix: 'pmo', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('pmo.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-premierordre.js pour X=1 (ans_pmo1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte lorsque K et E0 sont positifs).
(function () {
  var _pmoPreviewSeed = null;
  var _pmoRealPreviewGen = 0;
  var _pmoLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _pmoEnsurePreviewSeed() {
    if (!_pmoPreviewSeed) _pmoPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _pmoPreviewSeed;
  }

  function _pmoSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('pmo-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _pmoCleanBodyHTML(html) {
    return _pmoStripBannerAndInputs(html);
  }

  function _pmoCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _pmoFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _pmoCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _pmoRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'premierordre') return;
    var gen = ++_pmoRealPreviewGen;

    var p;
    try { p = _pmoBuildParams(); } catch (e) { return; }

    _pmoSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genPremierordreCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_pmoEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _pmoRealPreviewGen) _pmoSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _pmoPreviewSeed);
      if (gen !== _pmoRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _pmoLastReal = {
        bodyHTML: _pmoCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.pmoRefreshPreview === 'function') window.pmoRefreshPreview();
      _pmoSetRealPreviewStatus('', false);

      var wrongByPrt = await _pmoFetchRealFbWrong(xml, _pmoPreviewSeed, realParts);
      if (gen !== _pmoRealPreviewGen || !_pmoLastReal) return;
      if (wrongByPrt) {
        _pmoLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.pmoRefreshPreview === 'function') window.pmoRefreshPreview();
      }
    } catch (e) {
      if (gen !== _pmoRealPreviewGen) return;
      _pmoSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function pmoRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'premierordre') return;
    _pmoPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _pmoRefreshRealPreview();
  }
  window.pmoRerollPreviewSeed = pmoRerollPreviewSeed;

  function pmoShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'premierordre') return;
    _pmoEnsurePreviewSeed();
    _pmoRefreshRealPreview();
  }
  window.pmoShowRealPreview = pmoShowRealPreview;

  function _pmoAugmentStateWithReal(state) {
    if (_pmoLastReal) {
      state.realBodyHTML = _pmoLastReal.bodyHTML;
      state.realFbGenHTML = _pmoLastReal.fbGenHTML;
      state.realWrongByPrt = _pmoLastReal.wrongByPrt;
    }
  }

  window.pmoRefreshPreview = _hsWireSimplePreview('premierordre', 'pmo', 'pmo-preview-container', 'fp-premierordre', renderPreviewHTML_premierordre, false, _pmoAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-premierordre');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _pmoPreviewSeed = null;
          _pmoLastReal = null;
          var rerollBtn = document.getElementById('pmo-reroll-preview-btn');
          var showRealBtn = document.getElementById('pmo-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _pmoSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
