function genStatistiques(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('stat-bareme')) || 1;
    var scenario = gs('stat-scenario') || 'moyenne';
    var display = gs('stat-display') || 'liste';
    var fbOk = gs('stat-fb-ok').trim();
    var fbWrong = gs('stat-fb-wrong').trim();
    var custText = gs('stat-text').trim();
    var varName = gs('stat-varname').trim() || 'x';
    var dataDecimals = parseInt(gs('stat-data-decimals'));
    if (isNaN(dataDecimals) || dataDecimals < 0) dataDecimals = 1;
    if (dataDecimals > 3) dataDecimals = 3;
    // Fragment Maxima ajoutant une partie fractionnaire aléatoire (0 à dataDecimals décimales) à un entier de base :
    // "" si 0 décimale (valeurs entières), sinon "+ri(0,10^d-1)/10^d".
    var frac = dataDecimals > 0 ? `+ri(0,${Math.pow(10, dataDecimals) - 1})/${Math.pow(10, dataDecimals)}` : '';
    var randFormatEl = document.querySelector('input[name="stat-rand-format-radio"]:checked');
    var randFormat = randFormatEl ? randFormatEl.value : 'decimal';
    var wrapOpen = randFormat === 'decimal' ? 'float(' : '';
    var wrapClose = randFormat === 'decimal' ? ')' : '';
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    function statNode(desc, test, sans, tans, opts, trueFb, falseFb) {
        return {
            name: '0', description: desc, answertest: test, sans: sans, tans: tans,
            testoptions: opts || '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT-'+X+'-OK', truefeedback: trueFb,
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'PRT-'+X+'-NOK', falsefeedback: falseFb
        };
    }

    // Rend la série q${X}_L dans l'énoncé : en ligne (LaTeX) ou en tableau HTML (une cellule par valeur, via {@q${X}_L[i]@})
    var serieHTML = function(n) {
        if (display === 'tableau') {
            var cells = '';
            for (var i = 1; i <= n; i++) {
                cells += `<td style="padding:6px 14px;border:1px solid #cbd5e1;text-align:center;">{@q${X}_L[${i}]@}</td>`;
            }
            return `<table style="border-collapse:collapse;margin:8px 0;"><tr>${cells}</tr></table>`;
        }
        return `\\( {@q${X}_L@} \\)`;
    };

    var HDR = `<div style="background:#0284c7;border-left:5px solid #0369a1;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Statistiques</strong> <span style="background:#0369a1;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'mediane') {
        vars = `/* Q${X} Stats — M\xe9diane */
ri(a,b):=a+rand(b-a+1);
q${X}_L:${wrapOpen}sort([ri(1,9)${frac},ri(10,17)${frac},ri(20,28)${frac},ri(30,38)${frac},ri(40,47)${frac},ri(50,58)${frac}])${wrapClose};
q${X}_n:length(q${X}_L);
q${X}_ta:float(median(q${X}_L));`;
        qnote = `L={@q${X}_L@}, mediane={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer la m\xe9diane de la s\xe9rie :</p>${serieHTML(6)}
<p>M\xe9diane = [[input:ans_med${X}]] [[validation:ans_med${X}]]</p>`;
        inputXML = _mkInput({name:`ans_med${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('M\xe9diane correcte ?', 'NumAbsolute', `ans_med${X}`, `q${X}_ta`, '0.005',
            fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong> La m\xe9diane est {@q${X}_ta@}.</div>`,
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ La m\xe9diane est la valeur centrale (ou moyenne des deux valeurs centrales) de la s\xe9rie tri\xe9e. R\xe9ponse : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>S\xe9rie tri\xe9e : \\({@q${X}_L@}\\) (n={@q${X}_n@}).<br>M\xe9diane = {@q${X}_ta@}.</div>`;

    } else if (scenario === 'ecart-type') {
        vars = `/* Q${X} Stats — \xc9cart-type */
ri(a,b):=a+rand(b-a+1);
q${X}_L:${wrapOpen}[ri(1,8)${frac},ri(1,8)${frac},ri(1,8)${frac},ri(1,8)${frac},ri(1,8)${frac}]${wrapClose};
q${X}_n:length(q${X}_L);
q${X}_moy:float(mean(q${X}_L));
q${X}_var:float(sum((q${X}_L[i]-q${X}_moy)^2,i,1,q${X}_n)/q${X}_n);
q${X}_ta:1.0*round(sqrt(q${X}_var)*100)/100;`;
        qnote = `L={@q${X}_L@}, sigma={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer l'\xe9cart-type de la s\xe9rie :</p>${serieHTML(5)}
<p>\\(\\sigma=\\) [[input:ans_std${X}]] [[validation:ans_std${X}]]</p>
<p><em>Donner le r\xe9sultat arrondi \xe0 deux d\xe9cimales.</em></p>`;
        inputXML = _mkInput({name:`ans_std${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('\xc9cart-type correct ?', 'NumAbsolute', `ans_std${X}`, `q${X}_ta`, '0.015',
            fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(\\sigma=\\sqrt{\\frac{\\sum(${varName}_i-\\bar{${varName}})^2}{n}}={@q${X}_ta@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\bar{${varName}}={@q${X}_moy@}\\), \\(\\sigma^2={@q${X}_var@}\\), \\(\\sigma={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'etendue') {
        vars = `/* Q${X} Stats — \xc9tendue */
ri(a,b):=a+rand(b-a+1);
q${X}_L:${wrapOpen}sort([ri(10,20)${frac},ri(20,30)${frac},ri(30,40)${frac},ri(40,50)${frac},ri(50,60)${frac},ri(60,70)${frac}])${wrapClose};
q${X}_ta_max:last(q${X}_L);
q${X}_ta_min:first(q${X}_L);
q${X}_ta:1.0*round((q${X}_ta_max-q${X}_ta_min)*100)/100;`;
        qnote = `L={@q${X}_L@}, etendue={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer l'\xe9tendue de la s\xe9rie :</p>${serieHTML(6)}
<p>\xc9tendue = [[input:ans_et${X}]] [[validation:ans_et${X}]]</p>`;
        inputXML = _mkInput({name:`ans_et${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('\xc9tendue correcte ?', 'NumAbsolute', `ans_et${X}`, `q${X}_ta`, '0.015',
            fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \xc9tendue = max - min = {@q${X}_ta_max@} - {@q${X}_ta_min@} = {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\xc9tendue = max - min = {@q${X}_ta_max@} - {@q${X}_ta_min@} = {@q${X}_ta@}.</div>`;

    } else if (scenario === 'moyenne') {
        vars = `/* Q${X} Stats — Moyenne */
ri(a,b):=a+rand(b-a+1);
q${X}_L:${wrapOpen}[ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac},ri(10,19)${frac}]${wrapClose};
q${X}_ta:1.0*round(float(mean(q${X}_L))*100)/100;`;
        qnote = `L={@q${X}_L@}, moy={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer la moyenne de la s\xe9rie :</p>${serieHTML(6)}
<p>\\(\\bar{${varName}}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`;
        inputXML = _mkInput({name:`ans_moy${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('Moyenne correcte ?', 'NumAbsolute', `ans_moy${X}`, `q${X}_ta`, '0.015',
            fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(\\bar{${varName}}=\\frac{\\sum ${varName}_i}{n}={@q${X}_ta@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\bar{${varName}}={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'variance') {
        vars = `/* Q${X} Stats — Variance */
ri(a,b):=a+rand(b-a+1);
q${X}_L:${wrapOpen}[ri(1,10)${frac},ri(1,10)${frac},ri(1,10)${frac},ri(1,10)${frac},ri(1,10)${frac}]${wrapClose};
q${X}_n:length(q${X}_L);
q${X}_moy:float(mean(q${X}_L));
q${X}_ta:1.00*round(float(sum((q${X}_L[i]-q${X}_moy)^2,i,1,q${X}_n)/q${X}_n)*100)/100;`;
        qnote = `L={@q${X}_L@}, var={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer la variance de la s\xe9rie :</p>${serieHTML(5)}
<p>\\(V=\\) [[input:ans_var${X}]] [[validation:ans_var${X}]]</p>`;
        inputXML = _mkInput({name:`ans_var${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('Variance correcte ?', 'NumAbsolute', `ans_var${X}`, `q${X}_ta`, '0.015',
            fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(V=\\frac{\\sum(${varName}_i-\\bar{${varName}})^2}{n}={@q${X}_ta@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\bar{${varName}}={@q${X}_moy@}\\), \\(V={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'quartile-q1') {
        vars = `/* Q${X} Stats — Quartile Q1 */
ri(a,b):=a+rand(b-a+1);
q${X}_L:${wrapOpen}sort([ri(5,15)${frac},ri(15,25)${frac},ri(25,35)${frac},ri(35,45)${frac},ri(45,55)${frac},ri(55,65)${frac},ri(65,75)${frac},ri(75,85)${frac}])${wrapClose};
q${X}_n:length(q${X}_L);
q${X}_pos:q${X}_n/4;
q${X}_ta:1.0*q${X}_L[q${X}_pos];`;
        qnote = `L={@q${X}_L@}, Q1={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer le premier quartile Q1 de la s\xe9rie (n=8) :</p>${serieHTML(8)}
<p>\\(Q_1=\\) [[input:ans_q1${X}]] [[validation:ans_q1${X}]]</p>`;
        inputXML = _mkInput({name:`ans_q1${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('Q1 correct ?', 'NumAbsolute', `ans_q1${X}`, `q${X}_ta`, '0.005',
            fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ Q1 est la valeur de rang n/4={@q${X}_pos@} dans la s\xe9rie tri\xe9e : Q1={@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>S\xe9rie tri\xe9e, rang n/4={@q${X}_pos@} : \\(Q_1={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'quartile-q3') {
        vars = `/* Q${X} Stats — Quartile Q3 */
ri(a,b):=a+rand(b-a+1);
q${X}_L:${wrapOpen}sort([ri(5,15)${frac},ri(15,25)${frac},ri(25,35)${frac},ri(35,45)${frac},ri(45,55)${frac},ri(55,65)${frac},ri(65,75)${frac},ri(75,85)${frac}])${wrapClose};
q${X}_n:length(q${X}_L);
q${X}_pos:3*q${X}_n/4;
q${X}_ta:1.0*q${X}_L[q${X}_pos];`;
        qnote = `L={@q${X}_L@}, Q3={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer le troisi\xe8me quartile Q3 de la s\xe9rie (n=8) :</p>${serieHTML(8)}
<p>\\(Q_3=\\) [[input:ans_q3${X}]] [[validation:ans_q3${X}]]</p>`;
        inputXML = _mkInput({name:`ans_q3${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('Q3 correct ?', 'NumAbsolute', `ans_q3${X}`, `q${X}_ta`, '0.005',
            fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ Q3 est la valeur de rang 3n/4={@q${X}_pos@} : Q3={@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>Rang 3n/4={@q${X}_pos@} : \\(Q_3={@q${X}_ta@}\\).</div>`;

    } else { /* moyenne-ponderee */
        vars = `/* Q${X} Stats — Moyenne pond\xe9r\xe9e */
ri(a,b):=a+rand(b-a+1);
q${X}_v1:${wrapOpen}ri(10,15)${frac}${wrapClose};q${X}_v2:${wrapOpen}ri(15,20)${frac}${wrapClose};q${X}_v3:${wrapOpen}ri(20,25)${frac}${wrapClose};
q${X}_e1:ri(20,35);q${X}_e2:ri(20,35);q${X}_e3:ri(20,35);
q${X}_N:q${X}_e1+q${X}_e2+q${X}_e3;
q${X}_S:q${X}_v1*q${X}_e1+q${X}_v2*q${X}_e2+q${X}_v3*q${X}_e3;
q${X}_ta:1.0*round(float(q${X}_S/q${X}_N)*10)/10;`;
        qnote = `moy pond={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer la moyenne pond\xe9r\xe9e :</p>
<table style="border-collapse:collapse;margin:10px 0;"><tr style="background:#e2e8f0;"><th style="padding:6px 12px;border:1px solid #cbd5e1;">Valeur</th><th style="padding:6px 12px;border:1px solid #cbd5e1;">Effectif</th></tr>
<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_v1@}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_e1@}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_v2@}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_e2@}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_v3@}</td><td style="padding:6px 12px;border:1px solid #cbd5e1;">{@q${X}_e3@}</td></tr></table>
<p>\\(\\bar{${varName}}=\\) [[input:ans_moy${X}]] [[validation:ans_moy${X}]]</p>`;
        inputXML = _mkInput({name:`ans_moy${X}`,tans:`q${X}_ta`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:2});
        canonicalNodes = [statNode('Moyenne pond\xe9r\xe9e correcte ?', 'NumAbsolute', `ans_moy${X}`, `q${X}_ta`, '0.05',
            fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(\\bar{${varName}}=\\frac{\\sum n_i ${varName}_i}{\\sum n_i}={@q${X}_ta@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\bar{${varName}}=\\frac{{@q${X}_S@}}{{@q${X}_N@}}={@q${X}_ta@}\\).</div>`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    prtXML = buildPrtXml(prtMeta, canonicalNodes);

    generalFeedback = _mkFbGen(generalFeedback, gs('stat-fbgen'));

    return {type:'statistiques', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`};
}

// ─── MATRICES ────────────────────────────────────────────────

