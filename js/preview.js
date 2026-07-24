// ── PREVIEW MODULE (Étape 2) ─────────────────────────────────────
// Génère une prévisualisation HTML "faux STACK" à partir de state (JSON),
// affichée dans une iframe sandboxée via srcdoc. Ne touche jamais au XML.

// ══════════════════════════════════════════════════════
//  IFRAME MOUNTING
// ══════════════════════════════════════════════════════
function mountPreviewIframe(containerId, htmlString) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('mountPreviewIframe: conteneur introuvable :', containerId);
    return null;
  }

  let iframe = container.querySelector('iframe.hs-preview-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.className = 'hs-preview-iframe';
    iframe.setAttribute('sandbox', 'allow-same-origin');
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(iframe);
  }

  iframe.onload = function () {
    try {
      const doc = iframe.contentWindow.document;
      const h = doc.body ? doc.body.scrollHeight : 0;
      iframe.style.height = h + 'px';
    } catch (e) {
      console.error('mountPreviewIframe: impossible de mesurer le contenu :', e);
    }
  };

  iframe.srcdoc = htmlString;
  return iframe;
}

// Variante autorisant l'exécution de <script> dans l'iframe (nécessaire pour rejouer
// un vrai board JSXGraph en aperçu local). Réservée aux types qui en ont besoin
// (contenu toujours auteur/enseignant, jamais de saisie élève) — ne pas généraliser
// à mountPreviewIframe() qui reste volontairement non-scriptable par défaut.
function mountPreviewIframeScripted(containerId, htmlString) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('mountPreviewIframeScripted: conteneur introuvable :', containerId);
    return null;
  }

  let iframe = container.querySelector('iframe.hs-preview-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.className = 'hs-preview-iframe';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(iframe);
  }

  iframe.onload = function () {
    try {
      const doc = iframe.contentWindow.document;
      const h = doc.body ? doc.body.scrollHeight : 0;
      iframe.style.height = h + 'px';
    } catch (e) {
      console.error('mountPreviewIframeScripted: impossible de mesurer le contenu :', e);
    }
  };

  iframe.srcdoc = htmlString;
  return iframe;
}

// ══════════════════════════════════════════════════════
//  RENDU KATEX
// ══════════════════════════════════════════════════════
// Les champs riches stockent le LaTeX au format Moodle \(...\) / \[...\]
// (voir spansToLatex() dans rich.js) — c'est ce format brut, pas du HTML
// pré-rendu, que renvoie richVal()/captureState(). L'iframe de prévisualisation
// est sandboxée SANS allow-scripts : KaTeX ne peut pas s'y exécuter. On rend
// donc les formules ici, côté page principale (où katex.min.js tourne), et on
// injecte le HTML déjà rendu dans le srcdoc.
// PRT séquentiel (cf. _probSeqNode et équivalents par type) : le nœud [0] est le test
// "réponse correcte", le nœud final est le fallback générique qui reçoit tout le reste
// (mauvaise réponse). Chaque nœud porte déjà son vrai feedback figé (truefeedback) —
// celui-ci VAUT DÉJÀ soit le texte personnalisé de l'enseignant, soit la correction
// par défaut du générateur (formule) si l'enseignant n'a rien tapé, car c'est le
// générateur lui-même qui fait ce choix (`fbOk || _probBox(...)`) avant de construire
// les nœuds. Donc afficher nodes[0].truefeedback / nodes[last].truefeedback dans
// l'aperçu Config, précédé de leur description, montre exactement ce que Moodle
// affichera — au lieu du texte générique fixe qu'on utilisait avant ("✅ Bonne
// réponse !"/"❌ Réponse incorrecte.") qui masquait la vraie correction dès que
// l'enseignant laissait les champs Feedback Juste/Faux vides (cas le plus fréquent).
function _hsPrtBoxes(realParts) {
  var nodes = (realParts && realParts.prt && realParts.prt.nodes) || [];
  if (!nodes.length) return { okDesc: '', wrongDesc: '', okFb: '', wrongFb: '' };
  var first = nodes[0], last = nodes[nodes.length - 1];
  // Le nœud "sinon" (true=true, fallback générique) existe soit comme nœud STACK
  // séparé (last.truefeedback, style pas encore optimisé), soit replié dans la branche
  // falsefeedback du dernier nœud de test réel (cf. _probSeqPrt) : on détecte le cas.
  var isSeparateFallback = last.sans === 'true' && last.tans === 'true';
  return {
    okDesc: first.description || '',
    wrongDesc: isSeparateFallback ? (last.description || '') : 'Sinon (toute autre réponse)',
    okFb: first.truefeedback || '',
    wrongFb: (isSeparateFallback ? last.truefeedback : last.falsefeedback) || ''
  };
}

function _hsRenderMath(html) {
  if (!html) return html;
  if (typeof katex === 'undefined') return html;
  function renderOne(formula, displayMode) {
    try { return katex.renderToString(formula, { throwOnError: false, displayMode: displayMode }); }
    catch (e) { return formula; }
  }
  return String(html)
    .replace(/\\\[(.+?)\\\]/gs, function (_, f) { return renderOne(f, true); })
    .replace(/\\\((.+?)\\\)/gs, function (_, f) { return renderOne(f, false); });
}

// Réponses formelles (algébrique, numérique...) sont saisies en syntaxe Maxima
// (ex: 4*(x-1)^2), pas en LaTeX : on les convertit avant rendu KaTeX.
function _hsMaximaToLatexSafe(expr) {
  try { return (typeof maximaToLatex === 'function') ? maximaToLatex(expr) : expr; }
  catch (e) { return expr; }
}

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
    <p style="margin:0 0 4px 0;"><strong>Les bonnes réponses étaient :</strong></p>
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
    <span class="hs-preview-badge">Cases à cocher</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">☑️ Plusieurs choix possibles</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-cb-field="text">${text}</div>
    <div class="hs-cb-list">${propsHTML}</div>
    <button class="hs-validate-btn" disabled>Valider</button>

    <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
    ${fbItemsHTML}
    ${fbOubliHTML}
    ${fbGlobalHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">Feedback général (toujours affiché)</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════
//  RENDER : RADIO
// ══════════════════════════════════════════════════════
// La vraie tentative Moodle tire 1 vrai + (Xe-1) faux au hasard dans les
// pools ; ceci n'est qu'UN exemple illustratif (premier vrai + premiers faux)
// pour que l'aperçu réagisse au réglage "Nb total de boutons affichés".
function _raSimulateDraw(vrais, faux, xe) {
  const xeN = parseInt(xe, 10) || 2;
  const drawnVrai = vrais.length ? vrais[0] : null;
  const nFaux = Math.max(0, xeN - 1);
  const drawnFaux = faux.slice(0, nFaux);
  return { drawnVrai, drawnFaux };
}

// Reprend le comportement réel de STACK (generalFeedback dans genPool) :
// la bonne réponse + son feedback sont TOUJOURS affichés automatiquement,
// le champ "Feedback général" du formulaire ne fait que s'y ajouter.
function _raAutoFbGenHTML(drawnVrai, showFb) {
  if (!drawnVrai) return '<p style="margin:0;color:#94a3b8;">(aucune bonne réponse définie)</p>';
  return `<p style="margin:0 0 4px 0;"><strong>La bonne réponse était :</strong> ${_hsRenderMath(drawnVrai.text || '')}</p>
    ${showFb && drawnVrai.fb ? `<p style="margin:0;">${_hsRenderMath(drawnVrai.fb)}</p>` : ''}`;
}

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

function renderPreviewHTML_dropdown(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const allVrais = state.vrais || [];
  const allFaux = state.faux || [];
  const { drawnVrai, drawnFaux } = _raSimulateDraw(allVrais, allFaux, state.xe);
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-dropdown .mpane.on') && document.querySelector('#fp-dropdown .mpane.on').id === 'dd-fb-gen'; } catch (e) {}

  const options = [];
  if (drawnVrai) options.push({ p: drawnVrai, arr: 'vrais', idx: 0, isV: true });
  drawnFaux.forEach(function (p, i) { options.push({ p: p, arr: 'faux', idx: i, isV: false }); });

  // Un vrai <select>/<option> natif ne peut afficher que du texte brut (le
  // HTML/KaTeX y est ignoré par le navigateur). On utilise donc <details>/
  // <summary> : ouverture/fermeture 100% native (aucun script requis dans
  // l'iframe), mais le contenu des options reste du HTML normal, ce qui
  // permet le rendu KaTeX des formules.
  const selectOptionsHTML = options.map(function (o) {
    return `<div class="hs-dd-option" data-dd-array="${o.arr}" data-dd-index="${o.idx}">${_hsRenderMath(o.p.text || '')}</div>`;
  }).join('');

  const fbItemsHTML = options.map(function (o) {
    const col = o.isV ? 'green' : 'red';
    return `<div class="hs-clickable" data-dd-field="prop-fb" data-dd-array="${o.arr}" data-dd-index="${o.idx}" style="color:${col};border-left:4px solid ${col};padding:7px;margin:3px 0">
      <b>${_hsRenderMath(o.p.text || '')}</b><br/>${_hsRenderMath(o.p.fb || '')}
    </div>`;
  }).join('');

  const fbGenHTML = `<div class="hs-clickable" data-dd-field="fbgen" style="border-left:4px solid #db2877;padding:10px 14px;background:#fdf2f8;border-radius:4px;margin:4px 0;">
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
    background: #db2877;
    color: #fff;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: .78rem;
    font-weight: 700;
  }
  .hs-preview-note {
    background: #fce7f3;
    color: #831843;
    border: 1px solid #db2877;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 600;
  }
  .hs-preview-text { margin-bottom: 14px; }
  .hs-dd-select {
    position: relative;
    display: block;
    width: 100%;
    margin-bottom: 14px;
  }
  .hs-dd-select > summary {
    list-style: none;
    padding: 7px 28px 7px 10px;
    border: 1.5px solid #db2877;
    border-radius: 6px;
    background: #fff;
    color: #1f2937;
    font-size: .88rem;
    cursor: pointer;
    position: relative;
  }
  .hs-dd-select > summary::-webkit-details-marker { display: none; }
  .hs-dd-select > summary::after {
    content: "▾";
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #db2877;
  }
  .hs-dd-select[open] > summary::after { content: "▴"; }
  .hs-dd-options {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 100%;
    background: #fff;
    border: 1.5px solid #db2877;
    border-radius: 6px;
    box-shadow: 0 4px 14px rgba(0,0,0,.12);
    z-index: 20;
    max-height: 320px;
    overflow-y: auto;
  }
  .hs-dd-option {
    padding: 9px 12px;
    font-size: .92rem;
    line-height: 1.5;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
  }
  .hs-dd-option:last-child { border-bottom: none; }
  .hs-dd-option:hover { background: #fdf2f8; }
  [data-dd-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-dd-field]:hover { outline: 2px dashed #db2877; outline-offset: 2px; }
  .hs-preview-text[data-dd-field]:hover { background: #fdf2f8; }
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
    <span class="hs-preview-badge">Menu déroulant</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">📋 Choix dans une liste</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-dd-field="text">${text}</div>
    <details class="hs-dd-select">
      <summary>-- Choisir --</summary>
      <div class="hs-dd-options">${selectOptionsHTML}</div>
    </details>
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
      autoPreview.innerHTML = '<p style="margin:0 0 4px 0;"><strong>Les bonnes réponses étaient :</strong></p><ul style="margin:4px 0 0 0;padding-left:1.4em;">' + autoList + '</ul>';
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

// Enregistre une fonction de rafraîchissement d'aperçu à appeler chaque fois
// que setRichVal() est utilisé (champs riches, qui ne déclenchent aucun
// événement DOM standard). Un seul wrapper est posé sur setRichVal, partagé
// par tous les types de questions (checkbox, radio, ...).
function hsRegisterPreviewRefresher(fn) {
  if (!window.__hsPreviewRefreshers) window.__hsPreviewRefreshers = [];
  window.__hsPreviewRefreshers.push(fn);
  if (typeof window.setRichVal === 'function' && !window.setRichVal.__hsPreviewWrapped) {
    var originalSetRichVal = window.setRichVal;
    var wrapped = function (id, html) {
      var result = originalSetRichVal(id, html);
      window.__hsPreviewRefreshers.forEach(function (refresher) { refresher(); });
      return result;
    };
    wrapped.__hsPreviewWrapped = true;
    window.setRichVal = wrapped;
  }
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

// ══════════════════════════════════════════════════════
//  ÉTAPE 3ter — BRANCHEMENT DROPDOWN (même principe que radio)
// ══════════════════════════════════════════════════════
(function () {
  function updateDropdownPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'dropdown') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('dd-preview-container');
    if (!container) return;
    var state = captureState();
    var iframe = mountPreviewIframe('dd-preview-container', renderPreviewHTML_dropdown(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireDropdownPreviewClicks(iframe); });
    }

    var autoPreview = document.getElementById('dd-fbgen-auto-preview');
    if (autoPreview) {
      var allVrais = state.vrais || [];
      var allFaux = state.faux || [];
      var drawn = _raSimulateDraw(allVrais, allFaux, state.xe);
      autoPreview.innerHTML = _raAutoFbGenHTML(drawn.drawnVrai, !!state.fbGenShowFb);
    }
  }
  window.ddRefreshPreview = updateDropdownPreview;

  function wireDropdownPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      // Le menu <details>/<summary> est un vrai composant interactif natif
      // (ouverture/fermeture sans script), qui a l'avantage — contrairement à
      // <select>/<option> — d'accepter du HTML normal dans ses options, donc
      // le rendu KaTeX des formules y fonctionne. On laisse le clic sur le
      // <summary> gérer nativement l'ouverture/fermeture, et on intercepte le
      // clic sur une option pour : afficher son texte dans le résumé, refermer
      // le menu, et amener l'enseignant au champ texte de cette proposition.
      doc.addEventListener('click', function (e) {
        var opt = e.target.closest('.hs-dd-option');
        if (opt) {
          var details = opt.closest('details.hs-dd-select');
          var summary = details && details.querySelector('summary');
          if (summary) summary.innerHTML = opt.innerHTML;
          if (details) details.open = false;
          jumpToDropdownField('prop-text', opt.getAttribute('data-dd-array'), opt.getAttribute('data-dd-index'));
          return;
        }
        var el = e.target.closest('[data-dd-field]');
        if (!el) return;
        jumpToDropdownField(el.getAttribute('data-dd-field'), el.getAttribute('data-dd-array'), el.getAttribute('data-dd-index'));
      });
    } catch (e) {
      console.error('wireDropdownPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function jumpToDropdownField(field, arrName, index) {
    function openField(id) {
      var prevEl = document.getElementById('prev-' + id);
      if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof openRich === 'function') openRich(id);
    }

    if (field === 'text') return openField('dd-text');
    if (field === 'fbgen') return openField('dd-fbgen');

    var rows = document.querySelectorAll('#dd-' + arrName + ' .prop-row');
    var row = rows[parseInt(index, 10)];
    if (!row) return;

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('hs-jump-highlight');
    setTimeout(function () { row.classList.remove('hs-jump-highlight'); }, 1200);

    var sel = field === 'prop-fb' ? '.p-fb' : '.p-text';
    var target = row.querySelector(sel);
    if (target && target.id && typeof openRich === 'function') openRich(target.id);
  }

  function wireDropdownPreview() {
    var panel = document.getElementById('fp-dropdown');
    if (!panel) return;

    panel.addEventListener('input', updateDropdownPreview);
    panel.addEventListener('change', updateDropdownPreview);

    ['dd-vrais', 'dd-faux'].forEach(function (id) {
      var poolContainer = document.getElementById(id);
      if (poolContainer) {
        new MutationObserver(updateDropdownPreview)
          .observe(poolContainer, { childList: true, subtree: true });
      }
    });

    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateDropdownPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });

    hsRegisterPreviewRefresher(updateDropdownPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireDropdownPreview);
  } else {
    wireDropdownPreview();
  }
})();

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
  const text = _hsRenderMath(state.text || '');
  const tolLabel = state.tolType === 'absolute' ? 'Absolue (NumAbsolute)' : 'Relative (NumRelative)';
  const tolVal = state.tolVal || '0.05';

  const aideOn = !!state.aideOn;
  let aideHTML = '';
  try { if (aideOn && typeof buildNumHelp === 'function') aideHTML = buildNumHelp(); } catch (e) {}
  let kbdOn = false;
  try { kbdOn = aideOn && !!document.getElementById('num-h-kbd')?.checked; } catch (e) {}

  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-numerical .mpane.on') && document.querySelector('#fp-numerical .mpane.on').id === 'num-fb-gen'; } catch (e) {}

  const fbGlobalHTML = `
    <div data-num-field="fbc">${wrapFb(_hsRenderMath(state.fbc || FB_JUSTE_DEFAULT), true)}</div>
    <div data-num-field="fbe">${wrapFb(_hsRenderMath(state.fbe || FB_FAUX_DEFAULT), false)}</div>`;

  const tolNumeric = _hsNumToleranceValue(state.val, state.tolType, tolVal);
  const tolDisplay = `± ${tolNumeric}`;
  const fbGenHTML = `<div class="hs-clickable" data-num-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">
    <p style="margin:0 0 4px 0;"><strong>Valeur acceptée :</strong> <code>${state.val || '—'} ${tolDisplay}</code> <span style="color:#64748b;">(tolérance ${tolLabel})</span></p>
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
    <span class="hs-preview-badge">Numérique</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">Tolérance ${tolLabel} ± ${_hsNumToleranceValue(state.val, state.tolType, tolVal)}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-num-field="text">${text}</div>
    <div data-num-field="help">${aideHTML ? `<div class="hs-alg-help">${aideHTML}</div>` : ''}${kbdOn ? '<div class="hs-alg-help" style="color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe;">⌨️ Clavier virtuel Maxima inclus dans la question.</div>' : ''}</div>
    <input class="hs-num-input" type="text" disabled placeholder="Réponse de l'élève…">
    <button class="hs-validate-btn" disabled>Valider</button>

    <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
    ${fbGlobalHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">Feedback général (toujours affiché)</div>
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
    var iframe = mountPreviewIframe('num-preview-container', renderPreviewHTML_numerical(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireNumPreviewClicks(iframe); });
    }

    var autoPreview = document.getElementById('num-fbgen-auto-preview');
    if (autoPreview) {
      var tolLabel = state.tolType === 'absolute' ? 'Absolue (NumAbsolute)' : 'Relative (NumRelative)';
      var tolVal = state.tolVal || '0.05';
      var tolNumeric = _hsNumToleranceValue(state.val, state.tolType, tolVal);
      autoPreview.innerHTML = '<p style="margin:0;"><strong>Valeur acceptée :</strong> <code>' + (state.val || '—') + ' ± ' + tolNumeric + '</code> <span style="color:#64748b;">(tolérance ' + tolLabel + ')</span></p>';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireNumPreview);
  } else {
    wireNumPreview();
  }
})();

// ══════════════════════════════════════════════════════
//  RENDER : UNITS (champ unique + unité)
// ══════════════════════════════════════════════════════
function renderPreviewHTML_units(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  let aideHTML = '';
  try { if (typeof buildUnHelp === 'function') aideHTML = buildUnHelp(); } catch (e) {}
  const kbdOn = (function () { try { return !!document.getElementById('un-h-kbd')?.checked; } catch (e) { return false; } })();
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-units .mpane.on') && document.querySelector('#fp-units .mpane.on').id === 'un-fb-gen'; } catch (e) {}

  const fbGenHTML = `<div class="hs-clickable" data-un-field="fbgen" style="border-left:4px solid #b45309;padding:10px 14px;background:#fffbeb;border-radius:4px;margin:4px 0;">
    <p style="margin:0 0 4px 0;"><strong>Valeur attendue :</strong> <code>${state.val || '—'} ${state.unit || ''}</code></p>
    ${state.fbGen ? `<div style="margin-top:8px;">${_hsRenderMath(state.fbGen)}</div>` : ''}
  </div>`;

  const fbGlobalHTML = `
    <div data-un-field="fbc">${wrapFb(_hsRenderMath(state.fbc || ''), true)}</div>
    <div data-un-field="fbe">${wrapFb(_hsRenderMath(state.fbe || ''), false)}</div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 12px 16px; color: #1f2937; background: #ffffff; }
  .hs-preview-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .hs-preview-badge { background: #b45309; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: #fffbeb; color: #b45309; border: 1px solid #b45309; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  [data-un-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-un-field]:hover { outline: 2px dashed #b45309; outline-offset: 2px; }
  .hs-preview-text[data-un-field]:hover { background: #fffbeb; }
  .hs-un-input { width: 220px; padding: 6px 10px; border: 1px solid #94a3b8; border-radius: 5px; font-size: .95rem; background: #f8fafc; color: #94a3b8; }
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
    <span class="hs-preview-badge">Unité</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-un-field="text">${text}</div>
    ${aideHTML ? `<div class="hs-alg-help">${aideHTML}</div>` : ''}
    ${kbdOn ? '<div class="hs-alg-help" style="color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe;">⌨️ Clavier virtuel Maxima inclus dans la question.</div>' : ''}
    <input class="hs-un-input" type="text" disabled placeholder="ex : 9.81*m/s^2">
    <button class="hs-validate-btn" disabled>Valider</button>

    <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
    ${fbGlobalHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">Feedback général (toujours affiché)</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}

(function () {
  function updateUnFullPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'units') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('un-preview-container');
    if (!container) return;
    var state = captureState();
    var iframe = mountPreviewIframe('un-preview-container', renderPreviewHTML_units(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireUnPreviewClicks(iframe); });
    }
  }
  window.unRefreshPreview = updateUnFullPreview;

  function wireUnPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-un-field]');
        if (!el) return;
        var field = el.getAttribute('data-un-field');
        function openField(id) {
          var prevEl = document.getElementById('prev-' + id);
          if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof openRich === 'function') openRich(id);
        }
        if (field === 'text') return openField('un-text');
        if (field === 'fbc') return openField('un-fbc');
        if (field === 'fbe') return openField('un-fbe');
        if (field === 'fbgen') return openField('un-fbgen');
      });
    } catch (e) {
      console.error('wireUnPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function wireUnPreview() {
    var panel = document.getElementById('fp-units');
    if (!panel) return;
    panel.addEventListener('input', updateUnFullPreview);
    panel.addEventListener('change', updateUnFullPreview);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateUnFullPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });
    hsRegisterPreviewRefresher(updateUnFullPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireUnPreview);
  } else {
    wireUnPreview();
  }
})();

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

// ══════════════════════════════════════════════════════
//  RENDER : MATCH (relier) — représentation statique
// ══════════════════════════════════════════════════════
// La vraie question Moodle utilise JSXGraph (glisser des liaisons, JS actif) :
// l'iframe étant sandboxée SANS allow-scripts, on ne peut pas rejouer ce
// widget interactif. On affiche donc les deux colonnes + la liste des
// liaisons attendues, en lecture seule, comme pour les cases/radios désactivés.
function renderPreviewHTML_match(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const left = state.left || [];
  const right = state.right || [];
  const connections = state.connections || [];
  const nodeDesc = 'Liaisons correctes ?';

  const colHTML = function (items, field) {
    return items.map(function (it, i) {
      return `<div class="hs-clickable hs-match-item" data-match-field="${field}" data-match-index="${i}">${_hsRenderMath(it.html || '')}</div>`;
    }).join('');
  };

  const connHTML = connections.map(function (c) {
    const l = left[c.l] ? _hsRenderMath(left[c.l].html || '') : '?';
    const r = right[c.r] ? _hsRenderMath(right[c.r].html || '') : '?';
    return `<li>${l} <span style="color:#7c3aed;">↔</span> ${r}</li>`;
  }).join('');

  const fbGenTab = document.getElementById('match-fb-gen');
  const onlyFbGen = !!(fbGenTab && fbGenTab.classList.contains('on'));

  const fbGenBody = `<p style="color:#166534;font-weight:bold;margin-top:0;">📋 Correction :</p>
  <ul class="hs-match-conn-list">${connHTML || '<li style="color:#94a3b8;">(aucune liaison définie)</li>'}</ul>
  ${state.fbGen ? '<p>' + _hsRenderMath(state.fbGen) + '</p>' : ''}`;

  const bodyHTML = onlyFbGen ? `
  <div class="hs-fb-section-title">Feedback général (solution + commentaire complémentaire)</div>
  <div class="hs-clickable" data-match-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">${fbGenBody}</div>` : `
  <div class="hs-preview-text" data-match-field="text">${text}</div>
  <div class="hs-match-cols">
    <div class="hs-match-col">${colHTML(left, 'left')}</div>
    <div class="hs-match-col">${colHTML(right, 'right')}</div>
  </div>
  <button class="hs-validate-btn" disabled>Répondre…</button>

  <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
  <div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${nodeDesc}</div>
  <div style="border-left:4px solid #16a34a;padding:8px 12px;background:#f0fdf4;border-radius:4px;margin-bottom:8px;color:#166534;"><strong>Excellent !</strong> Vous avez trouvé les <em>{@nb_bons@}</em> liaisons correctes.</div>
  <div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${nodeDesc}</div>
  <div style="border-left:4px solid #f59e0b;padding:8px 12px;background:#fffbeb;border-radius:4px;color:#92400e;"><strong>Résultat :</strong> Vous avez trouvé <em>{@nb_bons@}</em> bonne(s) liaison(s) sur <em>{@total@}</em>.<br><span style="font-size:.85rem;">Vos erreurs (liaisons incorrectes) : <em>{@faux_feedback_str@}</em></span></div>`;

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
  [data-match-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-match-field]:hover { outline: 2px dashed #7c3aed; outline-offset: 2px; }
  .hs-preview-text[data-match-field]:hover { background: #f5f3ff; }
  .hs-match-cols { display: flex; gap: 20px; }
  .hs-match-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .hs-match-item { border: 2px solid #c4b5fd; background: #faf5ff; color: #4c1d95; border-radius: 8px; padding: 8px 10px; font-size: .85rem; font-weight: 600; text-align: center; overflow-wrap: break-word; word-break: break-word; }
  .hs-match-item[data-match-field="right"] { border-color: #fca5a5; background: #fff5f5; color: #991b1b; }
  .hs-match-item { max-width: 100%; overflow-x: auto; }
  .hs-validate-btn { margin-top: 12px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
  .hs-match-conn-list { margin: 4px 0 0 0; padding-left: 1.4em; }
</style>
</head>
<body>
  <div class="hs-preview-header">
    <span class="hs-preview-badge">Relier</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    ${onlyFbGen ? '' : '<span class="hs-preview-note">⚠️ Widget interactif JSXGraph non rejouable ici</span>'}
  </div>
  ${bodyHTML}
</body>
</html>`;
}

(function () {
  function updateMatchFullPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'match') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('match-preview-container');
    if (!container) return;
    var state = captureState();
    var iframe = mountPreviewIframe('match-preview-container', renderPreviewHTML_match(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireMatchPreviewClicks(iframe); });
    }
  }
  window.matchRefreshPreview = updateMatchFullPreview;

  function wireMatchPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-match-field]');
        if (!el) return;
        var field = el.getAttribute('data-match-field');
        if (field === 'text') {
          var prevEl = document.getElementById('prev-match-text');
          if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof openRich === 'function') openRich('match-text');
          return;
        }
        var listId = field === 'left' ? 'match-list-left' : 'match-list-right';
        var listEl = document.getElementById(listId);
        if (listEl) listEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch (e) {
      console.error('wireMatchPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function wireMatchPreview() {
    var panel = document.getElementById('fp-match');
    if (!panel) return;
    panel.addEventListener('input', updateMatchFullPreview);
    panel.addEventListener('change', updateMatchFullPreview);

    ['match-list-left', 'match-list-right', 'match-connections'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) new MutationObserver(updateMatchFullPreview).observe(el, { childList: true, subtree: true });
    });

    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateMatchFullPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });

    hsRegisterPreviewRefresher(updateMatchFullPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireMatchPreview);
  } else {
    wireMatchPreview();
  }
})();

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
    return '<p>\\(|z|=\\) <input class="hs-cpx-input" type="text" disabled></p>'
         + '<p>\\(\\arg(z)=\\) <input class="hs-cpx-input" type="text" disabled></p>';
  }
  if (scenario === 'equation-2deg') {
    return '<p>\\(z_1=\\) <input class="hs-cpx-input" type="text" disabled></p>'
         + '<p>\\(z_2=\\) <input class="hs-cpx-input" type="text" disabled></p>';
  }
  if (scenario === 'affixes') {
    return '<p>\\(z_I=\\) <input class="hs-cpx-input" type="text" disabled></p>'
         + '<p>\\(AB=\\) <input class="hs-cpx-input" type="text" disabled></p>';
  }
  if (scenario === 'conjugue') {
    return '<p>\\(\\bar{z}=\\) <input class="hs-cpx-input" type="text" disabled></p>';
  }
  return '<p>\\(z=\\) <input class="hs-cpx-input" type="text" disabled></p>';
}

function renderPreviewHTML_complexe(state) {
  const bareme = state.bareme || 1;
  const scenario = state.scenario || 'forme-alg';
  const mode = state.mode || 'fixe';
  const scenarioLabels = {
    'forme-alg': 'Forme algébrique',
    'module-arg': 'Module et argument',
    'equation-2deg': 'Équation z² + bz + c = 0',
    'affixes': 'Milieu et distance (affixes)',
    'conjugue': 'Conjugué'
  };

  const pmap = _cpxBuildPmap(state);
  const rawText = state.text || (typeof _cpxGenEnonce === 'function' ? _cpxGenEnonce(scenario, state.op || '*', state.complexno || 'i') : '');
  const text = _hsRenderMath(_cpxSubst(rawText, pmap));
  const inputRow = _hsRenderMath(_cpxInputRowHTML(scenario));

  let fbGlobalHTML = '';
  if (typeof CPX_FB_DEFS !== 'undefined' && CPX_FB_DEFS[scenario]) {
    fbGlobalHTML = CPX_FB_DEFS[scenario].map(function (item) {
      const id = _cpxFbId(scenario, item.key);
      const raw = (state.fbDetail && state.fbDetail[id]) ? state.fbDetail[id] : I18N.t(item.defKey);
      return `<div class="hs-clickable" data-cpx-field="detail:${id}" style="margin-bottom:8px;">${_hsRenderMath(_cpxSubst(raw, pmap))}</div>`;
    }).join('');
  }

  const rawFbGen = state.fbGen || (typeof _cpxGenFbgen === 'function' ? _cpxGenFbgen(scenario, state.op || '*', state.complexno || 'i') : '');
  const fbGenHTML = `<div class="hs-clickable" data-cpx-field="fbgen">${_hsRenderMath(_cpxSubst(rawFbGen, pmap))}</div>`;

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
    <span class="hs-preview-badge">Nombres complexes</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${scenarioLabels[scenario] || scenario}</span>
    ${mode === 'aleatoire' ? '<span class="hs-preview-note">🎲 Valeurs générées par STACK</span>' : ''}
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-cpx-field="text">${text}</div>
    ${inputRow}
    <button class="hs-validate-btn" disabled>Valider</button>

    <div class="hs-fb-section-title">Aperçu du feedback (correction)</div>
    ${fbGlobalHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">Feedback général (toujours affiché)</div>
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireCpxPreview);
  } else {
    wireCpxPreview();
  }
})();

// ══════════════════════════════════════════════════════
//  RENDER : REDOX (dosage potentiométrique) — courbe statique
// ══════════════════════════════════════════════════════
// La vraie question Moodle utilise un widget JSXGraph avec un curseur
// déplaçable (voir genRedox() dans generators.js) : l'iframe étant
// sandboxée SANS allow-scripts, on ne peut pas rejouer ce widget interactif.
// On retrace donc la même courbe E(V) (deux branches de Nernst, mêmes
// formules que genRedox) en SVG statique, avec le curseur figé à sa
// position de départ (comme à l'ouverture réelle de la question), et on
// indique la réponse attendue à part (comme pour "match").
function _rxBuildCurve(state) {
  const e1 = parseFloat(state.e1) || 1.51, n1 = parseInt(state.n1) || 5;
  const e2 = parseFloat(state.e2) || 0.77, n2 = parseInt(state.n2) || 1;
  const c1 = parseFloat(state.c1) || 0.02, c2 = parseFloat(state.c2) || 0.1, v2 = parseFloat(state.v2) || 20;
  const rxFind = state.rxFind || 'equivalence';

  const Veq = n2 * c2 * v2 / (n1 * c1);
  const Eeq = (n1 * e1 + n2 * e2) / (n1 + n2);
  const Vmax = Veq * (rxFind === 'double' ? 2.3 : 1.65);
  const yLow = Math.min(e1, e2) - 0.40;
  const yHigh = Math.max(e1, e2) + 0.30;

  let cursorMode = 'none', Vt = null, Et = null;
  if (rxFind === 'equivalence') { cursorMode = 'x'; Vt = Veq; }
  else if (rxFind === 'eo1')    { cursorMode = 'y'; Et = e1; }
  else if (rxFind === 'eo2')    { cursorMode = 'y'; Et = e2; }
  else if (rxFind === 'demi')   { cursorMode = 'xy'; Vt = Veq / 2; Et = e2; }
  else if (rxFind === 'double') { cursorMode = 'xy'; Vt = Veq * 2;  Et = e1; }
  else if (rxFind === 'eeq')    { cursorMode = 'xy'; Vt = Veq;      Et = Eeq; }

  const isVolCursor = cursorMode === 'x';
  const targetE = Et;
  let cursorInitX, cursorInitY;
  if (cursorMode === 'x')       { cursorInitX = Veq * 0.55; cursorInitY = yLow; }
  else if (cursorMode === 'y')  { cursorInitX = 0; cursorInitY = (yLow + yHigh) / 2; }
  else if (cursorMode === 'xy') { cursorInitX = Vmax * 0.12; cursorInitY = yHigh - 0.05; }
  else                          { cursorInitX = 0; cursorInitY = yLow; }

  return { e1, n1, e2, n2, c1, c2, v2, Veq, Eeq, Vmax, yLow, yHigh, cursorMode, isVolCursor, Vt, Et, targetE, cursorInitX, cursorInitY };
}

function renderPreviewHTML_redox(state) {
  const bareme = state.bareme || 1;
  const text = _hsRenderMath(state.text || '');
  const titrantName = state.titrantName || 'titrant';
  const tolVol = parseFloat(state.tolVol) || 0.5;
  const tolE = parseFloat(state.tolE) || 0.05;
  const tolC = parseFloat(state.tolC) || 0.005;
  const rxFind = state.rxFind || 'equivalence';
  const g = _rxBuildCurve(state);

  const W = 460, H = 320, pad = 34;
  const sx = v => pad + (v / g.Vmax) * (W - 2 * pad);
  const sy = e => (H - pad) - ((e - g.yLow) / (g.yHigh - g.yLow)) * (H - 2 * pad);

  function branchPath(fromT, toT, before) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = fromT + (toT - fromT) * (i / 60);
      const r = before ? t / (g.Veq - t) : (t - g.Veq) / g.Veq;
      if (r <= 0) continue;
      const E = before ? g.e2 + (0.06 / g.n2) * Math.log10(r) : g.e1 + (0.06 / g.n1) * Math.log10(r);
      if (E < g.yLow || E > g.yHigh) continue;
      pts.push(sx(t).toFixed(1) + ',' + sy(E).toFixed(1));
    }
    return pts.join(' ');
  }
  const eps = g.Veq * 0.01;
  const beforePts = branchPath(eps, g.Veq - eps, true);
  const afterPts = branchPath(g.Veq + eps, g.Vmax, false);

  const curX = sx(g.cursorInitX), curY = sy(g.cursorInitY);

  let targetLabel;
  if (rxFind === 'calc') {
    const c2Target = (g.n1 * g.c1 * g.Veq) / (g.n2 * g.v2);
    targetLabel = `Veq (lu sur le graphe, ± ${tolVol} mL) puis C₂ = ${c2Target.toFixed(4)} mol/L (± ${tolC} mol/L)`;
  } else if (g.cursorMode === 'x') {
    targetLabel = `Veq = ${g.Veq.toFixed(2)} mL (± ${tolVol} mL)`;
  } else if (g.cursorMode === 'y') {
    targetLabel = `${(rxFind === 'eo1' ? 'E°₁' : 'E°₂')} = ${g.targetE.toFixed(3)} V (± ${tolE} V)`;
  } else {
    targetLabel = `V = ${g.Vt.toFixed(2)} mL (± ${tolVol} mL), E = ${g.Et.toFixed(3)} V (± ${tolE} V)`;
  }

  // Le repère (Veq,Eeq) donnerait la réponse pour 'equivalence', 'eeq' et 'calc' (l'élève doit lire Veq lui-même) : on le masque alors (cf. genRedox()).
  const showVeqMarker = (rxFind === 'eo1' || rxFind === 'eo2' || rxFind === 'demi' || rxFind === 'double');
  const veqMarkerSvg = showVeqMarker ? `
      <line x1="${sx(g.Veq).toFixed(1)}" y1="${sy(g.Eeq).toFixed(1)}" x2="${sx(g.Veq).toFixed(1)}" y2="${H - pad}" stroke="#94a3b8" stroke-dasharray="4,3"/>
      <circle cx="${sx(g.Veq).toFixed(1)}" cy="${sy(g.Eeq).toFixed(1)}" r="3.5" fill="#2563eb"/>` : '';
  const curCol  = g.cursorMode === 'x' ? '#ef4444' : g.cursorMode === 'y' ? '#7c3aed' : '#ea580c';
  const curColD = g.cursorMode === 'x' ? '#b91c1c' : g.cursorMode === 'y' ? '#5b21b6' : '#9a3412';
  const cursorSvg = g.cursorMode !== 'none' ? `
      <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="6" fill="${curCol}" stroke="${curColD}" stroke-width="1.5"/>
      <text x="${curX.toFixed(1)}" y="${(curY - 10).toFixed(1)}" font-size="11" font-weight="bold" fill="${curCol}" text-anchor="middle">▶ curseur (élève)</text>` : '';

  const svg = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;background:#fff;border:1px solid #fecaca;border-radius:8px;">
      <line x1="${pad}" y1="${H - pad}" x2="${W - pad / 2}" y2="${H - pad}" stroke="#94a3b8" stroke-width="1.2"/>
      <line x1="${pad}" y1="${pad / 2}" x2="${pad}" y2="${H - pad}" stroke="#94a3b8" stroke-width="1.2"/>
      <text x="${W - pad}" y="${H - pad + 16}" font-size="11" text-anchor="end" fill="#475569">V(${titrantName}) (mL)</text>
      <text x="${pad + 4}" y="${pad / 2 + 4}" font-size="11" fill="#475569">E (V)</text>
      <polyline points="${beforePts}" fill="none" stroke="#2563eb" stroke-width="2.2"/>
      <polyline points="${afterPts}" fill="none" stroke="#2563eb" stroke-width="2.2"/>
      ${veqMarkerSvg}
      ${cursorSvg}
    </svg>`;

  const fbHTML = `
    <div data-rx-field="fbc">${wrapFb(_hsRenderMath(state.fbOk || '✅ <strong>Bonne réponse !</strong>'), true)}</div>
    <div data-rx-field="fbe">${wrapFb(_hsRenderMath(state.fbWrong || '❌ <strong>Réponse incorrecte.</strong>'), false)}</div>`;

  const fbGenHTML = `<div class="hs-clickable" data-rx-field="fbgen" style="border-left:4px solid #b91c1c;padding:10px 14px;background:#fee2e2;border-radius:4px;margin:4px 0;">${state.fbGen ? _hsRenderMath(state.fbGen) : '<span style="color:#94a3b8;">(vide — la correction auto reste affichée à l\'élève)</span>'}</div>`;

  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-redox .mpane.on') && document.querySelector('#fp-redox .mpane.on').id === 'rx-fb-gen'; } catch (e) {}

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 12px 16px; color: #1f2937; background: #ffffff; }
  .hs-preview-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .hs-preview-badge { background: #b91c1c; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: #fee2e2; color: #7f1d1d; border: 1px solid #b91c1c; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  [data-rx-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-rx-field]:hover { outline: 2px dashed #b91c1c; outline-offset: 2px; }
  .hs-preview-text[data-rx-field]:hover { background: #fee2e2; }
  .hs-rx-target { margin: 10px 0; padding: 8px 12px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 4px; font-size: .85rem; color: #14532d; }
  .hs-validate-btn { margin-top: 12px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
  body.hs-focus-fbgen .hs-main-block { display: none; }
  body.hs-focus-fbgen .hs-fbgen-block .hs-fb-section-title { margin-top: 0; border-top: none; padding-top: 0; }
  body:not(.hs-focus-fbgen) .hs-fbgen-block { display: none; }
</style>
</head>
<body class="${focusFbGen ? 'hs-focus-fbgen' : ''}">
  <div class="hs-preview-header">
    <span class="hs-preview-badge">Dosage Redox</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">⚠️ Widget interactif JSXGraph non rejouable ici (curseur figé au départ)</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-rx-field="text">${text}</div>
    ${svg}
    <div class="hs-rx-target"><strong>Réponse attendue :</strong> ${targetLabel}</div>
    <button class="hs-validate-btn" disabled>Valider</button>

    <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
    ${fbHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">Feedback général (solution + commentaire complémentaire)</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}

(function () {
  function updateRxFullPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'redox') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('rx-preview-container');
    if (!container) return;
    var state = captureState();
    var iframe = mountPreviewIframe('rx-preview-container', renderPreviewHTML_redox(state));
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireRxPreviewClicks(iframe); });
    }
  }
  window.rxRefreshPreview = updateRxFullPreview;

  function wireRxPreviewClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-rx-field]');
        if (!el) return;
        var field = el.getAttribute('data-rx-field');
        function openField(id) {
          var prevEl = document.getElementById('prev-' + id);
          if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof openRich === 'function') openRich(id);
        }
        if (field === 'text') return openField('rx-text');
        if (field === 'fbc') { var elFb = document.getElementById('rx-fb-ok'); if (elFb) elFb.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        if (field === 'fbe') { var elFb2 = document.getElementById('rx-fb-wrong'); if (elFb2) elFb2.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      });
    } catch (e) {
      console.error('wireRxPreviewClicks: impossible d\'attacher les clics :', e);
    }
  }

  function wireRxPreview() {
    var panel = document.getElementById('fp-redox');
    if (!panel) return;
    panel.addEventListener('input', updateRxFullPreview);
    panel.addEventListener('change', updateRxFullPreview);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(updateRxFullPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });
    hsRegisterPreviewRefresher(updateRxFullPreview);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireRxPreview);
  } else {
    wireRxPreview();
  }
})();

function _hsSimplePreviewHTML(cfg) {
  // Auto-détection de l'onglet actif (Config vs Feedback général) via la convention
  // universelle d'id <prefix>-fb-gen, sauf si l'appelant a déjà fourni onlyFbGen/hideFbGen
  // explicitement (ex: calcul, qui calcule fbGenActive lui-même pour tokeniser le vrai XML).
  if (cfg.onlyFbGen === undefined && cfg.hideFbGen === undefined) {
    var _fbGenTab = document.getElementById(cfg.prefix + '-fb-gen');
    var _fbGenActive = !!(_fbGenTab && _fbGenTab.classList.contains('on'));
    cfg.onlyFbGen = _fbGenActive;
    cfg.hideFbGen = !_fbGenActive;
  }
  const fbGenBody = cfg.fbGenAuto
    ? cfg.fbGenAuto + (cfg.fbGen ? `<p>${_hsRenderMath(cfg.fbGen)}</p>` : '')
    : (cfg.fbGen ? _hsRenderMath(cfg.fbGen) : '<span style="color:#94a3b8;">(vide — la correction auto reste affichée à l\'élève)</span>');
  const fbGenHTML = `<div class="hs-clickable" data-${cfg.prefix}-field="fbgen" style="border-left:4px solid ${cfg.badgeColor};padding:10px 14px;background:${cfg.noteBg};border-radius:4px;margin:4px 0;">${fbGenBody}</div>`;
  const fbOkDescHTML = cfg.fbOkDesc ? `<div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${_hsRenderMath(cfg.fbOkDesc)}</div>` : '';
  const fbWrongDescHTML = cfg.fbWrongDesc ? `<div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${_hsRenderMath(cfg.fbWrongDesc)}</div>` : '';
  // extraFeedbackNodes : PRT à noeuds de diagnostic multiples (ex: Base N) — chaque
  // noeud intermédiaire du PRT réel a son propre feedback figé, invisible dans le
  // gabarit standard à 2 boîtes (Ok/Faux). On les liste ici pour que rien ne reste
  // caché à l'enseignant dans l'aperçu.
  const extraNodesHTML = (cfg.extraFeedbackNodes && cfg.extraFeedbackNodes.length) ? `
    <div style="font-size:.75rem;color:#64748b;margin:10px 0 4px;font-weight:600;">${cfg.extraFeedbackNodesTitle || "Autres diagnostics possibles selon l'erreur détectée :"}</div>
    ${cfg.extraFeedbackNodes.map(n => `<div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${_hsRenderMath(n.desc || '')}</div>${_hsRenderMath(n.fb || '')}`).join('')}` : '';
  const okWrongHTML = cfg.hideOkWrongBoxes ? '' : `
    <div data-${cfg.prefix}-field="fbc">${fbOkDescHTML}${wrapFb(_hsRenderMath(cfg.fbOk || '✅ <strong>Bonne réponse !</strong>'), true)}</div>
    <div data-${cfg.prefix}-field="fbe">${fbWrongDescHTML}${wrapFb(_hsRenderMath(cfg.fbWrong || '❌ <strong>Réponse incorrecte.</strong>'), false)}</div>`;
  const fbHTML = `
    ${okWrongHTML}
    ${extraNodesHTML}
    ${cfg.hideFbGen ? '' : fbGenHTML}`;
  const bodyHTML = cfg.onlyFbGen ? `
  <div class="hs-fb-section-title">Feedback général (solution + commentaire complémentaire)</div>
  ${fbGenHTML}` : `
  <div class="hs-preview-text" data-${cfg.prefix}-field="text">${cfg.text}</div>
  ${cfg.hideExampleBox ? '' : `<div class="hs-example-box">${cfg.exampleLabel === '' ? '' : `<strong>${cfg.exampleLabel || 'Exemple (génération aléatoire Maxima — change à chaque affichage) :'}</strong><br>`}${cfg.exampleHTML || '<em>(aperçu indisponible)</em>'}</div>`}
  <button class="hs-validate-btn" disabled>Répondre…</button>

  <div class="hs-fb-section-title">Aperçu du feedback (affiché après validation)</div>
  ${fbHTML}`;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="lib/katex/katex.min.css">
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; margin: 0; padding: 12px 16px; color: #1f2937; background: #ffffff; }
  .hs-preview-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .hs-preview-badge { background: ${cfg.badgeColor}; color: #fff; padding: 2px 9px; border-radius: 20px; font-size: .78rem; font-weight: 700; }
  .hs-preview-note { background: ${cfg.noteBg}; color: ${cfg.noteColor}; border: 1px solid ${cfg.badgeColor}; padding: 2px 9px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
  .hs-preview-text { margin-bottom: 14px; }
  [data-${cfg.prefix}-field] { cursor: pointer; border-radius: 6px; transition: outline .1s; }
  [data-${cfg.prefix}-field]:hover { outline: 2px dashed ${cfg.badgeColor}; outline-offset: 2px; }
  .hs-preview-text[data-${cfg.prefix}-field]:hover { background: ${cfg.noteBg}; }
  .hs-example-box { margin: 10px 0; padding: 10px 14px; background: ${cfg.noteBg}; border-left: 4px solid ${cfg.badgeColor}; border-radius: 4px; font-size: .88rem; color: ${cfg.noteColor}; }
  .hs-example-box img { max-width: 100%; height: auto; }
  .hs-validate-btn { margin-top: 12px; padding: 8px 18px; border: none; border-radius: 6px; background: #9ca3af; color: #fff; font-weight: 600; cursor: not-allowed; }
  .hs-fb-section-title { margin-top: 22px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: .82rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .02em; }
</style>
</head>
<body>
  <div class="hs-preview-header">
    <span class="hs-preview-badge">${cfg.badge}</span>
    <span class="hs-preview-note">/ ${cfg.bareme} pt</span>
  </div>
  ${bodyHTML}
</body>
</html>`;
}

function _hsWireSimplePreview(typeName, prefix, containerId, panelId, renderFn, scripted) {
  var mountFn = scripted ? mountPreviewIframeScripted : mountPreviewIframe;
  function update() {
    if (typeof currentType === 'undefined' || currentType !== typeName) return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById(containerId);
    if (!container) return;
    try {
      var state = captureState();
      var iframe = mountFn(containerId, renderFn(state));
      if (iframe && !iframe.__hsClickWired) {
        iframe.__hsClickWired = true;
        iframe.addEventListener('load', function () { wireClicks(iframe); });
      }
    } catch(e) {
      console.error('[preview] update error [' + typeName + ']:', e);
      mountFn(containerId, '<html><body style="font-family:sans-serif;padding:12px;color:#dc2626;"><strong>Erreur aper\u00e7u (' + typeName + '):</strong><pre style="font-size:.8rem;white-space:pre-wrap;">' + String(e) + '<\/pre><\/body><\/html>');
    }
  }
  function wireClicks(iframe) {
    try {
      var doc = iframe.contentWindow.document;
      doc.addEventListener('click', function (e) {
        var el = e.target.closest('[data-' + prefix + '-field]');
        if (!el) return;
        var field = el.getAttribute('data-' + prefix + '-field');
        function openField(id) {
          var prevEl = document.getElementById('prev-' + id);
          if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof openRich === 'function') openRich(id);
        }
        if (field === 'text') return openField(prefix + '-text');
        if (field === 'fbc') { var e1 = document.getElementById(prefix + '-fb-ok'); if (e1) e1.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        if (field === 'fbe') { var e2 = document.getElementById(prefix + '-fb-wrong'); if (e2) e2.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        if (field === 'fbgen') { var e3 = document.getElementById(prefix + '-fbgen'); if (e3) e3.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      });
    } catch (e) {
      console.error('wire' + prefix + 'PreviewClicks: impossible d\'attacher les clics :', e);
    }
  }
  function wire() {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    panel.addEventListener('input', update);
    panel.addEventListener('change', update);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          setTimeout(update, 0);
        }
      });
    }).observe(panel, { attributes: true });
    hsRegisterPreviewRefresher(update);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
  return update;
}

function renderPreviewHTML_inequation(state) {
  var realParts = {};
  try { realParts = (typeof genInequation === 'function') ? genInequation(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'In\xe9quations', badgeColor: '#0e7490', noteBg: '#ecfeff', noteColor: '#0e7490',
    prefix: 'ineq', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.ineqRefreshPreview = _hsWireSimplePreview('inequation', 'ineq', 'ineq-preview-container', 'fp-inequation', renderPreviewHTML_inequation);

function renderPreviewHTML_polynomes(state) {
  var realParts = {};
  try { realParts = (typeof genPolynomes === 'function') ? genPolynomes(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Polyn\xf4mes', badgeColor: '#166534', noteBg: '#f0fdf4', noteColor: '#166534',
    prefix: 'pol', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.polRefreshPreview = _hsWireSimplePreview('polynomes', 'pol', 'pol-preview-container', 'fp-polynomes', renderPreviewHTML_polynomes);

function renderPreviewHTML_equivalence(state) {
  var realParts = {};
  try { realParts = (typeof genEquivalence === 'function') ? genEquivalence(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  return _hsSimplePreviewHTML({
    badge: '\xc9quivalence', badgeColor: '#5b21b6', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'eq', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars)),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.eqRefreshPreview = _hsWireSimplePreview('equivalence', 'eq', 'eq-preview-container', 'fp-equivalence', renderPreviewHTML_equivalence);

function renderPreviewHTML_limites(state) {
  var realParts = {};
  try { realParts = (typeof genLimites === 'function') ? genLimites(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Limites', badgeColor: '#1e3a8a', noteBg: '#eff6ff', noteColor: '#1e3a8a',
    prefix: 'lim', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.limRefreshPreview = _hsWireSimplePreview('limites', 'lim', 'lim-preview-container', 'fp-limites', renderPreviewHTML_limites);

function renderPreviewHTML_physique(state) {
  var realParts = {};
  try { realParts = (typeof genPhysique === 'function') ? genPhysique(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Physique', badgeColor: '#7f1d1d', noteBg: '#fff1f2', noteColor: '#7f1d1d',
    prefix: 'phy', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen
  });
}
window.phyRefreshPreview = _hsWireSimplePreview('physique', 'phy', 'phy-preview-container', 'fp-physique', renderPreviewHTML_physique);

function renderPreviewHTML_logique(state) {
  var realParts = {};
  try { realParts = (typeof genLogique === 'function') ? genLogique(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Logique', badgeColor: '#7c3aed', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'lg', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen
  });
}
window.lgRefreshPreview = _hsWireSimplePreview('logique', 'lg', 'lg-preview-container', 'fp-logique', renderPreviewHTML_logique);

function renderPreviewHTML_suites(state) {
  var realParts = {};
  try { realParts = (typeof genSuites === 'function') ? genSuites(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Suites', badgeColor: '#7e22ce', noteBg: '#f5f3ff', noteColor: '#7e22ce',
    prefix: 'sui', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.suiRefreshPreview = _hsWireSimplePreview('suites', 'sui', 'sui-preview-container', 'fp-suites', renderPreviewHTML_suites);

function renderPreviewHTML_probabilites(state) {
  var realParts = {};
  try { realParts = (typeof genProbabilites === 'function') ? genProbabilites(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Probabilit\xe9s', badgeColor: '#0369a1', noteBg: '#eff6ff', noteColor: '#0369a1',
    prefix: 'prob', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.probRefreshPreview = _hsWireSimplePreview('probabilites', 'prob', 'prob-preview-container', 'fp-probabilites', renderPreviewHTML_probabilites);

function renderPreviewHTML_trigonometrie(state) {
  var realParts = {};
  try { realParts = (typeof genTrigonometrie === 'function') ? genTrigonometrie(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Trigonom\xe9trie', badgeColor: '#b45309', noteBg: '#fffbeb', noteColor: '#b45309',
    prefix: 'trig', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.trigRefreshPreview = _hsWireSimplePreview('trigonometrie', 'trig', 'trig-preview-container', 'fp-trigonometrie', renderPreviewHTML_trigonometrie);

function renderPreviewHTML_statistiques(state) {
  var realParts = {};
  try { realParts = (typeof genStatistiques === 'function') ? genStatistiques(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  // ri(a,b) est un alias local de rand() défini dans gen-math-statistiques.js : toute
  // valeur qui en dépend encore requiert un tirage Maxima réel, donc n'est pas "connue".
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="background:#0284c7;border-left:5px solid #0369a1;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag
    ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement (s\xe9rie statistique) — voir l\'aper\xe7u \xe9l\xe8ve ci-dessous pour un exemple concret.</em>';
  var prtBoxes = _hsPrtBoxes(realParts);
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement ci-dessus.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Statistiques', badgeColor: '#0f766e', noteBg: '#f0fdfa', noteColor: '#0f766e',
    prefix: 'stat', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen
  });
}
window.statRefreshPreview = _hsWireSimplePreview('statistiques', 'stat', 'stat-preview-container', 'fp-statistiques', renderPreviewHTML_statistiques);

function renderPreviewHTML_matrices(state) {
  var realParts = {};
  try { realParts = (typeof genMatrices === 'function') ? genMatrices(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Matrices', badgeColor: '#7c2d12', noteBg: '#fff7ed', noteColor: '#7c2d12',
    prefix: 'mat', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.matRefreshPreview = _hsWireSimplePreview('matrices', 'mat', 'mat-preview-container', 'fp-matrices', renderPreviewHTML_matrices);

function renderPreviewHTML_geometrie(state) {
  var realParts = {};
  try { realParts = (typeof genGeometrie === 'function') ? genGeometrie(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'G\xe9om\xe9trie', badgeColor: '#1e40af', noteBg: '#eff6ff', noteColor: '#1e40af',
    prefix: 'geo', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.geoRefreshPreview = _hsWireSimplePreview('geometrie', 'geo', 'geo-preview-container', 'fp-geometrie', renderPreviewHTML_geometrie);

// Analyse le code source Maxima (`vars`) produit par genCalcul pour repérer les
// affectations qui sont déjà entièrement déterminées côté éditeur (valeurs fixes
// saisies par l'enseignant, expressions libres, bornes...), par opposition à celles
// qui nécessitent un vrai calcul Maxima (diff, integrate, ev, ratsimp, rand...).
// Évalue une expression arithmétique déjà entièrement substituée (que des
// nombres, +-*/^ et parenthèses) pour afficher la valeur calculée plutôt que
// la formule brute dans l'aperçu enseignant (ex: "3*2^4" -> "48"). Renvoie
// null si l'expression contient autre chose qu'de l'arithmétique pure (ex:
// une variable libre comme "n"), auquel cas l'appelant garde la forme symbolique.
function _calcEvalNumeric(expr) {
  // max(...)/min(...) sont fréquents dans les bornes calculées (ex: declK en mode fixe) :
  // on les traduit vers Math.max/Math.min avant l'évaluation, tout en gardant le garde-fou
  // qui exclut toute autre lettre (variable libre, autre fonction Maxima non supportée).
  var e = String(expr).replace(/\bmax\(/g, 'Math.max(').replace(/\bmin\(/g, 'Math.min(').replace(/\bround\(/g, 'Math.round(');
  var stripped = e.replace(/Math\.(max|min|round)/g, '');
  if (!/^[-+*/^().0-9\s,]+$/.test(stripped)) return null;
  try {
    var v = Function('"use strict";return (' + e.replace(/\^/g, '**') + ')')();
    if (typeof v !== 'number' || !isFinite(v)) return null;
    var r = Math.round(v * 1e9) / 1e9;
    return String(r);
  } catch (e) { return null; }
}

function _calcExtractKnownVars(varsSrc) {
  var known = {};
  var FORBIDDEN = /\b(rand|diff|integrate|ev|float|ratsimp|expand|ifthenelse)\s*\(/;
  var cleaned = (varsSrc || '').replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned.split(/[$;]/).forEach(function(stmt) {
    var m = stmt.trim().match(/^q\d+_([a-zA-Z0-9_]+)\s*:\s*(.+)$/);
    if (!m) return;
    var name = m[1], rhs = m[2].trim();
    if (!rhs) return;
    var substituted = rhs.replace(/q\d+_([a-zA-Z0-9_]+)/g, function(full, refName) {
      if (!known.hasOwnProperty(refName)) return full;
      var v = known[refName];
      return /^-?[\w.%^]+$/.test(v) ? v : '(' + v + ')';
    }).replace(/\+-/g, '-');
    if (/q\d+_/.test(substituted) || FORBIDDEN.test(substituted)) return;
    var quotedStr = substituted.match(/^"(.*)"$/);
    if (quotedStr) { known[name] = quotedStr[1]; return; }
    var evaluated = _calcEvalNumeric(substituted);
    known[name] = evaluated !== null ? evaluated : substituted;
  });
  return known;
}

function _calcMaximaToLatex(expr) {
  return String(expr).replace(/%e/g, 'e').replace(/%pi/g, '\\pi').replace(/\*/g, '\\cdot ');
}

// Remplace chaque jeton Maxima {@qX_nom@} produit par le vrai générateur (genCalcul) :
// par sa vraie valeur/expression si elle est déjà déterminée côté éditeur (voir
// _calcExtractKnownVars), sinon par un placeholder LaTeX lisible q_{nom} —
// évite toute logique de correction dupliquée pour ce qui reste calculé par Maxima.
// Le jeton est parfois imbriqué dans un bloc \(...\) déjà ouvert par le modèle
// (ex: scénario "intégrale") : on ne rajoute nos propres délimiteurs \( \) que
// si le jeton n'est pas déjà à l'intérieur d'un bloc math, sinon MathJax casse
// tout le rendu sur des délimiteurs imbriqués.
function _calcTokenizeForPreview(html, known) {
  known = known || {};
  var str = html || '';
  return str.replace(/\{@q\d+_([a-zA-Z0-9_]+)@\}/g, function(full, name, offset) {
    var before = str.slice(0, offset);
    var opens = (before.match(/\\\(/g) || []).length;
    var closes = (before.match(/\\\)/g) || []).length;
    var opensDisp = (before.match(/\\\[/g) || []).length;
    var closesDisp = (before.match(/\\\]/g) || []).length;
    var insideMath = (opens > closes) || (opensDisp > closesDisp);
    var raw = known.hasOwnProperty(name) ? _calcMaximaToLatex(known[name]) : 'q_{' + name.replace(/_/g, '\\_') + '}';
    return insideMath ? raw : ('\\(' + raw + '\\)');
  });
}

function renderPreviewHTML_calcul(state) {
  var fbGenTab = document.getElementById('calc-fb-gen');
  var fbGenActive = !!(fbGenTab && fbGenTab.classList.contains('on'));
  var realParts = {};
  try { realParts = (typeof genCalcul === 'function') ? genCalcul(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="background:#475569;border-left:5px solid #334155;[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag
    ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement par Maxima (valeurs al\xe9atoires internes \xe0 chaque affichage) — voir l\'aper\xe7u \xe9l\xe8ve ci-dessous pour un exemple concret.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es par Maxima \xe0 l\'affichage r\xe9el (tirage al\xe9atoire ou calcul symbolique) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es dans l\'exercice (valeurs fixes, expression saisie, bornes) sont affich\xe9es directement ci-dessus.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Calcul / Analyse', badgeColor: '#4338ca', noteBg: '#eef2ff', noteColor: '#4338ca',
    prefix: 'calc', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    onlyFbGen: fbGenActive,
    hideFbGen: !fbGenActive,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.calcRefreshPreview = _hsWireSimplePreview('calcul', 'calc', 'calc-preview-container', 'fp-calcul', renderPreviewHTML_calcul);

// Extrait le contenu d'un bloc STACK [[tag ...]]...[[/tag]] et, pour l'iframe,
// sépare [[style]]/[[script type="module"]] du reste du HTML — sert uniquement à
// rejouer une version "live" (littéraux JS à la place des {#...#}) dans l'aperçu.
function _abExtractBlock(textFrag, openTag, closeTag) {
  var re = new RegExp('\\[\\[' + openTag + '[^\\]]*\\]\\]([\\s\\S]*?)\\[\\[\\/' + (closeTag || openTag) + '\\]\\]');
  var m = re.exec(textFrag || '');
  return m ? m[1] : '';
}
function _abSubstitutePlaceholders(js, previewVars) {
  return (js || '').replace(/\{#([A-Za-z0-9_]+)#\}/g, function (full, name) {
    return (previewVars && previewVars[name] !== undefined) ? previewVars[name] : '0';
  });
}

function renderPreviewHTML_acideBase(state) {
  var realParts = {};
  try { realParts = (typeof genAcideBase === 'function') ? genAcideBase(1) : {}; } catch (e) { realParts = {}; console.error('[preview] acide-base build error:', e); }
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/\[\[iframe[\s\S]*?\[\[\/iframe\]\]/, '<!--HS-AB-GRAPHIC-->')
    .replace(/\[\[jsxgraph[\s\S]*?\[\[\/jsxgraph\]\]/, '<!--HS-AB-GRAPHIC-->')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioParts = bodyFrag.split('<!--HS-AB-GRAPHIC-->');
  var textBefore = scenarioParts[0] ? _hsRenderMath(scenarioParts[0]) : '<p><em>Énoncé automatique : titrage pH-métrique.</em></p>';
  var textAfter = scenarioParts[1] ? _hsRenderMath(scenarioParts[1]) : '';

  var abMethod = realParts.abMethod || 'colorimetrie';
  var pv = realParts.previewVars || {};
  var inNames = realParts.previewInputNames || {};
  var dispW = realParts.dispW || 500, dispH = realParts.dispH || 400;
  var exampleHTML;

  if (abMethod === 'colorimetrie') {
    var iframeInner = _abExtractBlock(realParts.textFrag, 'iframe');
    var css = _abExtractBlock(iframeInner, 'style');
    var scriptRaw = _abExtractBlock(iframeInner, 'script type="module"', 'script');
    var body = iframeInner
      .replace(/\[\[style\]\][\s\S]*?\[\[\/style\]\]/, '')
      .replace(/\[\[script type="module"\][\s\S]*?\[\[\/script\]\]/, '')
      .trim();
    var js = _abSubstitutePlaceholders(scriptRaw, pv)
      .replace(/^\s*import\s*\{\s*stack_js\s*\}\s*from\s*'\[\[cors[^\]]*\]\]';\s*\n/, '');
    var hiddenInputs = '<input type="hidden" id="' + (inNames.vol || '') + '" value="0.0">'
      + '<input type="hidden" id="' + (inNames.ind || '') + '" value="">'
      + '<input type="hidden" id="' + (inNames.tries || '') + '" value="1">';
    exampleHTML = '<style>' + css + '</style>' + hiddenInputs + body
      + '<script type="module">\n'
      + 'const stack_js = { request_access_to_input: function(name){ return Promise.resolve(name); } };\n'
      + js + '\n<\/script>';
  } else {
    var jxgRaw = _abExtractBlock(realParts.textFrag, 'jsxgraph');
    var jxgJs = _abSubstitutePlaceholders(jxgRaw, pv);
    var refSlopesVar = realParts.previewRefSlopesVar || 'refSlopes';
    var boardId = 'abTangBoard';
    var jsBody = 'var ' + refSlopesVar + ' = null; var stack_jxg = { bind_point: function(){} };\n' + jxgJs;
    exampleHTML = '<div id="' + boardId + '" style="position:relative;width:100%;max-width:' + dispW + 'px;height:' + dispH + 'px;margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
      + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
      + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; ' + jsBody + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
  }
  if (textAfter) exampleHTML += '<div style="margin-top:10px;">' + textAfter + '</div>';
  exampleHTML = '<div style="background:#fef9c3;border:1px solid #eab308;color:#713f12;font-size:.78rem;padding:6px 10px;border-radius:6px;margin-bottom:10px;">⚠️ Aperçu — la simulation ci-dessous est visuelle uniquement : les interactions (clics, glisser, saisie) ne sont pas prises en compte dans le calcul du score ici. La correction réelle se fait dans Moodle.</div>' + exampleHTML;

  return _hsSimplePreviewHTML({
    badge: 'Acide-base', badgeColor: '#16a34a', noteBg: '#d1fae5', noteColor: '#065f46',
    prefix: 'ab', bareme: state.bareme || 1,
    text: textBefore,
    exampleLabel: '',
    exampleHTML: exampleHTML,
    hideOkWrongBoxes: true,
    extraFeedbackNodesTitle: "Feedbacks du PRT (dans l'ordre d'évaluation) :",
    extraFeedbackNodes: realParts.diagNodes || [],
    fbGenAuto: _hsRenderMath(realParts.generalFeedbackAuto || ''),
    fbGen: state.fbGen
  });
}
window.abRefreshPreview = _hsWireSimplePreview('acide-base', 'ab', 'ab-preview-container', 'fp-acide-base', renderPreviewHTML_acideBase, true);

function renderPreviewHTML_circuit(state) {
  var model = state.cirModel;
  if (!model || !model.state) {
    return _hsSimplePreviewHTML({
      badge: 'Circuit \xe9lectrique', badgeColor: '#c2410c', noteBg: '#fff7ed', noteColor: '#9a3412',
      prefix: 'cir', bareme: state.bareme || 1,
      text: '<p><em style="color:#6b7280;">Construisez un circuit mod\xe8le dans l\'atelier ci-contre pour voir l\'aper\xe7u \xe9l\xe8ve.</em></p>',
      hideExampleBox: true, hideOkWrongBoxes: true,
      fbGenAuto: '', fbGen: state.fbGen
    });
  }
  // L'\xe9l\xe8ve part toujours d'un board vierge (le circuit mod\xe8le n'est jamais
  // transmis c\xf4t\xe9 \xe9l\xe8ve, ni ici en aper\xe7u ni r\xe9ellement dans Moodle).
  return cirBuildAtelierHTML({ mode: 'student-preview', initialStateB64: '' });
}
window.cirRefreshPreview = _hsWireSimplePreview('circuit', 'cir', 'cir-preview-container', 'fp-circuit', renderPreviewHTML_circuit, true);

function renderPreviewHTML_basen(state) {
  var realParts = {};
  try { realParts = (typeof genBasen === 'function') ? genBasen(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
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
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '')
    .replace(/\[\[feedback:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Base N', badgeColor: '#1d4ed8', noteBg: '#eff6ff', noteColor: '#1e40af',
    prefix: 'bn', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.bnRefreshPreview = _hsWireSimplePreview('basen', 'bn', 'bn-preview-container', 'fp-basen', renderPreviewHTML_basen);

function renderPreviewHTML_rvbcmj(state) {
  var filteredEl = document.getElementById('rvb-preview-filtered');
  var rawDataEl = document.getElementById('rvb-imgdata');
  var exampleHTML = (filteredEl && filteredEl.innerHTML) ? filteredEl.innerHTML
    : (rawDataEl && rawDataEl.value ? '<img src="' + rawDataEl.value + '" style="max-width:100%;border-radius:8px;">' : '');
  // Reflète genFbDefault de js/gen-optique.js (image originale sans filtre,
  // toujours ajoutée au feedback général réel) pour que l'aperçu ne mente pas.
  var fbGenAuto = (rawDataEl && rawDataEl.value)
    ? '<p>Voici l\'image originale sans filtre pour vérifier&nbsp;:</p><p><img src="' + rawDataEl.value + '" alt="scène originale" style="max-width:600px;border-radius:6px;"></p>'
    : '';
  return _hsSimplePreviewHTML({
    badge: 'RVB / CMJN', badgeColor: '#7E22CE', noteBg: '#faf5ff', noteColor: '#581c87',
    prefix: 'rvb', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : identifier la couleur d\'un objet à travers des filtres.</em></p>'),
    exampleHTML: _hsRenderMath(exampleHTML),
    fbGenAuto: fbGenAuto,
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.rvbRefreshPreview = _hsWireSimplePreview('rvbcmj', 'rvb', 'rvb-preview-container', 'fp-rvbcmj', renderPreviewHTML_rvbcmj);

function renderPreviewHTML_optique(state) {
  return _hsSimplePreviewHTML({
    badge: 'Optique géométrique', badgeColor: '#0284c7', noteBg: '#f0f9ff', noteColor: '#0c4a6e',
    prefix: 'opt', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : construction géométrique (lentille, miroir ou instrument optique).</em></p>'),
    exampleHTML: '<p style="color:#94a3b8;font-style:italic;">Le schéma interactif JSXGraph n\'est visible que dans l\'export Moodle final.</p>',
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.optRefreshPreview = _hsWireSimplePreview('optique', 'opt', 'opt-preview-container', 'fp-optique', renderPreviewHTML_optique);

function renderPreviewHTML_diffraction(state) {
  var liveEl = document.getElementById('diff-preview');
  return _hsSimplePreviewHTML({
    badge: 'Interférences-Diffraction', badgeColor: '#4338ca', noteBg: '#f5f3ff', noteColor: '#4c1d95',
    prefix: 'diff', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : diffraction ou interférences lumineuses.</em></p>'),
    exampleHTML: _hsRenderMath(liveEl ? liveEl.innerHTML : ''),
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.diffRefreshPreview = _hsWireSimplePreview('diffraction', 'diff', 'diff-preview-container', 'fp-diffraction', renderPreviewHTML_diffraction);

// Retire l'enveloppe [[jsxgraph ...]]...[[/jsxgraph]] (syntaxe STACK) pour ne garder
// que le JS brut, exécutable tel quel dans l'iframe d'aperçu (scripts autorisés).
function _oscStripJXGWrapper(s) {
  return String(s || '')
    .replace(/^\s*\[\[jsxgraph[^\]]*\]\]\s*/, '')
    .replace(/\s*\[\[\/jsxgraph\]\]\s*$/, '');
}

// Construit le board JSXGraph réel pour l'aperçu local, à partir des mêmes fonctions
// buildOscJSXCode_* que le générateur d'export — mais avec des valeurs numériques
// littérales à la place des placeholders STACK {#...#} (pas de Maxima en local).
function _oscBuildLivePreviewJS(state) {
  var shIdx = parseInt(state.shIdx, 10); if (isNaN(shIdx)) shIdx = 10;
  var svIdx = parseInt(state.svIdx, 10); if (isNaN(svIdx)) svIdx = 7;
  var mode = state.mode || 'periode_frequence';
  var jsxBlock, modeLabel;

  if (mode === 'periode_frequence') {
    var forme = state.forme || 'aleatoire';
    var typeVal = forme === 'sinus' ? 1 : forme === 'carre' ? 2 : forme === 'triangle' ? 3
      : forme === 'carre_reel' ? 4 : forme === 'triangle_reel' ? 5 : forme === 'harmoniques' ? 6 : forme === 'dents_scie' ? 7 : forme === 'paliers' ? 8
      : (1 + Math.floor(Math.random() * 8));
    var freqVal;
    if (state.freqMode === 'alea') {
      var liste = [100, 200, 250, 500, 1000, 2000];
      freqVal = liste[Math.floor(Math.random() * liste.length)];
    } else {
      freqVal = parseFloat(state.ffreq) || 500;
    }
    var umaxVal = parseFloat(state.umax) || 3;
    jsxBlock = buildOscJSXCode_PeriodeFrequence({ si: svIdx, ti: shIdx, freqExpr: String(freqVal), umExpr: String(umaxVal), typeExpr: String(typeVal) });
    modeLabel = 'Période / Fréquence';
  } else if (mode === 'rc_charge' || mode === 'rc_decharge') {
    var decharge = (mode === 'rc_decharge');
    var evVal = parseFloat(state.evoltBase) || 2000;
    var tauVal = parseFloat(state.tauBase) || 1000;
    jsxBlock = buildOscJSXCode_RC({ si: svIdx, ti: shIdx, evExpr: String(evVal), tauExpr: String(tauVal), decharge: decharge });
    modeLabel = decharge ? 'Décharge RC' : 'Charge RC';
  } else {
    var fcVal = parseFloat(state.fcarrier) || 4000000;
    var dtMinVal = parseFloat(state.dtMin) || 4;
    var dtMaxVal = parseFloat(state.dtMax) || 8;
    var dtSec = ((dtMinVal + dtMaxVal) / 2) * 0.000001;
    var svIdxB = Math.min(OSC_SV.length - 1, svIdx + 1);
    jsxBlock = buildOscJSXCode_Retard({ siA: svIdx, siB: svIdxB, ti: shIdx, fcExpr: String(fcVal), dtExpr: String(dtSec) });
    modeLabel = 'Retard ultrasonore';
  }

  return { jsBody: _oscStripJXGWrapper(jsxBlock), modeLabel: modeLabel };
}

function renderPreviewHTML_oscilloscope(state) {
  var live = { jsBody: '', modeLabel: 'Oscilloscope' };
  try { live = _oscBuildLivePreviewJS(state); } catch (e) { console.error('[preview] oscilloscope build error:', e); }
  var boardId = 'oscLiveBoard';
  var exampleHTML = live.jsBody
    ? '<div id="' + boardId + '" style="position:relative;width:100%;max-width:520px;height:370px;margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
      + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
      + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; ' + live.jsBody + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>'
    : '<p style="color:#94a3b8;font-style:italic;">L\'oscilloscope JSXGraph interactif n\'a pas pu être généré pour l\'aperçu.</p>';

  // Jetons {@expr@} restés bruts (non calculables cote JS) : on les rend en \texttt{}
  // LaTeX plutot qu'en HTML <code>, sinon le HTML casse le rendu KaTeX quand le jeton
  // se trouve a l'interieur d'un bloc \(...\) ou \[...\] deja ouvert par le modele.
  function _oscTokenizeStack(html) {
    var str = String(html || '');
    return str.replace(/\{@\s*([\s\S]+?)\s*@\}/g, function(full, expr, offset) {
      var before = str.slice(0, offset);
      var opens = (before.match(/\\\(/g) || []).length;
      var closes = (before.match(/\\\)/g) || []).length;
      var opensDisp = (before.match(/\\\[/g) || []).length;
      var closesDisp = (before.match(/\\\]/g) || []).length;
      var insideMath = (opens > closes) || (opensDisp > closesDisp);
      var safe = String(expr).replace(/_/g, '\\_');
      var tex = '\\texttt{' + safe + '}';
      return insideMath ? tex : ('\\(' + tex + '\\)');
    });
  }

  var realParts = {};
  try { realParts = (typeof genOscilloscope === 'function') ? genOscilloscope(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';

  // Consigne fixe + questions numérotées (1. Période, 2. Fréquence…) : sans elles,
  // les feedbacks de nœuds n'ont aucun contexte dans l'aperçu.
  var fakeInputStyle = 'padding:4px 8px;border:1px solid #94a3b8;border-radius:5px;font-size:.9rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var rawTextFrag = realParts.textFrag || '';
  var consigneMatch = rawTextFrag.match(/<!-- ENONCE-START -->\s*<div[^>]*>\s*(<p>[\s\S]*?<\/p>)/);
  var consigneHTML = consigneMatch ? consigneMatch[1] : '';
  var afterJsx = rawTextFrag.split(/<!--HS-KBD:\d+-->/).slice(1).join('');
  var questionsHTML = afterJsx
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '')
    .replace(/\[\[feedback:[^\]]+\]\]/g, '');
  var questionsBlockHTML = _hsRenderMath(_oscTokenizeStack(consigneHTML + questionsHTML));
  if (questionsBlockHTML.trim()) {
    exampleHTML += '<div style="margin-top:10px;">' + questionsBlockHTML + '</div>';
  }
  var extraFeedbackNodes = ((realParts.prt && realParts.prt.nodes) || []).map(function(n) {
    var fb = (n.truefeedback ? '<div><strong>Si correct :</strong> ' + _oscTokenizeStack(n.truefeedback) + '</div>' : '')
      + (n.falsefeedback ? '<div><strong>Si incorrect :</strong> ' + _oscTokenizeStack(n.falsefeedback) + '</div>' : '');
    return { desc: n.description, fb: fb };
  }).filter(function(n) { return n.fb; });

  return _hsSimplePreviewHTML({
    badge: 'Oscilloscope — ' + live.modeLabel, badgeColor: '#0c4a6e', noteBg: '#eff6ff', noteColor: '#1e3a5f',
    prefix: 'osc', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : mesure sur oscilloscope interactif (curseurs ▪X/▪Y).</em></p>'),
    exampleLabel: '',
    exampleHTML: exampleHTML,
    fbOk: state.fbOk, fbWrong: state.fbWrong,
    fbGenAuto: _hsRenderMath(_oscTokenizeStack(realGeneralFeedback)),
    fbGen: state.fbGen,
    extraFeedbackNodes: extraFeedbackNodes
  });
}
window.oscRefreshPreview = _hsWireSimplePreview('oscilloscope', 'osc', 'osc-preview-container', 'fp-oscilloscope', renderPreviewHTML_oscilloscope, true);

function renderPreviewHTML_imageMesure(state) {
  var imgEl = document.getElementById('imm-img');
  var hasImg = imgEl && imgEl.src && document.getElementById('imm-preview-wrap') && document.getElementById('imm-preview-wrap').style.display !== 'none';

  var imgData = (document.getElementById('imm-image-data') || {}).value;
  var imgW = parseFloat((document.getElementById('imm-img-w') || {}).value);
  var imgH = parseFloat((document.getElementById('imm-img-h') || {}).value);
  var r1x = parseFloat((document.getElementById('imm-r1x') || {}).value);
  var r1y = parseFloat((document.getElementById('imm-r1y') || {}).value);
  var r1v  = parseFloat((document.getElementById('imm-r1v') || {}).value);
  var r2x = parseFloat((document.getElementById('imm-r2x') || {}).value);
  var r2y = parseFloat((document.getElementById('imm-r2y') || {}).value);
  var r2v  = parseFloat((document.getElementById('imm-r2v') || {}).value);
  var unit = ((document.getElementById('imm-unit') || {}).value || '').replace(/'/g, "\\'");

  var hasCalib = hasImg && imgData && !isNaN(imgW) && !isNaN(imgH) &&
    !isNaN(r1x) && !isNaN(r1y) && !isNaN(r1v) && !isNaN(r2x) && !isNaN(r2y) && !isNaN(r2v) && (r1x !== r2x || r1y !== r2y);

  var boardId = 'immLiveBoard';
  var exampleHTML;
  if (hasCalib && typeof immBuildBoardJS === 'function') {
    var dispH = Math.round(imgH * Math.min(700, imgW) / imgW);
    var jsBody = '';
    try { jsBody = immBuildBoardJS(JSON.stringify(boardId), imgData, imgW, imgH); } catch (e) { jsBody = ''; }
    exampleHTML = jsBody
      ? '<div id="' + boardId + '" class="jxgbox" style="width:100%;max-width:700px;height:' + dispH + 'px;margin:0 auto;"></div>'
        + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
        + '<script>(function(){ try { ' + jsBody + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>'
      : '<img src="' + imgEl.src + '" style="max-width:100%;border-radius:8px;">';
  } else if (hasImg) {
    exampleHTML = '<img src="' + imgEl.src + '" style="max-width:100%;border-radius:8px;">'
      + '<p style="color:#94a3b8;font-style:italic;margin-top:6px;">Complétez l\'étalonnage (2 repères + valeurs) pour afficher le curseur JSXGraph interactif.</p>';
  } else {
    exampleHTML = '<p style="color:#94a3b8;font-style:italic;">Chargez une image dans l\'onglet Config pour afficher l\'aperçu.</p>';
  }

  // Feedback général réel : on appelle le vrai générateur (comme oscilloscope/basen/etc.)
  // plutôt que de reconstruire un résumé à part, pour ne jamais afficher un aperçu qui
  // diverge du XML réellement exporté. genImageMesure() utilise alert() pour signaler une
  // config incomplète (pas d'image, pas d'étalonnage, aucune cible) — inacceptable en
  // aperçu live où l'on rappelle la fonction à chaque frappe : on neutralise alert()
  // pendant l'appel et on se rabat sur un message neutre si la génération échoue.
  var realGeneralFeedback = '';
  if (hasCalib && typeof genImageMesure === 'function') {
    var _immOrigAlert = window.alert;
    window.alert = function () {};
    try {
      var realParts = genImageMesure(1);
      realGeneralFeedback = (realParts && realParts.generalFeedback) || '';
    } catch (e) {
      realGeneralFeedback = '';
    } finally {
      window.alert = _immOrigAlert;
    }
  }
  var fbGenAuto = realGeneralFeedback
    ? _hsRenderMath(realGeneralFeedback)
    : '<p style="color:#94a3b8;font-style:italic;">Complétez l\'étalonnage et ajoutez au moins une cible mesurée pour afficher le feedback général réel.</p>';

  return _hsSimplePreviewHTML({
    badge: 'Mesure sur image', badgeColor: '#0891b2', noteBg: '#ecfeff', noteColor: '#0e7490',
    prefix: 'imm', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : mesure par proportionnalité sur une image (spectre, microscope, règle…).</em></p>'),
    exampleHTML: exampleHTML,
    fbOk: state.fbOk, fbWrong: state.fbWrong,
    fbGenAuto: fbGenAuto,
    fbGen: state.fbGen
  });
}
window.immRefreshPreview = _hsWireSimplePreview('image-mesure', 'imm', 'imm-preview-container', 'fp-image-mesure', renderPreviewHTML_imageMesure, true);

function renderPreviewHTML_imgclick(state) {
  var modeEl = document.querySelector('input[name="ic-mode"]:checked');
  var mode = modeEl ? modeEl.value : 'single';
  var icst = window._icState || {};
  var exampleHTML;
  if (mode === 'sequence') {
    var realParts = null;
    try {
      if (typeof genImgClickSequence === 'function' && icst.bgData && icst.zones && icst.zones.length) {
        var _icBareme = parseFloat((document.getElementById('ic-bareme') || {}).value) || 1;
        var _icFbOk = (document.getElementById('ic-fb-ok') || {}).value || '';
        var _icFbWr = (document.getElementById('ic-fb-wrong') || {}).value || '';
        realParts = genImgClickSequence(1, _icBareme, richVal('ic-text'), _icFbOk, _icFbWr);
      }
    } catch (e) { console.error('[preview] imgclick sequence build error:', e); realParts = null; }

    if (realParts && realParts.kbdRaw) {
      var boardId = 'icLiveBoard';
      var dims = (realParts.textFrag || '').match(/width="(\d+)px" height="(\d+)px"/);
      var dispW = dims ? parseInt(dims[1], 10) : 480;
      var dispH = dims ? parseInt(dims[2], 10) : 360;
      exampleHTML = '<div id="' + boardId + '" style="position:relative;width:100%;max-width:' + dispW + 'px;aspect-ratio:' + dispW + '/' + dispH + ';margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
        + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
        + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; '
        + 'var stack_jxg = { bind_point: function(){} }; var refAns1; '
        + realParts.kbdRaw
        + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
    } else {
      exampleHTML = '<p style="color:#94a3b8;font-style:italic;">Chargez une image et ajoutez au moins une zone (onglet Config) pour voir l\'aperçu interactif.</p>';
    }
  } else {
    var realPartsSingle = null;
    try {
      if (typeof genImgClick === 'function' && icst.bgData && icst.zones && icst.zones.length) {
        realPartsSingle = genImgClick(1);
      }
    } catch (e) { console.error('[preview] imgclick single build error:', e); realPartsSingle = null; }

    if (realPartsSingle && realPartsSingle.kbdRaw) {
      var boardIdS = 'icLiveBoardSingle';
      var dimsS = (realPartsSingle.textFrag || '').match(/width="(\d+)px" height="(\d+)px"/);
      var dispWS = dimsS ? parseInt(dimsS[1], 10) : 480;
      var dispHS = dimsS ? parseInt(dimsS[2], 10) : 360;
      exampleHTML = '<div id="' + boardIdS + '" style="position:relative;width:100%;max-width:' + dispWS + 'px;aspect-ratio:' + dispWS + '/' + dispHS + ';margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
        + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
        + '<script>(function(){ try { var divid = ' + JSON.stringify(boardIdS) + '; '
        + 'var stack_jxg = { bind_point: function(){} }; var ans1; '
        + realPartsSingle.kbdRaw
        + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardIdS) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
    } else {
      exampleHTML = '<p style="color:#94a3b8;font-style:italic;">Chargez une image et posez la zone (onglet Config) pour voir l\'aperçu interactif.</p>';
    }
  }
  return _hsSimplePreviewHTML({
    badge: 'Sélection sur image', badgeColor: '#047C6A', noteBg: '#f0fdfa', noteColor: '#0f766e',
    prefix: 'ic', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : cliquer sur la bonne zone de l\'image.</em></p>'),
    exampleHTML: exampleHTML,
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.icRefreshPreview = _hsWireSimplePreview('imgclick', 'ic', 'ic-preview-container', 'fp-imgclick', renderPreviewHTML_imgclick, true);

// {@expr@} : jetons STACK non calculables côté JS (ex: {@pct_1@} dans le
// feedback faux) — affichés en <code> plutôt que laissés bruts, même
// principe simplifié que _oscTokenizeStack pour l'oscilloscope.
function _jdTokenizeStack(html) {
  return String(html || '').replace(/\{@\s*([\s\S]+?)\s*@\}/g, function (full, expr) {
    return '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">' + String(expr).replace(/</g, '&lt;') + '</code>';
  });
}

function renderPreviewHTML_jxgdrop(state) {
  var jd = window._jdState || {};
  var realParts = null;
  try {
    if (typeof genJxgDrop === 'function' && jd.bgData && jd.proposals && jd.proposals.length && jd.zones && jd.zones.length) {
      realParts = genJxgDrop(1);
    }
  } catch (e) { console.error('[preview] jxgdrop build error:', e); realParts = null; }

  var boardId = 'jdLiveBoard';
  var exampleHTML;
  if (realParts && realParts.kbdRaw) {
    var dims = (realParts.textFrag || '').match(/width="(\d+)px" height="(\d+)px"/);
    var dispW = dims ? parseInt(dims[1], 10) : 480;
    var dispH = dims ? parseInt(dims[2], 10) : 448;
    var refStubs = '';
    for (var zi = 1; zi <= jd.zones.length; zi++) refStubs += 'var refAns1z' + zi + ';';
    // width:100% + une hauteur fixe en px déforme l'image dès que le conteneur
    // réel est plus étroit que dispW (cas courant du panneau de config) —
    // aspect-ratio garde les proportions quelle que soit la largeur rendue.
    exampleHTML = '<div id="' + boardId + '" style="position:relative;width:100%;max-width:' + dispW + 'px;aspect-ratio:' + dispW + '/' + dispH + ';margin:0 auto;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;background:#fff;"></div>'
      + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
      + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; '
      + 'var stack_jxg = { bind_point: function(){} }; ' + refStubs + ' '
      + realParts.kbdRaw
      + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">Erreur JSXGraph : " + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
  } else {
    exampleHTML = '<p style="color:#94a3b8;font-style:italic;">Chargez une image de fond, ajoutez au moins une proposition et une zone de dépôt pour voir l\'aperçu interactif.</p>';
  }

  var node0 = realParts && realParts.prt && realParts.prt.nodes && realParts.prt.nodes[0];

  return _hsSimplePreviewHTML({
    badge: 'Glisser-Déposer JSXGraph', badgeColor: '#d97706', noteBg: '#fffbeb', noteColor: '#92400e',
    prefix: 'jd', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : glisser les propositions vers les bonnes zones.</em></p>'),
    exampleLabel: '',
    exampleHTML: exampleHTML,
    fbOk: node0 ? _jdTokenizeStack(node0.truefeedback) : '',
    fbWrong: node0 ? _jdTokenizeStack(node0.falsefeedback) : '',
    fbGenAuto: realParts ? realParts.solutionImg : '',
    fbGen: state.fbGen
  });
}
window.jdRefreshPreview = _hsWireSimplePreview('jxgdrop', 'jd', 'jd-preview-container', 'fp-jxgdrop', renderPreviewHTML_jxgdrop, true);

function renderPreviewHTML_ord(state) {
  var rows = document.querySelectorAll('#ord-items .ord-row');
  var items = [];
  rows.forEach(function(r){ var t=r.querySelector('.ord-item-text'); if(t&&t.value.trim()) items.push(t.value.trim()); });
  var listHTML;
  if (items.length) {
    var chips = items.map(function(it){ return '<div style="background:#fbbf24;color:#78350f;padding:6px 10px;border-radius:4px;margin-bottom:4px;font-size:.9rem;">' + it.replace(/</g,'&lt;') + '</div>'; }).join('');
    listHTML = '<div style="display:flex;gap:14px;flex-wrap:wrap;">'
      + '<div style="flex:1;min-width:160px;">'
      + '<div style="font-weight:700;font-size:.82rem;color:#475569;border-bottom:2px solid #cbd5e1;padding-bottom:4px;margin-bottom:8px;">Déposez vos éléments ici :</div>'
      + '<div style="min-height:40px;border:1px dashed #cbd5e1;border-radius:6px;"></div>'
      + '</div>'
      + '<div style="flex:1;min-width:160px;">'
      + '<div style="font-weight:700;font-size:.82rem;color:#9a6a00;border-bottom:2px solid #fbbf24;padding-bottom:4px;margin-bottom:8px;">Glissez à partir d\'ici :</div>'
      + chips
      + '</div>'
      + '</div>';
  } else {
    listHTML = '<p style="color:#94a3b8;font-style:italic;">Ajoutez des éléments dans l\'onglet Config pour afficher l\'aperçu.</p>';
  }
  return _hsSimplePreviewHTML({
    badge: 'Classement', badgeColor: '#be185d', noteBg: '#fdf2f8', noteColor: '#9d174d',
    prefix: 'ord', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : remettre les éléments dans le bon ordre.</em></p>'),
    exampleHTML: listHTML,
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
}
window.ordRefreshPreview = _hsWireSimplePreview('ord', 'ord', 'ord-preview-container', 'fp-ord', renderPreviewHTML_ord);

function renderPreviewHTML_chemical(state) {
  var realParts = {};
  try { realParts = (typeof genChemical === 'function') ? genChemical(1) : {}; } catch (e) { realParts = {}; }
  var prtBoxes = _hsPrtBoxes(realParts);
  var diagNodes = (realParts.diagNodes || []).map(function(n) { return { desc: n.desc, fb: n.fb }; });
  // genChemical() embarque désormais lui-même l'encart "réponse attendue" dans
  // generalFeedback (voir js/gen-topo.js, fin de genChemical) — c'est ce même champ
  // qui part dans le XML exporté via js/app.js. On l'affiche tel quel ici, sans le
  // reconstruire séparément, pour ne jamais diverger de l'export réel.
  var fbGenAutoHTML = realParts.generalFeedback ? _hsRenderMath(realParts.generalFeedback) : '';
  return _hsSimplePreviewHTML({
    badge: 'Équation Chimique', badgeColor: '#2F855E', noteBg: '#f0fdf4', noteColor: '#166534',
    prefix: 'chem', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p style="color:#b91c1c;"><em>⚠️ Aucun énoncé saisi — l\'élève ne verra aucune consigne au-dessus de l\'éditeur d\'équation. Rédigez l\'énoncé (ex. "Écrire l\'équation de combustion du méthane").</em></p>'),
    exampleLabel: 'Ce que voit l\'élève (zone de saisie vide, il compose sa propre équation) :',
    exampleHTML: '<div style="text-align:left;">'
      + '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">'
      + '<span style="background:#34495e;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">x₂ Indice</span>'
      + '<span style="background:#34495e;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">xⁿ Exposant</span>'
      + '<span style="background:#27ae60;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">→ Flèche</span>'
      + '</div>'
      + '<div style="border:2px solid #34495e;border-radius:8px;padding:12px;min-height:40px;background:#fff;color:#94a3b8;font-style:italic;">(l\'élève écrit ici sa réaction — aucune équation n\'est pré-remplie)</div>'
      + '</div>',
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbOk: prtBoxes.okFb, fbWrong: prtBoxes.wrongFb,
    fbGenAuto: fbGenAutoHTML,
    extraFeedbackNodes: diagNodes
  });
}
window.chemRefreshPreview = _hsWireSimplePreview('chemical', 'chem', 'chem-preview-container', 'fp-chemical', renderPreviewHTML_chemical);

// Miroir des 7 nœuds PRT de genChemicalTopo (js/gen-topo.js, canonicalNodes) — texte
// des descriptions/feedbacks recopié tel quel, car genChemicalTopo() est async
// (capture des canvases SmilesDrawer) et ne peut pas être appelé de façon synchrone
// ici comme genChemical()/genNuclear() le sont pour leur propre aperçu.
function _topoDiagNodes() {
  var X = '';
  return [
    { description: 'Fleche',
      truefeedback: '<p><span style="color: green; font-weight: bold;">✓ Bonne flèche de réaction !</span></p>',
      falsefeedback: '<p><span style="color: red; font-weight: bold;">✗ Mauvaise flèche.</span> Détectée : {@ans_arrow_det' + X + '@}, attendue : {@tans_arrow' + X + '@}</p>' },
    { description: 'Bilan atomes',
      truefeedback: '<p><span style="color: green; font-weight: bold;">✓ Votre réaction est équilibrée du point de vue des éléments chimiques !</span></p>',
      falsefeedback: '<p><span style="color: #cc2222; font-weight: bold;">✗ Votre réaction n\'est pas équilibrée du point des éléments chimiques !</span></p>' },
    { description: 'Charges',
      truefeedback: '<p><span style="color: green;">✓ Votre équation est équilibrée électriquement.</span></p>',
      falsefeedback: '<p><span style="color: red;">✗ Les charges ne sont pas conservées dans votre réaction.</span> Réactifs : {@charge_rea_s' + X + '@}, Produits : {@charge_pro_s' + X + '@}</p>' },
    { description: 'Formules',
      truefeedback: '<p><span style="color: green;">✓ Vos formules sont correctes !</span></p>',
      falsefeedback: '<p><span style="color: red;">✗ Vos formules sont incorrectes.</span></p>' },
    { description: 'Groupes',
      truefeedback: '<p><span style="color: orange;">⚠ Bonne compréhension du type de réaction.</span></p>',
      falsefeedback: '<p><span style="color: red;">✗ Groupes fonctionnels non reconnus.</span></p>' },
    { description: 'Coefficients',
      truefeedback: '<p><span style="color: green;">✓ Vos coefficients stœchiométriques sont corrects !</span></p>',
      falsefeedback: '<p><span style="color: #cc2222;">✗ Vos coefficients stœchiométriques sont incorrects !</span></p>' },
    { description: 'Coefs prop', sans: 'is_proportional' + X, tans: 'true',
      truefeedback: '<p><span style="color: orange;">⚠ Coefficients proportionnels (k={@k_ratio' + X + '@}) mais non réduits.</span></p>',
      falsefeedback: '<p><span style="color: red;">✗ Coefficients non proportionnels.</span></p>' }
  ];
}

// Capture synchrone de #topo-preview-area (déjà dessiné par topoOnInput() pendant la
// saisie) pour l'encart "réaction attendue" de l'aperçu Feedback général — même
// principe que capturedHtml dans genChemicalTopo (gen-topo.js), mais sans setTimeout
// puisqu'on est appelé après coup sur un canvas déjà peint, pas juste inséré.
function _topoCaptureAnswerHTML() {
  var pa = document.getElementById('topo-preview-area');
  if (!pa || !pa.children.length) return '';
  var cl = pa.cloneNode(true);
  var canvases = pa.querySelectorAll('canvas');
  var cloneCanvases = cl.querySelectorAll('canvas');
  canvases.forEach(function (cv, i) {
    try {
      var img = document.createElement('img');
      img.src = cv.toDataURL('image/png');
      img.width = cv.width; img.height = cv.height;
      cloneCanvases[i].replaceWith(img);
    } catch (e) {}
  });
  return '<div style="margin-top:10px;padding:10px;background:#f8f8f8;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">' + cl.innerHTML + '</div>';
}

function renderPreviewHTML_topo(state) {
  var topoNodes = _topoDiagNodes();
  var prtBoxes = _hsPrtBoxes({ prt: { nodes: topoNodes } });
  var extraNodes = [];
  topoNodes.forEach(function (n, i) {
    var isFirst = i === 0, isLast = i === topoNodes.length - 1;
    if (!isFirst && n.truefeedback) extraNodes.push({ desc: n.description + ' (succès)', fb: n.truefeedback });
    if (!isLast && n.falsefeedback) extraNodes.push({ desc: n.description + ' (échec)', fb: n.falsefeedback });
  });
  var widgetHTML = '<div style="font-family:sans-serif;background:#fff;border:1px solid #d1d8dd;border-radius:8px;padding:15px;margin-top:10px;">'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">'
    + '<button type="button" disabled style="padding:8px 14px;border:none;border-radius:8px;background:#334155;color:#fff;font-weight:700;font-size:.85rem;font-family:inherit;">' + I18N.t('tpl.topo_btn_total') + '</button>'
    + '<button type="button" disabled style="padding:8px 14px;border:none;border-radius:8px;background:#334155;color:#fff;font-weight:700;font-size:.85rem;font-family:inherit;">' + I18N.t('tpl.topo_btn_equilibrium') + '</button>'
    + '<button type="button" disabled style="padding:8px 14px;border:none;border-radius:8px;background:#334155;color:#fff;font-weight:700;font-size:.85rem;font-family:inherit;">' + I18N.t('tpl.topo_btn_add') + '</button>'
    + '<button type="button" disabled style="padding:8px 14px;border:none;border-radius:8px;background:#8e44ad;color:#fff;font-weight:700;font-size:.85rem;font-family:inherit;">' + I18N.t('tpl.topo_btn_molecule') + '</button>'
    + '</div>'
    + '<div style="border:2px solid #3498db;min-height:45px;font-size:1.15rem;padding:12px;border-radius:5px;margin-bottom:15px;font-family:monospace;background:#fdfdfd;color:#94a3b8;">&nbsp;</div>'
    + '<div style="background:#fcfcfc;border:1px solid #eee;border-radius:5px;padding:12px;min-height:80px;"></div>'
    + '</div>';
  return _hsSimplePreviewHTML({
    badge: 'Chimie Topologique', badgeColor: '#8f2b33', noteBg: '#fef2f2', noteColor: '#8f2b33',
    prefix: 'topo', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : compléter la réaction (structures moléculaires).</em></p>') + widgetHTML,
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbOk: prtBoxes.okFb, fbWrong: prtBoxes.wrongFb,
    fbGenAuto: '<p><strong>' + I18N.t('tpl.vf_sol_reaction_was') + ' :</strong></p>' + _topoCaptureAnswerHTML(),
    fbGen: state.fbGen,
    extraFeedbackNodes: extraNodes
  });
}
window.topoRefreshPreview = _hsWireSimplePreview('chemical_topo', 'topo', 'topo-preview-container', 'fp-chemical_topo', renderPreviewHTML_topo);

function renderPreviewHTML_nuclear(state) {
  var realParts = {};
  try { realParts = (typeof genNuclear === 'function') ? genNuclear(1) : {}; } catch (e) { realParts = {}; }
  var prtBoxes = _hsPrtBoxes(realParts);
  var diagNodes = (realParts.diagNodes || []).map(function(n) { return { desc: n.desc, fb: n.fb }; });
  // genNuclear() embarque désormais lui-même l'encart "réponse attendue" dans
  // generalFeedback (voir js/gen-nuclear.js, fin de genNuclear) — c'est ce même champ
  // qui part dans le XML exporté via js/app.js. On l'affiche tel quel ici, sans le
  // reconstruire séparément, pour ne jamais diverger de l'export réel.
  var fbGenAutoHTML = realParts.generalFeedback ? _hsRenderMath(realParts.generalFeedback) : '';
  // L'élève ne voit PAS le rendu KaTeX de la réaction modèle (ça, c'est réservé au
  // panneau Config enseignant) : le [[jsxgraph]] exporté (buildNuclearJSXCode) lui
  // affiche une zone d'édition VIDE avec la même barre d'outils de particules —
  // donc l'aperçu doit mimer cette interface vide, pas la réponse (même logique que
  // renderPreviewHTML_chemical, cf. exampleHTML).
  var nucIsotopeChip = '<span style="background:#2980b9;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;display:inline-flex;align-items:center;gap:1px;">'
    + '<span style="display:inline-flex;flex-direction:column;line-height:.75;font-size:.7em;text-align:left;"><span>A</span><span>Z</span></span>X</span>';
  var nucChips = nucIsotopeChip + [
    ['+', '#7f8c8d'], ['→', '#7f8c8d'], ['*', '#8e44ad'],
    ['α', '#c0392b'], ['γ', '#27ae60'], ['β⁻', '#e67e22'], ['β⁺', '#e67e22'],
    ['e⁺', '#d35400'], ['e⁻', '#8e44ad'], ['n', '#f39c12'], ['p', '#e74c3c'], ['ν', '#7f8c8d']
  ].map(function(c) { return '<span style="background:' + c[1] + ';color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">' + c[0] + '</span>'; }).join('');
  return _hsSimplePreviewHTML({
    badge: 'Réaction Nucléaire', badgeColor: '#5b21b6', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'nuc', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p style="color:#b91c1c;"><em>⚠️ Aucun énoncé saisi — l\'élève ne verra aucune consigne au-dessus de l\'éditeur de réaction. Rédigez l\'énoncé (ex. "Compléter la réaction de fission de l\'uranium 235").</em></p>'),
    exampleLabel: 'Ce que voit l\'élève (zone de saisie vide, il compose sa propre réaction) :',
    exampleHTML: '<div style="text-align:left;">'
      + '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' + nucChips + '</div>'
      + '<div style="border:2px solid #34495e;border-radius:8px;padding:12px;min-height:40px;background:#fff;color:#94a3b8;font-style:italic;">(l\'élève écrit ici sa réaction — aucune réaction n\'est pré-remplie)</div>'
      + '</div>',
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbOk: prtBoxes.okFb, fbWrong: prtBoxes.wrongFb,
    fbGenAuto: fbGenAutoHTML,
    extraFeedbackNodes: diagNodes
  });
}
window.nucRefreshPreview = _hsWireSimplePreview('nuclear', 'nuc', 'nuc-preview-container', 'fp-nuclear', renderPreviewHTML_nuclear);

function renderPreviewHTML_comp(state) {
  return _hsSimplePreviewHTML({
    badge: 'Rédaction (correction manuelle)', badgeColor: '#6d28d9', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'comp', bareme: state.bareme || 4,
    text: _hsRenderMath(state.text || '<p><em>Rédigez ici l\'énoncé de la question.</em></p>'),
    exampleHTML: '<p style="padding:10px 14px;background:#f5f3ff;border:1.5px dashed #a78bfa;border-radius:8px;font-size:.82rem;color:#5b21b6;text-align:center;">📝 Éditeur de réponse élève (visible dans Moodle uniquement)</p>',
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
}
window.compRefreshPreview = _hsWireSimplePreview('composition', 'comp', 'comp-preview-container', 'fp-composition', renderPreviewHTML_comp);

function renderPreviewHTML_cw(state) {
  try {
  var gridData = state.gridData;
  var placedWords = state.placedWords || [];

  var gridHTML = '';
  if (gridData && gridData.grid && gridData.maxX !== undefined) {
    gridHTML = '<div style="text-align:center;margin-bottom:16px;">' +
      (typeof renderCWGridHTMLEmpty === 'function'
        ? renderCWGridHTMLEmpty(gridData.grid, gridData.maxX, gridData.maxY)
        : '') +
      '</div>';
  } else {
    gridHTML = '<p style="color:#94a3b8;font-style:italic;margin-bottom:12px;">G\xe9n\xe9rez la grille dans l\'onglet Config pour afficher l\'aper\xe7u.</p>';
  }

  var defsHTML = '';
  if (placedWords.length > 0) {
    var horizWords = placedWords.filter(function(w){ return w.direction === 'H'; }).sort(function(a,b){ return a.number - b.number; });
    var vertWords  = placedWords.filter(function(w){ return w.direction === 'V'; }).sort(function(a,b){ return a.number - b.number; });
    if (horizWords.length > 0) {
      defsHTML += '<p style="font-weight:700;margin:8px 0 4px;">Horizontal</p><ul style="padding-left:1.2em;margin:0 0 10px;">';
      horizWords.forEach(function(w){ defsHTML += '<li style="margin-bottom:3px;"><strong>' + w.number + '.</strong> ' + (w.def || '') + '</li>'; });
      defsHTML += '</ul>';
    }
    if (vertWords.length > 0) {
      defsHTML += '<p style="font-weight:700;margin:8px 0 4px;">Vertical</p><ul style="padding-left:1.2em;margin:0 0 10px;">';
      vertWords.forEach(function(w){ defsHTML += '<li style="margin-bottom:3px;"><strong>' + w.number + '.</strong> ' + (w.def || '') + '</li>'; });
      defsHTML += '</ul>';
    }
  } else if ((state.rows || []).length > 0) {
    defsHTML = '<ul style="padding-left:1.2em;">' +
      state.rows.map(function(r){ return '<li><strong>' + (r.w||'').replace(/</g,'&lt;') + '</strong> — ' + (r.d||'') + '</li>'; }).join('') +
      '</ul>';
  } else {
    defsHTML = '<p style="color:#94a3b8;font-style:italic;">Ajoutez des mots pour afficher l\'aper\xe7u.</p>';
  }

  // Feedback général : grille complétée (styles inline pour l'iframe) + réponses
  var fbGenContent = '';
  if (gridData && gridData.grid && gridData.maxX !== undefined) {
    var BLUE = '#4095AD';
    var filledTable = '<table style="border-collapse:collapse;border:2px solid ' + BLUE + ';background:' + BLUE + ';display:inline-table;line-height:1;border-spacing:0;"><tbody>';
    for (var fy = 0; fy <= gridData.maxY; fy++) {
      filledTable += '<tr>';
      for (var fx = 0; fx <= gridData.maxX; fx++) {
        var fkey = fx + ',' + fy;
        var fcell = gridData.grid[fkey];
        if (fcell) {
          var fnum = fcell.number ? '<span style="position:absolute;top:1px;left:2px;font-size:9px;color:#333;font-weight:normal;line-height:1;font-family:Arial,sans-serif;">' + fcell.number + '</span>' : '';
          filledTable += '<td style="width:30px;height:30px;min-width:30px;background:#fff;border:1px solid #999;padding:0;position:relative;text-align:center;vertical-align:middle;font-weight:bold;font-size:.9rem;">' + fnum + (fcell.letter || '') + '</td>';
        } else {
          filledTable += '<td style="width:30px;height:30px;min-width:30px;background:' + BLUE + ';border:none;padding:0;"></td>';
        }
      }
      filledTable += '</tr>';
    }
    filledTable += '</tbody></table>';
    fbGenContent += '<div style="text-align:center;margin-bottom:14px;">' + filledTable + '</div>';
  }
  if (placedWords.length > 0) {
    var horizFb = placedWords.filter(function(w){ return w.direction === 'H'; }).sort(function(a,b){ return a.number - b.number; });
    var vertFb  = placedWords.filter(function(w){ return w.direction === 'V'; }).sort(function(a,b){ return a.number - b.number; });
    if (horizFb.length > 0) {
      fbGenContent += '<p style="font-weight:700;margin:6px 0 3px;">Horizontal</p><ul style="padding-left:1.2em;margin:0 0 8px;">';
      horizFb.forEach(function(w){ fbGenContent += '<li><strong>' + w.number + '.</strong> ' + (w.word||'') + (w.def ? ' — ' + w.def : '') + '</li>'; });
      fbGenContent += '</ul>';
    }
    if (vertFb.length > 0) {
      fbGenContent += '<p style="font-weight:700;margin:6px 0 3px;">Vertical</p><ul style="padding-left:1.2em;margin:0 0 8px;">';
      vertFb.forEach(function(w){ fbGenContent += '<li><strong>' + w.number + '.</strong> ' + (w.word||'') + (w.def ? ' — ' + w.def : '') + '</li>'; });
      fbGenContent += '</ul>';
    }
  }
  if (!fbGenContent) {
    fbGenContent = '<p style="color:#94a3b8;font-style:italic;">G\xe9n\xe9rez la grille pour afficher la solution.</p>';
  }

  return _hsSimplePreviewHTML({
    badge: 'Mots Crois\xe9s', badgeColor: '#c2410c', noteBg: '#fff7ed', noteColor: '#9a3412',
    prefix: 'cw', bareme: state.bareme || 10,
    text: gridHTML + defsHTML,
    hideExampleBox: true,
    fbGenAuto: fbGenContent,
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
  } catch(e) {
    return '<html><body style="font-family:sans-serif;padding:12px;color:#dc2626;"><strong>Erreur aperçu mots croisés :</strong><pre style="font-size:.8rem;white-space:pre-wrap;">' + String(e) + '</pre></body></html>';
  }
}
window.cwRefreshPreview = _hsWireSimplePreview('crossword', 'cw', 'cw-preview-container', 'fp-crossword', renderPreviewHTML_cw);

function renderPreviewHTML_doi(state) {
  var imgHTML = (typeof genDOIStudentPreviewHTML === 'function')
    ? genDOIStudentPreviewHTML()
    : '<p style="color:#94a3b8;font-style:italic;">Ajoutez des objets dans l\'onglet Config pour afficher l\'aperçu.</p>';
  var realParts = {};
  try { realParts = (typeof genDOI === 'function') ? genDOI(1) : {}; } catch (e) { realParts = {}; }
  return _hsSimplePreviewHTML({
    badge: 'Diagramme Objet-Interaction', badgeColor: '#78716c', noteBg: '#fafaf9', noteColor: '#57534e',
    prefix: 'doi', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p><em>Énoncé automatique : placer les objets et interactions dans les zones bleues.</em></p>'),
    exampleHTML: imgHTML,
    exampleLabel: '',
    fbOk: '', fbWrong: '',
    fbGenAuto: realParts.correctionImg || '<p style="color:#94a3b8;font-style:italic;">Ajoutez des objets dans l\'onglet Config pour afficher le schéma de correction.</p>',
    fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: n.fb };
    })
  });
}
window.doiRefreshPreview = _hsWireSimplePreview('doi', 'doi', 'doi-preview-container', 'fp-doi', renderPreviewHTML_doi);

function renderPreviewHTML_apn(state) {
  var realParts = {};
  try { realParts = (typeof genApn === 'function') ? genApn(1) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var prtBoxes = _hsPrtBoxes(realParts);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:170px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled placeholder="Choix (bouton radio)" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#6b7280;font-size:.82rem;">Les variables encore not\xe9es \\(q_{\\dots}\\) sont celles qui restent calcul\xe9es \xe0 l\'affichage r\xe9el (tirage al\xe9atoire) — les valeurs d\xe9j\xe0 d\xe9termin\xe9es sont affich\xe9es directement.</em></p>';
  return _hsSimplePreviewHTML({
    badge: 'Appareil photo', badgeColor: '#1e3a8a', noteBg: '#eff6ff', noteColor: '#1e3a8a',
    prefix: 'apn', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}
window.apnRefreshPreview = _hsWireSimplePreview('apn', 'apn', 'apn-preview-container', 'fp-apn', renderPreviewHTML_apn);
