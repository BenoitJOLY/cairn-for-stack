// ── GLOBALS & CONFIG ────────────────────────────────────────────────────────
let _pbType = null;  // 'CB' | 'RA' | 'DD'

// State for the cascade inside the prompt builder
const _pb = {mat:null, niv:null, sous:null, chap:null};

// Lien bidirectionnel énoncé ↔ champ "Question / Thème" du générateur de prompt IA.
// Les deux ne sont pas fusionnés (append) mais miroir l'un de l'autre : la case
// pb-question EST l'énoncé (en texte brut), donc modifier l'un modifie l'autre.
const _pbTextIdMap = {CB:'cb-text', RA:'ra-text', DD:'dd-text', VF:'vf-text'};
function _pbTextIdForType(type){ return _pbTextIdMap[type] || null; }
function _pbHtmlToText(html){
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return (tmp.textContent || tmp.innerText || '').trim();
}
function _pbTextToHtml(text){
  const esc = (text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return esc ? '<p>' + esc.replace(/\n/g,'<br>') + '</p>' : '';
}
// Appelé uniquement par l'événement input du champ pb-question (jamais lors d'un
// pré-remplissage programmatique) pour ne jamais écraser silencieusement un
// énoncé existant tant que l'utilisateur n'a pas lui-même retapé dedans.
function pbSyncQuestionToText(){
  const textId = _pbTextIdForType(_pbType);
  if(!textId) return;
  setRichVal(textId, _pbTextToHtml(document.getElementById('pb-question')?.value||''));
}

// Cascade IA (institutionnelle → personnelle → aucune) — voir plan §8.
// Récupéré une fois au chargement pour savoir si le bouton "Générer avec l'IA"
// doit être proposé à côté du copier/coller manuel (v1 scopée à RA/DD).
let _aiStatus = { available: false, tier: 'none' };
async function _fetchAiStatus(){
  try {
    const res = await fetch('/api/ai/status');
    if(res.ok) _aiStatus = await res.json();
  } catch(e) { console.error('_fetchAiStatus:', e); }
}
_fetchAiStatus();

// ── MODAL MANAGEMENT ─────────────────────────────────────────────────────────

function openPromptBuilder(type){
  _pbType = type;
  const colors={CB:'var(--checkbox)',RA:'var(--radio)',DD:'var(--dropdown)',VF:'#84cc16'};
  const typeKeyMap={CB:'tpl.vf_type_checkbox',RA:'tpl.vf_type_radio',DD:'tpl.vf_type_dropdown',VF:'tpl.vf_type_vf'};
  const head=document.getElementById('pb-head');
  if(head) head.style.background=colors[type]||'#6366f1';
  const title=document.getElementById('pb-head-title');
  const typeKey=typeKeyMap[type];
  if(title) title.innerHTML='<svg class="hs-ico"><use href="#ico-tool-ai"></use></svg> '+I18N.t('modal.pb_prefix')+' — '+(typeKey?I18N.t(typeKey):type);
  
  // Show/hide XB field (CB only) and XBR field (RA/DD only)
  const xbf=document.getElementById('pb-xb-field');
  if(xbf) xbf.style.display=type==='CB'?'':'none';
  const xbrf=document.getElementById('pb-xbr-field');
  if(xbrf) xbrf.style.display=(type==='RA'||type==='DD')?'':'none';
  // VF : dark text on light bg
  const pbHead=document.getElementById('pb-head');
  if(pbHead) pbHead.style.color=(type==='VF')?'#365314':'#fff';
  
  // Reset cascade state
  Object.assign(_pb,{mat:null,niv:null,sous:null,chap:null});
  ['pb-niv-field','pb-sous-field','pb-chap-field'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='none';
  });
  ['pb-mat-libre','pb-niv-libre','pb-chap-libre'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='none';
  });
  const bs=document.getElementById('pb-bloom-select');if(bs)bs.style.display='none';
  pbResetBloom();
  
  // Reset checkboxes and inputs
  ['pb-opt-bloom','pb-opt-erreur','pb-opt-piege','pb-opt-latex','pb-opt-syntaxe'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.checked=false;
  });
  // Pré-remplissage depuis l'énoncé déjà saisi (lien bidirectionnel) plutôt qu'un
  // champ vide — voir pbSyncQuestionToText() pour le sens inverse.
  const q=document.getElementById('pb-question');
  if(q){
    const textId=_pbTextIdForType(type);
    q.value = textId ? _pbHtmlToText(richVal(textId)) : '';
  }
  const xe=document.getElementById('pb-xe');if(xe)xe.value='4';
  const xb=document.getElementById('pb-xb');if(xb)xb.value='2';
  const xbr=document.getElementById('pb-xbr');if(xbr)xbr.value='2';

  // Reset Language Field — défaut = langue d'interface courante, mais le
  // sélecteur reste modifiable par l'utilisateur (retour utilisateur 2026-08-06).
  const ls=document.getElementById('pb-lang-select');
  const ll=document.getElementById('pb-lang-libre');
  const _pbLangBySelectValue={fr:'Français',en:'Anglais',es:'Espagnol',de:'Allemand'};
  const _curUiLang=(typeof I18N!=='undefined'&&I18N.getLang)?I18N.getLang():'fr';
  const _mappedLang=_pbLangBySelectValue[_curUiLang];
  if(ls){
    if(_mappedLang){
      ls.value=_mappedLang;
      if(ll){ ll.value=''; ll.style.display='none'; }
    } else {
      ls.value='Autre';
      if(ll){ ll.value=(typeof I18N!=='undefined'&&I18N.name)?I18N.name(_curUiLang):''; ll.style.display='block'; }
    }
  }

  // Rebuild cascade buttons and initial preview
  pbInitMat();
  pbBuild();

  // Génération IA v1 scopée à RA/DD (js/prompt.js, applyRAJSON/applyDDJSON) —
  // masqué pour CB/VF et si aucune clé (institutionnelle ou perso) n'est disponible.
  const aiBtn=document.getElementById('pb-ai-btn');
  if(aiBtn) aiBtn.style.display=((type==='RA'||type==='DD')&&_aiStatus.available)?'':'none';

  const modal=document.getElementById('promptModal');
  if(modal){modal.style.display='flex';FocusTrap.trap(modal,closePB);}
}

function closePB(){
  document.getElementById('promptModal').style.display='none';
  FocusTrap.release();
}

// Sélection multiple des niveaux de Bloom
function pbToggleBloom(btn){
  btn.classList.toggle('active');
  pbBuild();
}
function pbResetBloom(){
  // Par défaut : seul le premier niveau (Connaissance) est actif.
  document.querySelectorAll('#pb-bloom-grp .pb-cascade-btn').forEach((b,i)=>{
    b.classList.toggle('active', i===0);
  });
}

// ── LANGUAGE HANDLER ────────────────────────────────────────────────────────

function pbToggleLang() {
  const select = document.getElementById('pb-lang-select');
  const input = document.getElementById('pb-lang-libre');
  
  if (select && input) {
    if (select.value === 'Autre') {
      input.style.display = 'block';
      input.focus();
    } else {
      input.style.display = 'none';
      input.value = '';
    }
    pbBuild();
  }
}

// ── CASCADE HELPERS ─────────────────────────────────────────────────────────

function pbInitMat(){
  const grp=document.getElementById('pb-mat-grp'); 
  if(!grp) return;
  grp.innerHTML='';
  const mats=Object.keys(tagsArbre||{});
  mats.forEach(mat=>{
    const btn=pbBtn(mat,mat); 
    btn.onclick=()=>pbSelectMat(mat,btn); 
    grp.appendChild(btn);
  });
  const libreBtn=pbBtn('Autre…','__libre__');
  libreBtn.onclick=()=>{
    libreBtn.classList.toggle('active');
    {const _el=document.getElementById('pb-mat-libre');if(_el)_el.style.display=libreBtn.classList.contains('active')?'block':'none';};
    pbBuild();
  };
  grp.appendChild(libreBtn);
}

function pbBtn(label, val){
  const b=document.createElement('button');
  b.className='pb-cascade-btn'; b.dataset.val=val; b.textContent=label; return b;
}

function pbSelectMat(mat,btn){
  if(btn.classList.contains('active')){
    btn.classList.remove('active'); _pb.mat=null; _pb.niv=null; _pb.sous=null; _pb.chap=null;
    {const _el=document.getElementById('pb-niv-field');if(_el)_el.style.display='none';};
    {const _el=document.getElementById('pb-sous-field');if(_el)_el.style.display='none';};
    {const _el=document.getElementById('pb-chap-field');if(_el)_el.style.display='none';};
    pbBuild(); return;
  }
  document.querySelectorAll('#pb-mat-grp .pb-cascade-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); _pb.mat=mat; _pb.niv=null; _pb.sous=null; _pb.chap=null;
  
  // Build niveau
  const nivGrp=document.getElementById('pb-niv-grp'); 
  if(!nivGrp) return;
  nivGrp.innerHTML='';
  const matData=tagsArbre[mat]||{};
  const allNivs=['2nde','1ere','Term','1STL','1STMG','TSTL','TSTMG'];
  allNivs.forEach(niv=>{
    const btn2=pbBtn(niv==='1ere'?'1ère':niv,niv);
    if(matData[niv]) btn2.style.fontWeight='700';
    btn2.onclick=()=>pbSelectNiv(mat,niv,btn2);
    nivGrp.appendChild(btn2);
  });
  const libreNiv=pbBtn('Autre…','__libre__');
  libreNiv.onclick=()=>{
    libreNiv.classList.toggle('active');
    {const _el=document.getElementById('pb-niv-libre');if(_el)_el.style.display=libreNiv.classList.contains('active')?'block':'none';};
    pbBuild();
  };
  nivGrp.appendChild(libreNiv);
  
  {const _el=document.getElementById('pb-niv-field');if(_el)_el.style.display='';};
  {const _el=document.getElementById('pb-sous-field');if(_el)_el.style.display='none';};
  {const _el=document.getElementById('pb-chap-field');if(_el)_el.style.display='none';};
  pbBuild();
}

function pbSelectNiv(mat,niv,btn){
  if(btn.classList.contains('active')){
    btn.classList.remove('active'); _pb.niv=null; _pb.sous=null; _pb.chap=null;
    {const _el=document.getElementById('pb-sous-field');if(_el)_el.style.display='none';};
    {const _el=document.getElementById('pb-chap-field');if(_el)_el.style.display='none';};
    pbBuild(); return;
  }
  document.querySelectorAll('#pb-niv-grp .pb-cascade-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); _pb.niv=niv; _pb.sous=null; _pb.chap=null;
  
  // Build sous-matière
  const sousData=(tagsArbre[mat]||{})[niv]||{};
  const sousGrp=document.getElementById('pb-sous-grp'); 
  if(!sousGrp) return;
  sousGrp.innerHTML='';
  Object.keys(sousData).forEach(sous=>{
    const btn3=pbBtn(sous.replace(/_/g,' '),sous);
    btn3.onclick=()=>pbSelectSous(mat,niv,sous,btn3);
    sousGrp.appendChild(btn3);
  });
  {const _el=document.getElementById('pb-sous-field');if(_el)_el.style.display=Object.keys(sousData).length?'':'none';};
  {const _el=document.getElementById('pb-chap-field');if(_el)_el.style.display='none';};
  pbBuild();
}

function pbSelectSous(mat,niv,sous,btn){
  if(btn.classList.contains('active')){
    btn.classList.remove('active'); _pb.sous=null; _pb.chap=null;
    {const _el=document.getElementById('pb-chap-field');if(_el)_el.style.display='none';};
    pbBuild(); return;
  }
  document.querySelectorAll('#pb-sous-grp .pb-cascade-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); _pb.sous=sous; _pb.chap=null;
  
  // Build chapitres
  const chaps=((tagsArbre[mat]||{})[niv]||{})[sous]||[];
  const chapGrp=document.getElementById('pb-chap-grp'); 
  if(!chapGrp) return;
  chapGrp.innerHTML='';
  chaps.forEach(chap=>{
    const btn4=pbBtn(chap.replace(/_/g,' '),chap);
    btn4.onclick=()=>pbSelectChap(chap,btn4);
    chapGrp.appendChild(btn4);
  });
  // libre input
  const libreChap=pbBtn('Autre…','__libre__');
  libreChap.onclick=()=>{
    libreChap.classList.toggle('active');
    {const _el=document.getElementById('pb-chap-libre');if(_el)_el.style.display=libreChap.classList.contains('active')?'block':'none';};
    pbBuild();
  };
  chapGrp.appendChild(libreChap);
  {const _el=document.getElementById('pb-chap-field');if(_el)_el.style.display='';};
  pbBuild();
}

function pbSelectChap(chap,btn){
  if(btn.classList.contains('active')){
    btn.classList.remove('active'); _pb.chap=null; pbBuild(); return;
  }
  document.querySelectorAll('#pb-chap-grp .pb-cascade-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); _pb.chap=chap; pbBuild();
}

// ── PROMPT BUILDER CORE (Updated) ────────────────────────────────────────────

function pbBuild(){
  const question = (document.getElementById('pb-question')?.value||'').trim();
  const xe  = document.getElementById('pb-xe')?.value||'4';
  const xb  = _pbType==='CB' ? (document.getElementById('pb-xb')?.value||'2') : '1';
  const xbr = (_pbType==='RA'||_pbType==='DD') ? (parseInt(document.getElementById('pb-xbr')?.value||'2')) : 1;

  // Resolved context
  const mat  = _pb.mat || (document.getElementById('pb-mat-libre')?.value||'').trim() || I18N.t('pb.ph_matiere');
  const niv  = _pb.niv || (document.getElementById('pb-niv-libre')?.value||'').trim() || I18N.t('pb.ph_niveau');
  const sous = _pb.sous || I18N.t('pb.ph_sous_matiere');
  const chap = _pb.chap || (document.getElementById('pb-chap-libre')?.value||'').trim() || I18N.t('pb.ph_chapitre');

  // Language Logic
  const langSelect = document.getElementById('pb-lang-select')?.value || 'Français';
  const langInput = document.getElementById('pb-lang-libre')?.value?.trim() || '';
  const langFinal = (langSelect === 'Autre') ? (langInput || I18N.t('pb.ph_langue')) : langSelect;

  // Options
  const bloomOn  = document.getElementById('pb-opt-bloom')?.checked;
  const bloomVals = Array.from(document.querySelectorAll('#pb-bloom-grp .pb-cascade-btn.active')).map(b=>b.textContent.trim());
  const erreurOn = document.getElementById('pb-opt-erreur')?.checked;
  const piegeOn  = document.getElementById('pb-opt-piege')?.checked;
  const latexOn  = document.getElementById('pb-opt-latex')?.checked;
  const syntaxeOn= document.getElementById('pb-opt-syntaxe')?.checked;

  const hasQ = question.length > 0;
  const isRA = _pbType==='RA'||_pbType==='DD';
  const isVF = _pbType==='VF';

  // Options communes (bloom exclues du VF)
  const opts = [];
  if(!isVF && bloomOn && bloomVals.length){
    opts.push(bloomVals.length===1
      ? I18N.t('pb.opt_bloom_single', {niveau: bloomVals[0]})
      : I18N.t('pb.opt_bloom_multi', {niveaux: bloomVals.join(', ')}));
  }
  if(erreurOn) opts.push(I18N.t('pb.opt_erreur'));
  if(piegeOn)  opts.push(I18N.t('pb.opt_piege'));
  if(latexOn)  opts.push(I18N.t('pb.opt_latex'));

  // ── VF branch ───────────────────────────────────────────────────
  if(isVF){
    let p = '';
    p += `${I18N.t('pb.role_vf')} ${I18N.t('pb.question_posee', {question: hasQ?question:I18N.t('pb.ph_question')})}\n`;
    p += `${I18N.t('pb.langue_reponse', {lang: langFinal})}\n`;
    p += `${I18N.t('pb.cible_vf', {niv, mat, chap})}\n`;
    if(opts.length){ p += `\n${I18N.t('pb.consignes_pedago_title')}\n`; opts.forEach(o=>{ p += `• ${o}\n`; }); }
    p += `\n${I18N.t('pb.consignes_redaction_title')}\n`;
    p += `1. ${I18N.t('pb.vf_consigne1', {xe})}\n`;
    p += `2. ${I18N.t('pb.vf_consigne2')}\n`;
    p += `3. ${I18N.t('pb.vf_consigne3')}\n`;
    p += `\n${I18N.t('pb.contrainte_json_title')}\n${I18N.t('pb.vf_contrainte_json_body')}\n`;
    if(latexOn){ p += `${I18N.t('pb.vf_latex_json')}\n`; }
    p += `\n${I18N.t('pb.format_attendu_title')}\n`;
    p += `{\n  "vf": [\n`;
    p += `    {"texte": "${I18N.t('pb.vf_ex_affirmation_vraie')}", "reponse": "v", "fbIfVrai": "${I18N.t('pb.vf_ex_exact')}", "fbIfFaux": "${I18N.t('pb.vf_ex_incorrect_vrai')}"},\n`;
    p += `    {"texte": "${I18N.t('pb.vf_ex_affirmation_fausse')}", "reponse": "f", "fbIfVrai": "${I18N.t('pb.vf_ex_incorrect_faux')}", "fbIfFaux": "${I18N.t('pb.vf_ex_exact')}"}\n`;
    p += `  ]\n}`;
    const prev=document.getElementById('pb-preview');
    if(prev) prev.textContent=p;
    const btn=document.getElementById('pb-copy-btn');
    if(btn) btn.disabled=false;
    window._pbPromptText=p;
    return;
  }
  // ── END VF branch ────────────────────────────────────────────────

  // Build prompt
  let p = '';
  const qcmType = I18N.t(isRA ? 'pb.qcm_type_unique' : 'pb.qcm_type_multiple');
  p += I18N.t('pb.role_qcm', {type: qcmType});
  p += `\n${I18N.t('pb.question_posee', {question: hasQ?question:I18N.t('pb.ph_question')})}\n`;
  p += `${I18N.t('pb.langue_reponse', {lang: langFinal})}\n`;
  p += `${I18N.t('pb.cible_qcm', {niv, mat, sous, chap})}\n`;

  // opts déjà construit avant la branche VF

  if(opts.length){
    p += `\n${I18N.t('pb.consignes_pedago_title')}\n`;
    opts.forEach(o=>{ p += `• ${o}\n`; });
  }

  p += `\n${I18N.t('pb.consignes_redaction_title')}\n`;
  p += `1. ${I18N.t('pb.qcm_consigne1', {xe})}\n`;
  if(isRA){
    const distracteurs = parseInt(xe)-1;
    p += `2. ${I18N.t(xbr>1?'pb.qcm_ra_plural':'pb.qcm_ra_singular', {xbr, distracteurs})}\n`;
  } else {
    const distracteurs = parseInt(xe)-parseInt(xb);
    p += `2. ${I18N.t('pb.qcm_cb_consigne2', {xb, distracteurs})}\n`;
  }
  if(syntaxeOn) p += `3. ${I18N.t('pb.qcm_syntaxe')}\n`;
  p += `${syntaxeOn?'4':'3'}. ${I18N.t('pb.qcm_rigueur_feedback')}\n`;

  p += `\n${I18N.t('pb.contrainte_json_title')}\n`;
  p += `${I18N.t('pb.qcm_contrainte_json_body')}\n`;
  if(latexOn){
    p += `${I18N.t('pb.qcm_latex_json')}\n`;
  } else {
    p += `${I18N.t('pb.qcm_no_latex')}\n`;
  }
  p += `${I18N.t('pb.qcm_echappement_json')}\n`;
  p += `${I18N.t('pb.qcm_interdits')}\n`;
  const distracteursVerif = parseInt(xe)-1;
  const _verifNb = isRA
    ? I18N.t(xbr>1?'pb.qcm_verif_ra_plural':'pb.qcm_verif_ra', {xbr, distracteurs: distracteursVerif})
    : I18N.t('pb.qcm_verif_cb', {xe, xb});
  p += `${I18N.t('pb.qcm_controle_final', {verif: _verifNb})}\n\n`;

  if(isRA){
    const bonneReponseLabel = I18N.t('pb.ex_bonne_reponse_label');
    const distracteurLabel = I18N.t('pb.ex_distracteur_label');
    const explicationPedago = I18N.t('pb.ex_explication_pedago');
    const fauxCount = Math.max(1, parseInt(xe)-1);
    p += `{\n  "xe": ${xe},\n  "vrais": [\n${Array.from({length:xbr},(_,i)=>`    {\n      "t": "${bonneReponseLabel}${xbr>1?' '+(i+1):''}",\n      "f": "${explicationPedago}"\n    }`).join(',\n')}\n  ],\n  "faux": [\n${Array.from({length:Math.min(fauxCount,2)},(_,i)=>`    {\n      "t": "${distracteurLabel} ${i+1}",\n      "f": "${explicationPedago}"\n    }`).join(',\n')}\n  ]\n}`;
  } else {
    // Le feedback "vraie non cochée" est toujours demandé à l'IA, même si la case
    // "cb-show-oubli" n'est pas cochée : l'enseignant a pu simplement oublier de
    // l'activer. La donnée reste dans le JSON importé (addCBRow/.p-fb2) et n'est
    // que masquée dans l'UI tant que la case n'est pas cochée — elle réapparaît
    // intacte si l'enseignant change d'avis (voir toggleCBOubli() dans prop-rows.js).
    p += `• ${I18N.t('pb.cb_feedback_oubli_instr')}\n`;
    p += `{\n  "xe": ${xe},\n  "xb": ${xb},\n  "propositions": [\n    {\n      "valeur": true,\n      "texte": "${I18N.t('pb.ex_enonce_prop_vraie')}",\n      "feedback": "${I18N.t('pb.ex_analyse_si_cochee')}",\n      "feedback_oubli": "${I18N.t('pb.ex_explication_oubli')}"\n    },\n    {\n      "valeur": false,\n      "texte": "${I18N.t('pb.ex_enonce_prop_fausse')}",\n      "feedback": "${I18N.t('pb.ex_analyse_pedago')}"\n    }\n  ]\n}`;
  }

  const prev = document.getElementById('pb-preview');
  if(prev) prev.textContent = p;
  
  const btn = document.getElementById('pb-copy-btn');
  if(btn) btn.disabled = false;
  
  window._pbPromptText = p;
}

// ── COPY / CLIPBOARD ─────────────────────────────────────────────────────────

function pbCopy(){
  const text = window._pbPromptText||'';
  if(!text){ toast(I18N.t('msg.aucun_prompt_a_copier')); return; }

  // L'énoncé est déjà synchronisé en direct avec pb-question (pbSyncQuestionToText) :
  // plus besoin d'y injecter la question ici.

  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text)
      .then(()=>{ toast(I18N.t('msg.prompt_copie_presse_papier')); closePB(); })
      .catch(()=>{ pbFallbackCopy(text); });
  } else {
    pbFallbackCopy(text);
  }
}

function pbFallbackCopy(text){
  const ta=document.createElement('textarea');
  ta.value=text; ta.style.cssText='position:fixed;opacity:0;top:0;left:0;';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); toast(I18N.t('msg.prompt_copie')); closePB(); }
  catch(e){ toast(I18N.t('msg.copie_impossible')); }
  document.body.removeChild(ta);
}

// ── GÉNÉRATION IA (RA/DD uniquement, cascade institutionnelle/perso — plan §8) ──

function pbGenerateWithAI(){
  const applyFn=_pbType==='RA'?applyRAJSON:(_pbType==='DD'?applyDDJSON:null);
  if(!applyFn) return;
  aiGenerateAndImport(_pbType,applyFn);
}

// Appelle /api/ai/generate ; sur {fallback:true} (aucune clé IA disponible),
// bascule silencieusement vers le flux manuel actuel (window.prompt()) plutôt
// que d'afficher une erreur — comportement identique à aujourd'hui pour un
// enseignant sans clé configurée.
async function aiGenerateAndImport(targetType,applyFn){
  const promptText=window._pbPromptText||'';
  if(!promptText){ toast(I18N.t('msg.aucun_prompt_a_copier')); return; }
  const btn=document.getElementById('pb-ai-btn');
  const originalLabel=btn?btn.innerHTML:'';
  if(btn){ btn.disabled=true; btn.textContent=I18N.t('ai.generation_en_cours')||'Génération…'; }
  try{
    const res=await fetch('/api/ai/generate',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({prompt:promptText,targetType:targetType})
    });
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||I18N.t('ai.echec_generation'));
    if(data.fallback){
      if(targetType==='RA') importRAJSON(); else importDDJSON();
      return;
    }
    applyFn(data.data);
    toast(I18N.t('msg.json_importe'));
    closePB();
  }catch(e){
    console.error('aiGenerateAndImport:',e);
    toast(e.message);
  }finally{
    if(btn){ btn.disabled=false; btn.innerHTML=originalLabel; }
  }
}

// ── JSON IMPORT/EXPORT UTILITIES ─────────────────────────────────────────────

function exportVFJSON(){
  const rows=document.querySelectorAll('#vf-props .vf-row');
  const d={vf:[]};
  rows.forEach(r=>{
    const expEl=r.querySelector('.vf-exp:checked');
    const rep=expEl?expEl.value:'v';
    const item={texte:r.querySelector('.vf-ptext').value,reponse:rep,
      fbIfVrai:r.querySelector('.vf-fb-ifvrai')?.value||'',fbIfFaux:r.querySelector('.vf-fb-iffaux')?.value||''};
    d.vf.push(item);
  });
  dlJSON(d,'vf_config.json');
}

function exportCBJSON(){
  const rows=document.querySelectorAll('#cb-props .prop-row');
  const showOubli=document.getElementById('cb-show-oubli')?.checked;
  const d={xe:parseInt(v('cb-xe')),xb:parseInt(v('cb-xb')),propositions:[]};
  rows.forEach(r=>{
    const isV=r.querySelector('.p-bool').value==='true';
    const item={valeur:isV,texte:r.querySelector('.p-text').value,feedback:r.querySelector('.p-fb').value};
    if(showOubli&&isV)item.feedback_oubli=r.querySelector('.p-fb2')?.value||'';
    d.propositions.push(item);
  });
  dlJSON(d,'cb_config.json');
}

function applyRAJSON(d){
  document.getElementById('ra-vrais').innerHTML='';
  document.getElementById('ra-faux').innerHTML='';
  if(d.xe)document.getElementById('ra-xe').value=d.xe;
  (d.vrais||[]).forEach(p=>addPoolRow('ra-vrais',true,p.t,p.f,true));
  (d.faux||[]).forEach(p=>addPoolRow('ra-faux',false,p.t,p.f,true));
  checkPoolWarn('ra');
}

function importRAJSON(){
  const r=prompt('JSON : {xe,vrais:[{t,f},...],faux:[{t,f},...]}');
  if(!r)return;
  try{
    applyRAJSON(JSON.parse(r));
    toast(I18N.t('msg.json_importe'));
  }catch(e){toast(I18N.t('msg.json_invalide'));}
}

function exportRAJSON(){
  const d={xe:parseInt(v('ra-xe')),vrais:[],faux:[]};
  document.querySelectorAll('#ra-vrais .prop-row').forEach(r=>d.vrais.push({t:r.querySelector('.p-text').value,f:r.querySelector('.p-fb').value}));
  document.querySelectorAll('#ra-faux .prop-row').forEach(r=>d.faux.push({t:r.querySelector('.p-text').value,f:r.querySelector('.p-fb').value}));
  dlJSON(d,'ra_config.json');
}

function applyDDJSON(d){
  document.getElementById('dd-vrais').innerHTML='';
  document.getElementById('dd-faux').innerHTML='';
  (d.vrais||[]).forEach(p=>addPoolRow('dd-vrais',true,p.t,p.f,true));
  (d.faux||[]).forEach(p=>addPoolRow('dd-faux',false,p.t,p.f,true));
  checkPoolWarn('dd');
}

function importDDJSON(){
  const r=prompt('JSON : {vrais:[{t,f},...],faux:[{t,f},...]}');
  if(!r)return;
  try{
    applyDDJSON(JSON.parse(r));
    toast(I18N.t('msg.json_importe'));
  }catch(e){toast(I18N.t('msg.json_invalide'));}
}

function exportDDJSON(){
  const d={vrais:[],faux:[]};
  document.querySelectorAll('#dd-vrais .prop-row').forEach(r=>d.vrais.push({t:r.querySelector('.p-text').value,f:r.querySelector('.p-fb').value}));
  document.querySelectorAll('#dd-faux .prop-row').forEach(r=>d.faux.push({t:r.querySelector('.p-text').value,f:r.querySelector('.p-fb').value}));
  dlJSON(d,'dd_config.json');
}

function exportMatchJSON(){
  if(matchState.left.length === 0 && matchState.right.length === 0) return toast(I18N.t('msg.rien_a_exporter'));
  const data = {
    leftItems: matchState.left,
    rightItems: matchState.right,
    connections: matchState.connections.map(c => [c.l, c.r])
  };
  dlJSON(data, 'match_config.json');
}

// ── END OF FILE ─────────────────────────────────────────────────────────────