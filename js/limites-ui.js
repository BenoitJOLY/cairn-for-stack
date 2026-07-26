// limites-ui.js — Limites de fonctions

function limFormChange() {
    var mode = (document.querySelector('input[name="lim-mode-r"]:checked')||{}).value || 'aleatoire';
    var scenario = (document.getElementById('lim-scenario')||{}).value || 'plus-inf';
    var needsPoint = scenario === 'point-fini' || scenario === 'droite-racine' || scenario === 'gauche-racine';
    var fp = document.getElementById('lim-field-point');
    if (fp) fp.style.display = needsPoint ? '' : 'none';
    var ff = document.getElementById('lim-field-fixe');
    if (ff) ff.style.display = (mode === 'fixe') ? '' : 'none';
    var ft = document.getElementById('lim-field-tans');
    if (ft) ft.style.display = (mode === 'fixe') ? '' : 'none';
    limUpdatePreview();
}

function limUpdatePreview() {
    var el = document.getElementById('lim-preview');
    if (!el) return;
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var mode = (document.querySelector('input[name="lim-mode-r"]:checked')||{}).value || 'aleatoire';
    var scenario = gs('lim-scenario') || 'plus-inf';
    var point = gs('lim-point') || '1';

    var limLabel = {
        'plus-inf':      'lim<sub>x→+∞</sub>',
        'moins-inf':     'lim<sub>x→−∞</sub>',
        'point-fini':    'lim<sub>x→' + point + '</sub>',
        'droite-racine': 'lim<sub>x→' + point + '⁺</sub>',
        'gauche-racine': 'lim<sub>x→' + point + '⁻</sub>'
    }[scenario] || 'lim';

    if (mode === 'fixe') {
        var expr = gs('lim-expr') || '';
        var tans = gs('lim-tans') || '';
        var html = limLabel + ' <code>' + expr + '</code>';
        html += tans ? ' = <strong>' + tans + '</strong>' : ' = <em style="color:#6b7280;">' + I18N.t('lim.preview_saisir_hint') + '</em>';
        el.innerHTML = html;
    } else {
        el.innerHTML = limLabel + ' <em style="color:#6b7280;">' + I18N.t('lim.preview_random_note') + '</em>';
    }
}
