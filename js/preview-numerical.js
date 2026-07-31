// ══════════════════════════════════════════════════════
//  RENDER : NUMERICAL (champ unique)
// ══════════════════════════════════════════════════════
function _hsNumToleranceValue(val, tolType, tolVal) {
  const v = parseFloat(val), t = parseFloat(tolVal);
  if (tolType === 'relative') {
    if (!isNaN(v) && !isNaN(t)) return Number(Math.abs(v * t).toPrecision(10)).toString();
    return `${val || '—'}×${tolVal}`;
  }
  return tolVal;
}

function renderPreviewHTML_numerical(state) {
  const bareme = state.bareme || 0;
  const useReal = !!state.realBodyHTML;
  const text = _hsRenderMath(useReal ? state.realBodyHTML : (state.text || ''));
  const tolLabel = state.tolType === 'absolute' ? I18N.t('num.tol_absolute') : I18N.t('num.tol_relative');
  const tolVal = state.tolVal || '0.05';

  const aideOn = !!state.aideOn;
  let aideHTML = '';
  try { if (aideOn && typeof buildNumHelp === 'function') aideHTML = buildNumHelp(); } catch (e) {}
  let kbdOn = false;
  try { kbdOn = aideOn && !!document.getElementById('num-h-kbd')?.checked; } catch (e) {}

  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-numerical .mpane.on') && document.querySelector('#fp-numerical .mpane.on').id === 'num-fb-gen'; } catch (e) {}

  // state.realFbWrongHTML : HTML du nœud PRT réellement déclenché par une réponse
  // fausse (sonde), déjà encadré côté serveur — voir _numRefreshRealPreview().
  const fbWrongBody = state.realFbWrongHTML || wrapFb(_hsRenderMath(state.fbe || FB_FAUX_DEFAULT), false);
  const fbGlobalHTML = `
    <div data-num-field="fbc">${wrapFb(_hsRenderMath(state.fbc || FB_JUSTE_DEFAULT), true)}</div>
    <div data-num-field="fbe">${fbWrongBody}</div>`;

  const tolNumeric = _hsNumToleranceValue(state.val, state.tolType, tolVal);
  const tolDisplay = `± ${tolNumeric}`;
  // state.realFbGenHTML : generalFeedback déjà rendu par Maxima (voir
  // _numRefreshRealPreview) — remplace le calcul local approximatif.
  const fbGenBody = state.realFbGenHTML || `<p style="margin:0 0 4px 0;"><strong>${I18N.t('num.preview_valeur_acceptee')}</strong> <code>${state.val || '—'} ${tolDisplay}</code> <span style="color:#475569;">(${I18N.t('common.preview_tolerance').toLowerCase()} ${tolLabel})</span></p>${state.fbGen ? `<div style="margin-top:8px;">${state.fbGen}</div>` : ''}`;
  const fbGenHTML = `<div class="hs-clickable" data-num-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">
    ${_hsRenderMath(fbGenBody)}
  </div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 12px 16px; color: #1f2937; background: #ffffff; }
  .hs-preview-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .hs-preview-badge { background: #047857; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: #ecfdf5; color: #047857; border: 1px solid #047857; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  [data-num-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-num-field]:hover { outline: 2px dashed #047857; outline-offset: 2px; }
  .hs-preview-text[data-num-field]:hover { background: #ecfdf5; }
  .hs-num-input { width: 160px; padding: 6px 10px; border: 1px solid #94a3b8; border-radius: 5px; font-size: .95rem; background: #f8fafc; color: #94a3b8; }
  .hs-validate-btn { margin-top: 12px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
  .hs-alg-help { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 9px 13px; border-radius: 7px; margin: 10px 0; font-size: .82rem; }
  body.hs-focus-fbgen .hs-main-block { display: none; }
  body.hs-focus-fbgen .hs-fbgen-block .hs-fb-section-title { margin-top: 0; border-top: none; padding-top: 0; }
  body:not(.hs-focus-fbgen) .hs-fbgen-block { display: none; }
</style>
</head>
<body class="${focusFbGen ? 'hs-focus-fbgen' : ''}">
  <div class="hs-preview-header">
    <span class="hs-preview-badge">${I18N.t('type.numerical')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${I18N.t('common.preview_tolerance')} ${tolLabel} ± ${_hsNumToleranceValue(state.val, state.tolType, tolVal)}</span>
    <span class="hs-preview-note">${useReal ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge'))}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-num-field="text">${text}</div>
    <div data-num-field="help">${aideHTML ? `<div class="hs-alg-help">${aideHTML}</div>` : ''}${kbdOn ? `<div class="hs-alg-help" style="color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe;">⌨️ ${I18N.t('common.preview_kbd_note')}</div>` : ''}</div>
    <input class="hs-num-input" type="text" disabled placeholder="${I18N.t('common.preview_student_placeholder')}">
    <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

    <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
    ${fbGlobalHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">${I18N.t('common.preview_fbgen_always_title')}</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}

(function () {
  function updateNumFullPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'numerical') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('num-preview-container');
    if (!container) return;
    var state = captureState();
    _numAugmentStateWithReal(state);
    var __numHasRandom = true;
    try { __numHasRandom = _hsHasRandomization(genNumericalCore(1, _numBuildParams()).vars); } catch (e) { __numHasRandom = true; }
    _hsUpdateRerollVisibility('num', __numHasRandom);
    var iframe = mountPreviewIframe('num-preview-container', renderPreviewHTML_numerical(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireNumPreviewClicks(iframe); });
    }

    var autoPreview = document.getElementById('num-fbgen-auto-preview');
    if (autoPreview) {
      var tolLabel = state.tolType === 'absolute' ? I18N.t('num.tol_absolute') : I18N.t('num.tol_relative');
      var tolVal = state.tolVal || '0.05';
      var tolNumeric = _hsNumToleranceValue(state.val, state.tolType, tolVal);
      autoPreview.innerHTML = '<p style="margin:0;"><strong>' + I18N.t('num.preview_valeur_acceptee') + '</strong> <code>' + (state.val || '—') + ' ± ' + tolNumeric + '</code> <span style="color:#475569;">(' + I18N.t('common.preview_tolerance').toLowerCase() + ' ' + tolLabel + ')</span></p>';
    }
  }
  window.numRefreshPreview = updateNumFullPreview;

  function wireNumPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-num-field]');
        if (!el) return;
        var field = el.getAttribute('data-num-field');
        function openField(id) {
          var prevEl = document.getElementById('prev-' + id);
          if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof openRich === 'function') openRich(id);
        }
        if (field === 'text') return openField('num-text');
        if (field === 'fbc') return openField('num-fbc');
        if (field === 'fbe') return openField('num-fbe');
        if (field === 'fbgen') return openField('num-fbgen');
        if (field === 'help') {
          var cfgTab = document.querySelector('#fp-numerical .mtab[onclick*="\'cfg\'"]');
          if (cfgTab) cfgTab.click();
          var aideBox = document.getElementById('num-aide-on');
          if (aideBox) aideBox.closest('div').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    } catch (e) {
      console.error('wireNumPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function wireNumPreview() {
    var panel = document.getElementById('fp-numerical');
    if (!panel) return;
    panel.addEventListener('input', updateNumFullPreview);
    panel.addEventListener('change', updateNumFullPreview);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateNumFullPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });
    hsRegisterPreviewRefresher(updateNumFullPreview);
  }

  // ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
  // Même mécanisme que preview-algebraic.js (_algRefreshRealPreview) : le rendu
  // réel est fusionné dans `state` juste avant renderPreviewHTML_numerical().
  var _numPreviewSeed = null;
  var _numRealPreviewGen = 0;
  var _numLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _numEnsurePreviewSeed() {
    if (!_numPreviewSeed) _numPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _numPreviewSeed;
  }

  function _numSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('num-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _numCleanBodyHTML(html) {
    return (html || '').replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '').replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _numCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais toujours syntaxiquement valide pour un
  // input numerical : un entier littéral dont la probabilité de coïncider
  // avec la valeur attendue de l'enseignant (à la tolérance près) est
  // négligeable — même choix que preview-algebraic.js.
  async function _numFetchRealFbWrong(xml, seed) {
    try {
      var gradeRes = await maximaGradeXML(xml, seed, { ans1: '999999937' });
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _numCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _numRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'numerical') return;
    var gen = ++_numRealPreviewGen;

    var p;
    try { p = _numBuildParams(); } catch (e) { return; }

    _numSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genNumericalCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_numEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _numRealPreviewGen) _numSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _numPreviewSeed);
      if (gen !== _numRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _numLastReal = {
        bodyHTML: _numCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      updateNumFullPreview();
      _numSetRealPreviewStatus('', false);

      var fbWrongHTML = await _numFetchRealFbWrong(xml, _numPreviewSeed);
      if (gen !== _numRealPreviewGen || !_numLastReal) return;
      if (fbWrongHTML) {
        _numLastReal.fbWrongHTML = fbWrongHTML;
        updateNumFullPreview();
      }
    } catch (e) {
      if (gen !== _numRealPreviewGen) return;
      _numSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function numRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'numerical') return;
    _numPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _numRefreshRealPreview();
  }
  window.numRerollPreviewSeed = numRerollPreviewSeed;

  function numShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'numerical') return;
    _numEnsurePreviewSeed();
    _numRefreshRealPreview();
  }
  window.numShowRealPreview = numShowRealPreview;

  function _numAugmentStateWithReal(state) {
    if (_numLastReal) {
      state.realBodyHTML = _numLastReal.bodyHTML;
      state.realFbGenHTML = _numLastReal.fbGenHTML;
      state.realFbWrongHTML = _numLastReal.fbWrongHTML;
    }
  }

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu
  // réel effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-numerical');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _numPreviewSeed = null;
          _numLastReal = null;
          var rerollBtn = document.getElementById('num-reroll-preview-btn');
          var showRealBtn = document.getElementById('num-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genNumericalCore(1, _numBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _numSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireNumPreview);
  } else {
    wireNumPreview();
  }
})();
