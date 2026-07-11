function genMatrices(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var gi = function(id, def){ var v = parseInt(gs(id)); return isNaN(v) ? def : v; };
    var bareme = parseFloat(gs('mat-bareme')) || 1;
    var scenario = gs('mat-scenario') || 'det-2x2';
    var fbOk = gs('mat-fb-ok').trim(), fbWrong = gs('mat-fb-wrong').trim();
    var custText = gs('mat-text').trim();
    var mn = gi('mat-rand-min', -3), mx = gi('mat-rand-max', 3);
    if (mx < mn) { var t = mn; mn = mx; mx = t; }
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

    var HDR = `<div style="background:#475569;border-left:5px solid #334155;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Matrices</strong> <span style="background:#334155;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

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
        inputXML = _mkInput({name:`ans_det${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [
            matNode(0, 'D\xe9terminant correct ?', 'AlgEquiv', `ans_det${X}`, `q${X}_ta`,
                -1, 1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong></div>',
                1, 0, 'PRT-'+X+'-NOK', ''),
            matNode(1, 'Erreur trace ?', 'AlgEquiv', `ans_det${X}`, `q${X}_err_tr`,
                -1, 0, 'PRT-'+X+'-ERR-TR', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 Vous avez calcul\xe9 la trace ! \\(\\det(M)=ad-bc\\), pas \\(a+d\\).</div>`,
                2, 0, 'PRT-'+X+'-NOT-TR', ''),
            matNode(2, 'Erreur signe ?', 'AlgEquiv', `ans_det${X}`, `q${X}_err_neg`,
                -1, 0, 'PRT-'+X+'-ERR-NEG', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 Signe invers\xe9 ! \\(\\det=ad-bc\\), pas \\(bc-ad\\).</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(\\det\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=ad-bc={@q${X}_ta@}\\).</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].truefeedback }
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\det(M)=({@q${X}_a11@})({@q${X}_a22@})-({@q${X}_a12@})({@q${X}_a21@})={@q${X}_ta@}\\).</div>`;

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
        inputXML = _mkInput({name:`ans_prod${X}`,tans:`q${X}_ta`,type:'matrix',boxsize:5,hint:'matrix([,],[,])',mustverify:1,showvalidation:2});
        canonicalNodes = [
            matNode(0, 'Produit correct ?', 'AlgEquiv', `ans_prod${X}`, `q${X}_ta`,
                -1, 1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
                1, 0, 'PRT-'+X+'-NOK', ''),
            matNode(1, 'Erreur B*A ?', 'AlgEquiv', `ans_prod${X}`, `q${X}_err_BA`,
                -1, 0, 'PRT-'+X+'-ERR-BA', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 Vous avez calcul\xe9 \\(B\\times A\\) ! Le produit matriciel n'est pas commutatif.</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(A\\times B={@q${X}_ta@}\\).</div>`)
        ];
        diagNodes = [{ desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback }];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(A\\times B={@q${X}_ta@}\\).</div>`;

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
        inputXML = _mkInput({name:`ans_det${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [matNode(0, 'D\xe9terminant correct ?', 'AlgEquiv', `ans_det${X}`, `q${X}_ta`,
            -1, 1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            -1, 0, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ R\xe8gle de Sarrus : \\(\\det={@q${X}_ta@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\det(M)={@q${X}_ta@}\\).</div>`;

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
        inputXML = _mkInput({name:`ans_tr${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [
            matNode(0, 'Trace correcte ?', 'AlgEquiv', `ans_tr${X}`, `q${X}_ta`,
                -1, 1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
                1, 0, 'PRT-'+X+'-NOK', ''),
            matNode(1, 'Confondu det ?', 'AlgEquiv', `ans_tr${X}`, `q${X}_err_det`,
                -1, 0, 'PRT-'+X+'-ERR-DET', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 Confusion trace/d\xe9terminant ! La trace = somme des \xe9l\xe9ments diagonaux.</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ Trace = somme des \xe9l\xe9ments diagonaux = {@q${X}_a11@}+{@q${X}_a22@}+{@q${X}_a33@}={@q${X}_ta@}.</div>`)
        ];
        diagNodes = [{ desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback }];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\text{tr}(M)={@q${X}_a11@}+{@q${X}_a22@}+{@q${X}_a33@}={@q${X}_ta@}\\).</div>`;

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
        inputXML = _mkInput({name:`ans_t${X}`,tans:`q${X}_ta`,type:'matrix',boxsize:5,hint:'matrix([,,],[,,],[,,])',mustverify:1,showvalidation:2});
        canonicalNodes = [matNode(0, 'Transpos\xe9e correcte ?', 'AlgEquiv', `ans_t${X}`, `q${X}_ta`,
            -1, 1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            -1, 0, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ La transpos\xe9e : \\((M^T)_{ij}=M_{ji}\\). R\xe9ponse : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(M^T={@q${X}_ta@}\\).</div>`;

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
        inputXML = _mkInput({name:`ans_sys${X}`,tans:`q${X}_ta`,type:'matrix',boxsize:5,hint:'matrix([x],[y])',mustverify:1,showvalidation:2});
        canonicalNodes = [matNode(0, 'Solution correcte ?', 'AlgEquiv', `ans_sys${X}`, `q${X}_ta`,
            -1, 1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            -1, 0, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ Solution : \\(x={@q${X}_x_sol@}, y={@q${X}_y_sol@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(x={@q${X}_x_sol@}\\), \\(y={@q${X}_y_sol@}\\).</div>`;
    }

    generalFeedback = _mkFbGen(generalFeedback, gs('mat-fbgen'));

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    prtXML = buildPrtXml(prtMeta, canonicalNodes);

    return {type:'matrices', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []};
}

// ─── GÉOMÉTRIE ───────────────────────────────────────────────

