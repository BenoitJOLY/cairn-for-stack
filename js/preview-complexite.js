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

// ── APERÇU "Complexité algorithmique (dichotomie)" — simulé (JS local) + réel (via Maxima) ──
// Même situation que chi2/ieee754 : toutes les grandeurs (n, log2(n)) sont
// tirées par un rand() natif côté Maxima (js/gen-complexite-calc.js), jamais
// résolues localement. Une seule sous-question (un seul PRT à 3 nœuds).
function _cpaStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:180px;';
  return String(html || '')
    .replace(/^<div style="background:#1e3a8a;border-left:5px solid #1e293b;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_complexite(state) {
  var realParts = {};
  try { realParts = (typeof genComplexiteCore === 'function' && typeof _cpaBuildParams === 'function') ? genComplexiteCore(1, _cpaBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('cpa', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _cpaStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('cpa.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.complexite') || 'Complexité algorithmique', badgeColor: '#1e3a8a', noteBg: '#dbeafe', noteColor: '#1e293b',
    prefix: 'cpa', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('cpa.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-complexite.js pour X=1 (ans_cpa1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par un log2(n) qui est positif).
(function () {
  var _cpaPreviewSeed = null;
  var _cpaRealPreviewGen = 0;
  var _cpaLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _cpaEnsurePreviewSeed() {
    if (!_cpaPreviewSeed) _cpaPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _cpaPreviewSeed;
  }

  function _cpaSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('cpa-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _cpaCleanBodyHTML(html) {
    return _cpaStripBannerAndInputs(html);
  }

  function _cpaCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _cpaFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _cpaCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _cpaRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'complexite') return;
    var gen = ++_cpaRealPreviewGen;

    var p;
    try { p = _cpaBuildParams(); } catch (e) { return; }

    _cpaSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genComplexiteCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_cpaEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _cpaRealPreviewGen) _cpaSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _cpaPreviewSeed);
      if (gen !== _cpaRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _cpaLastReal = {
        bodyHTML: _cpaCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.cpaRefreshPreview === 'function') window.cpaRefreshPreview();
      _cpaSetRealPreviewStatus('', false);

      var wrongByPrt = await _cpaFetchRealFbWrong(xml, _cpaPreviewSeed, realParts);
      if (gen !== _cpaRealPreviewGen || !_cpaLastReal) return;
      if (wrongByPrt) {
        _cpaLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.cpaRefreshPreview === 'function') window.cpaRefreshPreview();
      }
    } catch (e) {
      if (gen !== _cpaRealPreviewGen) return;
      _cpaSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function cpaRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'complexite') return;
    _cpaPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _cpaRefreshRealPreview();
  }
  window.cpaRerollPreviewSeed = cpaRerollPreviewSeed;

  function cpaShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'complexite') return;
    _cpaEnsurePreviewSeed();
    _cpaRefreshRealPreview();
  }
  window.cpaShowRealPreview = cpaShowRealPreview;

  function _cpaAugmentStateWithReal(state) {
    if (_cpaLastReal) {
      state.realBodyHTML = _cpaLastReal.bodyHTML;
      state.realFbGenHTML = _cpaLastReal.fbGenHTML;
      state.realWrongByPrt = _cpaLastReal.wrongByPrt;
    }
  }

  window.cpaRefreshPreview = _hsWireSimplePreview('complexite', 'cpa', 'cpa-preview-container', 'fp-complexite', renderPreviewHTML_complexite, false, _cpaAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-complexite');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _cpaPreviewSeed = null;
          _cpaLastReal = null;
          var rerollBtn = document.getElementById('cpa-reroll-preview-btn');
          var showRealBtn = document.getElementById('cpa-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _cpaSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
