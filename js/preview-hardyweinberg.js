/*
 * StackForge — générateur de questions STACK pour Moodle
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

// ── APERÇU "Hardy-Weinberg" — simulé (JS local) + réel (via Maxima) ──
// Contrairement à zscore/incertitude (MVP valeur fixe, jamais randomisés), q1_hwq et
// tout ce qui en dépend (p, hétérozygotes, %) sont tirés par un random() natif côté
// Maxima (js/gen-hardyweinberg-calc.js) : _calcExtractKnownVars (js/preview.js) ne peut
// donc jamais les résoudre localement — l'aperçu simulé laisse les jetons {@...@} tels
// quels (comme gen-physique.js le fait déjà pour ses variables tirées via ri()), et
// l'aperçu réel (👁️, /render + /grade) est la seule façon de voir des valeurs
// effectivement calculées. Gabarit suivi pour le bouton "Nouveau tirage" : preview-calcul.js
// (_hsHasRandomization détecte déjà random(...) dans q1_hwlistq/q1_hwq, donc le bouton
// s'affiche automatiquement dès que Maxima est configuré).
function _hwStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#15803d;border-left:5px solid #14532d;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_hardyweinberg(state) {
  var realParts = {};
  try { realParts = (typeof genHardyWeinbergCore === 'function' && typeof _hwBuildParams === 'function') ? genHardyWeinbergCore(1, _hwBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('hw', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _hwStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('hw.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.hardyweinberg') || 'Hardy-Weinberg', badgeColor: '#15803d', noteBg: '#f0fdf4', noteColor: '#14532d',
    prefix: 'hw', bareme: state.bareme || 3,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('hw.preview_steps_title') || 'Sous-questions',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-hardyweinberg.js pour X=1 (ans_hwq1/ans_hwp1/ans_hwhet1, prt1q/prt1p/prt1het).
// Sonde de réponse fausse par sous-question (numérique, jamais atteint par q/p/2pq).
(function () {
  var _hwPreviewSeed = null;
  var _hwRealPreviewGen = 0;
  var _hwLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _hwEnsurePreviewSeed() {
    if (!_hwPreviewSeed) _hwPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _hwPreviewSeed;
  }

  function _hwSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('hw-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _hwCleanBodyHTML(html) {
    return _hwStripBannerAndInputs(html);
  }

  function _hwCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _hwFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _hwCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _hwRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'hardyweinberg') return;
    var gen = ++_hwRealPreviewGen;

    var p;
    try { p = _hwBuildParams(); } catch (e) { return; }

    _hwSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genHardyWeinbergCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_hwEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _hwRealPreviewGen) _hwSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _hwPreviewSeed);
      if (gen !== _hwRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _hwLastReal = {
        bodyHTML: _hwCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.hwRefreshPreview === 'function') window.hwRefreshPreview();
      _hwSetRealPreviewStatus('', false);

      var wrongByPrt = await _hwFetchRealFbWrong(xml, _hwPreviewSeed, realParts);
      if (gen !== _hwRealPreviewGen || !_hwLastReal) return;
      if (wrongByPrt) {
        _hwLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.hwRefreshPreview === 'function') window.hwRefreshPreview();
      }
    } catch (e) {
      if (gen !== _hwRealPreviewGen) return;
      _hwSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function hwRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'hardyweinberg') return;
    _hwPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _hwRefreshRealPreview();
  }
  window.hwRerollPreviewSeed = hwRerollPreviewSeed;

  function hwShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'hardyweinberg') return;
    _hwEnsurePreviewSeed();
    _hwRefreshRealPreview();
  }
  window.hwShowRealPreview = hwShowRealPreview;

  function _hwAugmentStateWithReal(state) {
    if (_hwLastReal) {
      state.realBodyHTML = _hwLastReal.bodyHTML;
      state.realFbGenHTML = _hwLastReal.fbGenHTML;
      state.realWrongByPrt = _hwLastReal.wrongByPrt;
    }
  }

  window.hwRefreshPreview = _hsWireSimplePreview('hardyweinberg', 'hw', 'hw-preview-container', 'fp-hardyweinberg', renderPreviewHTML_hardyweinberg, false, _hwAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même convention
  // que preview-calcul.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-hardyweinberg');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _hwPreviewSeed = null;
          _hwLastReal = null;
          var rerollBtn = document.getElementById('hw-reroll-preview-btn');
          var showRealBtn = document.getElementById('hw-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _hwSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
