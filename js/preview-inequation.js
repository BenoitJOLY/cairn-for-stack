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

function renderPreviewHTML_inequation(state) {
  var realParts = {};
  try { realParts = (typeof genInequationCore === 'function') ? genInequationCore(1, _ineqBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('ineq', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  // canonicalNodes[0] est le nœud de garde "format reconnu ?" (voir gen-math-inequation.js
  // ineqNodes()), pas le nœud "bonne réponse" — sans ce décalage, _hsPrtBoxes() affichait
  // le message ❌ format-invalide (et sa couleur rouge) dans la case "bonne réponse",
  // masquant totalement le champ "Message si bonne réponse" de l'enseignant.
  var prtNodes = (realParts.prt && realParts.prt.nodes) || [];
  var prtBoxes = _hsPrtBoxes({ prt: { nodes: prtNodes.slice(1) } });
  // _hsPrtBoxes lit prt.nodes, désormais bruts (sans encadré, cf. js/fb-box.js) :
  // on applique l'encadré uniquement ici, au point d'affichage de l'aperçu.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var scenarioHTML, fbGenBody;
  var wrongFbHTML = _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars);
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _ineqRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée, ni pour l'énoncé ni pour la correction.
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realGeneralFeedback, knownVars);
    if (state.realFbWrongHTML) wrongFbHTML = state.realFbWrongHTML;
  } else {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    var bodyFrag = (realParts.textFrag || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
    scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realGeneralFeedback, knownVars) + note;
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.inequation'), badgeColor: '#0e7490', noteBg: '#ecfeff', noteColor: '#0e7490',
    prefix: 'ineq', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: wrongFbHTML, fbGen: state.fbGen, fbBoxesPreWrapped: true,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: applyFbBox(n.kind, _calcTokenizeForPreview(n.fb, knownVars)) };
    })
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// M\xeame m\xe9canisme que preview-checkbox.js (_cbRefreshRealPreview) mais la donn\xe9e
// "r\xe9elle" ici n'est pas un sous-ensemble d'options tir\xe9es : c'est le HTML de
// /render (questionrender) d\xe9j\xe0 substitu\xe9 par Maxima pour l'\xe9nonc\xe9, et
// questionsamplesolutiontext (d\xe9j\xe0 substitu\xe9) pour le bloc "Correction" —
// confirm\xe9 par appel r\xe9el au serveur du NAS (les jetons {@q1_x@} de vars/textFrag/
// generalFeedback sont pleinement r\xe9solus dans ces deux champs de la r\xe9ponse
// /render, contrairement \xe0 [[input:...]]/[[validation:...]] qui restent litt\xe9raux).
// Les bo\xeetes fbOk/fbWrong du PRT restent g\xe9r\xe9es par la simulation locale
// (_calcTokenizeForPreview) : /render ne les \xe9value pas (il faudrait /grade avec
// une r\xe9ponse), et en pratique elles ne contiennent quasiment jamais de jeton
// Maxima non r\xe9solu (texte enseignant, ou repli g\xe9n\xe9rique fixe).
(function () {
  var _ineqPreviewSeed = null;
  var _ineqRealPreviewGen = 0;
  var _ineqLastReal = null; // { bodyHTML, fbGenHTML }

  function _ineqEnsurePreviewSeed() {
    if (!_ineqPreviewSeed) _ineqPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _ineqPreviewSeed;
  }

  function _ineqSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('ineq-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _ineqCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  // /render ne substitue pas le texte des nœuds PRT (truefeedback/falsefeedback,
  // d'où le jeton {@q1_ta@} brut affiché dans la case ❌). /grade, appelé avec une
  // réponse volontairement fausse mais syntaxiquement valide (chaîne Maxima entre
  // guillemets, format intervalle), renvoie dans gradeRes.prts.prt1 le HTML du nœud
  // déclenché déjà substitué — confirmé par sonde réelle contre le NAS. On retire le
  // marqueur `<div class="incorrect"></div>` que STACK préfixe à ce HTML.
  function _ineqCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  async function _ineqFetchRealFbWrong(xml, seed) {
    try {
      var gradeRes = await maximaGradeXML(xml, seed, { ans_ineq1: '"]0;1["' });
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _ineqCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _ineqRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'inequation') return;
    var gen = ++_ineqRealPreviewGen;

    var p;
    try { p = _ineqBuildParams(); } catch (e) { return; }

    _ineqSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genInequationCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_ineqEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _ineqRealPreviewGen) _ineqSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _ineqPreviewSeed);
      if (gen !== _ineqRealPreviewGen) return; // r\xe9ponse obsol\xe8te

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _ineqLastReal = {
        bodyHTML: _ineqCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.ineqRefreshPreview === 'function') window.ineqRefreshPreview();
      _ineqSetRealPreviewStatus('', false);

      // Résolution du feedback ❌ via /grade, en second temps (n'empêche pas
      // l'aperçu principal de s'afficher si /grade échoue ou tarde).
      var fbWrongHTML = await _ineqFetchRealFbWrong(xml, _ineqPreviewSeed);
      if (gen !== _ineqRealPreviewGen || !_ineqLastReal) return;
      if (fbWrongHTML) {
        _ineqLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.ineqRefreshPreview === 'function') window.ineqRefreshPreview();
      }
    } catch (e) {
      if (gen !== _ineqRealPreviewGen) return;
      _ineqSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function ineqRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'inequation') return;
    _ineqPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _ineqRefreshRealPreview();
  }
  window.ineqRerollPreviewSeed = ineqRerollPreviewSeed;

  function ineqShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'inequation') return;
    _ineqEnsurePreviewSeed();
    _ineqRefreshRealPreview();
  }
  window.ineqShowRealPreview = ineqShowRealPreview;

  function _ineqAugmentStateWithReal(state) {
    if (_ineqLastReal) {
      state.realBodyHTML = _ineqLastReal.bodyHTML;
      state.realFbGenHTML = _ineqLastReal.fbGenHTML;
      state.realFbWrongHTML = _ineqLastReal.fbWrongHTML;
    }
  }

  window.ineqRefreshPreview = _hsWireSimplePreview('inequation', 'ineq', 'ineq-preview-container', 'fp-inequation', renderPreviewHTML_inequation, false, _ineqAugmentStateWithReal);

  // Nouvelle session d'\xe9dition (panneau r\xe9ouvert) → seed r\xe9initialis\xe9, aper\xe7u r\xe9el
  // effac\xe9, boutons affich\xe9s/masqu\xe9s selon que Maxima est configur\xe9 (m\xeame
  // convention que preview-checkbox.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-inequation');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _ineqPreviewSeed = null;
          _ineqLastReal = null;
          var rerollBtn = document.getElementById('ineq-reroll-preview-btn');
          var showRealBtn = document.getElementById('ineq-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genInequationCore(1, _ineqBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _ineqSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
