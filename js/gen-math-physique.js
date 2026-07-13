function genPhysique(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('phy-bareme')) || 1;
    var scenario = gs('phy-scenario') || 'mrua-vitesse';
    var vars = `/* Q${X} Physique — ${scenario} (stub) */\nq${X}_ta:0;`;
    var textFrag = `<div style="padding:12px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;"><strong>Q${X} — Physique (${scenario})</strong><br>${I18N.t('tpl.stub_non_implemente')}<br>[[input:ans_phy${X}]] [[validation:ans_phy${X}]]</div>`;
    var inputXML = _mkInput({name:`ans_phy${X}`,tans:`q${X}_ta`,boxsize:10});
    var prtMeta = {name:`prt${X}`, value:bareme.toFixed(7), autosimplify:'1', feedbackstyle:'1', feedbackvariables:''};
    var canonicalNodes = [{
        name:'0', description:'stub', answertest:'AlgEquiv',
        sans:`ans_phy${X}`, tans:`q${X}_ta`, testoptions:'', quiet:'0',
        truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
        trueanswernote:`PRT-${X}-OK`, truefeedback:'✅',
        falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
        falseanswernote:`PRT-${X}-NOK`, falsefeedback:'❌'
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);
    var generalFeedback = _mkFbGen('', gs('phy-fbgen'));
    return {type:'physique', bareme, vars, qnote:`Q${X} physique`, textFrag, inputXML, prtXML, generalFeedback, feedbackRef:`[[feedback:prt${X}]]`, prt:{meta:prtMeta, nodes:canonicalNodes}};
}

// ─── INÉQUATIONS ─────────────────────────────────────────────

