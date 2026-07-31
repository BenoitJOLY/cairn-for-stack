// ══════════════════════════════════════════════════════
//  RENDER : COMPLEXE (nombres complexes)
// ══════════════════════════════════════════════════════
// L'énoncé et le feedback général sont stockés avec des placeholders
// [Z1], [Z2], [MOD]... (remplacés côté STACK par les variables Maxima —
// voir _cpxReplace() dans gen-math-complexe.js). En mode "fixe", on calcule
// ici les mêmes valeurs en JS (fonctions de complexe-ui.js) pour montrer un
// exemple concret ; en mode "aléatoire" on ne peut pas les connaître à
// l'avance (générées par STACK), donc on affiche "?".
function _cpxBuildPmap(state) {
  const scenario = state.scenario || 'forme-alg';
  const mode = state.mode || 'fixe';
  const letter = state.complexno || 'i';
  const op = state.op || '*';
  const fmt = (typeof _cpxFmt === 'function') ? _cpxFmt : function (re) { return String(re); };
  const fmtN = (typeof _cpxFmtN === 'function') ? _cpxFmtN : function (n) { return String(n); };
  const fmtAngle = (typeof _cpxFmtAngle === 'function') ? _cpxFmtAngle : function (r) { return String(r); };

  if (mode !== 'fixe') {
    return { Z1: '?', Z2: '?', RESULT: '?', Z: '?', MOD: '?', ARG: '?', EQB: '?', EQC: '?', DELTA: '?', ZA: '?', ZB: '?', ZI: '?', AB: '?', ZBAR: '?' };
  }

  const a = parseFloat(state.a) || 0, b = parseFloat(state.b) || 0;
  const c = parseFloat(state.c) || 0, d = parseFloat(state.d) || 0;
  const eqb = parseFloat(state.eqb) || 0, eqc = parseFloat(state.eqc) || 0;

  if (scenario === 'forme-alg') {
    let re, im;
    if (op === '+') { re = a + c; im = b + d; }
    else if (op === '-') { re = a - c; im = b - d; }
    else if (op === '*') { re = a * c - b * d; im = a * d + b * c; }
    else { const dn = c * c + d * d; re = dn ? (a * c + b * d) / dn : NaN; im = dn ? (b * c - a * d) / dn : NaN; }
    return { Z1: fmt(a, b, letter), Z2: fmt(c, d, letter), RESULT: fmt(re, im, letter), Z: fmt(re, im, letter) };
  }
  if (scenario === 'module-arg') {
    const mod = Math.sqrt(a * a + b * b), arg = Math.atan2(b, a);
    return { Z: fmt(a, b, letter), MOD: fmtN(mod), ARG: fmtAngle(arg) };
  }
  if (scenario === 'equation-2deg') {
    const delta = eqb * eqb - 4 * eqc;
    if (delta < 0) {
      const zRe = -eqb / 2, zIm = Math.sqrt(-delta) / 2;
      return { EQB: fmtN(eqb), EQC: fmtN(eqc), DELTA: fmtN(delta), Z1: fmt(zRe, zIm, letter), Z2: fmt(zRe, -zIm, letter) };
    }
    return { EQB: fmtN(eqb), EQC: fmtN(eqc), DELTA: fmtN(delta), Z1: '?', Z2: '?' };
  }
  if (scenario === 'affixes') {
    const midRe = (a + c) / 2, midIm = (b + d) / 2;
    const dist = Math.sqrt((c - a) * (c - a) + (d - b) * (d - b));
    return { ZA: fmt(a, b, letter), ZB: fmt(c, d, letter), ZI: fmt(midRe, midIm, letter), AB: fmtN(dist) };
  }
  // conjugue
  return { Z: fmt(a, b, letter), ZBAR: fmt(a, -b, letter) };
}

function _cpxSubst(text, pmap) {
  if (typeof _cpxReplace === 'function') return _cpxReplace(text, '', pmap);
  if (!text) return text;
  return text.replace(/\[([A-Z0-9_]+)\]/g, function (m, key) { return pmap[key] !== undefined ? pmap[key] : m; });
}

function _cpxInputRowHTML(scenario) {
  if (scenario === 'module-arg') {
    return '<p>\\(|z|=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_module') + '"></p>'
         + '<p>\\(\\arg(z)=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_argument') + '"></p>';
  }
  if (scenario === 'equation-2deg') {
    return '<p>\\(z_1=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_z1') + '"></p>'
         + '<p>\\(z_2=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_z2') + '"></p>';
  }
  if (scenario === 'affixes') {
    return '<p>\\(z_I=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_milieu_point_i') + '"></p>'
         + '<p>\\(AB=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_distance_ab') + '"></p>';
  }
  if (scenario === 'conjugue') {
    return '<p>\\(\\bar{z}=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_conjugue') + '"></p>';
  }
  return '<p>\\(z=\\) <input class="hs-cpx-input" type="text" disabled aria-label="' + I18N.t('cpx.aria_z') + '"></p>';
}

function renderPreviewHTML_complexe(state) {
  const bareme = state.bareme || 1;
  const scenario = state.scenario || 'forme-alg';
  const mode = state.mode || 'fixe';
  const scenarioLabels = {
    'forme-alg': I18N.t('cpx.preview_scenario_forme_alg'),
    'module-arg': I18N.t('cpx.preview_scenario_module_arg'),
    'equation-2deg': I18N.t('cpx.preview_scenario_equation'),
    'affixes': I18N.t('cpx.preview_scenario_affixes'),
    'conjugue': I18N.t('cpx.preview_scenario_conjugue')
  };

  const pmap = _cpxBuildPmap(state);
  const useReal = !!state.realBodyHTML;
  const rawText = state.text || (typeof _cpxGenEnonce === 'function' ? _cpxGenEnonce(scenario, state.op || '*', state.complexno || 'i') : '');
  const text = _hsRenderMath(useReal ? state.realBodyHTML : _cpxSubst(rawText, pmap));
  const inputRow = _hsRenderMath(_cpxInputRowHTML(scenario));

  // state.realFbWrongHTML : HTML du nœud PRT réellement déclenché par une réponse
  // fausse (sonde), déjà encadré côté serveur — voir _cpxRefreshRealPreview(). On
  // l'affiche en plus du catalogue local des feedbacks détaillés (pas à sa place :
  // ce catalogue liste plusieurs textes édités par l'enseignant selon le type
  // d'erreur, alors que la sonde n'en déclenche qu'un seul à la fois — les cacher
  // ferait disparaître des feedbacks bien réels aux yeux de l'enseignant).
  let fbGlobalHTML = '';
  if (typeof CPX_FB_DEFS !== 'undefined' && CPX_FB_DEFS[scenario]) {
    fbGlobalHTML = CPX_FB_DEFS[scenario].map(function (item) {
      const id = _cpxFbId(scenario, item.key);
      const raw = (state.fbDetail && state.fbDetail[id]) ? state.fbDetail[id] : I18N.t(item.defKey);
      return `<div class="hs-clickable" data-cpx-field="detail:${id}" style="margin-bottom:8px;">${_hsRenderMath(_cpxSubst(raw, pmap))}</div>`;
    }).join('');
  }
  if (useReal && state.realFbWrongHTML) {
    fbGlobalHTML = `<div style="margin-bottom:8px;border-left:3px solid #be185d;padding-left:8px;"><em style="font-size:.78rem;color:#9d174d;">🟢 ${I18N.t('common.preview_real_badge')}</em><br>${_hsRenderMath(state.realFbWrongHTML)}</div>` + fbGlobalHTML;
  }

  // state.realFbGenHTML : generalFeedback déjà rendu par Maxima — remplace le
  // calcul local approximatif.
  const rawFbGen = state.fbGen || (typeof _cpxGenFbgen === 'function' ? _cpxGenFbgen(scenario, state.op || '*', state.complexno || 'i') : '');
  const fbGenBody = state.realFbGenHTML || _cpxSubst(rawFbGen, pmap);
  const fbGenHTML = `<div class="hs-clickable" data-cpx-field="fbgen">${_hsRenderMath(fbGenBody)}</div>`;

  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-complexe .mpane.on') && document.querySelector('#fp-complexe .mpane.on').id === 'cpx-fb-gen'; } catch (e) {}

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 12px 16px; color: #1f2937; background: #ffffff; }
  .hs-preview-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .hs-preview-badge { background: #be185d; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: #fdf2f8; color: #9d174d; border: 1px solid #be185d; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  [data-cpx-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-cpx-field]:hover { outline: 2px dashed #be185d; outline-offset: 2px; }
  .hs-preview-text[data-cpx-field]:hover { background: #fdf2f8; }
  .hs-cpx-input { width: 160px; padding: 6px 10px; border: 1px solid #94a3b8; border-radius: 5px; font-size: .95rem; background: #f8fafc; color: #94a3b8; }
  .hs-validate-btn { margin-top: 12px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
  body.hs-focus-fbgen .hs-main-block { display: none; }
  body.hs-focus-fbgen .hs-fbgen-block .hs-fb-section-title { margin-top: 0; border-top: none; padding-top: 0; }
  body:not(.hs-focus-fbgen) .hs-fbgen-block { display: none; }
</style>
</head>
<body class="${focusFbGen ? 'hs-focus-fbgen' : ''}">
  <div class="hs-preview-header">
    <span class="hs-preview-badge">${I18N.t('type.complexe')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${scenarioLabels[scenario] || scenario}</span>
    ${mode === 'aleatoire' ? `<span class="hs-preview-note">${I18N.t('common.preview_stack_generated_values')}</span>` : ''}
    <span class="hs-preview-note">${useReal ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge'))}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-cpx-field="text">${text}</div>
    ${inputRow}
    <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

    <div class="hs-fb-section-title">${I18N.t('common.preview_fb_correction_title')}</div>
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
  function updateCpxFullPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'complexe') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('cpx-preview-container');
    if (!container) return;
    var state = captureState();
    _cpxAugmentStateWithReal(state);
    var __cpxHasRandom = true;
    try { __cpxHasRandom = _hsHasRandomization(genComplexeCore(1, _cpxBuildParams()).vars); } catch (e) { __cpxHasRandom = true; }
    _hsUpdateRerollVisibility('cpx', __cpxHasRandom);
    var iframe = mountPreviewIframe('cpx-preview-container', renderPreviewHTML_complexe(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireCpxPreviewClicks(iframe); });
    }
  }
  window.cpxRefreshPreview = updateCpxFullPreview;

  function wireCpxPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-cpx-field]');
        if (!el) return;
        var field = el.getAttribute('data-cpx-field');
        function clickTab(tabName) {
          var btn = document.querySelector('#fp-complexe .mtab[onclick*="\'' + tabName + '\'"]');
          if (btn) btn.click();
        }
        function openField(id) {
          var prevEl = document.getElementById('prev-' + id);
          if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof openRich === 'function') openRich(id);
        }
        if (field === 'text') { clickTab('cfg'); openField('cpx-text'); return; }
        if (field.indexOf('detail:') === 0) { clickTab('cfg'); openField(field.slice(7)); return; }
        if (field === 'fbgen') { clickTab('fb-gen'); return; }
      });
    } catch (e) {
      console.error('wireCpxPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function wireCpxPreview() {
    var panel = document.getElementById('fp-complexe');
    if (!panel) return;
    panel.addEventListener('input', updateCpxFullPreview);
    panel.addEventListener('change', updateCpxFullPreview);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateCpxFullPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });
    hsRegisterPreviewRefresher(updateCpxFullPreview);
  }

  // ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
  // Même mécanisme que preview-algebraic.js (_algRefreshRealPreview) : le rendu
  // réel est fusionné dans `state` juste avant renderPreviewHTML_complexe().
  var _cpxPreviewSeed = null;
  var _cpxRealPreviewGen = 0;
  var _cpxLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _cpxEnsurePreviewSeed() {
    if (!_cpxPreviewSeed) _cpxPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _cpxPreviewSeed;
  }

  function _cpxSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('cpx-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _cpxCleanBodyHTML(html) {
    return (html || '').replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '').replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _cpxCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sondes volontairement fausses mais toujours syntaxiquement valides pour les
  // inputs algébriques de chaque scénario (X=1, seul cas utilisé pour l'aperçu
  // réel) : un littéral entier (partie réelle/module/argument) ou complexe
  // (a+b*%i), dont la probabilité de coïncider avec les valeurs attendues de
  // l'enseignant est négligeable — même esprit que preview-algebraic.js.
  function _cpxWrongProbeAnswers(scenario) {
    var cplx = '999999937+999999937*%i';
    var real = '999999937';
    if (scenario === 'module-arg') return { ans_mod1: real, ans_arg1: real };
    if (scenario === 'equation-2deg') return { ans_z11: cplx, ans_z21: cplx };
    if (scenario === 'affixes') return { ans_zi1: cplx, ans_ab1: real };
    if (scenario === 'conjugue') return { ans_zbar1: cplx };
    return { ans11: cplx }; // forme-alg
  }

  async function _cpxFetchRealFbWrong(xml, seed, scenario) {
    try {
      var gradeRes = await maximaGradeXML(xml, seed, _cpxWrongProbeAnswers(scenario));
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _cpxCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _cpxRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'complexe') return;
    var gen = ++_cpxRealPreviewGen;

    var p;
    try { p = _cpxBuildParams(); } catch (e) { return; }

    _cpxSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genComplexeCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_cpxEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _cpxRealPreviewGen) _cpxSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _cpxPreviewSeed);
      if (gen !== _cpxRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _cpxLastReal = {
        bodyHTML: _cpxCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      updateCpxFullPreview();
      _cpxSetRealPreviewStatus('', false);

      var fbWrongHTML = await _cpxFetchRealFbWrong(xml, _cpxPreviewSeed, p.scenario);
      if (gen !== _cpxRealPreviewGen || !_cpxLastReal) return;
      if (fbWrongHTML) {
        _cpxLastReal.fbWrongHTML = fbWrongHTML;
        updateCpxFullPreview();
      }
    } catch (e) {
      if (gen !== _cpxRealPreviewGen) return;
      _cpxSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function cpxRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'complexe') return;
    _cpxPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _cpxRefreshRealPreview();
  }
  window.cpxRerollPreviewSeed = cpxRerollPreviewSeed;

  function cpxShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'complexe') return;
    _cpxEnsurePreviewSeed();
    _cpxRefreshRealPreview();
  }
  window.cpxShowRealPreview = cpxShowRealPreview;

  function _cpxAugmentStateWithReal(state) {
    if (_cpxLastReal) {
      state.realBodyHTML = _cpxLastReal.bodyHTML;
      state.realFbGenHTML = _cpxLastReal.fbGenHTML;
      state.realFbWrongHTML = _cpxLastReal.fbWrongHTML;
    }
  }

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu
  // réel effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-complexe');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _cpxPreviewSeed = null;
          _cpxLastReal = null;
          var rerollBtn = document.getElementById('cpx-reroll-preview-btn');
          var showRealBtn = document.getElementById('cpx-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genComplexeCore(1, _cpxBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _cpxSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireCpxPreview);
  } else {
    wireCpxPreview();
  }
})();
