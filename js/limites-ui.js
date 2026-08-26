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
