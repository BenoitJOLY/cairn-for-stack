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

// ── APERÇU "Norme IEEE 754 (mantisse binaire)" — simulé (JS local) + réel (via Maxima) ──
// Même situation que chi2 (preview-chi2.js) : toutes les grandeurs (x, n,
// mantisse) sont tirées par un rand() natif côté Maxima (js/gen-ieee754-calc.js),
// jamais résolues localement — l'aperçu simulé laisse les jetons {@...@} tels
// quels, l'aperçu réel (👁️, /render + /grade) est la seule façon de voir des
// valeurs effectivement calculées. Une seule sous-question (un seul PRT).
function _fltStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#0f766e;border-left:5px solid #134e4a;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_ieee754(state) {
  var realParts = {};
  try { realParts = (typeof genIeee754Core === 'function' && typeof _fltBuildParams === 'function') ? genIeee754Core(1, _fltBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('flt', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _fltStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('flt.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.ieee754') || 'IEEE 754', badgeColor: '#0f766e', noteBg: '#ccfbf1', noteColor: '#134e4a',
    prefix: 'flt', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('flt.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-ieee754.js pour X=1 (ans_flt1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par une mantisse qui est dans [0,1[).
(function () {
  var _fltPreviewSeed = null;
  var _fltRealPreviewGen = 0;
  var _fltLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _fltEnsurePreviewSeed() {
    if (!_fltPreviewSeed) _fltPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _fltPreviewSeed;
  }

  function _fltSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('flt-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _fltCleanBodyHTML(html) {
    return _fltStripBannerAndInputs(html);
  }

  function _fltCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _fltFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _fltCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _fltRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'ieee754') return;
    var gen = ++_fltRealPreviewGen;

    var p;
    try { p = _fltBuildParams(); } catch (e) { return; }

    _fltSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genIeee754Core(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_fltEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _fltRealPreviewGen) _fltSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _fltPreviewSeed);
      if (gen !== _fltRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _fltLastReal = {
        bodyHTML: _fltCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.fltRefreshPreview === 'function') window.fltRefreshPreview();
      _fltSetRealPreviewStatus('', false);

      var wrongByPrt = await _fltFetchRealFbWrong(xml, _fltPreviewSeed, realParts);
      if (gen !== _fltRealPreviewGen || !_fltLastReal) return;
      if (wrongByPrt) {
        _fltLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.fltRefreshPreview === 'function') window.fltRefreshPreview();
      }
    } catch (e) {
      if (gen !== _fltRealPreviewGen) return;
      _fltSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function fltRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'ieee754') return;
    _fltPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _fltRefreshRealPreview();
  }
  window.fltRerollPreviewSeed = fltRerollPreviewSeed;

  function fltShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'ieee754') return;
    _fltEnsurePreviewSeed();
    _fltRefreshRealPreview();
  }
  window.fltShowRealPreview = fltShowRealPreview;

  function _fltAugmentStateWithReal(state) {
    if (_fltLastReal) {
      state.realBodyHTML = _fltLastReal.bodyHTML;
      state.realFbGenHTML = _fltLastReal.fbGenHTML;
      state.realWrongByPrt = _fltLastReal.wrongByPrt;
    }
  }

  window.fltRefreshPreview = _hsWireSimplePreview('ieee754', 'flt', 'flt-preview-container', 'fp-ieee754', renderPreviewHTML_ieee754, false, _fltAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-ieee754');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _fltPreviewSeed = null;
          _fltLastReal = null;
          var rerollBtn = document.getElementById('flt-reroll-preview-btn');
          var showRealBtn = document.getElementById('flt-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _fltSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
