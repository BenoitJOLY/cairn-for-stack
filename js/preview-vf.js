// ══════════════════════════════════════════════════════
//  RENDER : VRAI / FAUX
// ══════════════════════════════════════════════════════
// La vraie tentative Moodle tire Xe propositions (Xb vraies + le reste de
// fausses, ou un tirage aléatoire du nombre de vraies en mode "alea") au
// hasard dans la banque ; ceci n'est qu'UN exemple illustratif (premières
// vraies + premières fausses de la banque, dans l'ordre de saisie).
function _vfSimulateDraw(props, xe, xb, mode) {
  const xeN = parseInt(xe, 10) || 2;
  const vraisBank = props.filter(function (p) { return p.exp !== 'f'; });
  const fauxBank = props.filter(function (p) { return p.exp === 'f'; });
  let nbV;
  if (mode === 'alea') {
    nbV = Math.max(1, xeN - 1);
  } else {
    nbV = Math.max(1, parseInt(xb, 10) || 1);
  }
  nbV = Math.min(nbV, vraisBank.length);
  const nbF = Math.min(Math.max(0, xeN - nbV), fauxBank.length);
  return vraisBank.slice(0, nbV).concat(fauxBank.slice(0, nbF));
}

function _vfAutoFbGenListHTML(drawnProps, showFb) {
  return drawnProps.map(function (p) {
    const isV = p.exp !== 'f';
    const fb = isV ? p.fbIfVrai : p.fbIfFaux;
    return showFb && fb
      ? `<li>${_hsRenderMath(p.text || '')} — <em>${isV ? 'Vrai' : 'Faux'}</em><br/><span style="color:#4b5563;font-size:.92em;">${_hsRenderMath(fb)}</span></li>`
      : `<li>${_hsRenderMath(p.text || '')} — <em>${isV ? 'Vrai' : 'Faux'}</em></li>`;
  }).join('');
}

function renderPreviewHTML_vf(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const props = state.props || [];
  const drawn = _vfSimulateDraw(props, state.xe, state.xb, state.modeXb);
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-vf .mpane.on') && document.querySelector('#fp-vf .mpane.on').id === 'vf-fb-gen'; } catch (e) {}

  const rowsHTML = drawn.map(function (p, i) {
    const isV = p.exp !== 'f';
    const idx = props.indexOf(p);
    return `<tr>
      <td class="hs-vf-td-text hs-clickable" data-vf-field="prop-text" data-vf-index="${idx}">${i + 1}. ${_hsRenderMath(p.text || '')}</td>
      <td class="hs-vf-td-choice">
        <label class="hs-vf-radio"><input type="radio" name="hs-vf-row-${i}" ${isV ? 'checked' : ''}> Vrai</label>
        <label class="hs-vf-radio"><input type="radio" name="hs-vf-row-${i}" ${isV ? '' : 'checked'}> Faux</label>
      </td>
    </tr>`;
  }).join('');

  const fbItemsHTML = drawn.map(function (p, i) {
    const isV = p.exp !== 'f';
    const idx = props.indexOf(p);
    return `<div style="border-left:4px solid #94a3b8;padding:7px;margin:3px 0">
      <b>${i + 1}. ${_hsRenderMath(p.text || '')}</b> <span style="font-size:.78rem;color:#64748b;">(réponse attendue : ${isV ? 'Vrai' : 'Faux'})</span>
      <div class="hs-clickable" data-vf-field="prop-fb-vrai" data-vf-index="${idx}" style="margin-top:5px;">${isV ? '✅' : '❌'} Si coche Vrai : ${p.fbIfVrai ? _hsRenderMath(p.fbIfVrai) : '<span style="color:#94a3b8;">(vide)</span>'}</div>
      <div class="hs-clickable" data-vf-field="prop-fb-faux" data-vf-index="${idx}" style="margin-top:3px;">${isV ? '❌' : '✅'} Si coche Faux : ${p.fbIfFaux ? _hsRenderMath(p.fbIfFaux) : '<span style="color:#94a3b8;">(vide)</span>'}</div>
    </div>`;
  }).join('');

  const autoFbGenList = _vfAutoFbGenListHTML(drawn, !!state.fbGenShowFb);
  const fbGenHTML = `<div class="hs-clickable" data-vf-field="fbgen" style="border-left:4px solid #4f46e5;padding:10px 14px;background:#eef2ff;border-radius:4px;margin:4px 0;">
    <p style="margin:0 0 4px 0;"><strong>Réponses attendues :</strong></p>
    <ul style="margin:4px 0 0 0;padding-left:1.4em;">${autoFbGenList}</ul>
    ${state.fbGen ? `<div style="margin-top:8px;">${_hsRenderMath(state.fbGen)}</div>` : ''}
  </div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 12px 16px; color: #1f2937; background: #ffffff; }
  .hs-preview-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .hs-preview-badge { background: #4f46e5; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: #eef2ff; color: #3730a3; border: 1px solid #4f46e5; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  table.hs-vf-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  .hs-vf-td-text { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  .hs-vf-td-choice { text-align: right; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
  .hs-vf-radio { display: inline-flex; align-items: center; gap: 4px; margin-left: 10px; font-size: .85rem; cursor: pointer; }
  [data-vf-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-vf-field]:hover { outline: 2px dashed #4f46e5; outline-offset: 2px; }
  .hs-preview-text[data-vf-field]:hover { background: #eef2ff; }
  .hs-validate-btn { margin-top: 4px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
  body.hs-focus-fbgen .hs-main-block { display: none; }
  body.hs-focus-fbgen .hs-fbgen-block .hs-fb-section-title { margin-top: 0; border-top: none; padding-top: 0; }
  body:not(.hs-focus-fbgen) .hs-fbgen-block { display: none; }
</style>
</head>
<body class="${focusFbGen ? 'hs-focus-fbgen' : ''}">
  <div class="hs-preview-header">
    <span class="hs-preview-badge">Vrai / Faux</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-vf-field="text">${text}</div>
    <table class="hs-vf-table"><tbody>${rowsHTML}</tbody></table>
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
//  ÉTAPE 3quater — BRANCHEMENT VRAI/FAUX
// ══════════════════════════════════════════════════════
(function () {
  function updateVFPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'vf') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('vf-preview-container');
    if (!container) return;
    var state = captureState();
    var iframe = mountPreviewIframe('vf-preview-container', renderPreviewHTML_vf(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireVFPreviewClicks(iframe); });
    }

    // Reflète la partie auto-générée directement dans l'onglet "Feedback
    // général" du formulaire, comme pour Checkbox/Radio/Dropdown.
    var autoPreview = document.getElementById('vf-fbgen-auto-preview');
    if (autoPreview) {
      var allProps = state.props || [];
      var drawnProps = _vfSimulateDraw(allProps, state.xe, state.xb, state.modeXb);
      var autoList = _vfAutoFbGenListHTML(drawnProps, !!state.fbGenShowFb);
      autoPreview.innerHTML = '<p style="margin:0 0 4px 0;"><strong>Réponses attendues :</strong></p><ul style="margin:4px 0 0 0;padding-left:1.4em;">' + autoList + '</ul>';
    }
  }
  window.vfRefreshPreview = updateVFPreview;

  function wireVFPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-vf-field]');
        if (!el) return;
        jumpToVFField(el.getAttribute('data-vf-field'), el.getAttribute('data-vf-index'));
      });
    } catch (e) {
      console.error('wireVFPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function jumpToVFField(field, index) {
    function openField(id) {
      var prevEl = document.getElementById('prev-' + id);
      if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof openRich === 'function') openRich(id);
    }

    if (field === 'text') return openField('vf-text');
    if (field === 'fbgen') return openField('vf-fbgen');

    var rows = document.querySelectorAll('#vf-props .vf-row');
    var row = rows[parseInt(index, 10)];
    if (!row) return;

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('hs-jump-highlight');
    setTimeout(function () { row.classList.remove('hs-jump-highlight'); }, 1200);

    if (field === 'prop-text') {
      var t = row.querySelector('.vf-ptext');
      if (t && t.id && typeof openRich === 'function') openRich(t.id);
      return;
    }
    if (field === 'prop-fb-vrai' || field === 'prop-fb-faux') {
      var t2 = row.querySelector(field === 'prop-fb-vrai' ? '.vf-fb-ifvrai' : '.vf-fb-iffaux');
      if (t2 && t2.id && typeof openRich === 'function') openRich(t2.id);
    }
  }

  function wireVFPreview() {
    var panel = document.getElementById('fp-vf');
    if (!panel) return;

    panel.addEventListener('input', updateVFPreview);
    panel.addEventListener('change', updateVFPreview);

    var propsContainer = document.getElementById('vf-props');
    if (propsContainer) {
      new MutationObserver(updateVFPreview)
        .observe(propsContainer, { childList: true, subtree: true });
    }

    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateVFPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });

    hsRegisterPreviewRefresher(updateVFPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireVFPreview);
  } else {
    wireVFPreview();
  }
})();
