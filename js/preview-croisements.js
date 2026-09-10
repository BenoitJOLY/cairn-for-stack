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

// ── APERÇU "Croisements mono/dihybridisme" — simulé (JS local) + réel (via Maxima) ──
// Même situation que hardyweinberg (preview-hardyweinberg.js) : toutes les grandeurs
// (auto_desc, sex_desc, p_auto, p_sex, p_total) sont tirées par un random() natif côté
// Maxima (js/gen-croisements-calc.js), jamais résolues localement — l'aperçu simulé
// laisse les jetons {@...@} tels quels, l'aperçu réel (👁️, /render + /grade) est la
// seule façon de voir des valeurs effectivement calculées.
function _crStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#0d9488;border-left:5px solid #115e59;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_croisements(state) {
  var realParts = {};
  try { realParts = (typeof genCroisementsCore === 'function' && typeof _crBuildParams === 'function') ? genCroisementsCore(1, _crBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('cr', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _crStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('cr.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.croisements') || 'Croisements', badgeColor: '#0d9488', noteBg: '#f0fdfa', noteColor: '#115e59',
    prefix: 'cr', bareme: state.bareme || 3,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('cr.preview_steps_title') || 'Sous-questions',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-croisements.js pour X=1 (ans_cra1/ans_crs1/ans_crt1, prt1auto/prt1sex/prt1tot).
// Sonde de réponse fausse par sous-question (numérique, jamais atteint par p_auto/p_sex/p_total).
(function () {
  var _crPreviewSeed = null;
  var _crRealPreviewGen = 0;
  var _crLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _crEnsurePreviewSeed() {
    if (!_crPreviewSeed) _crPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _crPreviewSeed;
  }

  function _crSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('cr-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _crCleanBodyHTML(html) {
    return _crStripBannerAndInputs(html);
  }

  function _crCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _crFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _crCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _crRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'croisements') return;
    var gen = ++_crRealPreviewGen;

    var p;
    try { p = _crBuildParams(); } catch (e) { return; }

    _crSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genCroisementsCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_crEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _crRealPreviewGen) _crSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _crPreviewSeed);
      if (gen !== _crRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _crLastReal = {
        bodyHTML: _crCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.crRefreshPreview === 'function') window.crRefreshPreview();
      _crSetRealPreviewStatus('', false);

      var wrongByPrt = await _crFetchRealFbWrong(xml, _crPreviewSeed, realParts);
      if (gen !== _crRealPreviewGen || !_crLastReal) return;
      if (wrongByPrt) {
        _crLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.crRefreshPreview === 'function') window.crRefreshPreview();
      }
    } catch (e) {
      if (gen !== _crRealPreviewGen) return;
      _crSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function crRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'croisements') return;
    _crPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _crRefreshRealPreview();
  }
  window.crRerollPreviewSeed = crRerollPreviewSeed;

  function crShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'croisements') return;
    _crEnsurePreviewSeed();
    _crRefreshRealPreview();
  }
  window.crShowRealPreview = crShowRealPreview;

  function _crAugmentStateWithReal(state) {
    if (_crLastReal) {
      state.realBodyHTML = _crLastReal.bodyHTML;
      state.realFbGenHTML = _crLastReal.fbGenHTML;
      state.realWrongByPrt = _crLastReal.wrongByPrt;
    }
  }

  window.crRefreshPreview = _hsWireSimplePreview('croisements', 'cr', 'cr-preview-container', 'fp-croisements', renderPreviewHTML_croisements, false, _crAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même convention
  // que preview-hardyweinberg.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-croisements');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _crPreviewSeed = null;
          _crLastReal = null;
          var rerollBtn = document.getElementById('cr-reroll-preview-btn');
          var showRealBtn = document.getElementById('cr-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _crSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
