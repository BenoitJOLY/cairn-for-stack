/*
 * StackForge — générateur de questions STACK pour Moodle
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

// matrices-ui.js — Matrices et systèmes linéaires (génération Maxima)

function matFormChange() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('mat-scenario') || 'produit-2x2';
    var isSys = (scenario === 'systeme-2x2');

    var rr = document.getElementById('mat-rand-range');
    var ri = document.getElementById('mat-rand-info');
    if (rr) rr.style.display = isSys ? 'none' : '';
    if (ri) {
        if (isSys) {
            ri.textContent = I18N.t('mat.info_systeme_range');
            ri.style.display = '';
        } else {
            ri.style.display = 'none';
        }
    }
    matUpdatePreview();
}

function matUpdatePreview() {
    var el = document.getElementById('mat-preview');
    if (!el) return;
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('mat-scenario') || 'produit-2x2';
    var rmin = gs('mat-rand-min') || '-3';
    var rmax = gs('mat-rand-max') || '3';

    var labels = {
        'produit-2x2':     I18N.t('mat.preview_produit'),
        'det-2x2':         I18N.t('mat.preview_det2'),
        'det-3x3':         I18N.t('mat.preview_det3'),
        'trace-3x3':       I18N.t('mat.preview_trace'),
        'transpose-3x3':   I18N.t('mat.preview_transpose'),
        'systeme-2x2':     I18N.t('mat.preview_systeme')
    };
    var label = labels[scenario] || scenario;

    var html = '<strong>' + label + '</strong>';
    if (scenario === 'systeme-2x2') {
        html += '<br><small style="color:#6b7280;">' + I18N.t('mat.preview_systeme_hint') + '</small>';
    } else {
        html += '<br><small style="color:#6b7280;">' + I18N.t('mat.preview_random_hint', {min: rmin, max: rmax}) + '</small>';
    }
    el.innerHTML = html;
}
