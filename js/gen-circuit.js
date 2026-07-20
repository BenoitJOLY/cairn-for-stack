// ── XML GENERATORS: circuit électrique ──

function genCircuit(X) {
    var gv = function(id) { var el=document.getElementById(id); return el?parseFloat(el.value)||0:0; };
    var gs = function(id) { var el=document.getElementById(id); return el?el.value:""; };

    var p = {
        scenario: gs("cir-scenario") || "loi-ohm",
        ask:      gs("cir-ask")      || "i",
        e:        gv("cir-e")  || 9,
        r1:       gv("cir-r1") || 100,
        r2:       gv("cir-r2") || 220,
        r3:       gv("cir-r3") || 0,
        iKnown:   gv("cir-i-known") / 1000,
        tol:      gv("cir-tol") || 5,
        bareme:   parseFloat(gv("cir-bareme")) || 1,
        fbOk:     gs("cir-fb-ok"),
        fbWrong:  gs("cir-fb-wrong"),
        text:     richVal("cir-text"),
        fbGen:    gs("cir-fbgen")
    };
    return genCircuitCore(X, p);
}

/* genCircuitCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-circuit.test.js). */
function genCircuitCore(X, p, deps) {
    deps = deps || {};
    var I18N_D = deps.I18N || I18N;
    var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
    var mkFbGen_D = deps._mkFbGen || _mkFbGen;

    var scenario = p.scenario, ask = p.ask, e = p.e, r1 = p.r1, r2 = p.r2, r3 = p.r3;
    var iKnown = p.iKnown, tol = p.tol, bareme = p.bareme, fbOk = p.fbOk, fbWrong = p.fbWrong, text = p.text;

    var req = 0, I = 0, I1 = 0, I2 = 0, tansJS = 0;
    if (scenario === "loi-ohm") {
        if (ask === "i") tansJS = r1 > 0 ? e / r1 : 0;
        if (ask === "r") tansJS = iKnown > 0 ? e / iKnown : 0;
        if (ask === "u") tansJS = r1 * iKnown;
    } else if (scenario === "serie") {
        req = r1 + r2 + (r3 > 0 ? r3 : 0);
        I   = req > 0 ? e / req : 0;
        if (ask === "r-eq") tansJS = req;
        if (ask === "i")    tansJS = I;
        if (ask === "u1")   tansJS = r1 * I;
        if (ask === "u2")   tansJS = r2 * I;
        if (ask === "u3")   tansJS = r3 * I;
    } else {
        req  = r1 > 0 && r2 > 0 ? 1/(1/r1+1/r2) : 0;
        I    = req > 0 ? e / req : 0;
        I1   = r1 > 0 ? e / r1 : 0;
        I2   = r2 > 0 ? e / r2 : 0;
        if (ask === "r-eq")    tansJS = req;
        if (ask === "i-total") tansJS = I;
        if (ask === "i1")      tansJS = I1;
        if (ask === "i2")      tansJS = I2;
    }

    var isI  = (ask === "i" || ask === "i-total" || ask === "i1" || ask === "i2");
    var isU  = (ask === "u" || ask.charAt(0) === "u");
    var unit = isI ? "A" : isU ? "V" : "Ohm";

    var fmtSI = function(v, u) {
        var a = Math.abs(v);
        if (a === 0) return "0 " + u;
        if (a < 0.1) return (v*1000).toFixed(2) + " m" + u;
        if (a >= 1000) return (v/1000).toFixed(3) + " k" + u;
        return v.toFixed(4).replace(/\.?0+$/, "") + " " + u;
    };
    var tansStr = fmtSI(tansJS, unit);

    var qvars = "", tansMaxima = "";
    var tolFrac = (tol / 100).toFixed(4);

    if (scenario === "loi-ohm") {
        if (ask === "i") {
            qvars = "cir_e:" + e + "; cir_r:" + r1 + ";\ncir_i:cir_e/cir_r;\ntans:cir_i;\n";
            tansMaxima = String(e) + "/" + String(r1);
        } else if (ask === "r") {
            var iA = iKnown.toFixed(6);
            qvars = "cir_e:" + e + "; cir_i:" + iA + ";\ncir_r:cir_e/cir_i;\ntans:cir_r;\n";
            tansMaxima = e + "/" + iA;
        } else {
            var iA2 = iKnown.toFixed(6);
            qvars = "cir_r:" + r1 + "; cir_i:" + iA2 + ";\ncir_u:cir_r*cir_i;\ntans:cir_u;\n";
            tansMaxima = r1 + "*" + iA2;
        }
    } else if (scenario === "serie") {
        var hasR3 = (r3 > 0);
        qvars = "cir_e:" + e + "; cir_r1:" + r1 + "; cir_r2:" + r2 + "; cir_r3:" + (hasR3?r3:0) + ";\n"
              + "cir_req:cir_r1+cir_r2+cir_r3;\n"
              + "cir_i:cir_e/cir_req;\n"
              + "cir_u1:cir_r1*cir_i; cir_u2:cir_r2*cir_i; cir_u3:cir_r3*cir_i;\n";
        if (ask === "r-eq") { qvars += "tans:cir_req;\n"; tansMaxima = String(r1+r2+(hasR3?r3:0)); }
        if (ask === "i")    { qvars += "tans:cir_i;\n"; }
        if (ask === "u1")   { qvars += "tans:cir_u1;\n"; }
        if (ask === "u2")   { qvars += "tans:cir_u2;\n"; }
        if (ask === "u3")   { qvars += "tans:cir_u3;\n"; }
        if (!tansMaxima) tansMaxima = String(tansJS.toFixed(8));
    } else {
        qvars = "cir_e:" + e + "; cir_r1:" + r1 + "; cir_r2:" + r2 + ";\n"
              + "cir_req:1/(1/cir_r1+1/cir_r2);\n"
              + "cir_i_tot:cir_e/cir_req;\n"
              + "cir_i1:cir_e/cir_r1; cir_i2:cir_e/cir_r2;\n";
        if (ask === "r-eq")    { qvars += "tans:cir_req;\n"; }
        if (ask === "i-total") { qvars += "tans:cir_i_tot;\n"; }
        if (ask === "i1")      { qvars += "tans:cir_i1;\n"; }
        if (ask === "i2")      { qvars += "tans:cir_i2;\n"; }
        tansMaxima = String(tansJS.toFixed(8));
    }

    var inputXML = "<input><name>ans" + X + "</name>"
        + "<type>algebraic</type><tans>" + tansMaxima + "</tans>"
        + "<boxsize>10</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>"
        + "<syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>"
        + "<forbidwords></forbidwords><allowwords></allowwords>"
        + "<forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>"
        + "<checkanswertype>0</checkanswertype><mustverify>0</mustverify>"
        + "<showvalidation>0</showvalidation><options></options></input>";

    var feedVars = "cir_tol_frac:" + tolFrac + ";\n"
        + "cir_err:if is(tans = 0) then abs(ans" + X + ") else abs((ans" + X + " - tans)/tans);\n"
        + "cir_ok:is(cir_err < cir_tol_frac);\n";

    var fbOkFinal    = fbOk    || "<p>&#10003; <strong>" + I18N_D.t('cir.fb_ok_default') + "</strong> " + tansStr + "</p>";
    var fbWrongFinal = fbWrong || ("<p>&#10007; <strong>" + I18N_D.t('cir.fb_wrong_default') + "</strong> " + I18N_D.t('cir.fb_wrong_valeur_attendue') + tansStr + " (+-" + tol + "%).</p>");

    var prtMeta = { name: "prt" + X, value: "1", autosimplify: "1", feedbackstyle: "1", feedbackvariables: feedVars };
    var canonicalNodes = [{
        name: "0", description: "", answertest: "AlgEquiv", sans: "cir_ok", tans: "true",
        testoptions: "", quiet: "0",
        truescoremode: "=", truescore: String(bareme), truepenalty: "0", truenextnode: "-1",
        trueanswernote: "PRT" + X + "-1-T", truefeedback: fbOkFinal,
        falsescoremode: "=", falsescore: "0", falsepenalty: "0", falsenextnode: "-1",
        falseanswernote: "PRT" + X + "-1-F", falsefeedback: fbWrongFinal
    }];
    var prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    var scenarioLabel = scenario === "loi-ohm" ? I18N_D.t('cir.scenario_label_ohm') : I18N_D.t('cir.scenario_label_prefix') + scenario;
    var askLabels = {
        i: I18N_D.t('cir.ask_lbl_i'), r: I18N_D.t('cir.ask_lbl_r'), u: I18N_D.t('cir.ask_lbl_u'),
        "r-eq": I18N_D.t('cir.ask_lbl_r_eq'), "i-total": I18N_D.t('cir.ask_lbl_i_total'),
        u1: I18N_D.t('cir.ask_lbl_u1'), u2: I18N_D.t('cir.ask_lbl_u2'), u3: I18N_D.t('cir.ask_lbl_u3'),
        i1: I18N_D.t('cir.ask_lbl_i1'), i2: I18N_D.t('cir.ask_lbl_i2')
    };
    var askLabel = askLabels[ask] || ask;
    var instrText = text || ("<p>" + I18N_D.t('cir.instr_line1', {scenario: scenarioLabel, ask: askLabel, unit: unit}) + "</p>"
        + "<p style=\"font-size:.85em;color:#6b7280;\">" + I18N_D.t('cir.instr_line2', {unit: unit, tol: String(tol)}) + "</p>");

    var questionText = instrText
        + "[[input:ans" + X + "]][[validation:ans" + X + "]]"
        + "[[feedback:prt" + X + "]]";

    return {
        type:            "circuit",
        bareme:          bareme,
        vars:            qvars,
        qnote:           "Circuit Q" + X + " " + scenario + " ask=" + ask + " ans=" + tansStr,
        textFrag:        questionText,
        inputXML:        inputXML,
        prtXML:          prtXML,
        generalFeedback: mkFbGen_D("", p.fbGen),
        feedbackRef:     "[[feedback:prt" + X + "]]",
        prt:             { meta: prtMeta, nodes: canonicalNodes }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genCircuit: genCircuit, genCircuitCore: genCircuitCore };
}

// ==============================================================
//  genLogique — Logique booleenne
//  Scenarios : table | simplif | equivalent
//  STACK answertests : AlgEquiv (table/equiv), PropLogic (simplif)
// ==============================================================
