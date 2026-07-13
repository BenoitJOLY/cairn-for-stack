function genPolynomes(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('pol-bareme')) || 1;
    var scenario = gs('pol-scenario') || 'discriminant';
    var mode = (document.querySelector('input[name="pol-mode-r"]:checked')||{}).value || gs('pol-mode') || 'aleatoire';
    var fbOk = gs('pol-fb-ok').trim(), fbWrong = gs('pol-fb-wrong').trim();
    var custText = gs('pol-text').trim();
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    function polNode(name, desc, test, sans, tans, trueNext, trueScore, trueNote, trueFb, falseNext, falseScore, falseNote, falseFb, trueMode, falseMode) {
        return {
            name: String(name), description: desc, answertest: test, sans: sans, tans: tans,
            testoptions: '', quiet: '0',
            truescoremode: trueMode || '=', truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
            trueanswernote: trueNote, truefeedback: (name === 0 ? (fbOk || trueFb) : trueFb) || '',
            falsescoremode: falseMode || '=', falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
            falseanswernote: falseNote, falsefeedback: (name === 0 ? (fbWrong || falseFb) : falseFb) || ''
        };
    }

    var HDR = `<div style="background:#16a34a;border-left:5px solid #15803d;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N.t('pol.banniere')}</strong> <span style="background:#15803d;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    var pVars;
    if (mode === 'fixe') {
        var fa = gs('pol-a').trim() || '1', fb = gs('pol-b').trim() || '-5', fc = gs('pol-c').trim() || '6';
        pVars = `/* Q${X} Poly — base (fixe) */
q${X}_a:${fa};q${X}_b:${fb};q${X}_c:${fc};
q${X}_poly:q${X}_a*x^2+q${X}_b*x+q${X}_c;
q${X}_delta:q${X}_b^2-4*q${X}_a*q${X}_c;
q${X}_r1:if q${X}_delta>=0 then min(rootscontract((-q${X}_b-sqrt(q${X}_delta))/(2*q${X}_a)),rootscontract((-q${X}_b+sqrt(q${X}_delta))/(2*q${X}_a))) else 0;
q${X}_r2:if q${X}_delta>=0 then max(rootscontract((-q${X}_b-sqrt(q${X}_delta))/(2*q${X}_a)),rootscontract((-q${X}_b+sqrt(q${X}_delta))/(2*q${X}_a))) else 0;`;
    } else {
        var dMin = parseInt(gs('pol-delta-min'), 10); if (isNaN(dMin)) dMin = 1;
        var dMax = parseInt(gs('pol-delta-max'), 10); if (isNaN(dMax)) dMax = 50;
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
        textFrag = `${HDR}${custText}<p>${I18N.t('pol.q_discriminant', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(\\Delta=\\) [[input:ans_delta${X}]] [[validation:ans_delta${X}]]</p>`;
        inputXML = _mkInput({name:`ans_delta${X}`,tans:`q${X}_ta`,boxsize:15,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, 'Delta correct ?', 'AlgEquiv', `ans_delta${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            polNode(1, 'Erreur de signe (4ac-b^2 au lieu de b^2-4ac) ?', 'AlgEquiv', `ans_delta${X}`, `4*q${X}_a*q${X}_c-q${X}_b^2`, -1, 0, 'PRT-'+X+'-ERR-SGN',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_signe_discriminant')}</div>`,
                2, 0, 'PRT-'+X+'-CHK-SQ', ''),
            polNode(2, 'Oubli du carr\xe9 sur b ?', 'AlgEquiv', `ans_delta${X}`, `q${X}_b-4*q${X}_a*q${X}_c`, -1, 0, 'PRT-'+X+'-ERR-SQ',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_carre_b')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_discriminant', {bvar:'q'+X+'_b', avar:'q'+X+'_a', cvar:'q'+X+'_c', tavar:'q'+X+'_ta'})}</div>`)
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N.t('trig.correction_title')}</strong><br>${I18N.t('pol.fbgen_discriminant', {bvar:'q'+X+'_b', avar:'q'+X+'_a', cvar:'q'+X+'_c', tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'racines') {
        vars = pVars + `
q${X}_ta1:q${X}_r1;q${X}_ta2:q${X}_r2;`;
        qnote = `x1={@q${X}_ta1@}, x2={@q${X}_ta2@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('pol.q_racines', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_1=\\) [[input:ans_r1${X}]] [[validation:ans_r1${X}]]</p>
<p>\\(x_2=\\) [[input:ans_r2${X}]] [[validation:ans_r2${X}]]</p>`;
        inputXML = _mkInput({name:`ans_r1${X}`,tans:`q${X}_ta1`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2})
                 + '\n' + _mkInput({name:`ans_r2${X}`,tans:`q${X}_ta2`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, 'x1 correct ?', 'AlgEquiv', `ans_r1${X}`, `q${X}_ta1`, 2, 0.5, 'PRT-'+X+'-R1-OK',
                `<div style="border-left:4px solid #15803d;padding:8px 12px;background:#f0fdf4;border-radius:4px;">✅ ${I18N.t('pol.fb_ok_x1correct')}</div>`,
                1, 0, 'PRT-'+X+'-R1-NOK', ''),
            polNode(1, 'x1 : a-t-il donn\xe9 x2 \xe0 la place ?', 'AlgEquiv', `ans_r1${X}`, `q${X}_ta2`, 2, 0, 'PRT-'+X+'-R1-SWAP',
                `<div style="border-left:4px solid #f97316;padding:8px 12px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_x1_swap')}</div>`,
                2, 0, 'PRT-'+X+'-R1-NOK2', `<div style="border-left:4px solid #dc2626;padding:8px 12px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_x1', {ta1var:'q'+X+'_ta1'})}</div>`,
                '+', '+'),
            polNode(2, 'x2 correct ?', 'AlgEquiv', `ans_r2${X}`, `q${X}_ta2`, -1, 0.5, 'PRT-'+X+'-R2-OK',
                `<div style="border-left:4px solid #15803d;padding:8px 12px;background:#f0fdf4;border-radius:4px;">✅ ${I18N.t('pol.fb_ok_x2correct')}</div>`,
                3, 0, 'PRT-'+X+'-R2-NOK', '',
                '+', '+'),
            polNode(3, 'x2 : a-t-il donn\xe9 x1 \xe0 la place ?', 'AlgEquiv', `ans_r2${X}`, `q${X}_ta1`, -1, 0, 'PRT-'+X+'-R2-SWAP',
                `<div style="border-left:4px solid #f97316;padding:8px 12px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_x2_swap')}</div>`,
                -1, 0, 'PRT-'+X+'-R2-NOK2', `<div style="border-left:4px solid #dc2626;padding:8px 12px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_x2', {ta2var:'q'+X+'_ta2'})}</div>`,
                '+', '+')
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N.t('trig.correction_title')}</strong><br>${I18N.t('pol.fbgen_racines', {ta1var:'q'+X+'_ta1', ta2var:'q'+X+'_ta2'})}</div>`;

    } else if (scenario === 'racine1') {
        vars = pVars + `
q${X}_ta:q${X}_r1;`;
        qnote = `x_min={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('pol.q_racine1', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_{min}=\\) [[input:ans_rmin${X}]] [[validation:ans_rmin${X}]]</p>`;
        inputXML = _mkInput({name:`ans_rmin${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, 'Racine min correcte ?', 'AlgEquiv', `ans_rmin${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            polNode(1, 'A-t-il donn\xe9 l\'autre racine (max) ?', 'AlgEquiv', `ans_rmin${X}`, `q${X}_r2`, -1, 0, 'PRT-'+X+'-SWAP',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_racine1_swap')}</div>`,
                2, 0, 'PRT-'+X+'-CHKVX', ''),
            polNode(2, 'A-t-il donn\xe9 l\'abscisse du sommet (-b/2a) ?', 'AlgEquiv', `ans_rmin${X}`, `-q${X}_b/(2*q${X}_a)`, -1, 0, 'PRT-'+X+'-VERTEX',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_abscisse_sommet')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_racine1', {tavar:'q'+X+'_ta'})}</div>`)
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N.t('trig.correction_title')}</strong><br>${I18N.t('pol.fbgen_racine1', {tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'racine2') {
        vars = pVars + `
q${X}_ta:q${X}_r2;`;
        qnote = `x_max={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('pol.q_racine2', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_{max}=\\) [[input:ans_rmax${X}]] [[validation:ans_rmax${X}]]</p>`;
        inputXML = _mkInput({name:`ans_rmax${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, 'Racine max correcte ?', 'AlgEquiv', `ans_rmax${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            polNode(1, 'A-t-il donn\xe9 l\'autre racine (min) ?', 'AlgEquiv', `ans_rmax${X}`, `q${X}_r1`, -1, 0, 'PRT-'+X+'-SWAP',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_racine2_swap')}</div>`,
                2, 0, 'PRT-'+X+'-CHKVX', ''),
            polNode(2, 'A-t-il donn\xe9 l\'abscisse du sommet (-b/2a) ?', 'AlgEquiv', `ans_rmax${X}`, `-q${X}_b/(2*q${X}_a)`, -1, 0, 'PRT-'+X+'-VERTEX',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_abscisse_sommet')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_racine2', {tavar:'q'+X+'_ta'})}</div>`)
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N.t('trig.correction_title')}</strong><br>${I18N.t('pol.fbgen_racine2', {tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'somme-racines') {
        vars = pVars + `
q${X}_ta:-q${X}_b/q${X}_a;`;
        qnote = `somme racines={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('pol.q_somme', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_1+x_2=\\) [[input:ans_sum${X}]] [[validation:ans_sum${X}]]</p>`;
        inputXML = _mkInput({name:`ans_sum${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, 'Somme correcte ?', 'AlgEquiv', `ans_sum${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            polNode(1, 'Erreur de signe (b/a au lieu de -b/a) ?', 'AlgEquiv', `ans_sum${X}`, `q${X}_b/q${X}_a`, -1, 0, 'PRT-'+X+'-ERR-SGN',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_signe_somme')}</div>`,
                2, 0, 'PRT-'+X+'-CHK-PROD', ''),
            polNode(2, 'Confusion avec le produit (c/a) ?', 'AlgEquiv', `ans_sum${X}`, `q${X}_c/q${X}_a`, -1, 0, 'PRT-'+X+'-CONF-PROD',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_confusion_produit')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_somme', {tavar:'q'+X+'_ta'})}</div>`)
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N.t('trig.correction_title')}</strong><br>${I18N.t('pol.fbgen_somme', {bvar:'q'+X+'_b', avar:'q'+X+'_a', tavar:'q'+X+'_ta'})}</div>`;

    } else if (scenario === 'produit-racines') {
        vars = pVars + `
q${X}_ta:q${X}_c/q${X}_a;`;
        qnote = `produit racines={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('pol.q_produit', {polyvar:'q'+X+'_poly'})}</p>
<p>\\(x_1\\times x_2=\\) [[input:ans_prod${X}]] [[validation:ans_prod${X}]]</p>`;
        inputXML = _mkInput({name:`ans_prod${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            polNode(0, 'Produit correct ?', 'AlgEquiv', `ans_prod${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            polNode(1, 'Erreur de signe (-c/a au lieu de c/a) ?', 'AlgEquiv', `ans_prod${X}`, `-q${X}_c/q${X}_a`, -1, 0, 'PRT-'+X+'-ERR-SGN',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_signe_produit')}</div>`,
                2, 0, 'PRT-'+X+'-CHK-SUM', ''),
            polNode(2, 'Confusion avec la somme (-b/a) ?', 'AlgEquiv', `ans_prod${X}`, `-q${X}_b/q${X}_a`, -1, 0, 'PRT-'+X+'-CONF-SUM',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_confusion_somme')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_produit', {tavar:'q'+X+'_ta'})}</div>`)
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N.t('trig.correction_title')}</strong><br>${I18N.t('pol.fbgen_produit', {cvar:'q'+X+'_c', avar:'q'+X+'_a', tavar:'q'+X+'_ta'})}</div>`;

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
        textFrag = `${HDR}${custText}<p>${I18N.t('pol.q_nb_racines', {polyvar:'q'+X+'_poly'})}</p>
<p>${I18N.t('pol.lbl_nb_racines')}[[input:ans_nb${X}]] [[validation:ans_nb${X}]]</p>`;
        inputXML = _mkInput({name:`ans_nb${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:5,forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [
            polNode(0, 'Nombre correct ?', 'AlgEquiv', `ans_nb${X}`, `q${X}_ta`, -1, 1, 'PRT-'+X+'-OK',
                `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>${I18N.t('mat.fb_ok_correct')}</strong></div>`,
                1, 0, 'PRT-'+X+'-NOK', ''),
            polNode(1, 'A appliqu\xe9 la r\xe8gle du signe de Δ \xe0 l\'envers ?', 'AlgEquiv', `ans_nb${X}`, `2-q${X}_ta`, -1, 0, 'PRT-'+X+'-INV',
                `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 ${I18N.t('pol.err_regle_inversee')}</div>`,
                -1, 0, 'PRT-'+X+'-UNKNOWN',
                `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${I18N.t('pol.fb_wrong_nb_racines', {tavar:'q'+X+'_ta'})}</div>`)
        ];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>${I18N.t('trig.correction_title')}</strong><br>${I18N.t('pol.fbgen_nb_racines', {tavar:'q'+X+'_ta'})}</div>`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    prtXML = buildPrtXml(prtMeta, canonicalNodes);

    generalFeedback = _mkFbGen(generalFeedback, gs('pol-fbgen'));

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

// ─── LIMITES ─────────────────────────────────────────────────

