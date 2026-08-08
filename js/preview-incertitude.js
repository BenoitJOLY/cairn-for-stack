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

// ── APERÇU "Incertitude" — simulé (JS local) + réel (via Maxima) ──
// Contrairement aux autres types (1 seul PRT → _hsPrtBoxes réutilisable),
// "incertitude" produit jusqu'à 7 PRTs indépendants (un par étape cochée) :
// on construit donc soi-même la liste des étapes via extraFeedbackNodes de
// _hsSimplePreviewHTML (mécanisme déjà prévu pour les PRTs à nœuds multiples,
// cf. preview-basen.js), plutôt que de forcer un unique couple Ok/Faux.
//
// Aperçu simulé limité : TOUTES les valeurs de sortie (moyenne, s, uA, uB, uc, U)
// sont enveloppées dans float(...) côté Maxima (gen-incertitude-calc.js), or
// _calcExtractKnownVars (js/preview.js) exclut explicitement float(...) de son
// mini-évaluateur JS — aucune vraie valeur numérique n'est donc jamais résolue
// localement, contrairement aux types plus simples. L'aperçu réel (👁️, via
// /render + /grade du serveur Maxima configuré) est donc la SEULE façon de
// voir les valeurs effectivement calculées pour ce type — même mécanisme que
// preview-nomenclature.js/preview-basen.js, généralisé ici à N PRTs distincts
// (une sonde de réponse fausse par étape cochée, résolues en un seul appel
// /grade groupé).
function _incStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#9333ea;border-left:5px solid #7e22ce;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function renderPreviewHTML_incertitude(state) {
  var realParts = {};
  try { realParts = (typeof genIncertitudeCore === 'function' && typeof _incBuildParams === 'function') ? genIncertitudeCore(1, _incBuildParams()) : {}; } catch (e) { realParts = {}; }
  _hsUpdateRerollVisibility('inc', _hsHasRandomization(realParts.vars || ''));

  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _incStripBannerAndInputs(realParts.textFrag || '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">' + (I18N.t('inc.preview_empty') || 'Cochez au moins une étape à évaluer pour voir l’aperçu.') + '</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars) + note;
  }

  var steps = (realParts.prts || []).map(function (prt) {
    var node = prt.nodes[0];
    var okBox = applyFbBox('true', _calcTokenizeForPreview(node.truefeedback || '', knownVars));
    var wrongBox = (state.realWrongByPrt && state.realWrongByPrt[prt.meta.name])
      ? state.realWrongByPrt[prt.meta.name]
      : applyFbBox('false', _calcTokenizeForPreview(node.falsefeedback || '', knownVars));
    return { desc: (node.description || '') + ' — ' + parseFloat(prt.meta.value) + ' pt', fb: okBox + wrongBox };
  });

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.incertitude') || 'Incertitude', badgeColor: '#9333ea', noteBg: '#f5f3ff', noteColor: '#7e22ce',
    prefix: 'inc', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('inc.preview_steps_title') || 'Étapes évaluées',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée, cf. buildStandaloneQuestionXML) : les
// noms d'input/PRT sont donc toujours ceux de gen-incertitude-steps.js pour
// X=1 (ans_moy1, ans_s1, ... / prt1_moy, prt1_s, ...). Une seule sonde de
// réponse fausse par étape COCHÉE (realParts.prts ne contient que celles-ci),
// résolues en un seul appel /grade groupé — chaque PRT ne lit que son propre
// input (LOI 2), donc soumettre une réponse fausse sur tous les inputs cochés
// à la fois donne bien le feedback ❌ propre à chacun.
(function () {
  var _incPreviewSeed = null;
  var _incRealPreviewGen = 0;
  var _incLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _incEnsurePreviewSeed() {
    if (!_incPreviewSeed) _incPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _incPreviewSeed;
  }

  function _incSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('inc-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _incCleanBodyHTML(html) {
    return _incStripBannerAndInputs(html);
  }

  function _incCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais toujours syntaxiquement valide pour le type
  // d'input de chaque étape : numérique pour moyenne/s/uA/uB/uc/U/écriture-pm-valeur/
  // écriture-pm-incertitude (NumRelative/NumAbsolute), chaîne quelconque pour
  // l'écriture finale encadrement (RegExp) ou l'unité en format pm (StringSloppy).
  function _incBuildWrongProbe(node) {
    return node.answertest === 'RegExp' || node.answertest === 'StringSloppy' ? '__reponse_fausse__' : '-999999';
  }

  async function _incFetchRealFbWrong(xml, seed, realParts) {
    try {
      var answers = {};
      (realParts.prts || []).forEach(function (prt) {
        answers[prt.nodes[0].sans] = _incBuildWrongProbe(prt.nodes[0]);
      });
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts) return null;
      var byPrt = {};
      (realParts.prts || []).forEach(function (prt) {
        var html = gradeRes.prts[prt.meta.name];
        if (html) byPrt[prt.meta.name] = _incCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _incRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'incertitude') return;
    var gen = ++_incRealPreviewGen;

    var p;
    try { p = _incBuildParams(); } catch (e) { return; }

    _incSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genIncertitudeCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_incEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _incRealPreviewGen) _incSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _incPreviewSeed);
      if (gen !== _incRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _incLastReal = {
        bodyHTML: _incCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.incRefreshPreview === 'function') window.incRefreshPreview();
      _incSetRealPreviewStatus('', false);

      var wrongByPrt = await _incFetchRealFbWrong(xml, _incPreviewSeed, realParts);
      if (gen !== _incRealPreviewGen || !_incLastReal) return;
      if (wrongByPrt) {
        _incLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.incRefreshPreview === 'function') window.incRefreshPreview();
      }
    } catch (e) {
      if (gen !== _incRealPreviewGen) return;
      _incSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function incRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'incertitude') return;
    _incPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _incRefreshRealPreview();
  }
  window.incRerollPreviewSeed = incRerollPreviewSeed;

  function incShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'incertitude') return;
    _incEnsurePreviewSeed();
    _incRefreshRealPreview();
  }
  window.incShowRealPreview = incShowRealPreview;

  function _incAugmentStateWithReal(state) {
    if (_incLastReal) {
      state.realBodyHTML = _incLastReal.bodyHTML;
      state.realFbGenHTML = _incLastReal.fbGenHTML;
      state.realWrongByPrt = _incLastReal.wrongByPrt;
    }
  }

  window.incRefreshPreview = _hsWireSimplePreview('incertitude', 'inc', 'inc-preview-container', 'fp-incertitude', renderPreviewHTML_incertitude, false, _incAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré et que le mode
  // courant est aléatoire (même convention que preview-nomenclature.js/preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-incertitude');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _incPreviewSeed = null;
          _incLastReal = null;
          var rerollBtn = document.getElementById('inc-reroll-preview-btn');
          var showRealBtn = document.getElementById('inc-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genIncertitudeCore(1, _incBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _incSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
