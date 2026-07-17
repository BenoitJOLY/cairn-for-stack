// gen-math-equivalence.js — Raisonnement par équivalence (STACK input type "equiv")
// Développement, résolution d'équation, factorisation, système d'équations.

function genEquivalence(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('eq-bareme')) || 1;
    var scenario = gs('eq-scenario') || 'developpement';
    var custText = gs('eq-text').trim();
    var formule = (gs('eq-formule').trim() || 'x');
    var variable = gs('eq-variable').trim() || 'x';
    var variables = gs('eq-variables').trim() || 'x,y';
    var resultatOverride = gs('eq-resultat').trim();
    var etapeChecked = !!(document.getElementById('eq-etape-check') || {}).checked;
    var etapeVal = etapeChecked ? gs('eq-etape-val').trim() : '';
    var fbOk = gs('eq-fb-ok').trim(), fbWrong = gs('eq-fb-wrong').trim();

    function eqNode(name, desc, test, sans, tans, trueNext, trueScore, trueNote, trueFb, falseNext, falseScore, falseNote, falseFb, trueMode, falseMode) {
        return {
            name: String(name), description: desc, answertest: test, sans: sans, tans: tans,
            testoptions: '', quiet: '0',
            truescoremode: trueMode || '=', truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
            trueanswernote: trueNote, truefeedback: trueFb || '',
            falsescoremode: falseMode || '=', falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
            falseanswernote: falseNote, falsefeedback: falseFb || ''
        };
    }

    var HDR = `<div style="background:#5b21b6;border-left:5px solid #4c1d95;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Raisonnement par équivalence</strong> <span style="background:#4c1d95;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    var SCENARIO_LABELS = {
        developpement: 'Développer et simplifier',
        equation: 'Résoudre l’équation',
        factorisation: 'Factoriser',
        systeme: 'Résoudre le système'
    };

    // ── Variables Maxima (donnée de départ + résultat canonique calculé) ──
    var vars = `/* Q${X} — Raisonnement par équivalence (${scenario}) */\nq${X}_formule:${formule};\n`;
    var qLabel;
    if (scenario === 'developpement') {
        vars += `q${X}_resultat:expand(q${X}_formule);\n`;
        qLabel = `Développer ${'{@'}q${X}_formule@${'}'}`;
    } else if (scenario === 'factorisation') {
        vars += `q${X}_resultat:factor(q${X}_formule);\n`;
        qLabel = `Factoriser ${'{@'}q${X}_formule@${'}'}`;
    } else if (scenario === 'systeme') {
        vars += `q${X}_vars:[${variables}];\n`;
        vars += `q${X}_sol:linsolve(q${X}_formule, q${X}_vars);\n`;
        vars += `q${X}_resultat:if listp(q${X}_sol) and length(q${X}_sol)>0 then xreduce("and", q${X}_sol) else q${X}_sol;\n`;
        qLabel = `Résoudre le système ${'{@'}q${X}_formule@${'}'}`;
    } else { /* equation */
        vars += `q${X}_var:${variable};\n`;
        vars += `q${X}_sol:solve(q${X}_formule, q${X}_var);\n`;
        vars += `q${X}_resultat:if listp(q${X}_sol) and length(q${X}_sol)>1 then xreduce(lambda([a,b], concat(a," ou ",b)), map(lambda([s], string(s)), q${X}_sol)) elseif listp(q${X}_sol) and length(q${X}_sol)=1 then q${X}_sol[1] else q${X}_sol;\n`;
        qLabel = `Résoudre l’équation ${'{@'}q${X}_formule@${'}'}`;
    }
    if (resultatOverride) {
        vars += `q${X}_resultat:${resultatOverride};\n`;
    }

    if (etapeChecked && etapeVal) {
        vars += `q${X}_etape:${etapeVal};\n`;
        vars += `q${X}_ta:[q${X}_formule, stackeq(q${X}_etape), stackeq(q${X}_resultat)];\n`;
    } else {
        vars += `q${X}_ta:[q${X}_formule, stackeq(q${X}_resultat)];\n`;
    }

    // ── Énoncé + input equiv (multi-lignes) ──
    var ansName = `ans1_${X}`;
    var textFrag = `${HDR}${custText}<p>${qLabel}, en détaillant les étapes de calcul.</p>
[[input:${ansName}]]
[[validation:${ansName}]]`;

    var qnote = `${SCENARIO_LABELS[scenario]} : {@q${X}_ta@}`;

    var syntaxHint = etapeChecked && etapeVal
        ? `[${formule},stackeq(?),stackeq(?)]`
        : `[${formule},stackeq(?)]`;

    var inputXML = `    <input>
      <name>${ansName}</name>
      <type>equiv</type>
      <tans>q${X}_ta</tans>
      <boxsize>20</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>1</insertstars>
      <syntaxhint><![CDATA[${syntaxHint}]]></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>1</showvalidation>
      <options>firstline</options>
    </input>`;

    // ── Nœuds PRT : EquivFirst (chaîne) → [étape intermédiaire imposée] → EqualComAss (résultat final) ──
    var okFb = `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ ${fbOk || '<strong>Votre point de départ est correct et toutes les étapes sont algébriquement équivalentes entre elles.</strong>'}</div>`;
    var wrongFb = `<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ ${fbWrong || 'Soit votre première ligne ne correspond pas à l’expression de départ, soit une des étapes suivantes n’est pas équivalente à la précédente. Vérifiez chaque ligne de votre raisonnement.'}</div>`;
    var finalOkFb = `<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Vous êtes arrivé au résultat final attendu.</strong></div>`;
    var finalWrongFb = `<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 Vos étapes sont valides, mais votre dernière ligne n’est pas la forme finale attendue.</div>`;

    var canonicalNodes;
    var diagNodes = [];
    if (etapeChecked && etapeVal) {
        canonicalNodes = [
            eqNode(0, 'Point de départ correct et chaîne d’équivalences valide ?', 'EquivFirst', ansName, `q${X}_ta`,
                1, 0.34, 'PRT-'+X+'-0-T', okFb,
                -1, 0, 'PRT-'+X+'-0-F', wrongFb),
            eqNode(1, 'L’étape intermédiaire imposée apparaît-elle dans le raisonnement ?', 'AlgEquiv',
                `not(emptyp(stack_equiv_find_step(q${X}_etape, ${ansName})))`, 'true',
                2, 0.33, 'PRT-'+X+'-1-T', '<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ L’étape intermédiaire imposée est bien présente.</div>',
                2, 0, 'PRT-'+X+'-1-F', '<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 L’étape intermédiaire imposée n’apparaît pas dans votre raisonnement.</div>',
                '+', '+'),
            eqNode(2, 'Résultat final correct ?', 'EqualComAss', `last(${ansName})`, `last(q${X}_ta)`,
                -1, 0.33, 'PRT-'+X+'-2-T', finalOkFb,
                -1, 0, 'PRT-'+X+'-2-F', finalWrongFb,
                '+', '+')
        ];
        diagNodes = [{ desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback || canonicalNodes[1].falsefeedback || '' }];
    } else {
        canonicalNodes = [
            eqNode(0, 'Point de départ correct et chaîne d’équivalences valide ?', 'EquivFirst', ansName, `q${X}_ta`,
                1, 0.5, 'PRT-'+X+'-0-T', okFb,
                -1, 0, 'PRT-'+X+'-0-F', wrongFb),
            eqNode(1, 'Résultat final correct ?', 'EqualComAss', `last(${ansName})`, `last(q${X}_ta)`,
                -1, 1, 'PRT-'+X+'-1-T', finalOkFb,
                -1, 0.5, 'PRT-'+X+'-1-F', finalWrongFb)
        ];
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '0', feedbackstyle: '1', feedbackvariables: '' };
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);

    var generalFeedback = `<div style="padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;"><strong>Correction :</strong><br>La forme finale attendue est {@q${X}_resultat@}.</div>`;
    generalFeedback = _mkFbGen(generalFeedback, gs('eq-fbgen'));

    return {
        type: 'equivalence', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef: `[[feedback:prt${X}]]`,
        diagNodes: diagNodes
    };
}
