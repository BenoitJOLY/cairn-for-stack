/*
 * StackForge — générateur de questions STACK pour Moodle
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

// config-panel-nomenclature.js — capture/restore/reset + mode selector pour le type "nomenclature"
// (chip unique, 3 modes internes Fixe/Aléatoire/Checkbox — cf. js/gen-nomenclature.js)

// Cases à cocher famille (mode Aléatoire) : aucune coche = pas de filtre (= "Toutes").
function _nomGetCheckedFamilies() {
  var boxes = document.querySelectorAll('#nom-param-familles .nom-fam-chk:checked');
  return Array.prototype.map.call(boxes, function(b) { return b.value; });
}

function _nomSetCheckedFamilies(list) {
  var set = {};
  (list || []).forEach(function(f) { set[f] = true; });
  document.querySelectorAll('#nom-param-familles .nom-fam-chk').forEach(function(b) {
    b.checked = !!set[b.value];
  });
}

function _nomPopulateFamilies() {
  var wrap = document.getElementById('nom-param-familles');
  var dl = document.getElementById('nom-familles-datalist');
  if (!wrap && !dl) return;
  var fams = (typeof _nomFamilies === 'function') ? _nomFamilies() : [];
  if (wrap) {
    var current = _nomGetCheckedFamilies();
    wrap.innerHTML = '';
    fams.forEach(function(f) {
      var label = document.createElement('label');
      label.style.cssText = 'font-weight:normal;display:flex;align-items:center;gap:5px;white-space:nowrap;cursor:pointer;';
      var chk = document.createElement('input');
      chk.type = 'checkbox'; chk.className = 'nom-fam-chk'; chk.value = f;
      chk.checked = current.indexOf(f) !== -1;
      label.appendChild(chk);
      label.appendChild(document.createTextNode(' ' + f));
      wrap.appendChild(label);
    });
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

// Mode Fixe : SMILES/nom/famille sont 3 champs libres non reliés entre eux (l'enseignant
// peut dupliquer une question puis ne changer que le SMILES et oublier la famille). Si le
// SMILES saisi correspond à une molécule connue de NOM_DONNES, on avertit en cas d'écart.
function _nomCheckFixeFamille() {
  var warnEl = document.getElementById('nom-fixe-warn');
  var msgEl = document.getElementById('nom-fixe-warn-msg');
  if (!warnEl || !msgEl) return;
  var smiles = (v('nom-fixe-smiles') || '').trim();
  var famille = (v('nom-fixe-famille') || '').trim();
  var match = (typeof NOM_DONNES !== 'undefined') ? NOM_DONNES.find(function(m) { return m[2] === smiles; }) : null;
  if (match && famille && match[0] !== famille) {
    msgEl.textContent = I18N.t('nom.fixe_famille_warn', { nom: match[1], famille: match[0] });
    warnEl.style.display = 'block';
  } else {
    warnEl.style.display = 'none';
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
  s.paramFamilles = _nomGetCheckedFamilies();
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
  _nomCheckFixeFamille();
  // Compat rétro : anciennes sauvegardes avec un unique s.paramFamille (hors "Toutes").
  var fams = Array.isArray(s.paramFamilles) ? s.paramFamilles
    : (s.paramFamille && s.paramFamille !== 'Toutes' ? [s.paramFamille] : []);
  _nomSetCheckedFamilies(fams);
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
  _nomCheckFixeFamille();
  _nomSetCheckedFamilies([]);
  document.getElementById('nom-param-carbones-max').value = '';
  document.getElementById('nom-cb-smiles').value = 'NC(CC(=O)O)C';
  document.getElementById('nom-cb-vrais').value = 'Amine, Acide carboxylique';
  document.getElementById('nom-cb-faux').value = 'Alcool, Aldéhyde, Ester';
  setRichVal('nom-fbgen', '');
  nomModeChange('fixe');
}
