function genThermo(X) {
    var gs = function(id){ var e=document.getElementById(id); return e?e.value:''; };
    var bareme = parseFloat(gs('thy-bareme')) || 1;
    var scenario = gs('thy-scenario') || 'pression';
    var vars = `/* Q${X} Thermo — ${scenario} (stub) */\nq${X}_ta:0;`;
    var textFrag = `<div style="padding:12px;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;"><strong>Q${X} — Thermo (${scenario})</strong><br>${I18N.t('tpl.stub_non_implemente')}<br>[[input:ans_thy${X}]] [[validation:ans_thy${X}]]</div>`;
    var inputXML = _mkInput({name:`ans_thy${X}`,tans:`q${X}_ta`,boxsize:10});
    var prtMeta = {name:`prt${X}`, value:bareme.toFixed(7), autosimplify:'1', feedbackstyle:'1', feedbackvariables:''};
    var canonicalNodes = [{
        name:'0', description:'stub', answertest:'AlgEquiv',
        sans:`ans_thy${X}`, tans:`q${X}_ta`, testoptions:'', quiet:'0',
        truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
        trueanswernote:`PRT-${X}-OK`, truefeedback:'✅',
        falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
        falseanswernote:`PRT-${X}-NOK`, falsefeedback:'❌'
    }];
    var prtXML = buildPrtXml(prtMeta, canonicalNodes);
    var generalFeedback = _mkFbGen('', gs('thy-fbgen'));
    return {type:'thermo', bareme, vars, qnote:`Q${X} thermo`, textFrag, inputXML, prtXML, generalFeedback, feedbackRef:`[[feedback:prt${X}]]`, prt:{meta:prtMeta, nodes:canonicalNodes}};
}
