/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Nœud d'un PRT diagnostique séquentiel : si le test échoue, on enchaîne
// sur le nœud suivant (falsenextnode) jusqu'au nœud générique final.
// (même pattern que _suiSeqNode dans gen-math-suites.js / _geoSeqNode dans gen-math-geometrie.js)
// _probKind : correspondance entre les alias 'ok'/'warn'/'bad' (utilisés dans tout ce
// fichier pour choisir la couleur du feedback) et les kinds 'true'/'partial'/'false'
// attendus par applyFbBox (js/fb-box.js).
function _probKind(kind) {
    return kind === 'ok' ? 'true' : kind === 'warn' ? 'partial' : 'false';
}
// _probBox : ne renvoie plus que le contenu BRUT (pas d'encadré ni d'icône) — le
// nœud PRT édité via prt-manager.js doit rester du texte simple. L'encadré coloré
// n'est appliqué qu'au moment de construire xmlNodes/prtXML (voir _probSeqPrt_D),
// jamais dans les nœuds exposés via prt.nodes. kind reste passé par les appelants
// pour lisibilité (ancien schéma) mais n'influence plus le rendu ici ; c'est le
// champ spec.kind (assigné à chaque appel) qui pilote l'encadré en aval.
function _probBox(kind, html) {
    return html;
}
function _probGenFbBox(bodyHtml) {
    return '<strong>Correction</strong><br>' + bodyHtml;
}
function _probSeqNode(X, idx, isLast, spec) {
    return {
        name: String(idx), description: spec.description || '',
        answertest: spec.answertest || 'AlgEquiv', sans: spec.sans, tans: spec.tans,
        testoptions: spec.testoptions || '', quiet: spec.quiet ? '1' : '0',
        truescoremode: '=', truescore: String(spec.score),
        truepenalty: '', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-' + idx + '-T', truefeedback: spec.feedback || '', fbKind: spec.kind || 'true',
        falsescoremode: '=', falsescore: '0', falsepenalty: '',
        falsenextnode: isLast ? '-1' : String(idx + 1),
        falseanswernote: 'PRT' + X + '-' + idx + '-F', falsefeedback: '', falseFbKind: 'false'
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
    if (fallback) {
        nodes[nodes.length - 1].falsefeedback = fallback.feedback || '';
        nodes[nodes.length - 1].falseFbKind = fallback.kind || 'false';
    }
    var prtMeta = { name: 'prt' + X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
    // nodes (exposé via prt.nodes pour prt-manager.js) reste brut, sans encadré :
    // xmlNodes n'est qu'une copie avec l'encadré appliqué, réservée à l'export XML
    // final — voir js/fb-box.js.
    var xmlNodes = nodes.map(function (n) {
        return Object.assign({}, n, {
            truefeedback: n.truefeedback ? applyFbBox(n.fbKind || 'true', n.truefeedback) : n.truefeedback,
            falsefeedback: n.falsefeedback ? applyFbBox(n.falseFbKind || 'false', n.falsefeedback) : n.falsefeedback
        });
    });
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml(prtMeta, xmlNodes) };
}
// Nœuds de diagnostic intermédiaires, exposés à part pour l'aperçu.
function _probDiagNodes(specs) {
    return specs.slice(1, -1).map(function (s) { return { desc: s.description, fb: s.feedback, kind: s.kind }; });
}

function _probBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var raw = {};
    ['prob-n', 'prob-n-min', 'prob-n-max', 'prob-k', 'prob-k-min', 'prob-k-max',
     'prob-p', 'prob-p-min', 'prob-p-max',
     'prob-pa', 'prob-pa-min', 'prob-pa-max',
     'prob-pb', 'prob-pb-min', 'prob-pb-max',
     'prob-pab', 'prob-pab-min', 'prob-pab-max'].forEach(function(id){ raw[id] = gs(id); });
    return {
        bareme: parseFloat(gs('prob-bareme')) || 1,
        scenario: gs('prob-scenario') || 'combinaison',
        mode: gs('prob-mode') || 'aleatoire',
        fbOk: gs('prob-fb-ok'), fbWrong: gs('prob-fb-wrong'),
        custText: gs('prob-text').trim(),
        fbGen: gs('prob-fbgen'),
        raw: raw
    };
}

async function genProbabilites(X) {
    var p = _probBuildParams();
    try{
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'probabilites', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "probabilites", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[cairnforstack] /api/generate injoignable pour "probabilites", repli sur le calcul local.', e); }
    return genProbabilitesCore(X, p);
}

function genProbabilitesCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var bareme = p.bareme, scenario = p.scenario, mode = p.mode;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, custText = p.custText;
    var raw = p.raw || {};
    var gn = function(id, def){ var v = parseFloat(raw[id]); return isNaN(v) ? def : v; };
    var gi = function(id, def){ var v = parseInt(raw[id]); return isNaN(v) ? def : v; };
    var vars, qnote, textFrag, inputXML, prtXML, generalFeedback, canonicalNodes, prtMeta, diagNodes;

    function _probSeqPrt_D(X, bareme, specs) {
        var fallback = null, built = specs, lastSpec = specs[specs.length - 1];
        if (specs.length >= 2 && lastSpec.sans === 'true' && lastSpec.tans === 'true') {
            fallback = lastSpec;
            built = specs.slice(0, -1);
        }
        var nodes = built.map(function (spec, idx) { return _probSeqNode(X, idx, idx === built.length - 1, spec); });
        if (fallback) {
            nodes[nodes.length - 1].falsefeedback = fallback.feedback || '';
            nodes[nodes.length - 1].falseFbKind = fallback.kind || 'false';
        }
        var prtMeta = { name: 'prt' + X, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
        // nodes (exposé via prt.nodes pour prt-manager.js) reste brut, sans encadré :
        // xmlNodes n'est qu'une copie avec l'encadré appliqué, réservée à l'export XML
        // final — voir js/fb-box.js.
        var xmlNodes = nodes.map(function (n) {
            return Object.assign({}, n, {
                truefeedback: n.truefeedback ? applyFbBox_D(n.fbKind || 'true', n.truefeedback) : n.truefeedback,
                falsefeedback: n.falsefeedback ? applyFbBox_D(n.falseFbKind || 'false', n.falsefeedback) : n.falsefeedback
            });
        });
        return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: buildPrtXml_D(prtMeta, xmlNodes) };
    }

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

    var HDR = `<div style="background:#d97706;border-left:5px solid #b45309;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('prob.title')}</strong> <span style="background:#b45309;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    if (scenario === 'combinaison') {
        vars = `/* Q${X} Proba — Coefficient binomial */
ri(a,b):=a+rand(b-a+1);
${declN(10)}
${declK('comb', 3)}
q${X}_ta:binomial(q${X}_n,q${X}_k);`;
        qnote = `C({@q${X}_n@},{@q${X}_k@})={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('prob.q_combinaison', {nvar:'q'+X+'_n', kvar:'q'+X+'_k'})}</p>
<p>\\( C_{{@q${X}_n@}}^{{@q${X}_k@}} = \\) [[input:ans_ck${X}]] [[validation:ans_ck${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_ck${X}`,tans:`q${X}_ta`,boxsize:10,forbidfloat:1,mustverify:0,showvalidation:2});

        var specsComb = [
            { description: I18N_D.t('prob.node_cnk'), sans: `ans_ck${X}`, tans: `q${X}_ta`, score: 1, kind: _probKind('ok'),
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>` },
            { description: I18N_D.t('prob.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: _probKind('bad'),
                feedback: fbWrong || I18N_D.t('prob.fb_wrong_combinaison', {nvar:'q'+X+'_n', kvar:'q'+X+'_k', tavar:'q'+X+'_ta'}) }
        ];
        diagNodes = _probDiagNodes(specsComb);
        var builtComb = _probSeqPrt_D(X, bareme, specsComb);
        prtMeta = builtComb.prtMeta; canonicalNodes = builtComb.canonicalNodes; prtXML = builtComb.prtXML;
        generalFeedback = _probGenFbBox(I18N_D.t('prob.fbgen_combinaison', {nvar:'q'+X+'_n', kvar:'q'+X+'_k', tavar:'q'+X+'_ta'}));

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
        textFrag = `${HDR}${custText}<p>${I18N_D.t('prob.q_binom_pk', {nvar:'q'+X+'_n', pvar:'q'+X+'_p', kvar:'q'+X+'_k'})}</p>
<p>\\(P(X={@q${X}_k@})=\\) [[input:ans_prob${X}]] [[validation:ans_prob${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_prob${X}`,tans:`q${X}_ta`,boxsize:20,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsBinom = [
            { description: I18N_D.t('prob.node_pxk'), sans: `ans_prob${X}`, tans: `q${X}_ta`, score: 1, kind: _probKind('ok'),
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>` },
            { description: I18N_D.t('prob.node_err_p_inverse'), sans: `ans_prob${X}`, tans: `q${X}_err_swap`, score: 0, kind: _probKind('warn'),
                feedback: I18N_D.t('prob.err_p_inverse', {pvar:'q'+X+'_p'}) },
            { description: I18N_D.t('prob.node_err_oubli_coef'), sans: `ans_prob${X}`, tans: `q${X}_err_nocoef`, score: 0, kind: _probKind('warn'),
                feedback: I18N_D.t('prob.err_oubli_coef') },
            { description: I18N_D.t('prob.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: _probKind('bad'),
                feedback: fbWrong || I18N_D.t('prob.fb_wrong_binom_pk', {tavar:'q'+X+'_ta'}) }
        ];
        diagNodes = _probDiagNodes(specsBinom);
        var builtBinom = _probSeqPrt_D(X, bareme, specsBinom);
        prtMeta = builtBinom.prtMeta; canonicalNodes = builtBinom.canonicalNodes; prtXML = builtBinom.prtXML;
        generalFeedback = _probGenFbBox(I18N_D.t('prob.fbgen_binom_pk', {kvar:'q'+X+'_k', nvar:'q'+X+'_n', pvar:'q'+X+'_p', qvar:'q'+X+'_q', tavar:'q'+X+'_ta'}));

    } else if (scenario === 'binom-esp') {
        vars = `/* Q${X} Proba — Esp\xe9rance binomiale */
ri(a,b):=a+rand(b-a+1);
${declN(30)}
q${X}_p:${declFrac('prob-p', 0.4)};
q${X}_ta:q${X}_n*q${X}_p;`;
        qnote = `E(X)=np={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('prob.q_binom_esp', {nvar:'q'+X+'_n', pvar:'q'+X+'_p'})}</p>
<p>\\(E(X)=\\) [[input:ans_ex${X}]] [[validation:ans_ex${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_ex${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsEsp = [
            { description: I18N_D.t('prob.node_ex'), sans: `ans_ex${X}`, tans: `q${X}_ta`, score: 1, kind: _probKind('ok'),
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>` },
            { description: I18N_D.t('prob.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: _probKind('bad'),
                feedback: fbWrong || I18N_D.t('prob.fb_wrong_binom_esp', {tavar:'q'+X+'_ta'}) }
        ];
        diagNodes = _probDiagNodes(specsEsp);
        var builtEsp = _probSeqPrt_D(X, bareme, specsEsp);
        prtMeta = builtEsp.prtMeta; canonicalNodes = builtEsp.canonicalNodes; prtXML = builtEsp.prtXML;
        generalFeedback = _probGenFbBox(I18N_D.t('prob.fbgen_binom_esp', {nvar:'q'+X+'_n', pvar:'q'+X+'_p', tavar:'q'+X+'_ta'}));

    } else if (scenario === 'binom-var') {
        vars = `/* Q${X} Proba — Variance binomiale */
ri(a,b):=a+rand(b-a+1);
${declN(25)}
q${X}_p:${declFrac('prob-p', 0.4)};
q${X}_q:1-q${X}_p;
q${X}_ta:q${X}_n*q${X}_p*q${X}_q;`;
        qnote = `V(X)=npq={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('prob.q_binom_var', {nvar:'q'+X+'_n', pvar:'q'+X+'_p'})}</p>
<p>\\(V(X)=\\) [[input:ans_vx${X}]] [[validation:ans_vx${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_vx${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsVar = [
            { description: I18N_D.t('prob.node_vx'), sans: `ans_vx${X}`, tans: `q${X}_ta`, score: 1, kind: _probKind('ok'),
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>` },
            { description: I18N_D.t('prob.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: _probKind('bad'),
                feedback: fbWrong || I18N_D.t('prob.fb_wrong_binom_var', {tavar:'q'+X+'_ta'}) }
        ];
        diagNodes = _probDiagNodes(specsVar);
        var builtVar = _probSeqPrt_D(X, bareme, specsVar);
        prtMeta = builtVar.prtMeta; canonicalNodes = builtVar.canonicalNodes; prtXML = builtVar.prtXML;
        generalFeedback = _probGenFbBox(I18N_D.t('prob.fbgen_binom_var', {nvar:'q'+X+'_n', pvar:'q'+X+'_p', qvar:'q'+X+'_q', tavar:'q'+X+'_ta'}));

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
        textFrag = `${HDR}${custText}<p>${I18N_D.t('prob.q_cond_contexte', {pAvar:'q'+X+'_pA', pBvar:'q'+X+'_pB', 'pD_Avar':'q'+X+'_pD_A', 'pD_Bvar':'q'+X+'_pD_B'})}</p>
<p>${I18N_D.t('prob.q_cond_ask')}</p>
<p>\\(P(A|D)=\\) [[input:ans_cond${X}]] [[validation:ans_cond${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_cond${X}`,tans:`q${X}_ta`,boxsize:20,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsCond = [
            { description: I18N_D.t('prob.node_cond'), sans: `ans_cond${X}`, tans: `q${X}_ta`, score: 1, kind: _probKind('ok'),
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>` },
            { description: I18N_D.t('prob.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: _probKind('bad'),
                feedback: fbWrong || I18N_D.t('prob.fb_wrong_cond', {tavar:'q'+X+'_ta'}) }
        ];
        diagNodes = _probDiagNodes(specsCond);
        var builtCond = _probSeqPrt_D(X, bareme, specsCond);
        prtMeta = builtCond.prtMeta; canonicalNodes = builtCond.canonicalNodes; prtXML = builtCond.prtXML;
        generalFeedback = _probGenFbBox(I18N_D.t('prob.fbgen_cond', {pDvar:'q'+X+'_pD', pADvar:'q'+X+'_pAD', tavar:'q'+X+'_ta'}));

    } else { /* proba-union */
        vars = `/* Q${X} Proba — Union */
ri(a,b):=a+rand(b-a+1);
q${X}_pA:${declFrac('prob-pa', 0.4)};
q${X}_pB:${declFrac('prob-pb', 0.35)};
q${X}_pI:${declFrac('prob-pab', 0.15)};
q${X}_ta:q${X}_pA+q${X}_pB-q${X}_pI;`;
        qnote = `P(A∪B)={@q${X}_ta@}`;
        textFrag = `${HDR}${custText}<p>${I18N_D.t('prob.q_union_contexte', {pAvar:'q'+X+'_pA', pBvar:'q'+X+'_pB', pIvar:'q'+X+'_pI'})}</p>
<p>${I18N_D.t('prob.q_union_ask')}</p>
<p>\\(P(A\\cup B)=\\) [[input:ans_union${X}]] [[validation:ans_union${X}]]</p>`;
        inputXML = mkInput_D({name:`ans_union${X}`,tans:`q${X}_ta`,boxsize:10,checkanswertype:1,mustverify:1,showvalidation:2});

        var specsUnion = [
            { description: I18N_D.t('prob.node_union'), sans: `ans_union${X}`, tans: `q${X}_ta`, score: 1, kind: _probKind('ok'),
                feedback: fbOk || `<strong>${I18N_D.t('mat.fb_ok_correct')}</strong>` },
            { description: I18N_D.t('prob.node_err_generique'), sans: 'true', tans: 'true', score: 0, quiet: true, kind: _probKind('bad'),
                feedback: fbWrong || I18N_D.t('prob.fb_wrong_union', {tavar:'q'+X+'_ta'}) }
        ];
        diagNodes = _probDiagNodes(specsUnion);
        var builtUnion = _probSeqPrt_D(X, bareme, specsUnion);
        prtMeta = builtUnion.prtMeta; canonicalNodes = builtUnion.canonicalNodes; prtXML = builtUnion.prtXML;
        generalFeedback = _probGenFbBox(I18N_D.t('prob.fbgen_union', {pAvar:'q'+X+'_pA', pBvar:'q'+X+'_pB', pIvar:'q'+X+'_pI', tavar:'q'+X+'_ta'}));
    }

    generalFeedback = applyFbBox_D('general', mkFbGen_D(generalFeedback, p.fbGen));

    return {type:'probabilites', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef:`[[feedback:prt${X}]]`,
        diagNodes: diagNodes || []};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genProbabilites: genProbabilites, genProbabilitesCore: genProbabilitesCore };
}

// ─── TRIGONOMÉTRIE ───────────────────────────────────────────
