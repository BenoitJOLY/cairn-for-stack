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

function renderPreviewHTML_basen(state) {
  var realParts = {};
  try { realParts = (typeof genBasenCore === 'function' && typeof genBasenParams === 'function') ? genBasenCore(1, genBasenParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('bn', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) {
    // Les valeurs issues d'un appel Maxima (string(...), q1_liststr(...), rand(...)...)
    // ne peuvent pas etre evaluees cote JS : on les retire pour laisser le fallback
    // q_{...} de _calcTokenizeForPreview s'appliquer, sauf recalcul explicite ci-dessous.
    if (/\(/.test(knownVars[k])) delete knownVars[k];
  });
  var bnValueMode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
  if (bnValueMode === 'fixe' && knownVars.hasOwnProperty('val') && /^-?\d+$/.test(knownVars.val)) {
    // En mode "valeur fixe", la valeur decimale est connue a l'avance : on peut donc
    // reproduire cote JS exactement le meme calcul que fera Maxima dans le XML exporte,
    // pour que l'apercu (enonce + feedback general) affiche la vraie valeur attendue.
    var bnDecVal    = parseInt(knownVars.val, 10);
    var bnFormat    = (document.getElementById('bn-format')    || {}).value || 'S';
    var bnFromBase  = parseInt((document.getElementById('bn-from-base') || {}).value || '10');
    var bnToBaseSel = parseInt((document.getElementById('bn-to-base')   || {}).value || '2');
    var bnToFormat  = (bnFormat === 'C' && (bnToBaseSel === 2 || bnToBaseSel === 8 || bnToBaseSel === 16)) ? 'C' : 'S';

    knownVars.srcstr = (bnFromBase === 10) ? String(bnDecVal) : bnDecVal.toString(bnFromBase).toUpperCase();

    if (bnToBaseSel === 10) {
      knownVars.dststr = String(bnDecVal);
    } else {
      var bnRawDst = bnDecVal.toString(bnToBaseSel).toUpperCase();
      if (bnToFormat === 'C') {
        var bnPfx = bnToBaseSel === 2 ? '0b' : bnToBaseSel === 8 ? '0o' : '0x';
        knownVars.dststr = bnPfx + bnRawDst;
      } else {
        knownVars.dststr = bnRawDst;
      }
    }
  }
  var prtBoxes = _hsPrtBoxes(realParts);
  // _hsPrtBoxes lit prt.nodes, désormais bruts (sans encadré, cf. js/fb-box.js) :
  // on applique l'encadré uniquement ici, au point d'affichage de l'aperçu.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var wrongFbHTML = _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars);
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _bnRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée, y compris pour les modes/bases que le
    // recalcul JS ci-dessus ne couvre pas (mode aléatoire, bases > 16, etc.).
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realGeneralFeedback, knownVars);
    if (state.realFbWrongHTML) wrongFbHTML = state.realFbWrongHTML;
  } else {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    var bodyFrag = (realParts.textFrag || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-hidden="true" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '')
      .replace(/\[\[feedback:[^\]]+\]\]/g, '');
    scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realGeneralFeedback, knownVars) + note;
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.basen'), badgeColor: '#1d4ed8', noteBg: '#eff6ff', noteColor: '#1e40af',
    prefix: 'bn', bareme: state.bareme || 1,
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
// Même mécanisme que preview-inequation.js (_ineqRefreshRealPreview) : le HTML de
// /render (questionrender) déjà substitué par Maxima pour l'énoncé, et
// questionsamplesolutiontext pour le bloc "Correction" — nécessaire ici car le
// recalcul JS local (bloc bnValueMode==='fixe' ci-dessus) ne couvre que le cas
// valeur fixe + bases usuelles ; le mode aléatoire ou les bases > 16 laissent sinon
// des jetons q_{...} non résolus dans l'aperçu.
(function () {
  var _bnPreviewSeed = null;
  var _bnRealPreviewGen = 0;
  var _bnLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _bnEnsurePreviewSeed() {
    if (!_bnPreviewSeed) _bnPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _bnPreviewSeed;
  }

  function _bnSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('bn-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _bnCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-hidden="true" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '')
      .replace(/\[\[feedback:[^\]]+\]\]/g, '');
  }

  function _bnCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Construit une réponse volontairement fausse mais toujours syntaxiquement valide,
  // choisie pour retomber sur le dernier nœud du PRT ("caractères valides" / fallback
  // générique) plutôt que sur un diagnostic intermédiaire (espaces, préfixe, casse...) :
  // un chiffre non nul du charset de la base cible, répété, jamais préfixé.
  function _bnBuildWrongProbe(toBase) {
    var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, toBase);
    var digit = charset.length > 1 ? charset[1] : charset[0];
    return digit.repeat(6);
  }

  async function _bnFetchRealFbWrong(xml, seed, p) {
    try {
      var probe = (p.toBase === 10) ? '-987654321' : _bnBuildWrongProbe(p.toBase);
      var answers = {};
      answers['ans1'] = probe;
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _bnCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _bnRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'basen') return;
    var gen = ++_bnRealPreviewGen;

    var p;
    try { p = genBasenParams(); } catch (e) { return; }

    _bnSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genBasenCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_bnEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _bnRealPreviewGen) _bnSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _bnPreviewSeed);
      if (gen !== _bnRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _bnLastReal = {
        bodyHTML: _bnCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.bnRefreshPreview === 'function') window.bnRefreshPreview();
      _bnSetRealPreviewStatus('', false);

      // Résolution du feedback ❌ via /grade, en second temps (n'empêche pas
      // l'aperçu principal de s'afficher si /grade échoue ou tarde).
      var fbWrongHTML = await _bnFetchRealFbWrong(xml, _bnPreviewSeed, p);
      if (gen !== _bnRealPreviewGen || !_bnLastReal) return;
      if (fbWrongHTML) {
        _bnLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.bnRefreshPreview === 'function') window.bnRefreshPreview();
      }
    } catch (e) {
      if (gen !== _bnRealPreviewGen) return;
      _bnSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function bnRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'basen') return;
    _bnPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _bnRefreshRealPreview();
  }
  window.bnRerollPreviewSeed = bnRerollPreviewSeed;

  function bnShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'basen') return;
    _bnEnsurePreviewSeed();
    _bnRefreshRealPreview();
  }
  window.bnShowRealPreview = bnShowRealPreview;

  function _bnAugmentStateWithReal(state) {
    if (_bnLastReal) {
      state.realBodyHTML = _bnLastReal.bodyHTML;
      state.realFbGenHTML = _bnLastReal.fbGenHTML;
      state.realFbWrongHTML = _bnLastReal.fbWrongHTML;
    }
  }

  window.bnRefreshPreview = _hsWireSimplePreview('basen', 'bn', 'bn-preview-container', 'fp-basen', renderPreviewHTML_basen, false, _bnAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-inequation.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-basen');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _bnPreviewSeed = null;
          _bnLastReal = null;
          var rerollBtn = document.getElementById('bn-reroll-preview-btn');
          var showRealBtn = document.getElementById('bn-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genBasenCore(1, genBasenParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _bnSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
