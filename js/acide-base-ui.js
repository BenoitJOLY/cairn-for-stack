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

// acide-base-ui.js — UI helpers for the Acide-Base question type

function abFormChange() {
    var abType    = (document.getElementById('ab-type')      || {}).value || 'af-bf';
    var nProtonsEl = document.getElementById('ab-n-protons');
    var nProtons  = parseInt((nProtonsEl || {}).value || '1');
    var abFindEl  = document.getElementById('ab-find');

    // ── Labels selon le type de titration ─────────────────────────────
    var lbl1   = document.getElementById('ab-lbl-c1');
    var lbl2   = document.getElementById('ab-lbl-c2');
    var lblPka = document.getElementById('ab-lbl-pka');
    var pkaRow = document.getElementById('ab-pka-row');
    var nPRow  = document.getElementById('ab-n-protons-row');

    if (abType === 'bf-af') {
        if (lbl1)   lbl1.textContent   = I18N.t('ab.conc_base_faible_cb');
        if (lbl2)   lbl2.textContent   = I18N.t('ab.conc_acide_fort_ca');
        if (lblPka) lblPka.textContent = I18N.t('ab.pkb_base');
        if (pkaRow) pkaRow.style.display = '';
        // bf-af est toujours monoprote → cacher le sélecteur n-protons
        if (nPRow)      nPRow.style.display  = 'none';
        if (nProtonsEl) nProtonsEl.value     = '1';
        nProtons = 1;
    } else if (abType === 'af-fort-bf') {
        if (lbl1)   lbl1.textContent   = I18N.t('ab.conc_acide_fort_ca');
        if (lbl2)   lbl2.textContent   = I18N.t('ab.conc_base_forte_cb');
        if (pkaRow) pkaRow.style.display = 'none';
        if (nPRow)  nPRow.style.display  = 'none';
        if (nProtonsEl) nProtonsEl.value = '1';
        nProtons = 1;
    } else {  // af-bf
        if (lbl1)   lbl1.textContent   = I18N.t('ab.conc_acide_faible_ca');
        if (lbl2)   lbl2.textContent   = I18N.t('ab.conc_base_forte_cb');
        if (lblPka) lblPka.textContent = 'pKa1';
        if (pkaRow) pkaRow.style.display = '';
        if (nPRow)  nPRow.style.display  = '';
    }

    // ── Champs pKa2 / pKa3 ────────────────────────────────────────────
    var pka2Row   = document.getElementById('ab-pka2-row');
    var pka3Field = document.getElementById('ab-pka3-field');
    if (pka2Row)   pka2Row.style.display   = (nProtons >= 2) ? '' : 'none';
    if (pka3Field) pka3Field.style.display = (nProtons >= 3) ? '' : 'none';

    // ── Mise à jour des options de ab-find ────────────────────────────
    if (abFindEl) {
        var opts = abFindEl.options;
        // indices: 0=equivalence, 1=veq2, 2=veq3
        opts[1].disabled = (nProtons < 2);
        opts[2].disabled = (nProtons < 3);
        // Corriger si l'option sélectionnée est maintenant désactivée
        if (abFindEl.options[abFindEl.selectedIndex].disabled) abFindEl.value = 'equivalence';
    }

    // ── Champs propres à la méthode "tangentes" ────────────────────────
    var abMethod   = (document.getElementById('ab-method') || {}).value || 'colorimetrie';
    var dimsFieldset = document.getElementById('ab-dims-fieldset');
    if (dimsFieldset) dimsFieldset.style.display = (abMethod === 'tangentes') ? '' : 'none';
    var indFieldset = document.getElementById('ab-ind-fieldset');
    if (indFieldset) indFieldset.style.display = (abMethod === 'colorimetrie') ? '' : 'none';

    // ── Au moins un indicateur doit rester coché ────────────────────────
    var indChks = document.querySelectorAll('.ab-ind-chk');
    if (indChks.length && !document.querySelector('.ab-ind-chk:checked')) {
        indChks[0].checked = true;
    }

    abUpdatePreview();
}

function abUpdatePreview() {
    var el = document.getElementById('ab-preview');
    if (!el) return;
    var abType   = (document.getElementById('ab-type')      || {}).value || 'af-bf';
    var nProtons = parseInt((document.getElementById('ab-n-protons') || {}).value || '1');
    var abFind   = (document.getElementById('ab-find')      || {}).value || 'equivalence';
    var c1  = parseFloat((document.getElementById('ab-c1')  || {}).value);
    var v1  = parseFloat((document.getElementById('ab-v1')  || {}).value);
    var c2  = parseFloat((document.getElementById('ab-c2')  || {}).value);
    var pka = parseFloat((document.getElementById('ab-pka') || {}).value);
    var pka2= parseFloat((document.getElementById('ab-pka2')|| {}).value);
    var pka3= parseFloat((document.getElementById('ab-pka3')|| {}).value);

    if (isNaN(c1)||isNaN(v1)||isNaN(c2)||c1<=0||v1<=0||c2<=0) {
        el.innerHTML = '<em>' + I18N.t('ab.preview_saisir_params') + '</em>'; return;
    }

    var Veq1 = c1 * v1 / c2;
    var parts = ['Veq1 = <strong>' + Veq1.toFixed(1) + ' mL</strong>'];
    if (nProtons >= 2) parts.push('Veq2 = <strong>' + (2*Veq1).toFixed(1) + ' mL</strong>');
    if (nProtons >= 3) parts.push('Veq3 = <strong>' + (3*Veq1).toFixed(1) + ' mL</strong>');

    if (abType !== 'af-fort-bf' && !isNaN(pka)) {
        var pKa_exp = (abType === 'bf-af') ? (14 - pka) : pka;
        parts.push('pKa1 = <strong>' + pKa_exp.toFixed(1) + '</strong>');
        if (nProtons >= 2 && !isNaN(pka2)) parts.push('pKa2 = <strong>' + pka2.toFixed(1) + '</strong>');
        if (nProtons >= 3 && !isNaN(pka3)) parts.push('pKa3 = <strong>' + pka3.toFixed(1) + '</strong>');
    }

    el.innerHTML = parts.join(' &nbsp;|&nbsp; ');
}
