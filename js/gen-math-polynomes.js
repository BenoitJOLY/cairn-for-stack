function _polBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var dMin = parseInt(gs('pol-delta-min'), 10); if (isNaN(dMin)) dMin = 1;
    var dMax = parseInt(gs('pol-delta-max'), 10); if (isNaN(dMax)) dMax = 50;
    return {
        bareme: parseFloat(gs('pol-bareme')) || 1,
        scenario: gs('pol-scenario') || 'discriminant',
        mode: (document.querySelector('input[name="pol-mode-r"]:checked')||{}).value || gs('pol-mode') || 'aleatoire',
        fbOk: gs('pol-fb-ok').trim(),
        fbWrong: gs('pol-fb-wrong').trim(),
        custText: gs('pol-text').trim(),
        fa: gs('pol-a').trim() || '1',
        fb: gs('pol-b').trim() || '-5',
        fc: gs('pol-c').trim() || '6',
        dMin: dMin,
        dMax: dMax,
        fbGen: gs('pol-fbgen')
    };
}

async function genPolynomes(X) {
    var p = _polBuildParams();
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'polynomes', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Quota hebdomadaire atteint.');
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "polynomes", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "polynomes", repli sur le calcul local.', e); }
    return genPolynomesCore(X, p);
}

/* genPolynomesCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-math-polynomes.test.js). */
function genPolynomesCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var bareme = p.bareme, scenario = p.scenario, mode = p.mode;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    // polNode() : construit un nœud PRT en texte BRUT (pas d'encadré coloré). opts.fbKind
    // / opts.falseFbKind indiquent la catégorie sémantique ('true'/'partial'/'false') qui
    // servira à appliquer l'encadré uniquement au moment de l'export XML, via applyFbBox_D
    // (js/fb-box.js) — voir la construction de xmlNodes plus bas.
    function polNode(name, desc, test, sans, tans, trueNext, trueScore, trueNote, trueFb, falseNext, falseScore, falseNote, falseFb, opts) {
        opts = opts || {};
        return {
            name: String(name), description: desc, answertest: test, sans: sans, tans: tans,
            testoptions: '', quiet: '0',
            truescoremode: opts.trueMode || '=', truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
            trueanswernote: trueNote, truefeedback: (name === 0 ? (fbOk || trueFb) : trueFb) || '',
            fbKind: opts.fbKind || 'true',
            falsescoremode: opts.falseMode || '=', falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
            falseanswernote: falseNote, falsefeedback: (name === 0 ? (fbWrong || falseFb) : falseFb) || '',
            falseFbKind: opts.falseFbKind || 'false'
        };
    }

    var HDR = `<div style="background:#16a34a;border-left:5px solid #15803d;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('pol.banniere')}</strong> <span style="background:#15803d;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    var pVars;
    if (mode === 'fixe') {
        var fa = p.fa, fb = p.fb, fc = p.fc;
        pVars = `/* Q${X} Poly — base (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_c:${fc};
q${X}_poly:q${X}_a*x^2+q${X}_b*x+q${X}_c;
q${X}_delta:q${X}_b^2-4*q${X}_a*q${X}_c;
q${X}_r1:if q${X}_delta>=0 then min(rootscontract((-q${X}_b-sqrt(q${X}_delta))/(2*q${X}_a)),rootscontract((-q${X}_b+sqrt(q${X}_delta))/(2*q${X}_a))) else 0;
q${X}_r2:if q${X}_delta>=0 then max(rootscontract((-q${X}_b-sqrt(q${X}_delta))/(2*q${X}_a)),rootscontract((-q${X}_b+sqrt(q${X}_delta))/(2*q${X}_a))) else 0;`;
    } else {
        var dMin = p.dMin, dMax = p.dMax;
        pVars = `/* Q${X} Poly — base (al\xe9atoire, tirage rejet\xe9 hors bornes de Δ) */
ri(a,b):=a+rand(b-a+1);
q${X}_dmin:${dMin};q${X}_dmax:${dMax};
q${X}_as:[-3,-2,-1,1,2,3];
q${X}_r_a:rand(6);q${X}_a:q${X}_as[q${X}_r_a+1];
q${X}_b:ri(-5,5);q${X}_c:ri(-5,5);
q${X}_delta:q${X}_b^2-4*q${X}_a*q${X}_c;
q${X}_tries:0;
while (q${X}_delta<q${X}_dmin or q${X}_delta>q${X}_dmax) and q${X}_tries<300 do (
  q${X}_r_a:rand(6), q${X}_a:q${X}_as[q${X}_r_a+1],
  q${X}_b:ri(-5,5), q${X}_c:ri(-5,5),
  q${X}_delta:q${X}_b^2-4*q${X}_a*q${X}_c,
  q${X}_tries:q${X}_tries+1
);
q${X}_poly:q${X}_a*x^2+q${X}_b*x+q${X}_c;
q${X}_r1:if q${X}_delta>=0 then min(rootscontract((-q${X}_b-sqrt(q${X}_delta))/(2*q${X}_a)),rootscontract((-q${X}_b+sqrt(q${X}_delta))/(2*q${X}_a))) else 0;
q${X}_r2:if q${X}_delta>=0 then max(rootscontract((-q${X}_b-sqrt(q${X}_delta))/(2*q${X}_a)),rootscontract((-q${X}_b+sqrt(q${X}_delta))/(2*q${X}_a))) else 0;`;
    }

    if (scenario === 'discriminant') {
        vars = pVars + `
q${X}_ta:q${X}_delta;`;
        qnote = `delta={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('pol.q_discriminant', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(\\Delta=\\) [[input:ans_delta${X}]] [[validation:ans_delta${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_delta${X}`,tans:`q${X}_ta`,boxsize:15,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, I18N_D.t('pol.node_delta'), 'AlgEquiv', `ans_delta${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
                1, 0, 'PRT-'+X+'-NOK', '', { fbKind: 'true' }),
            polNode(1, I18N_D.t('pol.node_err_sgn_delta'), 'AlgEquiv', `ans_delta${X}`, `4*q${X}_a*q${X}_c-q${X}_b^2`, -1, 0, 'PRT-'+X+'-ERR-SGN',
                `${I18N_D.t('pol.err_signe_discriminant')}`,
                2, 0, 'PRT-'+X+'-CHK-SQ', '', { fbKind: 'partial' }),
            polNode(2, I18N_D.t('pol.node_err_oubli_carre'), 'AlgEquiv', `ans_delta${X}`, `q${X}_b-4*q${X}_a*q${X}_c`, -1, 0, 'PRT-'+X+'-ERR-SQ',
                `${I18N_D.t('pol.err_carre_b')}`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `${I18N_D.t('pol.fb_wrong_discriminant', {bvar:'q'+X+'_b', avar:'q'+X+'_a', cvar:'q'+X+'_c', tavar:'q'+X+'_ta'})}`,
                { fbKind: 'partial', falseFbKind: 'false' })
        ];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('pol.fbgen_discriminant', {bvar:'q'+X+'_b', avar:'q'+X+'_a', cvar:'q'+X+'_c', tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'racines') {
        vars = pVars + `
q${X}_ta1:q${X}_r1;q${X}_ta2:q${X}_r2;`;
        qnote = `x1={@q${X}_ta1@}, x2={@q${X}_ta2@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('pol.q_racines', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_1=\\) [[input:ans_r1${X}]] [[validation:ans_r1${X}]]</p>
<p>\\(x_2=\\) [[input:ans_r2${X}]] [[validation:ans_r2${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_r1${X}`,tans:`q${X}_ta1`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2})
                 + '\n' + mkInput_D({name:`ans_r2${X}`,tans:`q${X}_ta2`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, I18N_D.t('pol.node_x1'), 'AlgEquiv', `ans_r1${X}`, `q${X}_ta1`, 2, 0.5, 'PRT-'+X+'-R1-OK',
                `${I18N_D.t('pol.fb_ok_x1correct')}`,
                1, 0, 'PRT-'+X+'-R1-NOK', '', { fbKind: 'true' }),
            polNode(1, I18N_D.t('pol.node_err_x1_swap'), 'AlgEquiv', `ans_r1${X}`, `q${X}_ta2`, 2, 0, 'PRT-'+X+'-R1-SWAP',
                `${I18N_D.t('pol.err_x1_swap')}`,
                2, 0, 'PRT-'+X+'-R1-NOK2', `${I18N_D.t('pol.fb_wrong_x1', {ta1var:'q'+X+'_ta1'})}`,
                { trueMode: '+', falseMode: '+', fbKind: 'partial', falseFbKind: 'false' }),
            polNode(2, I18N_D.t('pol.node_x2'), 'AlgEquiv', `ans_r2${X}`, `q${X}_ta2`, -1, 0.5, 'PRT-'+X+'-R2-OK',
                `${I18N_D.t('pol.fb_ok_x2correct')}`,
                3, 0, 'PRT-'+X+'-R2-NOK', '',
                { trueMode: '+', falseMode: '+', fbKind: 'true' }),
            polNode(3, I18N_D.t('pol.node_err_x2_swap'), 'AlgEquiv', `ans_r2${X}`, `q${X}_ta1`, -1, 0, 'PRT-'+X+'-R2-SWAP',
                `${I18N_D.t('pol.err_x2_swap')}`,
                -1, 0, 'PRT-'+X+'-R2-NOK2', `${I18N_D.t('pol.fb_wrong_x2', {ta2var:'q'+X+'_ta2'})}`,
                { trueMode: '+', falseMode: '+', fbKind: 'partial', falseFbKind: 'false' })
        ];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('pol.fbgen_racines', {ta1var:'q'+X+'_ta1', ta2var:'q'+X+'_ta2'})}`;

    } else if (scenario === 'racine1') {
        vars = pVars + `
q${X}_ta:q${X}_r1;`;
        qnote = `x_min={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('pol.q_racine1', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_{min}=\\) [[input:ans_rmin${X}]] [[validation:ans_rmin${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_rmin${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, I18N_D.t('pol.node_racine_min'), 'AlgEquiv', `ans_rmin${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
                1, 0, 'PRT-'+X+'-NOK', '', { fbKind: 'true' }),
            polNode(1, I18N_D.t('pol.node_err_racine_max_swap'), 'AlgEquiv', `ans_rmin${X}`, `q${X}_r2`, -1, 0, 'PRT-'+X+'-SWAP',
                `${I18N_D.t('pol.err_racine1_swap')}`,
                2, 0, 'PRT-'+X+'-CHKVX', '', { fbKind: 'partial' }),
            polNode(2, I18N_D.t('pol.node_err_vertex'), 'AlgEquiv', `ans_rmin${X}`, `-q${X}_b/(2*q${X}_a)`, -1, 0, 'PRT-'+X+'-VERTEX',
                `${I18N_D.t('pol.err_abscisse_sommet')}`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `${I18N_D.t('pol.fb_wrong_racine1', {tavar:'q'+X+'_ta'})}`,
                { fbKind: 'partial', falseFbKind: 'false' })
        ];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('pol.fbgen_racine1', {tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'racine2') {
        vars = pVars + `
q${X}_ta:q${X}_r2;`;
        qnote = `x_max={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('pol.q_racine2', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_{max}=\\) [[input:ans_rmax${X}]] [[validation:ans_rmax${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_rmax${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, I18N_D.t('pol.node_racine_max'), 'AlgEquiv', `ans_rmax${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
                1, 0, 'PRT-'+X+'-NOK', '', { fbKind: 'true' }),
            polNode(1, I18N_D.t('pol.node_err_racine_min_swap'), 'AlgEquiv', `ans_rmax${X}`, `q${X}_r1`, -1, 0, 'PRT-'+X+'-SWAP',
                `${I18N_D.t('pol.err_racine2_swap')}`,
                2, 0, 'PRT-'+X+'-CHKVX', '', { fbKind: 'partial' }),
            polNode(2, I18N_D.t('pol.node_err_vertex'), 'AlgEquiv', `ans_rmax${X}`, `-q${X}_b/(2*q${X}_a)`, -1, 0, 'PRT-'+X+'-VERTEX',
                `${I18N_D.t('pol.err_abscisse_sommet')}`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `${I18N_D.t('pol.fb_wrong_racine2', {tavar:'q'+X+'_ta'})}`,
                { fbKind: 'partial', falseFbKind: 'false' })
        ];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('pol.fbgen_racine2', {tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'somme-racines') {
        vars = pVars + `
q${X}_ta:-q${X}_b/q${X}_a;`;
        qnote = `somme racines={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('pol.q_somme', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_1+x_2=\\) [[input:ans_sum${X}]] [[validation:ans_sum${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_sum${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, I18N_D.t('pol.node_somme'), 'AlgEquiv', `ans_sum${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
                1, 0, 'PRT-'+X+'-NOK', '', { fbKind: 'true' }),
            polNode(1, I18N_D.t('pol.node_err_sgn_somme'), 'AlgEquiv', `ans_sum${X}`, `q${X}_b/q${X}_a`, -1, 0, 'PRT-'+X+'-ERR-SGN',
                `${I18N_D.t('pol.err_signe_somme')}`,
                2, 0, 'PRT-'+X+'-CHK-PROD', '', { fbKind: 'partial' }),
            polNode(2, I18N_D.t('pol.node_err_conf_produit'), 'AlgEquiv', `ans_sum${X}`, `q${X}_c/q${X}_a`, -1, 0, 'PRT-'+X+'-CONF-PROD',
                `${I18N_D.t('pol.err_confusion_produit')}`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `${I18N_D.t('pol.fb_wrong_somme', {tavar:'q'+X+'_ta'})}`,
                { fbKind: 'partial', falseFbKind: 'false' })
        ];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('pol.fbgen_somme', {bvar:'q'+X+'_b', avar:'q'+X+'_a', tavar:'q'+X+'_ta'})}`;

    } else if (scenario === 'produit-racines') {
        vars = pVars + `
q${X}_ta:q${X}_c/q${X}_a;`;
        qnote = `produit racines={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('pol.q_produit', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_1\\times x_2=\\) [[input:ans_prod${X}]] [[validation:ans_prod${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_prod${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, I18N_D.t('pol.node_produit'), 'AlgEquiv', `ans_prod${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
                1, 0, 'PRT-'+X+'-NOK', '', { fbKind: 'true' }),
            polNode(1, I18N_D.t('pol.node_err_sgn_produit'), 'AlgEquiv', `ans_prod${X}`, `-q${X}_c/q${X}_a`, -1, 0, 'PRT-'+X+'-ERR-SGN',
                `${I18N_D.t('pol.err_signe_produit')}`,
                2, 0, 'PRT-'+X+'-CHK-SUM', '', { fbKind: 'partial' }),
            polNode(2, I18N_D.t('pol.node_err_conf_somme'), 'AlgEquiv', `ans_prod${X}`, `-q${X}_b/q${X}_a`, -1, 0, 'PRT-'+X+'-CONF-SUM',
                `${I18N_D.t('pol.err_confusion_somme')}`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `${I18N_D.t('pol.fb_wrong_produit', {tavar:'q'+X+'_ta'})}`,
                { fbKind: 'partial', falseFbKind: 'false' })
        ];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('pol.fbgen_produit', {cvar:'q'+X+'_c', avar:'q'+X+'_a', tavar:'q'+X+'_ta'})}`;

    } else { /* nb-racines */
        vars = mode === 'fixe' ? pVars + `
q${X}_ta:if q${X}_delta>0 then 2 elseif q${X}_delta=0 then 1 else 0;` : `/* Q${X} Poly — Nombre de racines */
ri(a,b):=a+rand(b-a+1);
q${X}_r_type:rand(3);
q${X}_r_poly:rand(4);
q${X}_polys_0:[x^2+1,x^2+2,2*x^2+3,x^2+4];
q${X}_polys_1:[x^2,4*x^2,x^2-4*x+4,(x-1)^2];
q${X}_polys_2:[x^2-1,x^2-4,2*x^2-2,x^2+x-2];
q${X}_poly:if q${X}_r_type=0 then q${X}_polys_0[q${X}_r_poly+1] elseif q${X}_r_type=1 then q${X}_polys_1[q${X}_r_poly+1] else q${X}_polys_2[q${X}_r_poly+1];
q${X}_ta:q${X}_r_type;`;
        qnote = `nb racines={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('pol.q_nb_racines', {polyvar:'q'+X+'_poly'})}</p>
<p>${I18N_D.t('pol.lbl_nb_racines')}[[input:ans_nb${X}]] [[validation:ans_nb${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_nb${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:5,forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [
            polNode(0, I18N_D.t('pol.node_nombre'), 'AlgEquiv', `ans_nb${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>`,
                1, 0, 'PRT-'+X+'-NOK', '', { fbKind: 'true' }),
            polNode(1, I18N_D.t('pol.node_err_sgn_delta_inv'), 'AlgEquiv', `ans_nb${X}`, `2-q${X}_ta`, -1, 0, 'PRT-'+X+'-INV',
                `${I18N_D.t('pol.err_regle_inversee')}`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `${I18N_D.t('pol.fb_wrong_nb_racines', {tavar:'q'+X+'_ta'})}`,
                { fbKind: 'partial', falseFbKind: 'false' })
        ];
        generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('pol.fbgen_nb_racines', {tavar:'q'+X+'_ta'})}`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    // canonicalNodes (exposé via prt.nodes pour prt-manager.js) reste en texte brut, sans
    // encadré : xmlNodes n'est qu'une copie avec l'encadré coloré appliqué (js/fb-box.js),
    // réservée à la génération du XML final — voir js/gen-basen.js pour le même pattern.
    var xmlNodes = canonicalNodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: n.truefeedback ? applyFbBox_D(n.fbKind || 'true', n.truefeedback) : n.truefeedback,
            falsefeedback: n.falsefeedback ? applyFbBox_D(n.falseFbKind || 'false', n.falsefeedback) : n.falsefeedback
        });
    });
    prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    generalFeedback = applyFbBox_D('general', mkFbGen_D(generalFeedback, p.fbGen));

    // Les arbres PRT ont plusieurs nœuds de diagnostic (nœud 0 = Ok/Faux affiché par
    // défaut) : on expose ici tous les nœuds suivants pour que leurs descriptions et
    // feedbacks restent visibles dans l'aperçu, quelle que soit la profondeur de l'arbre.
    var diagNodes = canonicalNodes.slice(1).map(function (n) {
        return { desc: n.description, fb: n.truefeedback || n.falsefeedback || '' };
    });

    return {type:'polynomes', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genPolynomes: genPolynomes, genPolynomesCore: genPolynomesCore };
}

// ─── LIMITES ─────────────────────────────────────────────────

