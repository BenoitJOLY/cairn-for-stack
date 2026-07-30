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

// Adapte le state de captureState_checkbox() vers la forme attendue par
// genCheckboxCore (p.bool est interpolé directement dans le Maxima généré :
// un booléen JS ou la chaîne "true"/"false" produisent le même texte, donc
// pas besoin de convertir isV → 'true'/'false').
function _cbStateToGenParams(state) {
  return {
    bareme: state.bareme, text: state.text,
    Xe: state.xe, mXb: state.mXb, Xb: state.xb,
    props: (state.props || []).map(function (p) { return { bool: p.isV, text: p.text, fb: p.fb, fb2: p.fb2 }; }),
    showOubli: state.showOubli,
    cbFbGen: state.fbGen, cbFbGenShowFb: state.fbGenShowFb
  };
}

// Les 3 issues réelles du PRT (nœuds 0/1 construits par genCheckboxCore, la
// même fonction pure utilisée pour l'export XML) : on appelle ce générateur
// directement (aucun accès DOM, aucun réseau) pour récupérer les VRAIS
// gabarits truefeedback/falsefeedback qui finiront dans le questionnaire
// Moodle, puis on substitue les seuls jetons Maxima ([[foreach...]], {@pct@},
// [[if...]]) par leur équivalent déjà calculé côté aperçu (fbItemsHTML).
// Remplace les anciens champs "Feedback si correct/incorrect" (cb-fbc/cb-fbe,
// retour utilisateur du 2026-07-27) : ces champs étaient un reliquat d'avant
// l'arbre PRT, jamais reliés au XML réel — l'enseignant les éditait pour rien.
function _cbScoreBannersHTML(state, fbItemsHTML) {
  try {
    const qid = (typeof _activeQid !== 'undefined' && _activeQid) || 'X';
    const nodes = genCheckboxCore(qid, _cbStateToGenParams(state)).prt.nodes;
    const itemsToken = /\[\[foreach item="fbl\d+"\]\]\{@item@\}\[\[\/foreach\]\]/;
    const pctToken = /\{@pct\d+@\}/;
    const oubliBlock = /\[\[if test="manques\d+ # \[\]"\][\s\S]*?\[\[\/if\]\]/;
    const node0True = nodes[0].truefeedback.replace(itemsToken, fbItemsHTML);
    const node1True = nodes[1].truefeedback.replace(itemsToken, fbItemsHTML).replace(pctToken, '…').replace(oubliBlock, '');
    const node1False = nodes[1].falsefeedback;
    return `<div style="font-size:.78rem;color:#64748b;margin:2px 0 6px 0;">${I18N.t('common.preview_score_banners_hint')}</div>${node0True}${node1True}${node1False}`;
  } catch (e) {
    return '';
  }
}

function renderPreviewHTML_checkbox(state) {
  const bareme = state.bareme || 0;
  const text = _hsRenderMath(state.text || '');
  const allProps = state.props || [];
  const showOubli = !!state.showOubli;
  // state.realDrawnProps (sous-ensemble réellement tiré par Maxima pour un seed
  // donné, voir _cbRefreshRealPreview plus bas) prime sur la simulation locale
  // dès qu'il est disponible — même gabarit HTML dans les deux cas, seule la
  // source du tirage change.
  const drawnProps = state.realDrawnProps || _cbSimulateDraw(allProps, state.xe, state.xb, state.mXb);
  let focusFbGen = false;
  try { focusFbGen = document.querySelector('#fp-checkbox .mpane.on') && document.querySelector('#fp-checkbox .mpane.on').id === 'cb-fb-gen'; } catch (e) {}

  // data-cb-index conserve l'index dans allProps (pas dans le sous-ensemble
  // tiré), pour retrouver la bonne ligne #cb-props même après le tirage.
  const propsHTML = drawnProps.map(function (p) {
    const idx = allProps.indexOf(p);
    return `
      <label class="hs-cb-row" data-cb-field="prop-text" data-cb-index="${idx}">
        <input type="checkbox" disabled aria-label="Proposition ${idx + 1}">
        <span class="hs-cb-text">${_hsRenderMath(p.text || '')}</span>
      </label>`;
  }).join('');

  const autoFbGenList = _cbAutoFbGenListHTML(drawnProps, !!state.fbGenShowFb);
  const fbGenHTML = `<div class="hs-clickable" data-cb-field="fbgen" style="border-left:4px solid #7c3aed;padding:10px 14px;background:#f5f3ff;border-radius:4px;margin:4px 0;">
    <p style="margin:0 0 4px 0;"><strong>${I18N.t('tpl.checkbox_bonnes_reponses')}</strong></p>
    <ul style="margin:4px 0 0 0;padding-left:1.4em;">${autoFbGenList}</ul>
    ${state.fbGen ? `<div style="margin-top:8px;">${_hsRenderMath(state.fbGen)}</div>` : ''}
  </div>`;

  // Texte en couleur neutre, mais bordure/fond conservés en vert/rouge :
  // contrairement au vrai feedback Maxima (fbl${X} dans genCheckboxCore), qui
  // ne liste QUE les cases cochées par l'élève et les colore selon la justesse
  // de CE choix, l'aperçu statique affiche TOUTES les propositions tirées sans
  // simuler de réponse — colorer le TEXTE vrai=vert/faux=rouge donnait donc
  // l'impression d'une correction même dans la bannière "100%", ce qu'un
  // élève ne verrait jamais réellement (retour utilisateur 2026-07-28).
  const fbItemsHTML = drawnProps.map(function (p) {
    const idx = allProps.indexOf(p);
    const col = p.isV ? 'green' : 'red';
    const bg = p.isV ? '#f0fdf4' : '#fef2f2';
    return `<div class="hs-clickable" data-cb-field="prop-fb" data-cb-index="${idx}" style="background:${bg};border-left:4px solid ${col};padding:7px;margin:3px 0">
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

  const fbBannersHTML = _cbScoreBannersHTML(state, fbItemsHTML);

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
    <span class="hs-preview-note">${state.realDrawnProps ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge'))}</span>
  </div>
  <div class="hs-main-block">
    <div class="hs-preview-text" data-cb-field="text">${text}</div>
    <div class="hs-cb-list">${propsHTML}</div>
    <button class="hs-validate-btn" disabled>${I18N.t('common.preview_validate_btn')}</button>

    <div class="hs-fb-section-title">${I18N.t('common.preview_fb_after_title')}</div>
    ${fbOubliHTML}
    ${fbBannersHTML}
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
  function _cbMountPreview(html) {
    var iframe = mountPreviewIframe('cb-preview-container', html);
    if (iframe && !iframe.__hsClickWired) {
      iframe.__hsClickWired = true;
      iframe.addEventListener('load', function () { wireCheckboxPreviewClicks(iframe); });
    }
    return iframe;
  }

  function updateCheckboxPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'checkbox') return;
    if (typeof captureState !== 'function') return;
    var container = document.getElementById('cb-preview-container');
    if (!container) return;
    var state = captureState();
    // Le tirage réel affiché (voir _cbRefreshRealPreview plus bas) doit rester
    // visible même quand cette fonction est déclenchée par un événement sans
    // rapport (barème, xe/xb, ajout de ligne, autre champ riche via
    // hsRegisterPreviewRefresher) — sinon il disparaît dès le prochain
    // rafraîchissement anodin, quelques ms après avoir été affiché (retour
    // utilisateur 2026-07-27 : "le nouveau tirage ne change rien"/"revient à
    // l'antérieur"). Recalculé contre les props ACTUELLES (pas des objets
    // gelés) pour rester valide si l'enseignant édite du texte entre-temps.
    if (_cbLastRealDrawnTexts) {
      var pinnedProps = _cbResolveDrawnFromTexts(_cbLastRealDrawnTexts, state.props || []);
      if (pinnedProps) state.realDrawnProps = pinnedProps;
    }
    _cbMountPreview(renderPreviewHTML_checkbox(state));

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

  // ── APERÇU RÉEL (via Maxima) ──────────────────────────────────────
  // Déclenché UNIQUEMENT par un clic explicite sur "Nouveau tirage"
  // (cbRerollPreviewSeed) : interroger Maxima à chaque frappe faisait
  // scintiller l'aperçu (remontage de l'iframe à chaque réponse réseau) —
  // retour utilisateur du 2026-07-27. L'aperçu simulé reste instantané et
  // automatique ; l'aperçu réel est un geste volontaire, jamais en fond.
  // _cbRealPreviewGen protège contre une réponse tardive d'un appel Maxima
  // devenu obsolète si l'utilisateur reclique avant la réponse précédente.
  var _cbPreviewSeed = null;
  var _cbRealPreviewGen = 0;
  // Épinglé aux textes du dernier tirage réel réussi (pas les objets props
  // eux-mêmes : voir _cbResolveDrawnFromTexts) — permet à
  // updateCheckboxPreview() de continuer à afficher le tirage réel quand un
  // événement sans rapport (barème, xe/xb, autre champ riche...) la redéclenche,
  // au lieu de revenir silencieusement à la simulation (retour utilisateur
  // 2026-07-27 : "nouveau tirage ne change rien" / flash puis retour à l'ancien).
  var _cbLastRealDrawnTexts = null;

  function _cbEnsurePreviewSeed() {
    if (!_cbPreviewSeed) _cbPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _cbPreviewSeed;
  }

  // Compare les textes en ignorant accents/casse/espaces : le texte renvoyé par
  // Maxima dans configuration.options a perdu ses accents (passage par
  // escapeMaximaString_D côté génération), donc une comparaison stricte avec
  // p.text (qui garde ses accents) échouerait toujours.
  function _cbNormalizeForMatch(s) {
    // Plage des diacritiques combinants Unicode U+0300-U+036F, construite via
    // fromCharCode (plutôt qu'un littéral ̀-ͯ dans une classe de
    // caractères) pour éviter toute ambiguïté d'encodage de ce fichier source.
    var diacritics = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g');
    return String(s || '')
      .normalize('NFD').replace(diacritics, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // Retrouve les propositions du pool (avec leur feedback, texte accentué, etc.)
  // correspondant aux textes réellement tirés par Maxima, EN CONSERVANT l'ordre
  // renvoyé (celui du random_permutation). Retourne null si aucune correspondance
  // (réponse inattendue / pool édité entre-temps) pour laisser l'appelant retomber
  // sur la simulation.
  function _cbResolveDrawnFromTexts(texts, allProps) {
    if (!texts) return null;
    var normalizedPool = allProps.map(function (p) { return _cbNormalizeForMatch(p.text); });
    var used = {};
    var drawn = texts.map(function (t) {
      var norm = _cbNormalizeForMatch(t);
      var idx = normalizedPool.indexOf(norm);
      while (idx >= 0 && used[idx]) idx = normalizedPool.indexOf(norm, idx + 1);
      if (idx < 0) return null;
      used[idx] = true;
      return allProps[idx];
    }).filter(Boolean);
    return drawn.length ? drawn : null;
  }

  function _cbSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('cb-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  // Retrouve, pour un rendu Maxima donné, les textes RÉELLEMENT tirés par
  // rand_selection/random_permutation, dans l'ordre d'affichage : questioninputs.
  // ans<qid>.configuration.options est une map clé → texte, mais la clé n'est PAS
  // l'id du pool utilisé pour construire ta<X>_all dans genCheckboxCore — c'est la
  // position d'affichage parmi les items tirés (1er, 2e... élément montré), donc
  // toujours ~1..Xe quel que soit le tirage. Utiliser cette clé pour ré-indexer le
  // pool local retombait donc systématiquement sur les mêmes premières propositions
  // du pool, peu importe le seed (bug confirmé avec l'utilisateur le 2026-07-28 :
  // "la première proposition est toujours la même" malgré un tirage réel qui change
  // bien côté serveur). On trie les clés numériquement pour retrouver l'ordre réel
  // d'affichage, puis on ré-associe chaque texte à sa proposition du pool par
  // contenu (voir _cbResolveDrawnFromTexts), pas par position.
  function _cbRealDrawnOptionTexts(renderRes, qid) {
    var ir = renderRes && renderRes.questioninputs && renderRes.questioninputs['ans' + qid];
    var options = ir && ir.configuration && ir.configuration.options;
    console.log('[stackforge][debug checkbox real-preview] ir.configuration =', ir && ir.configuration, '| options =', options);
    if (!options) return null;
    var keys = Object.keys(options).map(function (k) { return parseInt(k, 10); }).sort(function (a, b) { return a - b; });
    var texts = keys.map(function (k) { return options[k]; });
    return texts.length ? texts : null;
  }

  async function _cbRefreshRealPreview() {
    var qid = _activeQid;
    if (!qid || typeof currentType === 'undefined' || currentType !== 'checkbox') return;
    var gen = ++_cbRealPreviewGen;

    var state, p;
    try {
      state = captureState();
      p = _cbReadFormParams();
    } catch (e) { return; } // formulaire incomplet (ex. aucune proposition) : aperçu simulé laissé tel quel

    _cbSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var q = genCheckboxCore(qid, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(q), [_cbEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _cbRealPreviewGen) _cbSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _cbPreviewSeed);
      if (gen !== _cbRealPreviewGen) return; // réponse obsolète, une frappe plus récente a déjà relancé un appel

      var texts = _cbRealDrawnOptionTexts(renderRes, qid);
      var realDrawnProps = _cbResolveDrawnFromTexts(texts, state.props || []);
      if (!realDrawnProps) throw new Error('shape inattendue');

      _cbLastRealDrawnTexts = texts;
      state.realDrawnProps = realDrawnProps;
      state.realSeed = _cbPreviewSeed;
      _cbMountPreview(renderPreviewHTML_checkbox(state));
      _cbSetRealPreviewStatus('', false);
    } catch (e) {
      if (gen !== _cbRealPreviewGen) return;
      _cbSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  // Bouton "🎲 Nouveau tirage" : change le seed (nouveau tirage) puis interroge
  // Maxima. Bouton "👁️ Aperçu réel" : garde le seed courant (ou en crée un si
  // aucun n'existe encore) et ne fait que rafraîchir le rendu affiché — utile
  // après avoir édité le texte/les feedbacks sans vouloir changer le tirage
  // (retour utilisateur du 2026-07-27 : "nouveau tirage change le seed, vision
  // réelle garde le seed mais met à jour le texte").
  function cbRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'checkbox') return;
    _cbPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _cbRefreshRealPreview();
  }
  window.cbRerollPreviewSeed = cbRerollPreviewSeed;

  function cbShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'checkbox') return;
    _cbEnsurePreviewSeed();
    _cbRefreshRealPreview();
  }
  window.cbShowRealPreview = cbShowRealPreview;

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

    // Ouverture du panneau checkbox (openConfigPanel bascule fp.style.display) :
    // nouvelle session d'édition → nouveau tirage de seed pour l'aperçu réel,
    // et on affiche/masque le bouton "Nouveau tirage" selon que Maxima est
    // configuré ou non (aucun changement visible si Maxima n'est pas branché).
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _cbPreviewSeed = null;
          _cbLastRealDrawnTexts = null;
          var rerollBtn = document.getElementById('cb-reroll-preview-btn');
          var showRealBtn = document.getElementById('cb-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          if (rerollBtn) rerollBtn.style.display = configured ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _cbSetRealPreviewStatus('', false);
          setTimeout(updateCheckboxPreview, 0);
        }
      });
    }).observe(panel, { attributes: true });

    // Champs riches (cb-text, cb-fbgen, textes/feedbacks de propositions) :
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
