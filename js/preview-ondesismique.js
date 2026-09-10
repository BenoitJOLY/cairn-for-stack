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

// ── APERÇU "Ondes sismiques" — simulé (JS local) + réel (via Maxima) ──
// Même situation que radiochronologie (preview-radiochronologie.js) : toutes les
// grandeurs (d, vp, vs, Δt, station, tarr...) sont tirées par un rand() natif
// côté Maxima (js/gen-ondesismique-calc.js), jamais résolues localement —
// l'aperçu simulé laisse les jetons {@...@} tels quels, l'aperçu réel (👁️,
// /render + /grade) est la seule façon de voir des valeurs effectivement
// calculées. Le scénario 'delai-ps' a un seul PRT ; 'vitesse-onde' en a deux.
//
// Cas particulier du scénario 'vitesse-onde' : l'énoncé embarque un bloc
// [[jsxgraph]]...[[/jsxgraph]] (js/gen-ondesismique-jsx.js). En aperçu simulé
// (sans Maxima), ce bloc est retiré du texte tokenisé puis remplacé par un
// vrai board JSXGraph construit localement (même fonction _sisSeismogramJSX,
// avec une date d'arrivée tirée côté JS parmi sis-arrlist) — gabarit suivi :
// preview-cinematique.js / _oscBuildLivePreviewJS (js/preview.js). Ceci exige
// scripted=true dans _hsWireSimplePreview (mountPreviewIframeScripted) pour
// que le <script> exécutant JXG.JSXGraph.initBoard soit réellement lancé.
function _sisStripBannerAndInputs(html) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  return String(html || '')
    .replace(/^<div style="background:#334155;border-left:5px solid #1e293b;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

// Extrait le bloc [[jsxgraph...]]...[[/jsxgraph]] d'un HTML, et rend le reste
// avec un marqueur <div id="..."> à sa place. Renvoie { html, jsxBlock } (jsxBlock
// est null si aucun bloc trouvé — cas du scénario 'delai-ps').
function _sisExtractJSXBlock(html, boardId) {
  var re = /\[\[jsxgraph[^\]]*\]\][\s\S]*?\[\[\/jsxgraph\]\]/;
  var m = re.exec(String(html || ''));
  if (!m) return { html: html, jsxBlock: null };
  var placeholder = '<div id="' + boardId + '" style="position:relative;width:100%;height:300px;border:1px solid #cbd5e1;border-radius:8px;overflow:visible;background:#fff;margin:10px 0;"></div>';
  return { html: html.slice(0, m.index) + placeholder + html.slice(m.index + m[0].length), jsxBlock: m[0] };
}

// Construit le <script> d'aperçu simulé du sismogramme (scénario 'vitesse-onde'),
// avec une date d'arrivée tirée côté JS (pas Maxima) parmi sis-arrlist.
function _sisBuildSeismogramPreviewScript(arrListRaw, boardId) {
  var nums = String(arrListRaw || '').split(',').map(function (s) { return parseFloat(s.trim()); }).filter(function (n) { return !isNaN(n) && n > 0; });
  if (!nums.length) return null;
  var tarr = nums[Math.floor(Math.random() * nums.length)];
  // Heure de séisme tirée localement (JS) pour l'aperçu simulé — même rôle que
  // q${X}_sis_heuresec côté Maxima, non synchronisée avec un {@heure@} textuel
  // ici puisque le texte de l'aperçu simulé garde les jetons {@...@} tels quels.
  var heureSec = Math.floor(Math.random() * 86400);
  var bounds = _sisComputeGraphBounds(arrListRaw);
  var jsxBlock = _sisSeismogramJSX({ tarrExpr: String(tarr), heureSecExpr: String(heureSec), xMax: bounds.xMax, tickStep: bounds.tickStep, width: 700, height: 300 });
  var body = _oscStripJXGWrapper(jsxBlock);
  return '(function(){ try {\n'
    + '  var stack_js = window.stack_js || (window.stack_js = { resize_containing_frame: function(){} });\n'
    + '  var divid = ' + JSON.stringify(boardId) + ';\n'
    + '  ' + body + '\n'
    + '} catch(e) { var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.75rem;white-space:pre-wrap;\\">Erreur JSXGraph (sismogramme) : " + String(e && e.message || e).replace(/</g,"&lt;") + "</p>"; console.error(e); }\n'
    + '})();\n';
}

function renderPreviewHTML_ondesismique(state) {
  var realParts = {};
  try { realParts = (typeof genOndeSismiqueCore === 'function' && typeof _sisBuildParams === 'function') ? genOndeSismiqueCore(1, _sisBuildParams()) : {}; } catch (e) { realParts = {}; }

  _hsUpdateRerollVisibility('sis', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var scenarioHTML, fbGenBody, extraScript = '';
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realParts.generalFeedback || '', knownVars);
  } else {
    var bodyFrag = _sisStripBannerAndInputs(realParts.textFrag || '');
    if (bodyFrag && (state.scenario === 'vitesse-onde')) {
      var boardId = 'sisLiveBoard';
      var extracted = _sisExtractJSXBlock(bodyFrag, boardId);
      bodyFrag = extracted.html;
      if (extracted.jsxBlock) {
        var script = _sisBuildSeismogramPreviewScript(state.arrList, boardId);
        if (script) extraScript = '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script><script>' + script + '<\/script>';
      }
    }
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars) + extraScript
      : '<em style="color:#6b7280;">' + (I18N.t('sis.preview_empty') || 'Question générée automatiquement — voir l’aperçu réel pour un exemple.') + '</em>';
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
    badge: I18N.t('type.ondesismique') || 'Ondes sismiques', badgeColor: '#334155', noteBg: '#e2e8f0', noteColor: '#1e293b',
    prefix: 'sis', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    hideOkWrongBoxes: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    extraFeedbackNodes: steps,
    extraFeedbackNodesTitle: I18N.t('sis.preview_steps_title') || 'Correction',
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbGen: state.fbGen
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée) : noms d'input/PRT toujours ceux de
// gen-ondesismique.js pour X=1 (ans_sis1, prt1). Sonde de réponse fausse
// (numérique négative, jamais atteinte par le délai correct qui est positif).
(function () {
  var _sisPreviewSeed = null;
  var _sisRealPreviewGen = 0;
  var _sisLastReal = null; // { bodyHTML, fbGenHTML, wrongByPrt }

  function _sisEnsurePreviewSeed() {
    if (!_sisPreviewSeed) _sisPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _sisPreviewSeed;
  }

  function _sisSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('sis-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _sisCleanBodyHTML(html) {
    return _sisStripBannerAndInputs(html);
  }

  function _sisCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _sisFetchRealFbWrong(xml, seed, realParts) {
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
        if (html) byPrt[prt.meta.name] = _sisCleanFbWrongHTML(html);
      });
      return byPrt;
    } catch (e) { return null; }
  }

  async function _sisRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'ondesismique') return;
    var gen = ++_sisRealPreviewGen;

    var p;
    try { p = _sisBuildParams(); } catch (e) { return; }

    _sisSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml, realParts;
    try {
      realParts = genOndeSismiqueCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(realParts), [_sisEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _sisRealPreviewGen) _sisSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _sisPreviewSeed);
      if (gen !== _sisRealPreviewGen) return;

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _sisLastReal = {
        bodyHTML: _sisCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        wrongByPrt: null
      };
      if (typeof window.sisRefreshPreview === 'function') window.sisRefreshPreview();
      _sisSetRealPreviewStatus('', false);

      var wrongByPrt = await _sisFetchRealFbWrong(xml, _sisPreviewSeed, realParts);
      if (gen !== _sisRealPreviewGen || !_sisLastReal) return;
      if (wrongByPrt) {
        _sisLastReal.wrongByPrt = wrongByPrt;
        if (typeof window.sisRefreshPreview === 'function') window.sisRefreshPreview();
      }
    } catch (e) {
      if (gen !== _sisRealPreviewGen) return;
      _sisSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function sisRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'ondesismique') return;
    _sisPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _sisRefreshRealPreview();
  }
  window.sisRerollPreviewSeed = sisRerollPreviewSeed;

  function sisShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'ondesismique') return;
    _sisEnsurePreviewSeed();
    _sisRefreshRealPreview();
  }
  window.sisShowRealPreview = sisShowRealPreview;

  function _sisAugmentStateWithReal(state) {
    if (_sisLastReal) {
      state.realBodyHTML = _sisLastReal.bodyHTML;
      state.realFbGenHTML = _sisLastReal.fbGenHTML;
      state.realWrongByPrt = _sisLastReal.wrongByPrt;
    }
  }

  window.sisRefreshPreview = _hsWireSimplePreview('ondesismique', 'sis', 'sis-preview-container', 'fp-ondesismique', renderPreviewHTML_ondesismique, true, _sisAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-ondesismique');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _sisPreviewSeed = null;
          _sisLastReal = null;
          var rerollBtn = document.getElementById('sis-reroll-preview-btn');
          var showRealBtn = document.getElementById('sis-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _sisSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
