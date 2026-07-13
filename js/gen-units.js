// ── XML GENERATORS: unités ──

function genUnits(X){
  const bareme=parseFloat(v('un-bareme'))||1;
  const text=richVal('un-text');
  const val=v('un-val').trim()||'1';
  const unit=v('un-unit').trim()||'m';
  const tol=v('un-tol');
  const fbc=resolveFb('un-fbc',FB_JUSTE_DEFAULT);
  const fbe=resolveFb('un-fbe',FB_FAUX_DEFAULT);
  const fbGen=resolveFb('un-fbgen','');
  const aide=buildUnHelp();
  const useKbd=document.getElementById('un-h-kbd').checked;
  const kbdHtml=useKbd?buildKbdStackHTML(X):'';
  const vars=`/* Q${X} : Unité (${bareme}pt) */\nta${X}:${val}*${unit};`;
  const qnote=`{@ta${X}@}`;
  const inputLine=useKbd?`${aide}<!--HS-KBD:${X}-->`:`${aide}<p>[[input:ans${X}]] [[validation:ans${X}]]</p>`;
  const generalFeedback=_mkFbGen(`<p><strong>${I18N.t('un.fb_valeur_attendue')}</strong> {@ta${X}@}</p>`, fbGen);
  var fbVars=`\n           /* Normalisation SI */\n           stud_si${X} : stack_unit_si_to_si_base(ans${X});\n           teach_si${X} : stack_unit_si_to_si_base(ta${X});\n\n           /* Extraction du nombre pur pour isoler l'unité */\n           v_pure_e${X} : subst(map(lambda([u], u=1), listofvars(stud_si${X})), stud_si${X});\n           v_pure_t${X} : subst(map(lambda([u], u=1), listofvars(teach_si${X})), teach_si${X});\n\n           /* Création de l'unité pure (le coefficient 2 évite les simplifications par défaut) */\n           eleve_unit${X} : 2 * stud_si${X} / v_pure_e${X};\n           teacher_unit${X} : 2 * teach_si${X} / v_pure_t${X};\n        `;
  var prtMeta={name:'prt'+X,value:String(bareme),autosimplify:'1',feedbackstyle:'2',feedbackvariables:fbVars};
  var canonicalNodes=[
    {
      name:'0', description:'', answertest:'UnitsAbsolute', sans:'eleve_unit'+X, tans:'teacher_unit'+X,
      testoptions:'0', quiet:'0',
      truescoremode:'+', truescore:'0.5', truepenalty:'', truenextnode:'1',
      trueanswernote:'prt'+X+'-1-T', truefeedback:'',
      falsescoremode:'-', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
      falseanswernote:'prt'+X+'-1-F', falsefeedback:`<p>${I18N.t('un.fb_unite_incorrecte', {unitvar: 'teacher_unit'+X+'/2'})}</p>`
    },
    {
      name:'1', description:'', answertest:'UnitsRelative', sans:'ans'+X, tans:'ta'+X,
      testoptions:'0.05', quiet:'0',
      truescoremode:'+', truescore:'0.5', truepenalty:'', truenextnode:'-1',
      trueanswernote:'prt'+X+'-2-T', truefeedback:'<p>'+I18N.t('un.fb_ok_complete')+'</p>',
      falsescoremode:'-', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
      falseanswernote:'prt'+X+'-2-F', falsefeedback:'<p>'+I18N.t('un.fb_wrong_valeur')+'</p>'
    }
  ];
  var prtXML=buildPrtXml(prtMeta, canonicalNodes);
  return{bareme,vars,qnote,generalFeedback,kbdRaw:useKbd?kbdHtml:null,
    textFrag:`
      <div style="background:#d97706;border-left:5px solid #b45309;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N.t('un.unit_lbl')}</strong>
        <span style="background:#b45309;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#b45309;border:1px solid #b45309;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N.t('un.badge_grandeur')}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->
      ${inputLine}
    `,
    inputXML:`    <input>\n      <name>ans${X}</name><type>units</type><tans>ta${X}</tans>\n      <mustverify>0</mustverify><showvalidation>0</showvalidation>\n    </input>`,
    prtXML: prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
  feedbackRef:`[[feedback:prt${X}]]`};
}


// ══════════════════════════════════════════════════════
//  STRING — PALETTE AIDE ÉLÈVE
// ══════════════════════════════════════════════════════
