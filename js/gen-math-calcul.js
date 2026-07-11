function genCalcul(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('calc-bareme')) || 1;
    var scenario = gs('calc-scenario') || 'derivee-produit';
    var exprF = (gs('calc-expr') || 'x^2 + sin(x)').trim();
    var boundA = (gs('calc-a') || '0').trim();
    var boundB = (gs('calc-b') || '1').trim();
    var fbOk    = gs('calc-fb-ok').trim();
    var fbWrong = gs('calc-fb-wrong').trim();
    var custText = gs('calc-text').trim();
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

    var HDR = `<div style="background:#475569;border-left:5px solid #334155;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Calcul diff\xe9rentiel</strong> <span style="background:#334155;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'derivee') {
        vars = `/* Q${X} Calcul — D\xe9riv\xe9e (expression libre) */
q${X}_f:(${exprF});
q${X}_fp:diff(q${X}_f,x);`;
        qnote = `f={@q${X}_f@}, f'={@q${X}_fp@}`;
        textFrag = `${HDR}${custText}${`<p>Soit \\(f\\) d\xe9finie par \\(f(x)={@q${X}_f@}\\). Calculer \\(f'(x)\\).</p>`}
<p>\\(f'(x)=\\) [[input:ans_fp${X}]] [[validation:ans_fp${X}]]</p>`;
        inputXML = _mkInput({name:`ans_fp${X}`,tans:`q${X}_fp`,boxsize:30,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [calcNode(0, 'D\xe9riv\xe9e correcte ?', 'AlgEquiv', `ans_fp${X}`, `q${X}_fp`, '',
            '=', 1, -1, 'PRT-'+X+'-OK', fbOk || '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>',
            '=', 0, -1, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(f'(x)={@q${X}_fp@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(f(x)={@q${X}_f@}\\)<br>\\(f'(x)={@q${X}_fp@}\\).</div>`;

    } else if (scenario === 'primitive') {
        vars = `/* Q${X} Calcul — Primitive (expression libre) */
q${X}_f:(${exprF});
q${X}_F:integrate(q${X}_f,x);`;
        qnote = `f={@q${X}_f@}, F={@q${X}_F@}+k`;
        textFrag = `${HDR}${custText}${`<p>D\xe9terminer une primitive \\(F\\) de \\(f(x)={@q${X}_f@}\\).</p>`}
<p>\\(F(x)=\\) [[input:ans_F${X}]] [[validation:ans_F${X}]]</p>`;
        inputXML = _mkInput({name:`ans_F${X}`,tans:`q${X}_F`,boxsize:30,allowwords:'k',mustverify:1,showvalidation:2});
        fbVars = `q${X}_diff:diff(ans_F${X},x);`;
        canonicalNodes = [calcNode(0, "F'=f ?", 'AlgEquiv', `q${X}_diff`, `q${X}_f`, '',
            '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong> \\(F'(x)=f(x)\\).</div>`,
            '=', 0, -1, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(F'(x)={@q${X}_diff@}\\neq f(x)\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(f(x)={@q${X}_f@}\\)<br>\\(F(x)={@q${X}_F@}+k\\).</div>`;

    } else if (scenario === 'integrale') {
        vars = `/* Q${X} Calcul — Int\xe9grale d\xe9finie (expression libre) */
q${X}_f:(${exprF});
q${X}_a:(${boundA});
q${X}_b:(${boundB});
q${X}_ta:integrate(q${X}_f,x,q${X}_a,q${X}_b);`;
        qnote = `∫ [{@q${X}_a@};{@q${X}_b@}] {@q${X}_f@} dx = {@q${X}_ta@}`;
        textFrag = `${HDR}${custText}${`<p>Calculer : \\( \\displaystyle\\int_{{@q${X}_a@}}^{{@q${X}_b@}} {@q${X}_f@}\\,dx \\)</p>`}
<p>R\xe9ponse : [[input:ans_I${X}]] [[validation:ans_I${X}]]</p>`;
        inputXML = _mkInput({name:`ans_I${X}`,tans:`q${X}_ta`,boxsize:20,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [calcNode(0, 'Correct ?', 'AlgEquiv', `ans_I${X}`, `q${X}_ta`, '',
            '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Correct !</strong></div>`,
            '=', 0, -1, 'PRT-'+X+'-NOK', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ Primitiver puis calculer \\(F(b)-F(a)={@q${X}_ta@}\\).</div>`)];
        generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>\\(\\displaystyle\\int_{{@q${X}_a@}}^{{@q${X}_b@}}{@q${X}_f@}\\,dx={@q${X}_ta@}\\).</div>`;

    } else if (scenario === 'derivee-produit') {
        vars = `/* Q${X} Calcul — D\xe9riv\xe9e d'un produit */
q${X}_a:${_calcVarValue('a')}$ q${X}_b:${_calcVarValue('b')}$
q${X}_u:q${X}_a*x+q${X}_b$ q${X}_du:q${X}_a$ q${X}_v:%e^x$ q${X}_dv:%e^x$
q${X}_f:q${X}_u*q${X}_v$ q${X}_fp:diff(q${X}_f,x)$ q${X}_fp_simpl:ev(q${X}_fp,simp)$
q${X}_err_oublie_poly:q${X}_u*q${X}_dv$
q${X}_err_oublie_exp:q${X}_du*q${X}_v$
q${X}_err_produit:q${X}_du*q${X}_dv$
q${X}_err_plus:(q${X}_u+q${X}_v)*(q${X}_du+q${X}_dv)$`;
        qnote = `f(x)=({@q${X}_u@})e^x, f'={@q${X}_fp_simpl@}`;
        textFrag = `${HDR}${custText}${`<p>Soit \\(f\\) la fonction d\xe9finie sur \\(\\mathbb{R}\\) par :<br><br></p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">\\( f(x) = ({@q${X}_u@}) \\cdot e^x \\)</div>
<p>Calculer la fonction d\xe9riv\xe9e \\(f'\\) de \\(f\\).<br><br></p>`}
<div>\\(f'(x) = \\) [[input:ans_fp${X}]] [[validation:ans_fp${X}]]</div>`;
        inputXML = _mkInput({name:`ans_fp${X}`,tans:`q${X}_fp`,boxsize:30,checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification de la d\xe9riv\xe9e', 'AlgEquiv', `ans_fp${X}`, `q${X}_fp`, '',
                '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> La d\xe9riv\xe9e d'un produit est bien la somme des deux "d\xe9riv\xe9es partielles" : \\(u'v + uv'\\).</div>`,
                '=', 0, 1, 'PRT-'+X+'-NOK', ''),
            calcNode(1, 'Erreur : Oubli d\xe9riv\xe9e polyn\xf4me', 'AlgEquiv', `ans_fp${X}`, `q${X}_err_oublie_poly`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-POLY', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>Erreur de formule !</strong> Vous avez \xe9crit {@q${X}_u@} \\(\\times e^x\\). Vous avez d\xe9riv\xe9 \\(e^x\\), mais vous avez <strong>oubli\xe9 de d\xe9river le polyn\xf4me {@q${X}_u@}</strong>. Appliquez bien \\((uv)' = u'v + uv'\\).</div>`,
                '=', 0, 2, 'PRT-'+X+'-ERR-AUTRE', ''),
            calcNode(2, 'Erreur : Oubli d\xe9riv\xe9e exponentielle', 'AlgEquiv', `ans_fp${X}`, `q${X}_err_oublie_exp`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-EXP', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>Erreur de formule !</strong> Vous avez \xe9crit {@q${X}_du@} \\(\\times e^x\\). Vous avez d\xe9riv\xe9 le polyn\xf4me, mais vous avez <strong>oubli\xe9 de d\xe9river \\(e^x\\)</strong> (qui se d\xe9rive en lui-m\xeame). Appliquez bien \\((uv)' = u'v + uv'\\).</div>`,
                '=', 0, 3, 'PRT-'+X+'-ERR-AUTRE2', ''),
            calcNode(3, 'Erreur : Multiplication des d\xe9riv\xe9es', 'AlgEquiv', `ans_fp${X}`, `q${X}_err_produit`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-PROD', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Grosse erreur de formule !</strong> Vous avez calcul\xe9 \\(u' \\times v'\\) (la multiplication des d\xe9riv\xe9es). La formule du produit est une <strong>SOMME</strong> : \\((uv)' = u'v + uv'\\).</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Incorrect.</strong> Revoyez la formule de d\xe9rivation d'un produit : \\((uv)' = u'v + uv'\\). N'oubliez pas les parenth\xe8ses si n\xe9cessaire.</div>`)
        ];
        diagNodes = [1,2,3].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].truefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction d\xe9taill\xe9e</div>
<div style="font-size:.9rem;">On utilise la formule de la d\xe9riv\xe9e d'un produit : \\((uv)' = u'v + uv'\\).<br><br>Ici, on pose \\(u(x) = {@q${X}_u@}\\) donc \\(u'(x) = {@q${X}_du@}\\).<br>Et \\(v(x) = e^x\\) donc \\(v'(x) = e^x\\).<br><br>\\(f'(x) = {@q${X}_du@} \\cdot e^x + ({@q${X}_u@}) \\cdot e^x\\)<br>\\(f'(x) = ({@q${X}_du@} + {@q${X}_u@})e^x = {@q${X}_fp_simpl@}\\)</div>
</div>`;

    } else if (scenario === 'primitive-exp') {
        vars = `/* Q${X} Calcul — Primitive exponentielle */
q${X}_a:${_calcVarValue('a')}$ q${X}_b:${_calcVarValue('b')}$ q${X}_c:${_calcVarValue('c')}$
q${X}_f:q${X}_b*%e^(q${X}_a*x)+q${X}_c$
q${X}_ta_sans_k:(q${X}_b/q${X}_a)*%e^(q${X}_a*x)+q${X}_c*x$
q${X}_err_coef:q${X}_b*%e^(q${X}_a*x)+q${X}_c*x$`;
        qnote = `f={@q${X}_f@}, F={@q${X}_ta_sans_k@}+k`;
        textFrag = `${HDR}${custText}${`<p>Soit \\(f\\) la fonction d\xe9finie sur \\(\\mathbb{R}\\) par :<br><br></p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">\\( f(x) = {@q${X}_f@} \\)</div>
<p>D\xe9terminer <strong>une</strong> primitive \\(F\\) de la fonction \\(f\\) sur \\(\\mathbb{R}\\).<br><em>(On n'oubliera pas la constante d'int\xe9gration, par exemple + k).</em><br><br></p>`}
<div>\\(F(x) = \\) [[input:ans_F${X}]] [[validation:ans_F${X}]]</div>`;
        inputXML = _mkInput({name:`ans_F${X}`,tans:`q${X}_ta_sans_k+k`,boxsize:30,checkanswertype:1,allowwords:'k',hint:`utilisez exp() pour l'exponentielle`,mustverify:1,showvalidation:2});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification par d\xe9rivation', 'AlgEquiv', `diff(ans_F${X},x)`, `q${X}_f`, '',
                '=', 1, -1, 'PRT-'+X+'-DIFF-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Si on d\xe9rive votre expression, on retombe bien sur \\(f(x)\\). Vous avez trouv\xe9 une primitive correcte.</div>`,
                '=', 0, 1, 'PRT-'+X+'-DIFF-NOK', ''),
            calcNode(1, 'D\xe9tection oubli de la constante', 'AlgEquiv', `ans_F${X}`, `q${X}_ta_sans_k`, '',
                '=', 0.5, -1, 'PRT-'+X+'-ERR-K', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>Presque !</strong> Votre forme ressemble \xe0 la primitive sans la constante, mais il y a une erreur de calcul dedans. De plus, n'oubliez pas le "+ k".</div>`,
                '=', 0, 2, 'PRT-'+X+'-ERR-AUTRE', ''),
            calcNode(2, 'D\xe9tection erreur de coefficient exp', 'AlgEquiv', `ans_F${X}`, `q${X}_err_coef`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-COEF', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Erreur de coefficient !</strong> Vous avez \xe9crit {@q${X}_b@}×\\(e^{{@q${X}_a@}x}\\) au lieu de diviser par {@q${X}_a@}. Retenez : \\(\\int e^{kx} dx = \\frac{1}{k}e^{kx}\\).</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Incorrect.</strong> V\xe9rifiez vos formules de primitives. \\(\\int e^{ax} dx \\neq e^{ax}\\) (il faut diviser par \\(a\\)). N'oubliez pas la constante.</div>`)
        ];
        diagNodes = [1,2].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].truefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction d\xe9taill\xe9e</div>
<div style="font-size:.9rem;">On d\xe9compose la fonction pour trouver les primitives de chaque terme :<br><br>- Pour {@q${X}_b@}×\\(e^{{@q${X}_a@}x}\\), on sait que \\(\\int e^{kx} dx = \\frac{1}{k}e^{kx}\\). Donc la primitive est \\(\\frac{{@q${X}_b@}}{{@q${X}_a@}}e^{{@q${X}_a@}x}\\).<br>- Pour {@q${X}_c@}, une primitive est {@q${X}_c@}×\\(x\\).<br><br>Une primitive de \\(f\\) est donc :<br>\\(F(x) = \\frac{{@q${X}_b@}}{{@q${X}_a@}}e^{{@q${X}_a@}x} + {@q${X}_c@}x + k\\) (avec \\(k \\in \\mathbb{R}\\))</div>
</div>`;

    } else if (scenario === 'integrale-def') {
        vars = `/* Q${X} Calcul — Int\xe9grale d\xe9finie */
q${X}_d:${_calcVarValue('d')}$ q${X}_c:${_calcVarValue('c')}$ q${X}_f:${_calcVarValue('f')}$ q${X}_a:0$ q${X}_b:1$
q${X}_fx:q${X}_c*%e^(q${X}_d*x)+q${X}_f$ q${X}_Fx:(q${X}_c/q${X}_d)*%e^(q${X}_d*x)+q${X}_f*x$
q${X}_ta_I:ev(q${X}_Fx,x=q${X}_b)-ev(q${X}_Fx,x=q${X}_a)$
q${X}_err_primitive:q${X}_Fx$
q${X}_err_no_x:(q${X}_c/q${X}_d)*(%e^(q${X}_d*q${X}_b)-%e^(q${X}_d*q${X}_a))$
q${X}_err_coef:q${X}_c*(%e^(q${X}_d*q${X}_b)-%e^(q${X}_d*q${X}_a))+q${X}_f$`;
        qnote = `I = int({@q${X}_fx@}, {@q${X}_a@}, {@q${X}_b@}) = {@q${X}_ta_I@}`;
        textFrag = `${HDR}${custText}${`<p>Calculer la valeur exacte de l'int\xe9grale suivante :<br><br></p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;text-align:center;font-size:1.3rem;margin-bottom:15px;">\\( I = \\int_{{@q${X}_a@}}^{{@q${X}_b@}} \\left( {@q${X}_fx@} \\right) dx \\)</div>
<p><em>(On donnera le r\xe9sultat exact, en utilisant exp() pour \\(e\\)).</em><br><br></p>`}
<div>\\(I = \\) [[input:ans_I${X}]] [[validation:ans_I${X}]]</div>`;
        inputXML = _mkInput({name:`ans_I${X}`,tans:`q${X}_ta_I`,boxsize:30,hint:`utilisez exp() pour l'exponentielle`,showvalidation:0});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification r\xe9sultat final', 'AlgEquiv', `ans_I${X}`, `q${X}_ta_I`, '',
                '=', 1, -1, 'PRT-'+X+'-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Le calcul de la primitive et son \xe9valuation entre les bornes sont exacts.</div>`,
                '=', 0, 1, 'PRT-'+X+'-NOK', ''),
            calcNode(1, 'Erreur : A donn\xe9 la primitive', 'AlgEquiv', `ans_I${X}`, `q${X}_err_primitive`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-PRIM', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>Non termin\xe9 !</strong> Vous avez donn\xe9 la forme de la primitive \\(F(x)\\), mais on demande le <strong>r\xe9sultat du calcul</strong> de l'int\xe9grale. Il faut calculer \\(F({@q${X}_b@}) - F({@q${X}_a@})\\).</div>`,
                '=', 0, 2, 'PRT-'+X+'-ERR-AUTRE', ''),
            calcNode(2, 'Erreur : Oubli du terme f x', 'AlgEquiv', `ans_I${X}`, `q${X}_err_no_x`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-CST', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Oubli d'un terme !</strong> Vous avez correctement int\xe9gr\xe9 l'exponentielle, mais vous avez oubli\xe9 que la primitive de {@q${X}_f@} est {@q${X}_f@}×\\(x\\). Il manque ce terme dans votre \xe9valuation finale.</div>`,
                '=', 0, 3, 'PRT-'+X+'-ERR-AUTRE2', ''),
            calcNode(3, 'Erreur : Coefficient exponentielle', 'AlgEquiv', `ans_I${X}`, `q${X}_err_coef`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-COEF', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Erreur de coefficient !</strong> Sur l'exponentielle, vous avez int\xe9gr\xe9 {@q${X}_c@}×\\(e^{{@q${X}_d@}x}\\) en {@q${X}_c@}×\\(e^{{@q${X}_d@}x}\\). Il faut diviser par {@q${X}_d@} : \\(\\frac{{@q${X}_c@}}{{@q${X}_d@}}e^{{@q${X}_d@}x}\\).</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Incorrect.</strong> Le calcul est faux. \xc9tape 1 : trouvez la primitive \\(F(x)\\). \xc9tape 2 : calculez pr\xe9cis\xe9ment \\(F({@q${X}_b@}) - F({@q${X}_a@})\\) sans faire d'erreur de signe avec les nombres n\xe9gatifs.</div>`)
        ];
        diagNodes = [1,2,3].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].truefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction d\xe9taill\xe9e</div>
<div style="font-size:.9rem;">Une primitive de {@q${X}_fx@} est :<br>\\(F(x) = \\frac{{@q${X}_c@}}{{@q${X}_d@}}e^{{@q${X}_d@}x} + {@q${X}_f@}x\\)<br><br>On \xe9value entre {@q${X}_a@} et {@q${X}_b@} :<br>\\(I = F({@q${X}_b@}) - F({@q${X}_a@})\\)<br>\\(I = \\left( \\frac{{@q${X}_c@}}{{@q${X}_d@}}e^{{@q${X}_d@}\\times {@q${X}_b@}} + {@q${X}_f@}\\times {@q${X}_b@} \\right) - \\left( \\frac{{@q${X}_c@}}{{@q${X}_d@}}e^{{@q${X}_d@}\\times {@q${X}_a@}} + {@q${X}_f@}\\times {@q${X}_a@} \\right)\\)<br><br>\\(I = {@q${X}_ta_I@}\\)</div>
</div>`;

    } else if (scenario === 'encadrement-tvi') {
        vars = `/* Q${X} Calcul — Encadrement TVI / Dichotomie */
q${X}_b:${_calcVarValue('b')}$
q${X}_alpha:1+q${X}_b/10$
q${X}_k:float(exp(q${X}_alpha)-q${X}_alpha)$
q${X}_f:exp(x)-x-q${X}_k$
q${X}_f1:float(ev(q${X}_f,x=1))$
q${X}_f2:float(ev(q${X}_f,x=2))$
q${X}_alpha_inf:float(q${X}_alpha-0.01)$
q${X}_alpha_sup:float(q${X}_alpha+0.01)$`;
        qnote = `f(x)=e^x-x-{@q${X}_k@}, alpha={@q${X}_alpha@}`;
        textFrag = `${HDR}${custText}${`<p>On considère la fonction \\(f\\) définie sur \\(\\mathbb{R}\\) par :<br><br></p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">\\( f(x) = e^x - x - {@q${X}_k@} \\)</div>
<p><strong>1.</strong> À l'aide de la calculatrice, compléter les valeurs suivantes (arrondies à \\(10^{-3}\\)) :</p>
<div style="display:flex;gap:20px;margin:10px 0 15px 0;">
<div>\\(f(1) \\approx\\) [[input:ans_f1${X}]]</div>
<div>\\(f(2) \\approx\\) [[input:ans_f2${X}]][[validation:ans_f1${X}]][[validation:ans_f2${X}]]</div>
</div>
<p><strong>2.</strong> On admet que l'équation \\(f(x) = 0\\) admet une unique solution \\(\\alpha\\) sur \\([1 ; 2]\\).<br>En utilisant votre calculatrice (méthode par balayage ou dichotomie), donner un encadrement de \\(\\alpha\\) à \\(10^{-2}\\) près.<br><br></p>
<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
<div> [[input:ans_inf${X}]] [[validation:ans_inf${X}]]</div>
<div>&lt;\\(\\alpha\\) &lt; [[input:ans_sup${X}]] [[validation:ans_sup${X}]]</div>
</div>`}`;
        inputXML = _mkInput({name:`ans_f1${X}`,tans:`q${X}_f1`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0})
                 + '\n' + _mkInput({name:`ans_f2${X}`,tans:`q${X}_f2`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0})
                 + '\n' + _mkInput({name:`ans_inf${X}`,tans:`q${X}_alpha_inf`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0})
                 + '\n' + _mkInput({name:`ans_sup${X}`,tans:`q${X}_alpha_sup`,type:'numerical',boxsize:10,forbidfloat:0,mustverify:0,showvalidation:0});
        fbVars = `q${X}_tol: 0.001;
q${X}_test_inf: float(ans_inf${X}) <= q${X}_alpha + q${X}_tol and q${X}_alpha - float(ans_inf${X}) <= 0.01 + q${X}_tol;
q${X}_test_sup: float(ans_sup${X}) >= q${X}_alpha - q${X}_tol and float(ans_sup${X}) - q${X}_alpha <= 0.01 + q${X}_tol;
q${X}_test_encad: is(float(ans_sup${X}) - float(ans_inf${X}) <= 0.02 + q${X}_tol);`;
        canonicalNodes = [
            calcNode(0, 'V\xe9rification borne inf\xe9rieure', 'AlgEquiv', `q${X}_test_inf`, 'true', '',
                '+', 0.5, 1, 'PRT-'+X+'-INF-OK', '',
                '=', 0, -1, 'PRT-'+X+'-INF-NOK', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Borne inf\xe9rieure incorrecte.</strong> Votre valeur doit \xeatre plus petite que la solution \\(\\alpha\\), et la diff\xe9rence \\(\\alpha - \\text{valeur}\\) ne doit pas d\xe9passer 0.01.</div>`),
            calcNode(1, 'V\xe9rification borne sup\xe9rieure', 'AlgEquiv', `q${X}_test_sup`, 'true', '',
                '+', 0.5, 2, 'PRT-'+X+'-SUP-OK', '',
                '=', 0, -1, 'PRT-'+X+'-SUP-NOK', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Borne sup\xe9rieure incorrecte.</strong> Votre valeur doit \xeatre plus grande que la solution \\(\\alpha\\), et la diff\xe9rence \\(\\text{valeur} - \\alpha\\) ne doit pas d\xe9passer 0.01.</div>`),
            calcNode(2, 'V\xe9rification amplitude finale', 'AlgEquiv', `q${X}_test_encad`, 'true', '',
                '=', 0, -1, 'PRT-'+X+'-AMP-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Votre encadrement est correct et sa pr\xe9cision est bien de \\(10^{-2}\\).</div>`,
                '-', 0.25, -1, 'PRT-'+X+'-AMP-NOK', fbWrong || `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>Pr\xe9cision insuffisante !</strong> Vos bornes encadrent bien la solution, mais l'\xe9cart entre elles est trop grand. On demande un encadrement \xe0 \\(10^{-2}\\) pr\xe8s, ce qui signifie que la diff\xe9rence entre vos deux bornes ne doit pas d\xe9passer 0.02.</div>`)
        ];
        diagNodes = [0,1].map(function(i){ return { desc: canonicalNodes[i].description, fb: canonicalNodes[i].falsefeedback }; });
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction d\xe9taill\xe9e</div>
<div style="font-size:.9rem;"><strong>1. Valeurs interm\xe9diaires :</strong><br>\\(f(1) = e^1 - 1 - {@q${X}_k@} \\approx {@q${X}_f1@}\\)<br>\\(f(2) = e^2 - 2 - {@q${X}_k@} \\approx {@q${X}_f2@}\\)<br><br><strong>2. Encadrement :</strong><br>On a \\(f(1) &lt; 0\\) et \\(f(2) &gt; 0\\). Par le TVI, il existe \\(\\alpha \\in [1 ; 2]\\) tel que \\(f(\\alpha) = 0\\).<br>En effectuant un balayage, on trouve que la vraie valeur est \\(\\alpha \\approx {@q${X}_alpha@}\\).<br>Un encadrement correct à \\(10^{-2}\\) près est par exemple : [{@q${X}_alpha_inf@} ; {@q${X}_alpha_sup@}].</div>
</div>`;

    } else if (scenario === 'convexite-tangente') {
        vars = `/* Q${X} Calcul — Convexit\xe9 et position de la tangente */
q${X}_k:${_calcVarValue('k')}$ q${X}_m:${_calcVarValue('m')}$
q${X}_f:q${X}_k*%e^x+q${X}_m*x$
q${X}_fp:diff(q${X}_f,x)$ q${X}_fpp:diff(q${X}_fp,x)$
q${X}_ta_fpp:q${X}_fpp$ q${X}_ta_fp:q${X}_fp$`;
        qnote = `f(x)={@q${X}_f@}, f''(x)={@q${X}_fpp@}, k={@q${X}_k@}`;
        textFrag = `${HDR}${custText}${`<p>Soit \\(f\\) la fonction d\xe9finie sur \\(\\mathbb{R}\\) par \\( f(x) = {@q${X}_f@} \\).<br><br><strong>1.</strong> Calculer la d\xe9riv\xe9e seconde de \\(f\\), not\xe9e \\(f''(x)\\).</p>
<div style="margin-top:5px;margin-bottom:15px;">\\(f''(x)\\) = [[input:ans_fpp${X}]] [[validation:ans_fpp${X}]]</div>
<p><strong>2.</strong> En d\xe9duire la convexit\xe9 de \\(f\\) sur \\(\\mathbb{R}\\).</p>
<div style="margin-top:5px;margin-bottom:15px;">\\(f\\) est [[input:ans_conv${X}]] [[validation:ans_conv${X}]] sur \\(\\mathbb{R}\\).</div>
<p><strong>3.</strong> Quelle est la position de la tangente \xe0 la courbe repr\xe9sentative de \\(f\\) en un point quelconque par rapport \xe0 cette courbe ?</p>
<div style="margin-top:5px;">La tangente est [[input:ans_pos${X}]] [[validation:ans_pos${X}]] la courbe \\(\\mathcal{C}_f\\).</div>`}`;
        inputXML = _mkInput({name:`ans_fpp${X}`,tans:`q${X}_ta_fpp`,boxsize:15,showvalidation:0})
                 + '\n' + _mkInput({name:`ans_conv${X}`,type:'dropdown',tans:`<![CDATA[[["convexe", true, "convexe"], ["concave", false, "concave"], ["autre", false, "ni convexe ni concave"]]]]>`,boxsize:15,showvalidation:0})
                 + '\n' + _mkInput({name:`ans_pos${X}`,type:'dropdown',tans:`<![CDATA[[["en dessous de", true, "en dessous de"], ["au-dessus de", false, "au-dessus de"], ["confondue avec", false, "confondue avec"]]]]>`,boxsize:15,showvalidation:0});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification d\xe9riv\xe9e seconde', 'AlgEquiv', `ans_fpp${X}`, `q${X}_ta_fpp`, '',
                '=', 0.4, 1, 'PRT-'+X+'-FPP-OK', '',
                '=', 0, 3, 'PRT-'+X+'-FPP-NOK', ''),
            calcNode(1, 'V\xe9rification convexit\xe9', 'String', `ans_conv${X}`, '"convexe"', '',
                '=', 0.3, 2, 'PRT-'+X+'-CONV-OK', '',
                '=', 0, -1, 'PRT-'+X+'-CONV-NOK', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>Incoh\xe9rence !</strong> Votre d\xe9riv\xe9e seconde \xe9tait juste ({@q${X}_fpp@}). Que pouvez-vous dire du signe de {@q${X}_k@} multipli\xe9 par e^x sachant que e^x > 0 et que {@q${X}_k@} > 0 ? Concluez sur le signe de f''(x).</div>`),
            calcNode(2, 'V\xe9rification position tangente', 'String', `ans_pos${X}`, '"en dessous de"', '',
                '=', 0.3, -1, 'PRT-'+X+'-POS-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Vous avez ma\xeetris\xe9 toute la cha\xeene : D\xe9riv\xe9e seconde → Signe → Convexit\xe9 → Position relative.</div>`,
                '=', 0, -1, 'PRT-'+X+'-POS-NOK', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>Attention \xe0 la propri\xe9t\xe9 !</strong> Si une fonction est convexe (f'' > 0), alors sa courbe est <em>au-dessus</em> de ses tangentes. Donc la tangente est <strong>en dessous</strong> de la courbe.</div>`),
            calcNode(3, 'Diagnostic erreur d\xe9riv\xe9e', 'AlgEquiv', `ans_fpp${X}`, `q${X}_ta_fp`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-PRIME', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">🚨 <strong>Confusion de d\xe9riv\xe9e !</strong> Vous avez calcul\xe9 la d\xe9riv\xe9e premi\xe8re f'(x), mais on demande ici la d\xe9riv\xe9e <em>seconde</em> f''(x). Il faut d\xe9river une deuxi\xe8me fois !</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>D\xe9riv\xe9e seconde incorrecte.</strong> Rappelez-vous que la d\xe9riv\xe9e de e^x est e^x, et que la d\xe9riv\xe9e d'une constante est 0.</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[1].description, fb: canonicalNodes[1].falsefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].falsefeedback },
            { desc: canonicalNodes[3].description, fb: canonicalNodes[3].truefeedback }
        ];
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction d\xe9taill\xe9e</div>
<div style="font-size:.9rem;"><strong>1. D\xe9riv\xe9e seconde :</strong><br>\\(f'(x) = {@q${X}_fp@}\\).<br>En d\xe9rivant \xe0 nouveau, on obtient \\(f''(x) = {@q${X}_fpp@}\\).<br><br><strong>2. Convexit\xe9 :</strong><br>On sait que pour tout \\(x\\), \\(e^x > 0\\).<br>{@q${X}_k@} \xe9tant strictement positif, on a {@q${X}_k@} multipli\xe9 par \\(e^x > 0\\) pour tout \\(x\\).<br>Ainsi, \\(f''(x) > 0\\) sur \\(\\mathbb{R}\\), donc \\(f\\) est <strong>convexe</strong> sur \\(\\mathbb{R}\\).<br><br><strong>3. Position de la tangente :</strong><br>Une propri\xe9t\xe9 fondamentale des fonctions convexes est que la courbe est enti\xe8rement situ\xe9e <strong>au-dessus</strong> de chacune de ses tangentes. La tangente est donc <strong>en dessous</strong> de la courbe.</div>
</div>`;

    } else if (scenario === 'tangente-ext') {
        vars = `/* Q${X} Calcul — Tangente passant par un point ext\xe9rieur */
q${X}_a:${_calcVarValue('a')}$
q${X}_b:${_calcVarValue('b')}$
while q${X}_a = q${X}_b do q${X}_b:${_calcVarValue('b')}$
q${X}_k:${_calcVarValue('k')}$
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
        textFrag = `${HDR}${custText}${`<p>Dans un rep\xe8re, on considère la fonction \\(f\\) d\xe9finie par \\( f(x) = {@q${X}_f@} \\) et sa courbe repr\xe9sentative \\(\\mathcal{C}_f\\).<br><br>Soit le point \\(M\\left( {@q${X}_xM@} ; {@q${X}_yM@} \\right)\\) qui n'appartient pas \xe0 \\(\\mathcal{C}_f\\).<br><br><strong>1.</strong> D\xe9terminer les abscisses des points de \\(\\mathcal{C}_f\\) o\xf9 la tangente passe par \\(M\\). On donnera la r\xe9ponse sous forme d'un ensemble \\(\\{a ; b\\}\\) avec \\(a < b\\).</p>
<div style="margin-top:5px;margin-bottom:15px;">Abscisses = [[input:ans_ab${X}]] [[validation:ans_ab${X}]]</div>
<p><strong>2.</strong> Donner l'\xe9quation de l'une de ces deux tangentes (sous la forme \\(y = ...\\)).</p>
<div style="margin-top:5px;">Tangente : y= [[input:ans_tang${X}]] [[validation:ans_tang${X}]]</div>`}`;
        inputXML = _mkInput({name:`ans_ab${X}`,tans:`q${X}_ta_sol`,boxsize:15,hint:'{a, b}',mustverify:0,showvalidation:0})
                 + '\n' + _mkInput({name:`ans_tang${X}`,tans:`q${X}_ta_tang`,boxsize:20,hint:'...',checkanswertype:1,mustverify:1,showvalidation:2});
        canonicalNodes = [
            calcNode(0, 'V\xe9rification des abscisses des tangentes', 'AlgEquiv', `ans_ab${X}`, `q${X}_ta_sol`, '',
                '=', 0.5, 1, 'PRT-'+X+'-AB-OK', '',
                '=', 0, 2, 'PRT-'+X+'-AB-NOK', ''),
            calcNode(1, "V\xe9rification d'une \xe9quation de tangente", 'AlgEquiv', `ans_tang${X}`, `q${X}_ta_tang`, '',
                '=', 0.5, -1, 'PRT-'+X+'-TG-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Vous avez trouv\xe9 les bonnes abscisses et r\xe9dig\xe9 correctement l'\xe9quation d'une tangente.</div>`,
                '=', 0, 3, 'PRT-'+X+'-TG-NOK', ''),
            calcNode(2, 'Diagnostic erreur sur les abscisses', 'AlgEquiv', `ans_ab${X}`, `q${X}_err_point`, '',
                '=', 0, -1, 'PRT-'+X+'-ERR-XM', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>Confusion point / courbe !</strong> Vous avez donn\xe9 l'abscisse du point M. Le point M n'est pas sur la courbe. Vous devez r\xe9soudre l'\xe9quation <em>de la tangente</em> passant par M, pas l'\xe9quation de la courbe.</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Abscisses incorrectes.</strong> \xc9crivez l'\xe9quation g\xe9n\xe9rale de la tangente en \\(a\\) : \\(y = f'(a)(x-a) + f(a)\\). Remplacez \\(x\\) et \\(y\\) par les coordonn\xe9es de M pour obtenir une \xe9quation d'inconnue \\(a\\) \xe0 r\xe9soudre.</div>`),
            calcNode(3, "Diagnostic erreur sur l'\xe9quation", 'AlgEquiv', `ans_tang${X}`, 'false', '',
                '=', 0, -1, 'PRT-'+X+'-ERR-FORM', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">⚠️ <strong>Formule de tangente incorrecte.</strong> Les abscisses \xe9taient bonnes. N'oubliez pas le terme \\((x - a)\\) dans la formule : \\(y = f'(a)(x-a) + f(a)\\). Ne faites pas \\(y = f'(a)x + f(a)\\) !</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC-TG', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>\xc9quation incorrecte.</strong> Les abscisses \xe9taient justes. V\xe9rifiez le calcul de \\(f'(a)\\), de \\(f(a)\\), et le d\xe9veloppement de l'\xe9quation.</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].truefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].falsefeedback },
            { desc: canonicalNodes[3].description, fb: canonicalNodes[3].truefeedback }
        ];
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction d\xe9taill\xe9e</div>
<div style="font-size:.9rem;"><strong>1. Recherche des abscisses :</strong><br>L'\xe9quation g\xe9n\xe9rale d'une tangente en \\(a\\) est \\(y = f'(a)(x - a) + f(a)\\).<br>Ici, \\(f'(x) = 2x\\), donc \\(y = 2a(x - a) + a^2 + {@q${X}_k@}\\).<br>Elle passe par \\(M\\left({@q${X}_xM@} ; {@q${X}_yM@}\\right)\\) si :<br>{@q${X}_yM@} = 2a({@q${X}_xM@} - a) + a^2 + {@q${X}_k@}<br>En d\xe9veloppant et simplifiant, on obtient une \xe9quation du second degr\xe9 dont les solutions sont \\(S = \\{{@q${X}_a@} ; {@q${X}_b@}\\}\\).<br><br><strong>2. \xc9quations des tangentes :</strong><br>En {@q${X}_a@} : {@q${X}_tg1@}<br>En {@q${X}_b@} : {@q${X}_tg2@}</div>
</div>`;

    } else { /* aire-courbes */
        vars = `/* Q${X} Calcul — Aire entre deux courbes */
q${X}_a:${_calcVarValue('a')}$ q${X}_b:q${X}_a+${_calcVarValue('offset')}$ q${X}_k:${_calcVarValue('k')}$
q${X}_f:x^2$ q${X}_g:q${X}_f-q${X}_k*(x-q${X}_a)*(x-q${X}_b)$
q${X}_ta_ab:{q${X}_a, q${X}_b}$
q${X}_ta_aire:ratsimp(-integrate(q${X}_k*(x-q${X}_a)*(x-q${X}_b),x,q${X}_a,q${X}_b))$
q${X}_ta_err_sign:ratsimp(integrate(q${X}_k*(x-q${X}_a)*(x-q${X}_b),x,q${X}_a,q${X}_b))$
q${X}_cond_sup:if q${X}_g > q${X}_f then ">" else "<"$`;
        qnote = `f={@q${X}_f@}, g={@q${X}_g@}, Intersections={@q${X}_a@},{@q${X}_b@}, Aire={@q${X}_ta_aire@}`;
        textFrag = `${HDR}${custText}${`<p>Dans un rep\xe8re orthonorm\xe9, on considère les courbes repr\xe9sentatives des fonctions \\(f\\) et \\(g\\) d\xe9finies sur \\(\\mathbb{R}\\) par :<br>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:15px;text-align:center;font-size:1.1rem;margin-bottom:15px;">\\( f(x) = {@q${X}_f@} \\) &nbsp;&nbsp;&nbsp; et &nbsp;&nbsp;&nbsp; \\( g(x) = {@q${X}_g@} \\)</div>
<strong>1.</strong> D\xe9terminer les abscisses des points d'intersection des deux courbes. On les notera sous la forme d'un ensemble \\(\\{a ; b\\}\\) avec \\(a < b\\).<br>
<div style="margin-top:5px;margin-bottom:15px;">Abscisses = [[input:ans_ab${X}]] [[validation:ans_ab${X}]]</div>
<strong>2.</strong> Calculer l'aire exacte (en unit\xe9s d'aire) de la zone comprise entre les deux courbes.<br>
<div style="margin-top:5px;">Aire = [[input:ans_aire${X}]] [[validation:ans_aire${X}]] u.a.</div>`}`;
        inputXML = _mkInput({name:`ans_ab${X}`,tans:`q${X}_ta_ab`,boxsize:15,hint:'{a, b}',mustverify:0,showvalidation:0})
                 + '\n' + _mkInput({name:`ans_aire${X}`,tans:`q${X}_ta_aire`,boxsize:15,mustverify:0,showvalidation:0});
        canonicalNodes = [
            calcNode(0, "V\xe9rification des abscisses d'intersection", 'AlgEquiv', `ans_ab${X}`, `q${X}_ta_ab`, '',
                '=', 0.5, 1, 'PRT-'+X+'-AB-OK', '',
                '=', 0, -1, 'PRT-'+X+'-AB-NOK', `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Abscisses incorrectes.</strong> R\xe9solvez l'\xe9quation \\(f(x) = g(x)\\). Pensez \xe0 factoriser l'expression obtenue pour trouver les racines.</div>`),
            calcNode(1, "V\xe9rification de l'aire finale", 'AlgEquiv', `ans_aire${X}`, `q${X}_ta_aire`, '',
                '=', 0.5, -1, 'PRT-'+X+'-AIRE-OK', fbOk || `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Les abscisses et l'aire sont correctes. Vous avez bien pens\xe9 \xe0 prendre la valeur absolue de l'int\xe9grale pour obtenir une aire positive.</div>`,
                '=', 0, 2, 'PRT-'+X+'-AIRE-NOK', ''),
            calcNode(2, 'D\xe9tection erreur de signe (Aire n\xe9gative)', 'AlgEquiv', `ans_aire${X}`, `q${X}_ta_err_sign`, '',
                '=', 0.25, -1, 'PRT-'+X+'-ERR-SIGN', `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>Erreur de signe !</strong> Votre calcul int\xe9gral est bon, mais une aire doit \xeatre <strong>positive</strong>. Si votre int\xe9grale \\(\\int_a^b (f-g)\\) est n\xe9gative, l'aire est \\(-\\int_a^b (f-g)\\).</div>`,
                '=', 0, -1, 'PRT-'+X+'-ERR-CALC', fbWrong || `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ <strong>Aire incorrecte.</strong> Les abscisses \xe9taient bonnes. Revoyez le calcul de votre int\xe9grale. N'oubliez pas la formule : \\( A = \\int_a^b |f(x) - g(x)| dx \\).</div>`)
        ];
        diagNodes = [
            { desc: canonicalNodes[0].description, fb: canonicalNodes[0].falsefeedback },
            { desc: canonicalNodes[2].description, fb: canonicalNodes[2].truefeedback }
        ];
        generalFeedback = `<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">
<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction d\xe9taill\xe9e</div>
<div style="font-size:.9rem;"><strong>1. Points d'intersection :</strong><br>On r\xe9sout \\(f(x) = g(x) \\iff {@q${X}_f@} = {@q${X}_g@}\\).<br>Cela donne \\(({@q${X}_k@})(x-{@q${X}_a@})(x-{@q${X}_b@}) = 0\\), soit \\(({@q${X}_a@})(x - {@q${X}_b@}) = 0\\).<br>Les abscisses sont bien \\(S = \\{{@q${X}_a@} ; {@q${X}_b@}\\}\\).<br><br><strong>2. Calcul de l'aire :</strong><br>Sur \\([{@q${X}_a@} ; {@q${X}_b@}]\\), on a {@q${X}_g@} {@q${X}_cond_sup@} {@q${X}_f@}.<br>L'aire est donc \\( A = \\int_{{@q${X}_a@}}^{{@q${X}_b@}} \\left( |g(x) - f(x)| \\right) dx \\)<br>\\( A = -\\int_{{@q${X}_a@}}^{{@q${X}_b@}} \\left( {@q${X}_g@} - {@q${X}_f@} \\right) dx = {@q${X}_ta_aire@} \\) u.a.</div>
</div>`;
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
    prtXML = buildPrtXml(prtMeta, canonicalNodes);

    generalFeedback = _mkFbGen(generalFeedback || '', gs('calc-fbgen'));

    return {type:'calcul', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []};
}

// ─── STATISTIQUES ────────────────────────────────────────────

