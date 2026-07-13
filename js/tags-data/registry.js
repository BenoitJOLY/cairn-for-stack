// registry.js — Registre multi-pays des référentiels de tags pédagogiques
// (matière → niveau → sous-matière → chapitre). Chaque pays est un fichier
// séparé (js/tags-data/<code>.js) qui s'enregistre via registerCountryTags().
// Voir js/tags-data/_modele.js pour créer un nouveau pays.
var TAGS_COUNTRIES = {};
var HESTACK_PAYS_KEY = 'hestack_pays';

function registerCountryTags(code, label, tree) {
  TAGS_COUNTRIES[code] = { label: label, tree: tree };
}

function currentPays() {
  try { return localStorage.getItem(HESTACK_PAYS_KEY) || 'fr'; } catch (e) { return 'fr'; }
}

// tagsArbre reste la variable globale lue par tmInitMat()/tmSelectMat() etc.
// dans js/app.js — applyPays() la fait simplement pointer vers l'arbre du
// pays choisi, sans toucher au reste de la logique des tags.
function applyPays(code) {
  var entry = TAGS_COUNTRIES[code] || TAGS_COUNTRIES['fr'] || { tree: {} };
  window.tagsArbre = entry.tree;
  try { localStorage.setItem(HESTACK_PAYS_KEY, code); } catch (e) {}
  if (typeof tmInitMat === 'function' && document.getElementById('tagModal') &&
      document.getElementById('tagModal').style.display !== 'none') {
    tmInitMat();
  }
}

// Différé : les fichiers pays (fr.js, etc.) se chargent APRÈS ce script et
// s'enregistrent via registerCountryTags() au fil du parsing du <script> qui
// suit. DOMContentLoaded ne se déclenche qu'une fois tous ces scripts
// synchrones exécutés, donc TAGS_COUNTRIES est déjà rempli à ce moment-là.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { applyPays(currentPays()); });
} else {
  applyPays(currentPays());
}
