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

// ── APERÇU "Tableau d'avancement" — simulé (JS local) + réel (via Maxima) ──
// Comme preview-zscore.js/preview-incertitude.js : x_max${X} est le résultat
// d'un apply(min,...) sur des rapports n0/coeff, jamais résolu localement par
// _calcExtractKnownVars (js/preview.js) — seul l'aperçu réel (👁️, /render +
// /grade) montre la valeur numérique effective du corrigé. Pas de bouton
// reroll : les quantités initiales sont des valeurs fixes saisies par
// l'enseignant (comme zscore), aucune randomisation Maxima n'est en jeu.
function _avStripBannerAndInputs(html) {
  return String(html || '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="padding:4px 8px;border:1px solid #94a3b8;border-radius:5px;font-size:.9rem;background:#f8fafc;color:#94a3b8;width:60px;">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_avancement(state) {
  var realParts = {};
  try { realParts = (typeof genAvancementCore === 'function' && typeof _avBuildParams === 'function') ? genAvancementCore(1, _avBuildParams()) : {}; } catch (e) { realParts = {}; }

  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _avStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('av.preview_empty') || 'Ajoutez au moins une espèce pour voir l’aperçu.') + '</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars) + note;
  }

  var nodes = (realParts.prt && realParts.prt.nodes) || [];
  var fbOk = state.realFbOkHTML || nodes.map(function (n) { return applyFbBox('true', _calcTokenizeForPreview(n.truefeedback || '', knownVars)); }).join('');
  var fbWrong = state.realFbWrongHTML || nodes.map(function (n) { return applyFbBox('false', _calcTokenizeForPreview(n.falsefeedback || '', knownVars)); }).join('');

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.avancement') || "Tableau d'avancement", badgeColor: '#0f766e', noteBg: '#f0fdfa', noteColor: '#115e59',
    prefix: 'av', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOk: fbOk, fbWrong: fbWrong, fbBoxesPreWrapped: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-avancement.js pour X=1. Sonde de réponse fausse = -999999 pour toutes
// les entrées (numériques et algébriques), soumises en un seul appel /grade
// puisque le PRT est une chaîne unique de 4 nœuds toujours tous visités.
(function () {
  var _avPreviewSeed = null;
  var _avRealPreviewGen = 0;
  var _avLastReal = null; // { bodyHTML, fbGenHTML, fbOkHTML, fbWrongHTML }

  function _avEnsurePreviewSeed() {
    if (!_avPreviewSeed) _avPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _avPreviewSeed;
  }

  function _avSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('av-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _avCleanFbHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _avFetchRealFbWrong(xml, seed, realParts) {
    try {
      var answers = {};
      (realParts.inputXML.match(/<name>([^<]+)<\/name>/g) || []).forEach(function (m) {
        var name = m.replace(/<\/?name>/g, '');
        answers[name] = '-999999';
      });
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts) return null;
      var html = gradeRes.prts[realParts.prt.meta.name];
      return html ? _avCleanFbHTML(html) : null;
    } catch (e) { return null; }
  }

  async function _avRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'avancement') return;
    var gen = ++_avRealPreviewGen;

    var p;
    try { p = _avBuildParams(); } catch (e) { return; }

    _avSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genAvancementCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_avEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _avRealPreviewGen) _avSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _avPreviewSeed);
      if (gen !== _avRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _avLastReal = {
        bodyHTML: _avStripBannerAndInputs(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbOkHTML: null, fbWrongHTML: null
      };
      if (typeof window.avRefreshPreview === 'function') window.avRefreshPreview();
      _avSetRealPreviewStatus('', false);

      var fbWrong = await _avFetchRealFbWrong(xml, _avPreviewSeed, realParts);
      if (gen !== _avRealPreviewGen || !_avLastReal) return;
      if (fbWrong) {
        _avLastReal.fbWrongHTML = applyFbBox('false', fbWrong);
        if (typeof window.avRefreshPreview === 'function') window.avRefreshPreview();
      }
    } catch (e) {
      if (gen !== _avRealPreviewGen) return;
      _avSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function avShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'avancement') return;
    _avEnsurePreviewSeed();
    _avRefreshRealPreview();
  }
  window.avShowRealPreview = avShowRealPreview;

  function _avAugmentStateWithReal(state) {
    if (_avLastReal) {
      state.realBodyHTML = _avLastReal.bodyHTML;
      state.realFbGenHTML = _avLastReal.fbGenHTML;
      state.realFbOkHTML = _avLastReal.fbOkHTML;
      state.realFbWrongHTML = _avLastReal.fbWrongHTML;
    }
  }

  window.avRefreshPreview = _hsWireSimplePreview('avancement', 'av', 'av-preview-container', 'fp-avancement', renderPreviewHTML_avancement, false, _avAugmentStateWithReal);

  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-avancement');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _avPreviewSeed = null;
          _avLastReal = null;
          var showRealBtn = document.getElementById('av-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _avSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
