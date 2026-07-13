// Nœud d'un PRT diagnostique séquentiel : si le test échoue, on enchaîne
// sur le nœud suivant (falsenextnode) jusqu'au nœud générique final.
// (même pattern que _geoSeqNode dans gen-math-geometrie.js)
function _suiBox(kind, html) {
    var s = kind === 'ok' ? { c: '#15803d', bg: '#f0fdf4' }
        : kind === 'warn' ? { c: '#f97316', bg: '#fff7ed' }
        : { c: '#dc2626', bg: '#fff0f0' };
    var icon = kind === 'ok' ? '✅' : kind === 'warn' ? '🚨' : '❌';
    return '<div style="border-left:4px solid ' + s.c + ';padding:10px 14px;background:' + s.bg + ';border-radius:4px;">' + icon + ' ' + html + '</div>';
}
function _suiGenFbBox(bodyHtml) {
    return '<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>' + bodyHtml + '</div>';
}
function _suiSeqNode(X, idx, isLast, spec) {
    return {
        name: String(idx), description: spec.description || '',
        answertest: spec.answertest || 'AlgEquiv', sans: spec.sans, tans: spec.tans,
        testoptions: spec.testoptions || '', quiet: spec.quiet ? '1' : '0',
        truescoremode: '=', truescore: String(spec.score),
        truepenalty: '', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-' + idx + '-T', truefeedback: spec.feedback || '',
        falsescoremode: '=', falsescore: '0', falsepenalty: '',
        falsenextnode: isLast ? '-1' : String(idx + 1),
        falseanswernote: 'PRT' + X + '-' + idx + '-F', falsefeedback: ''
    };
}
function _suiSeqPrt(X, bareme, specs) {
    var nodes = specs.map(function (spec, idx) { return _suiSeqNode(X, idx, idx === specs.length - 1, spec); });
    var prtMeta = { name: 'prt' + X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml(prtMeta, nodes) };
}
// Nœuds de diagnostic intermédiaires (entre le nœud "réponse correcte" et le
// nœud générique final) : exposés à part pour l'aperçu (cf. genGeometrie).
function _suiDiagNodes(specs) {
    return specs.slice(1, -1).map(function (s) { return { desc: s.description, fb: s.feedback }; });
}

function genSuites(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var gn = function(id, def){ var v = parseFloat(gs(id)); return isNaN(v) ? def : v; };
    var gi = function(id, def){ var v = parseInt(gs(id)); return isNaN(v) ? def : v; };
    var bareme = parseFloat(gs('sui-bareme')) || 1;
    var scenario = gs('sui-scenario') || 'terme-arith';
    var mode = gs('sui-mode') || 'aleatoire';
    var fbOk = gs('sui-fb-ok'), fbWrong = gs('sui-fb-wrong');
    var custText = gs('sui-text').trim();
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes, prtMeta, diagNodes;

    // ── déclarations Maxima : valeurs fixes (saisies) ou aléatoires (bornes saisies) ──
    function declU0(def) {
        if (mode === 'fixe') {
            var v = gn('sui-u0', def);
            if (v === 0) v = def;
            return `q${X}_U0:${v};`;
        }
        var mn = gi('sui-u0-min', -5), mx = gi('sui-u0-max', 5);
        return `q${X}_U0:ri(${mn},${mx});\nwhile q${X}_U0=0 do (q${X}_U0:ri(${mn},${mx}));`;
    }
    function declR(def, excludeOne) {
        if (mode === 'fixe') {
            var v = gn('sui-r', def);
            if (v === 0 || (excludeOne && v === 1)) v = def;
            return `q${X}_r:${v};`;
        }
        var mn = gi('sui-r-min', -5), mx = gi('sui-r-max', 5);
        return `q${X}_r:ri(${mn},${mx});\nwhile q${X}_r=0${excludeOne ? ` or q${X}_r=1` : ''} do (q${X}_r:ri(${mn},${mx}));`;
    }
    function declQ(def, excludeOne) {
        if (mode === 'fixe') {
            var v = gn('sui-q', def);
            if (v === 0 || (excludeOne && v === 1)) v = def;
            return `q${X}_q:${v};`;
        }
        var mn10 = Math.round(gn('sui-q-min', -3) * 10), mx10 = Math.round(gn('sui-q-max', 3) * 10);
        if (mx10 < mn10) { var t = mn10; mn10 = mx10; mx10 = t; }
        return `q${X}_q:float(ri(${mn10},${mx10}))/10;\nwhile q${X}_q=0${excludeOne ? ` or q${X}_q=1` : ''} do (q${X}_q:float(ri(${mn10},${mx10}))/10);`;
    }
    function declQLim(def) {
        if (mode === 'fixe') {
            var v = gn('sui-q', def);
            if (v === 0 || Math.abs(v) >= 1) v = def;
            return `q${X}_q:${v};`;
        }
        var mn = Math.max(-0.9, Math.min(gn('sui-q-min', -0.9), 0.9));
        var mx = Math.max(-0.9, Math.min(gn('sui-q-max', 0.9), 0.9));
        var mn10 = Math.round(mn * 10), mx10 = Math.round(mx * 10);
        if (mx10 < mn10) { var t = mn10; mn10 = mx10; mx10 = t; }
        return `q${X}_q:float(ri(${mn10},${mx10}))/10;\nwhile q${X}_q=0 do (q${X}_q:float(ri(${mn10},${mx10}))/10);`;
    }
    function declK(def) {
        if (mode === 'fixe') {
            var v = gi('sui-k', def);
            if (v < 1) v = def;
            return `q${X}_k:${v};`;
        }
        var mn = gi('sui-k-min', 3), mx = gi('sui-k-max', 6);
        if (mn < 1) mn = 1;
        return `q${X}_k:ri(${mn},${mx});`;
    }

    var HDR = `<div style="background:#7c3aed;border-left:5px solid #6d28d9;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N.t('sui.title')}</strong> <span style="background:#6d28d9;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'terme-arith' || scenario === 'expr-arith') {
        vars = `/* Q${X} Suites — Terme g\xe9n\xe9ral arithm\xe9tique */
ri(a,b):=a+rand(b-a+1);
${declU0(3)}
${declK(5)}
${declR(2)}
q${X}_Uk:q${X}_U0+q${X}_k*q${X}_r;
q${X}_Uk_m_U0:q${X}_Uk-q${X}_U0;
q${X}_ans:q${X}_U0+n*q${X}_r;
q${X}_err_inv:q${X}_U0-n*q${X}_r;
q${X}_err_const:q${X}_Uk;
q${X}_err_nok:q${X}_U0+q${X}_r;`;
        qnote = `U0={@q${X}_U0@}, k={@q${X}_k@}, Uk={@q${X}_Uk@}, r={@q${X}_r@}, Un={@q${X}_ans@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('sui.q_terme_arith_intro')}</p>
<div style="display:flex;gap:30px;justify-content:center;margin:15px 0;">
<div>\\(U_0={@q${X}_U0@}\\)</div>
<div>\\(U_{{@q${X}_k@}}={@q${X}_Uk@}\\)</div>
</div>
<p>${I18N.t('sui.q_terme_arith_ask')}</p>
<p>\\(U_n=\\) [[input:ans_un${X}]] [[validation:ans_un${X}]]</p>`;
        inputXML = _mkInput({name:`ans_un${X}`,tans:`q${X}_ans`,boxsize:20,hint:'U0 + n*r',forbidfloat:1,mustverify:0,showvalidation:0});

        var specsArith = [
            { description: 'Terme g\xe9n\xe9ral correct ?', sans: `ans_un${X}`, tans: `q${X}_ans`, score: 1,
                feedback: fbOk || _suiBox('ok', I18N.t('sui.fb_ok_terme_arith')) },
            { description: 'Erreur : signe de la raison invers\xe9', sans: `ans_un${X}`, tans: `q${X}_err_inv`, score: 0,
                feedback: _suiBox('warn', I18N.t('sui.err_signe_raison', {kvar:'q'+X+'_k', rvar:'q'+X+'_r'})) },
            { description: 'Erreur : a donn\xe9 U_k au lieu de U_n', sans: `ans_un${X}`, tans: `q${X}_err_const`, score: 0,
                feedback: _suiBox('warn', I18N.t('sui.err_confusion_uk', {kvar:'q'+X+'_k'})) },
            { description: 'Erreur : oubli du facteur n', sans: `ans_un${X}`, tans: `q${X}_err_nok`, score: 0,
                feedback: _suiBox('warn', I18N.t('sui.err_oubli_facteur_n')) },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _suiBox('bad', I18N.t('sui.fb_wrong_terme_arith', {kvar:'q'+X+'_k', rvar:'q'+X+'_r'})) }
        ];
        diagNodes = _suiDiagNodes(specsArith);
        var builtArith = _suiSeqPrt(X, bareme, specsArith);
        prtMeta = builtArith.prtMeta; canonicalNodes = builtArith.canonicalNodes; prtXML = builtArith.prtXML;
        generalFeedback = _suiGenFbBox(I18N.t('sui.fbgen_terme_arith', {kvar:'q'+X+'_k', ukmu0var:'q'+X+'_Uk_m_U0', rvar:'q'+X+'_r', ansvar:'q'+X+'_ans'}));

    } else if (scenario === 'terme-geo') {
        vars = `/* Q${X} Suites — Terme g\xe9om\xe9trique */
ri(a,b):=a+rand(b-a+1);
${declU0(2)}
${declQ(3, false)}
${declK(5)}
q${X}_Uk:q${X}_U0*q${X}_q^q${X}_k;
q${X}_ans:q${X}_U0*q${X}_q^n;`;
        qnote = `U0={@q${X}_U0@}, q={@q${X}_q@}, Un={@q${X}_ans@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('sui.q_terme_geo_intro', {u0var:'q'+X+'_U0', kvar:'q'+X+'_k', ukvar:'q'+X+'_Uk'})}</p>
<p>${I18N.t('sui.q_terme_geo_ask')}</p>
<p>\\(U_n=\\) [[input:ans_un${X}]] [[validation:ans_un${X}]]</p>`;
        inputXML = _mkInput({name:`ans_un${X}`,tans:`q${X}_ans`,boxsize:20,hint:'U0 * q^n',forbidfloat:1,mustverify:0,showvalidation:0});

        var specsGeo = [
            { description: 'Terme g\xe9n\xe9ral correct ?', sans: `ans_un${X}`, tans: `q${X}_ans`, score: 1,
                feedback: fbOk || _suiBox('ok', `<strong>${I18N.t('mat.fb_ok_parfait')}</strong>`) },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _suiBox('bad', I18N.t('sui.fb_wrong_terme_geo', {ansvar:'q'+X+'_ans'})) }
        ];
        diagNodes = _suiDiagNodes(specsGeo);
        var builtGeo = _suiSeqPrt(X, bareme, specsGeo);
        prtMeta = builtGeo.prtMeta; canonicalNodes = builtGeo.canonicalNodes; prtXML = builtGeo.prtXML;
        generalFeedback = _suiGenFbBox(I18N.t('sui.fbgen_terme_geo', {kvar:'q'+X+'_k', qvar:'q'+X+'_q', ansvar:'q'+X+'_ans'}));

    } else if (scenario === 'somme-arith') {
        vars = `/* Q${X} Suites — Somme arithm\xe9tique */
ri(a,b):=a+rand(b-a+1);
${declU0(1)}
${declR(1, true)}
q${X}_Un_1:q${X}_U0+(n-1)*q${X}_r;
q${X}_ans:n*(q${X}_U0+q${X}_Un_1)/2;`;
        qnote = `Sn=n*(U0+Un-1)/2={@q${X}_ans@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('sui.q_somme_arith_intro', {u0var:'q'+X+'_U0', rvar:'q'+X+'_r'})}</p>
<p>${I18N.t('sui.q_calculer_sn')}</p>
<p>\\(S_n=\\) [[input:ans_sn${X}]] [[validation:ans_sn${X}]]</p>`;
        inputXML = _mkInput({name:`ans_sn${X}`,tans:`q${X}_ans`,boxsize:25,forbidfloat:1,mustverify:1,showvalidation:2});

        var specsSomA = [
            { description: 'Somme correcte ?', sans: `ans_sn${X}`, tans: `q${X}_ans`, score: 1,
                feedback: fbOk || _suiBox('ok', `<strong>${I18N.t('mat.fb_ok_correct')}</strong>`) },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _suiBox('bad', I18N.t('sui.fb_wrong_somme_arith', {ansvar:'q'+X+'_ans'})) }
        ];
        diagNodes = _suiDiagNodes(specsSomA);
        var builtSomA = _suiSeqPrt(X, bareme, specsSomA);
        prtMeta = builtSomA.prtMeta; canonicalNodes = builtSomA.canonicalNodes; prtXML = builtSomA.prtXML;
        generalFeedback = _suiGenFbBox(I18N.t('sui.fbgen_somme_arith', {un1var:'q'+X+'_Un_1', ansvar:'q'+X+'_ans'}));

    } else if (scenario === 'somme-geo') {
        vars = `/* Q${X} Suites — Somme g\xe9om\xe9trique */
ri(a,b):=a+rand(b-a+1);
${declU0(1)}
${declQ(2, true)}
q${X}_ans:q${X}_U0*(1-q${X}_q^n)/(1-q${X}_q);`;
        qnote = `Sn=U0*(1-q^n)/(1-q)={@q${X}_ans@}`;
        textFrag = `${HDR}${custText}<p>${I18N.t('sui.q_somme_geo_intro', {u0var:'q'+X+'_U0', qvar:'q'+X+'_q'})}</p>
<p>${I18N.t('sui.q_calculer_sn')}</p>
<p>\\(S_n=\\) [[input:ans_sn${X}]] [[validation:ans_sn${X}]]</p>`;
        inputXML = _mkInput({name:`ans_sn${X}`,tans:`q${X}_ans`,boxsize:25,forbidfloat:1,mustverify:1,showvalidation:2});

        var specsSomG = [
            { description: 'Somme correcte ?', sans: `ans_sn${X}`, tans: `q${X}_ans`, score: 1,
                feedback: fbOk || _suiBox('ok', `<strong>${I18N.t('mat.fb_ok_correct')}</strong>`) },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _suiBox('bad', I18N.t('sui.fb_wrong_somme_geo', {ansvar:'q'+X+'_ans'})) }
        ];
        diagNodes = _suiDiagNodes(specsSomG);
        var builtSomG = _suiSeqPrt(X, bareme, specsSomG);
        prtMeta = builtSomG.prtMeta; canonicalNodes = builtSomG.canonicalNodes; prtXML = builtSomG.prtXML;
        generalFeedback = _suiGenFbBox(I18N.t('sui.fbgen_somme_geo', {ansvar:'q'+X+'_ans'}));

    } else { /* limite-geo */
        vars = `/* Q${X} Suites — Limite g\xe9om\xe9trique */
ri(a,b):=a+rand(b-a+1);
${declU0(10)}
${declQLim(0.5)}
q${X}_ans:0;`;
        qnote = `U0={@q${X}_U0@}, q={@q${X}_q@}, limite=0`;
        textFrag = `${HDR}${custText}<p>${I18N.t('sui.q_limite_geo_intro', {u0var:'q'+X+'_U0', qvar:'q'+X+'_q'})}</p>
<p>${I18N.t('sui.q_limite_geo_ask')}</p>
<p>\\(\\lim U_n=\\) [[input:ans_lim${X}]] [[validation:ans_lim${X}]]</p>`;
        inputXML = _mkInput({name:`ans_lim${X}`,tans:`q${X}_ans`,boxsize:10,allowwords:'inf',hint:'0',forbidfloat:1,mustverify:0,showvalidation:0});

        var specsLim = [
            { description: 'Limite correcte ?', sans: `ans_lim${X}`, tans: `q${X}_ans`, score: 1,
                feedback: fbOk || _suiBox('ok', I18N.t('sui.fb_ok_limite_geo')) },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _suiBox('bad', I18N.t('sui.fb_wrong_limite_geo')) }
        ];
        diagNodes = _suiDiagNodes(specsLim);
        var builtLim = _suiSeqPrt(X, bareme, specsLim);
        prtMeta = builtLim.prtMeta; canonicalNodes = builtLim.canonicalNodes; prtXML = builtLim.prtXML;
        generalFeedback = _suiGenFbBox(I18N.t('sui.fbgen_limite_geo', {absqvar:'abs(q'+X+'_q)'}));
    }

    generalFeedback = _mkFbGen(generalFeedback, gs('sui-fbgen'));

    return {type:'suites', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []};
}

// ─── PROBABILITÉS ────────────────────────────────────────────

