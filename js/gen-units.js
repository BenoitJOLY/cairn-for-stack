// ── XML GENERATORS: unités ──

async function genUnits(X){
  // un-tol/un-fbc/un-fbe ne sont pas utilisés par le calcul, mais resolveFb() a l'effet de
  // bord de pré-remplir les textarea un-fbc/un-fbe si vides — comportement du code d'origine
  // à préserver même si ces valeurs ne servent pas au cœur pur.
  v('un-tol');
  resolveFb('un-fbc',FB_JUSTE_DEFAULT());
  resolveFb('un-fbe',FB_FAUX_DEFAULT());
  const p={
    bareme: parseFloat(v('un-bareme'))||1,
    text: richVal('un-text'),
    val: v('un-val').trim()||'1',
    unit: v('un-unit').trim()||'m',
    fbGen: resolveFb('un-fbgen',''),
    aide: buildUnHelp(),
    useKbd: document.getElementById('un-h-kbd').checked
  };
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'units', X, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "units", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "units", repli sur le calcul local.', e); }
  return genUnitsCore(X, p);
}

/* genUnitsCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour le
   pattern (deps injectables pour les tests Node — test/unit/gen-units.test.js). */
function genUnitsCore(X, p, deps){
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  const bareme=p.bareme;
  const text=p.text;
  const val=p.val;
  const unit=p.unit;
  const fbGen=p.fbGen;
  const aide=p.aide;
  const useKbd=p.useKbd;
  const kbdHtml=useKbd?(deps.buildKbdStackHTML || buildKbdStackHTML)(X):'';
  const vars=`/* Q${X} : Unité (${bareme}pt) */\nta${X}:${val}*${unit};`;
  const qnote=`{@ta${X}@}`;
  const inputLine=useKbd?`${aide}<!--HS-KBD:${X}-->`:`${aide}<p>[[input:ans${X}]] [[validation:ans${X}]]</p>`;
  const fbBox = `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
    <span style="font-weight:bold;color:#1e293b;">Q${X} — ${I18N_D.t('un.unit_lbl')}</span>
  </div>
  <p><strong>${I18N_D.t('un.fb_valeur_attendue')}</strong> {@ta${X}@}</p>`;
  const generalFeedback=mkFbGen_D(fbBox, fbGen);
  var fbVars=`\n           /* Normalisation SI */\n           stud_si${X} : stack_unit_si_to_si_base(ans${X});\n           teach_si${X} : stack_unit_si_to_si_base(ta${X});\n\n           /* Extraction du nombre pur pour isoler l'unité */\n           v_pure_e${X} : subst(map(lambda([u], u=1), listofvars(stud_si${X})), stud_si${X});\n           v_pure_t${X} : subst(map(lambda([u], u=1), listofvars(teach_si${X})), teach_si${X});\n\n           /* Création de l'unité pure (le coefficient 2 évite les simplifications par défaut) */\n           eleve_unit${X} : 2 * stud_si${X} / v_pure_e${X};\n           teacher_unit${X} : 2 * teach_si${X} / v_pure_t${X};\n        `;
  var prtMeta={name:'prt'+X,value:String(bareme),autosimplify:'1',feedbackstyle:'2',feedbackvariables:fbVars};
  var canonicalNodes=[
    {
      name:'0', description:'', answertest:'UnitsAbsolute', sans:'eleve_unit'+X, tans:'teacher_unit'+X,
      testoptions:'0', quiet:'0',
      truescoremode:'+', truescore:'0.5', truepenalty:'', truenextnode:'1',
      trueanswernote:'prt'+X+'-1-T', truefeedback:'',
      falsescoremode:'-', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
      falseanswernote:'prt'+X+'-1-F', falsefeedback:`<p>${I18N_D.t('un.fb_unite_incorrecte', {unitvar: 'teacher_unit'+X+'/2'})}</p>`
    },
    {
      name:'1', description:'', answertest:'UnitsRelative', sans:'ans'+X, tans:'ta'+X,
      testoptions:'0.05', quiet:'0',
      truescoremode:'+', truescore:'0.5', truepenalty:'', truenextnode:'-1',
      trueanswernote:'prt'+X+'-2-T', truefeedback:'<p>'+I18N_D.t('un.fb_ok_complete')+'</p>',
      falsescoremode:'-', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
      falseanswernote:'prt'+X+'-2-F', falsefeedback:'<p>'+I18N_D.t('un.fb_wrong_valeur')+'</p>'
    }
  ];
  var prtXML=buildPrtXml_D(prtMeta, canonicalNodes);
  return{bareme,vars,qnote,generalFeedback,kbdRaw:useKbd?kbdHtml:null,
    textFrag:`
      <div style="background:#d97706;border-left:5px solid #b45309;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('un.unit_lbl')}</strong>
        <span style="background:#b45309;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#b45309;border:1px solid #b45309;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('un.badge_grandeur')}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->
      ${inputLine}
    `,
    inputXML:`    <input>\n      <name>ans${X}</name><type>units</type><tans>ta${X}</tans>\n      <mustverify>0</mustverify><showvalidation>0</showvalidation>\n    </input>`,
    prtXML: prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
  feedbackRef:`[[feedback:prt${X}]]`};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genUnits: genUnits, genUnitsCore: genUnitsCore };
}


// ══════════════════════════════════════════════════════
//  STRING — PALETTE AIDE ÉLÈVE
// ══════════════════════════════════════════════════════

