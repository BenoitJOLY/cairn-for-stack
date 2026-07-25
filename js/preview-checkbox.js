// ══════════════════════════════════════════════════════
//  RENDER : CHECKBOX
// ══════════════════════════════════════════════════════
// Simule un tirage (xe/xb/mode) pour que la preview reflète les paramètres
// de tirage — sans ça, "Nombre de propositions à proposer à l'élève" et
// "Nb bonnes réponses" n'avaient aucun effet visible sur l'aperçu.
// Le vrai tirage Moodle est aléatoire à chaque tentative : ceci n'est
// qu'UN exemple illustratif du nombre de vraies/fausses affichées.
function _cbSimulateDraw(props, xe, xb, mode) {
  const trues = props.filter(function (p) { return p.isV; });
  const falses = props.filter(function (p) { return !p.isV; });
  const xeN = parseInt(xe, 10) || 0;
  let nTrue;
  if (mode === 'alea') {
    nTrue = Math.min(trues.length, Math.max(1, xeN - 1));
  } else {
    nTrue = Math.min(parseInt(xb, 10) || 0, trues.length);
  }
  let nFalse = Math.min(Math.max(0, xeN - nTrue), falses.length);
  return trues.slice(0, nTrue).concat(falses.slice(0, nFalse));
}

// Reprend le comportement réel de STACK (generalFeedback dans genCheckbox) :
// la liste des bonnes réponses tirées est TOUJOURS générée automatiquement,
// le champ "Feedback général" du formulaire ne fait que s'y ajouter.
// Factorisé pour être utilisé à la fois par l'aperçu élève et par l'aperçu
// (lecture seule) affiché directement dans l'onglet du formulaire.
function _cbAutoFbGenListHTML(drawnProps, showFb) {
  return drawnProps.filter(function (p) { return p.isV; }).map(function (p) {
    return showFb && p.fb
      ? `<li>${_hsRenderMath(p.text || '')}<br/><span style="color:#4b5563;font-size:.92em;">${_hsRenderMath(p.fb)}</span></li>`
      : `<li>${_hsRenderMath(p.text || '')}</li>`;
  }).join('');
}

function renderPreviewHTML_checkbox(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const allProps = state.props || [];
  const showOubli = !!state.showOubli;
  const drawnProps = _cbSimulateDraw(allProps, state.xe, state.xb, state.mXb);
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-checkbox .mpane.on') && document.querySelector('#fp-checkbox .mpane.on').id === 'cb-fb-gen'; } catch (e) {}

  // data-cb-index conserve l'index dans allProps (pas dans le sous-ensemble
  // tiré), pour retrouver la bonne ligne #cb-props même après le tirage.
  const propsHTML = drawnProps.map(function (p) {
    const idx = allProps.indexOf(p);
    return `
      <label class="hs-cb-row" data-cb-field="prop-text" data-cb-index="${idx}">
        <input type="checkbox" disabled>
        <span class="hs-cb-text">${_hsRenderMath(p.text || '')}</span>
      </label>`;
  }).join('');

  // Reprend exactement la présentation utilisée en production (wrapFb() et
  // les blocs fbl${X}/fbl_oubli${X} de genCheckbox dans generators.js),
  // pour que l'enseignant retrouve le même rendu visuel qu'aujourd'hui.
  const fbGlobalHTML = `
    <div data-cb-field="fbc">${wrapFb(_hsRenderMath(state.fbc || ''), true)}</div>
    <div data-cb-field="fbe">${wrapFb(_hsRenderMath(state.fbe || ''), false)}</div>`;

  const autoFbGenList = _cbAutoFbGenListHTML(drawnProps, !!state.fbGenShowFb);
  const fbGenHTML = `<div class="hs-clickable" data-cb-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">
    <p style="margin:0 0 4px 0;"><strong>${I18N.t('tpl.checkbox_bonnes_reponses')}</strong></p>
    <ul style="margin:4px 0 0 0;padding-left:1.4em;">${autoFbGenList}</ul>
    ${state.fbGen ? `<div style="margin-top:8px;">${_hsRenderMath(state.fbGen)}</div>` : ''}
  </div>`;

  const fbItemsHTML = drawnProps.map(function (p) {
    const idx = allProps.indexOf(p);
    const col = p.isV ? 'green' : 'red';
    return `<div class="hs-clickable" data-cb-field="prop-fb" data-cb-index="${idx}" style="color:${col};border-left:4px solid ${col};padding:7px;margin:3px 0">
      <b>${_hsRenderMath(p.text || '')}</b><br/>${_hsRenderMath(p.fb || '')}
    </div>`;
  }).join('');

  const fbOubliHTML = showOubli
    ? drawnProps.filter(function (p) { return p.isV; }).map(function (p) {
        const idx = allProps.indexOf(p);
        return `<div class="hs-clickable" data-cb-field="prop-fb2" data-cb-index="${idx}" style="color:#92400e;background:#fffbeb;border-left:4px solid #f59e0b;padding:7px;margin:3px 0">
          <b>&#9888;&#65039; Oubli : </b>${_hsRenderMath(p.text || '')}<br/>${_hsRenderMath(p.fb2 || '')}
        </div>`;
      }).join('')
    : '';

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
    background: #7c3aed;
    color: #fff;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: .78rem;
    font-weight: 700;
  }
  .hs-preview-note {
    background: #ede9fe;
    color: #4c1d95;
    border: 1px solid #7c3aed;
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
  [data-cb-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-cb-field]:hover { outline: 2px dashed #7c3aed; outline-offset: 2px; }
  .hs-preview-text[data-cb-field]:hover { background: #f5f3ff; }
  .hs-cb-row input[type="checkbox"] {
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
    <span class="hs-preview-badge">${I18N.t('type.checkbox')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${I18N.t('tpl.checkbox_plusieurs_choix')}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-cb-field="text">${text}</div>
    <div class="hs-cb-list">${propsHTML}</div>
    <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

    <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
    ${fbItemsHTML}
    ${fbOubliHTML}
    ${fbGlobalHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">${I18N.t('common.preview_fbgen_always_title')}</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}


// ══════════════════════════════════════════════════════
//  ÉTAPE 3 — BRANCHEMENT AU FORMULAIRE EXISTANT (additif uniquement)
//  N'édite aucune fonction existante : écoute les mêmes éléments DOM
//  et surcharge setRichVal() pour se déclencher aussi sur les champs
//  riches (texte / feedbacks), qui ne déclenchent pas d'événement input.
// ══════════════════════════════════════════════════════
(function () {
  function updateCheckboxPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'checkbox') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('cb-preview-container');
    if (!container) return;
    var state = captureState();
    var iframe = mountPreviewIframe('cb-preview-container', renderPreviewHTML_checkbox(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireCheckboxPreviewClicks(iframe); });
    }

    // Reflète la partie auto-générée directement dans l'onglet "Feedback
    // général" du formulaire (zone de saisie), pas seulement dans l'aperçu
    // élève, pour que l'enseignant comprenne ce qui est fixe vs éditable.
    var autoPreview = document.getElementById('cb-fbgen-auto-preview');
    if (autoPreview) {
      var allProps = state.props || [];
      var drawnProps = _cbSimulateDraw(allProps, state.xe, state.xb, state.mXb);
      var autoList = _cbAutoFbGenListHTML(drawnProps, !!state.fbGenShowFb);
      autoPreview.innerHTML = '<p style="margin:0 0 4px 0;"><strong>' + I18N.t('tpl.checkbox_bonnes_reponses') + '</strong></p><ul style="margin:4px 0 0 0;padding-left:1.4em;">' + autoList + '</ul>';
    }
  }
  window.cbRefreshPreview = updateCheckboxPreview;

  // Clic sur un élément de la prévisualisation (data-cb-field) → on va
  // directement au champ correspondant dans le formulaire. Le listener est
  // posé côté page principale sur le document de l'iframe (autorisé grâce à
  // sandbox="allow-same-origin") : aucun script ne s'exécute dans l'iframe.
  function wireCheckboxPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-cb-field]');
        if (!el) return;
        jumpToCheckboxField(el.getAttribute('data-cb-field'), el.getAttribute('data-cb-index'));
      });
    } catch (e) {
      console.error('wireCheckboxPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function jumpToCheckboxField(field, index) {
    function openField(id) {
      var prevEl = document.getElementById('prev-' + id);
      if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof openRich === 'function') openRich(id);
    }

    if (field === 'text') return openField('cb-text');
    if (field === 'fbc') return openField('cb-fbc');
    if (field === 'fbe') return openField('cb-fbe');
    if (field === 'fbgen') return openField('cb-fbgen');

    var rows = document.querySelectorAll('#cb-props .prop-row');
    var row = rows[parseInt(index, 10)];
    if (!row) return;

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('hs-jump-highlight');
    setTimeout(function () { row.classList.remove('hs-jump-highlight'); }, 1200);

    var sel = field === 'prop-fb' ? '.p-fb' : (field === 'prop-fb2' ? '.p-fb2' : '.p-text');
    var target = row.querySelector(sel);
    if (target && target.id && typeof openRich === 'function') openRich(target.id);
  }

  function wireCheckboxPreview() {
    var panel = document.getElementById('fp-checkbox');
    if (!panel) return;

    // Saisies "normales" (barème, xe, xb, mode de tirage, case oubli...)
    panel.addEventListener('input', updateCheckboxPreview);
    panel.addEventListener('change', updateCheckboxPreview);

    // Ajout/suppression de lignes de proposition (fait par prop-rows.js,
    // non modifié : on observe simplement le résultat dans le DOM)
    var propsContainer = document.getElementById('cb-props');
    if (propsContainer) {
      new MutationObserver(updateCheckboxPreview)
        .observe(propsContainer, { childList: true, subtree: true });
    }

    // Ouverture du panneau checkbox (openConfigPanel bascule fp.style.display)
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateCheckboxPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });

    // Champs riches (cb-text, cb-fbc, cb-fbe, textes/feedbacks de propositions) :
    // setRichVal() ne déclenche aucun événement DOM standard, on la surcharge
    // sans toucher à rich.js. Partagée avec les autres types via
    // window.__hsPreviewRefreshers (voir wireRadioPreview plus bas).
    hsRegisterPreviewRefresher(updateCheckboxPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireCheckboxPreview);
  } else {
    wireCheckboxPreview();
  }
})();
