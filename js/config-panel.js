// config-panel.js — V4 configuration panel: open/close, captureState, restoreState, resetForm, save

var _activeQid = null;

// ── MODAL VISIBILITY ──────────────────────────────────────────────
function openConfigPanel(qid, type) {
  _activeQid = qid;
  currentType = type;

  // Update modal title
  var titleEl = document.getElementById('config-panel-title');
  if (titleEl) {
    var color = COLORS[type] || '#64748b';
    var ico = TYPE_ICON_MAP ? (TYPE_ICON_MAP[type] || type) : type;
    titleEl.innerHTML = '<svg class="hs-ico" style="color:' + color + '" aria-hidden="true"><use href="#ico-type-' + ico + '"></use></svg> '
      + 'Q' + qid + ' &middot; ' + dataLabel(type).replace(/^[^\s]+\s/, '');
  }

  // Hide all form panels, show the correct one
  document.querySelectorAll('.form-panel').forEach(function(el) {
    el.style.display = 'none';
  });
  var fp = document.getElementById('fp-' + type);
  if (fp) fp.style.display = 'block';

  // Restore saved state or reset form
  var q = questions[qid];
  if (q && q.state) {
    restoreState(q.state);
  } else {
    resetFormForType(type);
  }

  // Montage du canvas enseignant de l'atelier circuits (iframe scriptée JSXGraph,
  // hors du flux générique _hsWireSimplePreview — le canvas n'est pas un aperçu
  // mais l'éditeur lui-même, il ne doit pas être remonté à chaque frappe).
  if (type === 'circuit' && typeof cirTeacherInit === 'function') {
    setTimeout(function() { cirTeacherInit(qid); }, 150);
  }

  // Rendu direct apercu crossword (bypass guards _hsWireSimplePreview)
  if (type === 'crossword') {
    setTimeout(function() {
      var _cwCont = document.getElementById('cw-preview-container');
      if (!_cwCont) { _cwCont = document.getElementById('cw-preview-container'); }
      try {
        var _cwHtml = renderPreviewHTML_cw(captureState());
        mountPreviewIframe('cw-preview-container', _cwHtml);
      } catch(_cwErr) {
        if (_cwCont) _cwCont.innerHTML = '<div style="font-family:sans-serif;padding:8px;color:#c00;font-size:.85rem;"><b>DEBUG:</b> ' + String(_cwErr) + '</div>';
      }
    }, 150);
  }

  // Open modal
  var modal = document.getElementById('q-config-modal');
  if (modal) {
    modal.classList.toggle('expert-fs', type === 'expert');
    modal.style.display = 'flex';
    if (typeof FocusTrap !== 'undefined') FocusTrap.trap(modal, closeConfigPanel);
    if (type === 'stack-raw' && typeof stackRawInit === 'function') {
      setTimeout(function(){ stackRawInit(qid); }, 0);
    } else if (type === 'expert' && typeof expertInit === 'function') {
      setTimeout(function(){ expertInit(qid); }, 0);
    } else if (fp) {
      var first = fp.querySelector('input:not([type=hidden]),select,textarea,[contenteditable]');
      if (first) setTimeout(function(){ try { first.focus(); } catch(e) {} }, 50);
    }
  }
}

function closeConfigPanel() {
  _activeQid = null;
  currentType = null;
  var modal = document.getElementById('q-config-modal');
  if (modal) { modal.style.display = 'none'; modal.classList.remove('expert-fs'); }
  if (typeof FocusTrap !== 'undefined') FocusTrap.release();
}

// ── GÉNÉRATION + STOCKAGE (partagé entre "Enregistrer" et "Arbre PRT") ──
// Recalcule la question depuis le formulaire courant et la stocke dans
// questions[qid], sans fermer le panneau. Retourne les parts générées, ou
// null si la génération a échoué (un toast d'erreur a déjà été affiché).
async function _generateAndStoreQuestion(qid, type) {
  if (!qid || !type) { toast('Aucune question active.'); return null; }

  if (typeof validateCurrentType === 'function' && !validateCurrentType()) {
    toast(I18N.t('msg.champs_obligatoires'));
    return null;
  }

  var W = window;
  var genMap = {
    checkbox: W.genCheckbox, radio: W.genRadio, dropdown: W.genDropdown,
    algebraic: W.genAlgebraic, numerical: W.genNumerical, units: W.genUnits,
    string: W.genString, match: W.genMatch, crossword: W.genCrossword, doi: W.genDOI,
    chemical: W.genChemical, chemical_topo: W.genChemicalTopo, nuclear: W.genNuclear,
    composition: W.genComposition, jxgdrop: W.genJxgDrop, vf: W.genVF, ord: W.genOrd,
    imgclick: W.genImgClick, rvbcmj: W.genRvbCmj, optique: W.genOptique, 'acide-base': W.genAcideBase, 'redox': W.genRedox, 'basen': W.genBasen, 'circuit': W.genCircuit, 'logique': W.genLogique, 'complexe': W.genComplexe, 'calcul': W.genCalcul, 'statistiques': W.genStatistiques, 'matrices': W.genMatrices, 'geometrie': W.genGeometrie, 'suites': W.genSuites, 'probabilites': W.genProbabilites, 'trigonometrie': W.genTrigonometrie, 'polynomes': W.genPolynomes, 'equivalence': W.genEquivalence, 'limites': W.genLimites, 'physique': W.genPhysique, 'oscilloscope': W.genOscilloscope, 'inequation': W.genInequation, 'diffraction': W.genDiffraction, 'image-mesure': W.genImageMesure, 'apn': W.genApn,
    'stack-raw': W.genStackRaw,
    'expert': W.genExpert,
    'geogebra': W.genGeoGebra,
    'nomenclature': W.genNomenclature,
    'incertitude': W.genIncertitude,
    'zscore': W.genZscore
  };

  var gen = genMap[type];
  if (!gen) { toast('❌ Générateur introuvable pour ' + type); return null; }

  var parts;
  try {
    parts = await gen(qid);
  } catch(e) {
    toast('❌ gen() : ' + e.message);
    console.error('_generateAndStoreQuestion gen() error:', e);
    return null;
  }

  if (!parts) { toast('❌ Le générateur a retourné undefined'); return null; }

  var state = captureState();
  questions[qid] = Object.assign({ id: qid, type: type }, parts, { state: state });

  updateChipStatus(qid, true);
  saveEditorState();
  return parts;
}

// ── SAVE ──────────────────────────────────────────────────────────
async function saveConfig() {
  try {
    var qid = _activeQid;
    var type = currentType;
    var parts = await _generateAndStoreQuestion(qid, type);
    if (!parts) return;
    toast('✅ Question Q' + qid + ' enregistrée (' + (parts.bareme || 0) + ' pt)');
    closeConfigPanel();
  } catch(e) {
    toast('❌ saveConfig : ' + e.message);
    console.error('saveConfig global error:', e);
  }
}

// ── ARBRE PRT depuis le panneau de config ───────────────────────────
// Le PRT est déjà du JSON généré en direct par le générateur (comme le
// reste de la question) : pas besoin d'un "Enregistrer" manuel préalable,
// on régénère silencieusement depuis le formulaire courant puis on ouvre
// l'éditeur d'arbre.
async function openPrtManagerFromConfig() {
  var qid = _activeQid;
  var type = currentType;
  if (!qid || !type) { toast('Aucune question active.'); return; }

  // stack-raw / expert gèrent déjà leur propre synchronisation PRT en direct.
  if (type === 'stack-raw' || type === 'expert') { openPrtManager(qid); return; }

  try {
    var parts = await _generateAndStoreQuestion(qid, type);
    if (!parts) return;
  } catch(e) {
    toast('❌ ' + e.message);
    console.error('openPrtManagerFromConfig error:', e);
    return;
  }
  openPrtManager(qid);
}

// ── DELETE ─────────────────────────────────────────────────────────
function deleteConfig() {
  var qid = _activeQid;
  if (!qid) return;
  if (!confirm(I18N.t('msg.confirm_del_q', {n: qid}))) return;
  removeChip(qid);
  saveEditorState();
  closeConfigPanel();
  toast('Question Q' + qid + ' supprimée.');
}

// ── CAPTURE / RESTORE / RESET : dispatch par type ────────────────────
// Chaque type de question a son propre module js/config-panel-<type>.js
// (voir index.html) qui expose captureState_<type>()/restoreState_<type>(s)/
// resetForm_<type>() — même découpage que preview.js -> preview-<type>.js.
// 'expert' garde son propre cycle (expertCaptureState/expertRestoreState/
// expertInit, dans expert-ui.js) ; 'stack-raw' n'a jamais eu de case ici
// (state géré entièrement par stackRawInit), donc aucun module dédié : le
// fallback silencieux ({type} nu / no-op) reproduit ce comportement.
function _cpModuleSuffix(type) {
  return type.replace(/-/g, '_');
}

function captureState() {
  var t = currentType;
  if (t === 'expert') {
    return (typeof expertCaptureState === 'function') ? expertCaptureState() : { type: t };
  }
  var fn = window['captureState_' + _cpModuleSuffix(t)];
  return fn ? fn() : { type: t };
}

function restoreState(s) {
  currentType = s.type;
  if (s.type === 'expert') {
    if (typeof expertRestoreState === 'function') expertRestoreState(s);
    return;
  }
  var fn = window['restoreState_' + _cpModuleSuffix(s.type)];
  if (fn) fn(s);
}

function resetFormForType(type) {
  if (type === 'expert') {
    if (typeof expertInit === 'function') expertInit(_activeQid);
    return;
  }
  var fn = window['resetForm_' + _cpModuleSuffix(type)];
  if (fn) fn();
}
