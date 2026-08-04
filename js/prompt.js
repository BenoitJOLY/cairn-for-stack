// ── GLOBALS & CONFIG ────────────────────────────────────────────────────────
let _pbType = null;  // 'CB' | 'RA' | 'DD'

// State for the cascade inside the prompt builder
const _pb = {mat:null, niv:null, sous:null, chap:null};

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
  const q=document.getElementById('pb-question');if(q)q.value='';
  const xe=document.getElementById('pb-xe');if(xe)xe.value='4';
  const xb=document.getElementById('pb-xb');if(xb)xb.value='2';
  const xbr=document.getElementById('pb-xbr');if(xbr)xbr.value='2';

  // Reset Language Field
  const ls=document.getElementById('pb-lang-select');
  if(ls) ls.value='Français';
  const ll=document.getElementById('pb-lang-libre');
  if(ll) { ll.value=''; ll.style.display='none'; }

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
  const mat  = _pb.mat || (document.getElementById('pb-mat-libre')?.value||'').trim() || '[matière]';
  const niv  = _pb.niv || (document.getElementById('pb-niv-libre')?.value||'').trim() || '[niveau]';
  const sous = _pb.sous || '[sous-matière]';
  const chap = _pb.chap || (document.getElementById('pb-chap-libre')?.value||'').trim() || '[chapitre]';

  // Language Logic
  const langSelect = document.getElementById('pb-lang-select')?.value || 'Français';
  const langInput = document.getElementById('pb-lang-libre')?.value?.trim() || '';
  const langFinal = (langSelect === 'Autre') ? (langInput || '[Langue à préciser]') : langSelect;

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
      ? `Le niveau de Bloom ciblé est : ${bloomVals[0]}.`
      : `Les niveaux de Bloom ciblés sont : ${bloomVals.join(', ')}. Répartis les questions sur ces différents niveaux taxonomiques.`);
  }
  if(erreurOn) opts.push(`Chaque distracteur doit correspondre à une catégorie d'erreur spécifique : 1. Erreur de calcul, 2. Confusion de termes, 3. Inversion de logique (cause/conséquence).`);
  if(piegeOn)  opts.push(`Intègre une proposition 'piège' qui semble correcte au premier abord mais qui est fausse à cause d'une nuance technique ou d'une exception à la règle.`);
  if(latexOn)  opts.push(`Utilise la notation LaTeX pour les formules. RÈGLES : utilise $...$ pour les formules inline et $$...$$ pour les formules display. Exemple inline : "La période $T = \\frac{1}{f}$ est l'inverse de la fréquence." Exemple display : "$$\\lambda = v \\times T$$". Écris les commandes LaTeX normalement (\\frac, \\times, etc.) sans doubler les backslashes.`);

  // ── VF branch ───────────────────────────────────────────────────
  if(isVF){
    let p = '';
    p += `Agis en ingénieur expert en pédagogie. Ta mission est de concevoir un exercice de type "Vrai / Faux". La question posée à l'élève est : "${hasQ?question:'[INDIQUER LA QUESTION ICI]'}".\n`;
    p += `Langue de réponse : ${langFinal}.\n`;
    p += `Cible : Niveau ${niv} en ${mat}, chapitre "${chap}".\n`;
    if(opts.length){ p += `\nCONSIGNES PÉDAGOGIQUES SUPPLÉMENTAIRES :\n`; opts.forEach(o=>{ p += `• ${o}\n`; }); }
    p += `\nCONSIGNES DE RÉDACTION :\n`;
    p += `1. Génère exactement ${xe} propositions, avec un équilibre entre vraies et fausses.\n`;
    p += `2. Chaque proposition doit être une affirmation claire et non ambiguë.\n`;
    p += `3. Pour chaque proposition, le champ "fbIfVrai" est le message affiché à l'élève s'il coche "Vrai", et "fbIfFaux" le message affiché s'il coche "Faux" (quel que soit le champ "reponse").\n`;
    p += `\nCONTRAINTE TECHNIQUE (STRICT JSON) :\nAucun texte avant ou après le bloc JSON. Pas de markdown.\n`;
    if(latexOn){ p += `LATEX : $...$ inline, $$...$$ display. Dans du JSON, double les backslashes (\\\\frac, etc.).\n`; }
    p += `\nFormat attendu :\n`;
    p += `{\n  "vf": [\n`;
    p += `    {"texte": "Affirmation vraie", "reponse": "v", "fbIfVrai": "Exact !", "fbIfFaux": "Incorrect, c'est pourtant vrai car..."},\n`;
    p += `    {"texte": "Affirmation fausse", "reponse": "f", "fbIfVrai": "Incorrect, c'est faux car...", "fbIfFaux": "Exact !"}\n`;
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
  p += `Agis en ingénieur expert en pédagogie et en docimologie. Ta mission est de concevoir `;
  p += isRA ? `un exercice de type "QCM à choix unique"` : `un exercice de type "QCM à choix multiples"`;
  p += `.\nLa question posée à l'élève est : "${hasQ?question:'[INDIQUER LA QUESTION ICI]'}".\n`;
  p += `Langue de réponse : ${langFinal}.\n`;
  p += `Cible : Niveau ${niv} en ${mat}, plus particulièrement en ${sous}, dans le chapitre "${chap}".\n`;

  // opts déjà construit avant la branche VF

  if(opts.length){
    p += `\nCONSIGNES PÉDAGOGIQUES SUPPLÉMENTAIRES :\n`;
    opts.forEach(o=>{ p += `• ${o}\n`; });
  }

  p += `\nCONSIGNES DE RÉDACTION :\n`;
  p += `1. Génère exactement ${xe} propositions.\n`;
  if(isRA){
    p += `2. Génère ${xbr} bonne${xbr>1?'s':''} réponse${xbr>1?'s':''} (pour le pool "vrais") et ${parseInt(xe)-1} distracteurs plausibles (basés sur des erreurs classiques d'élèves). À chaque test, une seule bonne réponse sera tirée aléatoirement parmi les ${xbr}.\n`;
  } else {
    p += `2. Équilibre : Inclus précisément ${xb} réponses exactes et ${parseInt(xe)-parseInt(xb)} distracteurs plausibles (basés sur des erreurs classiques d'élèves).\n`;
  }
  if(syntaxeOn) p += `3. Toutes les propositions doivent avoir une longueur approximativement égale et une structure syntaxique identique (commencer par un verbe, ou par un nom, etc.).\n`;
  p += `${syntaxeOn?'4':'3'}. Rigueur des feedbacks : pour chaque distracteur, NOMME la confusion ou l'erreur précise qu'il révèle (ne te contente jamais d'écrire « faux » ou « incorrect »), puis réaffirme le principe, la loi ou la méthode correcte. Pour la bonne réponse, explique brièvement pourquoi elle est exacte.\n`;

  p += `\nCONTRAINTE TECHNIQUE (STRICT JSON) :\n`;
  p += `Tu ne dois générer AUCUN texte avant ou après le bloc JSON. Pas de balises markdown, pas de commentaires. La sortie doit être directement exploitable par un parseur JSON.\n`;
  if(latexOn){
    p += `LATEX (dans du JSON) : place les formules entre $...$ (en ligne) ou $$...$$ (bloc). Comme la sortie est du JSON, DOUBLE chaque antislash : écris \\\\frac, \\\\times, \\\\lambda (et jamais \\frac). Exemple de valeur JSON valide : "La période $T = \\\\frac{1}{f}$ est l'inverse de la fréquence."\n`;
  } else {
    p += `CARACTÈRES SPÉCIAUX : N'utilise aucune notation LaTeX ni formule mathématique.\n`;
  }
  p += `ÉCHAPPEMENT JSON : à l'intérieur des chaînes, double tout antislash (\\\\) et échappe les guillemets internes (\\"), afin que le JSON reste valide tel quel.\n`;
  p += `CARACTÈRES INTERDITS : N'utilise jamais les caractères § et ! dans aucun champ. Remplace ! par un point ou reformule.\n`;
  const _verifNb = isRA ? `exactement ${xbr} bonne${xbr>1?'s':''} réponse${xbr>1?'s':''} dans "vrais" et ${parseInt(xe)-1} distracteurs dans "faux"` : `exactement ${xe} propositions dont ${xb} correctes`;
  p += `CONTRÔLE FINAL (avant de répondre) : vérifie que (1) le JSON est syntaxiquement valide, (2) il contient ${_verifNb}, (3) aucun caractère § ou !, (4) chaque antislash est doublé, (5) aucun texte hors du bloc JSON. Si tu ne peux pas respecter ces contraintes, renvoie un objet JSON vide {}.\n\n`;

  if(isRA){
    const vraisEx = Array.from({length:xbr},(_,i)=>
      `    {\n      "t": "Intitulé de la bonne réponse ${xbr>1?i+1:''}".trimEnd(),\n      "f": "explication pédagogique spécifique"\n    }`
    ).join(',\n');
    const fauxCount = Math.max(1, parseInt(xe)-1);
    const fauxEx = Array.from({length:Math.min(fauxCount,3)},(_,i)=>
      `    {\n      "t": "Intitulé du distracteur ${i+1}",\n      "f": "explication pédagogique spécifique"\n    }`
    ).join(',\n');
    p += `{\n  "xe": ${xe},\n  "vrais": [\n${Array.from({length:xbr},(_,i)=>`    {\n      "t": "Intitulé de la bonne réponse${xbr>1?' '+(i+1):''}",\n      "f": "explication pédagogique spécifique"\n    }`).join(',\n')}\n  ],\n  "faux": [\n${Array.from({length:Math.min(fauxCount,2)},(_,i)=>`    {\n      "t": "Intitulé du distracteur ${i+1}",\n      "f": "explication pédagogique spécifique"\n    }`).join(',\n')}\n  ]\n}`;
  } else {
    const showOubliCB = _pbType==='CB' && document.getElementById('cb-show-oubli')?.checked;
    if(showOubliCB){
      p += `• Pour chaque proposition VRAIE, inclus un champ "feedback_oubli" : ce texte s'affiche à l'élève quand il N'A PAS coché cette proposition. Explique pourquoi il était important de la sélectionner.\n`;
      p += `{\n  "xe": ${xe},\n  "xb": ${xb},\n  "propositions": [\n    {\n      "valeur": true,\n      "texte": "Énoncé de la proposition vraie",\n      "feedback": "Analyse pédagogique si cochée",\n      "feedback_oubli": "Explication de pourquoi cette proposition devait être cochée"\n    },\n    {\n      "valeur": false,\n      "texte": "Énoncé d'une proposition fausse",\n      "feedback": "Analyse pédagogique"\n    }\n  ]\n}`;
    } else {
      p += `{\n  "xe": ${xe},\n  "xb": ${xb},\n  "propositions": [\n    {\n      "valeur": true,\n      "texte": "Énoncé de la proposition",\n      "feedback": "Analyse pédagogique"\n    }\n  ]\n}`;
    }
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

  // Injecter la question dans l'énoncé du type en cours
  const question = (document.getElementById('pb-question')?.value||'').trim();
  if(question){
    const textIdMap = {CB:'cb-text', RA:'ra-text', DD:'dd-text', VF:'vf-text'};
    const textId = textIdMap[_pbType];
    if(textId){
      const current = richVal(textId);
      setRichVal(textId, (current||'') + `<p>${question}</p>`);
    }
  }

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

// Même injection de la question dans le champ énoncé que pbCopy(), pour que le
// résultat soit identique que l'utilisateur passe par l'IA ou le copier/coller.
function _pbInjectQuestionText(){
  const question=(document.getElementById('pb-question')?.value||'').trim();
  if(!question) return;
  const textIdMap={CB:'cb-text',RA:'ra-text',DD:'dd-text',VF:'vf-text'};
  const textId=textIdMap[_pbType];
  if(!textId) return;
  const current=richVal(textId);
  setRichVal(textId,(current||'')+`<p>${question}</p>`);
}

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
    if(!res.ok) throw new Error(data.error||'Échec de la génération IA.');
    if(data.fallback){
      if(targetType==='RA') importRAJSON(); else importDDJSON();
      return;
    }
    _pbInjectQuestionText();
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