// Nœud d'un PRT diagnostique séquentiel : si le test échoue, on enchaîne
// sur le nœud suivant (falsenextnode) jusqu'au nœud générique final.
// (même pattern que _suiSeqNode dans gen-math-suites.js / _geoSeqNode dans gen-math-geometrie.js)
function _probBox(kind, html) {
    var s = kind === 'ok' ? { c: '#15803d', bg: '#f0fdf4' }
        : kind === 'warn' ? { c: '#f97316', bg: '#fff7ed' }
        : { c: '#dc2626', bg: '#fff0f0' };
    var icon = kind === 'ok' ? '✅' : kind === 'warn' ? '🚨' : '❌';
    return '<div style="border-left:4px solid ' + s.c + ';padding:10px 14px;background:' + s.bg + ';border-radius:4px;">' + icon + ' ' + html + '</div>';
}
function _probGenFbBox(bodyHtml) {
    return '<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>🔑 Correction</strong><br>' + bodyHtml + '</div>';
}
function _probSeqNode(X, idx, isLast, spec) {
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
function _probSeqPrt(X, bareme, specs) {
    // Le dernier spec (test true=true, "sinon") ne sert qu'à porter un feedback
    // inconditionnel : plutôt que d'en faire un nœud STACK séparé (dont la branche
    // true=true est forcément prise et la branche false jamais atteignable), on le
    // replie dans falsefeedback du nœud précédent (falsenextnode:-1) — même résultat
    // pour Moodle, un nœud STACK de moins.
    var fallback = null, built = specs, lastSpec = specs[specs.length - 1];
    if (specs.length >= 2 && lastSpec.sans === 'true' && lastSpec.tans === 'true') {
        fallback = lastSpec;
        built = specs.slice(0, -1);
    }
    var nodes = built.map(function (spec, idx) { return _probSeqNode(X, idx, idx === built.length - 1, spec); });
    if (fallback) nodes[nodes.length - 1].falsefeedback = fallback.feedback || '';
    var prtMeta = { name: 'prt' + X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml(prtMeta, nodes) };
}
// Nœuds de diagnostic intermédiaires, exposés à part pour l'aperçu.
function _probDiagNodes(specs) {
    return specs.slice(1, -1).map(function (s) { return { desc: s.description, fb: s.feedback }; });
}

function genProbabilites(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var gn = function(id, def){ var v = parseFloat(gs(id)); return isNaN(v) ? def : v; };
    var gi = function(id, def){ var v = parseInt(gs(id)); return isNaN(v) ? def : v; };
    var bareme = parseFloat(gs('prob-bareme')) || 1;
    var scenario = gs('prob-scenario') || 'combinaison';
    var mode = gs('prob-mode') || 'aleatoire';
    var fbOk = gs('prob-fb-ok'), fbWrong = gs('prob-fb-wrong');
    var custText = gs('prob-text').trim();
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes, prtMeta, diagNodes;

    // ── déclarations Maxima : valeurs fixes (saisies) ou aléatoires (bornes saisies) ──
    // Les probabilités sont toujours des fractions exactes de dénominateur 20 (pas de
    // format 0,05) pour garantir un test AlgEquiv exact côté STACK, fixe ou aléatoire.
    function declN(def) {
        if (mode === 'fixe') {
            var v = gi('prob-n', def);
            if (v < 2) v = def;
            return `q${X}_n:${v};`;
        }
        var mn = gi('prob-n-min', 6), mx = gi('prob-n-max', 12);
        if (mn < 2) mn = 2;
        return `q${X}_n:ri(${mn},${mx});`;
    }
    function declK(kind, def) {
        // kind: 'comb' → k dans [2, n-2] ; 'pk' → k dans [1, n-1]
        var lo = kind === 'comb' ? 2 : 1, hi = kind === 'comb' ? 2 : 1;
        if (mode === 'fixe') {
            var v = gi('prob-k', def);
            return `q${X}_k:max(${lo},min(${v},q${X}_n-${hi}));`;
        }
        var mn = gi('prob-k-min', lo), mx = gi('prob-k-max', 6);
        return `q${X}_k:max(${lo},min(ri(${mn},${mx}),q${X}_n-${hi}));`;
    }
    function declFrac(id, def) {
        // Convertit une saisie décimale (ou des bornes) en fraction exacte /20.
        if (mode === 'fixe') {
            var v = gn(id, def);
            return `max(1,min(round(${v}*20),19))/20`;
        }
        var mn = gn(id + '-min', def), mx = gn(id + '-max', def);
        var mn20 = Math.round(mn * 20), mx20 = Math.round(mx * 20);
        if (mx20 < mn20) { var t = mn20; mn20 = mx20; mx20 = t; }
        return `max(1,min(ri(${mn20},${mx20}),19))/20`;
    }

    var HDR = `<div style="background:#d97706;border-left:5px solid #b45309;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Probabilit\xe9s</strong> <span style="background:#b45309;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'combinaison') {
        vars = `/* Q${X} Proba — Coefficient binomial */
ri(a,b):=a+rand(b-a+1);
${declN(10)}
${declK('comb', 3)}
q${X}_ta:binomial(q${X}_n,q${X}_k);`;
        qnote = `C({@q${X}_n@},{@q${X}_k@})={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Calculer le coefficient binomial \\( C_{{@q${X}_n@}}^{{@q${X}_k@}} \\).</p>
<p>\\( C_{{@q${X}_n@}}^{{@q${X}_k@}} = \\) [[input:ans_ck${X}]] [[validation:ans_ck${X}]]</p>`;
        inputXML = _mkInput({name:`ans_ck${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:1,mustverify:0,showvalidation:2});

        var specsComb = [
            { description: 'C(n,k) correct ?', sans: `ans_ck${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _probBox('ok', '<strong>Correct !</strong>') },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _probBox('bad', `\\(C_{{@q${X}_n@}}^{{@q${X}_k@}}=\\frac{{@q${X}_n@}!}{{@q${X}_k@}!({@q${X}_n@}-{@q${X}_k@})!}={@q${X}_ta@}\\).`) }
        ];
        diagNodes = _probDiagNodes(specsComb);
        var builtComb = _probSeqPrt(X, bareme, specsComb);
        prtMeta = builtComb.prtMeta; canonicalNodes = builtComb.canonicalNodes; prtXML = builtComb.prtXML;
        generalFeedback = _probGenFbBox(`\\(C_{{@q${X}_n@}}^{{@q${X}_k@}}={@q${X}_ta@}\\).`);

    } else if (scenario === 'binom-pk') {
        vars = `/* Q${X} Proba — Loi binomiale P(X=k) */
ri(a,b):=a+rand(b-a+1);
${declN(8)}
${declK('pk', 3)}
q${X}_p:${declFrac('prob-p', 0.5)};
q${X}_q:1-q${X}_p;
q${X}_ta:binomial(q${X}_n,q${X}_k)*q${X}_p^q${X}_k*q${X}_q^(q${X}_n-q${X}_k);
q${X}_err_swap:binomial(q${X}_n,q${X}_k)*q${X}_q^q${X}_k*q${X}_p^(q${X}_n-q${X}_k);
q${X}_err_nocoef:q${X}_p^q${X}_k*q${X}_q^(q${X}_n-q${X}_k);`;
        qnote = `n={@q${X}_n@}, k={@q${X}_k@}, p={@q${X}_p@}, P(X=k)={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Soit \\(X\\sim\\mathcal{B}({@q${X}_n@};{@q${X}_p@})\\). Calculer \\(P(X={@q${X}_k@})\\).</p>
<p>\\(P(X={@q${X}_k@})=\\) [[input:ans_prob${X}]] [[validation:ans_prob${X}]]</p>`;
        inputXML = _mkInput({name:`ans_prob${X}`,tans:`q${X}_ta`,boxsize:20,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsBinom = [
            { description: 'P(X=k) correct ?', sans: `ans_prob${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _probBox('ok', '<strong>Correct !</strong>') },
            { description: 'Erreur : p et (1-p) invers\xe9s', sans: `ans_prob${X}`, tans: `q${X}_err_swap`, score: 0,
                feedback: _probBox('warn', `\\(p\\) et \\(1-p\\) sont invers\xe9s ! Ici \\(p={@q${X}_p@}\\) est la probabilit\xe9 de succ\xe8s.`) },
            { description: 'Erreur : oubli du coefficient binomial', sans: `ans_prob${X}`, tans: `q${X}_err_nocoef`, score: 0,
                feedback: _probBox('warn', `Oubli du coefficient \\(C_n^k\\) ! \\(P(X=k)=C_n^k\\,p^k(1-p)^{n-k}\\).`) },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _probBox('bad', `\\(P(X=k)=C_n^k\\,p^k(1-p)^{n-k}={@q${X}_ta@}\\).`) }
        ];
        diagNodes = _probDiagNodes(specsBinom);
        var builtBinom = _probSeqPrt(X, bareme, specsBinom);
        prtMeta = builtBinom.prtMeta; canonicalNodes = builtBinom.canonicalNodes; prtXML = builtBinom.prtXML;
        generalFeedback = _probGenFbBox(`\\(P(X={@q${X}_k@})=C_{{@q${X}_n@}}^{{@q${X}_k@}}\\times({@q${X}_p@})^{{@q${X}_k@}}\\times({@q${X}_q@})^{{@q${X}_n@}-{@q${X}_k@}}={@q${X}_ta@}\\).`);

    } else if (scenario === 'binom-esp') {
        vars = `/* Q${X} Proba — Esp\xe9rance binomiale */
ri(a,b):=a+rand(b-a+1);
${declN(30)}
q${X}_p:${declFrac('prob-p', 0.4)};
q${X}_ta:q${X}_n*q${X}_p;`;
        qnote = `E(X)=np={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Soit \\(X\\sim\\mathcal{B}({@q${X}_n@};{@q${X}_p@})\\). Calculer \\(E(X)\\).</p>
<p>\\(E(X)=\\) [[input:ans_ex${X}]] [[validation:ans_ex${X}]]</p>`;
        inputXML = _mkInput({name:`ans_ex${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsEsp = [
            { description: 'E(X) correct ?', sans: `ans_ex${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _probBox('ok', '<strong>Correct !</strong>') },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _probBox('bad', `\\(E(X)=np={@q${X}_ta@}\\).`) }
        ];
        diagNodes = _probDiagNodes(specsEsp);
        var builtEsp = _probSeqPrt(X, bareme, specsEsp);
        prtMeta = builtEsp.prtMeta; canonicalNodes = builtEsp.canonicalNodes; prtXML = builtEsp.prtXML;
        generalFeedback = _probGenFbBox(`\\(E(X)=np={@q${X}_n@}\\times{@q${X}_p@}={@q${X}_ta@}\\).`);

    } else if (scenario === 'binom-var') {
        vars = `/* Q${X} Proba — Variance binomiale */
ri(a,b):=a+rand(b-a+1);
${declN(25)}
q${X}_p:${declFrac('prob-p', 0.4)};
q${X}_q:1-q${X}_p;
q${X}_ta:q${X}_n*q${X}_p*q${X}_q;`;
        qnote = `V(X)=npq={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Soit \\(X\\sim\\mathcal{B}({@q${X}_n@};{@q${X}_p@})\\). Calculer \\(V(X)\\).</p>
<p>\\(V(X)=\\) [[input:ans_vx${X}]] [[validation:ans_vx${X}]]</p>`;
        inputXML = _mkInput({name:`ans_vx${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsVar = [
            { description: 'V(X) correct ?', sans: `ans_vx${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _probBox('ok', '<strong>Correct !</strong>') },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _probBox('bad', `\\(V(X)=np(1-p)={@q${X}_ta@}\\).`) }
        ];
        diagNodes = _probDiagNodes(specsVar);
        var builtVar = _probSeqPrt(X, bareme, specsVar);
        prtMeta = builtVar.prtMeta; canonicalNodes = builtVar.canonicalNodes; prtXML = builtVar.prtXML;
        generalFeedback = _probGenFbBox(`\\(V(X)=np(1-p)={@q${X}_n@}\\times{@q${X}_p@}\\times{@q${X}_q@}={@q${X}_ta@}\\).`);

    } else if (scenario === 'proba-cond') {
        vars = `/* Q${X} Proba — Probabilit\xe9 conditionnelle (Bayes) */
ri(a,b):=a+rand(b-a+1);
q${X}_pA:${declFrac('prob-pa', 0.4)};
q${X}_pB:1-q${X}_pA;
q${X}_pD_A:${declFrac('prob-pb', 0.1)};
q${X}_pD_B:${declFrac('prob-pab', 0.05)};
q${X}_pD:q${X}_pA*q${X}_pD_A+q${X}_pB*q${X}_pD_B;
q${X}_pAD:q${X}_pA*q${X}_pD_A;
q${X}_ta:q${X}_pAD/q${X}_pD;`;
        qnote = `P(A|D)={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Un lot comporte deux types de pi\xe8ces : A (proportion {@q${X}_pA@}) et B ({@q${X}_pB@}).<br>Taux de d\xe9fauts : A : {@q${X}_pD_A@}, B : {@q${X}_pD_B@}.</p>
<p>On tire une pi\xe8ce d\xe9fectueuse. Quelle est la probabilit\xe9 qu'elle soit de type A ?</p>
<p>\\(P(A|D)=\\) [[input:ans_cond${X}]] [[validation:ans_cond${X}]]</p>`;
        inputXML = _mkInput({name:`ans_cond${X}`,tans:`q${X}_ta`,boxsize:20,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsCond = [
            { description: 'P(A|D) correct ?', sans: `ans_cond${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _probBox('ok', '<strong>Correct !</strong>') },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _probBox('bad', `Th\xe9or\xe8me de Bayes : \\(P(A|D)=\\frac{P(A)P(D|A)}{P(D)}={@q${X}_ta@}\\).`) }
        ];
        diagNodes = _probDiagNodes(specsCond);
        var builtCond = _probSeqPrt(X, bareme, specsCond);
        prtMeta = builtCond.prtMeta; canonicalNodes = builtCond.canonicalNodes; prtXML = builtCond.prtXML;
        generalFeedback = _probGenFbBox(`\\(P(D)={@q${X}_pD@}\\)<br>\\(P(A|D)=\\frac{{@q${X}_pAD@}}{{@q${X}_pD@}}={@q${X}_ta@}\\).`);

    } else { /* proba-union */
        vars = `/* Q${X} Proba — Union */
ri(a,b):=a+rand(b-a+1);
q${X}_pA:${declFrac('prob-pa', 0.4)};
q${X}_pB:${declFrac('prob-pb', 0.35)};
q${X}_pI:${declFrac('prob-pab', 0.15)};
q${X}_ta:q${X}_pA+q${X}_pB-q${X}_pI;`;
        qnote = `P(A∪B)={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>Soit \\(P(A)={@q${X}_pA@}\\), \\(P(B)={@q${X}_pB@}\\), \\(P(A\\cap B)={@q${X}_pI@}\\).</p>
<p>Calculer \\(P(A\\cup B)\\).</p>
<p>\\(P(A\\cup B)=\\) [[input:ans_union${X}]] [[validation:ans_union${X}]]</p>`;
        inputXML = _mkInput({name:`ans_union${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsUnion = [
            { description: 'P(A∪B) correct ?', sans: `ans_union${X}`, tans: `q${X}_ta`, score: 1,
                feedback: fbOk || _probBox('ok', '<strong>Correct !</strong>') },
            { description: 'Erreur g\xe9n\xe9rique (fallback)', sans: 'true', tans: 'true', score: 0, quiet: true,
                feedback: fbWrong || _probBox('bad', `\\(P(A\\cup B)=P(A)+P(B)-P(A\\cap B)={@q${X}_ta@}\\).`) }
        ];
        diagNodes = _probDiagNodes(specsUnion);
        var builtUnion = _probSeqPrt(X, bareme, specsUnion);
        prtMeta = builtUnion.prtMeta; canonicalNodes = builtUnion.canonicalNodes; prtXML = builtUnion.prtXML;
        generalFeedback = _probGenFbBox(`\\(P(A\\cup B)={@q${X}_pA@}+{@q${X}_pB@}-{@q${X}_pI@}={@q${X}_ta@}\\).`);
    }

    generalFeedback = _mkFbGen(generalFeedback, gs('prob-fbgen'));

    return {type:'probabilites', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []};
}

// ─── TRIGONOMÉTRIE ───────────────────────────────────────────
