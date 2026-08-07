/*
 * StackForge — générateur de questions STACK pour Moodle
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
    iframe.title = 'Aperçu de la question';
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
    iframe.title = 'Aperçu de la question';
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
    wrongDesc: isSeparateFallback ? (last.description || '') : I18N.t('common.preview_fallback_desc'),
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
  if (!drawnVrai) return '<p style="margin:0;color:#94a3b8;">' + I18N.t('common.preview_no_correct_answer') + '</p>';
  return `<p style="margin:0 0 4px 0;"><strong>${I18N.t('common.preview_correct_answer_was')}</strong> ${_hsRenderMath(drawnVrai.text || '')}</p>
    ${showFb && drawnVrai.fb ? `<p style="margin:0;">${_hsRenderMath(drawnVrai.fb)}</p>` : ''}`;
}


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
    <p style="margin:0 0 4px 0;"><strong>${I18N.t('common.preview_expected_value')}</strong> <code>${state.val || '—'} ${state.unit || ''}</code></p>
    ${state.fbGen ? `<div style="margin-top:8px;">${_hsRenderMath(state.fbGen)}</div>` : ''}
  </div>`;

  // Le PRT réellement exporté (js/gen-units.js) ignore les champs fbc/fbe de
  // l'éditeur — 2 nœuds au feedback fixe (vérif. unité, puis vérif. valeur).
  // On affiche donc ici les 3 issues réelles plutôt que ces champs morts
  // (retour utilisateur 2026-08-06 : l'aperçu ne montrait aucun feedback).
  const unitLabel = state.unit || '—';
  const fbUniteKo = I18N.t('un.fb_unite_incorrecte', { unitvar: unitLabel }).replace(/\{@|@\}/g, '');
  const fbGlobalHTML = `
    <div>${applyFbBox('false', _hsRenderMath('<p>' + fbUniteKo + '</p>'))}</div>
    <div>${applyFbBox('true', _hsRenderMath('<p>' + I18N.t('un.fb_ok_complete') + '</p>'))}</div>
    <div>${applyFbBox('false', _hsRenderMath('<p>' + I18N.t('un.fb_wrong_valeur') + '</p>'))}</div>`;

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
    <span class="hs-preview-badge">${I18N.t('type.units')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-un-field="text">${text}</div>
    ${aideHTML ? `<div class="hs-alg-help">${aideHTML}</div>` : ''}
    ${kbdOn ? (typeof buildKbdPreviewHTML === 'function' ? buildKbdPreviewHTML() : `<div class="hs-alg-help" style="color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe;">⌨️ ${I18N.t('common.preview_kbd_note')}</div>`) : ''}
    <input class="hs-un-input" type="text" disabled placeholder="ex : 9.81*m/s^2">
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
    targetLabel = `Veq (${I18N.t('rx.preview_read_on_graph')}, ± ${tolVol} mL) ${I18N.t('rx.preview_then')} C₂ = ${c2Target.toFixed(4)} mol/L (± ${tolC} mol/L)`;
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
      <text x="${curX.toFixed(1)}" y="${(curY - 10).toFixed(1)}" font-size="11" font-weight="bold" fill="${curCol}" text-anchor="middle">▶ ${I18N.t('rx.preview_cursor_student')}</text>` : '';

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
    <div data-rx-field="fbc">${wrapFb(_hsRenderMath(state.fbOk || ('✅ <strong>' + I18N.t('rx.fb_ok_default') + '</strong>')), true)}</div>
    <div data-rx-field="fbe">${wrapFb(_hsRenderMath(state.fbWrong || ('❌ <strong>' + I18N.t('rx.fb_wrong_default') + '</strong>')), false)}</div>`;

  const fbGenHTML = `<div class="hs-clickable" data-rx-field="fbgen" style="border-left:4px solid #b91c1c;padding:10px 14px;background:#fee2e2;border-radius:4px;margin:4px 0;">${state.fbGen ? _hsRenderMath(state.fbGen) : '<span style="color:#475569;">' + I18N.t('common.preview_no_general_fb') + '</span>'}</div>`;

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
    <span class="hs-preview-badge">${I18N.t('type.redox')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${I18N.t('common.preview_jsx_not_replayable_cursor')}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-rx-field="text">${text}</div>
    ${svg}
    <div class="hs-rx-target"><strong>${I18N.t('common.preview_expected_answer')}</strong> ${targetLabel}</div>
    <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

    <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
    ${fbHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">${I18N.t('common.preview_fbgen_solution_title')}</div>
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

// Un tirage n'a de sens que si les variables Maxima de la question dépendent
// effectivement d'un appel aléatoire (rand/ri/random) — sinon rejouer le
// bouton "Nouveau tirage" produirait un rendu strictement identique (ex :
// Algébrique, dont la formule est intégralement saisie par l'enseignant).
function _hsHasRandomization(varsCode) {
  return /\b(rand|ri|random)\s*\(/.test(varsCode || '');
}

// Recalcule la visibilité des boutons "Nouveau tirage"/"Aperçu réel". Appelé à
// CHAQUE rendu (pas seulement à l'ouverture du panneau, cf. wireRealPreviewPanel)
// pour réagir immédiatement à un bascule fixe/aléatoire alors que le panneau est
// déjà ouvert (ex: Calcul, Complexes). `hasRandom` : booléen déjà calculé par
// l'appelant via _hsHasRandomization(varsCode).
function _hsUpdateRerollVisibility(prefix, hasRandom) {
  var rerollBtn = document.getElementById(prefix + '-reroll-preview-btn');
  var showRealBtn = document.getElementById(prefix + '-show-real-preview-btn');
  if (!rerollBtn && !showRealBtn) return;
  var configured = typeof maximaConfigured === 'function' && maximaConfigured();
  if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
  if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
}

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
    : (cfg.fbGen ? _hsRenderMath(cfg.fbGen) : '<span style="color:#475569;">' + I18N.t('common.preview_no_general_fb') + '</span>');
  const fbGenHTML = `<div class="hs-clickable" data-${cfg.prefix}-field="fbgen" style="border-left:4px solid ${cfg.badgeColor};padding:10px 14px;background:${cfg.noteBg};border-radius:4px;margin:4px 0;">${fbGenBody}</div>`;
  const fbOkDescHTML = cfg.fbOkDesc ? `<div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${_hsRenderMath(cfg.fbOkDesc)}</div>` : '';
  const fbWrongDescHTML = cfg.fbWrongDesc ? `<div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${_hsRenderMath(cfg.fbWrongDesc)}</div>` : '';
  // extraFeedbackNodes : PRT à noeuds de diagnostic multiples (ex: Base N) — chaque
  // noeud intermédiaire du PRT réel a son propre feedback figé, invisible dans le
  // gabarit standard à 2 boîtes (Ok/Faux). On les liste ici pour que rien ne reste
  // caché à l'enseignant dans l'aperçu.
  const extraNodesHTML = (cfg.extraFeedbackNodes && cfg.extraFeedbackNodes.length) ? `
    <div style="font-size:.75rem;color:#64748b;margin:10px 0 4px;font-weight:600;">${cfg.extraFeedbackNodesTitle || I18N.t('common.preview_other_diagnostics_title')}</div>
    ${cfg.extraFeedbackNodes.map(n => `<div style="font-size:.78rem;color:#64748b;font-style:italic;margin-bottom:2px;">${_hsRenderMath(n.desc || '')}</div>${_hsRenderMath(n.fb || '')}`).join('')}` : '';
  // fbBoxesPreWrapped : certains appelants (preview-basen.js, preview-inequation.js)
  // ont déjà encadré fbOk/fbWrong via applyFbBox() au point d'affichage (cf. js/fb-box.js) —
  // wrapFb() ré-encadrerait alors une seconde fois (boîte dans la boîte). Les autres
  // types (pas encore migrés vers applyFbBox) continuent de compter sur wrapFb() ici.
  const okWrongHTML = cfg.hideOkWrongBoxes ? '' : `
    <div data-${cfg.prefix}-field="fbc">${fbOkDescHTML}${cfg.fbBoxesPreWrapped ? _hsRenderMath(cfg.fbOk || FB_JUSTE_DEFAULT()) : wrapFb(_hsRenderMath(cfg.fbOk || FB_JUSTE_DEFAULT()), true)}</div>
    <div data-${cfg.prefix}-field="fbe">${fbWrongDescHTML}${cfg.fbBoxesPreWrapped ? _hsRenderMath(cfg.fbWrong || FB_FAUX_DEFAULT()) : wrapFb(_hsRenderMath(cfg.fbWrong || FB_FAUX_DEFAULT()), false)}</div>`;
  const fbHTML = `
    ${okWrongHTML}
    ${extraNodesHTML}
    ${cfg.hideFbGen ? '' : fbGenHTML}`;
  const bodyHTML = cfg.onlyFbGen ? `
  <div class="hs-fb-section-title">${I18N.t('common.preview_fbgen_solution_title')}</div>
  ${fbGenHTML}` : `
  <div class="hs-preview-text" data-${cfg.prefix}-field="text">${cfg.text}</div>
  ${cfg.hideExampleBox ? '' : `<div class="hs-example-box">${cfg.exampleLabel === '' ? '' : `<strong>${cfg.exampleLabel || I18N.t('common.preview_example_label_default')}</strong><br>`}${cfg.exampleHTML || '<em>' + I18N.t('common.preview_unavailable') + '</em>'}</div>`}
  <button class="hs-validate-btn" disabled>${I18N.t('common.preview_answer_btn')}</button>

  <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
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
  .hs-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
</head>
<body>
  <h1 class="hs-sr-only">${cfg.badge}</h1>
  <h2 class="hs-sr-only">${I18N.t('common.preview_fb_after_title')}</h2>
  <h3 class="hs-sr-only">${I18N.t('common.preview_fbgen_solution_title')}</h3>
  <div class="hs-preview-header">
    <span class="hs-preview-badge">${cfg.badge}</span>
    <span class="hs-preview-note">/ ${cfg.bareme} pt</span>
    ${cfg.extraHeaderNote ? `<span class="hs-preview-note">${cfg.extraHeaderNote}</span>` : ''}
  </div>
  ${bodyHTML}
</body>
</html>`;
}

// augmentState(state) : callback optionnel invoqué juste après captureState(),
// avant le rendu — permet à un type d'injecter des données figées hors de l'état
// du formulaire (ex: aperçu réel via Maxima, voir preview-inequation.js) sans
// dupliquer toute la logique de branchement DOM ci-dessous pour chaque type.
function _hsWireSimplePreview(typeName, prefix, containerId, panelId, renderFn, scripted, augmentState) {
  var mountFn = scripted ? mountPreviewIframeScripted : mountPreviewIframe;
  function update() {
    if (typeof currentType === 'undefined' || currentType !== typeName) return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById(containerId);
    if (!container) return;
    try {
      var state = captureState();
      if (typeof augmentState === 'function') { try { augmentState(state); } catch (e) {} }
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
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-hidden="true" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.physique'), badgeColor: '#7f1d1d', noteBg: '#fff1f2', noteColor: '#7f1d1d',
    prefix: 'phy', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen
  });
}
window.phyRefreshPreview = _hsWireSimplePreview('physique', 'phy', 'phy-preview-container', 'fp-physique', renderPreviewHTML_physique);








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
  try { realParts = (typeof genAcideBaseCore === 'function') ? genAcideBaseCore(1, genAcideBaseParams()) : {}; } catch (e) { realParts = {}; console.error('[preview] acide-base build error:', e); }
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/\[\[iframe[\s\S]*?\[\[\/iframe\]\]/, '<!--HS-AB-GRAPHIC-->')
    .replace(/\[\[jsxgraph[\s\S]*?\[\[\/jsxgraph\]\]/, '<!--HS-AB-GRAPHIC-->')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-hidden="true" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioParts = bodyFrag.split('<!--HS-AB-GRAPHIC-->');
  var textBefore = scenarioParts[0] ? _hsRenderMath(scenarioParts[0]) : '<p><em>' + I18N.t('ab.preview_statement_placeholder') + '</em></p>';
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
      + '<script>(function(){ try { var divid = ' + JSON.stringify(boardId) + '; ' + jsBody + ' } catch(e){ var el=document.getElementById(' + JSON.stringify(boardId) + '); if(el) el.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.8rem;white-space:pre-wrap;\\">" + ' + JSON.stringify(I18N.t('common.preview_jsxgraph_error_prefix')) + ' + String(e && e.message || e).replace(/</g,"&lt;") + "<\\/p>"; console.error(e); } })();<\/script>';
  }
  if (textAfter) exampleHTML += '<div style="margin-top:10px;">' + textAfter + '</div>';
  exampleHTML = '<div style="background:#fef9c3;border:1px solid #eab308;color:#713f12;font-size:.78rem;padding:6px 10px;border-radius:6px;margin-bottom:10px;">' + I18N.t('ab.preview_sim_visual_only_warning') + '</div>' + exampleHTML;

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.acide-base'), badgeColor: '#15803d', noteBg: '#d1fae5', noteColor: '#065f46',
    prefix: 'ab', bareme: state.bareme || 1,
    text: textBefore,
    exampleLabel: '',
    exampleHTML: exampleHTML,
    hideOkWrongBoxes: true,
    extraFeedbackNodesTitle: I18N.t('ab.preview_prt_feedback_title'),
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
      badge: I18N.t('type.circuit'), badgeColor: '#c2410c', noteBg: '#fff7ed', noteColor: '#9a3412',
      prefix: 'cir', bareme: state.bareme || 1,
      text: '<p><em style="color:#6b7280;">' + I18N.t('cir.preview_no_model_placeholder') + '</em></p>',
      hideExampleBox: true, hideOkWrongBoxes: true,
      fbGenAuto: '', fbGen: state.fbGen
    });
  }
  // L'\xe9l\xe8ve part toujours d'un board vierge (le circuit mod\xe8le n'est jamais
  // transmis c\xf4t\xe9 \xe9l\xe8ve, ni ici en aper\xe7u ni r\xe9ellement dans Moodle).
  return cirBuildAtelierHTML({ mode: 'student-preview', initialStateB64: '' });
}
window.cirRefreshPreview = _hsWireSimplePreview('circuit', 'cir', 'cir-preview-container', 'fp-circuit', renderPreviewHTML_circuit, true);


function renderPreviewHTML_rvbcmj(state) {
  var filteredEl = document.getElementById('rvb-preview-filtered');
  var rawDataEl = document.getElementById('rvb-imgdata');
  var exampleHTML = (filteredEl && filteredEl.innerHTML) ? filteredEl.innerHTML
    : (rawDataEl && rawDataEl.value ? '<img src="' + rawDataEl.value + '" style="max-width:100%;border-radius:8px;">' : '');
  // Reflète genFbDefault de js/gen-optique.js (image originale sans filtre,
  // toujours ajoutée au feedback général réel) pour que l'aperçu ne mente pas.
  var fbGenAuto = (rawDataEl && rawDataEl.value)
    ? '<p>' + I18N.t('rvb.genfb_text') + '</p><p><img src="' + rawDataEl.value + '" alt="' + I18N.t('rvb.genfb_alt') + '" style="max-width:600px;border-radius:6px;"></p>'
    : '';
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.rvbcmj'), badgeColor: '#7E22CE', noteBg: '#faf5ff', noteColor: '#581c87',
    prefix: 'rvb', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>' + I18N.t('rvb.preview_placeholder') + '</em></p>'),
    exampleHTML: _hsRenderMath(exampleHTML),
    fbGenAuto: fbGenAuto,
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.rvbRefreshPreview = _hsWireSimplePreview('rvbcmj', 'rvb', 'rvb-preview-container', 'fp-rvbcmj', renderPreviewHTML_rvbcmj);

function renderPreviewHTML_optique(state) {
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.optique'), badgeColor: '#0369a1', noteBg: '#f0f9ff', noteColor: '#0c4a6e',
    prefix: 'opt', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>' + I18N.t('opt.preview_placeholder') + '</em></p>'),
    exampleHTML: '<p style="color:#475569;font-style:italic;">' + I18N.t('opt.preview_jsxgraph_note') + '</p>',
    fbOk: state.fbOk, fbWrong: state.fbWrong, fbGen: state.fbGen
  });
}
window.optRefreshPreview = _hsWireSimplePreview('optique', 'opt', 'opt-preview-container', 'fp-optique', renderPreviewHTML_optique);

function renderPreviewHTML_diffraction(state) {
  var liveEl = document.getElementById('diff-preview');
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.diffraction'), badgeColor: '#4338ca', noteBg: '#f5f3ff', noteColor: '#4c1d95',
    prefix: 'diff', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>' + I18N.t('diff.preview_statement_placeholder') + '</em></p>'),
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
    modeLabel = I18N.t('osc.mode_periode_frequence');
  } else if (mode === 'rc_charge' || mode === 'rc_decharge') {
    var decharge = (mode === 'rc_decharge');
    var evVal = parseFloat(state.evoltBase) || 2000;
    var tauVal = parseFloat(state.tauBase) || 1000;
    jsxBlock = buildOscJSXCode_RC({ si: svIdx, ti: shIdx, evExpr: String(evVal), tauExpr: String(tauVal), decharge: decharge });
    modeLabel = decharge ? I18N.t('osc.mode_decharge_rc') : I18N.t('osc.mode_charge_rc');
  } else {
    var fcVal = parseFloat(state.fcarrier) || 4000000;
    var dtMinVal = parseFloat(state.dtMin) || 4;
    var dtMaxVal = parseFloat(state.dtMax) || 8;
    var dtSec = ((dtMinVal + dtMaxVal) / 2) * 0.000001;
    var svIdxB = Math.min(OSC_SV.length - 1, svIdx + 1);
    jsxBlock = buildOscJSXCode_Retard({ siA: svIdx, siB: svIdxB, ti: shIdx, fcExpr: String(fcVal), dtExpr: String(dtSec) });
    modeLabel = I18N.t('osc.mode_retard_ultrasonore');
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
    : '<p style="color:#94a3b8;font-style:italic;">' + I18N.t('osc.preview_jsxgraph_build_failed') + '</p>';

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
  try { realParts = (typeof genOscilloscopeCore === 'function') ? genOscilloscopeCore(1, genOscilloscopeParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';

  // Consigne fixe + questions numérotées (1. Période, 2. Fréquence…) : sans elles,
  // les feedbacks de nœuds n'ont aucun contexte dans l'aperçu.
  var fakeInputStyle = 'padding:4px 8px;border:1px solid #94a3b8;border-radius:5px;font-size:.9rem;background:#f8fafc;color:#94a3b8;width:110px;';
  var rawTextFrag = realParts.textFrag || '';
  var consigneMatch = rawTextFrag.match(/<!-- ENONCE-START -->\s*<div[^>]*>\s*(<p>[\s\S]*?<\/p>)/);
  var consigneHTML = consigneMatch ? consigneMatch[1] : '';
  var afterJsx = rawTextFrag.split(/<!--HS-KBD:\d+-->/).slice(1).join('');
  var questionsHTML = afterJsx
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-hidden="true" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '')
    .replace(/\[\[feedback:[^\]]+\]\]/g, '');
  var questionsBlockHTML = _hsRenderMath(_oscTokenizeStack(consigneHTML + questionsHTML));
  if (questionsBlockHTML.trim()) {
    exampleHTML += '<div style="margin-top:10px;">' + questionsBlockHTML + '</div>';
  }
  var extraFeedbackNodes = ((realParts.prt && realParts.prt.nodes) || []).map(function(n) {
    var fb = (n.truefeedback ? '<div><strong>' + I18N.t('common.preview_if_correct') + ':</strong> ' + _oscTokenizeStack(n.truefeedback) + '</div>' : '')
      + (n.falsefeedback ? '<div><strong>' + I18N.t('common.preview_if_wrong') + ':</strong> ' + _oscTokenizeStack(n.falsefeedback) + '</div>' : '');
    return { desc: n.description, fb: fb };
  }).filter(function(n) { return n.fb; });

  return _hsSimplePreviewHTML({
    badge: I18N.t('type.oscilloscope') + ' — ' + live.modeLabel, badgeColor: '#0c4a6e', noteBg: '#eff6ff', noteColor: '#1e3a5f',
    prefix: 'osc', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || '<p><em>' + I18N.t('osc.preview_statement_placeholder') + '</em></p>'),
    exampleLabel: '',
    exampleHTML: exampleHTML,
    fbOk: state.fbOk, fbWrong: state.fbWrong,
    fbGenAuto: _hsRenderMath(_oscTokenizeStack(realGeneralFeedback)),
    fbGen: state.fbGen,
    extraFeedbackNodes: extraFeedbackNodes
  });
}
window.oscRefreshPreview = _hsWireSimplePreview('oscilloscope', 'osc', 'osc-preview-container', 'fp-oscilloscope', renderPreviewHTML_oscilloscope, true);





function renderPreviewHTML_chemical(state) {
  var realParts = {};
  try { realParts = (typeof genChemicalCore === 'function') ? genChemicalCore(1, genChemicalParams(1)) : {}; } catch (e) { realParts = {}; }
  var prtBoxes = _hsPrtBoxes(realParts);
  var diagNodes = (realParts.diagNodes || []).map(function(n) { return { desc: n.desc, fb: n.fb }; });
  // genChemical() embarque désormais lui-même l'encart "réponse attendue" dans
  // generalFeedback (voir js/gen-topo.js, fin de genChemical) — c'est ce même champ
  // qui part dans le XML exporté via js/app.js. On l'affiche tel quel ici, sans le
  // reconstruire séparément, pour ne jamais diverger de l'export réel.
  var fbGenAutoHTML = realParts.generalFeedback ? _hsRenderMath(realParts.generalFeedback) : '';
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.chemical'), badgeColor: '#2F855E', noteBg: '#f0fdf4', noteColor: '#166534',
    prefix: 'chem', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p style="color:#b91c1c;"><em>' + I18N.t('chem.preview_no_text_warning') + '</em></p>'),
    exampleLabel: I18N.t('chem.preview_example_label'),
    exampleHTML: '<div style="text-align:left;">'
      + '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">'
      + '<span style="background:#34495e;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">x₂ ' + I18N.t('tpl.chem_btn_indice') + '</span>'
      + '<span style="background:#34495e;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">xⁿ ' + I18N.t('tpl.chem_btn_exposant') + '</span>'
      + '<span style="background:#15803d;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">→ ' + I18N.t('tpl.chem_desc_fleche') + '</span>'
      + '</div>'
      + '<div style="border:2px solid #34495e;border-radius:8px;padding:12px;min-height:40px;background:#fff;color:#475569;font-style:italic;">' + I18N.t('chem.preview_editor_placeholder') + '</div>'
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
  // Texte en couleur neutre — la bordure/fond de l'encadré (wrapFb/applyFbBox,
  // vert=vrai/rouge=faux) suffit déjà à indiquer le sens du feedback (retour
  // utilisateur 2026-08-06, même règle que js/preview-checkbox.js).
  var X = '';
  return [
    { description: I18N.t('tpl.topo_desc_fleche'),
      truefeedback: '<p><strong>' + I18N.t('tpl.topo_fb_fleche_ok') + '</strong></p>',
      falsefeedback: '<p><strong>' + I18N.t('tpl.topo_fb_fleche_ko', { det: '{@ans_arrow_det' + X + '@}', att: '{@tans_arrow' + X + '@}' }) + '</strong></p>' },
    { description: I18N.t('tpl.topo_desc_atomes'),
      truefeedback: '<p><strong>' + I18N.t('tpl.topo_fb_atomes_ok') + '</strong></p>',
      falsefeedback: '<p><strong>' + I18N.t('tpl.topo_fb_atomes_ko') + '</strong></p>' },
    { description: I18N.t('tpl.topo_desc_charges'),
      truefeedback: '<p>' + I18N.t('tpl.topo_fb_charges_ok') + '</p>',
      falsefeedback: '<p>' + I18N.t('tpl.topo_fb_charges_ko', { rea: '{@charge_rea_s' + X + '@}', pro: '{@charge_pro_s' + X + '@}' }) + '</p>' },
    { description: I18N.t('tpl.topo_desc_formules'),
      truefeedback: '<p>' + I18N.t('tpl.topo_fb_formules_ok') + '</p>',
      falsefeedback: '<p>' + I18N.t('tpl.topo_fb_formules_ko', { rea: '{@nb_rea_s' + X + '@}', pro: '{@nb_pro_s' + X + '@}' }) + '</p>' },
    { description: I18N.t('tpl.topo_desc_groupes'),
      truefeedback: '<p>' + I18N.t('tpl.topo_fb_groupes_ok') + '</p>',
      falsefeedback: '<p>' + I18N.t('tpl.topo_fb_groupes_ko') + '</p>' },
    { description: I18N.t('tpl.topo_desc_coefficients'),
      truefeedback: '<p>' + I18N.t('tpl.topo_fb_coefs_ok') + '</p>',
      falsefeedback: '<p>' + I18N.t('tpl.topo_fb_coefs_ko') + '</p>' },
    { description: I18N.t('tpl.topo_desc_coefsprop'), sans: 'is_proportional' + X, tans: 'true',
      truefeedback: '<p>' + I18N.t('tpl.topo_fb_coefsprop_ok', { k: '{@k_ratio' + X + '@}' }) + '</p>',
      falsefeedback: '<p>' + I18N.t('tpl.topo_fb_coefsprop_ko') + '</p>' }
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
      img.alt = I18N.t('common.preview_reaction_diagram_alt');
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
    if (!isFirst && n.truefeedback) extraNodes.push({ desc: n.description + I18N.t('common.diag_success_suffix'), fb: n.truefeedback });
    if (!isLast && n.falsefeedback) extraNodes.push({ desc: n.description + I18N.t('common.diag_failure_suffix'), fb: n.falsefeedback });
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
    badge: I18N.t('type.chemical_topo'), badgeColor: '#8f2b33', noteBg: '#fef2f2', noteColor: '#8f2b33',
    prefix: 'topo', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p><em>' + I18N.t('topo.preview_statement_placeholder') + '</em></p>') + widgetHTML,
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
  try { realParts = (typeof genNuclearCore === 'function') ? genNuclearCore(1, _nucBuildParams()) : {}; } catch (e) { realParts = {}; }
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
  var nucIsotopeChip = '<span style="background:#0369a1;color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;display:inline-flex;align-items:center;gap:1px;">'
    + '<span style="display:inline-flex;flex-direction:column;line-height:.75;font-size:.7em;text-align:left;"><span>A</span><span>Z</span></span>X</span>';
  var nucChips = nucIsotopeChip + [
    ['+', '#475569'], ['→', '#475569'], ['*', '#8e44ad'],
    ['α', '#c0392b'], ['γ', '#15803d'], ['β⁻', '#b45309'], ['β⁺', '#b45309'],
    ['e⁺', '#9a3412'], ['e⁻', '#8e44ad'], ['n', '#92400e'], ['p', '#b91c1c'], ['ν', '#475569']
  ].map(function(c) { return '<span style="background:' + c[1] + ';color:#fff;padding:4px 10px;border-radius:4px;font-size:.8rem;">' + c[0] + '</span>'; }).join('');
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.nuclear'), badgeColor: '#5b21b6', noteBg: '#f5f3ff', noteColor: '#5b21b6',
    prefix: 'nuc', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p style="color:#b91c1c;"><em>' + I18N.t('nuc.preview_no_text_warning') + '</em></p>'),
    exampleLabel: I18N.t('nuc.preview_example_label'),
    exampleHTML: '<div style="text-align:left;">'
      + '<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' + nucChips + '</div>'
      + '<div style="border:2px solid #34495e;border-radius:8px;padding:12px;min-height:40px;background:#fff;color:#64748b;font-style:italic;">' + I18N.t('nuc.preview_editor_placeholder') + '</div>'
      + '</div>',
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbOk: prtBoxes.okFb, fbWrong: prtBoxes.wrongFb,
    fbGenAuto: fbGenAutoHTML,
    extraFeedbackNodes: diagNodes
  });
}
window.nucRefreshPreview = _hsWireSimplePreview('nuclear', 'nuc', 'nuc-preview-container', 'fp-nuclear', renderPreviewHTML_nuclear);



function renderPreviewHTML_doi(state) {
  var imgHTML = (typeof genDOIStudentPreviewHTML === 'function')
    ? genDOIStudentPreviewHTML()
    : '<p style="color:#94a3b8;font-style:italic;">' + I18N.t('doi.preview_no_objects') + '</p>';
  var realParts = {};
  try { realParts = (typeof genDOICore === 'function' && typeof _doiBuildParams === 'function') ? genDOICore(1, _doiBuildParams()) : {}; } catch (e) { realParts = {}; }
  return _hsSimplePreviewHTML({
    badge: I18N.t('badge.doi'), badgeColor: '#78716c', noteBg: '#fafaf9', noteColor: '#57534e',
    prefix: 'doi', bareme: state.bareme || 2,
    text: _hsRenderMath(state.text || '<p><em>' + I18N.t('doi.preview_auto_statement') + '</em></p>'),
    exampleHTML: imgHTML,
    exampleLabel: '',
    fbOk: '', fbWrong: '',
    fbGenAuto: realParts.correctionImg || '<p style="color:#94a3b8;font-style:italic;">' + I18N.t('doi.preview_no_objects_correction') + '</p>',
    fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: n.fb };
    })
  });
}
window.doiRefreshPreview = _hsWireSimplePreview('doi', 'doi', 'doi-preview-container', 'fp-doi', renderPreviewHTML_doi);

function renderPreviewHTML_apn(state) {
  var realParts = {};
  try { realParts = (typeof genApnCore === 'function' && typeof genApnParams === 'function') ? genApnCore(1, genApnParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  var prtBoxes = _hsPrtBoxes(realParts);
  // _hsPrtBoxes lit prt.nodes, désormais bruts (sans encadré, cf. js/fb-box.js) :
  // on applique l'encadré uniquement ici, au point d'affichage de l'aperçu.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:170px;';
  var bodyFrag = (realParts.textFrag || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled placeholder="Choix (bouton radio)" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
  var scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
    : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
  var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.apn'), badgeColor: '#1e3a8a', noteBg: '#eff6ff', noteColor: '#1e3a8a',
    prefix: 'apn', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(_calcTokenizeForPreview(realGeneralFeedback, knownVars) + note),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    fbBoxesPreWrapped: true,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: applyFbBox(n.kind, _calcTokenizeForPreview(n.fb, knownVars)) };
    })
  });
}
window.apnRefreshPreview = _hsWireSimplePreview('apn', 'apn', 'apn-preview-container', 'fp-apn', renderPreviewHTML_apn);
