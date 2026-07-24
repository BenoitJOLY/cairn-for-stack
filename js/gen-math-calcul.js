// Lecture pure du formulaire (aucun effet de bord réseau) — factorisée pour
// être appelée à la fois par genCalcul() (export réel) et par l'aperçu local
// synchrone (js/preview.js:renderPreviewHTML_calcul), qui ne doit pas dépendre
// du réseau ni devenir async (voir PLAN.md, étape 3 du chantier Backend NAS).
function _calcBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('calc-bareme')) || 1;
    var scenario = gs('calc-scenario') || 'derivee-produit';
    var exprF = (gs('calc-expr') || 'x^2 + sin(x)').trim();
    var boundA = (gs('calc-a') || '0').trim();
    var boundB = (gs('calc-b') || '1').trim();
    var fbOk    = gs('calc-fb-ok').trim();
    var fbWrong = gs('calc-fb-wrong').trim();
    var custText = gs('calc-text').trim();
    var fbGen = gs('calc-fbgen');
    var varValues = {};
    ['a','b','c','d','f','k','m','offset'].forEach(function(key){ varValues[key] = _calcVarValue(key); });

    return {
        bareme: bareme, scenario: scenario, exprF: exprF, boundA: boundA, boundB: boundB,
        fbOk: fbOk, fbWrong: fbWrong, custText: custText, fbGen: fbGen, varValues: varValues
    };
}

async function genCalcul(X) {
    var p = _calcBuildParams();
    // Étape 3 (PLAN.md) : tente la génération côté serveur, avec repli
    // automatique sur le calcul local si le serveur échoue ou est absent —
    // aucun risque de casser la génération pendant la migration.
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'calcul', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
    } catch(e) { /* réseau indisponible : repli local ci-dessous */ }
    return genCalculCore(X, p);
}

function genCalculCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var mkInput_D = deps._mkInput || _mkInput;
    var _calcVarValue_D = function(key) { return p.varValues[key]; };

    var bareme = p.bareme, scenario = p.scenario, exprF = p.exprF, boundA = p.boundA, boundB = p.boundB;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes, fbVars = '', diagNodes = [];

    function calcNode(name, desc, test, sans, tans, opts, trueMode, trueScore, trueNext, trueNote, trueFb, falseMode, falseScore, falseNext, falseNote, falseFb) {
        return {
            name: String(name), description: desc, answertest: test, sans: sans, tans: tans,
            testoptions: opts || '', quiet: '0',
            truescoremode: trueMode, truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
            trueanswernote: trueNote, truefeedback: trueFb || '',
            falsescoremode: falseMode, falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
            falseanswernote: falseNote, falsefeedback: falseFb || ''
        };
    }

    var HDR = `<div style="background:#475569;border-left:5px solid #334155;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('calc.banniere')}</strong> <span style="background:#334155;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'derivee') {
        vars = `/* Q${X} Calcul — D\xe9riv\xe9e (expression libre) */
q${X}_f:(${exprF});
q${X}_fp:diff(q${X}_f,x);`;
        qnote = `f={@q${X}_f@}, f'={@q${X}_fp@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.derivee_enonce', {f: '{@q'+X+'_f@}'})}</p>`}
<p>\\(f'(x)=\\) [[input:ans_fp${X}]] [[validation:ans_fp${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_fp${X}`,tans:`q${X}_fp`,boxsize:30,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [calcNode(0, 'D\xe9riv\xe9e correcte ?', 'AlgEquiv', `ans_fp${X}`, `q${X}_fp`, '',
            '=', 1, -1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>' + I18N_D.t('mat.fb_ok_correct') + '</strong></div>',
            '=', 0, -1, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(f'(x)={@q${X}_fp@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('calc.correction_lbl')}</strong><br>\\(f(x)={@q${X}_f@}\\)<br>\\(f'(x)={@q${X}_fp@}\\).</div>`;

    } else if (scenario === 'primitive') {
        vars = `/* Q${X} Calcul — Primitive (expression libre) */
q${X}_f:(${exprF});
q${X}_F:integrate(q${X}_f,x);`;
        qnote = `f={@q${X}_f@}, F={@q${X}_F@}+k`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.primitive_enonce', {f: '{@q'+X+'_f@}'})}</p>`}
<p>\\(F(x)=\\) [[input:ans_F${X}]] [[validation:ans_F${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_F${X}`,tans:`q${X}_F`,boxsize:30,allowwords:'k',mustverify:1,showvalidation:2});
        fbVars = `q${X}_diff:diff(ans_F${X},x);`;
        canonicalNodes = [calcNode(0, "F'=f ?", 'AlgEquiv', `q${X}_diff`, `q${X}_f`, '',
            '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_correct')}</strong> \\(F'(x)=f(x)\\).</div>`,
            '=', 0, -1, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(F'(x)={@q${X}_diff@}\\neq f(x)\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('calc.correction_lbl')}</strong><br>\\(f(x)={@q${X}_f@}\\)<br>\\(F(x)={@q${X}_F@}+k\\).</div>`;

    } else if (scenario === 'integrale') {
        vars = `/* Q${X} Calcul — Int\xe9grale d\xe9finie (expression libre) */
q${X}_f:(${exprF});
q${X}_a:(${boundA});
q${X}_b:(${boundB});
q${X}_ta:integrate(q${X}_f,x,q${X}_a,q${X}_b);`;
        qnote = `∫ [{@q${X}_a@};{@q${X}_b@}] {@q${X}_f@} dx = {@q${X}_ta@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.calculer_lbl')} \\( \\displaystyle\\int_{{@q${X}_a@}}^{{@q${X}_b@}} {@q${X}_f@}\\,dx \\)</p>`}
<p>${I18N_D.t('calc.reponse_lbl')} [[input:ans_I${X}]] [[validation:ans_I${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_I${X}`,tans:`q${X}_ta`,boxsize:20,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [calcNode(0, 'Correct ?', 'AlgEquiv', `ans_I${X}`, `q${X}_ta`, '',
            '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_correct')}</strong></div>`,
            '=', 0, -1, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('calc.integrale_fb_wrong', {ta: '{@q'+X+'_ta@}'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('calc.correction_lbl')}</strong><br>\\(\\displaystyle\\int_{{@q${X}_a@}}^{{@q${X}_b@}}{@q${X}_f@}\\,dx={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'derivee-produit') {
        vars = `/* Q${X} Calcul — D\xe9riv\xe9e d'un produit */
q${X}_a:${_calcVarValue_D('a')}$ q${X}_b:${_calcVarValue_D('b')}$
q${X}_u:q${X}_a*x+q${X}_b$ q${X}_du:q${X}_a$ q${X}_v:%e^x$ q${X}_dv:%e^x$
q${X}_f:q${X}_u*q${X}_v$ q${X}_fp:diff(q${X}_f,x)$ q${X}_fp_simpl:ev(q${X}_fp,simp)$
q${X}_err_oublie_poly:q${X}_u*q${X}_dv$
q${X}_err_oublie_exp:q${X}_du*q${X}_v$
q${X}_err_produit:q${X}_du*q${X}_dv$
q${X}_err_plus:(q${X}_u+q${X}_v)*(q${X}_du+q${X}_dv)$`;
        qnote = `f(x)=({@q${X}_u@})e^x, f'={@q${X}_fp_simpl@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.produit_enonce1')}</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">\\( f(x) = ({@q${X}_u@}) \\cdot e^x \\)</div>
<p>${I18N_D.t('calc.produit_enonce2')}</p>`}
<div>\\(f'(x) = \\) [[input:ans_fp${X}]] [[validation:ans_fp${X}]]</div>`;
        inputXML = mkInput_D({name:`ans_fp${X}`,tans:`q${X}_fp`,boxsize:30,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification de la d\xe9riv\xe9e', 'AlgEquiv', `ans_fp${X}`, `q${X}_fp`, '',
                '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('calc.produit_fb_ok_desc')}</div>`,
                '=', 0, 1, 'PRT-'+X+'-NOK', ''),
            calcNode(1, 'Erreur : Oubli d\xe9riv\xe9e polyn\xf4me', 'AlgEquiv', `ans_fp${X}`, `q${X}_err_oublie_poly`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-POLY', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>${I18N_D.t('calc.produit_err_poly_title')}</strong> ${I18N_D.t('calc.produit_err_poly_desc', {u: '{@q'+X+'_u@}'})}</div>`,
                '=', 0, 2, 'PRT-'+X+'-ERR-AUTRE', ''),
            calcNode(2, 'Erreur : Oubli d\xe9riv\xe9e exponentielle', 'AlgEquiv', `ans_fp${X}`, `q${X}_err_oublie_exp`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-EXP', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>${I18N_D.t('calc.produit_err_poly_title')}</strong> ${I18N_D.t('calc.produit_err_exp_desc', {du: '{@q'+X+'_du@}'})}</div>`,
                '=', 0, 3, 'PRT-'+X+'-ERR-AUTRE2', ''),
            calcNode(3, 'Erreur : Multiplication des d\xe9riv\xe9es', 'AlgEquiv', `ans_fp${X}`, `q${X}_err_produit`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-PROD', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.produit_err_mult_title')}</strong> ${I18N_D.t('calc.produit_err_mult_desc')}</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('calc.produit_fb_wrong_desc')}</div>`)
        ];
        diagNodes = [1,2,3].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].truefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">${I18N_D.t('calc.correction_detaillee_lbl')}</div>
<div style="font-size:.9rem;">${I18N_D.t('calc.produit_correction_desc', {u: '{@q'+X+'_u@}', du: '{@q'+X+'_du@}', fp_simpl: '{@q'+X+'_fp_simpl@}'})}</div>
</div>`;

    } else if (scenario === 'primitive-exp') {
        vars = `/* Q${X} Calcul — Primitive exponentielle */
q${X}_a:${_calcVarValue_D('a')}$ q${X}_b:${_calcVarValue_D('b')}$ q${X}_c:${_calcVarValue_D('c')}$
q${X}_f:q${X}_b*%e^(q${X}_a*x)+q${X}_c$
q${X}_ta_sans_k:(q${X}_b/q${X}_a)*%e^(q${X}_a*x)+q${X}_c*x$
q${X}_err_coef:q${X}_b*%e^(q${X}_a*x)+q${X}_c*x$`;
        qnote = `f={@q${X}_f@}, F={@q${X}_ta_sans_k@}+k`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.produit_enonce1')}</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">\\( f(x) = {@q${X}_f@} \\)</div>
<p>${I18N_D.t('calc.primexp_enonce2')}</p>`}
<div>\\(F(x) = \\) [[input:ans_F${X}]] [[validation:ans_F${X}]]</div>`;
        inputXML = mkInput_D({name:`ans_F${X}`,tans:`q${X}_ta_sans_k+k`,boxsize:30,checkanswertype:1,allowwords:'k',hint:I18N_D.t('calc.hint_exp'),mustverify:1,showvalidation:2});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification par d\xe9rivation', 'AlgEquiv', `diff(ans_F${X},x)`, `q${X}_f`, '',
                '=', 1, -1, 'PRT-'+X+'-DIFF-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('calc.primexp_fb_ok_desc')}</div>`,
                '=', 0, 1, 'PRT-'+X+'-DIFF-NOK', ''),
            calcNode(1, 'D\xe9tection oubli de la constante', 'AlgEquiv', `ans_F${X}`, `q${X}_ta_sans_k`, '',
                '=', 0.5, -1, 'PRT-'+X+'-ERR-K', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>${I18N_D.t('calc.presque_title')}</strong> ${I18N_D.t('calc.primexp_err_k_desc')}</div>`,
                '=', 0, 2, 'PRT-'+X+'-ERR-AUTRE', ''),
            calcNode(2, 'D\xe9tection erreur de coefficient exp', 'AlgEquiv', `ans_F${X}`, `q${X}_err_coef`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-COEF', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.err_coef_title')}</strong> ${I18N_D.t('calc.primexp_err_coef_desc', {b: '{@q'+X+'_b@}', a: '{@q'+X+'_a@}'})}</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('calc.primexp_fb_wrong_desc')}</div>`)
        ];
        diagNodes = [1,2].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].truefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">${I18N_D.t('calc.correction_detaillee_lbl')}</div>
<div style="font-size:.9rem;">${I18N_D.t('calc.primexp_correction_desc', {b: '{@q'+X+'_b@}', a: '{@q'+X+'_a@}', c: '{@q'+X+'_c@}'})}</div>
</div>`;

    } else if (scenario === 'integrale-def') {
        vars = `/* Q${X} Calcul — Int\xe9grale d\xe9finie */
q${X}_d:${_calcVarValue_D('d')}$ q${X}_c:${_calcVarValue_D('c')}$ q${X}_f:${_calcVarValue_D('f')}$ q${X}_a:0$ q${X}_b:1$
q${X}_fx:q${X}_c*%e^(q${X}_d*x)+q${X}_f$ q${X}_Fx:(q${X}_c/q${X}_d)*%e^(q${X}_d*x)+q${X}_f*x$
q${X}_ta_I:ev(q${X}_Fx,x=q${X}_b)-ev(q${X}_Fx,x=q${X}_a)$
q${X}_err_primitive:q${X}_Fx$
q${X}_err_no_x:(q${X}_c/q${X}_d)*(%e^(q${X}_d*q${X}_b)-%e^(q${X}_d*q${X}_a))$
q${X}_err_coef:q${X}_c*(%e^(q${X}_d*q${X}_b)-%e^(q${X}_d*q${X}_a))+q${X}_f$`;
        qnote = `I = int({@q${X}_fx@}, {@q${X}_a@}, {@q${X}_b@}) = {@q${X}_ta_I@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.intdef_enonce1')}</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;text-align:center;font-size:1.3rem;margin-bottom:15px;">\\( I = \\int_{{@q${X}_a@}}^{{@q${X}_b@}} \\left( {@q${X}_fx@} \\right) dx \\)</div>
<p><em>${I18N_D.t('calc.intdef_enonce2')}</em><br><br></p>`}
<div>\\(I = \\) [[input:ans_I${X}]] [[validation:ans_I${X}]]</div>`;
        inputXML = mkInput_D({name:`ans_I${X}`,tans:`q${X}_ta_I`,boxsize:30,hint:I18N_D.t('calc.hint_exp'),showvalidation:0});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification r\xe9sultat final', 'AlgEquiv', `ans_I${X}`, `q${X}_ta_I`, '',
                '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('calc.intdef_fb_ok_desc')}</div>`,
                '=', 0, 1, 'PRT-'+X+'-NOK', ''),
            calcNode(1, 'Erreur : A donn\xe9 la primitive', 'AlgEquiv', `ans_I${X}`, `q${X}_err_primitive`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-PRIM', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>${I18N_D.t('calc.non_termine_title')}</strong> ${I18N_D.t('calc.intdef_err_prim_desc', {b: '{@q'+X+'_b@}', a: '{@q'+X+'_a@}'})}</div>`,
                '=', 0, 2, 'PRT-'+X+'-ERR-AUTRE', ''),
            calcNode(2, 'Erreur : Oubli du terme f x', 'AlgEquiv', `ans_I${X}`, `q${X}_err_no_x`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-CST', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.oubli_terme_title')}</strong> ${I18N_D.t('calc.intdef_err_nox_desc', {f: '{@q'+X+'_f@}'})}</div>`,
                '=', 0, 3, 'PRT-'+X+'-ERR-AUTRE2', ''),
            calcNode(3, 'Erreur : Coefficient exponentielle', 'AlgEquiv', `ans_I${X}`, `q${X}_err_coef`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-COEF', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.err_coef_title')}</strong> ${I18N_D.t('calc.intdef_err_coef_desc', {c: '{@q'+X+'_c@}', d: '{@q'+X+'_d@}'})}</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('apn.fb_wrong_incorrect')}</strong> ${I18N_D.t('calc.intdef_fb_wrong_desc', {b: '{@q'+X+'_b@}', a: '{@q'+X+'_a@}'})}</div>`)
        ];
        diagNodes = [1,2,3].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].truefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">${I18N_D.t('calc.correction_detaillee_lbl')}</div>
<div style="font-size:.9rem;">${I18N_D.t('calc.intdef_correction_desc', {fx: '{@q'+X+'_fx@}', c: '{@q'+X+'_c@}', d: '{@q'+X+'_d@}', f: '{@q'+X+'_f@}', a: '{@q'+X+'_a@}', b: '{@q'+X+'_b@}', ta_I: '{@q'+X+'_ta_I@}'})}</div>
</div>`;

    } else if (scenario === 'encadrement-tvi') {
        vars = `/* Q${X} Calcul — Encadrement TVI / Dichotomie */
q${X}_b:${_calcVarValue_D('b')}$
q${X}_alpha:1+q${X}_b/10$
q${X}_k:float(exp(q${X}_alpha)-q${X}_alpha)$
q${X}_f:exp(x)-x-q${X}_k$
q${X}_f1:float(ev(q${X}_f,x=1))$
q${X}_f2:float(ev(q${X}_f,x=2))$
q${X}_alpha_inf:float(q${X}_alpha-0.01)$
q${X}_alpha_sup:float(q${X}_alpha+0.01)$`;
        qnote = `f(x)=e^x-x-{@q${X}_k@}, alpha={@q${X}_alpha@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.tvi_enonce1')}</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">\\( f(x) = e^x - x - {@q${X}_k@} \\)</div>
<p>${I18N_D.t('calc.tvi_enonce3')}</p>
<div style="display:flex;gap:20px;margin:10px 0 15px 0;">
<div>\\(f(1) \\approx\\) [[input:ans_f1${X}]]</div>
<div>\\(f(2) \\approx\\) [[input:ans_f2${X}]][[validation:ans_f1${X}]][[validation:ans_f2${X}]]</div>
</div>
<p>${I18N_D.t('calc.tvi_enonce4')}</p>
<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
<div> [[input:ans_inf${X}]] [[validation:ans_inf${X}]]</div>
<div>&lt;\\(\\alpha\\) &lt; [[input:ans_sup${X}]] [[validation:ans_sup${X}]]</div>
</div>`}`;
        inputXML = mkInput_D({name:`ans_f1${X}`,tans:`q${X}_f1`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0})
                 + '\n' + mkInput_D({name:`ans_f2${X}`,tans:`q${X}_f2`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0})
                 + '\n' + mkInput_D({name:`ans_inf${X}`,tans:`q${X}_alpha_inf`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0})
                 + '\n' + mkInput_D({name:`ans_sup${X}`,tans:`q${X}_alpha_sup`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0});
        fbVars = `q${X}_tol: 0.001;
q${X}_test_inf: float(ans_inf${X}) <= q${X}_alpha + q${X}_tol and q${X}_alpha - float(ans_inf${X}) <= 0.01 + q${X}_tol;
q${X}_test_sup: float(ans_sup${X}) >= q${X}_alpha - q${X}_tol and float(ans_sup${X}) - q${X}_alpha <= 0.01 + q${X}_tol;
q${X}_test_encad: is(float(ans_sup${X}) - float(ans_inf${X}) <= 0.02 + q${X}_tol);`;
        canonicalNodes = [
            calcNode(0, 'V\xe9rification borne inf\xe9rieure', 'AlgEquiv', `q${X}_test_inf`, 'true', '',
                '+', 0.5, 1, 'PRT-'+X+'-INF-OK', '',
                '=', 0, -1, 'PRT-'+X+'-INF-NOK', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.tvi_borne_inf_title')}</strong> ${I18N_D.t('calc.tvi_borne_inf_desc')}</div>`),
            calcNode(1, 'V\xe9rification borne sup\xe9rieure', 'AlgEquiv', `q${X}_test_sup`, 'true', '',
                '+', 0.5, 2, 'PRT-'+X+'-SUP-OK', '',
                '=', 0, -1, 'PRT-'+X+'-SUP-NOK', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.tvi_borne_sup_title')}</strong> ${I18N_D.t('calc.tvi_borne_sup_desc')}</div>`),
            calcNode(2, 'V\xe9rification amplitude finale', 'AlgEquiv', `q${X}_test_encad`, 'true', '',
                '=', 0, -1, 'PRT-'+X+'-AMP-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('calc.tvi_fb_ok_desc')}</div>`,
                '-', 0.25, -1, 'PRT-'+X+'-AMP-NOK', fbWrong || `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>${I18N_D.t('calc.tvi_precision_title')}</strong> ${I18N_D.t('calc.tvi_precision_desc')}</div>`)
        ];
        diagNodes = [0,1].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].falsefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">${I18N_D.t('calc.correction_detaillee_lbl')}</div>
<div style="font-size:.9rem;">${I18N_D.t('calc.tvi_correction_desc', {k: '{@q'+X+'_k@}', f1: '{@q'+X+'_f1@}', f2: '{@q'+X+'_f2@}', alpha: '{@q'+X+'_alpha@}', alpha_inf: '{@q'+X+'_alpha_inf@}', alpha_sup: '{@q'+X+'_alpha_sup@}'})}</div>
</div>`;

    } else if (scenario === 'convexite-tangente') {
        vars = `/* Q${X} Calcul — Convexit\xe9 et position de la tangente */
q${X}_k:${_calcVarValue_D('k')}$ q${X}_m:${_calcVarValue_D('m')}$
q${X}_f:q${X}_k*%e^x+q${X}_m*x$
q${X}_fp:diff(q${X}_f,x)$ q${X}_fpp:diff(q${X}_fp,x)$
q${X}_ta_fpp:q${X}_fpp$ q${X}_ta_fp:q${X}_fp$`;
        qnote = `f(x)={@q${X}_f@}, f''(x)={@q${X}_fpp@}, k={@q${X}_k@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.convexite_enonce1', {f: '{@q'+X+'_f@}'})}</p>
<div style="margin-top:5px;margin-bottom:15px;">\\(f''(x)\\) = [[input:ans_fpp${X}]] [[validation:ans_fpp${X}]]</div>
<p>${I18N_D.t('calc.convexite_enonce2')}</p>
<div style="margin-top:5px;margin-bottom:15px;">${I18N_D.t('calc.convexite_f_est')} [[input:ans_conv${X}]] [[validation:ans_conv${X}]] ${I18N_D.t('calc.convexite_sur_r')}</div>
<p>${I18N_D.t('calc.convexite_enonce3')}</p>
<div style="margin-top:5px;">${I18N_D.t('calc.convexite_tangente_est')} [[input:ans_pos${X}]] [[validation:ans_pos${X}]] ${I18N_D.t('calc.convexite_la_courbe')}</div>`}`;
        inputXML = mkInput_D({name:`ans_fpp${X}`,tans:`q${X}_ta_fpp`,boxsize:15,showvalidation:0})
                 + '\n' + mkInput_D({name:`ans_conv${X}`,type:'dropdown',tans:`<![CDATA[[["convexe", true, "convexe"], ["concave", false, "concave"], ["autre", false, "ni convexe ni concave"]]]]>`,boxsize:15,showvalidation:0})
                 + '\n' + mkInput_D({name:`ans_pos${X}`,type:'dropdown',tans:`<![CDATA[[["en dessous de", true, "en dessous de"], ["au-dessus de", false, "au-dessus de"], ["confondue avec", false, "confondue avec"]]]]>`,boxsize:15,showvalidation:0});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification d\xe9riv\xe9e seconde', 'AlgEquiv', `ans_fpp${X}`, `q${X}_ta_fpp`, '',
                '=', 0.4, 1, 'PRT-'+X+'-FPP-OK', '',
                '=', 0, 3, 'PRT-'+X+'-FPP-NOK', ''),
            calcNode(1, 'V\xe9rification convexit\xe9', 'String', `ans_conv${X}`, '"convexe"', '',
                '=', 0.3, 2, 'PRT-'+X+'-CONV-OK', '',
                '=', 0, -1, 'PRT-'+X+'-CONV-NOK', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>${I18N_D.t('calc.incoherence_title')}</strong> ${I18N_D.t('calc.convexite_err_conv_desc', {fpp: '{@q'+X+'_fpp@}', k: '{@q'+X+'_k@}'})}</div>`),
            calcNode(2, 'V\xe9rification position tangente', 'String', `ans_pos${X}`, '"en dessous de"', '',
                '=', 0.3, -1, 'PRT-'+X+'-POS-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('calc.convexite_fb_ok_desc')}</div>`,
                '=', 0, -1, 'PRT-'+X+'-POS-NOK', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>${I18N_D.t('calc.attention_propriete_title')}</strong> ${I18N_D.t('calc.convexite_err_pos_desc')}</div>`),
            calcNode(3, 'Diagnostic erreur d\xe9riv\xe9e', 'AlgEquiv', `ans_fpp${X}`, `q${X}_ta_fp`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-PRIME', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">🚨 <strong>${I18N_D.t('calc.confusion_derivee_title')}</strong> ${I18N_D.t('calc.convexite_err_confusion_desc')}</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.convexite_fb_wrong_title')}</strong> ${I18N_D.t('calc.convexite_fb_wrong_desc')}</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[1].description, fb: canonicalNodes[1].falsefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].falsefeedback },
            { desc: canonicalNodes[3].description, fb: canonicalNodes[3].truefeedback }
        ];
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">${I18N_D.t('calc.correction_detaillee_lbl')}</div>
<div style="font-size:.9rem;">${I18N_D.t('calc.convexite_correction_desc', {fp: '{@q'+X+'_fp@}', fpp: '{@q'+X+'_fpp@}', k: '{@q'+X+'_k@}'})}</div>
</div>`;

    } else if (scenario === 'tangente-ext') {
        vars = `/* Q${X} Calcul — Tangente passant par un point ext\xe9rieur */
q${X}_a:${_calcVarValue_D('a')}$
q${X}_b:${_calcVarValue_D('b')}$
while q${X}_a = q${X}_b do q${X}_b:${_calcVarValue_D('b')}$
q${X}_k:${_calcVarValue_D('k')}$
q${X}_f:x^2+q${X}_k$
q${X}_fp:diff(q${X}_f,x)$
q${X}_xM:ratsimp((q${X}_a+q${X}_b)/2)$
q${X}_yM:q${X}_a*q${X}_b+q${X}_k$
q${X}_ta_sol:{q${X}_a, q${X}_b}$
q${X}_tg1:expand(ev(q${X}_fp,x=q${X}_a)*(x-q${X}_a)+ev(q${X}_f,x=q${X}_a))$
q${X}_tg2:expand(ev(q${X}_fp,x=q${X}_b)*(x-q${X}_b)+ev(q${X}_f,x=q${X}_b))$
q${X}_ta_tang:{q${X}_tg1, q${X}_tg2}$
q${X}_err_point:{q${X}_xM}$`;
        qnote = `f(x)={@q${X}_f@}, M({@q${X}_xM@},{@q${X}_yM@}), Sol={@q${X}_a@},{@q${X}_b@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.tanext_enonce1', {f: '{@q'+X+'_f@}', xM: '{@q'+X+'_xM@}', yM: '{@q'+X+'_yM@}'})}</p>
<div style="margin-top:5px;margin-bottom:15px;">${I18N_D.t('calc.tanext_abscisses_lbl')} [[input:ans_ab${X}]] [[validation:ans_ab${X}]]</div>
<p>${I18N_D.t('calc.tanext_enonce2')}</p>
<div style="margin-top:5px;">${I18N_D.t('calc.tanext_tangente_lbl')} [[input:ans_tang${X}]] [[validation:ans_tang${X}]]</div>`}`;
        inputXML = mkInput_D({name:`ans_ab${X}`,tans:`q${X}_ta_sol`,boxsize:15,hint:'{a, b}',mustverify:0,showvalidation:0})
                 + '\n' + mkInput_D({name:`ans_tang${X}`,tans:`q${X}_ta_tang`,boxsize:20,hint:'...',checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification des abscisses des tangentes', 'AlgEquiv', `ans_ab${X}`, `q${X}_ta_sol`, '',
                '=', 0.5, 1, 'PRT-'+X+'-AB-OK', '',
                '=', 0, 2, 'PRT-'+X+'-AB-NOK', ''),
            calcNode(1, "V\xe9rification d'une \xe9quation de tangente", 'AlgEquiv', `ans_tang${X}`, `q${X}_ta_tang`, '',
                '=', 0.5, -1, 'PRT-'+X+'-TG-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('calc.tanext_fb_ok_desc')}</div>`,
                '=', 0, 3, 'PRT-'+X+'-TG-NOK', ''),
            calcNode(2, 'Diagnostic erreur sur les abscisses', 'AlgEquiv', `ans_ab${X}`, `q${X}_err_point`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-XM', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>${I18N_D.t('calc.confusion_point_courbe_title')}</strong> ${I18N_D.t('calc.tanext_err_xm_desc')}</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.abscisses_incorrectes_title')}</strong> ${I18N_D.t('calc.tanext_err_calc_desc')}</div>`),
            calcNode(3, "Diagnostic erreur sur l'\xe9quation", 'AlgEquiv', `ans_tang${X}`, 'false', '',
                '=', 0, -1, 'PRT-'+X+'-ERR-FORM', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>${I18N_D.t('calc.formule_tangente_title')}</strong> ${I18N_D.t('calc.tanext_err_formule_desc')}</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC-TG', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.equation_incorrecte_title')}</strong> ${I18N_D.t('calc.tanext_fb_wrong_desc')}</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].truefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].falsefeedback },
            { desc: canonicalNodes[3].description, fb: canonicalNodes[3].truefeedback }
        ];
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">${I18N_D.t('calc.correction_detaillee_lbl')}</div>
<div style="font-size:.9rem;">${I18N_D.t('calc.tanext_correction_desc', {k: '{@q'+X+'_k@}', xM: '{@q'+X+'_xM@}', yM: '{@q'+X+'_yM@}', a: '{@q'+X+'_a@}', b: '{@q'+X+'_b@}', tg1: '{@q'+X+'_tg1@}', tg2: '{@q'+X+'_tg2@}'})}</div>
</div>`;

    } else { /* aire-courbes */
        vars = `/* Q${X} Calcul — Aire entre deux courbes */
q${X}_a:${_calcVarValue_D('a')}$ q${X}_b:q${X}_a+${_calcVarValue_D('offset')}$ q${X}_k:${_calcVarValue_D('k')}$
q${X}_f:x^2$ q${X}_g:q${X}_f-q${X}_k*(x-q${X}_a)*(x-q${X}_b)$
q${X}_ta_ab:{q${X}_a, q${X}_b}$
q${X}_ta_aire:ratsimp(-integrate(q${X}_k*(x-q${X}_a)*(x-q${X}_b),x,q${X}_a,q${X}_b))$
q${X}_ta_err_sign:ratsimp(integrate(q${X}_k*(x-q${X}_a)*(x-q${X}_b),x,q${X}_a,q${X}_b))$
q${X}_cond_sup:if q${X}_g > q${X}_f then ">" else "<"$`;
        qnote = `f={@q${X}_f@}, g={@q${X}_g@}, Intersections={@q${X}_a@},{@q${X}_b@}, Aire={@q${X}_ta_aire@}`;
        textFrag = `${HDR}${custText}${`<p>${I18N_D.t('calc.aire_enonce1')}
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">${I18N_D.t('calc.aire_f_et_g', {f: '{@q'+X+'_f@}', g: '{@q'+X+'_g@}'})}</div>
${I18N_D.t('calc.aire_enonce2')}
<div style="margin-top:5px;margin-bottom:15px;">${I18N_D.t('calc.tanext_abscisses_lbl')} [[input:ans_ab${X}]] [[validation:ans_ab${X}]]</div>
${I18N_D.t('calc.aire_enonce3')}
<div style="margin-top:5px;">${I18N_D.t('calc.aire_aire_lbl')} [[input:ans_aire${X}]] [[validation:ans_aire${X}]] u.a.</div>`}`;
        inputXML = mkInput_D({name:`ans_ab${X}`,tans:`q${X}_ta_ab`,boxsize:15,hint:'{a, b}',mustverify:0,showvalidation:0})
                 + '\n' + mkInput_D({name:`ans_aire${X}`,tans:`q${X}_ta_aire`,boxsize:15,mustverify:0,showvalidation:0});
        canonicalNodes = [
            calcNode(0, "V\xe9rification des abscisses d'intersection", 'AlgEquiv', `ans_ab${X}`, `q${X}_ta_ab`, '',
                '=', 0.5, 1, 'PRT-'+X+'-AB-OK', '',
                '=', 0, -1, 'PRT-'+X+'-AB-NOK', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.abscisses_incorrectes_title')}</strong> ${I18N_D.t('calc.aire_err_ab_desc')}</div>`),
            calcNode(1, "V\xe9rification de l'aire finale", 'AlgEquiv', `ans_aire${X}`, `q${X}_ta_aire`, '',
                '=', 0.5, -1, 'PRT-'+X+'-AIRE-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong> ${I18N_D.t('calc.aire_fb_ok_desc')}</div>`,
                '=', 0, 2, 'PRT-'+X+'-AIRE-NOK', ''),
            calcNode(2, 'D\xe9tection erreur de signe (Aire n\xe9gative)', 'AlgEquiv', `ans_aire${X}`, `q${X}_ta_err_sign`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-SIGN', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>${I18N_D.t('calc.erreur_signe_title')}</strong> ${I18N_D.t('calc.aire_err_signe_desc')}</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>${I18N_D.t('calc.aire_incorrecte_title')}</strong> ${I18N_D.t('calc.aire_fb_wrong_desc')}</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[0].description, fb: canonicalNodes[0].falsefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].truefeedback }
        ];
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">${I18N_D.t('calc.correction_detaillee_lbl')}</div>
<div style="font-size:.9rem;">${I18N_D.t('calc.aire_correction_desc', {f: '{@q'+X+'_f@}', g: '{@q'+X+'_g@}', k: '{@q'+X+'_k@}', a: '{@q'+X+'_a@}', b: '{@q'+X+'_b@}', cond_sup: '{@q'+X+'_cond_sup@}', ta_aire: '{@q'+X+'_ta_aire@}'})}</div>
</div>`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    generalFeedback = mkFbGen_D(generalFeedback || '', p.fbGen);

    return {type:'calcul', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genCalcul: genCalcul, genCalculCore: genCalculCore };
}

// ─── STATISTIQUES ────────────────────────────────────────────

