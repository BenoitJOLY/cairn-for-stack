function _limBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    return {
        bareme: parseFloat(gs('lim-bareme')) || 1,
        scenario: gs('lim-scenario') || 'plus-inf',
        mode: (document.querySelector('input[name="lim-mode-r"]:checked')||{}).value || gs('lim-mode') || 'aleatoire',
        fbOk: gs('lim-fb-ok').trim(), fbWrong: gs('lim-fb-wrong').trim(),
        custText: gs('lim-text').trim(),
        expr: gs('lim-expr').trim() || 'x',
        tans: gs('lim-tans').trim() || '0',
        point: gs('lim-point').trim() || '1',
        fbGen: gs('lim-fbgen')
    };
}

async function genLimites(X) {
    var p = _limBuildParams();
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'limites', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
    } catch(e) { /* réseau indisponible : repli local ci-dessous */ }
    return genLimitesCore(X, p);
}

/* genLimitesCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-math-limites.test.js). */
function genLimitesCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;

    var bareme = p.bareme, scenario = p.scenario, mode = p.mode;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    var HDR = `<div style="background:#0ea5e9;border-left:5px solid #0284c7;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('lim.banniere')}</strong> <span style="background:#0284c7;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    function limNode(falseFb) {
        return {
            name: '0', description: 'Limite correcte ?', answertest: 'AlgEquiv', sans: `ans_lim${X}`, tans: `q${X}_ta`,
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT-'+X+'-OK', truefeedback: fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>'+I18N_D.t('trig.correct')+'</strong></div>',
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'PRT-'+X+'-NOK', falsefeedback: fbWrong || falseFb
        };
    }

    if (mode === 'fixe') {
        var expr = p.expr;
        var tans = p.tans;
        var point = p.point;
        var limLabelTex = { 'plus-inf': '\\lim_{x\\to+\\infty}', 'moins-inf': '\\lim_{x\\to-\\infty}',
            'point-fini': `\\lim_{x\\to${point}}`, 'droite-racine': `\\lim_{x\\to${point}^+}`, 'gauche-racine': `\\lim_{x\\to${point}^-}` }[scenario] || '\\lim_{x\\to+\\infty}';
        vars = `/* Q${X} Limites — Fixe */
q${X}_ta:${tans};`;
        qnote = `lim=${tans}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('lim.calc_limite')}</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle${limLabelTex} ${expr.replace(/\*/g,'')} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>${I18N_D.t('lim.taper_inf_ou_moins_inf')}</em></p>`;
        inputXML = mkInput_D({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:15,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('lim.fb_wrong_fixe', {tavar: 'q'+X+'_ta'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('lim.fbgen_fixe', {tavar: 'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'plus-inf') {
        vars = `/* Q${X} Limites — Limite en +inf */
q${X}_r_type:rand(4);
q${X}_r_sub:rand(3);
q${X}_num_cases:[[x^2+1,x^3+x,2*x^2-x],[x,2*x+1,x^2+3],[x^3-x,x^4+1,2*x^3],[x^2-1,3*x^2+x,x^2+2*x]];
q${X}_den_cases:[[x^3+2,2*x^3-1,x^3+x^2],[x+1,3*x-2,2*x+5],[x^2+1,x^3-1,x^3+x],[x^2+x+1,x^2-1,2*x^2+1]];
q${X}_lim_cases:[[0,0,0],[1,2/3,1/2],[inf,inf,2],[1,3,1/2]];
q${X}_num:q${X}_num_cases[q${X}_r_type+1][q${X}_r_sub+1];
q${X}_den:q${X}_den_cases[q${X}_r_type+1][q${X}_r_sub+1];
q${X}_ta:q${X}_lim_cases[q${X}_r_type+1][q${X}_r_sub+1];
q${X}_degn:hipow(q${X}_num,x);
q${X}_degd:hipow(q${X}_den,x);
q${X}_lcn:ratcoef(q${X}_num,x,q${X}_degn);
q${X}_lcd:ratcoef(q${X}_den,x,q${X}_degd);`;
        qnote = `lim(n/d) x->+inf={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('lim.calc_limite')}</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to+\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>${I18N_D.t('lim.taper_inf')}</em></p>`;
        inputXML = mkInput_D({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:15,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('lim.fb_wrong_plus_inf', {numvar:'q'+X+'_num', degnvar:'q'+X+'_degn', lcnvar:'q'+X+'_lcn', denvar:'q'+X+'_den', degdvar:'q'+X+'_degd', lcdvar:'q'+X+'_lcd', tavar:'q'+X+'_ta'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('lim.fbgen_plus_inf', {numvar:'q'+X+'_num', degnvar:'q'+X+'_degn', lcnvar:'q'+X+'_lcn', denvar:'q'+X+'_den', degdvar:'q'+X+'_degd', lcdvar:'q'+X+'_lcd', tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'moins-inf') {
        vars = `/* Q${X} Limites — Limite en -inf */
q${X}_r_type:rand(4);
q${X}_r_sub:rand(3);
q${X}_num_cases:[[x^2+1,x^3+x,2*x^2-x],[x,2*x+1,x^2+3],[-x^3+x,-x^4+1,2*x^3],[x^2-1,3*x^2+x,x^2+2*x]];
q${X}_den_cases:[[x^3+2,2*x^3-1,x^3+x^2],[x+1,3*x-2,2*x+5],[x^2+1,x^3-1,x^3+x],[x^2+x+1,x^2-1,2*x^2+1]];
q${X}_lim_cases:[[0,0,0],[1,2/3,1/2],[-inf,-inf,2],[1,3,1/2]];
q${X}_num:q${X}_num_cases[q${X}_r_type+1][q${X}_r_sub+1];
q${X}_den:q${X}_den_cases[q${X}_r_type+1][q${X}_r_sub+1];
q${X}_ta:q${X}_lim_cases[q${X}_r_type+1][q${X}_r_sub+1];
q${X}_degn:hipow(q${X}_num,x);
q${X}_degd:hipow(q${X}_den,x);
q${X}_lcn:ratcoef(q${X}_num,x,q${X}_degn);
q${X}_lcd:ratcoef(q${X}_den,x,q${X}_degd);`;
        qnote = `lim x->-inf={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('lim.calc_limite')}</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to-\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>${I18N_D.t('lim.taper_moins_inf')}</em></p>`;
        inputXML = mkInput_D({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:15,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('lim.fb_wrong_moins_inf', {numvar:'q'+X+'_num', degnvar:'q'+X+'_degn', lcnvar:'q'+X+'_lcn', denvar:'q'+X+'_den', degdvar:'q'+X+'_degd', lcdvar:'q'+X+'_lcd', tavar:'q'+X+'_ta'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('lim.fbgen_moins_inf', {numvar:'q'+X+'_num', degnvar:'q'+X+'_degn', lcnvar:'q'+X+'_lcn', denvar:'q'+X+'_den', degdvar:'q'+X+'_degd', lcdvar:'q'+X+'_lcd', tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'point-fini') {
        vars = `/* Q${X} Limites — Limite en point fini */
ri(a,b):=a+rand(b-a+1);
q${X}_r_a:rand(6);
q${X}_as:[2,3,-1,-2,4,-3];
q${X}_a:q${X}_as[q${X}_r_a+1];
q${X}_r_q:rand(4);
q${X}_Qs:[2*x+1,-3*x+4,x-5,-2*x-3];
q${X}_Q:q${X}_Qs[q${X}_r_q+1];
q${X}_num:(x-q${X}_a)*q${X}_Q;
q${X}_den:x-q${X}_a;
q${X}_ta:ev(q${X}_Q,x=q${X}_a);`;
        qnote = `lim x->{@q${X}_a@} = {@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('lim.calc_limite_indetermination')}</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to{@q${X}_a@}}\\frac{{@q${X}_num@}}{{@q${X}_den@}} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('lim.fb_wrong_point_fini', {avar:'q'+X+'_a', numvar:'q'+X+'_num', qvar:'q'+X+'_Q', tavar:'q'+X+'_ta'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('lim.fbgen_point_fini', {avar:'q'+X+'_a', numvar:'q'+X+'_num', qvar:'q'+X+'_Q', tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'droite-racine') {
        vars = `/* Q${X} Limites — Limite \xe0 droite (racine) */
ri(a,b):=a+rand(b-a+1);
q${X}_r_a:rand(5);
q${X}_as:[2,3,-1,-2,4];
q${X}_a:q${X}_as[q${X}_r_a+1];
q${X}_ta:inf;`;
        qnote = `lim x->{@q${X}_a@}+ sqrt(x-{@q${X}_a@})/(x-{@q${X}_a@})=inf`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('lim.calc_limite_droite')}</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to{@q${X}_a@}^+}\\frac{\\sqrt{x-{@q${X}_a@}}}{x-{@q${X}_a@}} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>${I18N_D.t('lim.taper_inf')}</em></p>`;
        inputXML = mkInput_D({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:10,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('lim.fb_wrong_droite', {avar:'q'+X+'_a'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('lim.fbgen_droite', {avar:'q'+X+'_a'})}</div>`;

    } else { /* gauche-racine */
        vars = `/* Q${X} Limites — Limite \xe0 gauche (racine) */
ri(a,b):=a+rand(b-a+1);
q${X}_r_a:rand(5);
q${X}_as:[2,3,-1,-2,4];
q${X}_a:q${X}_as[q${X}_r_a+1];
q${X}_ta:-inf;`;
        qnote = `lim x->{@q${X}_a@}- sqrt({@q${X}_a@}-x)/(x-{@q${X}_a@})=-inf`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('lim.calc_limite_gauche')}</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to{@q${X}_a@}^-}\\frac{\\sqrt{{@q${X}_a@}-x}}{x-{@q${X}_a@}} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>${I18N_D.t('lim.taper_moins_inf')}</em></p>`;
        inputXML = mkInput_D({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:10,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('lim.fb_wrong_gauche', {avar:'q'+X+'_a'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('lim.fbgen_gauche', {avar:'q'+X+'_a'})}</div>`;
    }

    generalFeedback = mkFbGen_D(generalFeedback, p.fbGen);

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    return {type:'limites', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: []};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genLimites: genLimites, genLimitesCore: genLimitesCore };
}

// ─── PHYSIQUE (stub) ─────────────────────────────────────────

