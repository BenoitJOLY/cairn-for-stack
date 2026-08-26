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

// config-panel-avancement.js — capture/restore/reset pour le type "avancement"
// (Tableau d'avancement, Physique-Chimie) + addAvRow() : liste réordonnable
// des espèces (nom LaTeX, coefficient, rôle, quantité initiale, excès, solvant).
// Gabarit suivi pour le drag & drop : addOrdRow/wireOrdDrag (js/prop-rows.js).
// L'ordre des lignes est significatif en mode "follow_from" (doit reproduire
// l'ordre réactifs puis produits de la sous-question chimie précédente).

var AV_DEFAULTS = {
  bareme: 1, text: '', mode: 'teacher', sourceType: 'chemical_topo', sourceX: 1, fbGen: '',
  species: [
    { nom: 'H_2O_2', coeff: 2, role: 'reactif', n0: '0.20', exces: false, solvant: false },
    { nom: 'H^{+}', coeff: 2, role: 'reactif', n0: '0.5', exces: true, solvant: false },
    { nom: 'H_2O', coeff: 2, role: 'produit', n0: '0', exces: false, solvant: true },
    { nom: 'O_2', coeff: 1, role: 'produit', n0: '0', exces: false, solvant: false }
  ]
};

// _avLatexToHtml : inverse de _chemHtmlToLatexDisplay (js/gen-topo.js) — reconstruit
// le HTML <sub>/<sup> d'un nom d'espèce stocké en LaTeX (ex: "H_2O_2", "H^{+}") pour
// initialiser/restaurer l'éditeur de formule d'une ligne. Ne gère que le sous-ensemble
// _x/_{...} et ^x/^{...} produit par cette même paire de conversions (round-trip
// suffisant pour des formules chimiques simples ; pas un parseur LaTeX général).
function _avLatexToHtml(nom) {
  if (!nom) return '';
  var out = '', i = 0;
  while (i < nom.length) {
    var ch = nom[i];
    if (ch === '_' || ch === '^') {
      var tag = ch === '_' ? 'sub' : 'sup';
      i++;
      var content;
      if (nom[i] === '{') {
        var end = nom.indexOf('}', i);
        if (end === -1) { content = nom.slice(i + 1); i = nom.length; }
        else { content = nom.slice(i + 1, end); i = end + 1; }
      } else {
        content = nom[i] || ''; i++;
      }
      out += '<' + tag + '>' + htmlEsc(content) + '</' + tag + '>';
    } else {
      out += htmlEsc(ch); i++;
    }
  }
  return out;
}

function addAvRow(nom, coeff, role, n0, exces, solvant) {
  nom = nom !== undefined ? nom : '';
  coeff = coeff !== undefined ? coeff : 1;
  role = role || 'reactif';
  n0 = n0 !== undefined ? n0 : '0';
  exces = !!exces;
  solvant = !!solvant;

  var id = uid();
  var nomId = 'av-nom-' + id;
  var div = document.createElement('div');
  div.id = 'avr' + id;
  div.className = 'av-row';
  div.draggable = true;
  div.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 2px;border-bottom:1px dashed #e2e8f0;flex-wrap:wrap;';
  div.innerHTML =
    '<span class="ord-handle" title="' + (I18N.t('av.drag_hint') || 'Glisser pour réordonner') + '">⠿</span>'
    + '<span class="av-num" style="min-width:18px;font-size:.82rem;color:#64748b;"></span>'
    // Formule chimique : même mini-éditeur indice/exposant que le type "Chimie (Éq.)"
    // (js/gen-topo.js chemToggleSub/chemToggleSup, generalisées multi-instance) — un
    // professeur n'a pas à connaître la syntaxe LaTeX "H_2O_2" pour saisir H₂O₂.
    + '<span style="display:inline-flex;align-items:center;">'
    + '<div class="chem-editor-sm av-nom" id="' + nomId + '" contenteditable="true" spellcheck="false" data-ph="' + attrEsc(I18N.t('av.ph_nom_short') || 'ex: H₂O₂') + '" onkeydown="if(event.key===\'Enter\')event.preventDefault();" oninput="this.dispatchEvent(new Event(\'change\',{bubbles:true}))">' + _avLatexToHtml(nom) + '</div>'
    + '<span class="chem-toolbar-sm">'
    + '<button type="button" class="chem-btn-sm" data-chem-btn="sub" data-chem-target="' + nomId + '" tabindex="-1" title="' + (I18N.t('chem.indice_btn') || 'Indice') + '" onclick="chemToggleSub(\'' + nomId + '\')">x<sub>2</sub></button>'
    + '<button type="button" class="chem-btn-sm" data-chem-btn="sup" data-chem-target="' + nomId + '" tabindex="-1" title="' + (I18N.t('chem.expo_btn') || 'Expo') + '" onclick="chemToggleSup(\'' + nomId + '\')">x<sup>n</sup></button>'
    + '</span></span>'
    + '<input type="number" class="av-coeff" value="' + attrEsc(coeff) + '" min="1" step="1" title="' + (I18N.t('av.ph_coeff') || 'Coefficient stœchiométrique') + '" style="width:55px;">'
    + '<select class="av-role" onchange="if(typeof avFormChange===\'function\')avFormChange();">'
    + '<option value="reactif"' + (role === 'reactif' ? ' selected' : '') + '>' + (I18N.t('av.role_reactif') || 'Réactif') + '</option>'
    + '<option value="produit"' + (role === 'produit' ? ' selected' : '') + '>' + (I18N.t('av.role_produit') || 'Produit') + '</option>'
    + '</select>'
    + '<input type="text" class="av-n0" value="' + attrEsc(n0) + '" placeholder="n₀ (mol)" title="' + (I18N.t('av.ph_n0') || 'Quantité de matière initiale (mol)') + '" style="width:70px;">'
    + '<label class="av-chk-lbl" style="display:inline-flex;align-items:center;gap:3px;font-size:.8rem;white-space:nowrap;"><input type="checkbox" class="av-exces"' + (exces ? ' checked' : '') + ' onchange="if(typeof avFormChange===\'function\')avFormChange();"> ' + (I18N.t('av.lbl_exces') || 'excès') + '</label>'
    + '<label class="av-chk-lbl" style="display:inline-flex;align-items:center;gap:3px;font-size:.8rem;white-space:nowrap;"><input type="checkbox" class="av-solvant"' + (solvant ? ' checked' : '') + ' onchange="if(typeof avFormChange===\'function\')avFormChange();"> ' + (I18N.t('av.lbl_solvant') || 'solvant (masqué)') + '</label>'
    + '<button class="btn-del" onclick="document.getElementById(\'avr' + id + '\').remove();renumberAvRows();if(typeof avFormChange===\'function\')avFormChange();" aria-label="' + I18N.t('btn.supprimer') + '">✕</button>';

  document.getElementById('av-species').appendChild(div);
  wireAvDrag(div);
  if (typeof _chemWireEditor === 'function') _chemWireEditor(document.getElementById(nomId));
  renumberAvRows();
  if (typeof avFormChange === 'function') avFormChange();
}

function renumberAvRows() {
  document.querySelectorAll('#av-species .av-row').forEach(function (r, i) {
    var numEl = r.querySelector('.av-num');
    if (numEl) numEl.textContent = (i + 1) + '.';
  });
}

var _avDragEl = null;
function wireAvDrag(row) {
  row.addEventListener('dragstart', function (e) {
    _avDragEl = row;
    e.dataTransfer.effectAllowed = 'move';
    row.classList.add('ord-dragging');
  });
  row.addEventListener('dragend', function () {
    row.classList.remove('ord-dragging');
    _avDragEl = null;
  });
  row.addEventListener('dragover', function (e) { e.preventDefault(); });
  row.addEventListener('drop', function (e) {
    e.preventDefault();
    if (!_avDragEl || _avDragEl === row) return;
    var container = document.getElementById('av-species');
    var rows = Array.from(container.querySelectorAll('.av-row'));
    var fromIdx = rows.indexOf(_avDragEl), toIdx = rows.indexOf(row);
    if (fromIdx < toIdx) container.insertBefore(_avDragEl, row.nextSibling);
    else container.insertBefore(_avDragEl, row);
    renumberAvRows();
    if (typeof avFormChange === 'function') avFormChange();
  });
}

function _avClearRows() {
  var cont = document.getElementById('av-species');
  if (cont) cont.innerHTML = '';
}

function _avFillRows(species) {
  _avClearRows();
  (species && species.length ? species : AV_DEFAULTS.species).forEach(function (s) {
    addAvRow(s.nom, s.coeff, s.role, s.n0, s.exces, s.solvant);
  });
}

function captureState_avancement() {
  var s = { type: 'avancement' };
  s.bareme = v('av-bareme');
  s.text = richVal('av-text');
  s.mode = document.getElementById('av-mode') ? document.getElementById('av-mode').value : AV_DEFAULTS.mode;
  s.sourceType = document.getElementById('av-source-type') ? document.getElementById('av-source-type').value : AV_DEFAULTS.sourceType;
  s.sourceX = v('av-source-x');
  s.species = Array.prototype.map.call(document.querySelectorAll('#av-species .av-row'), function (r) {
    var nomEl = r.querySelector('.av-nom');
    return {
      nom: typeof _chemHtmlToLatexDisplay === 'function' ? _chemHtmlToLatexDisplay(nomEl.innerHTML) : (nomEl.textContent || ''),
      coeff: r.querySelector('.av-coeff').value,
      role: r.querySelector('.av-role').value,
      n0: r.querySelector('.av-n0').value,
      exces: r.querySelector('.av-exces').checked,
      solvant: r.querySelector('.av-solvant').checked
    };
  });
  s.fbGen = richVal('av-fbgen');
  return s;
}

function restoreState_avancement(s) {
  document.getElementById('av-bareme').value = s.bareme || AV_DEFAULTS.bareme;
  setRichVal('av-text', s.text || AV_DEFAULTS.text);
  if (document.getElementById('av-mode')) document.getElementById('av-mode').value = s.mode || AV_DEFAULTS.mode;
  if (document.getElementById('av-source-type')) document.getElementById('av-source-type').value = s.sourceType || AV_DEFAULTS.sourceType;
  if (document.getElementById('av-source-x')) document.getElementById('av-source-x').value = s.sourceX || AV_DEFAULTS.sourceX;
  _avFillRows(s.species);
  var _avFbGen = document.getElementById('av-fbgen'); if (_avFbGen) setRichVal('av-fbgen', s.fbGen || AV_DEFAULTS.fbGen);
  if (typeof avFormChange === 'function') avFormChange();
}

function resetForm_avancement() {
  document.getElementById('av-bareme').value = AV_DEFAULTS.bareme;
  setRichVal('av-text', AV_DEFAULTS.text);
  if (document.getElementById('av-mode')) document.getElementById('av-mode').value = AV_DEFAULTS.mode;
  if (document.getElementById('av-source-type')) document.getElementById('av-source-type').value = AV_DEFAULTS.sourceType;
  if (document.getElementById('av-source-x')) document.getElementById('av-source-x').value = AV_DEFAULTS.sourceX;
  _avFillRows(AV_DEFAULTS.species);
  var _avFbGen = document.getElementById('av-fbgen'); if (_avFbGen) setRichVal('av-fbgen', AV_DEFAULTS.fbGen);
  if (typeof avFormChange === 'function') avFormChange();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { captureState_avancement, restoreState_avancement, resetForm_avancement, AV_DEFAULTS };
}
