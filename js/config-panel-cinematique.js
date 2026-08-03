// config-panel-cinematique.js — capture/restore/reset pour le type "cinematique"
// Suit le pattern de config-panel-oscilloscope.js. L'atelier de digitalisation (points
// cliqués + calibration) est géré par cinematique-ui.js (cinGetAtelierState/
// cinSetAtelierState), capturé/restauré ici comme un objet {points, calib} au même titre
// que le reste de l'état de la question. L'image de fond éventuelle n'est JAMAIS incluse
// ici : cinGetAtelierState() ne retourne que {points, calib}, jamais bgData/bgW/bgH — c'est
// la garde-fou technique de la contrainte utilisateur (l'image ne doit jamais être stockée).

function captureState_cinematique() {
  var s = { type: 'cinematique' };
  s.bareme = v('cin-bareme'); s.text = richVal('cin-text');
  s.dt = v('cin-dt') || '0.15';
  s.iIdx = v('cin-iidx') || '2';
  s.method = v('cin-method') || 'apres';
  var atelier = (typeof cinGetAtelierState === 'function') ? cinGetAtelierState() : { points: [], calib: null };
  s.points = atelier.points || [];
  s.calib = atelier.calib || null;
  s.fbGen = v('cin-fbgen');
  return s;
}

function restoreState_cinematique(s) {
  document.getElementById('cin-bareme').value = s.bareme || 1;
  setRichVal('cin-text', s.text || '');
  document.getElementById('cin-dt').value = s.dt || '0.15';
  document.getElementById('cin-iidx').value = s.iIdx || '2';
  var _cinMethod = document.getElementById('cin-method'); if (_cinMethod) _cinMethod.value = s.method || 'apres';
  var _cinFbGen = document.getElementById('cin-fbgen'); if (_cinFbGen) _cinFbGen.value = s.fbGen || '';
  if (typeof cinSetAtelierState === 'function') cinSetAtelierState({ points: s.points || [], calib: s.calib || null });
  if (typeof cinWireAtelier === 'function') cinWireAtelier();
}

function resetForm_cinematique() {
  setRichVal('cin-text', '');
  document.getElementById('cin-bareme').value = 1;
  document.getElementById('cin-dt').value = '0.15';
  document.getElementById('cin-iidx').value = '2';
  var _cinMethodReset = document.getElementById('cin-method'); if (_cinMethodReset) _cinMethodReset.value = 'apres';
  var _cinFbGenReset = document.getElementById('cin-fbgen'); if (_cinFbGenReset) _cinFbGenReset.value = '';
  if (typeof cinResetAtelier === 'function') cinResetAtelier();
  if (typeof cinWireAtelier === 'function') cinWireAtelier();
}
