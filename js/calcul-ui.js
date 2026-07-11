// calcul-ui.js — Calcul différentiel (dérivée, primitive, intégrale définie)

var CALC_AUTO = ['derivee-produit','primitive-exp','integrale-def','convexite-tangente','encadrement-tvi','aire-courbes','tangente-ext'];

// Variables "racines" (tirées directement par rand([...]) dans les XML de référence) par scénario auto.
// Chaque variable peut être configurée par l'enseignant comme aléatoire (liste de valeurs pour rand()) ou fixe (valeur unique).
var CALC_VAR_SPECS = {
    'derivee-produit':    [{key:'a', label:'Coefficient a (dans u(x)=ax+b)', domain:[1,2,3]},
                           {key:'b', label:'Constante b (dans u(x)=ax+b)', domain:[-3,-2,-1,1,2]}],
    'primitive-exp':      [{key:'a', label:"Coefficient a (dans e^(ax))", domain:[-2,-1,1,2]},
                           {key:'b', label:"Coefficient b (devant e^(ax))", domain:[2,3,4,5]},
                           {key:'c', label:'Constante c', domain:[1,2,3]}],
    'integrale-def':      [{key:'d', label:"Coefficient d (dans e^(dx))", domain:[-1,-2]},
                           {key:'c', label:"Coefficient c (devant e^(dx))", domain:[2,3]},
                           {key:'f', label:'Constante f', domain:[1,2]}],
    'convexite-tangente': [{key:'k', label:"Coefficient k (devant e^x)", domain:[1,2,3]},
                           {key:'m', label:'Coefficient m (devant x)', domain:[-2,-1,1,2]}],
    'encadrement-tvi':    [{key:'b', label:'Chiffre décimal de α (α = 1 + b/10)', domain:[2,3,4,5,6,7,8,9]}],
    'aire-courbes':       [{key:'a', label:'Première abscisse a', domain:[-3,-2,-1,1,2]},
                           {key:'offset', label:'Écart entre les abscisses (b − a)', domain:[2,3,4]},
                           {key:'k', label:'Coefficient k', domain:[1,2,3]}],
    'tangente-ext':       [{key:'a', label:'Abscisse a (1ère tangente)', domain:[-3,-2,-1,1,2,3]},
                           {key:'b', label:'Abscisse b (2e tangente, ≠ a)', domain:[-3,-2,-1,1,2,3]},
                           {key:'k', label:'Constante k (dans f(x)=x²+k)', domain:[-2,-1,0,1,2]}]
};

function _calcRenderVarConfig() {
    var scenario = (document.getElementById('calc-scenario') || {}).value || 'derivee-produit';
    var host = document.getElementById('calc-vars-config');
    if (!host) return;
    var specs = CALC_VAR_SPECS[scenario];
    if (!specs) { host.style.display = 'none'; return; }
    host.style.display = '';
    var rows = specs.map(function(v) {
        return '<div style="margin-bottom:8px;">'
            + '<label style="font-size:.82rem;font-weight:500;">' + v.label + '</label>'
            + '<input type="text" class="calc-var-alea-input" id="calc-var-' + v.key + '-alea" value="' + v.domain.join(',') + '" placeholder="valeurs possibles, ex: 1,2,3" oninput="calcUpdatePreview()" style="font-family:monospace;">'
            + '<input type="number" class="calc-var-fixe-input" id="calc-var-' + v.key + '-fixe" value="' + v.domain[0] + '" oninput="calcUpdatePreview()" style="display:none;">'
            + '</div>';
    }).join('');
    host.innerHTML = '<label style="font-size:.85rem;color:#3730a3;font-weight:600;">Variables de l\'exercice</label>'
        + '<div style="display:flex;gap:16px;align-items:center;margin:6px 0 10px;font-size:.85rem;">'
        + '<label style="cursor:pointer;"><input type="radio" name="calc-var-mode-r" value="aleatoire" checked onchange="calcVarModeChange(this.value)"> Aléatoire (Maxima)</label>'
        + '<label style="cursor:pointer;"><input type="radio" name="calc-var-mode-r" value="fixe" onchange="calcVarModeChange(this.value)"> Valeurs fixes</label>'
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
        html = '<p>Soit \\(f\\) d\xe9finie par \\(f(x)=' + tex + '\\). Calculer \\(f\'(x)\\).</p>';
    } else if (scenario === 'primitive') {
        html = '<p>D\xe9terminer une primitive \\(F\\) de \\(f(x)=' + tex + '\\).</p>';
    } else if (scenario === 'integrale') {
        html = '<p>Calculer : \\( \\displaystyle\\int_{' + texA + '}^{' + texB + '} ' + tex + '\\,dx \\)</p>';
    } else {
        html = '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement par Maxima (valeurs al\xe9atoires internes \xe0 chaque affichage) — voir l\'aper\xe7u \xe9l\xe8ve ci-dessous pour un exemple concret.</em>';
    }
    el.innerHTML = (typeof _hsRenderMath === 'function') ? _hsRenderMath(custText + html) : (custText + html);
}
