/* ════════════════════════════════════════════════════════════════════════
   STACKFORGE — Aide à l'insertion d'icônes SVG (sprite)
   Prérequis : le sprite (icons.svg) doit être inliné en haut du <body>
   (les <use href="#id"> ne fonctionnent de façon fiable en file:// que si
   le sprite est dans la même page).

   Usage :
     icon('action-add')                       -> <svg…><use href="#ico-action-add"></svg>
     icon('type-checkbox', { size: 24 })
     icon('footer-help',  { label: 'Aide' })  -> ajoute role="img" + aria-label
     icon('tool-config',  { cls: 'spin' })    -> classe CSS supplémentaire

   Pour un type de question, passez par iconForType() qui fait la
   correspondance clé d'appli -> identifiant d'icône.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  function icon(name, opts) {
    opts = opts || {};
    var size = opts.size != null ? opts.size : "1em";
    if (typeof size === "number") size = size + "px";
    var cls = "hs-ico" + (opts.cls ? " " + opts.cls : "");
    var a11y = opts.label
      ? ' role="img" aria-label="' + String(opts.label).replace(/"/g, "&quot;") + '"'
      : ' aria-hidden="true" focusable="false"';
    return '<svg class="' + cls + '" width="' + size + '" height="' + size + '"' +
           a11y + '><use href="#ico-' + name + '"></use></svg>';
  }

  /* Correspondance type de question (data-t / clé i18n) -> id d'icône.
     Les noms du sprite diffèrent parfois des clés d'appli. */
  var TYPE_ICON = {
    checkbox:      "type-checkbox",
    radio:         "type-radio",
    dropdown:      "type-dropdown",
    algebraic:     "type-algebraic",
    numerical:     "type-numeric",
    units:         "type-units",
    string:        "type-string",
    match:         "type-match",
    crossword:     "type-crossword",
    doi:           "type-doi",
    chemical:      "type-chemistry",
    chemical_topo: "type-chemical_topo",
    nuclear:       "type-nuclear",
    composition:   "type-composition",
    jxgdrop:       "type-jxgdrop",
    vf:            "type-vf",
    ord:           "type-ord",
    imgclick:      "type-imgclick",
    rvbcmj:        "type-rvbcmj",
    optique:       "type-optique",
    "acide-base":  "type-acide-base",
    redox:         "type-redox",
    basen:         "type-basen",
    circuit:       "type-circuit",
    logique:       "type-logique",
    complexe:      "type-complexe",
    calcul:        "type-calcul",
    statistiques:  "type-statistiques",
    matrices:      "type-matrices",
    geometrie:     "type-geometrie",
    suites:        "type-suites",
    probabilites:  "type-probabilites",
    trigonometrie: "type-trigonometrie",
    polynomes:     "type-polynomes",
    limites:       "type-limites",
    physique:      "type-physique",
    inequation:    "type-inequation",
    oscilloscope:  "type-oscilloscope",
    diffraction:   "type-diffraction",
    expert:        "type-expert",
    "stack-raw":   "type-stack-import",
    nomenclature:  "type-chemistry"
  };

  function iconForType(typeKey, opts) {
    return icon(TYPE_ICON[typeKey] || "type-composition", opts);
  }

  window.icon = icon;
  window.iconForType = iconForType;
  window.HS_TYPE_ICON = TYPE_ICON;
})();
