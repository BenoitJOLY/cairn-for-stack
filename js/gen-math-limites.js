function genLimites(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('lim-bareme')) || 1;
    var scenario = gs('lim-scenario') || 'plus-inf';
    var mode = (document.querySelector('input[name="lim-mode-r"]:checked')||{}).value || gs('lim-mode') || 'aleatoire';
    var fbOk = gs('lim-fb-ok').trim(), fbWrong = gs('lim-fb-wrong').trim();
    var custText = gs('lim-text').trim();
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes;

    var HDR = `<div style="background:#0ea5e9;border-left:5px solid #0284c7;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Limites</strong> <span style="background:#0284c7;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    function limNode(falseFb) {
        return {
            name: '0', description: 'Limite correcte ?', answertest: 'AlgEquiv', sans: `ans_lim${X}`, tans: `q${X}_ta`,
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
            trueanswernote: 'PRT-'+X+'-OK', truefeedback: fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
            falseanswernote: 'PRT-'+X+'-NOK', falsefeedback: fbWrong || falseFb
        };
    }

    if (mode === 'fixe') {
        var expr = gs('lim-expr').trim() || 'x';
        var tans = gs('lim-tans').trim() || '0';
        var point = gs('lim-point').trim() || '1';
        var limLabelTex = { 'plus-inf': '\\lim_{x\\to+\\infty}', 'moins-inf': '\\lim_{x\\to-\\infty}',
            'point-fini': `\\lim_{x\\to${point}}`, 'droite-racine': `\\lim_{x\\to${point}^+}`, 'gauche-racine': `\\lim_{x\\to${point}^-}` }[scenario] || '\\lim_{x\\to+\\infty}';
        vars = `/* Q${X} Limites — Fixe */
q${X}_ta:${tans};`;
        qnote = `lim=${tans}`;
        textFrag = `${HDR}${custText}<p>Calculer la limite :</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle${limLabelTex} ${expr.replace(/\*/g,'')} \\)</div>
<p>R\xe9ponse : [[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>Taper <code>inf</code> pour \\(+\\infty\\) ou <code>-inf</code> pour \\(-\\infty\\).</em></p>`;
        inputXML = _mkInput({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:15,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>M\xe9thode</strong> : essayer d'abord la substitution directe. Si on obtient une forme ind\xe9termin\xe9e (0/0, ∞/∞, ∞−∞...), factoriser ou simplifier l'expression avant de reprendre la limite.<br>R\xe9ponse attendue : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>La limite demand\xe9e vaut {@q${X}_ta@}. V\xe9rifier la substitution directe, et en cas de forme ind\xe9termin\xe9e, factoriser/simplifier avant de conclure.</div>`;

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
        textFrag = `${HDR}${custText}<p>Calculer la limite :</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to+\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}} \\)</div>
<p>R\xe9ponse : [[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>Taper <code>inf</code> pour \\(+\\infty\\).</em></p>`;
        inputXML = _mkInput({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:15,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>M\xe9thode</strong> : pour une limite en \\(+\\infty\\) d'un quotient de polyn\xf4mes, on compare les degr\xe9s du num\xe9rateur et du d\xe9nominateur (\xe9quivalent \xe0 mettre en facteur la puissance dominante des deux c\xf4t\xe9s).<br>Ici, le num\xe9rateur \\({@q${X}_num@}\\) est de degr\xe9 {@q${X}_degn@} (coefficient dominant {@q${X}_lcn@}), et le d\xe9nominateur \\({@q${X}_den@}\\) est de degr\xe9 {@q${X}_degd@} (coefficient dominant {@q${X}_lcd@}).<br>• deg(num) &lt; deg(den) &rarr; limite 0.<br>• deg(num) = deg(den) &rarr; limite = rapport des coefficients dominants.<br>• deg(num) &gt; deg(den) &rarr; limite infinie.<br>Conclusion : la limite vaut {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\displaystyle\\lim_{x\\to+\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}}\\) : num\xe9rateur de degr\xe9 {@q${X}_degn@} (coefficient dominant {@q${X}_lcn@}), d\xe9nominateur de degr\xe9 {@q${X}_degd@} (coefficient dominant {@q${X}_lcd@}).<br>\\(\\lim_{x\\to+\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}}={@q${X}_ta@}\\).</div>`;

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
        textFrag = `${HDR}${custText}<p>Calculer la limite :</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to-\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}} \\)</div>
<p>R\xe9ponse : [[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>Taper <code>-inf</code> pour \\(-\\infty\\).</em></p>`;
        inputXML = _mkInput({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:15,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>M\xe9thode</strong> : pour une limite en \\(-\\infty\\) d'un quotient de polyn\xf4mes, on compare les degr\xe9s du num\xe9rateur et du d\xe9nominateur.<br>Ici, le num\xe9rateur \\({@q${X}_num@}\\) est de degr\xe9 {@q${X}_degn@} (coefficient dominant {@q${X}_lcn@}), et le d\xe9nominateur \\({@q${X}_den@}\\) est de degr\xe9 {@q${X}_degd@} (coefficient dominant {@q${X}_lcd@}).<br>• deg(num) &lt; deg(den) &rarr; limite 0.<br>• deg(num) = deg(den) &rarr; limite = rapport des coefficients dominants.<br>• deg(num) &gt; deg(den) &rarr; limite infinie (attention au signe en \\(-\\infty\\)).<br>Conclusion : la limite vaut {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\displaystyle\\lim_{x\\to-\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}}\\) : num\xe9rateur de degr\xe9 {@q${X}_degn@} (coefficient dominant {@q${X}_lcn@}), d\xe9nominateur de degr\xe9 {@q${X}_degd@} (coefficient dominant {@q${X}_lcd@}).<br>\\(\\lim_{x\\to-\\infty}\\frac{{@q${X}_num@}}{{@q${X}_den@}}={@q${X}_ta@}\\).</div>`;

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
        textFrag = `${HDR}${custText}<p>Calculer (en levant l'ind\xe9termination) :</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to{@q${X}_a@}}\\frac{{@q${X}_num@}}{{@q${X}_den@}} \\)</div>
<p>R\xe9ponse : [[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>`;
        inputXML = _mkInput({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>M\xe9thode</strong> : num\xe9rateur et d\xe9nominateur s'annulent tous les deux en \\(x={@q${X}_a@}\\) (forme ind\xe9termin\xe9e 0/0). On factorise \\((x-{@q${X}_a@})\\) au num\xe9rateur : \\({@q${X}_num@}=(x-{@q${X}_a@})({@q${X}_Q@})\\).<br>On simplifie avec le facteur identique au d\xe9nominateur : \\(\\frac{(x-{@q${X}_a@})({@q${X}_Q@})}{x-{@q${X}_a@}}={@q${X}_Q@}\\).<br>Il reste \xe0 \xe9valuer en \\(x={@q${X}_a@}\\) : {@q${X}_ta@}.</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>Factoriser \\((x-{@q${X}_a@})\\) au num\xe9rateur (\\({@q${X}_num@}=(x-{@q${X}_a@})({@q${X}_Q@})\\)), puis simplifier avec le d\xe9nominateur : il reste \\({@q${X}_Q@}\\).<br>\xc9valuer en \\(x={@q${X}_a@}\\) donne \\(\\lim={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'droite-racine') {
        vars = `/* Q${X} Limites — Limite \xe0 droite (racine) */
ri(a,b):=a+rand(b-a+1);
q${X}_r_a:rand(5);
q${X}_as:[2,3,-1,-2,4];
q${X}_a:q${X}_as[q${X}_r_a+1];
q${X}_ta:inf;`;
        qnote = `lim x->{@q${X}_a@}+ sqrt(x-{@q${X}_a@})/(x-{@q${X}_a@})=inf`;
        textFrag = `${HDR}${custText}<p>Calculer la limite \xe0 droite :</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to{@q${X}_a@}^+}\\frac{\\sqrt{x-{@q${X}_a@}}}{x-{@q${X}_a@}} \\)</div>
<p>R\xe9ponse : [[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>Taper <code>inf</code> pour \\(+\\infty\\).</em></p>`;
        inputXML = _mkInput({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:10,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>M\xe9thode</strong> : on pose le changement de variable \\(u=x-{@q${X}_a@}\\) ; quand \\(x\\to{@q${X}_a@}^+\\), on a \\(u\\to 0^+\\) (u reste positif).<br>L'expression devient \\(\\frac{\\sqrt{u}}{u}=\\frac{1}{\\sqrt{u}}\\).<br>Quand \\(u\\to 0^+\\), \\(\\sqrt{u}\\to 0^+\\) donc \\(\\frac{1}{\\sqrt{u}}\\to+\\infty\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>Poser \\(u=x-{@q${X}_a@}\\to 0^+\\) : l'expression devient \\(\\frac{\\sqrt{u}}{u}=\\frac{1}{\\sqrt{u}}\\to+\\infty\\).</div>`;

    } else { /* gauche-racine */
        vars = `/* Q${X} Limites — Limite \xe0 gauche (racine) */
ri(a,b):=a+rand(b-a+1);
q${X}_r_a:rand(5);
q${X}_as:[2,3,-1,-2,4];
q${X}_a:q${X}_as[q${X}_r_a+1];
q${X}_ta:-inf;`;
        qnote = `lim x->{@q${X}_a@}- sqrt({@q${X}_a@}-x)/(x-{@q${X}_a@})=-inf`;
        textFrag = `${HDR}${custText}<p>Calculer la limite \xe0 gauche :</p>
<div style="text-align:center;margin:15px 0;">\\( \\displaystyle\\lim_{x\\to{@q${X}_a@}^-}\\frac{\\sqrt{{@q${X}_a@}-x}}{x-{@q${X}_a@}} \\)</div>
<p>R\xe9ponse : [[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>
<p><em>Taper <code>-inf</code> pour \\(-\\infty\\).</em></p>`;
        inputXML = _mkInput({name:`ans_lim${X}`,tans:`q${X}_ta`,boxsize:10,allowwords:'inf',forbidfloat:1,mustverify:0,showvalidation:2});
        canonicalNodes = [limNode(`<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>M\xe9thode</strong> : on pose \\(u={@q${X}_a@}-x\\) ; quand \\(x\\to{@q${X}_a@}^-\\), on a \\(u\\to 0^+\\), et \\(x-{@q${X}_a@}=-u\\).<br>L'expression devient \\(\\frac{\\sqrt{u}}{-u}=-\\frac{1}{\\sqrt{u}}\\).<br>Quand \\(u\\to 0^+\\), \\(\\frac{1}{\\sqrt{u}}\\to+\\infty\\), donc l'expression tend vers \\(-\\infty\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>Poser \\(u={@q${X}_a@}-x\\to 0^+\\), avec \\(x-{@q${X}_a@}=-u\\) : l'expression devient \\(\\frac{\\sqrt{u}}{-u}=-\\frac{1}{\\sqrt{u}}\\to-\\infty\\).</div>`;
    }

    generalFeedback = _mkFbGen(generalFeedback, gs('lim-fbgen'));

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    prtXML = buildPrtXml(prtMeta, canonicalNodes);

    return {type:'limites', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: []};
}

// ─── PHYSIQUE (stub) ─────────────────────────────────────────

