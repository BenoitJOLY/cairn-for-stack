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

// ── APERÇU "Expert" — simulé (JS local, dans expert-ui.js) + réel (via Maxima) ──
// Contrairement aux autres types, le mode Expert a des PRTs arbitraires (noms et
// arbres de nœuds définis librement par l'enseignant) : on ne peut donc pas sonder
// une unique "mauvaise réponse" générique par input (types hétérogènes : algebraic,
// checkbox, units, string...). L'aperçu réel montre donc le chemin "réponse
// correcte" de chaque PRT (via /grade avec les réponses tans/samplesolution,
// même logique d'aplatissement que generateDeployedSeeds dans maxima-client.js),
// plutôt qu'un chemin "faux" comme les autres types à PRT unique.
// Le feedback général reste toujours simulé localement (voir expRenderPreview,
// js/expert-ui.js) : texte libre de l'enseignant, non réductible à
// questionsamplesolutiontext comme pour les autres générateurs.
function _expCleanBodyHTML(html) {
  return String(html || '')
    .replace(/\[\[input:(\w+)\]\]/g, function (_, name) {
      return '<span class="exp-pv-input" title="' + _ee(I18N.t('exp.pv_input_title', { name: name })) + '">▢ <em>' + name + '</em></span>';
    })
    .replace(/\[\[validation:(\w+)\]\]/g, function () {
      return '<span class="exp-pv-valid">' + I18N.t('exp.pv_validation_label') + '</span>';
    });
}

// Reprend l'aplatissement des réponses de référence par input (voir
// generateDeployedSeeds, js/maxima-client.js, lignes ~216-230) : une clé par
// input simple, ou "<name>_<position>" pour les inputs à sous-parties
// (checkbox) — /grade n'accepte pas de valeur imbriquée sous answers[name].
function _expBuildCorrectAnswers(renderRes, inputNames) {
  var answers = {};
  inputNames.forEach(function (name) {
    var ir = renderRes && renderRes.questioninputs && renderRes.questioninputs[name];
    var sol = ir && ir.samplesolution;
    var solKeys = sol ? Object.keys(sol) : [];
    if (solKeys.length && solKeys[0].charAt(0) === '_') {
      var allKeys = Object.keys((ir.configuration && ir.configuration.options) || {});
      var trueKeys = solKeys.map(function (k) { return k.replace(/^_/, ''); });
      allKeys.forEach(function (k) {
        answers[name + '_' + k] = trueKeys.indexOf(k) >= 0 ? '1' : '0';
      });
    } else {
      answers[name] = solKeys.length === 1 ? sol[solKeys[0]] : undefined;
    }
  });
  return answers;
}

(function () {
  var _expPreviewSeed = null;
  var _expRealPreviewGen = 0;

  function _expEnsurePreviewSeed() {
    if (!_expPreviewSeed) _expPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _expPreviewSeed;
  }

  function _expSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('exp-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  async function _expRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'expert') return;
    var gen = ++_expRealPreviewGen;

    var q = questions[_activeQid]; if (!q || !q._expertState) return;
    expertCaptureToState(_activeQid);
    var s = q._expertState;

    _expSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, parts;
    try {
      parts = genExpertCore(s);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_expEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _expRealPreviewGen) _expSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _expPreviewSeed);
      if (gen !== _expRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      window._expLastRealPreview = {
        bodyHTML: _expCleanBodyHTML(renderRes.questionrender),
        prtByName: null
      };
      if (typeof expRenderPreview === 'function') expRenderPreview();
      _expSetRealPreviewStatus('', false);

      var inputNames = (s.inputs || []).map(function (i) { return i.name; });
      var answers = _expBuildCorrectAnswers(renderRes, inputNames);
      var gradeRes = await maximaGradeXML(xml, _expPreviewSeed, answers);
      if (gen !== _expRealPreviewGen || !window._expLastRealPreview) return;
      if (gradeRes && gradeRes.isgradable && gradeRes.prts) {
        var byName = {};
        (s.prts || []).forEach(function (prt) {
          var html = gradeRes.prts[prt.name];
          if (html) byName[prt.name] = html;
        });
        window._expLastRealPreview.prtByName = byName;
        if (typeof expRenderPreview === 'function') expRenderPreview();
      }
    } catch (e) {
      if (gen !== _expRealPreviewGen) return;
      _expSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function expRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'expert') return;
    _expPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _expRefreshRealPreview();
  }
  window.expRerollPreviewSeed = expRerollPreviewSeed;

  function expShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'expert') return;
    _expEnsurePreviewSeed();
    _expRefreshRealPreview();
  }
  window.expShowRealPreview = expShowRealPreview;

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu
  // réel effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-algebraic.js/preview-incertitude.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-expert');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _expPreviewSeed = null;
          window._expLastRealPreview = null;
          var rerollBtn = document.getElementById('exp-reroll-preview-btn');
          var showRealBtn = document.getElementById('exp-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _expSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
