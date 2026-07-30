// ── ENCADRÉS DE FEEDBACK PRT — styles configurables (chantier pilote Base N) ──
// Sépare le contenu brut d'un feedback (édité par l'enseignant, ex. via
// js/prt-manager.js) de sa présentation visuelle (encadré coloré). Le contenu
// brut ne contient jamais de <div style="border-left...">, uniquement du HTML
// simple ; applyFbBox() n'est appelée qu'aux points d'affichage (aperçu) et
// d'export (XML final), jamais stockée dans les champs édités.
var FB_BOX_DEFAULTS = {
    true:    { color: '#15803d', bg: '#f0fdf4', icon: '✅' },
    partial: { color: '#ca8a04', bg: '#fefce8', icon: '🔶' },
    false:   { color: '#dc2626', bg: '#fef2f2', icon: '❌' },
    // Bordure pleine (pas border-left) et icône 🔑 : reprend le style déjà
    // établi ailleurs dans l'app pour le feedback général (_suiGenFbBox dans
    // js/gen-math-suites.js, fallback complexe dans js/app.js).
    general: { color: '#cbd5e1', bg: '#f8fafc', icon: '🔑' }
};
var FB_BOX_STORAGE_KEY = 'sf_fbbox_styles';

function getFbBoxStyles() {
    var stored = {};
    try {
        if (typeof localStorage !== 'undefined') stored = JSON.parse(localStorage.getItem(FB_BOX_STORAGE_KEY) || '{}') || {};
    } catch (e) { stored = {}; }
    var merged = {};
    Object.keys(FB_BOX_DEFAULTS).forEach(function(kind) {
        merged[kind] = Object.assign({}, FB_BOX_DEFAULTS[kind], stored[kind] || {});
    });
    return merged;
}

function saveFbBoxStyles(styles) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(FB_BOX_STORAGE_KEY, JSON.stringify(styles || {}));
}

function resetFbBoxStyles() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(FB_BOX_STORAGE_KEY);
}

function applyFbBox(kind, html) {
    if (!html) return html;
    var s = getFbBoxStyles()[kind] || FB_BOX_DEFAULTS[kind] || FB_BOX_DEFAULTS.false;
    var borderRule = (kind === 'general')
        ? 'border:1px solid ' + s.color + ';'
        : 'border-left:4px solid ' + s.color + ';';
    return '<div style="' + borderRule + 'padding:8px 12px;background:' + s.bg + ';border-radius:4px;margin-bottom:10px;">'
        + (s.icon ? s.icon + ' ' : '') + html + '</div>';
}

// unwrapFbBox() : inverse d'applyFbBox(). Reconnaît aussi l'ancien encadré codé en dur
// de js/prt-manager.js (_prtWrapFb, supprimé) pour pouvoir nettoyer les feedbacks déjà
// stockés avec ce système. Idempotent : renvoie html inchangé si aucun wrapper connu.
var _FB_BOX_LEGACY_BG = ['#f0fdf4', '#F9B3A9', '#f9b3a9', '#fafafa', '#F9F2BB', '#f9f2bb', '#FCDFCF', '#fcdfcf'];
function unwrapFbBox(html) {
    if (!html) return html;
    var s = html.trim();
    var m = /^<div style="([^"]*)">([\s\S]*)<\/div>\s*$/.exec(s);
    if (!m) return html;
    var style = m[1], inner = m[2];
    var isCurrent = /^border(?:-left:4px solid|:1px solid)/.test(style) && style.indexOf('padding:8px 12px;background:') >= 0;
    var isLegacyBg = _FB_BOX_LEGACY_BG.some(function (bg) { return style.indexOf('background:' + bg) >= 0; });
    var isLegacy = /^padding:12px;background:/.test(style) && isLegacyBg;
    if (!isCurrent && !isLegacy) return html;
    return inner.replace(/^(?:✅|❌|🔶|🔑)\s*/, '');
}

// inferFbKind() : déduit 'true'/'partial'/'false' à partir du score du nœud PRT, sans
// stocker de nouveau champ — lu directement depuis truescoremode/truescore déjà présents
// sur chaque nœud (js/prt-manager.js parsePrtXml/buildPrtXml).
function inferFbKind(node, branch) {
    if (!node || branch !== 'true') return 'false';
    if (node.truescoremode !== '=') return 'true';
    var score = parseFloat(node.truescore);
    if (isNaN(score) || score <= 0) return 'false';
    if (score < 1) return 'partial';
    return 'true';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FB_BOX_DEFAULTS: FB_BOX_DEFAULTS, FB_BOX_STORAGE_KEY: FB_BOX_STORAGE_KEY, getFbBoxStyles: getFbBoxStyles, saveFbBoxStyles: saveFbBoxStyles, resetFbBoxStyles: resetFbBoxStyles, applyFbBox: applyFbBox, unwrapFbBox: unwrapFbBox, inferFbKind: inferFbKind };
}
