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

// ── DATA, STATE & BASE HELPERS ──────────────────────────────────
// ══════════ DONNÉES TAGS EN CASCADE ══════════
// ── tagsArbre : voir js/tags-data.js ───────────────────────────────
// ══════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════
let questions={},nextQid=1,currentType=null,pidx=0;
let _verifZoneActive=null; // active verif zone element for toolbar routing
let tagSel={1:new Set(),2:new Set(),3:new Set(),4:new Set(),5:new Set(),6:new Set(),7:new Set()};
let matchState = { left: [], right: [], connections: [], selectedLeft: null };
let matchEditContext = null; // Sert à savoir si on édite ou on crée un item match
const COLORS={checkbox:'#7c3aed',radio:'#2563eb',dropdown:'#db2777',algebraic:'#0891b2',numerical:'#059669',units:'#d97706',string:'#dc2626',match:'#B686D8',crossword:'#ea580c',doi:'#ADA762',chemical:'#53B57C',chemical_topo:'#B5464D',nuclear: '#EAB308',composition:'#31B1BC',jxgdrop:'#FFCEAF',vf:'#E3FF96',ord:'#7C6A5E',imgclick:'#047C6A',rvbcmj:'#7E22CE',optique:'#0284c7','acide-base':'#16a34a','redox':'#b91c1c','basen':'#1d4ed8','circuit':'#c2410c','logique':'#7c3aed','complexe':'#be185d','calcul':'#4338ca','statistiques':'#0f766e','matrices':'#7c2d12','geometrie':'#1e40af','suites':'#7e22ce','probabilites':'#0369a1','trigonometrie':'#b45309','polynomes':'#166534','limites':'#1e3a8a','physique':'#7f1d1d','oscilloscope':'#166534','inequation':'#0e7490','diffraction':'#4338ca','equivalence':'#5b21b6','stack-raw':'#b45309','expert':'#7c3aed','geogebra':'#38761d','nomenclature':'#0e7490','incertitude':'#9333ea','zscore':'#6d28d9','avancement':'#0f766e','cinematique':'#4f46e5','hardyweinberg':'#15803d','croisements':'#0d9488','distancegenetique':'#9d174d','horlogemoleculaire':'#78350f','radiochronologie':'#9a3412','ondesismique':'#334155','malthus':'#a16207','regle10':'#065f46','chi2':'#4c1d95','debit':'#be123c','nernst':'#6366f1','dilutions':'#ca8a04','ieee754':'#0f766e','complexite':'#1e3a8a','arbrebinaire':'#7c2d12','bilanpuissance':'#9f1239','thevenin':'#0c4a6e','premierordre':'#365314','tauxvariation':'#155e75','elasticite':'#a21caf','multiplicateur':'#3f6212','fisher':'#92400e','imgslideshow':'#115e59'};

const LABELS={
    checkbox:'☑️ Cases',
    radio:'🔘 Radio',
    dropdown:'📋 Dropdown',
    algebraic:'➗ Algébrique',
    numerical:'🔢 Arithmétique',
    units:'📐 Unité',
    string:'🔤 String',
    match:'🔗 Relier',
    crossword:'<img src="assets/crossword.png" style="height:20px;vertical-align:middle;"> Mots croisés',
    doi:'<img src="assets/DOI.png" style="height:20px;vertical-align:middle;"> DOI',
    chemical:'🧪 Chimie',
    chemical_topo:'<img src="assets/topologique.png" style="height:20px;vertical-align:middle;"> Chimie Topologique',
    nuclear: '☢️ Réaction nucléaire',
    composition:'✏️ Composition',
    jxgdrop:'Glisser-Déposer',
    vf:'Vrai / Faux',
    ord:'Classement',
    imgclick:'Sélection sur image',
    rvbcmj:'RVB / CMJN',
    optique:'🔭 Optique',
    'acide-base':'⚗️ Acide-Base',
    'redox':'⚡️ Redox',
    'basen':'💻 Base N',
    'circuit':'⚡ Circuits élec.',
    'logique':'🔀 Logique booléenne',
    'complexe':'ℂ Nombres complexes',
    'calcul':'∫ Calcul différentiel',
    'statistiques':'📊 Statistiques',
    'matrices':'▦ Matrices',
    'geometrie':'📐 Géométrie',
    'suites':'∑ Suites',
    'probabilites':'<svg class="hs-ico" aria-hidden="true"><use href="#ico-type-probabilites"></use></svg> Probabilités',
    'trigonometrie':'📐 Trigonométrie',
    'polynomes':'🔢 Polynômes',
    'limites':'→ Limites',
    'physique':'⚡ Physique',
    'oscilloscope':'📡 Oscilloscope',
    'inequation':'≤ Inéquations',
    'diffraction':'🌊 Diffraction',
    'equivalence':'⇔ Équivalence',
    'image-mesure':'📏 Mesure sur image',
    'stack-raw':'📥 STACK importé',
    'expert':'🛠 Expert STACK',
    'geogebra':'📐 GeoGebra',
    'nomenclature':'🧬 Nomenclature',
    'incertitude':'±️ Incertitude',
    'zscore':'📏 Z-score',
    'avancement':'⚗️ Tableau d\'avancement',
    'cinematique':'🏃 Cinématique du point',
    'hardyweinberg':'🧬 Hardy-Weinberg',
    'croisements':'🧬 Croisements',
    'distancegenetique':'🧬 Distance génétique',
    'horlogemoleculaire':'🧬 Horloge moléculaire',
    'radiochronologie':'🧬 Radiochronologie',
    'ondesismique':'🌊 Ondes sismiques',
    'malthus':'🌾 Malthus',
    'regle10':'🔺 Règle du 10%',
    'chi2':'📊 Test du χ²',
    'debit':'❤️ Débit cardiaque',
    'nernst':'⚡ Potentiel de Nernst',
    'dilutions':'🧪 Dilutions en série',
    'ieee754':'💾 IEEE 754',
    'complexite':'⏱️ Complexité algorithmique',
    'arbrebinaire':'🌳 Arbres binaires',
    'bilanpuissance':'⚙️ Bilan de puissance',
    'thevenin':'🔌 Kirchhoff / Thévenin',
    'premierordre':'📈 Premier ordre',
    'tauxvariation':'📈 Taux de variation',
    'elasticite':'↔️ Élasticité-prix',
    'multiplicateur':'🔁 Multiplicateur keynésien',
    'fisher':'💱 Fisher (nominal/réel)',
    'imgslideshow':'⏱️ Diaporama chronométré'
};
// default feedbacks when left empty (fonctions, pas des const, pour rester
// a jour lors d'un changement de langue en direct — voir I18N.setLang())
function FB_JUSTE_DEFAULT(){ return I18N.t('common.fb_default_juste'); }
function FB_FAUX_DEFAULT(){ return I18N.t('common.fb_default_faux'); }

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
// Helpers pour le type MATCH (Base64 & Maxima)
function toBase64(str) {
  try { return window.btoa(unescape(encodeURIComponent(str))); } 
  catch (e) { return ""; }
}

function escapeMaximaString(str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
function uid(){return ++pidx;}
function v(id){return document.getElementById(id).value;}
function rawEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function htmlEsc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function attrEsc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');}
let toastTimer=null;
function toast(msg){const el=document.getElementById('toast');el.innerHTML=msg;el.style.display='block';if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.display='none',3600);}

const LABELS_PLAIN={
    checkbox:'☑️ Cases', radio:'🔘 Radio', dropdown:'📋 Dropdown',
    algebraic:'➗ Algébrique', numerical:'🔢 Arithmétique', units:'📐 Unité', string:'🔤 String',
    match:'🔗 Relier', crossword:'🧩 Mots croisés', doi:'🕸️ DOI',
    chemical:'🧪 Chimie', chemical_topo:'🔬 Chimie Topologique',
    nuclear:'☢️ Réaction nucléaire', composition:'✏️ Composition', jxgdrop:'Glisser-Déposer', vf:'Vrai / Faux', ord:'Classement', imgclick:'Sélection sur image',
    rvbcmj:'RVB / CMJN', optique:'🔭 Optique',
    'acide-base':'⚗️ Acide-Base', 'redox':'⚡️ Redox', 'basen':'💻 Base N', 'circuit':'⚡ Circuits élec.',
    'logique':'🔀 Logique booléenne', 'complexe':'ℂ Nombres complexes', 'calcul':'∫ Calcul différentiel',
    'statistiques':'📊 Statistiques', 'matrices':'▦ Matrices', 'geometrie':'📐 Géométrie',
    'suites':'∑ Suites', 'probabilites':'∩ Probabilités', 'trigonometrie':'📐 Trigonométrie',
    'polynomes':'🔢 Polynômes', 'limites':'→ Limites', 'physique':'⚡ Physique',
    'inequation':'≤ Inéquations',
    'diffraction':'🌊 Diffraction',
    'equivalence':'⇔ Équivalence',
    'image-mesure':'📏 Mesure sur image',
    'stack-raw':'📥 STACK importé',
    'expert':'🛠 Expert STACK',
    'geogebra':'📐 GeoGebra',
    'nomenclature':'🧬 Nomenclature',
    'incertitude':'±️ Incertitude',
    'zscore':'📏 Z-score',
    'avancement':'⚗️ Tableau d\'avancement',
    'cinematique':'🏃 Cinématique du point',
    'hardyweinberg':'🧬 Hardy-Weinberg',
    'croisements':'🧬 Croisements',
    'distancegenetique':'🧬 Distance génétique',
    'horlogemoleculaire':'🧬 Horloge moléculaire',
    'radiochronologie':'🧬 Radiochronologie',
    'ondesismique':'🌊 Ondes sismiques',
    'malthus':'🌾 Malthus',
    'regle10':'🔺 Règle du 10%',
    'chi2':'📊 Test du χ²',
    'debit':'❤️ Débit cardiaque',
    'nernst':'⚡ Potentiel de Nernst',
    'dilutions':'🧪 Dilutions en série',
    'ieee754':'💾 IEEE 754',
    'complexite':'⏱️ Complexité algorithmique',
    'arbrebinaire':'🌳 Arbres binaires',
    'bilanpuissance':'⚙️ Bilan de puissance',
    'thevenin':'🔌 Kirchhoff / Thévenin',
    'premierordre':'📈 Premier ordre',
    'tauxvariation':'📈 Taux de variation',
    'elasticite':'↔️ Élasticité-prix',
    'multiplicateur':'🔁 Multiplicateur keynésien',
    'fisher':'💱 Fisher (nominal/réel)',
    'imgslideshow':'⏱️ Diaporama chronométré'
};
/* Résolu à l'appel (pas à l'import) pour rester correct après un changement de langue à chaud. */
function dataLabel(type){
  var key='data.label.'+type;
  var v=(typeof window!=='undefined'&&window.I18N)?window.I18N.t(key):null;
  return (v&&v!==key) ? v : (LABELS_PLAIN[type]||type);
}
function applyFormula(){document.getElementById('num-val').value=document.getElementById('modal-formula').value;document.getElementById('calcModal').style.display='none';}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { htmlEsc: htmlEsc, rawEsc: rawEsc, attrEsc: attrEsc, escapeMaximaString: escapeMaximaString };
}