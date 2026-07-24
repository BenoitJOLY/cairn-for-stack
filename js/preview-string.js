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
  const text = _hsRenderMath(state.text || '');
  const size = state.size || 15;
  const paletteHTML = state.aideOn ? _strPaletteBarHTML(state.palettes) : '';

  const fbGlobalHTML = `
    <div data-str-field="fbc">${wrapFb(_hsRenderMath(state.fbc || ''), true)}</div>
    <div data-str-field="fbe">${wrapFb(_hsRenderMath(state.fbe || ''), false)}</div>
    ${state.sol ? `<div class="hs-clickable" data-str-field="sol" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin-top:8px;"><strong>Solution :</strong> ${_hsRenderMath(state.sol)}</div>` : ''}`;

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
    <span class="hs-preview-badge">Réponse textuelle</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
  </div>
  <div class="hs-preview-text" data-str-field="text">${text}</div>
  ${paletteHTML}
  <input class="hs-str-input" type="text" disabled size="${size}" placeholder="Réponse de l'élève…">
  <button class="hs-validate-btn" disabled>Valider</button>

  <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireStrPreview);
  } else {
    wireStrPreview();
  }
})();
