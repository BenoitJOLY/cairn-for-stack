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

function renderPreviewHTML_radio(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const allVrais = state.vrais || [];
  const allFaux = state.faux || [];
  // state.realDrawn (tirage réellement effectué par Maxima pour un seed donné,
  // voir _raRefreshRealPreview plus bas) prime sur la simulation locale dès
  // qu'il est disponible — même gabarit HTML dans les deux cas.
  const { drawnVrai, drawnFaux } = state.realDrawn || _raSimulateDraw(allVrais, allFaux, state.xe);
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-radio .mpane.on') && document.querySelector('#fp-radio .mpane.on').id === 'ra-fb-gen'; } catch (e) {}

  // idx = position réelle dans allVrais/allFaux (pas la position dans le
  // sous-ensemble tiré) : nécessaire pour que le clic-pour-atteindre-le-champ
  // retrouve la bonne ligne même quand le tirage réel n'est pas contigu à
  // partir de l'index 0 (contrairement à la simulation).
  const options = [];
  if (drawnVrai) options.push({ p: drawnVrai, arr: 'vrais', idx: allVrais.indexOf(drawnVrai), isV: true });
  drawnFaux.forEach(function (p) { options.push({ p: p, arr: 'faux', idx: allFaux.indexOf(p), isV: false }); });

  const propsHTML = options.map(function (o) {
    return `
      <label class="hs-cb-row" data-ra-field="prop-text" data-ra-array="${o.arr}" data-ra-index="${o.idx}">
        <input type="radio" name="hs-ra-preview" disabled aria-label="Proposition ${o.idx + 1}">
        <span class="hs-cb-text">${_hsRenderMath(o.p.text || '')}</span>
      </label>`;
  }).join('');

  // Bordure/fond conservés en vert/rouge, texte en couleur neutre — voir
  // js/preview-checkbox.js (retour utilisateur 2026-07-28, même règle
  // étendue ici : aucun texte de feedback ne doit être coloré).
  const fbItemsHTML = options.map(function (o) {
    const col = o.isV ? 'green' : 'red';
    const bg = o.isV ? '#f0fdf4' : '#fef2f2';
    return `<div class="hs-clickable" data-ra-field="prop-fb" data-ra-array="${o.arr}" data-ra-index="${o.idx}" style="background:${bg};border-left:4px solid ${col};padding:7px;margin:3px 0">
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
    <span class="hs-preview-badge">${I18N.t('type.radio')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    <span class="hs-preview-note">${I18N.t('common.preview_choice_unique')}</span>
    <span class="hs-preview-note">${state.realDrawn ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge'))}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-ra-field="text">${text}</div>
    <div class="hs-cb-list">${propsHTML}</div>
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
//  ÉTAPE 3bis — BRANCHEMENT RADIO (même principe que checkbox)
// ══════════════════════════════════════════════════════
(function () {
  function updateRadioPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'radio') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('ra-preview-container');
    if (!container) return;
    var state = captureState();
    // Même logique que Checkbox (js/preview-checkbox.js) : épingler le dernier
    // tirage réel réussi pour qu'un événement sans rapport (barème, xe, autre
    // champ riche...) ne fasse pas disparaître l'aperçu réel affiché.
    if (_raLastRealDrawnIds) {
      var pinnedDrawn = _raResolveDrawnFromIds(_raLastRealDrawnIds, state.vrais || [], state.faux || []);
      if (pinnedDrawn) state.realDrawn = pinnedDrawn;
    }
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

  // ── APERÇU RÉEL (via Maxima) ──────────────────────────────────────
  // Même patron que Checkbox (js/preview-checkbox.js) : déclenché UNIQUEMENT
  // par un clic explicite sur "Nouveau tirage" (interroger Maxima à chaque
  // frappe fait scintiller l'aperçu) ; genPoolCore/genRadio partagent le même
  // format de tirage (ta<X>_all construit vrais puis faux, id 1-indexé) donc
  // le tirage réel se lit de la même façon dans
  // questioninputs.ans<X>.configuration.options.
  var _raPreviewSeed = null;
  var _raRealPreviewGen = 0;
  // Épinglé au dernier tirage réel réussi (ids 1-indexés, pas les objets props
  // eux-mêmes) — voir la même logique dans preview-checkbox.js.
  var _raLastRealDrawnIds = null;

  function _raEnsurePreviewSeed() {
    if (!_raPreviewSeed) _raPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _raPreviewSeed;
  }

  function _raSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('ra-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _raRealDrawnIds(renderRes, qid) {
    var ir = renderRes && renderRes.questioninputs && renderRes.questioninputs['ans' + qid];
    var options = ir && ir.configuration && ir.configuration.options;
    console.log('[cairnforstack][debug radio real-preview] ir.configuration =', ir && ir.configuration, '| options =', options);
    if (!options) return null;
    var ids = Object.keys(options).map(function (id) { return parseInt(id, 10); });
    return ids.length ? ids : null;
  }

  function _raResolveDrawnFromIds(ids, allVrais, allFaux) {
    if (!ids) return null;
    var combined = allVrais.concat(allFaux);
    var drawn = ids.map(function (id) { return combined[id - 1]; }).filter(Boolean);
    if (!drawn.length) return null;
    var drawnVrai = drawn.filter(function (p) { return allVrais.indexOf(p) !== -1; })[0] || null;
    var drawnFaux = drawn.filter(function (p) { return allFaux.indexOf(p) !== -1; });
    return { drawnVrai: drawnVrai, drawnFaux: drawnFaux };
  }

  async function _raRefreshRealPreview() {
    var qid = _activeQid;
    if (!qid || typeof currentType === 'undefined' || currentType !== 'radio') return;
    var gen = ++_raRealPreviewGen;

    var state;
    try { state = captureState(); } catch (e) { return; }

    _raSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var p = {
        type: 'radio', label: I18N.t('tpl.pool_label_radio'), text: state.text,
        Xe: state.xe, bareme: state.bareme,
        poolFbGen: state.fbGen, poolShowFb: state.fbGenShowFb,
        propsVrais: state.vrais || [], propsFaux: state.faux || []
      };
      var q = genPoolCore(qid, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(q), [_raEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _raRealPreviewGen) _raSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _raPreviewSeed);
      if (gen !== _raRealPreviewGen) return;

      var ids = _raRealDrawnIds(renderRes, qid);
      var realDrawn = _raResolveDrawnFromIds(ids, state.vrais || [], state.faux || []);
      if (!realDrawn) throw new Error('shape inattendue');

      _raLastRealDrawnIds = ids;
      state.realDrawn = realDrawn;
      var iframe = mountPreviewIframe('ra-preview-container', renderPreviewHTML_radio(state));
      if (iframe && !iframe.__hsClickWired) {
        iframe.__hsClickWired = true;
        iframe.addEventListener('load', function () { wireRadioPreviewClicks(iframe); });
      }
      _raSetRealPreviewStatus('', false);
    } catch (e) {
      if (gen !== _raRealPreviewGen) return;
      _raSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  // Bouton "🎲 Nouveau tirage" : change le seed puis interroge Maxima. Bouton
  // "👁️ Aperçu réel" : garde le seed courant (ou en crée un si aucun n'existe
  // encore) et ne fait que rafraîchir le rendu affiché (même patron que
  // Checkbox, retour utilisateur du 2026-07-27).
  function raRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'radio') return;
    _raPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _raRefreshRealPreview();
  }
  window.raRerollPreviewSeed = raRerollPreviewSeed;

  function raShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'radio') return;
    _raEnsurePreviewSeed();
    _raRefreshRealPreview();
  }
  window.raShowRealPreview = raShowRealPreview;

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
          _raPreviewSeed = null;
          _raLastRealDrawnIds = null;
          var rerollBtn = document.getElementById('ra-reroll-preview-btn');
          var showRealBtn = document.getElementById('ra-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _raSetRealPreviewStatus('', false);
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
