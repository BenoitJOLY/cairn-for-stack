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

// polynomes-ui.js — Polynômes du 2nd degré ax²+bx+c

function polFormChange() { polToggleModeBlocks(); polUpdatePreview(); }

// Quand le scénario change, si le nouveau scénario exige des racines réelles distinctes
// (Δ>0, donc x1≠x2) et que Δ min proposé n'est pas strictement positif, on le remonte
// à 1 au lieu de laisser l'utilisateur découvrir l'erreur après coup.
function polOnScenarioChange() {
    var scenario = (document.getElementById('pol-scenario')||{}).value || 'discriminant';
    var needsRealRoots = (scenario === 'racines' || scenario === 'racine1' || scenario === 'racine2' || scenario === 'somme-racines' || scenario === 'produit-racines');
    if (needsRealRoots) {
        var minEl = document.getElementById('pol-delta-min');
        if (minEl) {
            var v = polStrictInt(minEl.value);
            if (v === null || v < 1) minEl.value = '1';
        }
    }
    polFormChange();
}

function polToggleModeBlocks() {
    var mode = (document.querySelector('input[name="pol-mode-r"]:checked')||{}).value || 'aleatoire';
    var fixeBlock = document.getElementById('pol-fixe-block');
    var aleaBlock = document.getElementById('pol-aleatoire-block');
    if (fixeBlock) fixeBlock.style.display = mode === 'fixe' ? '' : 'none';
    if (aleaBlock) aleaBlock.style.display = mode === 'fixe' ? 'none' : '';
}

function polFmt(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return n.toFixed(4).replace(/\.?0+$/, '');
}

// polLastInvalid mémorise si l'aperçu affiche actuellement une erreur (bornes du
// discriminant non entières ou incohérentes) — utilisé pour bloquer l'enregistrement
// de la question tant que l'erreur persiste (cf. validateCurrentType dans keyboard.js).
var polLastInvalid = false;

// Renvoie le nombre si `raw` est un entier valide (accepte "-5", "12", refuse "", "1.5", "abc"), sinon null.
function polStrictInt(raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (!/^-?\d+$/.test(s)) return null;
    return parseInt(s, 10);
}

// Vérifie les bornes du discriminant en mode Aléatoire. Retourne {min,max} si valides,
// ou null (et affiche l'erreur bloquante) sinon.
function polCheckDeltaBounds() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var min = polStrictInt(gs('pol-delta-min'));
    var max = polStrictInt(gs('pol-delta-max'));
    if (min === null || max === null) {
        polLastInvalid = true;
        return { error: I18N.t('pol.err_bornes_entiers') };
    }
    if (min > max) {
        polLastInvalid = true;
        return { error: I18N.t('pol.err_min_sup_max') };
    }
    polLastInvalid = false;
    return { min: min, max: max };
}

function polCompute() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('pol-scenario') || 'discriminant';
    var a = parseFloat(gs('pol-a')) || 0;
    var b = parseFloat(gs('pol-b')) || 0;
    var c = parseFloat(gs('pol-c')) || 0;

    var delta = b*b - 4*a*c;
    var x1 = delta >= 0 && a !== 0 ? (-b - Math.sqrt(delta))/(2*a) : null;
    var x2 = delta >= 0 && a !== 0 ? (-b + Math.sqrt(delta))/(2*a) : null;
    if (x1 !== null && x2 !== null && x1 > x2) { var tmp=x1; x1=x2; x2=tmp; }

    return {a:a, b:b, c:c, delta:delta, x1:x1, x2:x2, scenario:scenario};
}

function polUpdatePreview() {
    var el = document.getElementById('pol-preview');
    if (!el) return;
    var mode = (document.querySelector('input[name="pol-mode-r"]:checked')||{}).value || 'aleatoire';
    var scenario0 = (document.getElementById('pol-scenario')||{}).value || 'discriminant';
    var needsRealRoots0 = (scenario0 === 'racines' || scenario0 === 'racine1' || scenario0 === 'racine2' || scenario0 === 'somme-racines' || scenario0 === 'produit-racines');
    if (mode !== 'fixe') {
        var bounds = polCheckDeltaBounds();
        if (bounds.error) {
            el.innerHTML = '<em style="color:#dc2626;">⚠ ' + bounds.error + '</em>';
            return;
        }
        if (needsRealRoots0 && bounds.min < 1) {
            polLastInvalid = true;
            el.innerHTML = '<em style="color:#dc2626;">⚠ ' + I18N.t('pol.err_delta_min_scenario', {min: bounds.min}) + '</em>';
            return;
        }
        polLastInvalid = false;
        el.innerHTML = I18N.t('pol.preview_trinome_auto', {min: bounds.min, max: bounds.max});
        return;
    }
    var r = polCompute();
    var needsRealRoots = needsRealRoots0;
    if (needsRealRoots && r.delta <= 0) {
        polLastInvalid = true;
        var deltaReason = r.delta < 0 ? I18N.t('pol.reason_pas_racine_reelle') : I18N.t('pol.reason_racine_double');
        el.innerHTML = '<em style="color:#dc2626;">⚠ ' + I18N.t('pol.err_delta_scenario', {a: polFmt(r.a), b: polFmt(r.b), c: polFmt(r.c), delta: polFmt(r.delta), reason: deltaReason}) + '</em>';
        return;
    }
    polLastInvalid = false;
    var poly = polFmt(r.a)+'x² + ('+polFmt(r.b)+')x + ('+polFmt(r.c)+')';
    var html = '<strong>f(x) = ' + polFmt(r.a) + 'x² + (' + polFmt(r.b) + ')x + (' + polFmt(r.c) + ')</strong><br>';
    html += 'Δ = b²−4ac = ' + polFmt(r.b) + '² − 4×' + polFmt(r.a) + '×' + polFmt(r.c) + ' = <strong>' + polFmt(r.delta) + '</strong><br>';

    if (r.delta > 0 && r.x1 !== null) {
        html += I18N.t('pol.preview_2racines', {x1: polFmt(r.x1), x2: polFmt(r.x2)});
    } else if (r.delta === 0 && r.x1 !== null) {
        html += I18N.t('pol.preview_racine_double', {x0: polFmt(r.x1)});
    } else {
        html += '<em style="color:#dc2626;">' + I18N.t('pol.preview_pas_racine') + '</em>';
    }

    var scenario = r.scenario;
    if (scenario === 'somme-racines') {
        html += '<br>x₁+x₂ = <strong>' + polFmt(-r.b/r.a) + '</strong> (= −b/a)';
    } else if (scenario === 'produit-racines') {
        html += '<br>x₁×x₂ = <strong>' + polFmt(r.c/r.a) + '</strong> (= c/a)';
    }
    el.innerHTML = html;
}
