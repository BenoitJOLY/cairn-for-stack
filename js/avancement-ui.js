// avancement-ui.js — contrôleur du panneau "Tableau d'avancement"
// (bascule mode teacher/follow_from + rafraîchissement de l'aperçu après
// ajout/suppression/réordonnancement d'une ligne d'espèce — ces mutations DOM
// programmatiques ne déclenchent pas les écouteurs input/change globaux posés
// par _hsWireSimplePreview sur le panneau, cf. addOrdRow/ordRefreshPreview).

function avModeToggle() {
  var mode = document.getElementById('av-mode') ? document.getElementById('av-mode').value : 'teacher';
  var wrap = document.getElementById('av-source-wrap');
  if (wrap) wrap.style.display = mode === 'follow_from' ? '' : 'none';
}

function avFormChange() {
  avModeToggle();
  if (typeof avRefreshPreview === 'function') avRefreshPreview();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { avModeToggle: avModeToggle, avFormChange: avFormChange };
}
