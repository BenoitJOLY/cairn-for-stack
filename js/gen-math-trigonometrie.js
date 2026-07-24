function _trigBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    return {
        bareme: parseFloat(gs('trig-bareme')) || 1,
        scenario: gs('trig-scenario') || 'valeur-exacte',
        mode: (document.querySelector('input[name="trig-mode-r"]:checked')||{}).value || gs('trig-mode') || 'aleatoire',
        fbOk: gs('trig-fb-ok').trim(), fbWrong: gs('trig-fb-wrong').trim(),
        custText: gs('trig-text').trim(),
        fn: gs('trig-fn') || 'sin',
        angle: gs('trig-angle').trim() || '%pi/6',
        expr: gs('trig-expr').trim() || 'sin(x)^2 + cos(x)^2',
        fbGenExtra: gs('trig-fbgen')
    };
}

async function genTrigonometrie(X) {
    var p = _trigBuildParams();
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'trigonometrie', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
    } catch(e) { /* réseau indisponible : repli local ci-dessous */ }
    return genTrigonometrieCore(X, p);
}

/* genTrigonometrieCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-math-trigonometrie.test.js). */
function genTrigonometrieCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var mkInput_D = deps._mkInput || _mkInput;

    var bareme = p.bareme, scenario = p.scenario, mode = p.mode;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    function trigNode(desc, sans, tans, falseFb) {
        return {
            name: '0', description: desc, answertest: 'AlgEquiv', sans: sans, tans: tans,
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT-'+X+'-OK', truefeedback: fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>'+I18N_D.t('trig.correct')+'</strong></div>',
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'PRT-'+X+'-NOK', falsefeedback: fbWrong || falseFb
        };
    }

    var HDR = `<div style="background:#dc2626;border-left:5px solid #b91c1c;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('trig.title')}</strong> <span style="background:#b91c1c;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (mode === 'fixe' && scenario === 'valeur-exacte') {
        var fn = p.fn;
        var angle = p.angle;
        vars = `/* Q${X} Trig — Valeur exacte (fixe) */
q${X}_fname:"${fn}";
q${X}_angle:${angle};
q${X}_ta:${fn}(${angle});`;
        qnote = `{@q${X}_fname@}({@q${X}_angle@})={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('trig.calc_valeur_exacte')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.2rem;">\\( {@q${X}_fname@}\\left({@q${X}_angle@}\\right) \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_trig${X}]] [[validation:ans_trig${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_trig${X}`,tans:`q${X}_ta`,boxsize:15,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [trigNode('Valeur exacte correcte ?', `ans_trig${X}`, `q${X}_ta`,
            `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('trig.fb_wrong_cercle_prefix')}${I18N_D.t('trig.reponse_lbl')}{@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>\\({@q${X}_fname@}\\left({@q${X}_angle@}\\right)={@q${X}_ta@}\\).</div>`;

    } else if (mode === 'fixe') { /* fixe + identite */
        var expr = p.expr;
        vars = `/* Q${X} Trig — Simplifier expression (fixe) */
q${X}_expr:${expr};
q${X}_ta:trigreduce(trigsimp(q${X}_expr));`;
        qnote = `expr={@q${X}_expr@}={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('trig.simplifier_expr')}</p>
<div style="text-align:center;margin:15px 0;">\\( {@q${X}_expr@} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_simp${X}]] [[validation:ans_simp${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_simp${X}`,tans:`q${X}_ta`,boxsize:15,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [trigNode('Simplification correcte ?', `ans_simp${X}`, `q${X}_ta`,
            `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('trig.reponse_lbl')}{@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>\\({@q${X}_expr@}={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'valeur-exacte') {
        vars = `/* Q${X} Trig — Valeur exacte */
q${X}_r_angle:rand(10);
q${X}_angles:[%pi/6,5*%pi/6,7*%pi/6,11*%pi/6,%pi/4,3*%pi/4,5*%pi/4,7*%pi/4,%pi/3,2*%pi/3];
q${X}_angle:q${X}_angles[q${X}_r_angle+1];
q${X}_r_func:rand(3);
q${X}_funcs:[sin,cos,tan];
q${X}_fname:["sin","cos","tan"][q${X}_r_func+1];
q${X}_ta:if q${X}_r_func=0 then sin(q${X}_angle) elseif q${X}_r_func=1 then cos(q${X}_angle) else tan(q${X}_angle);`;
        qnote = `{@q${X}_fname@}({@q${X}_angle@})={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('trig.calc_valeur_exacte')}</p>
<div style="text-align:center;margin:15px 0;font-size:1.2rem;">\\( {@q${X}_fname@}\\left({@q${X}_angle@}\\right) \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_trig${X}]] [[validation:ans_trig${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_trig${X}`,tans:`q${X}_ta`,boxsize:15,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [trigNode('Valeur exacte correcte ?', `ans_trig${X}`, `q${X}_ta`,
            `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('trig.fb_wrong_cercle_prefix')}${I18N_D.t('trig.reponse_lbl')}{@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>\\({@q${X}_fname@}\\left({@q${X}_angle@}\\right)={@q${X}_ta@}\\).</div>`;

    } else { /* aleatoire + identite */
        vars = `/* Q${X} Trig — Simplifier expression */
q${X}_r_tpl:rand(4);
q${X}_r_a:rand(3);
q${X}_r_b0:rand(2);
q${X}_r_b:if q${X}_r_b0>=q${X}_r_a then q${X}_r_b0+1 else q${X}_r_b0;
q${X}_angles_a:[%pi/6,%pi/4,%pi/3];
q${X}_p:q${X}_angles_a[q${X}_r_a+1];
q${X}_q:q${X}_angles_a[q${X}_r_b+1];
q${X}_ta:if q${X}_r_tpl=0 then 2*cos(q${X}_p)*cos(q${X}_q)
     elseif q${X}_r_tpl=1 then -2*sin(q${X}_p)*sin(q${X}_q)
     elseif q${X}_r_tpl=2 then 2*sin(q${X}_p)*cos(q${X}_q)
     else 2*cos(q${X}_p)*sin(q${X}_q);
q${X}_expr:if q${X}_r_tpl=0 then cos(q${X}_p+q${X}_q)+cos(q${X}_p-q${X}_q)
      elseif q${X}_r_tpl=1 then cos(q${X}_p+q${X}_q)-cos(q${X}_p-q${X}_q)
      elseif q${X}_r_tpl=2 then sin(q${X}_p+q${X}_q)+sin(q${X}_p-q${X}_q)
      else sin(q${X}_p+q${X}_q)-sin(q${X}_p-q${X}_q);`;
        qnote = `expr={@q${X}_expr@}={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('trig.simplifier_expr')}</p>
<div style="text-align:center;margin:15px 0;">\\( {@q${X}_expr@} \\)</div>
<p>${I18N_D.t('trig.reponse_lbl')}[[input:ans_simp${X}]] [[validation:ans_simp${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_simp${X}`,tans:`q${X}_ta`,boxsize:15,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [trigNode('Simplification correcte ?', `ans_simp${X}`, `q${X}_ta`,
            `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('trig.fb_wrong_simpson_prefix')}${I18N_D.t('trig.reponse_lbl')}{@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>\\({@q${X}_expr@}={@q${X}_ta@}\\) ${I18N_D.t('trig.simpson_note')}.</div>`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    generalFeedback = mkFbGen_D(generalFeedback, p.fbGenExtra);

    return {type:'trigonometrie', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: []};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genTrigonometrie: genTrigonometrie, genTrigonometrieCore: genTrigonometrieCore };
}

// ─── POLYNÔMES ───────────────────────────────────────────────

