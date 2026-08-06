// ── XML GENERATORS: algébrique ──

function _algBuildParams(){
  const formula=sanitizeMaxima(v('alg-formula').trim());
  const mode=v('alg-mode')||'libre';
  const exprDisplay=sanitizeMaxima((document.getElementById('alg-expr-display')?.value||'').trim());
  const errorExpr=sanitizeMaxima((document.getElementById('alg-error')?.value||'').trim());
  const formVars=(v('alg-vars')||'').split(',').map(s=>s.trim()).filter(Boolean);
  const poolVars=(typeof getPoolVarNames==='function')?getPoolVarNames():[];
  return {
    bareme: parseFloat(v('alg-bareme'))||1,
    text: richVal('alg-text'),
    formula, mode, exprDisplay, errorExpr,
    fbc: resolveFb('alg-fbc',FB_JUSTE_DEFAULT()),
    fbe: resolveFb('alg-fbe',FB_FAUX_DEFAULT()),
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
}

async function genAlgebraic(X){
  const p=_algBuildParams();
  if(!p.formula)throw new Error(I18N.t('msg.err_formule_vide', {n: X}));
  if(!p.exprDisplay)throw new Error(I18N.t('msg.err_expr_display_vide', {n: X}));
  if(typeof algSyntaxIssues==='function'){
    [[I18N.t('msg.alg_label_reponse_attendue'),p.formula],[I18N.t('msg.alg_label_expr_affichee'),p.exprDisplay],[I18N.t('msg.alg_label_erreur_classique'),p.errorExpr]].forEach(function(pair){
      const issues=algSyntaxIssues(pair[1]);
      if(issues.length)throw new Error('Q'+X+' — '+pair[0]+' : '+issues.join(' '));
    });
  }
  // Étape 3 (PLAN.md) : tente la génération côté serveur, avec repli
  // automatique sur le calcul local si le serveur échoue ou est absent —
  // aucun risque de casser la génération pendant la migration.
  try{
    const res=await fetch('/api/generate',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type:'algebraic', X, params:p})
    });
    if(res.ok){
      const data=await res.json();
      if(data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "algebraic", repli sur le calcul local (session expirée ?).');
  }catch(e){ console.warn('[stackforge] /api/generate injoignable pour "algebraic", repli sur le calcul local.', e); }
  return genAlgebraicCore(X, p);
}

/* genAlgebraicCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-algebraic.test.js). */
function genAlgebraicCore(X, p, deps){
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var algPrtNodeCanonical_D = deps.algPrtNodeCanonical || algPrtNodeCanonical;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var inferFbKind_D = deps.inferFbKind || inferFbKind;
  var stripLeadingFbIcon_D = deps.stripLeadingFbIcon || stripLeadingFbIcon;

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
  // Pas de rand() : formula/exprDisplay sont saisis par l'enseignant, pas de
  // variante aléatoire à documenter — et {@ta${X}@} est la réponse attendue,
  // l'exposer en questionnote la révélerait à l'élève (cf. Numérique/Logique).
  const qnote='';
  const tansEquiv=hasDisplay?`exp${X}`:`ta${X}`;
  // Feedback — texte brut ; l'encadré coloré n'est appliqué que sur xmlNodes (export XML)
  const fbOK=fbc;
  const fbKO=fbe;
  // PRT nodes — structures alignées sur les fichiers de référence
  let canonicalNodes=[];
  const _a='ans'+X, _t='ta'+X, _e='erreur'+X, _te=tansEquiv;
  if(mode==='libre'){
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_t,'', -1,1, -1,0, fbOK,fbKO,
      'PRT-CORRECT','PRT-WRONG',I18N_D.t('alg.node_verif_reponse'))];
  }else if(mode==='developpement'){
    const fbPartialDev=p.algFb.developpement.partial;
    const fbErrSigne=p.algFb.developpement.errsigne;
    const fn0=hasError?2:-1;
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, fn0,0, '',hasError?'':fbKO,
      'PRT-EQUAL-GO-ON',hasError?'PRT-NOT-EQUAL-CHECK-ERR':'PRT-WRONG',I18N_D.t('alg.node_verif_algebrique')),
      algPrtNodeCanonical_D(X,1,'Expanded',_a,_t,'', -1,1, -1,0.25, fbOK,fbPartialDev,
      'PRT-CORRECT-MAX','PRT-CORRECT-NOT-REDUCED',I18N_D.t('alg.node_dev_reduction'))];
    if(hasError)canonicalNodes.push(algPrtNodeCanonical_D(X,2,'AlgEquiv',_a,_e,'', -1,0.5, -1,0, fbErrSigne,fbKO,
      'PRT-BUG-ERR-FOUND','PRT-WRONG-TOTAL',I18N_D.t('alg.node_err_signe')));
  }else if(mode==='factorisation'){
    const fbPartialFac=p.algFb.factorisation.partial;
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, -1,0, '','',
      'PRT-EQUAL-GO-ON','PRT-WRONG',I18N_D.t('alg.node_verif_algebrique')),
      algPrtNodeCanonical_D(X,1,'FacForm',_a,_t,mainVar, -1,1, -1,0.25, fbOK,fbPartialFac,
      'PRT-FAC-MAX','PRT-NOT-MAX',I18N_D.t('alg.node_factorisation_max'))];
  }else if(mode==='fraction'){
    const fbPartialFrac=p.algFb.fraction.partial;
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, -1,0, '','',
      'PRT-EQUAL-GO-ON','PRT-WRONG',I18N_D.t('alg.node_verif_algebrique')),
      algPrtNodeCanonical_D(X,1,'FacForm',_a,_t,mainVar, -1,1, -1,0.5, fbOK,fbPartialFrac,
      'PRT-SIMPLE-MAX','PRT-NOT-SIMPLE',I18N_D.t('alg.node_simplification_max'))];
  }else{ // expert
    const fbPartialDev=p.algFb.expert.partial;
    const fbErrSigne=p.algFb.expert.errsigne;
    const fn0=hasError?2:-1;
    canonicalNodes=[algPrtNodeCanonical_D(X,0,'AlgEquiv',_a,_te,'', 1,1, fn0,0, '',hasError?'':fbKO,
      'PRT-EQUAL-GO-ON',hasError?'PRT-NOT-EQUAL-CHECK-ERR':'PRT-WRONG',I18N_D.t('alg.node_verif_algebrique')),
      algPrtNodeCanonical_D(X,1,'Expanded',_a,_t,'', -1,1, -1,0.25, fbOK,fbPartialDev,
      'PRT-CORRECT-MAX','PRT-CORRECT-NOT-REDUCED',I18N_D.t('alg.node_dev_reduction'))];
    if(hasError)canonicalNodes.push(algPrtNodeCanonical_D(X,2,'AlgEquiv',_a,_e,'', -1,0.5, -1,0, fbErrSigne,fbKO,
      'PRT-BUG-ERR-FOUND','PRT-WRONG-TOTAL',I18N_D.t('alg.node_err_signe')));
  }
  const prtMeta={name:'prt'+X, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables:''};
  // stripLeadingFbIcon : fbc/fbe retombent par défaut sur FB_JUSTE_DEFAULT()/
  // FB_FAUX_DEFAULT() (js/data.js), déjà préfixés de leur propre icône —
  // sans ce retrait, applyFbBox_D en ajoute une seconde (icône doublée).
  const xmlNodes=canonicalNodes.map(function(n){
    return Object.assign({}, n, {
      truefeedback: applyFbBox_D(inferFbKind_D(n,'true'), stripLeadingFbIcon_D(n.truefeedback)),
      falsefeedback: applyFbBox_D(inferFbKind_D(n,'false'), stripLeadingFbIcon_D(n.falsefeedback))
    });
  });
  const prtXML=buildPrtXml_D(prtMeta, xmlNodes);
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
    generalFeedback: applyFbBox_D('general', `<p><strong>${I18N_D.t('tpl.alg_fb_reponse_attendue')}</strong> \\({@ta${X}@}\\)</p>`+(sol?`<div style="margin-top:8px;">${sol}</div>`:'')),
    solution:sol};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genAlgebraic: genAlgebraic, genAlgebraicCore: genAlgebraicCore };
}


