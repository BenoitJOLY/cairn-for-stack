// suites-ui.js — Suites arithmétiques et géométriques
// Pas de préréglages : le "Type de question" (+ Valeurs aléatoire/fixe) pilote l'affichage des champs et l'aperçu.

function suiFormChange() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('sui-scenario') || 'terme-arith';
    var mode = gs('sui-mode') || 'aleatoire';
    var isGeo   = scenario === 'terme-geo' || scenario === 'somme-geo' || scenario === 'limite-geo';
    var isArith = !isGeo;
    var needsK  = scenario === 'terme-arith' || scenario === 'expr-arith' || scenario === 'terme-geo';
    var isFixe  = mode === 'fixe';

    var show = function(id,v){ var e=document.getElementById(id); if(e) e.style.display=v?'':'none'; };

    // Valeurs fixes
    show('sui-row-fixe1', isFixe);
    show('sui-field-r', isArith);
    show('sui-field-q', isGeo);
    show('sui-row-fixe2', isFixe && needsK);

    // Bornes aléatoires
    show('sui-row-rand-u0', !isFixe);
    show('sui-row-rand-r', !isFixe && isArith);
    show('sui-row-rand-q', !isFixe && isGeo);
    show('sui-row-rand-k', !isFixe && needsK);
    show('sui-hint-qlim', isGeo && scenario === 'limite-geo');

    suiUpdatePreview();
}

function suiCompute() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('sui-scenario') || 'terme-arith';
    var u0 = parseFloat(gs('sui-u0')) || 0;
    var r  = parseFloat(gs('sui-r'))  || 0;
    var q  = parseFloat(gs('sui-q'))  || 1;

    if (scenario === 'terme-arith' || scenario === 'expr-arith') {
        return {label:'u_n', expr: u0 + (r>=0?'+':'') + r+'×n', val:null};
    }
    if (scenario === 'terme-geo') {
        return {label:'u_n', expr: u0+'×'+q+'^n', val:null};
    }
    if (scenario === 'somme-arith' || scenario === 'somme-geo') {
        return {label:'S_n', expr: I18N.t('sui.preview_formule_fn'), val:null};
    }
    if (scenario === 'limite-geo') {
        if (Math.abs(q) < 1) return {val: 0, label:'lim u_n', expr:'→0 (|q|<1)'};
        return {val: Infinity, label:'lim u_n', expr:'diverge (|q|≥1)'};
    }
    return {val: 0, label:'?'};
}

function suiFmt(n) {
    if (n === null || n === undefined) return '—';
    if (!isFinite(n)) return '∞';
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return n.toFixed(4).replace(/\.?0+$/, '');
}

function suiUpdatePreview() {
    var el = document.getElementById('sui-preview');
    if (!el) return;
    var mode = (document.getElementById('sui-mode') || {}).value || 'aleatoire';
    if (mode !== 'fixe') {
        el.innerHTML = '<small style="color:#6b7280;">' + I18N.t('sui.preview_random_note') + '</small>';
        return;
    }
    var r = suiCompute();
    var html = '';
    if (r.val !== null) {
        html = '<strong>' + r.label + '</strong> = <strong style="font-size:1.1em;">' + suiFmt(r.val) + '</strong>';
    } else {
        html = '<strong>' + r.label + '</strong> = <code>' + r.expr + '</code>';
    }
    if (r.expr && r.val !== null) html += ' &nbsp;<small style="color:#6b7280;">(' + r.expr + ')</small>';
    el.innerHTML = html;
}
