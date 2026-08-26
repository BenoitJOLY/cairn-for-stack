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

// ══════════════════════════════════════════════════════
//  RENDER : STRING (réponse textuelle + palette aide élève)
// ══════════════════════════════════════════════════════
function _strPaletteBarHTML(palettes) {
  const selected = (palettes || []).filter(function (p) { return p.ch; }).map(function (p) { return p.v; });
  if (!selected.length || typeof STR_PALETTES === 'undefined') return '';
  let btns = '';
  selected.forEach(function (key) {
    const pal = STR_PALETTES[key];
    if (!pal) return;
    pal.btns.forEach(function (b) {
      btns += `<button type="button" class="hs-str-pal-btn" disabled>${b.d}</button>`;
    });
  });
  if (!btns) return '';
  return `<div class="hs-str-palette-bar">${btns}</div>`;
}

function renderPreviewHTML_string(state) {
  const bareme = state.bareme || 0;
  const useReal = !!state.realBodyHTML;
  const text = _hsRenderMath(useReal ? state.realBodyHTML : (state.text || ''));
  const size = state.size || 15;
  const paletteHTML = state.aideOn ? _strPaletteBarHTML(state.palettes) : '';

  // state.realFbWrongHTML : HTML du nœud PRT réellement déclenché par une réponse
  // fausse (sonde), déjà encadré côté serveur — voir _strRefreshRealPreview().
  // Il inclut déjà la solution (falsefeedback:fbe+solH dans genStringCore), donc
  // on masque le bloc "sol" local en mode réel pour éviter le doublon.
  const fbWrongBody = state.realFbWrongHTML || wrapFb(_hsRenderMath(state.fbe || ''), false);
  const fbGlobalHTML = `
    <div data-str-field="fbc">${wrapFb(_hsRenderMath(state.fbc || ''), true)}</div>
    <div data-str-field="fbe">${fbWrongBody}</div>
    ${(!useReal && state.sol) ? `<div class="hs-clickable" data-str-field="sol" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin-top:8px;"><strong>${I18N.t('str.preview_solution')}</strong> ${_hsRenderMath(state.sol)}</div>` : ''}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 12px 16px; color: #1f2937; background: #ffffff; }
  .hs-preview-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .hs-preview-badge { background: #7c3aed; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: #f5f3ff; color: #6b21a8; border: 1px solid #7c3aed; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  [data-str-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-str-field]:hover { outline: 2px dashed #7c3aed; outline-offset: 2px; }
  .hs-preview-text[data-str-field]:hover { background: #f5f3ff; }
  .hs-str-input { padding: 6px 10px; border: 1px solid #94a3b8; border-radius: 5px; font-size: .95rem; background: #f8fafc; color: #94a3b8; }
  .hs-str-palette-bar { margin: 10px 0; padding: 9px 11px; background: #fdf4ff; border: 1.5px solid #e9d5ff; border-radius: 7px; display: flex; flex-wrap: wrap; gap: 4px; }
  .hs-str-pal-btn { border: 1px solid #e9d5ff; background: #fff; border-radius: 5px; padding: 3px 8px; font-size: .85rem; color: #6b21a8; cursor: not-allowed; }
  .hs-validate-btn { margin-top: 12px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
</style>
</head>
<body>
  <div class="hs-preview-header">
    <span class="hs-preview-badge">${I18N.t('badge.string_answer')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${useReal ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge'))}</span>
  </div>
  <div class="hs-preview-text" data-str-field="text">${text}</div>
  ${paletteHTML}
  <input class="hs-str-input" type="text" disabled size="${size}" placeholder="${I18N.t('common.preview_student_placeholder')}">
  <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

  <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
  ${fbGlobalHTML}
</body>
</html>`;
}

(function () {
  function updateStrFullPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'string') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('str-preview-container');
    if (!container) return;
    var state = captureState();
    _strAugmentStateWithReal(state);
    var __strHasRandom = true;
    try { __strHasRandom = _hsHasRandomization(genStringCore(1, _strBuildParams(1)).vars); } catch (e) { __strHasRandom = true; }
    _hsUpdateRerollVisibility('str', __strHasRandom);
    var iframe = mountPreviewIframe('str-preview-container', renderPreviewHTML_string(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireStrPreviewClicks(iframe); });
    }
  }
  window.strRefreshPreview = updateStrFullPreview;

  function wireStrPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-str-field]');
        if (!el) return;
        var field = el.getAttribute('data-str-field');
        function openField(id) {
          var prevEl = document.getElementById('prev-' + id);
          if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof openRich === 'function') openRich(id);
        }
        if (field === 'text') return openField('str-text');
        if (field === 'fbc') return openField('str-fbc');
        if (field === 'fbe') return openField('str-fbe');
        if (field === 'sol') return openField('str-sol');
      });
    } catch (e) {
      console.error('wireStrPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function wireStrPreview() {
    var panel = document.getElementById('fp-string');
    if (!panel) return;
    panel.addEventListener('input', updateStrFullPreview);
    panel.addEventListener('change', updateStrFullPreview);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateStrFullPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });
    hsRegisterPreviewRefresher(updateStrFullPreview);
  }

  // ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
  // Même mécanisme que preview-algebraic.js (_algRefreshRealPreview) : le rendu
  // réel est fusionné dans `state` juste avant renderPreviewHTML_string().
  var _strPreviewSeed = null;
  var _strRealPreviewGen = 0;
  var _strLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _strEnsurePreviewSeed() {
    if (!_strPreviewSeed) _strPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _strPreviewSeed;
  }

  function _strSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('str-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _strCleanBodyHTML(html) {
    return (html || '').replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '').replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _strCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse pour l'input string (ans1, X=1 en aperçu) :
  // chaîne longue (>30 caractères) pour garantir, côté variante Levenshtein
  // (genStringLevenshteinCore), une distance renvoyée à 100 (m>30 → return(100))
  // et donc l'atterrissage sur le nœud "catch-all" fb6 ; côté variantes simples
  // (comparaison directe / alternatives), une chaîne aussi improbable est de
  // toute façon rejetée par la comparaison — même sonde couvre les deux cas.
  async function _strFetchRealFbWrong(xml, seed) {
    try {
      var gradeRes = await maximaGradeXML(xml, seed, { ans1: 'reponse_totalement_fausse_999999937' });
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _strCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _strRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'string') return;
    var gen = ++_strRealPreviewGen;

    var p;
    try { p = _strBuildParams(1); } catch (e) { return; }

    _strSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genStringCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_strEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _strRealPreviewGen) _strSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _strPreviewSeed);
      if (gen !== _strRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _strLastReal = {
        bodyHTML: _strCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      updateStrFullPreview();
      _strSetRealPreviewStatus('', false);

      var fbWrongHTML = await _strFetchRealFbWrong(xml, _strPreviewSeed);
      if (gen !== _strRealPreviewGen || !_strLastReal) return;
      if (fbWrongHTML) {
        _strLastReal.fbWrongHTML = fbWrongHTML;
        updateStrFullPreview();
      }
    } catch (e) {
      if (gen !== _strRealPreviewGen) return;
      _strSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function strRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'string') return;
    _strPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _strRefreshRealPreview();
  }
  window.strRerollPreviewSeed = strRerollPreviewSeed;

  function strShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'string') return;
    _strEnsurePreviewSeed();
    _strRefreshRealPreview();
  }
  window.strShowRealPreview = strShowRealPreview;

  function _strAugmentStateWithReal(state) {
    if (_strLastReal) {
      state.realBodyHTML = _strLastReal.bodyHTML;
      state.realFbGenHTML = _strLastReal.fbGenHTML;
      state.realFbWrongHTML = _strLastReal.fbWrongHTML;
    }
  }

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu
  // réel effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-string');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _strPreviewSeed = null;
          _strLastReal = null;
          var rerollBtn = document.getElementById('str-reroll-preview-btn');
          var showRealBtn = document.getElementById('str-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genStringCore(1, _strBuildParams(1)).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _strSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireStrPreview);
  } else {
    wireStrPreview();
  }
})();
