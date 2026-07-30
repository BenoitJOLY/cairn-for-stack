// Accessibility initialisation — auto-associate labels and aria-labels
// Runs once at DOMContentLoaded, before any panel is opened.
document.addEventListener('DOMContentLoaded', function () {

  // 1. Auto-associate <label> with first visible input/select inside .field or .topo-score-item
  //    Also aria-label hidden backing textareas (rich editor stores) with the same label text.
  var CONTAINERS = '.field > label:not([for]), .pb-field > label:not([for]), .topo-score-item > label:not([for]), .jd-zp-row > label:not([for])';
  document.querySelectorAll(CONTAINERS).forEach(function (lbl) {
    var inputs = lbl.parentElement.querySelectorAll('input[id], select[id], textarea[id]');
    var labelText = lbl.textContent.trim().replace(/\s+/g, ' ').slice(0, 100);
    var linkedVisible = false;
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.type === 'hidden') continue;
      if (inp.style.display !== 'none') {
        if (!linkedVisible) { lbl.setAttribute('for', inp.id); linkedVisible = true; }
      } else if (labelText && !inp.getAttribute('aria-label') && !inp.getAttribute('aria-labelledby')) {
        inp.setAttribute('aria-label', labelText);
      }
    }
  });

  // 2. Label all bareme inputs (they're always the only <input> in .bareme-row)
  document.querySelectorAll('.bareme-row input[type="number"]').forEach(function (inp) {
    if (inp.id && document.querySelector('label[for="' + inp.id + '"]')) return;
    if (!inp.getAttribute('aria-label') && !inp.getAttribute('aria-labelledby')) {
      inp.setAttribute('aria-label', 'Barème en points');
    }
  });

  // 3. Special cases with no nearby <label> or with composite group labels
  var specials = {
    'num-n':      'Nombre de chiffres significatifs',
    'chem-fbc':   'Feedback si la réponse est correcte',
    'chem-fbe':   'Feedback si la réponse est incorrecte',
    'v4-img-w':   'Largeur de l\'image (px, max 800)',
    'v4-img-h':   'Hauteur de l\'image (px)',
    'v4-img-alt': 'Texte alternatif de l\'image',
    // Matrice 2×2 A
    'mat-a11': 'Matrice A — ligne 1, colonne 1',
    'mat-a12': 'Matrice A — ligne 1, colonne 2',
    'mat-a21': 'Matrice A — ligne 2, colonne 1',
    'mat-a22': 'Matrice A — ligne 2, colonne 2',
    // Matrice 3×3 A
    'mat-a11b': 'Matrice A — ligne 1, colonne 1',
    'mat-a12b': 'Matrice A — ligne 1, colonne 2',
    'mat-a13b': 'Matrice A — ligne 1, colonne 3',
    'mat-a21b': 'Matrice A — ligne 2, colonne 1',
    'mat-a22b': 'Matrice A — ligne 2, colonne 2',
    'mat-a23b': 'Matrice A — ligne 2, colonne 3',
    'mat-a31b': 'Matrice A — ligne 3, colonne 1',
    'mat-a32b': 'Matrice A — ligne 3, colonne 2',
    'mat-a33b': 'Matrice A — ligne 3, colonne 3',
    // Matrice 2×2 B et vecteurs
    'mat-b11':  'Matrice B — ligne 1, colonne 1',
    'mat-b12':  'Matrice B — ligne 1, colonne 2',
    'mat-b21':  'Matrice B — ligne 2, colonne 1',
    'mat-b22':  'Matrice B — ligne 2, colonne 2',
    'mat-cols': 'Nombre de colonnes',
    'mat-b11s': 'Vecteur B — ligne 1',
    'mat-b21s': 'Vecteur B — ligne 2',
    'mat-sys-var': 'Variable du système',
    // Modales diverses
    'sraw-name':       'Nom de la question',
    'kbd-test-input':  'Zone de test du clavier virtuel',
    'modal-formula':   'Formule mathématique',
    'img-w':           'Largeur de l\'image (px)',
    'img-h':           'Hauteur de l\'image (px)',
    'img-alt':         'Texte alternatif de l\'image',
    'link-text':       'Texte du lien',
    'link-url':        'URL du lien',
    'link-file':       'Fichier à joindre',
    'latex-input':     'Expression LaTeX',
    'tm-divers':       'Tags personnalisés',
    'json-paste-area': 'Coller le JSON ici',
    // Prompts générés (textareas statiques)
    'match-pb-result': 'Prompt généré',
    'cw-pb-result':    'Prompt généré',
    // File inputs cachés (déclenchés par clic sur bouton/zone)
    'stack-import-file': 'Importer un fichier STACK XML',
    'rvb-file':          'Importer une image',
    'json-file-input':   'Importer un fichier JSON'
  };
  Object.keys(specials).forEach(function (id) {
    var el = document.getElementById(id);
    if (el && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      el.setAttribute('aria-label', specials[id]);
    }
  });

  // 4. Catch-all : tout champ sans nom accessible → aria-label depuis title ou placeholder
  //    Inclut les champs cachés (display:none) pour satisfaire les outils d'audit stricts.
  document.querySelectorAll(
    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([aria-label]):not([aria-labelledby]),' +
    'select:not([aria-label]):not([aria-labelledby]),' +
    'textarea:not([aria-label]):not([aria-labelledby])'
  ).forEach(function (el) {
    if (el.id && document.querySelector('label[for="' + el.id + '"]')) return;
    if (el.closest('label')) return;
    var name = el.getAttribute('title') || el.getAttribute('placeholder');
    if (name) el.setAttribute('aria-label', name);
  });

  // 5. rich-preview role="button" divs → aria-label from data-ph.
  //    These are click-to-edit fields (openRich(...)); many are injected later by
  //    proposition-builder templates (checkbox/radio/dropdown/vrai-faux…), so a single
  //    DOMContentLoaded pass isn't enough — a MutationObserver keeps labelling new ones.
  function labelRichPreview(el) {
    if (el.nodeType !== 1) return;
    if (el.matches && el.matches('.rich-preview[role="button"]') &&
        !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
      var ph = el.getAttribute('data-ph');
      if (ph) el.setAttribute('aria-label', ph);
    }
  }
  document.querySelectorAll('.rich-preview[role="button"]').forEach(labelRichPreview);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        labelRichPreview(node);
        if (node.querySelectorAll) node.querySelectorAll('.rich-preview[role="button"]').forEach(labelRichPreview);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

});
