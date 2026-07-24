function renderPreviewHTML_radio(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const allVrais = state.vrais || [];
  const allFaux = state.faux || [];
  const { drawnVrai, drawnFaux } = _raSimulateDraw(allVrais, allFaux, state.xe);
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-radio .mpane.on') && document.querySelector('#fp-radio .mpane.on').id === 'ra-fb-gen'; } catch (e) {}

  const options = [];
  if (drawnVrai) options.push({ p: drawnVrai, arr: 'vrais', idx: 0, isV: true });
  drawnFaux.forEach(function (p, i) { options.push({ p: p, arr: 'faux', idx: i, isV: false }); });

  const propsHTML = options.map(function (o) {
    return `
      <label class="hs-cb-row" data-ra-field="prop-text" data-ra-array="${o.arr}" data-ra-index="${o.idx}">
        <input type="radio" name="hs-ra-preview" disabled>
        <span class="hs-cb-text">${_hsRenderMath(o.p.text || '')}</span>
      </label>`;
  }).join('');

  const fbItemsHTML = options.map(function (o) {
    const col = o.isV ? 'green' : 'red';
    return `<div class="hs-clickable" data-ra-field="prop-fb" data-ra-array="${o.arr}" data-ra-index="${o.idx}" style="color:${col};border-left:4px solid ${col};padding:7px;margin:3px 0">
      <b>${_hsRenderMath(o.p.text || '')}</b><br/>${_hsRenderMath(o.p.fb || '')}
    </div>`;
  }).join('');

  const fbGenHTML = `<div class="hs-clickable" data-ra-field="fbgen" style="border-left:4px solid #2563eb;padding:10px 14px;background:#eff6ff;border-radius:4px;margin:4px 0;">
    ${_raAutoFbGenHTML(drawnVrai, !!state.fbGenShowFb)}
    ${state.fbGen ? `<div style="margin-top:8px;">${_hsRenderMath(state.fbGen)}</div>` : ''}
  </div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body {
    font-family: -apple-system, Segoe UI, Arial, sans-serif;
    margin: 0;
    padding: 12px 16px;
    color: #1f2937;
    background: #ffffff;
  }
  .hs-preview-header {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .hs-preview-badge {
    background: #2563eb;
    color: #fff;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: .78rem;
    font-weight: 700;
  }
  .hs-preview-note {
    background: #dbeafe;
    color: #1e3a8a;
    border: 1px solid #2563eb;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 600;
  }
  .hs-preview-text { margin-bottom: 14px; }
  .hs-cb-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 0;
    cursor: default;
  }
  [data-ra-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-ra-field]:hover { outline: 2px dashed #2563eb; outline-offset: 2px; }
  .hs-preview-text[data-ra-field]:hover { background: #eff6ff; }
  .hs-cb-row input[type="radio"] {
    margin-top: 3px;
  }
  .hs-cb-text { flex: 1; }
  .hs-validate-btn {
    margin-top: 16px;
    padding: 8px 18px;
    border: none;
    border-radius: 6px;
    background: #9ca3af;
    color: #fff;
    font-weight: 600;
    cursor: not-allowed;
  }
  .hs-fb-section-title {
    margin-top: 22px;
    padding-top: 10px;
    border-top: 1px dashed #cbd5e1;
    font-size: .82rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .02em;
  }
  body.hs-focus-fbgen .hs-main-block { display: none; }
  body.hs-focus-fbgen .hs-fbgen-block .hs-fb-section-title { margin-top: 0; border-top: none; padding-top: 0; }
  body:not(.hs-focus-fbgen) .hs-fbgen-block { display: none; }
</style>
</head>
<body class="${focusFbGen ? 'hs-focus-fbgen' : ''}">
  <div class="hs-preview-header">
    <span class="hs-preview-badge">Bouton radio</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">🔘 Choix unique</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-ra-field="text">${text}</div>
    <div class="hs-cb-list">${propsHTML}</div>
    <button class="hs-validate-btn" disabled>Valider</button>

    <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
    ${fbItemsHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">Feedback général (toujours affiché)</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}


// ══════════════════════════════════════════════════════
//  ÉTAPE 3bis — BRANCHEMENT RADIO (même principe que checkbox)
// ══════════════════════════════════════════════════════
(function () {
  function updateRadioPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'radio') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('ra-preview-container');
    if (!container) return;
    var state = captureState();
    var iframe = mountPreviewIframe('ra-preview-container', renderPreviewHTML_radio(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireRadioPreviewClicks(iframe); });
    }

    var autoPreview = document.getElementById('ra-fbgen-auto-preview');
    if (autoPreview) {
      var allVrais = state.vrais || [];
      var allFaux = state.faux || [];
      var drawn = _raSimulateDraw(allVrais, allFaux, state.xe);
      autoPreview.innerHTML = _raAutoFbGenHTML(drawn.drawnVrai, !!state.fbGenShowFb);
    }
  }
  window.raRefreshPreview = updateRadioPreview;

  function wireRadioPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-ra-field]');
        if (!el) return;
        jumpToRadioField(el.getAttribute('data-ra-field'), el.getAttribute('data-ra-array'), el.getAttribute('data-ra-index'));
      });
    } catch (e) {
      console.error('wireRadioPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function jumpToRadioField(field, arrName, index) {
    function openField(id) {
      var prevEl = document.getElementById('prev-' + id);
      if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof openRich === 'function') openRich(id);
    }

    if (field === 'text') return openField('ra-text');
    if (field === 'fbgen') return openField('ra-fbgen');

    var rows = document.querySelectorAll('#ra-' + arrName + ' .prop-row');
    var row = rows[parseInt(index, 10)];
    if (!row) return;

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('hs-jump-highlight');
    setTimeout(function () { row.classList.remove('hs-jump-highlight'); }, 1200);

    var sel = field === 'prop-fb' ? '.p-fb' : '.p-text';
    var target = row.querySelector(sel);
    if (target && target.id && typeof openRich === 'function') openRich(target.id);
  }

  function wireRadioPreview() {
    var panel = document.getElementById('fp-radio');
    if (!panel) return;

    panel.addEventListener('input', updateRadioPreview);
    panel.addEventListener('change', updateRadioPreview);

    ['ra-vrais', 'ra-faux'].forEach(function (id) {
      var poolContainer = document.getElementById(id);
      if (poolContainer) {
        new MutationObserver(updateRadioPreview)
          .observe(poolContainer, { childList: true, subtree: true });
      }
    });

    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateRadioPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });

    hsRegisterPreviewRefresher(updateRadioPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireRadioPreview);
  } else {
    wireRadioPreview();
  }
})();
