// zscore-ui.js — contrôleur du panneau "Z-score" (bascule du champ seuil)
// L'aperçu iframe (js/preview-zscore.js) se rafraîchit tout seul sur tout
// événement input/change du panneau (cf. _hsWireSimplePreview) : ce fichier ne
// gère QUE l'affichage conditionnel du champ seuil (utile seulement si
// l'étape "conclusion" est cochée).

function zsConclusionToggle() {
  var checked = !!(document.getElementById('zs-step-conclusion') || {}).checked;
  var wrap = document.getElementById('zs-seuil-wrap');
  if (wrap) wrap.style.display = checked ? '' : 'none';
}

function zsFormChange() {
  zsConclusionToggle();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { zsConclusionToggle: zsConclusionToggle, zsFormChange: zsFormChange };
}
