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

// Remplace [Z1], [Z2] etc. par les variables Maxima
function _cpxReplace(text, X, map) {
    if (!text) return text;
    return text.replace(/\[([A-Z0-9_]+)\]/g, function(m, key) {
        return map[key] !== undefined ? map[key] : m;
    });
}

// ── Feedbacks détaillés par nœud PRT : textes par défaut (placeholders [X] remplacés via pmap) ──
// label/def ne sont pas des chaînes littérales mais des clés I18N (résolues à l'usage
// par _cpxFb() et complexe-ui.js, pas figées à l'exécution de ce script — voir tpl.cpx_fbdef_*).
const CPX_FB_DEFS = {
    'forme-alg': [
        {key:'ok',   labelKey:'tpl.cpx_fbdef_formealg_ok_label',   defKey:'tpl.cpx_fbdef_formealg_ok_def'},
        {key:'conj', labelKey:'tpl.cpx_fbdef_formealg_conj_label', defKey:'tpl.cpx_fbdef_formealg_conj_def'},
        {key:'ok2',  labelKey:'tpl.cpx_fbdef_formealg_ok2_label',  defKey:'tpl.cpx_fbdef_formealg_ok2_def'},
        {key:'err',  labelKey:'tpl.cpx_fbdef_formealg_err_label',  defKey:'tpl.cpx_fbdef_formealg_err_def'}
    ],
    'module-arg': [
        {key:'perfect',       labelKey:'tpl.cpx_fbdef_modarg_perfect_label',     defKey:'tpl.cpx_fbdef_modarg_perfect_def'},
        {key:'argok-modnok',  labelKey:'tpl.cpx_fbdef_modarg_argokmodnok_label', defKey:'tpl.cpx_fbdef_modarg_argokmodnok_def'},
        {key:'toutnok',       labelKey:'tpl.cpx_fbdef_modarg_toutnok_label',     defKey:'tpl.cpx_fbdef_modarg_toutnok_def'},
        {key:'quadrant',      labelKey:'tpl.cpx_fbdef_modarg_quadrant_label',    defKey:'tpl.cpx_fbdef_modarg_quadrant_def'},
        {key:'argerr',        labelKey:'tpl.cpx_fbdef_modarg_argerr_label',      defKey:'tpl.cpx_fbdef_modarg_argerr_def'}
    ],
    'equation-2deg': [
        {key:'perfect',     labelKey:'tpl.cpx_fbdef_eq_perfect_label',     defKey:'tpl.cpx_fbdef_eq_perfect_def'},
        {key:'z2wrong',     labelKey:'tpl.cpx_fbdef_eq_z2wrong_label',     defKey:'tpl.cpx_fbdef_eq_z2wrong_def'},
        {key:'toutnok',     labelKey:'tpl.cpx_fbdef_eq_toutnok_label',     defKey:'tpl.cpx_fbdef_eq_toutnok_def'},
        {key:'swaptotal',   labelKey:'tpl.cpx_fbdef_eq_swaptotal_label',   defKey:'tpl.cpx_fbdef_eq_swaptotal_def'},
        {key:'swappartial', labelKey:'tpl.cpx_fbdef_eq_swappartial_label', defKey:'tpl.cpx_fbdef_eq_swappartial_def'}
    ],
    'affixes': [
        {key:'perfect',       labelKey:'tpl.cpx_fbdef_affixes_perfect_label',     defKey:'tpl.cpx_fbdef_affixes_perfect_def'},
        {key:'ziok-abwrong',  labelKey:'tpl.cpx_fbdef_affixes_ziokabwrong_label', defKey:'tpl.cpx_fbdef_affixes_ziokabwrong_def'},
        {key:'ziwrong-abok',  labelKey:'tpl.cpx_fbdef_affixes_ziwrongabok_label', defKey:'tpl.cpx_fbdef_affixes_ziwrongabok_def'},
        {key:'toutnok',       labelKey:'tpl.cpx_fbdef_affixes_toutnok_label',     defKey:'tpl.cpx_fbdef_affixes_toutnok_def'}
    ],
    'conjugue': [
        {key:'perfect', labelKey:'tpl.cpx_fbdef_conj_perfect_label', defKey:'tpl.cpx_fbdef_conj_perfect_def'},
        {key:'forgot',  labelKey:'tpl.cpx_fbdef_conj_forgot_label',  defKey:'tpl.cpx_fbdef_conj_forgot_def'},
        {key:'wrong',   labelKey:'tpl.cpx_fbdef_conj_wrong_label',   defKey:'tpl.cpx_fbdef_conj_wrong_def'}
    ]
};

function _cpxFbId(scenario, key) { return 'cpx-fb-' + scenario.replace(/[^a-z0-9]/gi, '') + '-' + key; }

// Construit un noeud PRT canonique (JSON) — voir js/prt-manager.js buildPrtXml()
function _cpxNode(name, desc, test, sans, tans, trueNext, trueScore, trueNote, trueFb, falseNext, falseScore, falseNote, falseFb) {
    return {
        name: String(name), description: desc || '', answertest: test, sans: sans, tans: tans,
        testoptions: '', quiet: '0',
        truescoremode: '=', truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
        trueanswernote: trueNote, truefeedback: trueFb || '',
        falsescoremode: '=', falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
        falseanswernote: falseNote, falsefeedback: falseFb || ''
    };
}

// Lit le feedback édité par l'enseignant (ou le défaut), et applique les placeholders [Z1] etc.
function _cpxFb(scenario, key, X, pmap) {
    var defs = CPX_FB_DEFS[scenario] || [];
    var d = defs.find(function(x){ return x.key === key; });
    var fallback = d ? I18N.t(d.defKey) : '';
    var el = document.getElementById(_cpxFbId(scenario, key));
    var raw = (el && el.value.trim()) ? el.value : fallback;
    return _cpxReplace(raw, X, pmap);
}

function _cpxBuildParams() {
    var gs  = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var gn  = function(id){ return parseFloat(gs(id)) || 0; };
    var bareme    = parseFloat(gs('cpx-bareme')) || 1;
    var scenario  = gs('cpx-scenario') || 'forme-alg';
    var complexno = gs('cpx-complexno') || 'i';
    var mode      = gs('cpx-mode') || 'fixe';
    var op        = gs('cpx-op') || '*';
    var randMin   = parseInt(gs('cpx-rand-min')) || -5;
    var randMax   = parseInt(gs('cpx-rand-max')) || 5;
    var custText  = gs('cpx-text').trim();
    var custFbgen = gs('cpx-fbgen').trim();

    var fa = gn('cpx-a') || 3,  fb = gn('cpx-b') || 2;
    var fc = gn('cpx-c') || 1,  fd = gn('cpx-d') || -1;
    var feqb = gn('cpx-eq-b') || -2, feqc = gn('cpx-eq-c') || 5;

    var fbOverrides = {};
    Object.keys(CPX_FB_DEFS).forEach(function (scn) {
        CPX_FB_DEFS[scn].forEach(function (d) {
            var el = document.getElementById(_cpxFbId(scn, d.key));
            fbOverrides[scn + '|' + d.key] = (el && el.value.trim()) ? el.value : undefined;
        });
    });

    return {
        bareme: bareme, scenario: scenario, complexno: complexno, mode: mode, op: op,
        randMin: randMin, randMax: randMax, custText: custText, custFbgen: custFbgen,
        fa: fa, fb: fb, fc: fc, fd: fd, feqb: feqb, feqc: feqc,
        fbOverrides: fbOverrides
    };
}

async function genComplexe(X) {
    var p = _cpxBuildParams();
    // Étape 3 (PLAN.md) : tente la génération côté serveur, avec repli
    // automatique sur le calcul local si le serveur échoue ou est absent.
    try {
        var res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'complexe', X: X, params: p})
        });
        if (res.ok) {
            var data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "complexe", repli sur le calcul local (session expirée ?).');
    } catch (e) { console.warn('[stackforge] /api/generate injoignable pour "complexe", repli sur le calcul local.', e); }
    return genComplexeCore(X, p);
}

function genComplexeCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var cpxGenFbgen_D = deps._cpxGenFbgen || _cpxGenFbgen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;
    var inferFbKind_D = deps.inferFbKind || inferFbKind;

    function _cpxFb_D(scenario, key, X, pmap) {
        var defs = CPX_FB_DEFS[scenario] || [];
        var d = defs.find(function (x) { return x.key === key; });
        var fallback = d ? I18N_D.t(d.defKey) : '';
        var raw = p.fbOverrides[scenario + '|' + key] || fallback;
        return _cpxReplace(raw, X, pmap);
    }

    var bareme = p.bareme, scenario = p.scenario, complexno = p.complexno, mode = p.mode, op = p.op;
    var randMin = p.randMin, randMax = p.randMax, custText = p.custText, custFbgen = p.custFbgen;
    var fa = p.fa, fb = p.fb, fc = p.fc, fd = p.fd, feqb = p.feqb, feqc = p.feqc;

    var HDR = '<div style="background:#06b6d4;border-left:5px solid #0891b2;border-radius:0 8px 8px 0;'
            + 'padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
            + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N_D.t('tpl.cpx_banniere') + '</strong> '
            + '<span style="background:#0891b2;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">'
            + '/ ' + bareme + ' pt</span></div>';

    var RI  = 'ri(a,b) := a + rand(b-a+1);\n'
            + 'rinz(a,b) := block([v], v:ri(a,b), while v=0 do v:ri(a,b), v);\n';
    var mop = {'+':'+', '-':'-', '*':'*', '/':'/'}[op] || '*';
    var b7  = bareme.toFixed(7);

    var vars, qnote, textDescDefault, inputLine, inputXML, prtXML, generalFeedback, canonicalNodes;
    var pmap = {};

    // ── Forme algébrique ──
    if (scenario === 'forme-alg') {

        if (mode === 'aleatoire') {
            vars = RI
                + 'q'+X+'_z1:rinz('+randMin+','+randMax+')+rinz('+randMin+','+randMax+')*%i;\n'
                + 'q'+X+'_z2:rinz('+randMin+','+randMax+')+rinz('+randMin+','+randMax+')*%i;\n'
                + 'q'+X+'_ta:rectform(q'+X+'_z1'+mop+'q'+X+'_z2);\n'
                + 'q'+X+'_ta_conj:realpart(q'+X+'_ta)-imagpart(q'+X+'_ta)*%i;\n'
                + 'q'+X+'_ta_re:realpart(q'+X+'_ta);\n'
                + 'q'+X+'_ta_im:imagpart(q'+X+'_ta);';
            qnote = 'z1={@q'+X+'_z1@}, z2={@q'+X+'_z2@}, ' + I18N_D.t('tpl.cpx_qnote_resultat') + '={@q'+X+'_ta@}';
        } else {
            vars = 'q'+X+'_z1:('+fa+')+('+fb+')*%i;\n'
                 + 'q'+X+'_z2:('+fc+')+('+fd+')*%i;\n'
                 + 'q'+X+'_ta:rectform(q'+X+'_z1'+mop+'q'+X+'_z2);\n'
                 + 'q'+X+'_ta_conj:realpart(q'+X+'_ta)-imagpart(q'+X+'_ta)*%i;\n'
                 + 'q'+X+'_ta_re:realpart(q'+X+'_ta);\n'
                 + 'q'+X+'_ta_im:imagpart(q'+X+'_ta);';
            qnote = I18N_D.t('tpl.cpx_qnote_resultat_cap') + ': {@q'+X+'_ta@}';
        }

        var z1v = '{@q'+X+'_z1@}', z2v = '{@q'+X+'_z2@}';
        var lp = '\\left(', rp = '\\right)';
        var opDisp = op === '/' ? '\\dfrac{'+z1v+'}{'+z2v+'}'
                   : op === '*' ? lp+z1v+rp+'\\times'+lp+z2v+rp
                   : op === '-' ? lp+z1v+rp+'-'+lp+z2v+rp
                   :              lp+z1v+rp+'+'+lp+z2v+rp;

        inputLine       = '<p>\\( z = \\) [[input:ans1'+X+']] [[validation:ans1'+X+']]</p>'
                        + '<p><em>'+I18N_D.t('tpl.cpx_hint_forme',{c:complexno})+'</em></p>';
        textDescDefault = '<p>'+I18N_D.t('tpl.cpx_text_formealg',{c:complexno})+'</p>'
                        + '<div style="text-align:center;margin:15px 0;">\\[ '+opDisp+' \\]</div>';
        inputXML        = mkInput_D({name:'ans1'+X, tans:'q'+X+'_ta', boxsize:20,
                            hint:'a+b*%'+complexno, checkanswertype:1, mustverify:1, showvalidation:2});
        pmap            = {'Z1':z1v, 'Z2':z2v, 'RESULT':'{@q'+X+'_ta@}', 'Z':'{@q'+X+'_ta@}'};

        var _fbOp = op === '/' ? '\\dfrac{{@q'+X+'_z1@}}{{@q'+X+'_z2@}}'
                  : op === '*' ? '\\left({@q'+X+'_z1@}\\right)\\times\\left({@q'+X+'_z2@}\\right)'
                  : op === '-' ? '\\left({@q'+X+'_z1@}\\right)-\\left({@q'+X+'_z2@}\\right)'
                  :              '\\left({@q'+X+'_z1@}\\right)+\\left({@q'+X+'_z2@}\\right)';
        var _fbHint = op === '/' ? I18N_D.t('tpl.cpx_hint_op_div')
                    : op === '*' ? I18N_D.t('tpl.cpx_hint_op_mul')
                    : op === '-' ? I18N_D.t('tpl.cpx_hint_op_sub')
                    :              I18N_D.t('tpl.cpx_hint_op_add');
        generalFeedback = '<strong>' + I18N_D.t('tpl.cpx_correction_titre') + '</strong><br><br>'
            + _fbHint + '<br><br>'
            + '\\[' + _fbOp + ' = {@q'+X+'_ta@}\\]'
            + I18N_D.t('tpl.cpx_partie_reelle') + ' : \\({@q'+X+'_ta_re@}\\) &nbsp;—&nbsp; ' + I18N_D.t('tpl.cpx_partie_imaginaire') + ' : \\({@q'+X+'_ta_im@}\\)'
            + '</div></div>';

        // PRT 3 nœuds
        canonicalNodes = [
            _cpxNode(0, I18N_D.t('tpl.cpx_node_formealg_ok'), 'AlgEquiv', 'ans1'+X, 'q'+X+'_ta',
                -1, 1, 'PRT-'+X+'-OK', _cpxFb_D('forme-alg','ok',X,pmap),
                1, 0, 'PRT-'+X+'-NOK', ''),
            _cpxNode(1, I18N_D.t('tpl.cpx_node_formealg_conj'), 'AlgEquiv', 'ans1'+X, 'q'+X+'_ta_conj',
                -1, 0.5, 'PRT-'+X+'-CONJ', _cpxFb_D('forme-alg','conj',X,pmap),
                2, 0, 'PRT-'+X+'-NOK2', ''),
            _cpxNode(2, I18N_D.t('tpl.cpx_node_formealg_err'), 'AlgEquiv', 'ans1'+X, 'q'+X+'_ta',
                -1, 1, 'PRT-'+X+'-OK2', _cpxFb_D('forme-alg','ok2',X,pmap),
                -1, 0, 'PRT-'+X+'-ERR', _cpxFb_D('forme-alg','err',X,pmap))
        ];

    // ── Module et Argument ──
    } else if (scenario === 'module-arg') {

        if (mode === 'aleatoire') {
            vars = RI
                + 'q'+X+'_z:rinz('+randMin+','+randMax+')+rinz('+randMin+','+randMax+')*%i;\n'
                + 'q'+X+'_ta_mod:cabs(q'+X+'_z);\n'
                + 'q'+X+'_ta_arg:carg(q'+X+'_z);\n'
                + 'q'+X+'_ta_arg_neg:-q'+X+'_ta_arg;';
            qnote = 'z={@q'+X+'_z@}, |z|={@q'+X+'_ta_mod@}, arg={@q'+X+'_ta_arg@}';
        } else {
            vars = 'q'+X+'_z:('+fa+')+('+fb+')*%i;\n'
                 + 'q'+X+'_ta_mod:cabs(q'+X+'_z);\n'
                 + 'q'+X+'_ta_arg:carg(q'+X+'_z);\n'
                 + 'q'+X+'_ta_arg_neg:-q'+X+'_ta_arg;';
            qnote = '|z|={@q'+X+'_ta_mod@}, arg(z)={@q'+X+'_ta_arg@}';
        }

        inputLine       = '<p>\\(|z|=\\) [[input:ans_mod'+X+']] [[validation:ans_mod'+X+']]</p>\n'
                        + '<p>\\(\\arg(z)=\\) [[input:ans_arg'+X+']] [[validation:ans_arg'+X+']]</p>\n'
                        + '<p><em>'+I18N_D.t('tpl.cpx_hint_mod_arg')+'</em></p>';
        textDescDefault = '<p>'+I18N_D.t('tpl.cpx_text_modarg',{zval:'{@q'+X+'_z@}'})+'</p>';
        inputXML        = mkInput_D({name:'ans_mod'+X, tans:'q'+X+'_ta_mod', boxsize:15,
                            hint:'sqrt(...)', checkanswertype:1, mustverify:1, showvalidation:2})
                        + '\n' + mkInput_D({name:'ans_arg'+X, tans:'q'+X+'_ta_arg', boxsize:15,
                            hint:'%pi/4', checkanswertype:1, mustverify:1, showvalidation:2});
        pmap            = {'Z':'{@q'+X+'_z@}', 'MOD':'{@q'+X+'_ta_mod@}', 'ARG':'{@q'+X+'_ta_arg@}'};
        generalFeedback = '<strong>' + I18N_D.t('tpl.cpx_correction_titre') + '</strong><br><br>'
            + I18N_D.t('tpl.cpx_formule_modarg') + '<br><br>'
            + I18N_D.t('tpl.cpx_module') + ' : \\({@q'+X+'_ta_mod@}\\) &nbsp;—&nbsp; ' + I18N_D.t('tpl.cpx_argument') + ' : \\({@q'+X+'_ta_arg@}\\)'
            + '</div></div>';

        // PRT 4 nœuds
        canonicalNodes = [
            _cpxNode(0, I18N_D.t('tpl.cpx_node_modarg_mod'), 'AlgEquiv', 'ans_mod'+X, 'q'+X+'_ta_mod',
                1, 1, 'PRT-'+X+'-MOD-OK', '',
                2, 0, 'PRT-'+X+'-MOD-NOK', ''),
            _cpxNode(1, I18N_D.t('tpl.cpx_node_modarg_modok_argok'), 'AlgEquiv', 'ans_arg'+X, 'q'+X+'_ta_arg',
                -1, 1, 'PRT-'+X+'-ARG-OK', _cpxFb_D('module-arg','perfect',X,pmap),
                3, 0.5, 'PRT-'+X+'-ARG-NOK', ''),
            _cpxNode(2, I18N_D.t('tpl.cpx_node_modarg_modnok_argok'), 'AlgEquiv', 'ans_arg'+X, 'q'+X+'_ta_arg',
                -1, 0.5, 'PRT-'+X+'-MOD-NOK-ARG-OK', _cpxFb_D('module-arg','argok-modnok',X,pmap),
                -1, 0, 'PRT-'+X+'-TOUT-NOK', _cpxFb_D('module-arg','toutnok',X,pmap)),
            _cpxNode(3, I18N_D.t('tpl.cpx_node_modarg_quadrant'), 'AlgEquiv', 'ans_arg'+X, 'q'+X+'_ta_arg_neg',
                -1, 0.25, 'PRT-'+X+'-QUADRANT', _cpxFb_D('module-arg','quadrant',X,pmap),
                -1, 0, 'PRT-'+X+'-ARG-ERR', _cpxFb_D('module-arg','argerr',X,pmap))
        ];

    // ── Équation du 2nd degré ──
    } else if (scenario === 'equation-2deg') {

        if (mode === 'aleatoire') {
            var qMax = Math.max(1, Math.abs(randMax));
            vars = RI
                + 'q'+X+'_p:ri('+randMin+','+randMax+');\n'
                + 'q'+X+'_q:ri(1,'+qMax+');\n'
                + 'q'+X+'_eqb:-2*q'+X+'_p;\n'
                + 'q'+X+'_eqc:q'+X+'_p^2+q'+X+'_q^2;\n'
                + 'q'+X+'_delta:q'+X+'_eqb^2-4*q'+X+'_eqc;\n'
                + 'q'+X+'_ta1:q'+X+'_p+q'+X+'_q*%i;\n'
                + 'q'+X+'_ta2:q'+X+'_p-q'+X+'_q*%i;\n'
                + 'q'+X+'_eq:z^2+q'+X+'_eqb*z+q'+X+'_eqc;';
            qnote = 'b={@q'+X+'_eqb@}, c={@q'+X+'_eqc@}, z1={@q'+X+'_ta1@}';
        } else {
            vars = 'q'+X+'_eqb:('+feqb+');\n'
                 + 'q'+X+'_eqc:('+feqc+');\n'
                 + 'q'+X+'_delta:q'+X+'_eqb^2-4*q'+X+'_eqc;\n'
                 + 'q'+X+'_ta1:(-q'+X+'_eqb+sqrt(q'+X+'_delta))/2;\n'
                 + 'q'+X+'_ta2:(-q'+X+'_eqb-sqrt(q'+X+'_delta))/2;\n'
                 + 'q'+X+'_eq:z^2+q'+X+'_eqb*z+q'+X+'_eqc;';
            qnote = 'z1={@q'+X+'_ta1@}, z2={@q'+X+'_ta2@}';
        }

        inputLine       = '<p>\\(z_1=\\) [[input:ans_z1'+X+']] [[validation:ans_z1'+X+']]</p>\n'
                        + '<p>\\(z_2=\\) [[input:ans_z2'+X+']] [[validation:ans_z2'+X+']]</p>\n'
                        + '<p><em>'+I18N_D.t('tpl.cpx_hint_eq',{c:complexno})+'</em></p>';
        textDescDefault = '<p>'+I18N_D.t('tpl.cpx_text_eq')+'</p>'
                        + '<div style="text-align:center;margin:15px 0;">\\[ {@q'+X+'_eq@}=0 \\]</div>';
        inputXML        = mkInput_D({name:'ans_z1'+X, tans:'q'+X+'_ta1', boxsize:15,
                            hint:'a+b*%'+complexno, checkanswertype:1, mustverify:1, showvalidation:2})
                        + '\n' + mkInput_D({name:'ans_z2'+X, tans:'q'+X+'_ta2', boxsize:15,
                            hint:'a-b*%'+complexno, checkanswertype:1, mustverify:1, showvalidation:2});
        pmap            = {
            'EQB':'{@q'+X+'_eqb@}', 'EQC':'{@q'+X+'_eqc@}',
            'Z1':'{@q'+X+'_ta1@}',  'Z2':'{@q'+X+'_ta2@}',
            'DELTA':'{@q'+X+'_delta@}'
        };
        generalFeedback = '<strong>' + I18N_D.t('tpl.cpx_correction_titre') + '</strong><br><br>'
            + I18N_D.t('tpl.cpx_discriminant') + ' : \\({@q'+X+'_delta@}\\)<br><br>'
            + '\\(z_1 = {@q'+X+'_ta1@}\\) &nbsp;—&nbsp; \\(z_2 = {@q'+X+'_ta2@}\\)'
            + '</div></div>';

        // PRT 4 nœuds
        canonicalNodes = [
            _cpxNode(0, I18N_D.t('tpl.cpx_node_eq_z1'), 'AlgEquiv', 'ans_z1'+X, 'q'+X+'_ta1',
                1, 1, 'PRT-'+X+'-Z1-OK', '',
                2, 0, 'PRT-'+X+'-Z1-NOK', ''),
            _cpxNode(1, I18N_D.t('tpl.cpx_node_eq_z1ok_z2'), 'AlgEquiv', 'ans_z2'+X, 'q'+X+'_ta2',
                -1, 1, 'PRT-'+X+'-Z2-OK', _cpxFb_D('equation-2deg','perfect',X,pmap),
                -1, 0.5, 'PRT-'+X+'-Z2-NOK', _cpxFb_D('equation-2deg','z2wrong',X,pmap)),
            _cpxNode(2, I18N_D.t('tpl.cpx_node_eq_swap'), 'AlgEquiv', 'ans_z1'+X, 'q'+X+'_ta2',
                3, 1, 'PRT-'+X+'-SWAP', '',
                -1, 0, 'PRT-'+X+'-TOUT-NOK', _cpxFb_D('equation-2deg','toutnok',X,pmap)),
            _cpxNode(3, I18N_D.t('tpl.cpx_node_eq_swap_confirm'), 'AlgEquiv', 'ans_z2'+X, 'q'+X+'_ta1',
                -1, 0.5, 'PRT-'+X+'-SWAP-TOTAL', _cpxFb_D('equation-2deg','swaptotal',X,pmap),
                -1, 0.25, 'PRT-'+X+'-SWAP-PARTIAL', _cpxFb_D('equation-2deg','swappartial',X,pmap))
        ];

    // ── Géométrie : milieu et distance (affixes) ──
    } else if (scenario === 'affixes') {

        if (mode === 'aleatoire') {
            vars = RI
                + 'q'+X+'_za:rinz('+randMin+','+randMax+')+rinz('+randMin+','+randMax+')*%i;\n'
                + 'q'+X+'_zb:rinz('+randMin+','+randMax+')+rinz('+randMin+','+randMax+')*%i;\n'
                + 'q'+X+'_zi:rectform((q'+X+'_za+q'+X+'_zb)/2);\n'
                + 'q'+X+'_ab:cabs(q'+X+'_zb-q'+X+'_za);';
            qnote = 'zA={@q'+X+'_za@}, zB={@q'+X+'_zb@}, zI={@q'+X+'_zi@}, AB={@q'+X+'_ab@}';
        } else {
            vars = 'q'+X+'_za:('+fa+')+('+fb+')*%i;\n'
                 + 'q'+X+'_zb:('+fc+')+('+fd+')*%i;\n'
                 + 'q'+X+'_zi:rectform((q'+X+'_za+q'+X+'_zb)/2);\n'
                 + 'q'+X+'_ab:cabs(q'+X+'_zb-q'+X+'_za);';
            qnote = 'zI={@q'+X+'_zi@}, AB={@q'+X+'_ab@}';
        }

        inputLine       = '<p>\\(z_I=\\) [[input:ans_zi'+X+']] [[validation:ans_zi'+X+']]</p>\n'
                        + '<p>\\(AB=\\) [[input:ans_ab'+X+']] [[validation:ans_ab'+X+']]</p>\n'
                        + '<p><em>'+I18N_D.t('tpl.cpx_hint_affixes',{c:complexno})+'</em></p>';
        textDescDefault = '<p>'+I18N_D.t('tpl.cpx_text_affixes1',{za:'{@q'+X+'_za@}', zb:'{@q'+X+'_zb@}'})+'</p>'
                        + '<p>'+I18N_D.t('tpl.cpx_text_affixes2')+'</p>';
        inputXML        = mkInput_D({name:'ans_zi'+X, tans:'q'+X+'_zi', boxsize:15,
                            hint:'a+b*%'+complexno, checkanswertype:1, mustverify:1, showvalidation:2})
                        + '\n' + mkInput_D({name:'ans_ab'+X, tans:'q'+X+'_ab', boxsize:15,
                            hint:'sqrt(...)', checkanswertype:1, mustverify:1, showvalidation:2});
        pmap            = {'ZA':'{@q'+X+'_za@}', 'ZB':'{@q'+X+'_zb@}', 'ZI':'{@q'+X+'_zi@}', 'AB':'{@q'+X+'_ab@}'};
        generalFeedback = '<strong>' + I18N_D.t('tpl.cpx_correction_titre') + '</strong><br><br>'
            + I18N_D.t('tpl.cpx_milieu') + ' : \\(z_I=\\dfrac{z_A+z_B}{2}\\) &nbsp;—&nbsp; ' + I18N_D.t('tpl.cpx_distance') + ' : \\(AB=|z_B-z_A|\\)<br><br>'
            + '\\(z_I={@q'+X+'_zi@}\\) &nbsp;—&nbsp; \\(AB={@q'+X+'_ab@}\\)'
            + '</div></div>';

        // PRT 3 nœuds
        canonicalNodes = [
            _cpxNode(0, I18N_D.t('tpl.cpx_node_affixes_zi'), 'AlgEquiv', 'ans_zi'+X, 'q'+X+'_zi',
                1, 1, 'PRT-'+X+'-ZI-OK', '',
                2, 0, 'PRT-'+X+'-ZI-NOK', ''),
            _cpxNode(1, I18N_D.t('tpl.cpx_node_affixes_ziok_ab'), 'AlgEquiv', 'ans_ab'+X, 'q'+X+'_ab',
                -1, 1, 'PRT-'+X+'-AB-OK', _cpxFb_D('affixes','perfect',X,pmap),
                -1, 0.5, 'PRT-'+X+'-AB-NOK', _cpxFb_D('affixes','ziok-abwrong',X,pmap)),
            _cpxNode(2, I18N_D.t('tpl.cpx_node_affixes_zinok_ab'), 'AlgEquiv', 'ans_ab'+X, 'q'+X+'_ab',
                -1, 0.5, 'PRT-'+X+'-ZI-NOK-AB-OK', _cpxFb_D('affixes','ziwrong-abok',X,pmap),
                -1, 0, 'PRT-'+X+'-TOUT-NOK', _cpxFb_D('affixes','toutnok',X,pmap))
        ];

    // ── Conjugué de z ──
    } else {

        if (mode === 'aleatoire') {
            vars = RI
                + 'q'+X+'_z:rinz('+randMin+','+randMax+')+rinz('+randMin+','+randMax+')*%i;\n'
                + 'q'+X+'_zbar:realpart(q'+X+'_z)-imagpart(q'+X+'_z)*%i;';
            qnote = 'z={@q'+X+'_z@}, zbar={@q'+X+'_zbar@}';
        } else {
            vars = 'q'+X+'_z:('+fa+')+('+fb+')*%i;\n'
                 + 'q'+X+'_zbar:realpart(q'+X+'_z)-imagpart(q'+X+'_z)*%i;';
            qnote = 'zbar={@q'+X+'_zbar@}';
        }

        inputLine       = '<p>\\(\\bar{z}=\\) [[input:ans_zbar'+X+']] [[validation:ans_zbar'+X+']]</p>'
                        + '<p><em>'+I18N_D.t('tpl.cpx_hint_forme_conj',{c:complexno})+'</em></p>';
        textDescDefault = '<p>'+I18N_D.t('tpl.cpx_text_conjugue',{zval:'{@q'+X+'_z@}'})+'</p>';
        inputXML        = mkInput_D({name:'ans_zbar'+X, tans:'q'+X+'_zbar', boxsize:20,
                            hint:'a+b*%'+complexno, checkanswertype:1, mustverify:1, showvalidation:2});
        pmap            = {'Z':'{@q'+X+'_z@}', 'ZBAR':'{@q'+X+'_zbar@}'};
        generalFeedback = '<strong>' + I18N_D.t('tpl.cpx_correction_titre') + '</strong><br><br>'
            + I18N_D.t('tpl.cpx_text_conj_formule',{c:complexno}) + '<br><br>'
            + '\\(z={@q'+X+'_z@}\\) &nbsp;→&nbsp; \\(\\bar z={@q'+X+'_zbar@}\\)'
            + '</div></div>';

        // PRT 2 nœuds
        canonicalNodes = [
            _cpxNode(0, I18N_D.t('tpl.cpx_node_conj_exact'), 'AlgEquiv', 'ans_zbar'+X, 'q'+X+'_zbar',
                -1, 1, 'PRT-'+X+'-OK', _cpxFb_D('conjugue','perfect',X,pmap),
                1, 0, 'PRT-'+X+'-NOK', ''),
            _cpxNode(1, I18N_D.t('tpl.cpx_node_conj_forgot'), 'AlgEquiv', 'ans_zbar'+X, 'q'+X+'_z',
                -1, 0.5, 'PRT-'+X+'-FORGOT', _cpxFb_D('conjugue','forgot',X,pmap),
                -1, 0, 'PRT-'+X+'-ERR', _cpxFb_D('conjugue','wrong',X,pmap))
        ];
    }

    var prtMeta = { name: 'prt'+X, value: b7, autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    // ── Encadres colores : appliques uniquement sur la copie servant a l'export XML ──
    // canonicalNodes (expose via prt.nodes pour prt-manager.js) reste brut, sans encadre,
    // pour que l'edition manuelle du PRT ne montre jamais de HTML de presentation.
    // Voir js/fb-box.js (applyFbBox) et js/gen-basen.js (meme pattern, pilote valide).
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(inferFbKind_D(n, 'true'), n.truefeedback),
            falsefeedback: applyFbBox_D(inferFbKind_D(n, 'false'), n.falsefeedback)
        });
    });
    prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    var textDesc = custText ? _cpxReplace(custText, X, pmap) : textDescDefault;
    var textFrag = HDR + textDesc + '\n' + inputLine;

    // La correction détaillée (cpx-fbgen) est éditable par l'enseignant et préremplie
    // par cpxGenFbgen_D() ; sans quoi genComplexe() renvoyait un résumé bien plus succinct.
    var fbgenDetailed = (typeof _cpxGenFbgen === 'function') ? cpxGenFbgen_D(scenario, op, complexno) : generalFeedback;
    generalFeedback = applyFbBox_D('general', _cpxReplace(custFbgen || fbgenDetailed, X, pmap));

    return {type:'complexe', bareme, complexno, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:'[[feedback:prt'+X+']]'};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genComplexe: genComplexe, genComplexeCore: genComplexeCore };
}
