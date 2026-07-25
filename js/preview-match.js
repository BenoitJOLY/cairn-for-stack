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
  <div class="hs-fb-section-title">${I18N.t('common.preview_fbgen_solution_title')}</div>
  <div class="hs-clickable" data-match-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">${fbGenBody}</div>` : `
  <div class="hs-preview-text" data-match-field="text">${text}</div>
  <div class="hs-match-cols">
    <div class="hs-match-col">${colHTML(left, 'left')}</div>
    <div class="hs-match-col">${colHTML(right, 'right')}</div>
  </div>
  <button class="hs-validate-btn" disabled>${I18N.t('common.preview_answer_btn')}</button>

  <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
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
    <span class="hs-preview-badge">${I18N.t('type.match')}</span>
    <span class="hs-preview-note">/ ${bareme} pt</span>
    ${onlyFbGen ? '' : `<span class="hs-preview-note">${I18N.t('common.preview_jsx_not_replayable')}</span>`}
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
