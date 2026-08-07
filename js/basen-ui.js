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

// basen-ui.js — UI helpers for Base-N conversion question type

function bnValueModeChange() {
    var mode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
    var fixeWrap = document.getElementById('bn-value-fixe-wrap');
    var aleaWrap = document.getElementById('bn-value-alea-wrap');
    if (fixeWrap) fixeWrap.style.display = (mode === 'fixe') ? '' : 'none';
    if (aleaWrap) aleaWrap.style.display = (mode === 'aleatoire') ? '' : 'none';
    bnFormChange();
}

// Vérifie que `str` ne contient que des chiffres valides pour `base` (0-9, A-Z).
// Retourne l'entier décimal correspondant, ou null si un chiffre est invalide.
function bnStrictParse(str, base) {
    var s = String(str == null ? '' : str).trim().toUpperCase();
    if (!s.length) return null;
    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, base);
    for (var i = 0; i < s.length; i++) {
        if (alphabet.indexOf(s[i]) === -1) return null;
    }
    return parseInt(s, base);
}

// bnLastInvalid mémorise si l'aperçu affiche actuellement une erreur de saisie
// (valeur impossible dans la base choisie, ou bornes aléatoires invalides) —
// utilisé pour bloquer l'enregistrement de la question tant que l'erreur persiste.
var bnLastInvalid = false;

function bnFormChange() {
    var fromBase  = parseInt((document.getElementById('bn-from-base') || {}).value || '10');
    var toBase    = parseInt((document.getElementById('bn-to-base')   || {}).value || '2');
    var format    = (document.getElementById('bn-format') || {}).value || 'S';
    var valueMode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
    var valueBase = (document.getElementById('bn-value-base') || {}).value || 'depart';

    var lblVal  = document.getElementById('bn-lbl-value');
    if (lblVal) {
        if (valueMode === 'aleatoire') {
            lblVal.textContent = I18N.t('bn.lbl_valeur_bornes_decimal');
        } else {
            var chosenBase = (valueBase === 'arrivee') ? toBase : fromBase;
            lblVal.textContent = I18N.t('bn.lbl_valeur_chiffres_base', {base: chosenBase});
        }
    }

    // La notation C n'a de sens que si la base d'arrivée (réponse attendue) est 2, 8 ou 16.
    var warnC = (format === 'C' && toBase !== 2 && toBase !== 8 && toBase !== 16);
    var formatSel = document.getElementById('bn-format');
    if (formatSel) {
        formatSel.style.borderColor = warnC ? '#dc2626' : '';
        formatSel.title = warnC ? I18N.t('bn.warn_notation_c_title') : '';
    }

    bnUpdatePreview();
}

function bnToBase(decVal, base) {
    if (base < 2 || base > 36) return '?';
    return decVal.toString(base).toUpperCase();
}

function bnSyntaxHint(format, toBase, fixedWidth) {
    if (toBase === 10) {
        return I18N.t('bn.syntax_only_integer');
    }
    var widthNote = (fixedWidth > 0)
        ? I18N.t('bn.syntax_width_note', {width: fixedWidth})
        : '';
    if (format === 'C') {
        if (toBase === 2)  return I18N.t('bn.syntax_c_bin') + widthNote;
        if (toBase === 8)  return I18N.t('bn.syntax_c_oct') + widthNote;
        if (toBase === 16) return I18N.t('bn.syntax_c_hex') + widthNote;
    }
    if (fixedWidth > 0) {
        return (toBase > 10 ? I18N.t('bn.syntax_std_width_upper') : I18N.t('bn.syntax_std_width')) + widthNote;
    }
    if (toBase > 10) {
        return I18N.t('bn.syntax_upper_nowidth');
    }
    return I18N.t('bn.syntax_nowidth');
}

function bnUpdatePreview() {
    var el = document.getElementById('bn-preview');
    if (!el) return;

    var fromBase  = parseInt((document.getElementById('bn-from-base') || {}).value || '10');
    var toBase    = parseInt((document.getElementById('bn-to-base')   || {}).value || '2');
    var format    = (document.getElementById('bn-format') || {}).value || 'S';
    var valueMode = (document.getElementById('bn-value-mode') || {}).value || 'fixe';
    var valueBase = (document.getElementById('bn-value-base') || {}).value || 'depart';
    var fixedWidth = parseInt((document.getElementById('bn-fixed-width') || {}).value || '');

    var baseName = function(b) {
        return b === 2 ? I18N.t('bn.basename_binaire') : b === 8 ? I18N.t('bn.basename_octal') : b === 10 ? I18N.t('bn.basename_decimal') : b === 16 ? I18N.t('bn.basename_hexadecimal') : I18N.t('bn.basename_generic', {b: b});
    };

    // La notation choisie ne s'applique qu'à la représentation en base d'arrivée
    // (c'est la réponse attendue) ; la donnée de départ est toujours affichée en
    // simple suite de chiffres, sans préfixe ni indice (comme dans les XML réels).
    var formatDst = function(n) {
        if (toBase === 10) return '<code>' + n + '</code>';
        var s = bnToBase(n, toBase).toUpperCase();
        if (fixedWidth > 0 && s.length < fixedWidth) s = '0'.repeat(fixedWidth - s.length) + s;
        if (format === 'C') {
            if (toBase === 2)  return '<code>0b' + s + '</code>';
            if (toBase === 8)  return '<code>0o' + s + '</code>';
            if (toBase === 16) return '<code>0x' + s + '</code>';
        }
        return '<code>' + s + '</code>';
    };
    var formatSrc = function(n) {
        if (fromBase === 10) return '<code>' + n + '</code>';
        return '<code>' + bnToBase(n, fromBase).toUpperCase() + '</code>';
    };

    var html = '';

    if (valueMode === 'aleatoire') {
        var min = parseInt((document.getElementById('bn-value-min') || {}).value || '10');
        var max = parseInt((document.getElementById('bn-value-max') || {}).value || '99');
        if (isNaN(min) || isNaN(max) || min > max) {
            bnLastInvalid = true;
            el.innerHTML = '<em style="color:#dc2626;">' + I18N.t('bn.err_bornes_invalides') + '</em>';
            return;
        }
        if (fixedWidth > 0 && toBase !== 10) {
            var neededMax = bnToBase(max, toBase).length;
            if (neededMax > fixedWidth) {
                bnLastInvalid = true;
                el.innerHTML = '<em style="color:#dc2626;">⚠ ' + I18N.t('bn.err_largeur_fixe_max', {max: max, needed: neededMax, base: baseName(toBase), width: fixedWidth}) + '</em>';
                return;
            }
        }
        var sample = min + Math.floor(Math.random() * (max - min + 1));
        html = I18N.t('bn.preview_valeur_aleatoire', {min: min, max: max, src: formatSrc(sample), baseFrom: baseName(fromBase), dst: formatDst(sample), baseTo: baseName(toBase)});
    } else {
        var valRaw = (document.getElementById('bn-value') || {}).value || '42';
        var chosenBase = (valueBase === 'arrivee') ? toBase : fromBase;
        var parsed = bnStrictParse(valRaw, chosenBase);
        if (parsed === null) {
            bnLastInvalid = true;
            el.innerHTML = '<em style="color:#dc2626;">⚠ ' + I18N.t('bn.err_valeur_impossible', {val: valRaw, base: chosenBase}) + '</em>';
            return;
        }
        if (fixedWidth > 0 && toBase !== 10) {
            var neededFixe = bnToBase(parsed, toBase).length;
            if (neededFixe > fixedWidth) {
                bnLastInvalid = true;
                el.innerHTML = '<em style="color:#dc2626;">⚠ ' + I18N.t('bn.err_largeur_fixe_valeur', {val: parsed, needed: neededFixe, base: baseName(toBase), width: fixedWidth}) + '</em>';
                return;
            }
        }
        html = I18N.t('bn.preview_donnee', {src: formatSrc(parsed), baseFrom: baseName(fromBase), dst: formatDst(parsed), baseTo: baseName(toBase)});
    }

    bnLastInvalid = false;

    if (fromBase === toBase) {
        html += ' <span style="color:#dc2626">⚠ ' + I18N.t('bn.warn_base_egale') + '</span>';
    }
    if (format === 'C' && toBase !== 2 && toBase !== 8 && toBase !== 16) {
        html += ' <span style="color:#dc2626">⚠ ' + I18N.t('bn.warn_notation_c_incompatible', {base: toBase}) + '</span>';
    }
    if (fixedWidth > 0 && toBase === 10) {
        html += ' <span style="color:#dc2626">⚠ ' + I18N.t('bn.warn_largeur_ignoree') + '</span>';
    }

    html += '<div style="margin-top:6px;font-style:italic;color:#1e3a8a;">' + bnSyntaxHint(format, toBase, fixedWidth) + '</div>';

    el.innerHTML = html;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bnStrictParse: bnStrictParse, bnSyntaxHint: bnSyntaxHint };
}
