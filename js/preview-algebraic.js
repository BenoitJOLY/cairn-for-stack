// ══════════════════════════════════════════════════════
//  RENDER : ALGEBRIQUE (réponse formelle à champ unique)
// ══════════════════════════════════════════════════════
// Type à un seul champ de réponse (pas de tirage pool comme cb/ra/dd/vf) :
// l'aperçu simule juste la zone de saisie STACK <input type="algebraic">
// et reprend les mêmes aides (buildAlgHelp) que celles utilisées pour la
// génération réelle dans generators.js, afin que l'enseignant voie
// exactement ce que l'élève verra.
const ALG_FB_DETAIL_META = {
  developpement: [
    { key: 'partial', descKey: 'alg.node_dev_reduction' },
    { key: 'errsigne', descKey: 'alg.node_err_signe', needsError: true }
  ],
  factorisation: [
    { key: 'partial', descKey: 'alg.node_factorisation_max' }
  ],
  fraction: [
    { key: 'partial', descKey: 'alg.node_simplification_max' }
  ],
  expert: [
    { key: 'partial', descKey: 'alg.node_dev_reduction' },
    { key: 'errsigne', descKey: 'alg.node_err_signe', needsError: true }
  ]
};

function _algFbDetailHTML(state) {
  const meta = ALG_FB_DETAIL_META[state.mode] || [];
  const hasError = !!(state.error && state.error.trim());
  const fbDetail = state.fbDetail || {};
  return meta.filter(function (m) { return !m.needsError || hasError; }).map(function (m) {
    const id = 'alg-fb-' + state.mode + '-' + m.key;
    const html = fbDetail[id] || '';
    return `<div class="hs-clickable" data-alg-field="fbdetail:${id}" style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;margin:4px 0;">
      <div style="font-size:.78rem;font-weight:700;color:#a16207;text-transform:uppercase;letter-spacing:.02em;margin-bottom:4px;">${I18N.t(m.descKey)}</div>
      ${_hsRenderMath(html)}
    </div>`;
  }).join('');
}

function renderPreviewHTML_algebraic(state) {
  const bareme = state.bareme || 0;
  const useReal = !!state.realBodyHTML;
  const text = _hsRenderMath(useReal ? state.realBodyHTML : (state.text || ''));
  const exprDisplay = state.exprDisplay || '';
  // En mode réel, exprDisplay est déjà inclus dans state.realBodyHTML (voir
  // gen-algebraic.js textFrag) : pas de second rendu séparé, sous peine de doublon.
  const exprDisplayHTML = (!useReal && exprDisplay) ? _hsRenderMath('\\(' + _hsMaximaToLatexSafe(exprDisplay) + '\\)') : '';
  const modeLabels = {
    libre: I18N.t('alg.mode_libre'),
    developpement: I18N.t('alg.mode_dev'),
    factorisation: I18N.t('alg.mode_fact'),
    fraction: I18N.t('alg.mode_frac'),
    expert: I18N.t('alg.mode_expert')
  };
  const modeLabel = modeLabels[state.mode] || modeLabels.libre;

  const aideOn = !!state.aideOn;
  let aideHTML = '';
  try { if (aideOn && typeof buildAlgHelp === 'function') aideHTML = buildAlgHelp(); } catch (e) {}
  let kbdOn = false;
  try { kbdOn = aideOn && !!document.getElementById('alg-h-kbd')?.checked; } catch (e) {}

  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-algebraic .mpane.on') && document.querySelector('#fp-algebraic .mpane.on').id === 'alg-fb-gen'; } catch (e) {}

  // state.realFbWrongHTML : HTML du nœud PRT réellement déclenché par une réponse
  // fausse (sonde), déjà encadré côté serveur (applyFbBox_D appliqué dans
  // genAlgebraicCore avant export) — pas de wrapFb() local dans ce cas.
  const fbWrongBody = state.realFbWrongHTML || wrapFb(_hsRenderMath(state.fbe || FB_FAUX_DEFAULT), false);
  const fbGlobalHTML = `
    <div data-alg-field="fbc">${wrapFb(_hsRenderMath(state.fbc || FB_JUSTE_DEFAULT), true)}</div>
    <div data-alg-field="fbe">${fbWrongBody}</div>`;
  const fbDetailHTML = _algFbDetailHTML(state);

  const formulaDisplay = state.formula ? _hsRenderMath('\\(' + _hsMaximaToLatexSafe(state.formula) + '\\)') : '—';
  // state.realFbGenHTML : generalFeedback déjà rendu par Maxima (voir
  // _algRefreshRealPreview) — remplace le calcul local ta approximatif.
  const fbGenBody = state.realFbGenHTML || `<p style="margin:0 0 4px 0;"><strong>${I18N.t('common.preview_expected_answer')}</strong> ${formulaDisplay}</p>
    ${state.sol ? `<div style="margin-top:8px;">${_hsRenderMath(state.sol)}</div>` : ''}`;
  const fbGenHTML = `<div class="hs-clickable" data-alg-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">
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
  .hs-preview-badge { background: #0e7490; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: #ecfeff; color: #0e7490; border: 1px solid #0e7490; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  [data-alg-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-alg-field]:hover { outline: 2px dashed #0e7490; outline-offset: 2px; }
  .hs-preview-text[data-alg-field]:hover { background: #ecfeff; }
  .hs-alg-input { width: 260px; padding: 6px 10px; border: 1px solid #94a3b8; border-radius: 5px; font-size: .95rem; background: #f8fafc; color: #94a3b8; }
  .hs-validate-btn { margin-top: 12px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
  .hs-alg-help { background: #f8f9fa; border: 1px solid #dee2e6; padding: 12px 14px; border-radius: 8px; margin: 10px 0; font-size: .88rem; }
  body.hs-focus-fbgen .hs-main-block { display: none; }
  body.hs-focus-fbgen .hs-fbgen-block .hs-fb-section-title { margin-top: 0; border-top: none; padding-top: 0; }
  body:not(.hs-focus-fbgen) .hs-fbgen-block { display: none; }
</style>
</head>
<body class="${focusFbGen ? 'hs-focus-fbgen' : ''}">
  <div class="hs-preview-header">
    <span class="hs-preview-badge">${I18N.t('type.algebraic')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${modeLabel}</span>
    <span class="hs-preview-note">${useReal ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge'))}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-alg-field="text">${text}</div>
    ${exprDisplayHTML ? `<div class="hs-preview-text" data-alg-field="expr-display" style="font-weight:600;">${exprDisplayHTML}</div>` : ''}
    <div data-alg-field="help">${aideHTML ? `<div class="hs-alg-help">${aideHTML}</div>` : ''}${kbdOn ? `<div class="hs-alg-help" style="color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe;">⌨️ ${I18N.t('common.preview_kbd_note')}</div>` : ''}</div>
    <input class="hs-alg-input" type="text" disabled placeholder="${I18N.t('common.preview_student_placeholder')}">
    <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

    <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
    ${fbGlobalHTML}
    ${fbDetailHTML ? `<div class="hs-fb-section-title">${I18N.t('common.preview_fb_detailed_title')}</div>${fbDetailHTML}` : ''}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">${I18N.t('common.preview_fbgen_always_title')}</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════
//  BRANCHEMENT ALGEBRIQUE
// ══════════════════════════════════════════════════════
(function () {
  function updateAlgFullPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'algebraic') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('alg-preview-container');
    if (!container) return;
    var state = captureState();
    _algAugmentStateWithReal(state);
    var __algHasRandom = true;
    try { __algHasRandom = _hsHasRandomization(genAlgebraicCore(1, _algBuildParams()).vars); } catch (e) { __algHasRandom = true; }
    _hsUpdateRerollVisibility('alg', __algHasRandom);
    var iframe = mountPreviewIframe('alg-preview-container', renderPreviewHTML_algebraic(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireAlgPreviewClicks(iframe); });
    }

    var autoPreview = document.getElementById('alg-fbgen-auto-preview');
    if (autoPreview) {
      var formulaDisplay = state.formula ? _hsRenderMath('\\(' + _hsMaximaToLatexSafe(state.formula) + '\\)') : '—';
      autoPreview.innerHTML = '<p style="margin:0;"><strong>' + I18N.t('common.preview_expected_answer') + '</strong> ' + formulaDisplay + '</p>';
    }
  }
  window.algRefreshPreview = updateAlgFullPreview;

  function wireAlgPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-alg-field]');
        if (!el) return;
        jumpToAlgField(el.getAttribute('data-alg-field'));
      });
    } catch (e) {
      console.error('wireAlgPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function jumpToAlgField(field) {
    function openField(id) {
      var prevEl = document.getElementById('prev-' + id);
      if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof openRich === 'function') openRich(id);
    }
    if (field === 'text') return openField('alg-text');
    if (field === 'fbc') return openField('alg-fbc');
    if (field === 'fbe') return openField('alg-fbe');
    if (field === 'fbgen') return openField('alg-sol');
    if (field.indexOf('fbdetail:') === 0) return openField(field.slice('fbdetail:'.length));
    if (field === 'expr-display') {
      var el = document.getElementById('alg-expr-display');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      return;
    }
    if (field === 'help') {
      var cfgTab = document.querySelector('#fp-algebraic .mtab[onclick*="\'cfg\'"]');
      if (cfgTab) cfgTab.click();
      var aideBox = document.getElementById('alg-aide-on');
      if (aideBox) aideBox.closest('div').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function wireAlgPreview() {
    var panel = document.getElementById('fp-algebraic');
    if (!panel) return;

    panel.addEventListener('input', updateAlgFullPreview);
    panel.addEventListener('change', updateAlgFullPreview);

    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateAlgFullPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });

    hsRegisterPreviewRefresher(updateAlgFullPreview);
  }

  // ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
  // Même mécanisme que preview-inequation.js (_ineqRefreshRealPreview), adapté à
  // l'architecture propre à ce fichier (HTML custom + captureState(), pas
  // _hsWireSimplePreview) : le rendu réel est fusionné dans `state` juste avant
  // renderPreviewHTML_algebraic(), au lieu de passer par un augmentState callback.
  var _algPreviewSeed = null;
  var _algRealPreviewGen = 0;
  var _algLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _algEnsurePreviewSeed() {
    if (!_algPreviewSeed) _algPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _algPreviewSeed;
  }

  function _algSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('alg-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _algCleanBodyHTML(html) {
    return (html || '').replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '').replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _algCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais toujours syntaxiquement valide pour un input
  // de type algebraic (strictsyntax/forbidfloat) : un entier littéral n'utilisant
  // aucun des mots autorisés, dont la probabilité de coïncider avec la formule
  // attendue de l'enseignant est négligeable.
  async function _algFetchRealFbWrong(xml, seed) {
    try {
      var gradeRes = await maximaGradeXML(xml, seed, { ans1: '999999937' });
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _algCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _algRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'algebraic') return;
    var gen = ++_algRealPreviewGen;

    var p;
    try { p = _algBuildParams(); } catch (e) { return; }

    _algSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genAlgebraicCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_algEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _algRealPreviewGen) _algSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _algPreviewSeed);
      if (gen !== _algRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _algLastReal = {
        bodyHTML: _algCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      updateAlgFullPreview();
      _algSetRealPreviewStatus('', false);

      var fbWrongHTML = await _algFetchRealFbWrong(xml, _algPreviewSeed);
      if (gen !== _algRealPreviewGen || !_algLastReal) return;
      if (fbWrongHTML) {
        _algLastReal.fbWrongHTML = fbWrongHTML;
        updateAlgFullPreview();
      }
    } catch (e) {
      if (gen !== _algRealPreviewGen) return;
      _algSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function algRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'algebraic') return;
    _algPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _algRefreshRealPreview();
  }
  window.algRerollPreviewSeed = algRerollPreviewSeed;

  function algShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'algebraic') return;
    _algEnsurePreviewSeed();
    _algRefreshRealPreview();
  }
  window.algShowRealPreview = algShowRealPreview;

  function _algAugmentStateWithReal(state) {
    if (_algLastReal) {
      state.realBodyHTML = _algLastReal.bodyHTML;
      state.realFbGenHTML = _algLastReal.fbGenHTML;
      state.realFbWrongHTML = _algLastReal.fbWrongHTML;
    }
  }

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-inequation.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-algebraic');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _algPreviewSeed = null;
          _algLastReal = null;
          var rerollBtn = document.getElementById('alg-reroll-preview-btn');
          var showRealBtn = document.getElementById('alg-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genAlgebraicCore(1, _algBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _algSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAlgPreview);
  } else {
    wireAlgPreview();
  }
})();
