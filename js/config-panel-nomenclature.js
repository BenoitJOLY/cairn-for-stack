// config-panel-nomenclature.js — capture/restore/reset + mode selector pour le type "nomenclature"
// (chip unique, 3 modes internes Fixe/Aléatoire/Checkbox — cf. js/gen-nomenclature.js)

function _nomPopulateFamilies() {
  var sel = document.getElementById('nom-param-famille');
  var dl = document.getElementById('nom-familles-datalist');
  if (!sel && !dl) return;
  var fams = (typeof _nomFamilies === 'function') ? _nomFamilies() : [];
  if (sel) {
    var current = sel.value;
    sel.innerHTML = '<option value="Toutes">Toutes</option>';
    fams.forEach(function(f) {
      var opt = document.createElement('option');
      opt.value = f; opt.textContent = f;
      sel.appendChild(opt);
    });
    if (current && fams.indexOf(current) !== -1) sel.value = current;
  }
  if (dl) {
    dl.innerHTML = '';
    fams.forEach(function(f) {
      var opt = document.createElement('option');
      opt.value = f;
      dl.appendChild(opt);
    });
  }
}

function nomModeChange(mode) {
  var el = document.getElementById('nom-mode');
  if (el) el.value = mode;
  var sections = { fixe: 'nom-section-fixe', aleatoire: 'nom-section-aleatoire', checkbox: 'nom-section-checkbox' };
  Object.keys(sections).forEach(function(m) {
    var s = document.getElementById(sections[m]);
    if (s) s.style.display = (m === mode) ? '' : 'none';
  });
}

function captureState_nomenclature() {
  var s = { type: 'nomenclature' };
  s.bareme = v('nom-bareme'); s.text = richVal('nom-text');
  s.mode = v('nom-mode') || 'fixe';
  s.fixeSmiles = v('nom-fixe-smiles');
  s.fixeNom = v('nom-fixe-nom');
  s.fixeFamille = v('nom-fixe-famille');
  s.paramFamille = v('nom-param-famille') || 'Toutes';
  s.paramCarbonesMax = v('nom-param-carbones-max');
  s.cbSmiles = v('nom-cb-smiles');
  s.cbVrais = v('nom-cb-vrais');
  s.cbFaux = v('nom-cb-faux');
  s.fbGen = richVal('nom-fbgen');
  return s;
}

function restoreState_nomenclature(s) {
  _nomPopulateFamilies();
  document.getElementById('nom-bareme').value = s.bareme || 1;
  setRichVal('nom-text', s.text || '');
  document.getElementById('nom-mode').value = s.mode || 'fixe';
  document.querySelectorAll('input[name="nom-mode-radio"]').forEach(function(r) { r.checked = (r.value === (s.mode || 'fixe')); });
  document.getElementById('nom-fixe-smiles').value = s.fixeSmiles || 'CC(C)CC(C)(C)C';
  document.getElementById('nom-fixe-nom').value = s.fixeNom || '2,2,4-triméthylpentane';
  document.getElementById('nom-fixe-famille').value = s.fixeFamille || 'Alcanes';
  document.getElementById('nom-param-famille').value = s.paramFamille || 'Toutes';
  document.getElementById('nom-param-carbones-max').value = s.paramCarbonesMax || '';
  document.getElementById('nom-cb-smiles').value = s.cbSmiles || 'NC(CC(=O)O)C';
  document.getElementById('nom-cb-vrais').value = s.cbVrais || 'Amine, Acide carboxylique';
  document.getElementById('nom-cb-faux').value = s.cbFaux || 'Alcool, Aldéhyde, Ester';
  setRichVal('nom-fbgen', s.fbGen || '');
  nomModeChange(s.mode || 'fixe');
}

function resetForm_nomenclature() {
  _nomPopulateFamilies();
  setRichVal('nom-text', '');
  document.getElementById('nom-bareme').value = 1;
  document.getElementById('nom-mode').value = 'fixe';
  document.querySelectorAll('input[name="nom-mode-radio"]').forEach(function(r) { r.checked = (r.value === 'fixe'); });
  document.getElementById('nom-fixe-smiles').value = 'CC(C)CC(C)(C)C';
  document.getElementById('nom-fixe-nom').value = '2,2,4-triméthylpentane';
  document.getElementById('nom-fixe-famille').value = 'Alcanes';
  document.getElementById('nom-param-famille').value = 'Toutes';
  document.getElementById('nom-param-carbones-max').value = '';
  document.getElementById('nom-cb-smiles').value = 'NC(CC(=O)O)C';
  document.getElementById('nom-cb-vrais').value = 'Amine, Acide carboxylique';
  document.getElementById('nom-cb-faux').value = 'Alcool, Aldéhyde, Ester';
  setRichVal('nom-fbgen', '');
  nomModeChange('fixe');
}
