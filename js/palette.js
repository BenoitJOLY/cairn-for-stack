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

// palette.js — V4 draggable type palette (accordion by category)

var PALETTE_TYPES = [
  {type:'checkbox',      label:'Cases à cocher'},
  {type:'radio',         label:'Bouton radio'},
  {type:'dropdown',      label:'Menu déroulant'},
  {type:'vf',            label:'Vrai / Faux'},
  {type:'numerical',     label:'Arithmétique'},
  {type:'algebraic',     label:'Algébrique'},
  {type:'string',        label:'String'},
  {type:'units',         label:'Unité'},
  {type:'doi',           label:'DOI'},
  {type:'chemical',      label:'Chimie (Éq.)'},
  {type:'chemical_topo', label:'Chimie (Topo.)'},
  {type:'nuclear',       label:'Réaction nucléaire'},
  {type:'match',         label:'Relier'},
  {type:'crossword',     label:'Mots croisés'},
  {type:'ord',           label:'Classement'},
  {type:'composition',   label:'Composition'},
  {type:'jxgdrop',       label:'Glisser-Déposer'},
  {type:'imgclick',      label:'Sélection image'},
  {type:'geogebra',      label:'GeoGebra'},
  {type:'rvbcmj',        label:'RVB / CMJN'},
  {type:'optique',       label:'Optique géométrique'},
  {type:'acide-base',   label:'pH-métrie / Titrage'},
  {type:'redox',        label:'Dosage redox (potentiométrie)'},
  {type:'basen',        label:'Conversion de base (Base N)'},
  {type:'circuit',      label:'Circuits électriques (atelier de construction)'},
  {type:'logique',      label:'Logique booléenne (tables de vérité, simplification)'},
  {type:'complexe',     label:'Nombres complexes (formes, module, argument)'},
  {type:'calcul',       label:'Calcul différentiel (dérivée, primitive, intégrale)'},
  {type:'statistiques',  label:'Statistiques (moyenne, variance, médiane, quartiles)'},
  {type:'matrices',      label:'Matrices (produit, déterminant, système linéaire)'},
  {type:'geometrie',     label:'Géométrie (distance, vecteurs, droites, cercles)'},
  {type:'suites',        label:'Suites (arithmétique, géométrique, somme, limite)'},
  {type:'probabilites',  label:'Probabilités (combinaisons, loi binomiale, espérance)'},
  {type:'trigonometrie', label:'Trigonométrie (valeurs exactes, identités, équations)'},
  {type:'polynomes',     label:'Polynômes (discriminant, racines, forme canonique/factorisée)'},
  {type:'limites',       label:'Limites de fonctions (infini, point, formes indéterminées)'},
  {type:'physique',      label:'Physique (cinématique, énergie mécanique, lois de Newton)'},
  {type:'oscilloscope',  label:'Oscilloscope (signal sinusoïdal, retard, RC)'},
  {type:'inequation',   label:'Inéquations (ensemble-solution, intervalles, AlgEquiv)'},
  {type:'equivalence',  label:'Raisonnement par équivalence (développement, équation, factorisation, système)'},
  {type:'diffraction',  label:'Interférences-Diffraction (fente, Young, λ)'},
  {type:'image-mesure', label:'Mesure sur image (spectre, microscope, règle…)'},
  {type:'apn',          label:"Appareil photo (triangle d'exposition)"},
  {type:'nomenclature', label:'Nomenclature chimique (molécules organiques)'},
  {type:'incertitude',  label:'Incertitude de mesure (GUM : type A/B, arrondi, écriture finale)'},
  {type:'zscore',       label:'Z-score (compatibilité métrologique, valeur mesurée vs référence)'},
  {type:'avancement',   label:"Tableau d'avancement (réaction chimique)"},
  {type:'cinematique',  label:'Cinématique du point (vecteur vitesse, relation de Chasles)'},
  {type:'expert',       label:'Question Expert STACK'}
];

var PALETTE_CATEGORIES = [
  {id:'choix',       label:'Choix multiples',       types:['checkbox','radio','dropdown','vf']},
  {id:'numerique',   label:'Mathématiques',   types:['numerical','algebraic','complexe','calcul','statistiques','matrices','geometrie','suites','probabilites','trigonometrie','polynomes','limites','inequation','equivalence','geogebra']},
  {id:'physique',    label:'Physique',               types:['doi','nuclear','optique','circuit','physique','oscilloscope','diffraction','rvbcmj','apn','cinematique']},
  {id:'chimie',      label:'Chimie',                 types:['chemical','chemical_topo','acide-base','redox','nomenclature','avancement']},
  {id:'sciences',    label:'Sciences (Général)',     types:['units','incertitude','zscore']},
  {id:'info',        label:'Informatique',           types:['basen','logique']},
  {id:'textuelle',   label:'Réponse textuelle',      types:['string','composition']},
  {id:'organisation',label:'Organisation',           types:['match','crossword','ord']},
  {id:'interactif',  label:'Interactif / Visuel',   types:['jxgdrop','imgclick','image-mesure']},
  {id:'expert',      label:'Mode Expert STACK',     types:['expert']}
];

/* ── Insertion depuis la palette (clavier ou clic) ── */
function insertFromPalette(type) {
  if (!canInsertChipType(type)) return;
  var editor = document.getElementById('v4-editor');
  var qid = nextQid++;
  var chip = createChipEl(qid, type);

  var inserted = false;
  if (typeof _richSavedRange !== 'undefined' && _richSavedRange && editor.contains(_richSavedRange.startContainer)) {
    var r = _richSavedRange.cloneRange();
    r.collapse(true);
    r.insertNode(chip);
    inserted = true;
  }
  if (!inserted) editor.appendChild(chip);

  var sel = window.getSelection();
  var afterChip = document.createRange();
  afterChip.setStartAfter(chip);
  afterChip.collapse(true);
  sel.removeAllRanges();
  sel.addRange(afterChip);
  editor.focus();
  document.execCommand('insertLineBreak');

  renumberChips();
  openConfigPanel(parseInt(chip.dataset.qid), type);
}

/* ── Bascule d'une catégorie ── */
function togglePaletteCat(catId) {
  var catEl = document.getElementById('pcat-' + catId);
  if (!catEl) return;
  var btn  = catEl.querySelector('.palette-cat-btn');
  var body = catEl.querySelector('.palette-cat-body');
  var open = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', open ? 'false' : 'true');
  btn.querySelector('.pcat-arrow').textContent = open ? '▸' : '▾';
  if (open) {
    /* fermeture : figer la hauteur actuelle, puis animer vers 0 */
    body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(function() {
      body.style.maxHeight = '0';
      body.style.paddingTop = '0';
      body.style.paddingBottom = '0';
    });
  } else {
    /* ouverture : animer depuis 0 vers la hauteur réelle */
    body.style.paddingTop = '';
    body.style.paddingBottom = '';
    body.style.maxHeight = body.scrollHeight + 'px';
    /* après la transition, libérer pour permettre le redimensionnement */
    body.addEventListener('transitionend', function _unlock() {
      body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', _unlock);
    });
  }
}

/* ── Rendu de l'accordéon ── */
function renderPalette() {
  var grid = document.getElementById('palette-grid');
  if (!grid) return;

  var typeMap = {};
  PALETTE_TYPES.forEach(function(t) { typeMap[t.type] = t; });

  grid.innerHTML = '';

  PALETTE_CATEGORIES.forEach(function(cat) {
    var catEl = document.createElement('div');
    catEl.className = 'palette-cat';
    catEl.id = 'pcat-' + cat.id;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-cat-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'pcat-body-' + cat.id);
    btn.innerHTML =
      '<span class="pcat-arrow" aria-hidden="true">▸</span>' +
      '<span class="pcat-label">' + ((window.I18N && I18N.t('palette.cat.' + cat.id)) || cat.label) + '</span>' +
      '<span class="pcat-count">' + cat.types.length + '</span>';
    btn.addEventListener('click', function() { togglePaletteCat(cat.id); });
    catEl.appendChild(btn);

    var body = document.createElement('div');
    body.className = 'palette-cat-body';
    body.id = 'pcat-body-' + cat.id;
    /* replié par défaut */
    body.style.maxHeight = '0';
    body.style.paddingTop = '0';
    body.style.paddingBottom = '0';

    cat.types.forEach(function(type) {
      var t = typeMap[type];
      if (!t) return;
      var color = (typeof COLORS !== 'undefined' && COLORS[t.type]) || '#64748b';
      var ico   = (typeof TYPE_ICON_MAP !== 'undefined' && TYPE_ICON_MAP[t.type]) || t.type;

      var block = document.createElement('div');
      block.className = 'palette-block';
      block.draggable = true;
      block.dataset.type = t.type;
      block.style.borderLeftColor = color;
      var typeLabel = (window.I18N && I18N.t('type.' + t.type)) || t.label;
      block.title = (window.I18N && I18N.t('palette.drag_title', {label: typeLabel})) || 'Glisser dans l\'éditeur pour insérer « ' + typeLabel + ' »';
      block.setAttribute('tabindex', '0');
      block.setAttribute('role', 'button');
      block.setAttribute('aria-label', (window.I18N && I18N.t('palette.aria_insert', {label: typeLabel})) || 'Insérer ' + typeLabel);
      block.innerHTML =
        '<svg class="hs-ico palette-ico" style="color:' + color + '" aria-hidden="true">' +
        '<use href="#ico-type-' + ico + '"></use></svg>' +
        '<span class="palette-label">' + typeLabel + '</span>';

      block.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', this.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
        this.classList.add('dragging');
      });
      block.addEventListener('dragend', function() {
        this.classList.remove('dragging');
      });
      block.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          insertFromPalette(this.dataset.type);
        }
      });

      body.appendChild(block);
    });

    catEl.appendChild(body);
    grid.appendChild(catEl);
  });
}

function showPalette() {}   // no-op — palette is always visible
function showConfigZone() {}

function initPalette() {
  renderPalette();
  document.addEventListener('i18n:changed', renderPalette);
}
