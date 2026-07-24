function _matBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var gi = function(id, def){ var v = parseInt(gs(id)); return isNaN(v) ? def : v; };
    var mn = gi('mat-rand-min', -3), mx = gi('mat-rand-max', 3);
    if (mx < mn) { var t = mn; mn = mx; mx = t; }
    return {
        bareme: parseFloat(gs('mat-bareme')) || 1,
        scenario: gs('mat-scenario') || 'det-2x2',
        fbOk: gs('mat-fb-ok').trim(), fbWrong: gs('mat-fb-wrong').trim(),
        custText: gs('mat-text').trim(),
        mn: mn, mx: mx,
        fbGen: gs('mat-fbgen')
    };
}

async function genMatrices(X) {
    var p = _matBuildParams();
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'matrices', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
    } catch(e) { /* réseau indisponible : repli local ci-dessous */ }
    return genMatricesCore(X, p);
}

/* genMatricesCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-math-matrices.test.js). */
function genMatricesCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;

    var bareme = p.bareme, scenario = p.scenario, fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var mn = p.mn, mx = p.mx;
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes, diagNodes = [];

    function matNode(name, desc, test, sans, tans, trueNext, trueScore, trueNote, trueFb, falseNext, falseScore, falseNote, falseFb) {
        return {
            name: String(name), description: desc, answertest: test, sans: sans, tans: tans,
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
            trueanswernote: trueNote, truefeedback: trueFb || '',
            falsescoremode: '=', falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
            falseanswernote: falseNote, falsefeedback: falseFb || ''
        };
    }

    var HDR = `<div style="background:#475569;border-left:5px solid #334155;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('mat.title')}</strong> <span style="background:#334155;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'det-2x2') {
        vars = `/* Q${X} Matrices — D\xe9terminant 2x2 */
ri(a,b):=a+rand(b-a+1);
q${X}_a11:ri(${mn},${mx});q${X}_a12:ri(${mn},${mx});q${X}_a21:ri(${mn},${mx});q${X}_a22:ri(${mn},${mx});
q${X}_M:matrix([q${X}_a11,q${X}_a12],[q${X}_a21,q${X}_a22]);
q${X}_ta:q${X}_a11*q${X}_a22-q${X}_a12*q${X}_a21;
q${X}_err_tr:q${X}_a11+q${X}_a22;
q${X}_err_plus:q${X}_a11*q${X}_a22+q${X}_a12*q${X}_a21;
q${X}_err_neg:q${X}_a12*q${X}_a21-q${X}_a11*q${X}_a22;`;
        qnote = `M={@q${X}_M@}, det={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Soit \\(M={@q${X}_M@}\\). Calculer \\(\\det(M)\\).</p>
<p>\\(\\det(M)=\\) [[input:ans_det${X}]] [[validation:ans_det${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_det${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [
            matNode(0, 'D\xe9terminant correct ?', 'AlgEquiv', `ans_det${X}`, `q${X}_ta`,
                -1, 1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_parfait')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            matNode(1, 'Erreur trace ?', 'AlgEquiv', `ans_det${X}`, `q${X}_err_tr`,
                -1, 0, 'PRT-'+X+'-ERR-TR', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N_D.t('mat.err_trace_confused')}</div>`,
                2, 0, 'PRT-'+X+'-NOT-TR', ''),
            matNode(2, 'Erreur signe ?', 'AlgEquiv', `ans_det${X}`, `q${X}_err_neg`,
                -1, 0, 'PRT-'+X+'-ERR-NEG', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N_D.t('mat.err_sign_inverted')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('mat.fb_wrong_det2', {tavar:'q'+X+'_ta'})}</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].truefeedback }
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('mat.fbgen_det2', {a11var:'q'+X+'_a11', a22var:'q'+X+'_a22', a12var:'q'+X+'_a12', a21var:'q'+X+'_a21', tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'produit-2x2') {
        vars = `/* Q${X} Matrices — Produit 2x2 */
ri(a,b):=a+rand(b-a+1);
q${X}_a:ri(${mn},${mx});q${X}_b:ri(${mn},${mx});q${X}_c:ri(${mn},${mx});q${X}_d:ri(${mn},${mx});
q${X}_e:ri(${mn},${mx});q${X}_f:ri(${mn},${mx});q${X}_g:ri(${mn},${mx});q${X}_h:ri(${mn},${mx});
q${X}_A:matrix([q${X}_a,q${X}_b],[q${X}_c,q${X}_d]);
q${X}_B:matrix([q${X}_e,q${X}_f],[q${X}_g,q${X}_h]);
q${X}_ta:q${X}_A.q${X}_B;
q${X}_err_BA:q${X}_B.q${X}_A;
q${X}_err_sum:q${X}_A+q${X}_B;`;
        qnote = `A={@q${X}_A@}, B={@q${X}_B@}, AB={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer le produit \\(A\\times B\\) :</p>
<p>\\(A={@q${X}_A@}\\), \\(B={@q${X}_B@}\\)</p>
<p>\\(A\\times B=\\) [[input:ans_prod${X}]] [[validation:ans_prod${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_prod${X}`,tans:`q${X}_ta`,type:'matrix',boxsize:5,hint:'matrix([,],[,])',mustverify:1,showvalidation:2});
        canonicalNodes = [
            matNode(0, 'Produit correct ?', 'AlgEquiv', `ans_prod${X}`, `q${X}_ta`,
                -1, 1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            matNode(1, 'Erreur B*A ?', 'AlgEquiv', `ans_prod${X}`, `q${X}_err_BA`,
                -1, 0, 'PRT-'+X+'-ERR-BA', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N_D.t('mat.err_ba_confused')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('mat.fb_wrong_produit', {tavar:'q'+X+'_ta'})}</div>`)
        ];
        diagNodes = [{ desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback }];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('mat.fbgen_produit', {tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'det-3x3') {
        vars = `/* Q${X} Matrices — D\xe9terminant 3x3 */
ri(a,b):=a+rand(b-a+1);
q${X}_a:ri(${mn},${mx});q${X}_b:ri(${mn},${mx});q${X}_c:ri(${mn},${mx});
q${X}_d:ri(${mn},${mx});q${X}_e:ri(${mn},${mx});q${X}_f:ri(${mn},${mx});
q${X}_g:ri(${mn},${mx});q${X}_h:ri(${mn},${mx});q${X}_i:ri(${mn},${mx});
q${X}_M:matrix([q${X}_a,q${X}_b,q${X}_c],[q${X}_d,q${X}_e,q${X}_f],[q${X}_g,q${X}_h,q${X}_i]);
q${X}_ta:determinant(q${X}_M);`;
        qnote = `M={@q${X}_M@}, det={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer \\(\\det(M)\\) avec \\(M={@q${X}_M@}\\) (r\xe8gle de Sarrus).</p>
<p>\\(\\det(M)=\\) [[input:ans_det${X}]] [[validation:ans_det${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_det${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [matNode(0, 'D\xe9terminant correct ?', 'AlgEquiv', `ans_det${X}`, `q${X}_ta`,
            -1, 1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_correct')}</strong></div>`,
            -1, 0, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('mat.fb_wrong_det3', {tavar:'q'+X+'_ta'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('mat.fbgen_det3', {tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'trace-3x3') {
        vars = `/* Q${X} Matrices — Trace 3x3 */
ri(a,b):=a+rand(b-a+1);
q${X}_a11:ri(${mn},${mx});q${X}_a12:ri(${mn},${mx});q${X}_a13:ri(${mn},${mx});
q${X}_a21:ri(${mn},${mx});q${X}_a22:ri(${mn},${mx});q${X}_a23:ri(${mn},${mx});
q${X}_a31:ri(${mn},${mx});q${X}_a32:ri(${mn},${mx});q${X}_a33:ri(${mn},${mx});
q${X}_M:matrix([q${X}_a11,q${X}_a12,q${X}_a13],[q${X}_a21,q${X}_a22,q${X}_a23],[q${X}_a31,q${X}_a32,q${X}_a33]);
q${X}_ta:q${X}_a11+q${X}_a22+q${X}_a33;
q${X}_err_det:determinant(q${X}_M);
q${X}_err_sum:sum(q${X}_M[i][j],i,1,3,j,1,3);`;
        qnote = `trace={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer la trace de \\(M={@q${X}_M@}\\).</p>
<p>\\(\\text{tr}(M)=\\) [[input:ans_tr${X}]] [[validation:ans_tr${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_tr${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [
            matNode(0, 'Trace correcte ?', 'AlgEquiv', `ans_tr${X}`, `q${X}_ta`,
                -1, 1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            matNode(1, 'Confondu det ?', 'AlgEquiv', `ans_tr${X}`, `q${X}_err_det`,
                -1, 0, 'PRT-'+X+'-ERR-DET', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N_D.t('mat.err_det_trace_confused')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('mat.fb_wrong_trace', {a11var:'q'+X+'_a11', a22var:'q'+X+'_a22', a33var:'q'+X+'_a33', tavar:'q'+X+'_ta'})}</div>`)
        ];
        diagNodes = [{ desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback }];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('mat.fbgen_trace', {a11var:'q'+X+'_a11', a22var:'q'+X+'_a22', a33var:'q'+X+'_a33', tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'transpose-3x3') {
        vars = `/* Q${X} Matrices — Transpos\xe9e 3x3 */
ri(a,b):=a+rand(b-a+1);
q${X}_a11:ri(${mn},${mx});q${X}_a12:ri(${mn},${mx});q${X}_a13:ri(${mn},${mx});
q${X}_a21:ri(${mn},${mx});q${X}_a22:ri(${mn},${mx});q${X}_a23:ri(${mn},${mx});
q${X}_a31:ri(${mn},${mx});q${X}_a32:ri(${mn},${mx});q${X}_a33:ri(${mn},${mx});
q${X}_M:matrix([q${X}_a11,q${X}_a12,q${X}_a13],[q${X}_a21,q${X}_a22,q${X}_a23],[q${X}_a31,q${X}_a32,q${X}_a33]);
q${X}_ta:transpose(q${X}_M);`;
        qnote = `M^T={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer la transpos\xe9e \\(M^T\\) de \\(M={@q${X}_M@}\\).</p>
<p>\\(M^T=\\) [[input:ans_t${X}]] [[validation:ans_t${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_t${X}`,tans:`q${X}_ta`,type:'matrix',boxsize:5,hint:'matrix([,,],[,,],[,,])',mustverify:1,showvalidation:2});
        canonicalNodes = [matNode(0, 'Transpos\xe9e correcte ?', 'AlgEquiv', `ans_t${X}`, `q${X}_ta`,
            -1, 1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_correct')}</strong></div>`,
            -1, 0, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('mat.fb_wrong_transpose', {tavar:'q'+X+'_ta'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('mat.fbgen_transpose', {tavar:'q'+X+'_ta'})}</div>`;

    } else { /* systeme-2x2 */
        vars = `/* Q${X} Matrices — Syst\xe8me 2x2 */
ri(a,b):=a+rand(b-a+1);
rnz(a,b):=block([v:ri(a,b)],while v=0 do v:ri(a,b),v);
q${X}_a:rnz(-4,4);q${X}_b:rnz(-4,4);q${X}_c:rnz(-4,4);q${X}_d:rnz(-4,4);
q${X}_x_sol:ri(-4,4);q${X}_y_sol:ri(-4,4);
while q${X}_a*q${X}_d-q${X}_b*q${X}_c=0 do (q${X}_a:rnz(-4,4));
q${X}_e:q${X}_a*q${X}_x_sol+q${X}_b*q${X}_y_sol;
q${X}_f:q${X}_c*q${X}_x_sol+q${X}_d*q${X}_y_sol;
q${X}_ta:matrix([q${X}_x_sol],[q${X}_y_sol]);`;
        qnote = `x={@q${X}_x_sol@}, y={@q${X}_y_sol@}`;
        textFrag = `${HDR}${custText}<p>R\xe9soudre le syst\xe8me :\\[\\begin{cases}{@q${X}_a@}x+{@q${X}_b@}y={@q${X}_e@}\\\\{@q${X}_c@}x+{@q${X}_d@}y={@q${X}_f@}\\end{cases}\\]</p>
<p>Solution \\(\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\) [[input:ans_sys${X}]] [[validation:ans_sys${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_sys${X}`,tans:`q${X}_ta`,type:'matrix',boxsize:5,hint:'matrix([x],[y])',mustverify:1,showvalidation:2});
        canonicalNodes = [matNode(0, 'Solution correcte ?', 'AlgEquiv', `ans_sys${X}`, `q${X}_ta`,
            -1, 1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N_D.t('mat.fb_ok_correct')}</strong></div>`,
            -1, 0, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N_D.t('mat.fb_wrong_systeme', {xvar:'q'+X+'_x_sol', yvar:'q'+X+'_y_sol'})}</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('mat.fbgen_systeme', {xvar:'q'+X+'_x_sol', yvar:'q'+X+'_y_sol'})}</div>`;
    }

    generalFeedback = mkFbGen_D(generalFeedback, p.fbGen);

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    return {type:'matrices', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genMatrices: genMatrices, genMatricesCore: genMatricesCore };
}

// ─── GÉOMÉTRIE ───────────────────────────────────────────────

