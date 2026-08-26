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

// probabilites-ui.js — Probabilités (combinatoire, loi binomiale, probabilités conditionnelles)
// Pas de préréglages : le "Type de question" (+ Valeurs aléatoire/fixe) pilote l'affichage des champs et l'aperçu.

function probFormChange() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('prob-scenario') || 'combinaison';
    var mode = gs('prob-mode') || 'aleatoire';
    var isCond = scenario === 'proba-cond' || scenario === 'proba-union';
    var needsP = scenario === 'binom-pk' || scenario === 'binom-esp' || scenario === 'binom-var';
    var needsK = scenario === 'binom-pk' || scenario === 'combinaison';
    var isFixe = mode === 'fixe';

    var show = function(id,v){ var e=document.getElementById(id); if(e) e.style.display=v?'':'none'; };
    var setText = function(id,t){ var e=document.getElementById(id); if(e) e.textContent=t; };

    // Valeurs fixes
    show('prob-row-nk',   isFixe && !isCond);
    show('prob-field-k',  needsK);
    show('prob-field-p',  isFixe && needsP);
    show('prob-row-cond', isFixe && isCond);

    // Bornes aléatoires
    show('prob-row-rand-n',    !isFixe && !isCond);
    show('prob-row-rand-k',    !isFixe && !isCond && needsK);
    show('prob-row-rand-p',    !isFixe && !isCond && needsP);
    show('prob-row-rand-cond', !isFixe && isCond);

    // Libellés dynamiques P(A)/P(B)/P(A∩B) selon proba-cond ou proba-union
    if (scenario === 'proba-cond') {
        setText('prob-lbl-pa', 'P(A)'); setText('prob-lbl-pb', 'P(D|A)'); setText('prob-lbl-pab', 'P(D|B)');
        setText('prob-lbl-pa-min', 'P(A) min'); setText('prob-lbl-pa-max', 'P(A) max');
        setText('prob-lbl-pb-min', 'P(D|A) min'); setText('prob-lbl-pb-max', 'P(D|A) max');
        setText('prob-lbl-pab-min', 'P(D|B) min'); setText('prob-lbl-pab-max', 'P(D|B) max');
    } else {
        setText('prob-lbl-pa', 'P(A)'); setText('prob-lbl-pb', 'P(B)'); setText('prob-lbl-pab', 'P(A ∩ B)');
        setText('prob-lbl-pa-min', 'P(A) min'); setText('prob-lbl-pa-max', 'P(A) max');
        setText('prob-lbl-pb-min', 'P(B) min'); setText('prob-lbl-pb-max', 'P(B) max');
        setText('prob-lbl-pab-min', 'P(A ∩ B) min'); setText('prob-lbl-pab-max', 'P(A ∩ B) max');
    }

    probUpdatePreview();
}

// ── Calculs combinatoire / probabilités (aperçu, mode Valeurs fixes uniquement) ──
function probFactorial(n) {
    if (n <= 1) return 1;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
}

function probCombination(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    var r = 1;
    for (var i = 0; i < k; i++) r = r * (n - i) / (i + 1);
    return Math.round(r);
}

function probBinomPk(n, k, p) {
    return probCombination(n, k) * Math.pow(p, k) * Math.pow(1-p, n-k);
}

function probFmt(n, d) {
    d = d || 4;
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return n.toFixed(d).replace(/\.?0+$/, '');
}

function probCompute() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('prob-scenario') || 'combinaison';
    var n   = parseInt(gs('prob-n'))   || 0;
    var k   = parseInt(gs('prob-k'))   || 0;
    var p   = parseFloat(gs('prob-p')) || 0;
    var pa  = parseFloat(gs('prob-pa'))  || 0;
    var pb  = parseFloat(gs('prob-pb'))  || 0;
    var pab = parseFloat(gs('prob-pab')) || 0;

    if (scenario === 'combinaison') {
        return {label:'C('+n+','+k+')', val: probCombination(n,k), isInt:true};
    }
    if (scenario === 'binom-pk') {
        return {label:'P(X='+k+')', val: probBinomPk(n,k,p), isInt:false};
    }
    if (scenario === 'binom-esp') {
        return {label:'E(X)', val: n*p, isInt:false};
    }
    if (scenario === 'binom-var') {
        return {label:'V(X)', val: n*p*(1-p), isInt:false};
    }
    if (scenario === 'proba-cond') {
        return {label:'P(A|D)', val: (pa+ (1-pa)) > 0 ? (pa*pb)/(pa*pb+(1-pa)*pab) : NaN, isInt:false};
    }
    if (scenario === 'proba-union') {
        return {label:'P(A∪B)', val: pa+pb-pab, isInt:false};
    }
    return {label:'?', val:0};
}

function probUpdatePreview() {
    var el = document.getElementById('prob-preview');
    if (!el) return;
    var mode = (document.getElementById('prob-mode') || {}).value || 'aleatoire';
    if (mode !== 'fixe') {
        el.innerHTML = '<small style="color:#6b7280;">' + I18N.t('sui.preview_random_note') + '</small>';
        return;
    }
    var r = probCompute();
    var val = r.isInt ? String(r.val) : probFmt(r.val);
    var html = '<strong>' + r.label + '</strong> = <strong style="font-size:1.1em;">' + val + '</strong>';

    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('prob-scenario') || 'combinaison';
    var n = parseInt(gs('prob-n'))||0, k = parseInt(gs('prob-k'))||0;
    var p = parseFloat(gs('prob-p'))||0;

    if (scenario === 'binom-pk') {
        html += '<br><small style="color:#6b7280;">= C('+n+','+k+')×'+probFmt(p)+'^'+k+'×'+probFmt(1-p)+'^'+(n-k)+'</small>';
    }
    if (scenario === 'binom-esp') {
        html += '<br><small style="color:#6b7280;">= n×p = '+n+'×'+p+'</small>';
    }
    if (scenario === 'binom-var') {
        html += '<br><small style="color:#6b7280;">= n×p×(1−p) = '+n+'×'+p+'×'+(1-p)+'</small>';
    }
    el.innerHTML = html;
}
