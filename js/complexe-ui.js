// complexe-ui.js — Nombres complexes (UI, canevas, preview)

// ── Helpers de lecture ────────────────────────────────────────────────────────

function _cpxI() {
    var el = document.getElementById('cpx-complexno');
    return (el && el.value === 'j') ? 'j' : 'i';
}

function _cpxGs(id) { var e = document.getElementById(id); return e ? e.value : ''; }
function _cpxGn(id) { return parseFloat(_cpxGs(id)) || 0; }

function _cpxFmtN(n) {
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    return n.toFixed(4).replace(/\.?0+$/, '');
}

function _cpxFmt(re, im, letter) {
    letter = letter || _cpxI();
    var r = _cpxFmtN(re), i = _cpxFmtN(Math.abs(im));
    if (im === 0) return r;
    if (re === 0) return (im < 0 ? '-' : '') + (Math.abs(im) === 1 ? '' : i) + letter;
    var iStr = (Math.abs(im) === 1 ? '' : i) + letter;
    return r + (im > 0 ? '+' : '-') + iStr;
}

function _cpxFmtAngle(rad) {
    var Pi = Math.PI, tol = 1e-9;
    var fracs = [
        [0,'0'],[Pi/6,'\\pi/6'],[Pi/4,'\\pi/4'],[Pi/3,'\\pi/3'],[Pi/2,'\\pi/2'],
        [2*Pi/3,'2\\pi/3'],[3*Pi/4,'3\\pi/4'],[5*Pi/6,'5\\pi/6'],[Pi,'\\pi'],
        [-Pi/6,'-\\pi/6'],[-Pi/4,'-\\pi/4'],[-Pi/3,'-\\pi/3'],[-Pi/2,'-\\pi/2'],
        [-2*Pi/3,'-2\\pi/3'],[-3*Pi/4,'-3\\pi/4'],[-5*Pi/6,'-5\\pi/6'],[-Pi,'-\\pi']
    ];
    for (var k = 0; k < fracs.length; k++) {
        if (Math.abs(rad - fracs[k][0]) < tol) return fracs[k][1] + ' rad';
    }
    return rad.toFixed(4) + ' rad';
}

// Expression avec placeholders [Z1], [Z2] — jamais de valeurs JS
function _cpxExprPh(op) {
    if (op === '/') return '\\dfrac{[Z1]}{[Z2]}';
    if (op === '*') return '\\left([Z1]\\right) \\times \\left([Z2]\\right)';
    if (op === '-') return '\\left([Z1]\\right) - \\left([Z2]\\right)';
    return '\\left([Z1]\\right) + \\left([Z2]\\right)';
}

// ── Canevas : TOUJOURS des placeholders [Z1] etc., jamais de valeurs JS ──────
// _cpxReplace() dans gen-math-complexe.js les convertira en {@q${X}_...@}
// au moment de la génération, quel que soit le mode (fixe ou aléatoire).

function _cpxGenEnonce(scenario, op, letter) {
    if (scenario === 'forme-alg') {
        return I18N.t('tpl.cpx_text_formealg', {c: letter})
            + '\n\\[ ' + _cpxExprPh(op) + ' \\]';
    }
    if (scenario === 'module-arg') {
        return I18N.t('tpl.cpx_enonce_modarg');
    }
    if (scenario === 'equation-2deg') {
        return I18N.t('tpl.cpx_enonce_eq');
    }
    if (scenario === 'affixes') {
        return I18N.t('tpl.cpx_enonce_affixes');
    }
    if (scenario === 'conjugue') {
        return I18N.t('tpl.cpx_enonce_conjugue');
    }
    return '';
}

function _cpxGenFbgen(scenario, op, letter) {
    var s = '<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">';
    s += '<strong>' + I18N.t('tpl.cpx_correction_titre') + '</strong><br><br>';

    if (scenario === 'forme-alg') {
        if (op === '/') {
            s += '<strong>' + I18N.t('tpl.cpx_method_div') + '</strong><br>';
            s += '\\[ \\frac{[Z1]}{[Z2]} = \\frac{[Z1] \\cdot \\overline{[Z2]}}{|[Z2]|^2} \\]';
            s += I18N.t('tpl.cpx_qnote_resultat_cap') + ' : \\([RESULT]\\)';
        } else if (op === '*') {
            s += '<strong>' + I18N.t('tpl.cpx_method_mul', {c: letter}) + '</strong><br>';
            s += '\\[ \\left([Z1]\\right) \\times \\left([Z2]\\right)'
               + ' = (\\text{Re}_1\\cdot\\text{Re}_2 - \\text{Im}_1\\cdot\\text{Im}_2)'
               + ' + (\\text{Re}_1\\cdot\\text{Im}_2 + \\text{Im}_1\\cdot\\text{Re}_2)'
               + letter + ' \\]';
            s += I18N.t('tpl.cpx_qnote_resultat_cap') + ' : \\([RESULT]\\)';
        } else {
            var opSym = op === '+' ? '+' : '-';
            s += '<strong>' + I18N.t(op === '+' ? 'tpl.cpx_method_add' : 'tpl.cpx_method_sub') + '</strong><br>';
            s += '\\[ \\left([Z1]\\right) ' + opSym + ' \\left([Z2]\\right)'
               + ' = (\\text{Re}_1 ' + opSym + ' \\text{Re}_2)'
               + ' + (\\text{Im}_1 ' + opSym + ' \\text{Im}_2)' + letter + ' \\]';
            s += I18N.t('tpl.cpx_qnote_resultat_cap') + ' : \\([RESULT]\\)';
        }
    }

    if (scenario === 'module-arg') {
        s += '<strong>' + I18N.t('tpl.cpx_module') + ' :</strong><br>';
        s += '\\[ |z| = \\sqrt{\\text{Re}(z)^2 + \\text{Im}(z)^2} = [MOD] \\]<br>';
        s += '<strong>' + I18N.t('tpl.cpx_argument') + '</strong> \\(\\theta \\in ]{-}\\pi\\,;\\,\\pi]\\) :<br>';
        s += '\\[ \\cos\\theta = \\frac{\\text{Re}(z)}{|z|} \\quad \\text{' + I18N.t('tpl.cpx_et') + '} \\quad \\sin\\theta = \\frac{\\text{Im}(z)}{|z|} \\]';
        s += '\\(\\arg(z) = [ARG]\\)<br><br>';
        s += I18N.t('tpl.cpx_verification') + ' : \\(z = [MOD] \\cdot e^{' + letter + '[ARG]}\\)';
    }

    if (scenario === 'equation-2deg') {
        s += I18N.t('tpl.cpx_equation_label') + ' : \\(z^2 + \\left([EQB]\\right)z + \\left([EQC]\\right) = 0\\)<br><br>';
        s += '<strong>1. ' + I18N.t('tpl.cpx_discriminant') + ' :</strong><br>';
        s += '\\[ \\Delta = b^2 - 4c = \\left([EQB]\\right)^2 - 4 \\times \\left([EQC]\\right) = [DELTA] \\]<br>';
        s += '<strong>2. \\(\\Delta &lt; 0\\) → ' + I18N.t('tpl.cpx_racines_conjuguees') + ' :</strong><br>';
        s += '\\[ z_1 = \\frac{-b + ' + letter + '\\sqrt{|\\Delta|}}{2} = [Z1] \\]';
        s += '\\[ z_2 = \\frac{-b - ' + letter + '\\sqrt{|\\Delta|}}{2} = [Z2] = \\overline{z_1} \\]<br>';
        s += '<strong>' + I18N.t('tpl.cpx_viete') + ' :</strong><br>';
        s += '\\(z_1 + z_2 = -\\left([EQB]\\right)\\) &nbsp;·&nbsp; \\(z_1 \\times z_2 = \\left([EQC]\\right)\\)';
    }

    if (scenario === 'affixes') {
        s += I18N.t('tpl.cpx_donnees') + ' : \\(z_A = [ZA]\\)  ' + I18N.t('tpl.cpx_et') + '  \\(z_B = [ZB]\\)<br><br>';
        s += '<strong>' + I18N.t('tpl.cpx_affixe_milieu') + ' :</strong><br>';
        s += '\\[ z_I = \\frac{z_A + z_B}{2} = [ZI] \\]<br>';
        s += '<strong>' + I18N.t('tpl.cpx_distance') + ' \\(AB\\) :</strong><br>';
        s += '\\[ AB = |z_B - z_A| = [AB] \\]';
    }

    if (scenario === 'conjugue') {
        s += I18N.t('tpl.cpx_text_conj_formule', {c: letter}) + '<br>';
        s += I18N.t('tpl.cpx_conj_note') + '<br><br>';
        s += '\\(z = [Z]\\) &nbsp;→&nbsp; \\(\\bar{z} = [ZBAR]\\)<br><br>';
        s += '<strong>' + I18N.t('tpl.cpx_proprietes') + ' :</strong><br>';
        s += '\\(z + \\bar{z} = 2\\,\\text{Re}(z)\\) (' + I18N.t('tpl.cpx_reel') + ') &nbsp;·&nbsp;';
        s += '\\(z \\times \\bar{z} = |z|^2\\) (' + I18N.t('tpl.cpx_reel_positif') + ')';
    }

    s += '</div>';
    return s;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { _cpxGenFbgen: _cpxGenFbgen };
}

// ── Régénération du canevas ───────────────────────────────────────────────────

function cpxSetCanvas() {
    var scenario = _cpxGs('cpx-scenario') || 'forme-alg';
    var op       = _cpxGs('cpx-op') || '*';
    var letter   = _cpxI();

    setRichVal('cpx-text',  _cpxGenEnonce(scenario, op, letter));
    setRichVal('cpx-fbgen', _cpxGenFbgen(scenario, op, letter));
}

// ── Copier l'expression principale ───────────────────────────────────────────

function cpxCopyExpression() {
    var scenario = _cpxGs('cpx-scenario') || 'forme-alg';
    var op       = _cpxGs('cpx-op') || '*';
    var exprs = {
        'forme-alg':     '\\[' + _cpxExprPh(op) + '\\]',
        'module-arg':    '[Z]',
        'equation-2deg': '\\(z^2 + \\left([EQB]\\right)z + \\left([EQC]\\right) = 0\\)',
        'affixes':       '[ZA]  ,  [ZB]',
        'conjugue':      '[Z]'
    };
    var expr = exprs[scenario] || '[Z]';
    navigator.clipboard.writeText(expr).then(function() {
        var btn = document.querySelector('[onclick="cpxCopyExpression()"]');
        if (btn) {
            var orig = btn.textContent;
            btn.textContent = '✅ ' + I18N.t('cpx.copie_reussie');
            setTimeout(function() { btn.textContent = orig; }, 1800);
        }
    }).catch(function() { prompt(I18N.t('cpx.copier_prompt'), expr); });
}

// ── Feedbacks détaillés (par nœud PRT) : rendu dynamique ─────────────────────

function cpxRenderFbDetail() {
    var container = document.getElementById('cpx-fb-detail');
    if (!container || container.dataset.built || typeof CPX_FB_DEFS === 'undefined') return;

    var html = '';
    Object.keys(CPX_FB_DEFS).forEach(function(scn) {
        var groupId = 'cpx-fb-group-' + scn.replace(/[^a-z0-9]/gi, '');
        html += '<div class="cpx-fb-group" id="' + groupId + '" style="display:none">';
        CPX_FB_DEFS[scn].forEach(function(item) {
            var id = _cpxFbId(scn, item.key);
            html += '<div class="field"><label>' + I18N.t(item.labelKey)
                 + '</label>'
                 + '<div class="rich-preview hs-minh42" id="prev-' + id + '" tabindex="0" role="button" onclick="openRich(\'' + id + '\')"></div>'
                 + '<textarea id="' + id + '" style="display:none"></textarea></div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
    container.dataset.built = '1';

    Object.keys(CPX_FB_DEFS).forEach(function(scn) {
        CPX_FB_DEFS[scn].forEach(function(item) {
            setRichVal(_cpxFbId(scn, item.key), I18N.t(item.defKey));
        });
    });
}

// ── Mise à jour du formulaire ─────────────────────────────────────────────────

function cpxFormChange() {
    var scenario = _cpxGs('cpx-scenario') || 'forme-alg';
    var mode     = _cpxGs('cpx-mode') || 'fixe';
    var isFixed  = mode === 'fixe';

    var show    = function(id, v) { var el = document.getElementById(id); if (el) el.style.display = v ? '' : 'none'; };
    var setText = function(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; };

    show('cpx-field-op',     scenario === 'forme-alg');
    show('cpx-row-z1',       isFixed && scenario !== 'equation-2deg');
    show('cpx-row-z2',       isFixed && (scenario === 'forme-alg' || scenario === 'affixes'));
    show('cpx-row-eq',       isFixed && scenario === 'equation-2deg');
    show('cpx-row-rand',     !isFixed);
    show('cpx-rand-eq-hint', !isFixed && scenario === 'equation-2deg');

    cpxRenderFbDetail();
    if (typeof CPX_FB_DEFS !== 'undefined') {
        Object.keys(CPX_FB_DEFS).forEach(function(scn) {
            show('cpx-fb-group-' + scn.replace(/[^a-z0-9]/gi, ''), scn === scenario);
        });
    }

    if (scenario === 'affixes') {
        setText('cpx-lbl-a', I18N.t('cpx.lbl_partie_reelle_za'));
        setText('cpx-lbl-b', I18N.t('cpx.lbl_partie_imag_za'));
        setText('cpx-lbl-c', I18N.t('cpx.lbl_partie_reelle_zb'));
        setText('cpx-lbl-d', I18N.t('cpx.lbl_partie_imag_zb'));
    } else {
        setText('cpx-lbl-a', I18N.t('cpx.lbl_partie_reelle_a'));
        setText('cpx-lbl-b', I18N.t('cpx.lbl_partie_imag_b'));
        setText('cpx-lbl-c', I18N.t('cpx.lbl_partie_reelle_c_z2'));
        setText('cpx-lbl-d', I18N.t('cpx.lbl_partie_imag_d_z2'));
    }

    cpxSetCanvas();
    cpxUpdatePreview();
}

// ── Preview (valeurs JS pour aperçu local uniquement) ────────────────────────

function cpxFmtN(n) { return _cpxFmtN(n); }
function cpxFmtComplex(re, im) { return _cpxFmt(re, im); }
function cpxFmtAngle(rad) { return _cpxFmtAngle(rad); }

function cpxUpdatePreview() {
    var el = document.getElementById('cpx-preview');
    if (!el) return;
    var scenario = _cpxGs('cpx-scenario') || 'forme-alg';
    var mode     = _cpxGs('cpx-mode') || 'fixe';
    var letter   = _cpxI();
    var min = parseInt(_cpxGs('cpx-rand-min')) || -5;
    var max = parseInt(_cpxGs('cpx-rand-max')) || 5;

    if (mode === 'aleatoire') {
        var labels = {
            'forme-alg':     I18N.t('cpx.preview_forme_alg_alea'),
            'module-arg':    I18N.t('cpx.preview_module_arg_alea', {letter: letter}),
            'equation-2deg': I18N.t('cpx.preview_equation_alea', {letter: letter})
        };
        el.innerHTML = '<em>' + (labels[scenario] || I18N.t('cpx.preview_mode_aleatoire_default')) + '</em>'
                     + '<br><small style="color:#6b7280">' + I18N.t('cpx.preview_bornes', {min: min, max: max, letter: letter}) + '</small>';
        return;
    }

    var a = _cpxGn('cpx-a'), b = _cpxGn('cpx-b');
    var c = _cpxGn('cpx-c'), d = _cpxGn('cpx-d');
    var op = _cpxGs('cpx-op') || '*';
    var html = '';

    if (scenario === 'forme-alg') {
        var opSym = {'+':'+', '-':'−', '*':'×', '/':'÷'}[op] || op;
        var re, im;
        if (op==='+'){re=a+c;im=b+d;}
        else if(op==='-'){re=a-c;im=b-d;}
        else if(op==='*'){re=a*c-b*d;im=a*d+b*c;}
        else{var dn=c*c+d*d;re=dn?(a*c+b*d)/dn:NaN;im=dn?(b*c-a*d)/dn:NaN;}
        html = '(' + _cpxFmt(a,b) + ') ' + opSym + ' (' + _cpxFmt(c,d) + ')'
             + ' = <strong>' + _cpxFmt(re, im) + '</strong>';
    } else if (scenario === 'module-arg') {
        var mod = Math.sqrt(a*a+b*b), arg = Math.atan2(b, a);
        html = 'z = ' + _cpxFmt(a, b)
             + '<br>|z| = <strong>' + _cpxFmtN(mod) + '</strong>'
             + '  · arg(z) = <strong>' + _cpxFmtAngle(arg) + '</strong>';
    } else if (scenario === 'equation-2deg') {
        var eqb = _cpxGn('cpx-eq-b'), eqc = _cpxGn('cpx-eq-c');
        var disc = eqb*eqb - 4*eqc;
        if (disc < 0) {
            var zRe = -eqb/2, zIm = Math.sqrt(-disc)/2;
            html = 'z² + (' + _cpxFmtN(eqb) + ')z + (' + _cpxFmtN(eqc) + ') = 0'
                 + '<br>Δ = ' + _cpxFmtN(disc) + ' &lt; 0 ✓'
                 + '<br>z₁ = <strong>' + _cpxFmt(zRe, zIm) + '</strong>'
                 + '  z₂ = <strong>' + _cpxFmt(zRe, -zIm) + '</strong>';
        } else {
            html = '<span style="color:#dc2626;">' + I18N.t('cpx.preview_racines_reelles', {disc: _cpxFmtN(disc)}) + '</span>';
        }
    } else if (scenario === 'affixes') {
        var midRe = (a+c)/2, midIm = (b+d)/2;
        var dist = Math.sqrt((c-a)*(c-a)+(d-b)*(d-b));
        html = 'z_A = ' + _cpxFmt(a,b) + '  · z_B = ' + _cpxFmt(c,d)
             + '<br>z_I = <strong>' + _cpxFmt(midRe, midIm) + '</strong>'
             + '  · AB = <strong>' + _cpxFmtN(dist) + '</strong>';
    } else {
        html = 'z = ' + _cpxFmt(a, b) + ' → z̄ = <strong>' + _cpxFmt(a, -b) + '</strong>';
    }
    el.innerHTML = html;
}
