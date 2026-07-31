// ── XML GENERATORS: chaîne (string) ──

const STR_PALETTES={
  frac:{labelKey:'tpl.str_palette_frac',btns:[
    {v:'\\frac{}{}',d:'a/b'},{v:'\\sqrt{}',d:'√'},{v:'^{2}',d:'x²'},{v:'^{n}',d:'xⁿ'},
    {v:'_{n}',d:'xₙ'},{v:'\\sqrt[3]{}',d:'∛'},
  ]},
  ops:{labelKey:'tpl.operateurs',btns:[
    {v:'+',d:'+'},{v:'-',d:'−'},{v:'\\times ',d:'×'},{v:'\\div ',d:'÷'},{v:'\\pm ',d:'±'},
    {v:'=',d:'='},{v:'\\neq ',d:'≠'},{v:'\\leq ',d:'≤'},{v:'\\geq ',d:'≥'},{v:'\\approx ',d:'≈'},
  ]},
  greek:{labelKey:'tpl.str_palette_greek',btns:[
    {v:'\\alpha ',d:'α'},{v:'\\beta ',d:'β'},{v:'\\gamma ',d:'γ'},{v:'\\delta ',d:'δ'},
    {v:'\\Delta ',d:'Δ'},{v:'\\epsilon ',d:'ε'},{v:'\\lambda ',d:'λ'},{v:'\\mu ',d:'μ'},
    {v:'\\pi ',d:'π'},{v:'\\sigma ',d:'σ'},{v:'\\Sigma ',d:'Σ'},{v:'\\omega ',d:'ω'},
    {v:'\\theta ',d:'θ'},{v:'\\phi ',d:'φ'},{v:'\\rho ',d:'ρ'},
  ]},
  geo:{labelKey:'tpl.vecteurs_geometrie',btns:[
    {v:'\\vec{v}',d:'v⃗'},{v:'\\overrightarrow{AB}',d:'AB→'},{v:'\\perp ',d:'⊥'},
    {v:'\\parallel ',d:'∥'},{v:'\\angle ',d:'∠'},{v:'\\widehat{A}',d:'Â'},
    {v:'\\in ',d:'∈'},{v:'\\subset ',d:'⊂'},{v:'\\cup ',d:'∪'},{v:'\\cap ',d:'∩'},
  ]},
  fn:{labelKey:'tpl.str_palette_fn',btns:[
    {v:'\\sin ',d:'sin'},{v:'\\cos ',d:'cos'},{v:'\\tan ',d:'tan'},{v:'\\ln ',d:'ln'},
    {v:'\\log ',d:'log'},{v:'\\exp ',d:'exp'},{v:'\\lim_{x\\to }',d:'lim'},
    {v:'\\sum_{}^{}',d:'Σ'},{v:'\\int_{}^{}',d:'∫'},{v:'\\infty ',d:'∞'},
  ]},
  phys:{labelKey:'tpl.str_palette_phys',btns:[
    {v:'\\text{m/s}',d:'m/s'},{v:'\\text{m/s}^{2}',d:'m/s²'},{v:'\\text{kg}',d:'kg'},
    {v:'\\text{N}',d:'N'},{v:'\\text{J}',d:'J'},{v:'\\text{W}',d:'W'},
    {v:'\\text{Pa}',d:'Pa'},{v:'\\text{mol}',d:'mol'},{v:'\\rightarrow ',d:'→'},
    {v:'\\rightleftharpoons ',d:'⇌'},{v:'_{(g)}',d:'(g)'},{v:'_{(l)}',d:'(l)'},
    {v:'_{(aq)}',d:'(aq)'},{v:'_{(s)}',d:'(s)'},
  ]},
};

function toggleStrAide(){
  const on=document.getElementById('str-aide-on').checked;
  document.getElementById('str-aide-panel').style.display=on?'block':'none';
  if(on)updateStrPalettePreview();
}

function toggleStrLevenshtein(){
  const on=document.getElementById('str-leven-on').checked;
  const row=document.getElementById('str-test-row');
  if(row)row.style.display=on?'none':'';
}

function updateStrPalettePreview(){
  const selected=[...document.querySelectorAll('.str-pal:checked')].map(c=>c.value);
  const preview=document.getElementById('str-palette-preview');
  if(!preview)return;
  if(!selected.length){
    preview.innerHTML='<em style="color:#94a3b8;font-size:.78rem;">'+I18N.t('tpl.str_aucune_palette')+'</em>';
    return;
  }
  let h='';
  selected.forEach(key=>{
    const pal=STR_PALETTES[key];
    if(!pal)return;
    h+=`<span style="font-size:.68rem;font-weight:700;color:#6b21a8;margin-right:3px;white-space:nowrap;">${I18N.t(pal.labelKey)}:</span>`;
    pal.btns.forEach(b=>{ h+=`<button class="str-pal-btn" title="${b.v}">${b.d}</button>`; });
    h+='<span style="width:6px;display:inline-block"></span>';
  });
  preview.innerHTML=h;
}

function genStrPaletteHTML(X){
  const selected=[...document.querySelectorAll('.str-pal:checked')].map(c=>c.value);
  if(!selected.length)return '';
  let btnDefs=[];
  selected.forEach(key=>{ const pal=STR_PALETTES[key];if(pal)pal.btns.forEach(b=>btnDefs.push(b)); });
  const btnHTML=btnDefs.map(b=>`<button class="str-ins-btn" type="button" data-val="${b.v.replace(/"/g,"'")}">${b.d}</button>`).join(' ');
  const sc=`(function(){window.addEventListener('load',function(){const inp=document.querySelector('input[name$="ans${X}"]');if(!inp)return;document.querySelectorAll('.str-ins-btn').forEach(function(btn){btn.addEventListener('click',function(e){e.preventDefault();var val=this.getAttribute('data-val');var s=inp.selectionStart,en=inp.selectionEnd;inp.value=inp.value.substring(0,s)+val+inp.value.substring(en);inp.focus();var np=s+val.length;if(val.endsWith('{}'))np=s+val.length-1;inp.setSelectionRange(np,np);inp.dispatchEvent(new Event('input',{bubbles:true}));});});});})();`;
  return `<div style="background:#f8f4ff;border:1px solid #e9d5ff;border-radius:8px;padding:8px 10px;margin-bottom:10px;display:flex;flex-wrap:wrap;gap:4px;align-items:center;"><span style="font-size:.72rem;font-weight:700;color:#6b21a8;margin-right:4px;">${I18N.t('tpl.str_aide')}</span>${btnHTML}</div><p><scr`+`ipt>${sc}<`+`/scr`+`ipt></p>`;
}

function _strBuildParams(X){
  const bareme=parseFloat(v('str-bareme'))||1;
  const text=richVal('str-text');
  const ansRich=richVal('str-ans-rich');
  const ansPlain=ansRich.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
  document.getElementById('str-ans').value=ansPlain;
  const size=v('str-size'),test=v('str-test');
  const fbc=resolveFb('str-fbc',FB_JUSTE_DEFAULT);
  const fbe=resolveFb('str-fbe',FB_FAUX_DEFAULT);
  const fbGen=resolveFb('str-fbgen','');
  const sol=richVal('str-sol');
  const aideOn=document.getElementById('str-aide-on').checked;
  const paletteHtml=aideOn?genStrPaletteHTML(X):'';
  const levenOn=document.getElementById('str-leven-on').checked;
  const solH=sol?`<hr style="margin:8px 0"/><div style="padding:8px;background:#f8f9fa;border-radius:4px;">${sol}</div>`:'';
  const altsRaw=(document.getElementById('str-alts')||{value:''}).value.trim();
  const altsArr=altsRaw?altsRaw.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length>0;}) : [];
  return {bareme,text,ansPlain,size,test,fbc,fbe,fbGen,solH,paletteHtml,levenOn,altsArr};
}

async function genString(X){
  const p=_strBuildParams(X);
  if(!p.ansPlain)throw new Error(I18N.t('msg.err_string_vide', {n: X}));
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'string', X, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Quota hebdomadaire atteint.');
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "string", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "string", repli sur le calcul local.', e); }
  return genStringCore(X,p);
}

/* genStringCore : fonction pure (aucun accès DOM), voir js/gen-redox.js
   pour le pattern (deps injectables — test/unit/gen-string.test.js). */
function genStringCore(X,p,deps){
  deps=deps||{};
  const I18N_D=deps.I18N||I18N;
  const buildPrtXml_D=deps.buildPrtXml||buildPrtXml;
  const mkFbGen_D=deps._mkFbGen||_mkFbGen;
  const rawEsc_D=deps.rawEsc||rawEsc;
  const htmlEsc_D=deps.htmlEsc||htmlEsc;
  const applyFbBox_D=deps.applyFbBox||applyFbBox;
  const inferFbKind_D=deps.inferFbKind||inferFbKind;

  const bareme=p.bareme, text=p.text, ansPlain=p.ansPlain, size=p.size, test=p.test;
  const fbc=p.fbc, fbe=p.fbe, fbGen=p.fbGen, solH=p.solH, paletteHtml=p.paletteHtml, altsArr=p.altsArr;

  if(p.levenOn)return genStringLevenshteinCore(X,bareme,text,ansPlain,paletteHtml,size,solH,fbGen,altsArr,deps);

  const vars=`/* Q${X} : String (${bareme}pt) */\nta${X}:"${rawEsc_D(ansPlain)}";`;
  // Pas de rand() : ansPlain est saisi par l'enseignant, pas de variante à
  // documenter — et {@ta${X}@} est la réponse attendue elle-même.
  const qnote='';
  const textFrag=`
      <div style="background:#dc2626;border-left:5px solid #991b1b;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('tpl.str_banniere')}</strong>
        <span style="background:#991b1b;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#991b1b;border:1px solid #991b1b;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('tpl.str_badge_texte')}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->${paletteHtml}<p>[[input:ans${X}]] [[validation:ans${X}]]</p>
    `;
  const inputXML=`    <input>\n      <name>ans${X}</name><type>string</type><tans>ta${X}</tans>\n      <boxsize>${size}</boxsize><mustverify>0</mustverify><showvalidation>0</showvalidation>\n    </input>`;
  const feedbackRef=`[[feedback:prt${X}]]`;
  const mkNode=function(testName,sansExpr,tansExpr){return{
    name:'0', description:'', answertest:testName, sans:sansExpr, tans:tansExpr,
    testoptions:'', quiet:'0',
    truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
    trueanswernote:`PRT-${X}-1-T`, truefeedback:fbc,
    falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
    falseanswernote:`PRT-${X}-1-F`, falsefeedback:fbe+solH
  };};
  // ── Encadres colores : appliques uniquement sur la copie servant a l'export XML ──
  // canonicalNodes (expose via prt.nodes pour prt-manager.js) reste brut, sans
  // encadre, pour que l'edition manuelle du PRT ne montre jamais de HTML de
  // presentation. Voir js/fb-box.js (applyFbBox).
  const toXmlNodes=function(nds){return nds.map(function(n){
    return Object.assign({}, n, {
      truefeedback: applyFbBox_D(inferFbKind_D(n, 'true'), n.truefeedback),
      falsefeedback: applyFbBox_D(inferFbKind_D(n, 'false'), n.falsefeedback)
    });
  });};
  if(!altsArr.length){
    const canonicalNodes=[mkNode(test,'ans'+X,'ta'+X)];
    const prtMeta={name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables:''};
    const prtXML=buildPrtXml_D(prtMeta, toXmlNodes(canonicalNodes));
    return{bareme,vars,qnote,generalFeedback:applyFbBox_D('general',mkFbGen_D('',fbGen)),textFrag,inputXML,
      prtXML,feedbackRef,prt:{meta:prtMeta,nodes:canonicalNodes}};
  }
  const sloppy=test!=='String';
  const normFn=sloppy?function(s){return rawEsc_D(s.toLowerCase().trim());}:function(s){return rawEsc_D(s.trim());};
  const allAnsList=[ansPlain].concat(altsArr).map(function(a){return '"'+normFn(a)+'"';}).join(',');
  const studentNorm=sloppy?'stud_norm_'+X+': sdowncase(strim(" ", ans'+X+'))$':'stud_norm_'+X+': strim(" ", ans'+X+')$';
  const fbVars=studentNorm+'\nvalid_norms_'+X+': ['+allAnsList+']$\nis_correct_'+X+': member(stud_norm_'+X+', valid_norms_'+X+')$ ';
  const canonicalNodes=[mkNode('AlgEquiv','is_correct_'+X,'true')];
  const prtMeta={name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables:fbVars};
  const prtXML=buildPrtXml_D(prtMeta, toXmlNodes(canonicalNodes));
  return{bareme,vars,qnote,generalFeedback:mkFbGen_D('',fbGen),textFrag,inputXML,
    prtXML,feedbackRef,prt:{meta:prtMeta,nodes:canonicalNodes}};
}

function genStringLevenshteinCore(X,bareme,text,ansPlain,paletteHtml,size,solH,fbGen,altsArr,deps){
  deps=deps||{};
  const I18N_D=deps.I18N||I18N;
  const buildPrtXml_D=deps.buildPrtXml||buildPrtXml;
  const mkFbGen_D=deps._mkFbGen||_mkFbGen;
  const wrapFb_D=deps.wrapFb||wrapFb;
  const rawEsc_D=deps.rawEsc||rawEsc;
  const htmlEsc_D=deps.htmlEsc||htmlEsc;
  const applyFbBox_D=deps.applyFbBox||applyFbBox;

  const ta=rawEsc_D(ansPlain);
  const repValItems=[ansPlain].concat(altsArr).map(function(a){return 'supprimer_articles(sdowncase("'+rawEsc_D(a)+'"))';}).join(',');
  const vars=`/* Q${X} : String Levenshtein (${bareme}pt) */
levenshtein(s,t) := block(
  [m,n,prev,curr,i,j,c],
  if stringp(s)=false then s:string(s),
  if stringp(t)=false then t:string(t),
  m:slength(s),
  n:slength(t),
  if m=0 then return(n),
  if n=0 then return(m),
  if m>30 or n>30 then return(100),
  prev:makelist(i,i,0,n),
  for i:1 thru m do (
    curr:[i],
    for j:1 thru n do (
      if charat(s,i)=charat(t,j) then c:0 else c:1,
      curr:endcons(min(prev[j+1]+1,curr[j]+1,prev[j]+c),curr)
    ),
    prev:curr
  ),
  last(prev)
)$
supprimer_articles(s) := block(
  [s2:sdowncase(s), arts:{"le ","la ","l'","du ","des ","un ","une ","de ","d'"}, a, p],
  for a in arts do (
    p:ssearch(a,s2,1),
    if p=1 then s2:substring(s2,slength(a)+1)
  ),
  strim(" ",s2)
)$
meilleur_match(rep,liste) := block(
  [md:100,bm:"",d,i],
  for i:1 thru length(liste) do (
    d:levenshtein(rep,liste[i]),
    if d<md then (md:d,bm:liste[i])
  ),
  [md,bm]
)$
reponses_valides_${X}: [${repValItems}]$
ta${X}: "${ta}";`;

  const fbVars=`rep_norm_${X}:strim(" ",sdowncase(ans${X}))$ rep_core_${X}:supprimer_articles(rep_norm_${X})$ if rep_core_${X}="" then rep_core_${X}:" "$
res_${X}:meilleur_match(rep_core_${X},reponses_valides_${X})$ dist_min_${X}:res_${X}[1]$ best_${X}:res_${X}[2]$ est_exact_${X}:member(rep_core_${X},reponses_valides_${X})$
a_plu_${X}:slength(rep_core_${X})>1 and charat(rep_core_${X},slength(rep_core_${X}))="s"$ rep_ss_${X}:if a_plu_${X} then substring(rep_core_${X},1,slength(rep_core_${X})-1) else rep_core_${X}$ d_ss_${X}:if a_plu_${X} then levenshtein(rep_ss_${X},best_${X}) else 100$ plu_seul_${X}:a_plu_${X} and d_ss_${X}=0$ plu_f1_${X}:a_plu_${X} and d_ss_${X}=1$
fb0_${X}:"${wrapFb_D('<p>❌ <strong>'+I18N_D.t('tpl.str_fb_vide')+'</strong></p>', false).replace(/"/g,'\\"')}"$
fb1_${X}:"${wrapFb_D('<p>✅ <strong>'+I18N_D.t('tpl.str_fb_parfait')+'</strong></p>', true).replace(/"/g,'\\"')}"$
fb2_${X}:sconcat("${I18N_D.t('tpl.str_fb2_pre').replace(/"/g,'\\"')}",best_${X},"${I18N_D.t('tpl.str_fb2_post').replace(/"/g,'\\"')}")$
fb3_${X}:sconcat("${I18N_D.t('tpl.str_fb3_pre').replace(/"/g,'\\"')}",best_${X},"${I18N_D.t('tpl.str_fb3_post').replace(/"/g,'\\"')}")$
fb4_${X}:sconcat("${I18N_D.t('tpl.str_fb4_pre').replace(/"/g,'\\"')}",best_${X},"${I18N_D.t('tpl.str_fb4_post').replace(/"/g,'\\"')}")$
fb5_${X}:sconcat("${I18N_D.t('tpl.str_fb5_pre').replace(/"/g,'\\"')}",best_${X},"${I18N_D.t('tpl.str_fb5_post').replace(/"/g,'\\"')}")$
fb6_${X}:"${wrapFb_D(I18N_D.t('tpl.str_fb6', {rep: htmlEsc_D(ansPlain)})+solH, false).replace(/"/g,'\\"')}"$`;

  const mkCanonNode=(name,sans,tans,trueScore,trueFbVar,falseNext)=>({
    name:String(name), description:'', answertest:'AlgEquiv', sans:sans, tans:tans,
    testoptions:'', quiet:'1',
    truescoremode:'=', truescore:String(trueScore), truepenalty:'', truenextnode:'-1',
    trueanswernote:`PRT-${X}-${name}-T`, truefeedback:`{@${trueFbVar}@}`,
    falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:String(falseNext),
    falseanswernote:`PRT-${X}-${name}-F`, falsefeedback:''
  });

  const canonicalNodes=[
    mkCanonNode(0,`rep_core_${X}=" "`,'true',0,`fb0_${X}`,1),
    mkCanonNode(1,`est_exact_${X}`,'true',1,`fb1_${X}`,2),
    mkCanonNode(2,`plu_seul_${X}`,'true',0.5,`fb2_${X}`,3),
    mkCanonNode(3,`plu_f1_${X}`,'true',0.25,`fb3_${X}`,4),
    mkCanonNode(4,`dist_min_${X}`,'1',0.5,`fb4_${X}`,5),
    mkCanonNode(5,`dist_min_${X}`,'2',0.25,`fb5_${X}`,6),
    mkCanonNode(6,'true','true',0,`fb6_${X}`,-1)
  ];
  const prtMeta={name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'2', feedbackvariables:fbVars};
  const prtXML=buildPrtXml_D(prtMeta, canonicalNodes);

  const inputXML=`    <input>\n      <name>ans${X}</name><type>string</type><tans>ta${X}</tans>\n      <boxsize>${size}</boxsize><mustverify>0</mustverify><showvalidation>0</showvalidation>\n    </input>`;

  // Pas de rand() : ansPlain est saisi par l'enseignant, pas de variante à
  // documenter — et {@ta${X}@} est la réponse attendue elle-même.
  const qnote='';
  const generalFeedback=applyFbBox_D('general', mkFbGen_D(I18N_D.t('tpl.str_reponse_attendue', {rep: htmlEsc_D(ansPlain)}), fbGen));

  return{bareme,vars,qnote,generalFeedback,
    textFrag:`
      <div style="background:#dc2626;border-left:5px solid #991b1b;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('tpl.str_banniere')}</strong>
        <span style="background:#991b1b;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
        <span style="background:#ffffff;color:#991b1b;border:1px solid #991b1b;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">${I18N_D.t('tpl.str_badge_texte_leven')}</span>
      </div>
      <!-- ENONCE-START -->${text||''}<!-- ENONCE-END -->${paletteHtml}<p>[[input:ans${X}]] [[validation:ans${X}]]</p>
    `,
    inputXML,prtXML,
  feedbackRef:`[[feedback:prt${X}]]`,prt:{meta:prtMeta,nodes:canonicalNodes}};
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genString: genString, genStringCore: genStringCore, genStringLevenshteinCore: genStringLevenshteinCore };
}


