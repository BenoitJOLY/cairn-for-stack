// gen-math-equivalence.js — Raisonnement par équivalence (STACK input type "equiv")
// Développement, résolution d'équation, factorisation, système d'équations.

function _eqBuildParams() {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var etapeChecked = !!(document.getElementById('eq-etape-check') || {}).checked;
    return {
        bareme: parseFloat(gs('eq-bareme')) || 1,
        scenario: gs('eq-scenario') || 'developpement',
        custText: gs('eq-text').trim(),
        formule: (gs('eq-formule').trim() || 'x'),
        variable: gs('eq-variable').trim() || 'x',
        variables: gs('eq-variables').trim() || 'x,y',
        resultatOverride: gs('eq-resultat').trim(),
        etapeChecked: etapeChecked,
        etapeVal: etapeChecked ? gs('eq-etape-val').trim() : '',
        fbOk: gs('eq-fb-ok').trim(), fbWrong: gs('eq-fb-wrong').trim(),
        fbGenExtra: gs('eq-fbgen')
    };
}

async function genEquivalence(X) {
    var p = _eqBuildParams();
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: 'equivalence', X, params: p})
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.ok) return data.parts;
        }
        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Quota hebdomadaire atteint.');
        }
        console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "equivalence", repli sur le calcul local (session expirée ?).');
    } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "equivalence", repli sur le calcul local.', e); }
    return genEquivalenceCore(X, p);
}

/* genEquivalenceCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour
   le pattern (deps injectables pour les tests Node — test/unit/gen-math-equivalence.test.js). */
function genEquivalenceCore(X, p, deps) {
    deps = deps || {};
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D      = deps._mkFbGen || _mkFbGen;
    var I18N_D         = deps.I18N || I18N;
    var applyFbBox_D   = deps.applyFbBox || applyFbBox;

    var bareme = p.bareme;
    var scenario = p.scenario;
    var custText = p.custText;
    var formule = p.formule;
    var variable = p.variable;
    var variables = p.variables;
    var resultatOverride = p.resultatOverride;
    var etapeChecked = p.etapeChecked;
    var etapeVal = p.etapeVal;
    var fbOk = p.fbOk, fbWrong = p.fbWrong;

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

    var HDR = `<div style="background:#5b21b6;border-left:5px solid #4c1d95;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('equiv.title')}</strong> <span style="background:#4c1d95;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ${bareme} pt</span></div>`;

    var SCENARIO_LABELS = {
        developpement: I18N_D.t('equiv.qnote_developpement'),
        equation: I18N_D.t('equiv.qnote_equation'),
        factorisation: I18N_D.t('equiv.qnote_factorisation'),
        systeme: I18N_D.t('equiv.qnote_systeme')
    };

    // ── Variables Maxima (donnée de départ + résultat canonique calculé) ──
    var vars = `/* Q${X} — Raisonnement par équivalence (${scenario}) */\nq${X}_formule:${formule};\n`;
    var qLabel;
    if (scenario === 'developpement') {
        vars += `q${X}_resultat:expand(q${X}_formule);\n`;
        qLabel = `${I18N_D.t('equiv.qnote_developpement')} ${'{@'}q${X}_formule@${'}'}`;
    } else if (scenario === 'factorisation') {
        vars += `q${X}_resultat:factor(q${X}_formule);\n`;
        qLabel = `${I18N_D.t('equiv.qnote_factorisation')} ${'{@'}q${X}_formule@${'}'}`;
    } else if (scenario === 'systeme') {
        vars += `q${X}_vars:[${variables}];\n`;
        vars += `q${X}_sol:linsolve(q${X}_formule, q${X}_vars);\n`;
        vars += `q${X}_resultat:if listp(q${X}_sol) and length(q${X}_sol)>0 then xreduce("and", q${X}_sol) else q${X}_sol;\n`;
        qLabel = `${I18N_D.t('equiv.qnote_systeme')} ${'{@'}q${X}_formule@${'}'}`;
    } else { /* equation */
        vars += `q${X}_var:${variable};\n`;
        vars += `q${X}_sol:solve(q${X}_formule, q${X}_var);\n`;
        vars += `q${X}_resultat:if listp(q${X}_sol) and length(q${X}_sol)>1 then xreduce(lambda([a,b], concat(a," ${I18N_D.t('equiv.ou_lbl')} ",b)), map(lambda([s], string(s)), q${X}_sol)) elseif listp(q${X}_sol) and length(q${X}_sol)=1 then q${X}_sol[1] else q${X}_sol;\n`;
        qLabel = `${I18N_D.t('equiv.qnote_equation')} ${'{@'}q${X}_formule@${'}'}`;
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
    var textFrag = `${HDR}${custText}<p>${I18N_D.t('equiv.instruction', {qlabel: qLabel})}</p>
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
    var okFb = fbOk || `<strong>${I18N_D.t('equiv.fb_ok_default')}</strong>`;
    var wrongFb = fbWrong || I18N_D.t('equiv.fb_wrong_default');
    var finalOkFb = `<strong>${I18N_D.t('equiv.fb_final_ok')}</strong>`;
    var finalWrongFb = I18N_D.t('equiv.fb_final_wrong');

    var canonicalNodes;
    var diagNodes = [];
    if (etapeChecked && etapeVal) {
        canonicalNodes = [
            eqNode(0, I18N_D.t('equiv.node_point_depart'), 'EquivFirst', ansName, `q${X}_ta`,
                1, 0.34, 'PRT-'+X+'-0-T', okFb,
                -1, 0, 'PRT-'+X+'-0-F', wrongFb),
            eqNode(1, I18N_D.t('equiv.node_etape_intermediaire'), 'AlgEquiv',
                `not(emptyp(stack_equiv_find_step(q${X}_etape, ${ansName})))`, 'true',
                2, 0.33, 'PRT-'+X+'-1-T', I18N_D.t('equiv.fb_etape_ok'),
                2, 0, 'PRT-'+X+'-1-F', I18N_D.t('equiv.fb_etape_wrong'),
                '+', '+'),
            eqNode(2, I18N_D.t('equiv.node_resultat_final'), 'EqualComAss', `last(${ansName})`, `last(q${X}_ta)`,
                -1, 0.33, 'PRT-'+X+'-2-T', finalOkFb,
                -1, 0, 'PRT-'+X+'-2-F', finalWrongFb,
                '+', '+')
        ];
        diagNodes = [{ desc: canonicalNodes[1].description, fb: canonicalNodes[1].truefeedback || canonicalNodes[1].falsefeedback || '' }];
    } else {
        canonicalNodes = [
            eqNode(0, I18N_D.t('equiv.node_point_depart'), 'EquivFirst', ansName, `q${X}_ta`,
                1, 0.5, 'PRT-'+X+'-0-T', okFb,
                -1, 0, 'PRT-'+X+'-0-F', wrongFb),
            eqNode(1, I18N_D.t('equiv.node_resultat_final'), 'EqualComAss', `last(${ansName})`, `last(q${X}_ta)`,
                -1, 1, 'PRT-'+X+'-1-T', finalOkFb,
                -1, 0.5, 'PRT-'+X+'-1-F', finalWrongFb)
        ];
    }

    var prtMeta = { name: 'prt'+X, value: bareme.toFixed(7), autosimplify: '0', feedbackstyle: '1', feedbackvariables: '' };
    // ── Encadres colores : appliques uniquement sur la copie servant a l'export XML ──
    // canonicalNodes (expose via prt.nodes pour prt-manager.js) reste brut, sans encadre,
    // pour que l'edition manuelle du PRT ne montre jamais de HTML de presentation.
    // Voir js/fb-box.js (applyFbBox). Ordre des noeuds fixe (depart -> [etape] -> resultat
    // final) : le noeud de depart est true/false, les noeuds suivants sont true/partial
    // (etape intermediaire et resultat final sont des demi-succes, jamais un echec sec).
    var fbKinds = (etapeChecked && etapeVal)
        ? [{ t: 'true', f: 'false' }, { t: 'true', f: 'partial' }, { t: 'true', f: 'partial' }]
        : [{ t: 'true', f: 'false' }, { t: 'true', f: 'partial' }];
    var xmlNodes = canonicalNodes.map(function(n, i) {
        return Object.assign({}, n, {
            truefeedback: applyFbBox_D(fbKinds[i].t, n.truefeedback),
            falsefeedback: applyFbBox_D(fbKinds[i].f, n.falsefeedback)
        });
    });
    var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

    var generalFeedback = `<strong>${I18N_D.t('trig.correction_title')}</strong><br>${I18N_D.t('equiv.fbgen_correction', {resvar: '{@q'+X+'_resultat@}'})}`;
    generalFeedback = applyFbBox_D('general', mkFbGen_D(generalFeedback, p.fbGenExtra));

    return {
        type: 'equivalence', bareme, vars, qnote, textFrag, inputXML, prtXML,
        prt: { meta: prtMeta, nodes: canonicalNodes },
        generalFeedback, feedbackRef: `[[feedback:prt${X}]]`,
        diagNodes: diagNodes
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genEquivalence: genEquivalence, genEquivalenceCore: genEquivalenceCore };
}
