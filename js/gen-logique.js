/*
 * StackForge — générateur de questions STACK pour Moodle
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

// ── XML GENERATORS: logique ──
// Refonte : plus de préréglages, le "Type de question" pilote directement
// 6 constructions (table complète, cases manquantes, identifier l'expression,
// équivalence, colonnes intermédiaires, simplification), alignées sur les
// exemples de test/mise à jour/Informatique/tableau logique/*.xml, y compris
// leurs PRT diagnostiques (détection des erreurs types) et leur feedback
// général détaillé (table de vérité complète attendue).

function _lgVars(nbVars) { return nbVars === 3 ? ['P', 'Q', 'R'] : ['P', 'Q']; }

function _lgEval(exprStr, vals, vars) {
    var e = exprStr;
    vars.forEach(function (vn) {
        e = e.replace(new RegExp('\\b' + vn + '\\b', 'g'), vals[vn] ? 'true' : 'false');
    });
    e = e
        .replace(/\bimplies\b/gi, '___impl___')
        .replace(/\bnand\b/gi, '___nand___')
        .replace(/\bnor\b/gi, '___nor___')
        .replace(/\bxor\b/gi, '!==')
        .replace(/\band\b/gi, '&&')
        .replace(/\bor\b/gi, '||')
        .replace(/\bnot\b\s*/gi, '!');
    e = e.replace(/(\S+)\s*___impl___\s*(\S+)/g, '(!$1||$2)')
         .replace(/(\S+)\s*___nand___\s*(\S+)/g, '(!($1&&$2))')
         .replace(/(\S+)\s*___nor___\s*(\S+)/g, '(!($1||$2))');
    try { return !!eval(e); } catch (err) { return null; }
}

function _lgBuildRow(i, vars) {
    var vals = {};
    for (var v = 0; v < vars.length; v++) vals[vars[v]] = !!((i >> (vars.length - 1 - v)) & 1);
    return vals;
}

function _lgAreEquiv(e1, e2, vars, nRows) {
    for (var i = 0; i < nRows; i++) {
        var vals = _lgBuildRow(i, vars);
        if (_lgEval(e1, vals, vars) !== _lgEval(e2, vals, vars)) return false;
    }
    return true;
}

// Notation Unicode courte (utilisée dans les options de listes déroulantes,
// qui ne passent pas par MathJax).
function _lgToUnicode(exprStr) {
    return (exprStr || '')
        .replace(/\bimplies\b/gi, '⇒')
        .replace(/\bnand\b/gi, 'NAND')
        .replace(/\bnor\b/gi, 'NOR')
        .replace(/\bxor\b/gi, '⊕')
        .replace(/\band\b/gi, '∧')
        .replace(/\bor\b/gi, '∨')
        .replace(/\bnot\s*/gi, '¬');
}

// Notation LaTeX (\land, \lor, \neg, \to, \oplus) pour affichage dans le
// texte de la question via MathJax (\( ... \)), conforme aux exemples XML
// de référence (test/mise à jour/Informatique/tableau logique/*.xml).
function _lgToLatex(exprStr) {
    var e = ' ' + (exprStr || '') + ' ';
    e = e
        .replace(/\bimplies\b/gi, ' \\to ')
        .replace(/\bnand\b/gi, ' \\uparrow ')
        .replace(/\bnor\b/gi, ' \\downarrow ')
        .replace(/\bxor\b/gi, ' \\oplus ')
        .replace(/\band\b/gi, ' \\land ')
        .replace(/\bor\b/gi, ' \\lor ')
        .replace(/\bnot\s*/gi, '\\neg ');
    return e.replace(/\s+/g, ' ').trim();
}

function _lgMathBox(exprStr) {
    return '<div style="text-align:center;font-size:1.3rem;font-weight:bold;margin:15px 0;padding:15px;'
        + 'background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;font-family:serif;">'
        + '\\( ' + _lgToLatex(exprStr) + ' \\)</div>';
}

// Encart "Réponse attendue" du feedback général : le contenu brut ne porte
// plus l'encadré (voir js/fb-box.js applyFbBox('general', ...), appliqué au
// point d'export/aperçu uniquement), seulement le libellé + le corps.
function _lgGenFbBox(bodyHtml, I18N_arg) {
    return '<div style="font-weight:bold;color:#0f766e;margin-bottom:15px;">' + (I18N_arg || I18N).t('log.reponse_attendue_lbl') + '</div>' + bodyHtml;
}

// Table de vérité complète (toutes les lignes, même celles non demandées)
// utilisée dans le feedback général pour montrer la solution intégrale.
function _lgFullAnswerTable(vars, exprLatex, allRes, I18N_arg) {
    var resultLbl = (I18N_arg || I18N).t('log.result_col_lbl');
    var head = '<tr style="background:#f1f5f9;">';
    vars.forEach(function (v) { head += '<th style="border:1px solid #94a3b8;padding:8px 22px;">' + v + '</th>'; });
    head += '<th style="border:1px solid #94a3b8;padding:8px 22px;background:#fef9c3;" aria-label="' + resultLbl + '"><span class="sr-only">' + resultLbl + '</span>\\(' + exprLatex + '\\)</th></tr>';
    var body = '';
    for (var i = 0; i < allRes.length; i++) {
        var vals = _lgBuildRow(i, vars);
        body += '<tr' + (i % 2 ? ' style="background:#f8fafc;"' : '') + '>';
        vars.forEach(function (v) { body += '<td style="border:1px solid #94a3b8;padding:8px 22px;text-align:center;">' + (vals[v] ? 1 : 0) + '</td>'; });
        body += '<td style="border:1px solid #94a3b8;padding:8px 22px;text-align:center;background:#f0fdf4;font-weight:bold;color:#15803d;">' + (allRes[i] ? 1 : 0) + '</td></tr>';
    }
    return '<div style="overflow-x:auto;margin:0 auto;width:fit-content;">'
        + '<table style="margin:0 auto;border-collapse:collapse;border:2px solid #334155;background:#fff;font-family:monospace;font-size:1.05rem;">'
        + '<thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
}

function _lgCellInput(name, target) {
    return '<input><name>' + name + '</name>'
        + '<type>algebraic</type><tans>' + target + '</tans>'
        + '<boxsize>3</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
        + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
        + '<forbidwords></forbidwords><allowwords></allowwords>'
        + '<forbidfloat>1</forbidfloat><requirelowestterms>0</requirelowestterms>'
        + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
        + '<showvalidation>0</showvalidation><options></options></input>';
}

function _lgTableHeadRow(vars, colLabels, I18N_arg) {
    var resultLbl = (I18N_arg || I18N).t('log.result_col_lbl');
    var h = '<tr style="background:#ede9fe;">';
    vars.forEach(function (v) { h += '<th style="padding:4px 10px;border:1px solid #c4b5fd;">' + v + '</th>'; });
    colLabels.forEach(function (c) { h += '<th style="padding:4px 10px;border:1px solid #c4b5fd;color:#7c3aed;" aria-label="' + resultLbl + '"><span class="sr-only">' + resultLbl + '</span>' + c + '</th>'; });
    return h + '</tr>';
}

// ── PRT diagnostique séquentiel ──
// specs: liste ordonnée de { description, sans, tans, score (0..1, fraction
// du barème), feedback (html), quiet, answertest }. Chaque noeud arrête
// l'arbre dès qu'il est vrai (truenextnode=-1) ; sinon on passe au suivant.
// Le dernier noeud sert de filet (sans:'true', tans:'true', quiet:true).
function _lgSeqNode(X, idx, isLast, spec) {
    return {
        name: String(idx), description: spec.description || '',
        answertest: spec.answertest || 'AlgEquiv',
        sans: spec.sans, tans: spec.tans,
        testoptions: '', quiet: spec.quiet ? '1' : '0',
        truescoremode: '=', truescore: String(spec.score),
        truepenalty: '0', truenextnode: '-1',
        trueanswernote: 'PRT' + X + '-' + idx + '-T', truefeedback: spec.feedback || '',
        falsescoremode: '=', falsescore: '0', falsepenalty: '0',
        falsenextnode: isLast ? '-1' : String(idx + 1),
        falseanswernote: 'PRT' + X + '-' + idx + '-F', falsefeedback: ''
    };
}
function _lgSeqPrt(X, bareme, specs, buildPrtXmlFn, applyFbBoxFn) {
    // Le dernier spec sert de filet générique (sans:'true', tans:'true') :
    // sa branche fausse est de toute façon inatteignable (le test est
    // toujours vrai), donc on ne le garde pas comme nœud à part — son
    // message passe en falsefeedback du dernier nœud réel, qui devient
    // le nœud terminal.
    var realSpecs = specs.slice(0, -1);
    var fallbackSpec = specs[specs.length - 1];
    var nodes = realSpecs.map(function (spec, idx) { return _lgSeqNode(X, idx, idx === realSpecs.length - 1, spec); });
    if (fallbackSpec && nodes.length) nodes[nodes.length - 1].falsefeedback = fallbackSpec.feedback || '';
    var prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '2', feedbackvariables: '' };
    // ── Encadrés colorés : appliqués uniquement sur la copie servant à l'export XML ──
    // canonicalNodes (exposé via prt.nodes pour prt-manager.js) reste brut, sans
    // encadré. Voir js/fb-box.js (applyFbBox).
    var applyFbBox_D = applyFbBoxFn || applyFbBox;
    var xmlNodes = nodes.map(function (n, idx) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(realSpecs[idx].kind, n.truefeedback),
            falsefeedback: applyFbBox_D('false', n.falsefeedback)
        });
    });
    return { prtMeta: prtMeta, canonicalNodes: nodes, prtXML: (buildPrtXmlFn || buildPrtXml)(prtMeta, xmlNodes) };
}

function genLogiqueParams() {
    var gs = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var nbVars = parseInt(gs('lg-nb-vars')) || 2;
    var nRows = Math.pow(2, _lgVars(nbVars).length);
    return {
        scenario: gs('lg-scenario') || 'table',
        nbVars: nbVars,
        expr: gs('lg-expr') || '(P and Q) or not(P)',
        expr2: gs('lg-expr2') || '',
        expr3: gs('lg-expr3') || '',
        expr4: gs('lg-expr4') || '',
        subexpr1: gs('lg-subexpr1') || '',
        subexpr2: gs('lg-subexpr2') || '',
        tansForm: gs('lg-tans') || '',
        nbBlanks: Math.min(nRows, Math.max(1, parseInt(gs('lg-nb-blanks')) || 2)),
        bareme: parseFloat(gs('lg-bareme')) || 1,
        fbOk: gs('lg-fb-ok'),
        fbWrong: gs('lg-fb-wrong'),
        fbGen: gs('lg-fbgen'),
        text: richVal('lg-text')
    };
}

async function genLogique(X) {
    var p = genLogiqueParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'logique', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "logique", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "logique", repli sur le calcul local.', e); }
    return genLogiqueCore(X, p);
}

function genLogiqueCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var mkInput_D = deps._mkInput || _mkInput;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var lgSeqPrt_D = deps._lgSeqPrt || _lgSeqPrt;
    var lgGenFbBox_D = deps._lgGenFbBox || _lgGenFbBox;
    var applyFbBox_D = deps.applyFbBox || applyFbBox;

    var scenario = p.scenario, nbVars = p.nbVars;
    var vars = _lgVars(nbVars);
    var nRows = Math.pow(2, vars.length);
    var expr = p.expr, expr2 = p.expr2, expr3 = p.expr3, expr4 = p.expr4;
    var subexpr1 = p.subexpr1, subexpr2 = p.subexpr2, tansForm = p.tansForm;
    var nbBlanks = p.nbBlanks, bareme = p.bareme;
    var fbOk = p.fbOk, fbWrong = p.fbWrong, fbGen = p.fbGen, text = p.text;

    var HDR = '<div style="background:#7c3aed;border-left:5px solid #5b21b6;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">' + I18N_D.t('log.title') + '</strong>'
        + '<span style="background:#5b21b6;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span></div>';

    var inputXML = '', prtXML = '', prtMeta, canonicalNodes, questionText, generalFeedback;
    var fbOkFinal, fbWrongFinal;

    if (scenario === 'table' || scenario === 'cases') {
        var isCases = scenario === 'cases';
        var blankSet = {};
        if (isCases) {
            for (var bi = nRows - nbBlanks; bi < nRows; bi++) blankSet[bi] = true;
        } else {
            for (var ti = 0; ti < nRows; ti++) blankSet[ti] = true;
        }
        var allRes = [];
        for (var ri = 0; ri < nRows; ri++) allRes[ri] = _lgEval(expr, _lgBuildRow(ri, vars), vars);

        var items = [];
        var tbl = _lgMathBox(expr)
            + '<table style="border-collapse:collapse;font-family:monospace;">'
            + '<thead>' + _lgTableHeadRow(vars, ['\\(' + _lgToLatex(expr) + '\\)'], I18N_D) + '</thead><tbody>';
        for (var i = 0; i < nRows; i++) {
            var vals = _lgBuildRow(i, vars);
            var res = allRes[i];
            tbl += '<tr style="' + (i % 2 ? 'background:#f9fafb;' : '') + '">';
            vars.forEach(function (v) { tbl += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + (vals[v] ? 1 : 0) + '</td>'; });
            if (blankSet[i]) {
                var name = 'ans' + X + 'r' + i;
                items.push({ row: i, name: name, target: res ? 1 : 0 });
                tbl += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;background:#fefce8;">[[input:' + name + ']][[validation:' + name + ']]</td>';
            } else {
                tbl += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + (res ? 1 : 0) + '</td>';
            }
            tbl += '</tr>';
        }
        tbl += '</tbody></table>';

        items.forEach(function (it) { inputXML += _lgCellInput(it.name, String(it.target)); });

        var sansList = '[' + items.map(function (it) { return it.name; }).join(',') + ']';
        var tansMain = '[' + items.map(function (it) { return it.target; }).join(',') + ']';
        var tansNeg = '[' + items.map(function (it) { return 1 - it.target; }).join(',') + ']';
        var tansRev = '[' + items.map(function (it) { return (allRes[nRows - 1 - it.row] ? 1 : 0); }).join(',') + ']';

        var specs = [
            {
                description: isCases ? 'Cases correctes' : 'Tableau correct',
                sans: sansList, tans: tansMain, score: 1, kind: 'true',
                feedback: fbOk || ('<strong>' + I18N_D.t(isCases ? 'log.cases_ok_title' : 'log.table_ok_title') + '</strong> ' + I18N_D.t(isCases ? 'log.cases_ok_desc' : 'log.table_ok_desc'))
            },
            {
                description: 'Négation calculée',
                sans: sansList, tans: tansNeg, score: 0.5, kind: 'partial',
                feedback: '<strong>' + I18N_D.t('log.presque_ca_title') + '</strong> ' + I18N_D.t('log.neg_desc', {expr: _lgToLatex(expr)})
            }
        ];
        if (items.length >= 2) {
            specs.push({
                description: 'Ordre inversé',
                sans: sansList, tans: tansRev, score: 0.5, kind: 'partial',
                feedback: '<strong>' + I18N_D.t('log.ordre_title') + '</strong> ' + I18N_D.t(nbVars === 3 ? 'log.ordre_3vars_desc' : 'log.ordre_2vars_desc')
            });
        }
        specs.push({
            description: isCases ? 'Cases incorrectes' : 'Tableau incorrect',
            sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'false',
            feedback: fbWrong || ('<strong>' + I18N_D.t('apn.fb_wrong_incorrect') + '</strong> ' + I18N_D.t('log.table_fallback_desc'))
        });

        var built = lgSeqPrt_D(X, bareme, specs, buildPrtXml_D, applyFbBox_D);
        prtMeta = built.prtMeta; canonicalNodes = built.canonicalNodes; prtXML = built.prtXML;

        var instrText = text || '<p>' + I18N_D.t(isCases ? 'log.cases_instr' : 'log.table_instr') + '</p>';
        questionText = HDR + instrText + tbl;
        generalFeedback = applyFbBox_D('general', mkFbGen_D(lgGenFbBox_D('<p>' + I18N_D.t('log.table_genfb_expr', {expr: _lgToLatex(expr)}) + '</p>' + _lgFullAnswerTable(vars, _lgToLatex(expr), allRes, I18N_D), I18N_D), fbGen));

    } else if (scenario === 'identifier') {
        var choices = [
            { key: 'A', ex: expr }, { key: 'B', ex: expr2 },
            { key: 'C', ex: expr3 }, { key: 'D', ex: expr4 }
        ].filter(function (c) { return c.ex; });
        if (!choices.length) choices.push({ key: 'A', ex: expr });

        var allResI = [];
        for (var ri2 = 0; ri2 < nRows; ri2++) allResI[ri2] = _lgEval(expr, _lgBuildRow(ri2, vars), vars);

        var tbl2 = '<table style="border-collapse:collapse;font-family:monospace;">'
            + '<thead>' + _lgTableHeadRow(vars, ['?'], I18N_D) + '</thead><tbody>';
        for (var i2 = 0; i2 < nRows; i2++) {
            var vals2 = _lgBuildRow(i2, vars);
            var res2 = allResI[i2];
            tbl2 += '<tr style="' + (i2 % 2 ? 'background:#f9fafb;' : '') + '">';
            vars.forEach(function (v) { tbl2 += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + (vals2[v] ? 1 : 0) + '</td>'; });
            tbl2 += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;background:#f0fdf4;font-weight:bold;color:#15803d;">' + (res2 ? 1 : 0) + '</td></tr>';
        }
        tbl2 += '</tbody></table>';

        var choiceList = choices.map(function (c) {
            return '["' + c.key + '", ' + (c.key === 'A') + ', "' + _lgToUnicode(c.ex) + '"]';
        }).join(', ');
        var ansName = 'ans' + X;
        inputXML = mkInput_D({ name: ansName, type: 'dropdown', tans: '<![CDATA[[' + choiceList + ']]]>', boxsize: 15, showvalidation: 0 });

        var negChoice = choices.find(function (c) {
            return c.key !== 'A' && _lgAreEquiv(c.ex, 'not(' + expr + ')', vars, nRows);
        });

        var specsI = [{
            description: 'Bonne expression',
            answertest: 'String', sans: ansName, tans: '"A"', score: 1, kind: 'true',
            feedback: fbOk || ('<strong>' + I18N_D.t('log.cases_ok_title') + '</strong> ' + I18N_D.t('log.identifier_ok_desc'))
        }];
        if (negChoice) {
            specsI.push({
                description: 'A choisi la négation de l\'expression',
                answertest: 'String', sans: ansName, tans: '"' + negChoice.key + '"', score: 0.5, kind: 'partial',
                feedback: '<strong>' + I18N_D.t('log.presque_ca_title') + '</strong> ' + I18N_D.t('log.identifier_neg_desc')
            });
        }
        specsI.push({
            description: 'Expression incorrecte',
            sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'false',
            feedback: fbWrong || ('<strong>' + I18N_D.t('apn.fb_wrong_incorrect') + '</strong> ' + I18N_D.t('log.identifier_fallback_desc'))
        });

        var builtI = lgSeqPrt_D(X, bareme, specsI, buildPrtXml_D, applyFbBox_D);
        prtMeta = builtI.prtMeta; canonicalNodes = builtI.canonicalNodes; prtXML = builtI.prtXML;

        var instrText2 = text || '<p>' + I18N_D.t('log.identifier_instr') + '</p>';
        questionText = HDR + instrText2 + tbl2
            + '<div style="text-align:center;margin:16px 0;"><p><strong>' + I18N_D.t('log.expr_correspondante_lbl') + '</strong></p>[[input:' + ansName + ']][[validation:' + ansName + ']]</div>';
        generalFeedback = applyFbBox_D('general', mkFbGen_D(lgGenFbBox_D(_lgFullAnswerTable(vars, _lgToLatex(expr), allResI, I18N_D), I18N_D), fbGen));

    } else if (scenario === 'equivalence') {
        var items3 = [];
        var allResE = {};
        var buildEqTable = function (exprX, tag) {
            var res = [];
            var t = '<table style="border-collapse:collapse;font-family:monospace;">'
                + '<thead>' + _lgTableHeadRow(vars, ['\\(' + _lgToLatex(exprX) + '\\)'], I18N_D) + '</thead><tbody>';
            for (var i = 0; i < nRows; i++) {
                var vals = _lgBuildRow(i, vars);
                var r = _lgEval(exprX, vals, vars);
                res.push(r ? 1 : 0);
                var name = 'ans' + X + tag + i;
                items3.push({ name: name, target: r ? 1 : 0 });
                t += '<tr style="' + (i % 2 ? 'background:#f9fafb;' : '') + '">';
                vars.forEach(function (v) { t += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + (vals[v] ? 1 : 0) + '</td>'; });
                t += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;background:#fefce8;">[[input:' + name + ']][[validation:' + name + ']]</td></tr>';
            }
            allResE[tag] = res;
            return t + '</tbody></table>';
        };
        var tblE1 = buildEqTable(expr, 'e1r');
        var tblE2 = buildEqTable(expr2 || expr, 'e2r');
        var equiv = _lgAreEquiv(expr, expr2 || expr, vars, nRows);
        var eqName = 'ans' + X + 'eq';
        items3.push({ name: eqName, target: equiv ? 'true' : 'false' });

        items3.forEach(function (it) { inputXML += _lgCellInput(it.name, String(it.target)); });

        var e1Names = [], e2Names = [];
        for (var qi = 0; qi < nRows; qi++) { e1Names.push('ans' + X + 'e1r' + qi); e2Names.push('ans' + X + 'e2r' + qi); }
        var fbVarsEq = 'salg' + X + ':[' + e1Names.join(',') + '];\n'
            + 'sblg' + X + ':[' + e2Names.join(',') + '];\n'
            + 'tables_ok_lg' + X + ':is(salg' + X + '=[' + allResE['e1r'].join(',') + '] and sblg' + X + '=[' + allResE['e2r'].join(',') + ']);';

        canonicalNodes = [
            {
                name: '0', description: 'Vérification des tables', answertest: 'AlgEquiv',
                sans: 'tables_ok_lg' + X, tans: 'true', testoptions: '', quiet: '0',
                truescoremode: '=', truescore: '0.5', truepenalty: '0', truenextnode: '1',
                trueanswernote: 'PRT' + X + '-0-T', truefeedback: '',
                falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '2',
                falseanswernote: 'PRT' + X + '-0-F', falsefeedback: ''
            },
            {
                name: '1', description: 'Tables OK → vérifie l\'équivalence', answertest: 'AlgEquiv',
                sans: eqName, tans: equiv ? 'true' : 'false', testoptions: '', quiet: '0',
                truescoremode: '+', truescore: '0.5', truepenalty: '0', truenextnode: '-1',
                trueanswernote: 'PRT' + X + '-1-T',
                truefeedback: fbOk || ('<strong>' + I18N_D.t('mat.fb_ok_parfait') + '</strong> ' + I18N_D.t('log.equiv_ok_desc')),
                falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
                falseanswernote: 'PRT' + X + '-1-F',
                falsefeedback: '<strong>' + I18N_D.t('log.equiv_partial_title') + '</strong> ' + I18N_D.t('log.equiv_partial_desc')
            },
            {
                name: '2', description: 'Tables incorrectes', answertest: 'AlgEquiv',
                sans: 'true', tans: 'true', testoptions: '', quiet: '1',
                truescoremode: '=', truescore: '0', truepenalty: '0', truenextnode: '-1',
                trueanswernote: 'PRT' + X + '-2-T',
                truefeedback: fbWrong || ('<strong>' + I18N_D.t('log.equiv_wrong_title') + '</strong> ' + I18N_D.t('log.equiv_wrong_desc')),
                falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
                falseanswernote: 'PRT' + X + '-2-F', falsefeedback: ''
            }
        ];
        prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVarsEq };
        // ── Encadrés colorés : appliqués uniquement sur la copie servant à l'export XML ──
        // canonicalNodes (exposé via prt.nodes) reste brut. Voir js/fb-box.js.
        var xmlNodesEq = [
            canonicalNodes[0],
            Object.assign({}, canonicalNodes[1], {
                truefeedback: applyFbBox_D('true', canonicalNodes[1].truefeedback),
                falsefeedback: applyFbBox_D('partial', canonicalNodes[1].falsefeedback)
            }),
            Object.assign({}, canonicalNodes[2], { truefeedback: applyFbBox_D('false', canonicalNodes[2].truefeedback) })
        ];
        prtXML = buildPrtXml_D(prtMeta, xmlNodesEq);

        var instrText3 = text || '<p>' + I18N_D.t('log.equiv_instr') + '</p>';
        questionText = HDR + instrText3
            + '<div style="display:flex;gap:24px;flex-wrap:wrap;">'
            + '<div><p><strong>' + I18N_D.t('log.e1_lbl') + '</strong> \\(' + _lgToLatex(expr) + '\\)</p>' + tblE1 + '</div>'
            + '<div><p><strong>' + I18N_D.t('log.e2_lbl') + '</strong> ' + (expr2 ? '\\(' + _lgToLatex(expr2) + '\\)' : '—') + '</p>' + tblE2 + '</div>'
            + '</div>'
            + '<div style="margin-top:12px;"><p><strong>' + I18N_D.t('log.equivalentes_lbl') + '</strong> [[input:' + eqName + ']][[validation:' + eqName + ']]</p></div>';

        var eqGenBody = '<p style="text-align:center;margin-bottom:15px;font-size:1.05rem;"><strong>' + I18N_D.t('log.equiv_result_prefix') + ' ' + I18N_D.t(equiv ? 'log.equiv_yes' : 'log.equiv_no') + '</strong></p>'
            + '<div style="overflow-x:auto;width:fit-content;margin:0 auto;"><table style="margin:0 auto;border-collapse:collapse;border:2px solid #334155;background:#fff;font-family:monospace;font-size:1.05rem;">'
            + '<thead><tr style="background:#f1f5f9;">'
            + vars.map(function (v) { return '<th style="border:1px solid #94a3b8;padding:8px 18px;">' + v + '</th>'; }).join('')
            + '<th style="border:1px solid #94a3b8;padding:8px 18px;background:#dbeafe;">\\(' + _lgToLatex(expr) + '\\)</th>'
            + '<th style="border:1px solid #94a3b8;padding:8px 18px;background:#fef3c7;">\\(' + _lgToLatex(expr2 || expr) + '\\)</th>'
            + '<th style="border:1px solid #94a3b8;padding:8px 18px;">' + I18N_D.t('log.identique_lbl') + '</th></tr></thead><tbody>';
        for (var qj = 0; qj < nRows; qj++) {
            var valsQ = _lgBuildRow(qj, vars);
            var vA = allResE['e1r'][qj], vB = allResE['e2r'][qj];
            eqGenBody += '<tr' + (qj % 2 ? ' style="background:#f8fafc;"' : '') + '>'
                + vars.map(function (v) { return '<td style="border:1px solid #94a3b8;padding:8px 18px;text-align:center;">' + (valsQ[v] ? 1 : 0) + '</td>'; }).join('')
                + '<td style="border:1px solid #94a3b8;padding:8px 18px;text-align:center;font-weight:bold;">' + vA + '</td>'
                + '<td style="border:1px solid #94a3b8;padding:8px 18px;text-align:center;font-weight:bold;">' + vB + '</td>'
                + '<td style="border:1px solid #94a3b8;padding:8px 18px;text-align:center;font-size:1.2rem;">' + (vA === vB ? '✅' : '❌') + '</td></tr>';
        }
        eqGenBody += '</tbody></table></div>';
        generalFeedback = applyFbBox_D('general', mkFbGen_D(lgGenFbBox_D(eqGenBody, I18N_D), fbGen));

    } else if (scenario === 'intermediaire') {
        var se1 = subexpr1 || '(P and Q)';
        var se2 = subexpr2 || 'not(P)';
        var items4 = [];
        var allResFin = [], allResS1 = [], allResS2 = [];
        var tbl4 = '<table style="border-collapse:collapse;font-family:monospace;">'
            + '<thead><tr style="background:#ede9fe;">';
        vars.forEach(function (v) { tbl4 += '<th style="padding:4px 10px;border:1px solid #c4b5fd;">' + v + '</th>'; });
        tbl4 += '<th style="padding:4px 10px;border:1px solid #bfdbfe;background:#dbeafe;">\\(' + _lgToLatex(se1) + '\\)</th>'
            + '<th style="padding:4px 10px;border:1px solid #bfdbfe;background:#dbeafe;">\\(' + _lgToLatex(se2) + '\\)</th>'
            + '<th style="padding:4px 10px;border:1px solid #c4b5fd;color:#7c3aed;">\\(' + _lgToLatex(expr) + '\\)</th></tr></thead><tbody>';
        var n1Names = [], n2Names = [], nfNames = [];
        for (var i4 = 0; i4 < nRows; i4++) {
            var vals4 = _lgBuildRow(i4, vars);
            var r1 = _lgEval(se1, vals4, vars), r2 = _lgEval(se2, vals4, vars), rf = _lgEval(expr, vals4, vars);
            allResS1.push(r1 ? 1 : 0); allResS2.push(r2 ? 1 : 0); allResFin.push(rf ? 1 : 0);
            var n1 = 'ans' + X + 's1r' + i4, n2 = 'ans' + X + 's2r' + i4, nf = 'ans' + X + 'fr' + i4;
            n1Names.push(n1); n2Names.push(n2); nfNames.push(nf);
            items4.push({ name: n1, target: r1 ? 1 : 0 }, { name: n2, target: r2 ? 1 : 0 }, { name: nf, target: rf ? 1 : 0 });
            tbl4 += '<tr style="' + (i4 % 2 ? 'background:#f9fafb;' : '') + '">';
            vars.forEach(function (v) { tbl4 += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;">' + (vals4[v] ? 1 : 0) + '</td>'; });
            tbl4 += '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;background:#eff6ff;">[[input:' + n1 + ']][[validation:' + n1 + ']]</td>'
                + '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;background:#eff6ff;">[[input:' + n2 + ']][[validation:' + n2 + ']]</td>'
                + '<td style="text-align:center;padding:3px 10px;border:1px solid #e5e7eb;background:#fefce8;">[[input:' + nf + ']][[validation:' + nf + ']]</td></tr>';
        }
        tbl4 += '</tbody></table>';

        items4.forEach(function (it) { inputXML += _lgCellInput(it.name, String(it.target)); });

        var allNames = n1Names.concat(n2Names, nfNames);
        var allTargets = allResS1.concat(allResS2, allResFin);
        var interNames = n1Names.concat(n2Names);
        var interTargets = allResS1.concat(allResS2);

        var specs4 = [
            {
                description: 'Tout correct',
                sans: '[' + allNames.join(',') + ']', tans: '[' + allTargets.join(',') + ']', score: 1, kind: 'true',
                feedback: fbOk || ('<strong>' + I18N_D.t('mat.fb_ok_parfait') + '</strong> ' + I18N_D.t('log.inter_ok_desc'))
            },
            {
                description: 'Sous-expressions correctes, finale fausse',
                sans: '[' + interNames.join(',') + ']', tans: '[' + interTargets.join(',') + ']', score: 0.5, kind: 'partial',
                feedback: '<strong>' + I18N_D.t('log.inter_partial1_title') + '</strong> ' + I18N_D.t('log.inter_partial1_desc')
            },
            {
                description: 'Seule la finale est correcte',
                sans: '[' + nfNames.join(',') + ']', tans: '[' + allResFin.join(',') + ']', score: 0.3, kind: 'partial',
                feedback: '<strong>' + I18N_D.t('log.inter_partial2_title') + '</strong> ' + I18N_D.t('log.inter_partial2_desc')
            },
            {
                description: 'Tout incorrect',
                sans: 'true', tans: 'true', score: 0, quiet: true, kind: 'false',
                feedback: fbWrong || ('<strong>' + I18N_D.t('apn.fb_wrong_incorrect') + '</strong> ' + I18N_D.t('log.inter_fallback_desc'))
            }
        ];
        var built3 = lgSeqPrt_D(X, bareme, specs4, buildPrtXml_D, applyFbBox_D);
        prtMeta = built3.prtMeta; canonicalNodes = built3.canonicalNodes; prtXML = built3.prtXML;

        var instrText4 = text || '<p>' + I18N_D.t('log.inter_instr') + '</p>';
        questionText = HDR + instrText4 + _lgMathBox(expr) + tbl4;

        var interBody = '<div style="overflow-x:auto;width:fit-content;margin:0 auto;"><table style="margin:0 auto;border-collapse:collapse;border:2px solid #334155;background:#fff;font-family:monospace;font-size:1.05rem;">'
            + '<thead><tr style="background:#f1f5f9;">'
            + vars.map(function (v) { return '<th style="border:1px solid #94a3b8;padding:8px 20px;">' + v + '</th>'; }).join('')
            + '<th style="border:1px solid #94a3b8;padding:8px 20px;background:#dbeafe;">\\(' + _lgToLatex(se1) + '\\)</th>'
            + '<th style="border:1px solid #94a3b8;padding:8px 20px;background:#dbeafe;">\\(' + _lgToLatex(se2) + '\\)</th>'
            + '<th style="border:1px solid #94a3b8;padding:8px 20px;background:#fef9c3;">\\(' + _lgToLatex(expr) + '\\)</th></tr></thead><tbody>';
        for (var qk = 0; qk < nRows; qk++) {
            var valsK = _lgBuildRow(qk, vars);
            interBody += '<tr' + (qk % 2 ? ' style="background:#f8fafc;"' : '') + '>'
                + vars.map(function (v) { return '<td style="border:1px solid #94a3b8;padding:8px 20px;text-align:center;">' + (valsK[v] ? 1 : 0) + '</td>'; }).join('')
                + '<td style="border:1px solid #94a3b8;padding:8px 20px;text-align:center;background:#f0fdf4;font-weight:bold;color:#15803d;">' + allResS1[qk] + '</td>'
                + '<td style="border:1px solid #94a3b8;padding:8px 20px;text-align:center;background:#f0fdf4;font-weight:bold;color:#15803d;">' + allResS2[qk] + '</td>'
                + '<td style="border:1px solid #94a3b8;padding:8px 20px;text-align:center;background:#f0fdf4;font-weight:bold;color:#15803d;">' + allResFin[qk] + '</td></tr>';
        }
        interBody += '</tbody></table></div>';
        generalFeedback = applyFbBox_D('general', mkFbGen_D(lgGenFbBox_D(interBody, I18N_D), fbGen));

    } else { // simplif
        var tansMaxima = tansForm || expr;
        var ansName2 = 'ans' + X;
        inputXML = '<input><name>' + ansName2 + '</name>'
            + '<type>algebraic</type><tans>' + tansMaxima + '</tans>'
            + '<boxsize>15</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>'
            + '<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>'
            + '<forbidwords></forbidwords><allowwords></allowwords>'
            + '<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>'
            + '<checkanswertype>0</checkanswertype><mustverify>0</mustverify>'
            + '<showvalidation>0</showvalidation><options></options></input>';

        fbOkFinal = fbOk || ('<p>' + I18N_D.t('log.simplif_ok_desc', {tans: tansMaxima}) + '</p>');
        fbWrongFinal = fbWrong || ('<p>' + I18N_D.t('log.simplif_wrong_desc', {tans: tansMaxima}) + '</p>');
        canonicalNodes = [{
            name: '0', description: '', answertest: 'PropLogic', sans: ansName2, tans: tansMaxima,
            testoptions: '', quiet: '0',
            truescoremode: '=', truescore: String(bareme), truepenalty: '0', truenextnode: '-1',
            trueanswernote: 'PRT' + X + '-1-T', truefeedback: fbOkFinal,
            falsescoremode: '=', falsescore: '0', falsepenalty: '0', falsenextnode: '-1',
            falseanswernote: 'PRT' + X + '-1-F', falsefeedback: fbWrongFinal
        }];
        prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
        // ── Encadrés colorés : appliqués uniquement sur la copie servant à l'export XML ──
        var xmlNodesS = [Object.assign({}, canonicalNodes[0], {
            truefeedback: applyFbBox_D('true', canonicalNodes[0].truefeedback),
            falsefeedback: applyFbBox_D('false', canonicalNodes[0].falsefeedback)
        })];
        prtXML = buildPrtXml_D(prtMeta, xmlNodesS);

        var instrText5 = text || ('<p>' + I18N_D.t('log.simplif_instr1') + '</p>'
            + _lgMathBox(expr)
            + '<p>' + I18N_D.t('log.simplif_instr2') + '</p>');
        questionText = HDR + instrText5 + '[[input:' + ansName2 + ']][[validation:' + ansName2 + ']]';
        generalFeedback = applyFbBox_D('general', mkFbGen_D(lgGenFbBox_D('<p>' + I18N_D.t('log.simplif_genfb_line1', {tans: _lgToLatex(tansMaxima)}) + '</p><p>' + I18N_D.t('log.simplif_genfb_line2', {expr: _lgToLatex(expr)}) + '</p>', I18N_D), fbGen));
    }

    questionText += '[[feedback:prt' + X + ']]';

    return {
        type: 'logique', bareme: bareme, vars: '',
        qnote: '',
        textFrag: questionText, inputXML: inputXML, prtXML: prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback: generalFeedback, feedbackRef: '[[feedback:prt' + X + ']]'
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genLogique: genLogique, genLogiqueCore: genLogiqueCore, genLogiqueParams: genLogiqueParams };
}

// ==============================================================

// ── Types mathématiques avancés : voir js/generators-math.js ──────
