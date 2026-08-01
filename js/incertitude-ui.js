// incertitude-ui.js — contrôleur du panneau "Incertitude" (bascules Type A/B)
// L'aperçu iframe (js/preview-incertitude.js) se rafraîchit tout seul sur tout
// événement input/change du panneau (cf. _hsWireSimplePreview) : ce fichier ne
// gère QUE l'affichage conditionnel des sous-blocs Type A / Type B.

function incTypeAModeChange() {
  var mode = (document.querySelector('input[name="inc-typea-mode"]:checked') || {}).value || 'manuel';
  var manuelWrap = document.getElementById('inc-typea-manuel-wrap');
  var aleaWrap = document.getElementById('inc-typea-alea-wrap');
  if (manuelWrap) manuelWrap.style.display = (mode === 'manuel') ? '' : 'none';
  if (aleaWrap) aleaWrap.style.display = (mode === 'aleatoire') ? '' : 'none';
}

function incTypeBSourceChange() {
  var source = (document.getElementById('inc-typeb-source') || {}).value || 'resolution';
  var wraps = {
    resolution: document.getElementById('inc-typeb-resolution-wrap'),
    tolerance: document.getElementById('inc-typeb-tolerance-wrap'),
    calibration: document.getElementById('inc-typeb-calibration-wrap'),
    impose: document.getElementById('inc-typeb-impose-wrap'),
    propagation: document.getElementById('inc-typeb-propagation-wrap')
  };
  Object.keys(wraps).forEach(function (key) {
    if (wraps[key]) wraps[key].style.display = (key === source) ? '' : 'none';
  });
  if (source === 'propagation' && document.getElementById('inc-prop-body') && !document.getElementById('inc-prop-body').children.length) {
    incAddPropTerm(); incAddPropTerm();
  }
}

// Termes de la source Type B "propagation" : lignes dynamiques (valeur, incertitude,
// numérateur/dénominateur), même pattern que addCWRow (crossword-ui.js).
function incAddPropTerm(value, incert, denom) {
  var body = document.getElementById('inc-prop-body');
  if (!body) return;
  var row = document.createElement('div');
  row.className = 'inc-prop-row';
  row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap;';
  row.innerHTML =
    '<input type="number" class="inc-prop-value" step="any" placeholder="' + (I18N.t('inc.prop_value_ph') || 'Valeur') + '" style="width:100px;">' +
    '<input type="number" class="inc-prop-incert" step="any" min="0" placeholder="' + (I18N.t('inc.prop_incert_ph') || 'Incertitude') + '" style="width:110px;">' +
    '<label style="display:flex;align-items:center;gap:4px;font-size:.82rem;font-weight:600;cursor:pointer;">' +
      '<input type="checkbox" class="inc-prop-denom"> <span>' + (I18N.t('inc.prop_denom_lbl') || 'Au dénominateur') + '</span>' +
    '</label>' +
    '<button type="button" onclick="this.parentElement.remove()" style="background:#fee2e2;border:none;border-radius:4px;width:24px;height:24px;cursor:pointer;color:#dc2626;font-size:.7rem;">✕</button>';
  body.appendChild(row);
  row.querySelector('.inc-prop-value').value = (value != null) ? value : '';
  row.querySelector('.inc-prop-incert').value = (incert != null) ? incert : '';
  row.querySelector('.inc-prop-denom').checked = !!denom;
}

function incGetPropTerms() {
  var rows = document.querySelectorAll('#inc-prop-body .inc-prop-row');
  var terms = [];
  rows.forEach(function (row) {
    var value = row.querySelector('.inc-prop-value').value;
    var incert = row.querySelector('.inc-prop-incert').value;
    var denom = row.querySelector('.inc-prop-denom').checked;
    if (value !== '' && incert !== '') terms.push({ value: value, incert: incert, denom: denom });
  });
  return terms;
}

function incDisplayChange(mode) {
  var el = document.getElementById('inc-display');
  if (el) el.value = mode;
}

function incStudentToggle() {
  var enabled = !!(document.getElementById('inc-student-enabled') || {}).checked;
  var wrap = document.getElementById('inc-student-wrap');
  var kSelect = document.getElementById('inc-k');
  if (wrap) wrap.style.display = enabled ? '' : 'none';
  if (kSelect) kSelect.disabled = enabled;
}

function incMoyenneToleranceToggle() {
  var checked = !!(document.getElementById('inc-step-moyenne') || {}).checked;
  var wrap = document.getElementById('inc-moyenne-tolerance-wrap');
  if (wrap) wrap.style.display = checked ? '' : 'none';
}

function incFormChange() {
  incTypeAModeChange();
  incTypeBSourceChange();
  incStudentToggle();
  incMoyenneToleranceToggle();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    incTypeAModeChange: incTypeAModeChange, incTypeBSourceChange: incTypeBSourceChange, incStudentToggle: incStudentToggle,
    incMoyenneToleranceToggle: incMoyenneToleranceToggle, incFormChange: incFormChange,
    incAddPropTerm: incAddPropTerm, incGetPropTerms: incGetPropTerms, incDisplayChange: incDisplayChange
  };
}
