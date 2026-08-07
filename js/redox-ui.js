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

// redox-ui.js — UI helpers for the Redox question type

var RX_PRESETS = [
    {label:'MnO₄⁻/Mn²⁺ + Fe²⁺/Fe³⁺',  e1:1.51, n1:5, e2:0.77, n2:1, c1:0.02, name:'KMnO₄'},
    {label:'Ce⁴⁺/Ce³⁺ + Fe²⁺/Fe³⁺',    e1:1.72, n1:1, e2:0.77, n2:1, c1:0.1,  name:'Ce(SO₄)₂'},
    {label:'I₂/2I⁻ + S₂O₃²⁻',           e1:0.62, n1:2, e2:0.09, n2:2, c1:0.05, name:'I₂'},
    {label:'Cr₂O₇²⁻/Cr³⁺ + Fe²⁺/Fe³⁺', e1:1.33, n1:6, e2:0.77, n2:1, c1:0.02, name:'K₂Cr₂O₇'},
    {label:'MnO₄⁻/Mn²⁺ + C₂O₄²⁻/CO₂',  e1:1.51, n1:5, e2:0.49, n2:2, c1:0.02, name:'KMnO₄'}
];

function rxApplyPreset() {
    var sel = document.getElementById('rx-preset');
    if (!sel) return;
    var idx = parseInt(sel.value);
    if (isNaN(idx) || idx < 0 || idx >= RX_PRESETS.length) return;
    var p = RX_PRESETS[idx];
    var set = function(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    };
    set('rx-e1', p.e1);
    set('rx-n1', p.n1);
    set('rx-e2', p.e2);
    set('rx-n2', p.n2);
    set('rx-c1', p.c1);
    set('rx-titrant-name', p.name);
    rxFormChange();
}

function rxFormChange() {
    var rxFind   = (document.getElementById('rx-find') || {}).value || 'equivalence';
    var showVol  = (rxFind === 'equivalence' || rxFind === 'demi' || rxFind === 'double' || rxFind === 'eeq' || rxFind === 'calc');
    var showE    = (rxFind === 'eo1' || rxFind === 'eo2' || rxFind === 'demi' || rxFind === 'double' || rxFind === 'eeq');
    var showC    = (rxFind === 'calc');
    var tolVolRow = document.getElementById('rx-tol-vol-row');
    var tolERow   = document.getElementById('rx-tol-e-row');
    var tolCRow   = document.getElementById('rx-tol-c-row');
    if (tolVolRow) tolVolRow.style.display = showVol ? '' : 'none';
    if (tolERow)   tolERow.style.display   = showE   ? '' : 'none';
    if (tolCRow)   tolCRow.style.display   = showC   ? '' : 'none';
    rxUpdatePreview();
}

function rxUpdatePreview() {
    var el = document.getElementById('rx-preview');
    if (!el) return;
    var e1 = parseFloat((document.getElementById('rx-e1') || {}).value);
    var n1 = parseInt((document.getElementById('rx-n1')   || {}).value);
    var e2 = parseFloat((document.getElementById('rx-e2') || {}).value);
    var n2 = parseInt((document.getElementById('rx-n2')   || {}).value);
    var c1 = parseFloat((document.getElementById('rx-c1') || {}).value);
    var c2 = parseFloat((document.getElementById('rx-c2') || {}).value);
    var v2 = parseFloat((document.getElementById('rx-v2') || {}).value);

    if (isNaN(e1)||isNaN(n1)||isNaN(e2)||isNaN(n2)||isNaN(c1)||isNaN(c2)||isNaN(v2)
        ||n1<=0||n2<=0||c1<=0||c2<=0||v2<=0) {
        el.innerHTML = '<em>' + I18N.t('rx.preview_saisir_params') + '</em>'; return;
    }

    var Veq = n2 * c2 * v2 / (n1 * c1);
    var Eeq = (n1 * e1 + n2 * e2) / (n1 + n2);
    var warn = (e1 <= e2) ? ' <span style="color:#dc2626">' + I18N.t('rx.preview_warn_spontane') + '</span>' : '';
    el.innerHTML = 'Veq = <strong>' + Veq.toFixed(2) + ' mL</strong>'
        + ' &nbsp;|&nbsp; E_éq = <strong>' + Eeq.toFixed(3) + ' V</strong>'
        + ' &nbsp;|&nbsp; E°₁ = <strong>' + e1.toFixed(3) + ' V</strong>'
        + ' &nbsp;|&nbsp; E°₂ = <strong>' + e2.toFixed(3) + ' V</strong>'
        + warn;
}
