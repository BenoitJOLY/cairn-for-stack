// ── XML GENERATORS: pool (radio, dropdown) ──

async function genPool(X,type,textId,Xe,vcid,fcid,bareme,fbGenId,fbGenShowFbId){
  const _pfx=vcid.split('-')[0];
  if(!validateRADraw(_pfx)){throw new Error(I18N.t('msg.err_tirage_pool', {type: type}));}

  const label=type==='radio'?I18N.t('tpl.pool_label_radio'):I18N.t('tpl.pool_label_dropdown');
  const text=richVal(textId);
  validatePool(type==='radio'?'ra':'dd',label);
  const poolFbGen = (fbGenId && document.getElementById(fbGenId)) ? resolveFb(fbGenId, '') : '';
  const poolShowFb = fbGenShowFbId ? (document.getElementById(fbGenShowFbId)?.checked || false) : true;

  const propsVrais=[],propsFaux=[];
  document.querySelectorAll(`#${vcid} .prop-row`).forEach(r=>{propsVrais.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
  document.querySelectorAll(`#${fcid} .prop-row`).forEach(r=>{propsFaux.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});

  const p={type,label,text,Xe,bareme,poolFbGen,poolShowFb,propsVrais,propsFaux};
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type, X, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Quota hebdomadaire atteint.');
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "' + type + '", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "' + type + '", repli sur le calcul local.', e); }
  return genPoolCore(X, p);
}

/* genPoolCore : fonction pure (aucun accès DOM), voir js/gen-redox.js pour le
   pattern (deps injectables pour les tests Node — test/unit/gen-pool.test.js). */
function genPoolCore(X, p, deps){
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var wrapFb_D = deps.wrapFb || wrapFb;
  var rawEsc_D = deps.rawEsc || rawEsc;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;

  const type=p.type, label=p.label, text=p.text, Xe=p.Xe, bareme=p.bareme;
  const poolFbGen=p.poolFbGen, poolShowFb=p.poolShowFb;

  let taAll=[],fbAll=[];let c=1;
  p.propsVrais.forEach(r=>{taAll.push(`[${c},true,"${rawEsc_D(r.text)}"]`);fbAll.push(`[${c},"${rawEsc_D(r.fb)}"]`);c++;});
  p.propsFaux.forEach(r=>{taAll.push(`[${c},false,"${rawEsc_D(r.text)}"]`);fbAll.push(`[${c},"${rawEsc_D(r.fb)}"]`);c++;});

  const vars=`/* Q${X} : ${label} (${bareme}pt) */\nta${X}_all:[${taAll.join(',')}];\nfb${X}:[${fbAll.join(',')}];\npV${X}:sublist(ta${X}_all,lambda([ex],second(ex)=true));\npF${X}:sublist(ta${X}_all,lambda([ex],second(ex)=false));\nta${X}:random_permutation(append(rand_selection(pV${X},1),rand_selection(pF${X},${Xe}-1)));\nla_vraie${X}:first(sublist(ta${X},lambda([ex],second(ex)=true)));\ntexte_vrai${X}:third(la_vraie${X});\nfb_vrai${X}:assoc(first(la_vraie${X}),fb${X});`;
  const fbVars=`vid${X}:first(first(sublist(ta${X},lambda([ex],second(ex)=true))));\nfbe${X}:assoc(ans${X},fb${X});`;
  const qnote=`{@map(first,ta${X})@}`;

  // --- CONFIGURATION DU STYLE DYNAMIQUE ---
  const mainColor = type === 'radio' ? '#2563eb' : '#db2877';
  const borderColor = type === 'radio' ? '#1e40af' : '#be185d';
  const badgeIcon = type === 'radio' ? '🔘' : '📋';
  const badgeText = type === 'radio' ? I18N_D.t('tpl.pool_badge_radio') : I18N_D.t('tpl.pool_badge_dropdown');
  // -----------------------------------------

  const prtMeta = { name: 'prt'+X, value: String(bareme), autosimplify: '1', feedbackstyle: '1', feedbackvariables: fbVars };
  const canonicalNodes = [{
    name: '0', description: '', answertest: 'AlgEquiv', sans: 'ans'+X, tans: 'vid'+X,
    testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: 'PRT-'+X+'-1-T', truefeedback: wrapFb_D('{@fbe' + X + '@}', true),
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: 'PRT-'+X+'-1-F', falsefeedback: wrapFb_D('{@fbe' + X + '@}', false)
  }];
  const prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

  return{bareme,vars,qnote,
    textFrag:`
      <div style="background:${mainColor};border-left:5px solid ${borderColor};border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${label}</strong>
        <span style="background:${borderColor};color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:${borderColor};border:1px solid ${borderColor};padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${badgeIcon} ${badgeText}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->
      <p>[[input:ans${X}]] [[validation:ans${X}]]</p>
    `,
    inputXML:`    <input>
      <name>ans${X}</name>
      <type>${type}</type>
      <tans>ta${X}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`,
    prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
  generalFeedback: applyFbBox_D('general', `<p><strong>${I18N_D.t('tpl.pool_bonne_reponse')}</strong> {@texte_vrai${X}@}</p>${poolShowFb ? `<p>{@fb_vrai${X}@}</p>` : ''}${poolFbGen ? `<p>${poolFbGen}</p>` : ''}`),
  feedbackRef:`[[feedback:prt${X}]]`};
}
function genRadio(X){const b=parseFloat(v('ra-bareme'))||1;return genPool(X,'radio','ra-text',v('ra-xe'),'ra-vrais','ra-faux',b,'ra-fbgen','ra-fbgen-showfb');}
function genDropdown(X){const b=parseFloat(v('dd-bareme'))||1;return genPool(X,'dropdown','dd-text',v('dd-xe'),'dd-vrais','dd-faux',b,'dd-fbgen','dd-fbgen-showfb');}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genPool: genPool, genPoolCore: genPoolCore };
}

