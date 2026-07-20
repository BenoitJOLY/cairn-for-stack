// ── XML GENERATORS: algébrique ──

function genAlgebraic(X){
  const formula=sanitizeMaxima(v('alg-formula').trim());
  const mode=v('alg-mode')||'libre';
  const exprDisplay=sanitizeMaxima((document.getElementById('alg-expr-display')?.value||'').trim());
  const errorExpr=sanitizeMaxima((document.getElementById('alg-error')?.value||'').trim());
  if(!formula)throw new Error(I18N.t('msg.err_formule_vide', {n: X}));
  if(!exprDisplay)throw new Error(I18N.t('msg.err_expr_display_vide', {n: X}));
  if(typeof algSyntaxIssues==='function'){
    [[I18N.t('msg.alg_label_reponse_attendue'),formula],[I18N.t('msg.alg_label_expr_affichee'),exprDisplay],[I18N.t('msg.alg_label_erreur_classique'),errorExpr]].forEach(function(pair){
      const issues=algSyntaxIssues(pair[1]);
      if(issues.length)throw new Error('Q'+X+' — '+pair[0]+' : '+issues.join(' '));
    });
  }
  const formVars=(v('alg-vars')||'').split(',').map(s=>s.trim()).filter(Boolean);
  const poolVars=(typeof getPoolVarNames==='function')?getPoolVarNames():[];
  const p={
    bareme: parseFloat(v('alg-bareme'))||1,
    text: richVal('alg-text'),
    formula, mode, exprDisplay, errorExpr,
    fbc: resolveFb('alg-fbc',FB_JUSTE_DEFAULT),
    fbe: resolveFb('alg-fbe',FB_FAUX_DEFAULT),
    sol: richVal('alg-sol'),
    aide: (document.getElementById('alg-aide-on')?.checked||false) ? buildAlgHelp() : '',
    useKbd: (document.getElementById('alg-aide-on')?.checked||false) && document.getElementById('alg-h-kbd').checked,
    formVars, poolVars,
    algFb: {
      developpement: { partial: _algFb('developpement','partial'), errsigne: _algFb('developpement','errsigne') },
      factorisation: { partial: _algFb('factorisation','partial') },
      fraction: { partial: _algFb('fraction','partial') },
      expert: { partial: _algFb('expert','partial'), errsigne: _algFb('expert','errsigne') }
    }
  };
  return genAlgebraicCore(X, p);
}

/* genAlgebraicCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-algebraic.test.js). */
function genAlgebraicCore(X, p, deps){
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var wrapFb_D = deps.wrapFb || wrapFb;
  var algPrtNodeCanonical_D = deps.algPrtNodeCanonical || algPrtNodeCanonical;

  const bareme=p.bareme, text=p.text, formula=p.formula, mode=p.mode;
  const exprDisplay=p.exprDisplay, errorExpr=p.errorExpr;
  const fbc=p.fbc, fbe=p.fbe, sol=p.sol, aide=p.aide, useKbd=p.useKbd;
  const kbdHtml=useKbd?(deps.buildKbdStackHTML || buildKbdStackHTML)(X):'';
  const allowWords=[...new Set([...p.formVars,...p.poolVars])].join(',');
  const mainVar=p.formVars[0]||'x';
  // Maxima variables block
  const hasDisplay=!!exprDisplay;
  const hasError=!!errorExpr;
  const varsLines=[`/* Q${X} : Algébrique — ${mode} (${bareme}pt) */`];
  if(hasDisplay)varsLines.push(`exp${X}:${exprDisplay};`);
  varsLines.push(`ta${X}:${formula};`);
  if(hasError)varsLines.push(`erreur${X}:${errorExpr};`);
  const vars=varsLines.join('\n');
  const qnote=hasDisplay?`{@exp${X}@}`:`{@ta${X}@}`;
  const tansEquiv=hasDisplay?`exp${X}`:`ta${X}`;
  // Feedback
  const fbOK=wrapFb_D(fbc,true);
  const fbKO=wrapFb_D(fbe,false);
  // PRT nodes — structures alignées sur les fichiers de référence
  let canonicalNodes=[];
  const _a='ans'+X, _t='ta'+X, _e='erreur'+X, _te=tansEquiv;
  if(mode==='libre'){
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_t,'', -1,1, -1,0, fbOK,fbKO,
      'PRT-CORRECT','PRT-WRONG','Vérification de la réponse')];
  }else if(mode==='developpement'){
    const fbPartialDev=wrapFb_D(p.algFb.developpement.partial,false);
    const fbErrSigne=wrapFb_D(p.algFb.developpement.errsigne,false);
    const fn0=hasError?2:-1;
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, fn0,0, '',hasError?'':fbKO,
      'PRT-EQUAL-GO-ON',hasError?'PRT-NOT-EQUAL-CHECK-ERR':'PRT-WRONG','Vérification algébrique'),
      algPrtNodeCanonical_D(X,1,'Expanded',_a,_t,'', -1,1, -1,0.25, fbOK,fbPartialDev,
      'PRT-CORRECT-MAX','PRT-CORRECT-NOT-REDUCED','Vérification développement et réduction')];
    if(hasError)canonicalNodes.push(algPrtNodeCanonical_D(X,2,'AlgEquiv',_a,_e,'', -1,0.5, -1,0, fbErrSigne,fbKO,
      'PRT-BUG-ERR-FOUND','PRT-WRONG-TOTAL','Détection erreur de signe'));
  }else if(mode==='factorisation'){
    const fbPartialFac=wrapFb_D(p.algFb.factorisation.partial,false);
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, -1,0, '','',
      'PRT-EQUAL-GO-ON','PRT-WRONG','Vérification algébrique'),
      algPrtNodeCanonical_D(X,1,'FacForm',_a,_t,mainVar, -1,1, -1,0.25, fbOK,fbPartialFac,
      'PRT-FAC-MAX','PRT-NOT-MAX','Vérification factorisation maximale')];
  }else if(mode==='fraction'){
    const fbPartialFrac=wrapFb_D(p.algFb.fraction.partial,false);
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, -1,0, '','',
      'PRT-EQUAL-GO-ON','PRT-WRONG','Vérification algébrique'),
      algPrtNodeCanonical_D(X,1,'FacForm',_a,_t,mainVar, -1,1, -1,0.5, fbOK,fbPartialFrac,
      'PRT-SIMPLE-MAX','PRT-NOT-SIMPLE','Vérification simplification maximale')];
  }else{ // expert
    const fbPartialDev=wrapFb_D(p.algFb.expert.partial,false);
    const fbErrSigne=wrapFb_D(p.algFb.expert.errsigne,false);
    const fn0=hasError?2:-1;
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, fn0,0, '',hasError?'':fbKO,
      'PRT-EQUAL-GO-ON',hasError?'PRT-NOT-EQUAL-CHECK-ERR':'PRT-WRONG','Vérification algébrique'),
      algPrtNodeCanonical_D(X,1,'Expanded',_a,_t,'', -1,1, -1,0.25, fbOK,fbPartialDev,
      'PRT-CORRECT-MAX','PRT-CORRECT-NOT-REDUCED','Vérification développement et réduction')];
    if(hasError)canonicalNodes.push(algPrtNodeCanonical_D(X,2,'AlgEquiv',_a,_e,'', -1,0.5, -1,0, fbErrSigne,fbKO,
      'PRT-BUG-ERR-FOUND','PRT-WRONG-TOTAL','Détection erreur de signe'));
  }
  const prtMeta={name:'prt'+X, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables:''};
  const prtXML=buildPrtXml_D(prtMeta, canonicalNodes);
  /* Le bloc clavier (kbdHtml) contient du JS littéral avec de vrais < > &&.
     Le texte de la question passe par plusieurs allers-retours DOM (chip
     replacement, stripMathDivs) qui échappent ces caractères en entités
     HTML — ce qui casse le JS. On ne pose donc qu'un marqueur ici ; le
     contenu réel est restauré tel quel dans buildXML() (js/app.js), après
     tous les traitements DOM, juste avant l'écriture finale en CDATA. */
  const inputLine=useKbd?`${aide}<!--HS-KBD:${X}-->`:`${aide}<p>[[input:ans${X}]] [[validation:ans${X}]]</p>`;
  return{bareme,vars,qnote,kbdRaw:useKbd?kbdHtml:null,
    textFrag:`
      <div style="background:#0891b2;border-left:5px solid #0e7490;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('tpl.alg_banniere')}</strong>
        <span style="background:#0e7490;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#0e7490;border:1px solid #0e7490;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('tpl.alg_badge_reponse_formelle')}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->
      ${hasDisplay?`<p style="font-weight:600;">\\({@exp${X}@}\\)</p>`:''}
      ${inputLine}
    `,
    inputXML:`    <input>
      <name>ans${X}</name>
      <type>algebraic</type>
      <tans>ta${X}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords>${allowWords}</allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>2</showvalidation>
      <options></options>
    </input>`,
    prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
    feedbackRef:`[[feedback:prt${X}]]`,
    generalFeedback: `<p><strong>${I18N_D.t('tpl.alg_fb_reponse_attendue')}</strong> \\({@ta${X}@}\\)</p>`+(sol?`<div style="margin-top:8px;">${sol}</div>`:''),
    solution:sol};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genAlgebraic: genAlgebraic, genAlgebraicCore: genAlgebraicCore };
}

