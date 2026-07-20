// ── XML GENERATORS: numérique ──

function genNumerical(X){
  const val=sanitizeMaxima(v('num-val').trim());
  if(!val)throw new Error(I18N.t('msg.err_valeur_vide', {n: X}));
  const aideOn=document.getElementById('num-aide-on')?.checked||false;
  const useKbd=aideOn&&document.getElementById('num-h-kbd').checked;
  const p={
    bareme: parseFloat(v('num-bareme'))||1,
    text: richVal('num-text'),
    val: val,
    n: v('num-n'),
    isR: v('num-round')==='y',
    fbc: resolveFb('num-fbc',FB_JUSTE_DEFAULT),
    fbe: resolveFb('num-fbe',FB_FAUX_DEFAULT),
    tolType: v('num-tol-type')==='relative'?'NumRelative':'NumAbsolute',
    tolVal: v('num-tol-val'),
    forbid: v('num-dec')==='y'?'0':'1',
    numFbGen: resolveFb('num-fbgen',''),
    aide: aideOn?buildNumHelp():'',
    useKbd: useKbd
  };
  return genNumericalCore(X, p);
}

/* genNumericalCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour
   le pattern (deps injectables pour les tests Node — test/unit/gen-numerical.test.js). */
function genNumericalCore(X, p, deps){
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var wrapFb_D = deps.wrapFb || wrapFb;

  const bareme=p.bareme, text=p.text, val=p.val, n=p.n, isR=p.isR;
  const fbc=p.fbc, fbe=p.fbe, tolType=p.tolType, tolVal=p.tolVal, forbid=p.forbid;
  const numFbGen=p.numFbGen, aide=p.aide, useKbd=p.useKbd;
  const kbdHtml=useKbd?(deps.buildKbdStackHTML || buildKbdStackHTML)(X):'';
  const qv=isR?`ta${X}:float(round(${val}*10^(${n}-1-floor(log(abs(${val}))/log(10))))/10^(${n}-1-floor(log(abs(${val}))/log(10))));`:`ta${X}:${val};`;
  const vars=`/* Q${X} : Arithmétique (${bareme}pt) */\n${qv}`;
  const qnote=`{@ta${X}@}`;
  const inputLine=useKbd?`${aide}<!--HS-KBD:${X}-->`:`${aide}<p>[[input:ans${X}]] [[validation:ans${X}]]</p>`;
  var prtMeta={name:'prt'+X,value:String(bareme),autosimplify:'1',feedbackstyle:'1',feedbackvariables:''};
  var canonicalNodes=[{
    name:'0', description:'', answertest:tolType, sans:'ans'+X, tans:'ta'+X,
    testoptions:String(tolVal), quiet:'0',
    truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
    trueanswernote:'PRT-'+X+'-1-T', truefeedback:wrapFb_D(fbc, true),
    falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
    falseanswernote:'PRT-'+X+'-1-F', falsefeedback:wrapFb_D(fbe, false)
  }];
  var prtXML=buildPrtXml_D(prtMeta, canonicalNodes);
  return{bareme,vars,qnote,kbdRaw:useKbd?kbdHtml:null,
    textFrag:`
      <div style="background:#059669;border-left:5px solid #047857;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('tpl.num_banniere')}</strong>
        <span style="background:#047857;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#047857;border:1px solid #047857;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('tpl.num_badge_calcul')}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->
      ${inputLine}
	  
    `,
    inputXML:`    <input>
      <name>ans${X}</name>
      <type>numerical</type>
      <tans>ta${X}</tans>
      <boxsize>10</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>${forbid}</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`,
    prtXML: prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
  generalFeedback: `<p><strong>${I18N_D.t('tpl.num_fb_valeur_attendue')}</strong> {@ta${X}@}</p>`+(numFbGen?`<p>${numFbGen}</p>`:''),
  feedbackRef:`[[feedback:prt${X}]]`};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genNumerical: genNumerical, genNumericalCore: genNumericalCore };
}

