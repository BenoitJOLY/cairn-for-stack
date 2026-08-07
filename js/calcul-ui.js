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

// calcul-ui.js — Calcul différentiel (dérivée, primitive, intégrale définie)

var CALC_AUTO = ['derivee-produit','primitive-exp','integrale-def','convexite-tangente','encadrement-tvi','aire-courbes','tangente-ext'];

// Variables "racines" (tirées directement par rand([...]) dans les XML de référence) par scénario auto.
// Chaque variable peut être configurée par l'enseignant comme aléatoire (liste de valeurs pour rand()) ou fixe (valeur unique).
var CALC_VAR_SPECS = {
    'derivee-produit':    [{key:'a', labelKey:'calc.var_a_ux_ax_b', domain:[1,2,3]},
                           {key:'b', labelKey:'calc.var_b_ux_ax_b', domain:[-3,-2,-1,1,2]}],
    'primitive-exp':      [{key:'a', labelKey:'calc.var_a_eax', domain:[-2,-1,1,2]},
                           {key:'b', labelKey:'calc.var_b_eax', domain:[2,3,4,5]},
                           {key:'c', labelKey:'calc.var_c_const', domain:[1,2,3]}],
    'integrale-def':      [{key:'d', labelKey:'calc.var_d_edx', domain:[-1,-2]},
                           {key:'c', labelKey:'calc.var_c_edx', domain:[2,3]},
                           {key:'f', labelKey:'calc.var_f_const', domain:[1,2]}],
    'convexite-tangente': [{key:'k', labelKey:'calc.var_k_ex', domain:[1,2,3]},
                           {key:'m', labelKey:'calc.var_m_x', domain:[-2,-1,1,2]}],
    'encadrement-tvi':    [{key:'b', labelKey:'calc.var_b_alpha', domain:[2,3,4,5,6,7,8,9]}],
    'aire-courbes':       [{key:'a', labelKey:'calc.var_a_abscisse', domain:[-3,-2,-1,1,2]},
                           {key:'offset', labelKey:'calc.var_offset', domain:[2,3,4]},
                           {key:'k', labelKey:'calc.var_k_coeff', domain:[1,2,3]}],
    'tangente-ext':       [{key:'a', labelKey:'calc.var_a_tangente1', domain:[-3,-2,-1,1,2,3]},
                           {key:'b', labelKey:'calc.var_b_tangente2', domain:[-3,-2,-1,1,2,3]},
                           {key:'k', labelKey:'calc.var_k_fx2', domain:[-2,-1,0,1,2]}]
};

function _calcRenderVarConfig() {
    var scenario = (document.getElementById('calc-scenario') || {}).value || 'derivee-produit';
    var host = document.getElementById('calc-vars-config');
    if (!host) return;
    var specs = CALC_VAR_SPECS[scenario];
    if (!specs) { host.style.display = 'none'; return; }
    host.style.display = '';
    var rows = specs.map(function(v) {
        var labelId = 'calc-var-' + v.key + '-label';
        return '<div style="margin-bottom:8px;">'
            + '<label id="' + labelId + '" style="font-size:.82rem;font-weight:500;">' + I18N.t(v.labelKey) + '</label>'
            + '<input type="text" class="calc-var-alea-input" id="calc-var-' + v.key + '-alea" aria-labelledby="' + labelId + '" value="' + v.domain.join(',') + '" placeholder="' + I18N.t('calc.var_placeholder_valeurs') + '" oninput="calcUpdatePreview()" style="font-family:monospace;">'
            + '<input type="number" class="calc-var-fixe-input" id="calc-var-' + v.key + '-fixe" aria-labelledby="' + labelId + '" value="' + v.domain[0] + '" oninput="calcUpdatePreview()" style="display:none;">'
            + '</div>';
    }).join('');
    host.innerHTML = '<label style="font-size:.85rem;color:#3730a3;font-weight:600;">' + I18N.t('calc.var_exercice_lbl') + '</label>'
        + '<div style="display:flex;gap:16px;align-items:center;margin:6px 0 10px;font-size:.85rem;">'
        + '<label style="cursor:pointer;"><input type="radio" name="calc-var-mode-r" value="aleatoire" checked onchange="calcVarModeChange(this.value)"> ' + I18N.t('calc.var_mode_aleatoire') + '</label>'
        + '<label style="cursor:pointer;"><input type="radio" name="calc-var-mode-r" value="fixe" onchange="calcVarModeChange(this.value)"> ' + I18N.t('calc.var_mode_fixe') + '</label>'
        + '<input type="hidden" id="calc-var-mode-hidden" value="aleatoire"></div>'
        + rows;
}

function calcVarModeChange(mode) {
    var h = document.getElementById('calc-var-mode-hidden');
    if (h) h.value = mode;
    document.querySelectorAll('.calc-var-alea-input').forEach(function(e) { e.style.display = (mode === 'aleatoire') ? '' : 'none'; });
    document.querySelectorAll('.calc-var-fixe-input').forEach(function(e) { e.style.display = (mode === 'fixe') ? '' : 'none'; });
    calcUpdatePreview();
}

// Retourne, pour la variable `key` du scénario en cours, soit "rand([...])" (mode aléatoire)
// soit la valeur fixe littérale saisie par l'enseignant — à utiliser directement comme membre droit d'une affectation Maxima.
function _calcVarValue(key) {
    var mode = (document.getElementById('calc-var-mode-hidden') || {}).value || 'aleatoire';
    if (mode === 'fixe') {
        var f = document.getElementById('calc-var-' + key + '-fixe');
        return f ? f.value.trim() : '0';
    }
    var a = document.getElementById('calc-var-' + key + '-alea');
    var domain = a ? a.value.trim() : '';
    return 'rand([' + domain + '])';
}

function calcFormChange() {
    var scenario = (document.getElementById('calc-scenario') || {}).value || 'derivee';
    var isAuto = CALC_AUTO.indexOf(scenario) >= 0;
    var bounds = document.getElementById('calc-row-bounds');
    var exprField = document.getElementById('calc-expr') && document.getElementById('calc-expr').closest('.field');
    if (bounds) bounds.style.display = (!isAuto && scenario === 'integrale') ? '' : 'none';
    if (exprField) exprField.style.display = isAuto ? 'none' : '';
    if (isAuto) _calcRenderVarConfig();
    else { var host = document.getElementById('calc-vars-config'); if (host) host.style.display = 'none'; }
    calcUpdatePreview();
}

function calcUpdatePreview() {
    var el = document.getElementById('calc-preview');
    if (!el) return;
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('calc-scenario') || 'derivee';
    var expr = gs('calc-expr') || '';
    var a = gs('calc-a') || '0';
    var b = gs('calc-b') || '1';
    var custText = (document.getElementById('calc-text') || {}).value || '';
    var toTex = function(s){ return (typeof maximaToLatex === 'function') ? maximaToLatex(s) : s; };
    var tex = toTex(expr), texA = toTex(a), texB = toTex(b);

    var html = '';

    if (scenario === 'derivee') {
        html = '<p>' + I18N.t('calc.preview_derivee', {expr: tex}) + '</p>';
    } else if (scenario === 'primitive') {
        html = '<p>' + I18N.t('calc.preview_primitive', {expr: tex}) + '</p>';
    } else if (scenario === 'integrale') {
        html = '<p>' + I18N.t('calc.preview_integrale', {a: texA, b: texB, expr: tex}) + '</p>';
    } else {
        html = '<em style="color:#6b7280;">' + I18N.t('calc.preview_auto_maxima') + '</em>';
    }
    el.innerHTML = (typeof _hsRenderMath === 'function') ? _hsRenderMath(custText + html) : (custText + html);
}
