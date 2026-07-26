// inequation-ui.js — Inéquations (linéaire, trinôme, valeur absolue)
// Notation STACK des intervalles : oo(a,b) oc(a,b) co(a,b) cc(a,b) union(...)

function ineqFormChange() {
    var scenario = (document.getElementById('ineq-scenario')||{}).value || 'lineaire';
    var mode = (document.querySelector('input[name="ineq-mode-r"]:checked')||{}).value || 'aleatoire';
    var fc = document.getElementById('ineq-field-c');
    if (fc) fc.style.display = (scenario === 'lineaire' || mode !== 'fixe') ? 'none' : '';
    var ft = document.getElementById('ineq-field-tans');
    if (ft) ft.style.display = (mode === 'fixe') ? '' : 'none';
    var showAB = mode === 'fixe';
    var fa = document.getElementById('ineq-a'), fb = document.getElementById('ineq-b');
    if (fa && fa.closest('.field')) fa.closest('.field').style.display = showAB ? '' : 'none';
    if (fb && fb.closest('.field')) fb.closest('.field').style.display = showAB ? '' : 'none';
    ineqCompute();
}

function ineqFmt(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return n.toFixed(6).replace(/\.?0+$/,'');
}

function ineqToSTACK(lo, hi, loIncl, hiIncl) {
    var loBrace = loIncl ? 'c' : 'o';
    var hiBrace = hiIncl ? 'c' : 'o';
    var loStr = (lo === -Infinity) ? '-inf' : ineqFmt(lo);
    var hiStr = (hi === Infinity)  ? 'inf'  : ineqFmt(hi);
    return loBrace + hiBrace + '(' + loStr + ',' + hiStr + ')';
}

function ineqCompute() {
    var el = document.getElementById('ineq-preview');
    var tanEl = document.getElementById('ineq-tans');
    if (!el) return;

    var mode = (document.querySelector('input[name="ineq-mode-r"]:checked')||{}).value || 'aleatoire';
    if (mode !== 'fixe') {
        el.innerHTML = '<em style="color:#6b7280;">' + I18N.t('ineq.preview_auto') + '</em>';
        return;
    }

    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var scenario = gs('ineq-scenario') || 'lineaire';
    var a = parseFloat(gs('ineq-a')) || 0;
    var b = parseFloat(gs('ineq-b')) || 0;
    var c = parseFloat(gs('ineq-c')) || 0;
    var op = gs('ineq-op') || '>';
    var strict = op === '>' || op === '<';
    var greater = op === '>' || op === '>=';

    var tans = '', preview = '', autoComputed = true;

    if (scenario === 'lineaire') {
        // ax + b ▷ 0  →  x ▷ -b/a
        if (a === 0) {
            var lhsCst = b;
            var satisfied = greater ? lhsCst > 0 : lhsCst < 0;
            if (!strict) satisfied = greater ? lhsCst >= 0 : lhsCst <= 0;
            tans = satisfied ? 'all' : 'none';
            preview = '<strong>' + ineqFmt(b) + ' ' + op + ' 0</strong> → '
                + (satisfied ? '<strong>ℝ (toujours vrai)</strong>' : '<strong>∅ (impossible)</strong>');
        } else {
            var x0 = -b / a;
            var trueGreater = a > 0 ? greater : !greater;
            if (trueGreater) {
                tans = ineqToSTACK(x0, Infinity, !strict, false);
                preview = '<strong>' + ineqFmt(a) + 'x + (' + ineqFmt(b) + ') ' + op + ' 0</strong>';
                preview += ' → x ' + (trueGreater ? (strict?'>':'≥') : (strict?'<':'≤')) + ' ' + ineqFmt(x0);
            } else {
                tans = ineqToSTACK(-Infinity, x0, false, !strict);
                preview = '<strong>' + ineqFmt(a) + 'x + (' + ineqFmt(b) + ') ' + op + ' 0</strong>';
                preview += ' → x ' + (strict ? '<' : '≤') + ' ' + ineqFmt(x0);
            }
        }

    } else if (scenario === 'trinome') {
        // ax² + bx + c ▷ 0
        if (a === 0) {
            preview = '<em>' + I18N.t('ineq.preview_a_zero') + '</em>';
            autoComputed = false;
        } else {
            var delta = b*b - 4*a*c;
            if (delta < 0) {
                var alwaysPos = a > 0;
                var satisfied = greater ? alwaysPos : !alwaysPos;
                tans = satisfied ? 'all' : 'none';
                preview = 'Δ = ' + ineqFmt(delta) + ' < 0 → trinôme toujours '
                    + (a > 0 ? 'positif' : 'négatif') + ' → '
                    + (satisfied ? '<strong>ℝ</strong>' : '<strong>∅</strong>');
            } else if (Math.abs(delta) < 1e-9) {
                var x0d = -b/(2*a);
                if (greater) {
                    tans = strict ? 'union(oo(-inf,'+ineqFmt(x0d)+'),oo('+ineqFmt(x0d)+',inf))' : 'all';
                } else {
                    tans = strict ? 'none' : 'cc('+ineqFmt(x0d)+','+ineqFmt(x0d)+')';
                }
                preview = 'Δ = 0, x₀ = ' + ineqFmt(x0d) + ' → ' + (a>0?'trinôme ≥ 0 (carré)':'trinôme ≤ 0');
            } else {
                var x1 = (-b - Math.sqrt(delta))/(2*a);
                var x2 = (-b + Math.sqrt(delta))/(2*a);
                if (x1 > x2) { var tmp=x1; x1=x2; x2=tmp; }
                if ((a > 0 && greater) || (a < 0 && !greater)) {
                    tans = 'union(' + ineqToSTACK(-Infinity, x1, false, !strict) + ','
                         + ineqToSTACK(x2, Infinity, !strict, false) + ')';
                    preview = 'x ∈ ]−∞; ' + ineqFmt(x1) + (strict?'[':']+') + ' ∪ ' + (strict?']':'[')+ineqFmt(x2)+'; +∞[';
                } else {
                    tans = ineqToSTACK(x1, x2, !strict, !strict);
                    preview = 'x ∈ ' + (strict?']':'[') + ineqFmt(x1) + '; ' + ineqFmt(x2) + (strict?'[':']');
                }
            }
        }

    } else if (scenario === 'valeur-abs') {
        // |ax + b| ▷ c
        if (c < 0) {
            tans = (op === '>' || op === '>=') ? 'all' : 'none';
            preview = '|…| ≥ 0 > c → ' + tans;
        } else {
            var pivot1 = (-b - c) / a;
            var pivot2 = (-b + c) / a;
            if (pivot1 > pivot2) { var tmp2=pivot1; pivot1=pivot2; pivot2=tmp2; }
            if (op === '<' || op === '<=') {
                tans = ineqToSTACK(pivot1, pivot2, op === '<=', op === '<=');
                preview = 'x ∈ ' + (op==='<'?']':'[') + ineqFmt(pivot1) + '; ' + ineqFmt(pivot2) + (op==='<'?'[':']');
            } else {
                tans = 'union(' + ineqToSTACK(-Infinity, pivot1, false, op==='>=') + ','
                     + ineqToSTACK(pivot2, Infinity, op==='>=', false) + ')';
                preview = 'x ∈ ]−∞; ' + ineqFmt(pivot1) + (op==='>='?']':'[')
                        + ' ∪ ' + (op==='>='?'[':']') + ineqFmt(pivot2) + '; +∞[';
            }
        }
    }

    if (autoComputed && tans && tanEl && !tanEl._userEdited) {
        tanEl.value = tans;
    }

    el.innerHTML = preview || '<em style="color:#6b7280;">' + I18N.t('ineq.preview_indisponible') + '</em>';
}

(function(){
    document.addEventListener('DOMContentLoaded', function(){
        var el = document.getElementById('ineq-tans');
        if (el) el.addEventListener('input', function(){ el._userEdited = true; });
    });
})();
