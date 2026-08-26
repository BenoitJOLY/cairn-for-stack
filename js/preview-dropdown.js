/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
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

function renderPreviewHTML_dropdown(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const allVrais = state.vrais || [];
  const allFaux = state.faux || [];
  // state.realDrawn (tirage réellement effectué par Maxima pour un seed donné,
  // voir _ddRefreshRealPreview plus bas) prime sur la simulation locale dès
  // qu'il est disponible — même gabarit HTML dans les deux cas.
  const { drawnVrai, drawnFaux } = state.realDrawn || _raSimulateDraw(allVrais, allFaux, state.xe);
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-dropdown .mpane.on') && document.querySelector('#fp-dropdown .mpane.on').id === 'dd-fb-gen'; } catch (e) {}

  // idx = position réelle dans allVrais/allFaux (pas la position dans le
  // sous-ensemble tiré) : nécessaire pour que le clic-pour-atteindre-le-champ
  // retrouve la bonne ligne même quand le tirage réel n'est pas contigu à
  // partir de l'index 0 (contrairement à la simulation).
  const options = [];
  if (drawnVrai) options.push({ p: drawnVrai, arr: 'vrais', idx: allVrais.indexOf(drawnVrai), isV: true });
  drawnFaux.forEach(function (p) { options.push({ p: p, arr: 'faux', idx: allFaux.indexOf(p), isV: false }); });

  // Un vrai <select>/<option> natif ne peut afficher que du texte brut (le
  // HTML/KaTeX y est ignoré par le navigateur). On utilise donc <details>/
  // <summary> : ouverture/fermeture 100% native (aucun script requis dans
  // l'iframe), mais le contenu des options reste du HTML normal, ce qui
  // permet le rendu KaTeX des formules.
  const selectOptionsHTML = options.map(function (o) {
    return `<div class="hs-dd-option" data-dd-array="${o.arr}" data-dd-index="${o.idx}">${_hsRenderMath(o.p.text || '')}</div>`;
  }).join('');

  // Bordure/fond conservés en vert/rouge, texte en couleur neutre — voir
  // js/preview-checkbox.js (retour utilisateur 2026-07-28).
  const fbItemsHTML = options.map(function (o) {
    const col = o.isV ? 'green' : 'red';
    const bg = o.isV ? '#f0fdf4' : '#fef2f2';
    return `<div class="hs-clickable" data-dd-field="prop-fb" data-dd-array="${o.arr}" data-dd-index="${o.idx}" style="background:${bg};border-left:4px solid ${col};padding:7px;margin:3px 0">
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
    <span class="hs-preview-badge">${I18N.t('type.dropdown')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${I18N.t('common.preview_choice_list')}</span>
    <span class="hs-preview-note">${state.realDrawn ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge'))}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-dd-field="text">${text}</div>
    <details class="hs-dd-select">
      <summary>${I18N.t('common.preview_choose_placeholder')}</summary>
      <div class="hs-dd-options">${selectOptionsHTML}</div>
    </details>
    <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

    <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
    ${fbItemsHTML}
  </div>
  <div class="hs-fbgen-block">
    <div class="hs-fb-section-title">${I18N.t('common.preview_fbgen_always_title')}</div>
    ${fbGenHTML}
  </div>
</body>
</html>`;
}


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
    // Même logique que Checkbox/Radio : épingler le dernier tirage réel réussi
    // pour qu'un événement sans rapport ne le fasse pas disparaître.
    if (_ddLastRealDrawnIds) {
      var pinnedDrawn = _ddResolveDrawnFromIds(_ddLastRealDrawnIds, state.vrais || [], state.faux || []);
      if (pinnedDrawn) state.realDrawn = pinnedDrawn;
    }
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

  // ── APERÇU RÉEL (via Maxima) ──────────────────────────────────────
  // Même patron que Radio (js/preview-radio.js) : genPoolCore/genDropdown
  // partagent le même format de tirage (ta<X>_all construit vrais puis faux,
  // id 1-indexé) donc le tirage réel se lit de la même façon dans
  // questioninputs.ans<X>.configuration.options.
  var _ddPreviewSeed = null;
  var _ddRealPreviewGen = 0;
  // Épinglé au dernier tirage réel réussi (ids 1-indexés, pas les objets props
  // eux-mêmes) — voir la même logique dans preview-checkbox.js.
  var _ddLastRealDrawnIds = null;

  function _ddEnsurePreviewSeed() {
    if (!_ddPreviewSeed) _ddPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _ddPreviewSeed;
  }

  function _ddSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('dd-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _ddRealDrawnIds(renderRes, qid) {
    var ir = renderRes && renderRes.questioninputs && renderRes.questioninputs['ans' + qid];
    var options = ir && ir.configuration && ir.configuration.options;
    console.log('[cairnforstack][debug dropdown real-preview] ir.configuration =', ir && ir.configuration, '| options =', options);
    if (!options) return null;
    var ids = Object.keys(options).map(function (id) { return parseInt(id, 10); });
    return ids.length ? ids : null;
  }

  function _ddResolveDrawnFromIds(ids, allVrais, allFaux) {
    if (!ids) return null;
    var combined = allVrais.concat(allFaux);
    var drawn = ids.map(function (id) { return combined[id - 1]; }).filter(Boolean);
    if (!drawn.length) return null;
    var drawnVrai = drawn.filter(function (p) { return allVrais.indexOf(p) !== -1; })[0] || null;
    var drawnFaux = drawn.filter(function (p) { return allFaux.indexOf(p) !== -1; });
    return { drawnVrai: drawnVrai, drawnFaux: drawnFaux };
  }

  async function _ddRefreshRealPreview() {
    var qid = _activeQid;
    if (!qid || typeof currentType === 'undefined' || currentType !== 'dropdown') return;
    var gen = ++_ddRealPreviewGen;

    var state;
    try { state = captureState(); } catch (e) { return; }

    _ddSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var p = {
        type: 'dropdown', label: I18N.t('tpl.pool_label_dropdown'), text: state.text,
        Xe: state.xe, bareme: state.bareme,
        poolFbGen: state.fbGen, poolShowFb: state.fbGenShowFb,
        propsVrais: state.vrais || [], propsFaux: state.faux || []
      };
      var q = genPoolCore(qid, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(q), [_ddEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _ddRealPreviewGen) _ddSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _ddPreviewSeed);
      if (gen !== _ddRealPreviewGen) return;

      var ids = _ddRealDrawnIds(renderRes, qid);
      var realDrawn = _ddResolveDrawnFromIds(ids, state.vrais || [], state.faux || []);
      if (!realDrawn) throw new Error('shape inattendue');

      _ddLastRealDrawnIds = ids;
      state.realDrawn = realDrawn;
      var iframe = mountPreviewIframe('dd-preview-container', renderPreviewHTML_dropdown(state));
      if (iframe && !iframe.__hsClickWired) {
        iframe.__hsClickWired = true;
        iframe.addEventListener('load', function () { wireDropdownPreviewClicks(iframe); });
      }
      _ddSetRealPreviewStatus('', false);
    } catch (e) {
      if (gen !== _ddRealPreviewGen) return;
      _ddSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  // Bouton "🎲 Nouveau tirage" : change le seed puis interroge Maxima. Bouton
  // "👁️ Aperçu réel" : garde le seed courant (ou en crée un si aucun n'existe
  // encore) et ne fait que rafraîchir le rendu affiché.
  function ddRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'dropdown') return;
    _ddPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _ddRefreshRealPreview();
  }
  window.ddRerollPreviewSeed = ddRerollPreviewSeed;

  function ddShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'dropdown') return;
    _ddEnsurePreviewSeed();
    _ddRefreshRealPreview();
  }
  window.ddShowRealPreview = ddShowRealPreview;

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
          _ddPreviewSeed = null;
          _ddLastRealDrawnIds = null;
          var rerollBtn = document.getElementById('dd-reroll-preview-btn');
          var showRealBtn = document.getElementById('dd-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _ddSetRealPreviewStatus('', false);
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
