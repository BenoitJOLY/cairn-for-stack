// ── JSON IMPORT MODAL ───────────────────────────────────────────
let _jsonPageType=null;   // 'CB' | 'RA' | 'DD' | 'CW' | 'VF'
let _jsonParsed=null;     // parsed JSON object
let _jsonDetectedType=null; // 'CB' | 'RA' | 'CW'

function jsonTypeName(pt){
  const k={VF:'vf',CB:'checkbox',RA:'radio',DD:'dropdown',CW:'crossword',MATCH:'match'}[pt];
  return k ? I18N.t('tpl.vf_type_'+k) : I18N.t('json.type_inconnu');
}

function openJsonModal(type){
  _jsonPageType=type; _jsonParsed=null; _jsonDetectedType=null;
  // Ajout de CW dans les couleurs (orange) et labels
  const colors={VF:'#84cc16',CB:'var(--checkbox)',RA:'var(--radio)',DD:'var(--dropdown)',CW:'var(--crossword)'};
  const labels={VF:I18N.t('tpl.vf_type_vf'),CB:I18N.t('tpl.vf_type_checkbox'),RA:I18N.t('tpl.vf_type_radio'),DD:I18N.t('tpl.vf_type_dropdown'),CW:I18N.t('tpl.vf_type_crossword')};

  const jsonHead = document.getElementById('json-modal-head');
  jsonHead.style.background=colors[type]||'var(--navy)';
  // VF et CW : texte sombre (fond clair)
  const darkHead = (type==='CW'||type==='VF');
  jsonHead.style.color = darkHead ? '#0f172a' : '#fff';
  const jsonCloseBtn = jsonHead.querySelector('button');
  if(jsonCloseBtn){ jsonCloseBtn.style.color = darkHead ? '#0f172a' : '#fff'; jsonCloseBtn.style.background = darkHead ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.18)'; }
  document.getElementById('json-modal-title').innerHTML='<svg class="hs-ico" aria-hidden="true"><use href="#ico-file-import"></use></svg> '+I18N.t('msg.json_import_titre', {type: labels[type]||type});
  document.getElementById('json-status').innerHTML='';
  document.getElementById('json-paste-area').value='';
  document.getElementById('json-file-input').value='';
  document.getElementById('json-import-btn').disabled=true;
  jsonSwitchTab('file', document.querySelector('.json-tab'));
  const modal = document.getElementById('jsonImportModal');
  modal.style.display='flex';
  FocusTrap.trap(modal, closeJsonModal);
}

function closeJsonModal(){
  document.getElementById('jsonImportModal').style.display='none';
  FocusTrap.release();
}

function jsonSwitchTab(tab, btn){
  document.querySelectorAll('.json-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.json-tab-content').forEach(c=>c.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('json-tab-'+tab)?.classList.add('active');
}

// Nettoie un fragment HTML venant de l'IA (ex: balises orphelines comme un
// "</p>" final sans "<p>" correspondant) en le faisant passer par le parseur
// HTML natif du navigateur, qui élimine silencieusement les balises non appariées.
function sanitizeHtmlFragment(html){
  if(!html) return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerHTML;
}

function jsonDetectType(obj){
  // Debug : Affiche ce qui est reçu dans la console (F12)
  console.log("Détection du type pour :", obj); 

  // Détection Vrai/Faux
  if(obj && Array.isArray(obj.vf)) return 'VF';

  // Détection Checkbox
  if(obj && Array.isArray(obj.propositions)) return 'CB';
  
  // Détection Radio / Dropdown (ils partagent la structure vrais/faux)
  if(obj && (Array.isArray(obj.vrais) || Array.isArray(obj.faux))) return 'RA';
  
  // Détection Mots Croisés (Tableau d'objets avec word/def)
  if(Array.isArray(obj) && obj.length > 0 && obj[0].hasOwnProperty('word') && obj[0].hasOwnProperty('def')) return 'CW';
  
  // ══════════════════════════════════════════════════
  // C'EST CETTE LIGNE QUI MANQUAIT POUR "RELIER"
  // ══════════════════════════════════════════════════
  if(obj && Array.isArray(obj.leftItems) && Array.isArray(obj.rightItems)) return 'MATCH';
  
  // Si rien ne correspond
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// FONCTION CORRIGÉE : jsonProcessText
// ═══════════════════════════════════════════════════════════════════

/**
 * Répare les guillemets non échappés à l'intérieur des valeurs JSON.
 * Parcourt caractère par caractère en suivant l'état "dans une chaîne"
 * et échappe tout " interne qui n'est pas suivi d'un caractère structurel
 * (, : } ] ou fin de fichier).
 */
function fixUnescapedQuotes(raw){
  let out = '';
  let inStr = false;
  let i = 0;
  while(i < raw.length){
    const c = raw[i];
    if(!inStr){
      out += c;
      if(c === '"') inStr = true;
    } else if(c === '\\'){
      // Séquence d'échappement : prendre les deux caractères tels quels
      out += c; i++;
      if(i < raw.length) out += raw[i];
    } else if(c === '"'){
      // Guillemet fermant réel ou guillemet interne non échappé ?
      // → On regarde le prochain caractère non-blanc
      let j = i + 1;
      while(j < raw.length && /[ \t\r\n]/.test(raw[j])) j++;
      const nx = j < raw.length ? raw[j] : '';
      if([',', ':', '}', ']', ''].includes(nx) || j >= raw.length){
        inStr = false;
        out += c;       // guillemet fermant légitime
      } else {
        out += '\\"';   // guillemet interne → on l'échappe
      }
    } else {
      out += c;
    }
    i++;
  }
  return out;
}

function jsonSanitizeLatex(raw){
  // 1. Extraire le bloc JSON si l'IA a mis du texte autour
  const m = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if(m) raw = m[0];

  // 2. Corriger les \ seuls (ex: \frac → \\frac) sans toucher les \\ existants
  //    ni les échappements \uXXXX/\"/\\// déjà valides — sinon un caractère
  //    accentué renvoyé par l'IA en é devient \\u00e9, que JSON.parse
  //    restitue tel quel en texte littéral au lieu du caractère décodé.
  //    (\b \f \n \r \t ne sont PAS exemptés : ce sont aussi les premières
  //    lettres de commandes LaTeX comme \beta \frac \neq \rho \tan, donc on
  //    garde le doublage pour elles comme avant)
  const dbs = '\\\\';
  raw = raw.replace(/\\u[0-9a-fA-F]{4}|\\["\\\/]|\\/g, m => m.length === 1 ? dbs : m);

  // 2b. Réparer les guillemets non échappés dans les valeurs (ex: "roi des Français")
  raw = fixUnescapedQuotes(raw);

  // 3. Convertir les délimiteurs $ → \\( \\) et $$ → \\[ \\]
  //    On utilise dbs (2 backslashes) et non dbs+dbs (4) car après JSON.parse
  //    et rawEsc, Maxima reçoit 2 backslashes et en restitue 1 seul en HTML,
  //    ce qui donne le délimiteur KaTeX attendu \( ... \)
  //    (ne traverse pas les guillemets ni les sauts de ligne → reste dans les valeurs JSON)
  raw = raw.replace(/\$\$([^"$\n]+?)\$\$/g, (_, c) => dbs + '[' + c + dbs + ']');
  raw = raw.replace(/\$([^"$\n]+?)\$/g,     (_, c) => dbs + '(' + c + dbs + ')');

  return raw;
}

// Enveloppe les commandes LaTeX nues (sans délimiteurs) dans \(...\)
function wrapBareLatex(str){
  if(!str||!/\\[a-zA-Z]/.test(str)) return str;
  // Protéger les blocs \(...\) et \[...\] existants
  const blocks=[];
  str=str.replace(/\\[\(\[][^]*?\\[\)\]]/g, m=>{blocks.push(m);return `\x00B${blocks.length-1}\x00`;});
  // Envelopper les séquences LaTeX nues
  str=str.replace(
    /\\[a-zA-Z]+(?:\{[^}]*\}|\[[^\]]*\])*(?:(?:\s*[=+\-*/^_]\s*|\s+)(?:\\[a-zA-Z]+(?:\{[^}]*\}|\[[^\]]*\])*|\d+(?:[.,]\d+)?|(?<![a-zA-Z])[a-zA-Z](?![a-zA-Z])))*(?:\s*\{[^}]*\})*/g,
    m=>`\\(${m.trim()}\\)`
  );
  // Restaurer
  str=str.replace(/\x00B(\d+)\x00/g,(_,i)=>blocks[+i]);
  return str;
}

// Applique wrapBareLatex récursivement sur toutes les valeurs string d'un objet
function sanitizeObjectLatex(obj){
  if(typeof obj==='string') return wrapBareLatex(obj);
  if(Array.isArray(obj)) return obj.map(sanitizeObjectLatex);
  if(obj&&typeof obj==='object'){const r={};for(const k in obj)r[k]=sanitizeObjectLatex(obj[k]);return r;}
  return obj;
}

function jsonProcessText(text){
  let obj;
  const sanitized = jsonSanitizeLatex(text.trim());
  try{ obj=JSON.parse(sanitized); }
  catch(e){ jsonShowStatus(I18N.t('json.err_invalide',{msg:e.message}),'err'); _jsonParsed=null; document.getElementById('json-import-btn').disabled=true; return; }
  // Envelopper les LaTeX nus restants dans toutes les valeurs string
  obj = sanitizeObjectLatex(obj);
  const det=jsonDetectType(obj);
  _jsonDetectedType=det;
  const expected={VF:'VF',CB:'CB',RA:'RA',DD:'RA',CW:'CW', MATCH:'MATCH'};
  
  // CORRECTION ICI : On utilise _jsonPageType (la variable globale) au lieu de 'type'
  if(det!==expected[_jsonPageType]){
    jsonShowStatus(I18N.t('json.err_format',{det:jsonTypeName(det),expected:jsonTypeName(_jsonPageType)}),'err');
    _jsonParsed=null; document.getElementById('json-import-btn').disabled=true; return;
  }
  _jsonParsed=obj;
  
  // Calcul du nombre d'éléments pour le message de succès
  let nb = 0;
  // CORRECTION ICI : On utilise _jsonPageType
  if (_jsonPageType === 'MATCH') {
      nb = (obj.leftItems || []).length + (obj.rightItems || []).length;
  } else if (_jsonPageType === 'CW') {
      nb = obj.length || 0;
  } else {
      nb = (obj.propositions||[...( obj.vrais||[]),...(obj.faux||[])]).length;
  }

  jsonShowStatus(I18N.t('json.format_detecte',{type:jsonTypeName(_jsonPageType),n:nb}),'ok');
  document.getElementById('json-import-btn').disabled=false;
}

function jsonShowStatus(msg, type){
  const el=document.getElementById('json-status');
  el.innerHTML=`<span class="json-type-badge ${type==='ok'?'json-type-ok':'json-type-err'}">${msg}</span>`;
}

function jsonHandleFile(input){
  const file=input.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>jsonProcessText(e.target.result);
  reader.readAsText(file);
}

// Also handle paste-area blur/input
document.addEventListener('DOMContentLoaded',function(){
  const pa=document.getElementById('json-paste-area');
  if(pa) pa.addEventListener('input',()=>{ if(pa.value.trim()) jsonProcessText(pa.value); });
  // Drag and drop
  const dz=document.getElementById('json-drop-zone');
  if(dz){
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over');});
    dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
    dz.addEventListener('drop',e=>{
      e.preventDefault(); dz.classList.remove('drag-over');
      const file=e.dataTransfer.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=ev=>jsonProcessText(ev.target.result);
      reader.readAsText(file);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// FONCTION CORRIGÉE : jsonConfirmImport (Indentation réparée)
// ═══════════════════════════════════════════════════════════════════
function jsonConfirmImport(){
  if(!_jsonParsed){toast(I18N.t('msg.aucun_json_valide_charge'));return;}
  const type=_jsonPageType;
  
  if(type==='VF'){
    const d=_jsonParsed;
    document.getElementById('vf-props').innerHTML='';
    (d.vf||[]).forEach(p=>addVFRow(p.texte||'', p.reponse==='f'?2:1, p.fbIfVrai||p.fbVrai||p.fbOk||'', p.fbIfFaux||p.fbFaux||p.fbWrong||''));
  } else if(type==='CB'){
    const d=_jsonParsed;
    document.getElementById('cb-props').innerHTML='';
    if(d.xe)document.getElementById('cb-xe').value=d.xe;
    if(d.xb)document.getElementById('cb-xb').value=d.xb;
    (d.propositions||[]).forEach(p=>addCBRow(p.valeur===true||p.valeur==='true',p.texte||p.text||'',p.feedback||p.fb||'',p.feedback_oubli||p.fb2||''));
    validateCBDraw();
  } else if(type==='RA'){
    const d=_jsonParsed;
    document.getElementById('ra-vrais').innerHTML='';document.getElementById('ra-faux').innerHTML='';
    if(d.xe)document.getElementById('ra-xe').value=d.xe;
    (d.vrais||[]).forEach(p=>addPoolRow('ra-vrais',true,p.t||p.text||'',p.f||p.fb||'',true));
    (d.faux||[]).forEach(p=>addPoolRow('ra-faux',false,p.t||p.text||'',p.f||p.fb||'',true));
    checkPoolWarn('ra'); validateRADraw('ra');
  } else if(type==='DD'){
    const d=_jsonParsed;
    document.getElementById('dd-vrais').innerHTML='';document.getElementById('dd-faux').innerHTML='';
    if(d.xe)document.getElementById('dd-xe').value=d.xe;
    (d.vrais||[]).forEach(p=>addPoolRow('dd-vrais',true,p.t||p.text||'',p.f||p.fb||'',true));
    (d.faux||[]).forEach(p=>addPoolRow('dd-faux',false,p.t||p.text||'',p.f||p.fb||'',true));
    checkPoolWarn('dd'); validateRADraw('dd');
  } else if(type==='CW'){
    const d = _jsonParsed;
    if(Array.isArray(d)){
      const list = document.getElementById('cw-body');
      if(list) list.innerHTML = '';

      if(d.length === 0){
        toast(I18N.t('msg.json_vide'));
      } else {
        d.forEach(item => {
          const mot = item.word || "";
          const def = item.def || "";
          if(mot) {
            addCWRow(mot, def); 
          }
        });
        toast(I18N.t('msg.json_mots_importes', {n: d.length}));
      }
    } else {
      toast(I18N.t('msg.erreur_le_format_doit_etre'));
    }
    
    closeJsonModal();
    return;
  
  } else if(type==='MATCH'){
    const d=_jsonParsed;
    // 1. Vérification
    if (!d.leftItems || !d.rightItems) {
      console.error("Structure JSON incorrecte pour Match :", d);
      toast(I18N.t('msg.json_err_match'));
      closeJsonModal();
      return;
    }
    // 2. Reset State
    matchState = { left: [], right: [], connections: [], selectedLeft: null };
    // 3. Import
    try {
      matchState.left = (d.leftItems || []).map((item, idx) => {
        if (typeof item === 'string') { const h = sanitizeHtmlFragment(item); return { id: idx, html: h, text: item }; }
        return { id: item.id || idx, html: sanitizeHtmlFragment(item.html || ''), text: item.text || '' };
      });
      matchState.right = (d.rightItems || []).map((item, idx) => {
        if (typeof item === 'string') { const h = sanitizeHtmlFragment(item); return { id: idx, html: h, text: item }; }
        return { id: item.id || idx, html: sanitizeHtmlFragment(item.html || ''), text: item.text || '' };
      });
      if (Array.isArray(d.connections)) {
        matchState.connections = d.connections.map(c => {
          if (Array.isArray(c) && c.length >= 2) { return { l: c[0], r: c[1] }; }
          return c;
        });
      }
      console.log("Import Match réussi. État actuel :", matchState);
    } catch (e) {
      console.error("Erreur lors du traitement des données Match :", e);
      toast(I18N.t('msg.erreur_lors_de_la_lecture'));
      closeJsonModal();
      return;
    }
    // 4. Render
    renderMatchLists();
    const totalItems = (matchState.left.length || 0) + (matchState.right.length || 0);
    toast(I18N.t('json.import_reussi',{n:totalItems}));
    closeJsonModal();
    return;
  }
  // FIN DU ELSE IF
  closeJsonModal();
  toast(I18N.t('msg.json_importe_avec_succes'));
}


// Fonction pour effacer les doublons (utile si vous avez copié plusieurs fois)
// Vous pouvez l'ajouter tout en haut de votre script pour nettoyer
// 
// Keep old functions as no-ops for compatibility
function importCBJSON(){openJsonModal('CB');}
function importRAJSON(){openJsonModal('RA');}
function importDDJSON(){openJsonModal('DD');}
function checkPoolWarn(prefix){const Xe=parseInt(v(prefix+'-xe'))||4;const vrais=document.querySelectorAll(`#${prefix}-vrais .prop-row`).length;const faux=document.querySelectorAll(`#${prefix}-faux .prop-row`).length;const warn=document.getElementById('warn-'+prefix);if(warn)warn.style.display=(vrais<1||faux<Xe-1)?'block':'none';}
// ══════════════════════════════════════════════════════
//  POOL VALIDATION
// ══════════════════════════════════════════════════════
function validatePool(prefix,label){const Xe=parseInt(v(prefix+'-xe'))||4;const vrais=document.querySelectorAll(`#${prefix}-vrais .prop-row`).length;const faux=document.querySelectorAll(`#${prefix}-faux .prop-row`).length;if(vrais<1)throw new Error(`${label} : le pool VRAI doit contenir au moins 1 bonne réponse.`);if(faux<Xe-1)throw new Error(`${label} : le pool FAUX doit contenir au moins ${Xe-1} distracteur(s) pour Xe=${Xe}.`);if(vrais+faux<Xe)throw new Error(`${label} : total (${vrais+faux}) insuffisant pour Xe=${Xe}.`);}

// ══════════════════════════════════════════════════════
//  JSON
// ══════════════════════════════════════════════════════
function dlJSON(obj,name){const b=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});Object.assign(document.createElement('a'),{href:URL.createObjectURL(b),download:name}).click();}
function importCBJSON(){const r=prompt('JSON : {xe,xb,propositions:[{valeur,texte,feedback},...]}');if(!r)return;try{const d=JSON.parse(r);document.getElementById('cb-props').innerHTML='';if(d.xe)document.getElementById('cb-xe').value=d.xe;if(d.xb)document.getElementById('cb-xb').value=d.xb;(d.propositions||[]).forEach(p=>addCBRow(p.valeur===true||p.valeur==='true',p.texte||'',p.feedback||'',p.feedback_oubli||p.fb2||''));toast(I18N.t('msg.json_importe'));}catch(e){toast('❌ JSON invalide');}}
