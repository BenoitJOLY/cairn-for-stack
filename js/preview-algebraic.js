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
    { key: 'partial', desc: 'Vérification développement et réduction' },
    { key: 'errsigne', desc: 'Détection erreur de signe', needsError: true }
  ],
  factorisation: [
    { key: 'partial', desc: 'Vérification factorisation maximale' }
  ],
  fraction: [
    { key: 'partial', desc: 'Vérification simplification maximale' }
  ],
  expert: [
    { key: 'partial', desc: 'Vérification développement et réduction' },
    { key: 'errsigne', desc: 'Détection erreur de signe', needsError: true }
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
      <div style="font-size:.78rem;font-weight:700;color:#a16207;text-transform:uppercase;letter-spacing:.02em;margin-bottom:4px;">${m.desc}</div>
      ${_hsRenderMath(html)}
    </div>`;
  }).join('');
}

function renderPreviewHTML_algebraic(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const exprDisplay = state.exprDisplay || '';
  const exprDisplayHTML = exprDisplay ? _hsRenderMath('\\(' + _hsMaximaToLatexSafe(exprDisplay) + '\\)') : '';
  const modeLabels = {
    libre: 'Libre (AlgEquiv)',
    developpement: 'Développement / Réduction',
    factorisation: 'Factorisation maximale',
    fraction: 'Simplification de fraction',
    expert: 'Développement expert (erreur classique)'
  };
  const modeLabel = modeLabels[state.mode] || 'Libre (AlgEquiv)';

  const aideOn = !!state.aideOn;
  let aideHTML = '';
  try { if (aideOn && typeof buildAlgHelp === 'function') aideHTML = buildAlgHelp(); } catch (e) {}
  let kbdOn = false;
  try { kbdOn = aideOn && !!document.getElementById('alg-h-kbd')?.checked; } catch (e) {}

  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-algebraic .mpane.on') && document.querySelector('#fp-algebraic .mpane.on').id === 'alg-fb-gen'; } catch (e) {}

  const fbGlobalHTML = `
    <div data-alg-field="fbc">${wrapFb(_hsRenderMath(state.fbc || FB_JUSTE_DEFAULT), true)}</div>
    <div data-alg-field="fbe">${wrapFb(_hsRenderMath(state.fbe || FB_FAUX_DEFAULT), false)}</div>`;
  const fbDetailHTML = _algFbDetailHTML(state);

  const formulaDisplay = state.formula ? _hsRenderMath('\\(' + _hsMaximaToLatexSafe(state.formula) + '\\)') : '—';
  const fbGenHTML = `<div class="hs-clickable" data-alg-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">
    <p style="margin:0 0 4px 0;"><strong>Réponse attendue :</strong> ${formulaDisplay}</p>
    ${state.sol ? `<div style="margin-top:8px;">${_hsRenderMath(state.sol)}</div>` : ''}
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
    <span class="hs-preview-badge">Algébrique</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${modeLabel}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-alg-field="text">${text}</div>
    ${exprDisplay ? `<div class="hs-preview-text" data-alg-field="expr-display" style="font-weight:600;">${exprDisplayHTML}</div>` : ''}
    <div data-alg-field="help">${aideHTML ? `<div class="hs-alg-help">${aideHTML}</div>` : ''}${kbdOn ? '<div class="hs-alg-help" style="color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe;">⌨️ Clavier virtuel Maxima inclus dans la question.</div>' : ''}</div>
    <input class="hs-alg-input" type="text" disabled placeholder="Réponse de l'élève…">
    <button class="hs-validate-btn" disabled>Valider</button>

    <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
    ${fbGlobalHTML}
    ${fbDetailHTML ? `<div class="hs-fb-section-title">Feedbacks détaillés (cas partiels)</div>${fbDetailHTML}` : ''}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">Feedback général (toujours affiché)</div>
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
    var iframe = mountPreviewIframe('alg-preview-container', renderPreviewHTML_algebraic(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireAlgPreviewClicks(iframe); });
    }

    var autoPreview = document.getElementById('alg-fbgen-auto-preview');
    if (autoPreview) {
      var formulaDisplay = state.formula ? _hsRenderMath('\\(' + _hsMaximaToLatexSafe(state.formula) + '\\)') : '—';
      autoPreview.innerHTML = '<p style="margin:0;"><strong>Réponse attendue :</strong> ' + formulaDisplay + '</p>';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAlgPreview);
  } else {
    wireAlgPreview();
  }
})();
