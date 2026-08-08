/*
 * StackForge — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// ── VERIFICATION MODAL ──────────────────────────────────────────
//  VÉRIFICATION / PRÉVISUALISATION (Fidèle à verif.htm)
// ════════════════════════════════════════════════════════

// Storage for edited XML doc and tags
let _verifXmlDoc=null, _verifTags=[], _verifFileName='';

let _verifPrtStorage = []; 
let _verifImgCtr=0;

// Full verif toolbar — identical buttons to the question rich editor
function verifSetActive(id){
  _verifZoneActive=document.getElementById(id)||null;
}

function verifExecR(id, cmd, val){
  const el = document.getElementById(id);
  if(!el)return;
  _verifZoneActive=el;
  el.focus();
  document.execCommand(cmd,false,val||null);
}

function verifOpenLatexModal(id){
  verifSetActive(id);
  openLatexModal();
}
function verifOpenLinkModal(id){
  verifSetActive(id);
  openLinkModal();
}
function verifInsertVideo(id){
  verifSetActive(id);
  insertRichVideo();
}
function verifToggleTable(id){
  verifSetActive(id);
  toggleTableDialog();
}

function verifHandleImage(input,id){
  const file=input.files[0];
  if(!file)return;
  verifSetActive(id);
  handleRichImage(input);
}

function verifCreateToolbar(targetId){
  const uid=++_verifImgCtr;
  const imgId=`vf-img-${uid}`;
  return `<div class="rich-toolbar" style="border-radius:6px 6px 0 0;">
    <button class="rtb" onclick="verifExecR('${targetId}','bold')"><b>G</b></button>
    <button class="rtb" onclick="verifExecR('${targetId}','italic')"><i>I</i></button>
    <button class="rtb" onclick="verifExecR('${targetId}','underline')"><u>S</u></button>
    <div class="rtb-sep"></div>
    <span style="font-size:.75rem;font-weight:600;color:var(--slate);padding:0 2px;">A</span>
    <input type="color" class="rtb-color" value="#000000" onchange="verifExecR('${targetId}','foreColor',this.value)" title="${I18N.t('tpl.vf_couleur_texte')}" aria-label="${I18N.t('tpl.vf_couleur_texte')}">
    <span style="font-size:.75rem;font-weight:600;color:#1e293b;padding:0 2px;background:#ffff00;border-radius:3px;">HL</span>
    <input type="color" class="rtb-color" value="#ffff00" onchange="verifExecR('${targetId}','hiliteColor',this.value)" title="${I18N.t('tpl.vf_surlignage')}" aria-label="${I18N.t('tpl.vf_surlignage')}">
    <div class="rtb-sep"></div>
    <button class="rtb" onclick="verifExecR('${targetId}','insertUnorderedList')">${I18N.t('tpl.vf_tb_liste_ul')}</button>
    <button class="rtb" onclick="verifExecR('${targetId}','insertOrderedList')">${I18N.t('tpl.vf_tb_liste_ol')}</button>
    <div class="rtb-sep"></div>
    <button class="rtb" onclick="verifExecR('${targetId}','justifyLeft')" title="${I18N.t('tpl.vf_align_left')}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="19" y1="18" x2="3" y2="18"/></svg>
    </button>
    <button class="rtb" onclick="verifExecR('${targetId}','justifyCenter')" title="${I18N.t('tpl.vf_align_center')}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="12" x2="6" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
    </button>
    <button class="rtb" onclick="verifExecR('${targetId}','justifyRight')" title="${I18N.t('tpl.vf_align_right')}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
    </button>
    <div class="rtb-sep"></div>
    <button class="rtb" onclick="verifOpenLinkModal('${targetId}')" title="${I18N.t('tpl.vf_lien_fichier')}"><svg class="hs-ico" aria-hidden="true"><use href="#ico-content-link"></use></svg> ${I18N.t('tpl.vf_lien_fichier')}</button>
    <button class="rtb" onclick="verifToggleTable('${targetId}')" title="${I18N.t('tpl.vf_tableau')}">&#x229E; ${I18N.t('tpl.vf_tableau')}</button>
    <div class="rtb-sep"></div>
    <label class="rtb" title="${I18N.t('tpl.vf_image')}"><svg class="hs-ico" aria-hidden="true"><use href="#ico-tool-insert-image"></use></svg> Image
      <input type="file" id="${imgId}" accept="image/*" style="display:none" onchange="verifHandleImage(this,'${targetId}')">
    </label>
    <button class="rtb" onclick="verifInsertVideo('${targetId}')"><svg class="hs-ico" aria-hidden="true"><use href="#ico-file-video"></use></svg> Vidéo</button>
    <label class="rtb" title="${I18N.t('tpl.vf_audio')}"><svg class="hs-ico" aria-hidden="true"><use href="#ico-tool-insert-audio"></use></svg> Audio<input type="file" id="vf-audio-${uid}" accept="audio/*" style="display:none" onchange="verifHandleAudio(this,'${targetId}')"></label>
    <div class="rtb-sep"></div>
    <button class="rtb" onclick="verifOpenLatexModal('${targetId}')" style="background:#4338ca;color:#fff;border-color:#4338ca;">&#x2211; LaTeX</button>
    <button class="rtb" onclick="verifExecR('${targetId}','removeFormat')" style="margin-left:auto;" title="${I18N.t('rtb.clear_format')}"><svg class="hs-ico" aria-hidden="true"><use href="#ico-content-clean"></use></svg></button>
  </div>`;
}

function verifHideStackTags(text){
  if(!text)return '';
  return text.replace(/\[\[(input|validation|feedback):([^\]]+)\]\]/g,(match,type)=>{
    const label=type==='input'?I18N.t('tpl.vf_stack_input'):(type==='validation'?I18N.t('tpl.vf_stack_valid'):I18N.t('tpl.vf_stack_fb'));
    return `&nbsp;<span class="vf-stack-ph" data-original="${match}" contenteditable="false">${label}</span>&nbsp;`;
  });
}

function getVerifTypeLabel(type) {
  if (!type) return '';
  const t = type.toLowerCase();
  const keyMap = {
    'checkbox':    'tpl.vf_type_checkbox',
    'radio':       'tpl.vf_type_radio',
    'dropdown':    'tpl.vf_type_dropdown',
    'algebraic':   'tpl.vf_type_algebraic',
    'numerical':   'tpl.vf_type_numerical',
    'units':       'tpl.vf_type_units',
    'string':      'tpl.vf_type_string',
    'match':       'tpl.vf_type_match',
    'crossword':   'tpl.vf_type_crossword',
    'composition': 'tpl.vf_type_composition',
    'doi':            'tpl.vf_type_doi',
    'chem':           'tpl.vf_type_chem',
    'chem-topo':      'tpl.vf_type_chem_topo',
    'chemical':       'tpl.vf_type_chem',
    'chemical_topo':  'tpl.vf_type_chem_topo',
    'nuclear':        'tpl.vf_type_nuclear',
    'jxgdrop':        'type.jxgdrop',
    'vf':             'type.vf',
    'ord':            'type.ord',
    'imgclick':       'type.imgclick',
    'rvbcmj':         'type.rvbcmj'
  };
  const key = keyMap[t];
  return key ? I18N.t(key) : type;
}

function verifParseMaximaList(qVars, listName){
  const esc = listName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const regex = new RegExp(esc+'\\s*[:=]\\s*(\\[)','i');
  const startM = qVars.match(regex);
  if (!startM) return []; 
  const fromIdx = qVars.indexOf(startM[0]) + startM[0].length - 1;
  let depth = 0, i = fromIdx, content = '';
  for (; i < qVars.length; i++) {
    const c = qVars[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { i++; break; } }
    content += c;
  }
  const inner = content.slice(1);
  const subLists = [];
  let si = 0;
  while (si < inner.length) {
    while (si < inner.length && inner[si] !== '[') si++;
    if (si >= inner.length) break;
    let d = 0, start = si, sub = '';
    for (; si < inner.length; si++) {
      const c = inner[si];
      if (c === '[') d++;
      else if (c === ']') { d--; if (d === 0) { sub = inner.slice(start + 1, si); si++; break; } }
    }
    if (!sub && sub !== '0') continue;
    const elems = [];
    let cur = '', inQ = false, qCh = '';
    for (let k = 0; k < sub.length; k++) {
      const c = sub[k];
      if (inQ) { if (c === qCh && sub[k - 1] !== '\\') inQ = false; cur += c; }
      else if (c === '"' || c === "'") { inQ = true; qCh = c; cur += c; }
      else if (c === ',') { elems.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    if (cur.trim()) elems.push(cur.trim());
    subLists.push(elems);
  }
  return subLists;
}

function verifRestoreContent(id){
  const el = document.getElementById(id);
  if(!el) return '';
  let html = el.innerHTML;
  html = html.replace(/<span[^>]*class="vf-stack-ph"[^>]*data-original="([^"]*)"[^>]*>.*?<\/span>/g, '$1');
  html = html.replace(/<vf-match-preview[^>]*data-original="([^"]*)"[^>]*>[\s\S]*?<\/vf-match-preview>/gi, '$1');
  return html;
}

function openVerifModal(built){                            
  const xmlStr=built?built.xml:_lastXML;
  if(!xmlStr){toast(I18N.t('msg.aucune_donnee_a_previsualiser'));return;}
  const xmlDoc=new DOMParser().parseFromString(xmlStr,'text/xml');
  const tags=built?built.tags.map(t=>t.clean):getTagList().map(t=>t.clean);
  const qName=built?built.qName:(_lastQName||'');
  const qData=built?built.questionsData:questions;
  const previewText=built?built.allTextsPreview:null;
  verifBuildInterface(xmlDoc,tags,qName,qData,previewText);
  const verifModal = document.getElementById('verifModal');
  verifModal.style.display='flex';
  FocusTrap.trap(verifModal, closeVerifModal);
}

function closeVerifModal(){
  document.getElementById('verifModal').style.display='none';
  FocusTrap.release();
  window._doiInteractiveBlock = null;
  window._nucInteractiveBlock = null;
  window._chemInteractiveBlock = null;
  window._topoInteractiveBlock = null;
}

function doDownload(){
  if(!_verifXmlDoc){toast(I18N.t('msg.aucune_donnee_a_exporter'));return;}
  const xmlDoc=_verifXmlDoc;

  const nameEl=xmlDoc.querySelector('question > name > text');
  if(nameEl) nameEl.textContent=document.getElementById('vf-edit-name')?.innerText||'';
  
  function restoreContent(fieldId) {
      const el = document.getElementById(fieldId);
      if(!el) return "";
      let html = el.innerHTML;
      if (window._verifOriginalJsxTag) {
          const markerRegex = /<!-- VF-START-PLACEHOLDER -->[\s\S]*?<!-- VF-END-PLACEHOLDER -->/gi;
          html = html.replace(markerRegex, window._verifOriginalJsxTag);
      }
      return html.replace(/<span[^>]*class="vf-stack-ph"[^>]*data-original="([^"]*)"[^>]*>.*?<\/span>/g,'$1');
  }

  const qtEl=xmlDoc.querySelector('questiontext text');
  if(qtEl){
    const qd = window._verifQData || [];
    const specialTypes = ['nuclear','chemical','chemical_topo','doi'];
    const hasMultiSpecial = qd.filter(q => specialTypes.includes(q.type)).length > 0;
    const doiQ2 = qd.find(q => q.type === 'doi');

    let fullContent = '';

    if (doiQ2) {
      // DOI : cas unique, reconstruction simple
      let restored = restoreContent('vf-edit-q');
      if (window._doiInteractiveBlock) {
        restored = '<!-- ENONCE-START -->' + restored + '<!-- ENONCE-END -->' + window._doiInteractiveBlock;
      }
      fullContent = restored;

    } else if (hasMultiSpecial) {
      const ES = '<!-- ENONCE-START -->';
      const EE = '<!-- ENONCE-END -->';
      qd.forEach((q, idx) => {
        const tf = q.textFrag || '';
        if (tf.includes(ES)) {
          const si = tf.indexOf(ES);
          const ei = tf.indexOf(EE);
          const before = si > 0 ? tf.substring(0, si) : '';
          const after  = ei >= 0 ? tf.substring(ei + EE.length) : '';
          const editId = idx === 0 ? 'vf-edit-q' : `vf-edit-q-${q.id}`;
          const edited = restoreContent(editId);
          fullContent += before + ES + edited + EE + after;
        } else {
          fullContent += tf;
        }
      });

    } else {
      // Cas standard : reconstruire depuis textFrag + énoncé édité
      const qd2 = window._verifQData || [];
      const ES = '<!-- ENONCE-START -->';
      const EE = '<!-- ENONCE-END -->';
      if (qd2.length > 0) {
        qd2.forEach((q, idx) => {
          const tf = q.textFrag || '';
          if (tf.includes(ES)) {
            const si = tf.indexOf(ES);
            const ei = tf.indexOf(EE);
            const before = tf.substring(0, si);
            const after  = ei >= 0 ? tf.substring(ei + EE.length) : '';
            const editId = idx === 0 ? 'vf-edit-q' : `vf-edit-q-${q.id}`;
            const edited = restoreContent(editId);
            fullContent += before + ES + edited + EE + after;
          } else {
            fullContent += tf;
          }
        });
      } else {
        fullContent = restoreContent('vf-edit-q');
      }
      if (window._verifOriginalJsxTag) {
        const markerRegex = /<!-- VF-START-PLACEHOLDER -->[\s\S]*?<!-- VF-END-PLACEHOLDER -->/gi;
        fullContent = fullContent.replace(markerRegex, window._verifOriginalJsxTag);
      }
    }

    qtEl.innerHTML='';
    qtEl.appendChild(xmlDoc.createCDATASection(fullContent));
  }
  
  const gfEl=xmlDoc.querySelector('generalfeedback text');
  if(gfEl){
    const dGEl = document.getElementById('vf-edit-g');
    if (!dGEl || dGEl.contentEditable !== 'false') {
      const restored = verifRestoreContent('vf-edit-g');
      gfEl.textContent = restored;
    }
  }

  const tagsContainer=xmlDoc.querySelector('tags');
  if(tagsContainer) tagsContainer.innerHTML=_verifTags.map(t=>`<tag><text>${t}</text></tag>`).join('');

  const inputs=Array.from(xmlDoc.querySelectorAll('question > input'));
  let vars=xmlDoc.querySelector('questionvariables text')?.textContent||'';
  inputs.forEach(input=>{
    const inputType=input.querySelector('type')?.textContent.trim();
    if(!['checkbox','radio','dropdown'].includes(inputType))return;
    const tansName=input.querySelector('tans')?.textContent.trim()||'ans1';
    const fbIdx=tansName.replace(/\D/g,''); 
    const fbName='fb'+fbIdx;
    let taParts=[],fbParts=[];
    const poolContainer = document.getElementById(`vf-pool-${fbIdx}`);
    if (poolContainer) {
        poolContainer.querySelectorAll('.vf-qcm-item').forEach(item=>{
          const id=item.getAttribute('data-id');
          const isTrue=item.getAttribute('data-istrue');
          const prop=item.querySelector('.prop-cell')?.innerText.replace(/"/g,'\\"')||'';
          const fb=item.querySelector('.fb-cell')?.innerText.replace(/"/g,'\\"')||'';
          taParts.push(`["${id}",${isTrue},"${prop}"]`);
          fbParts.push(`["${id}","${fb}"]`);
        });
    }
    if(taParts.length){
      vars=vars.replace(new RegExp(tansName+'_all\\s*[:=]\\s*\\[[\\s\\S]*?\\]\\s*;','i'),`${tansName}_all:[${taParts.join(',')}];`);
      vars=vars.replace(new RegExp(fbName+'\\s*[:=]\\s*\\[[\\s\\S]*?\\]\\s*;','i'),`${fbName}:[${fbParts.join(',')}];`);
    }
  });
  const qvEl=xmlDoc.querySelector('questionvariables text');
  if(qvEl) qvEl.textContent=vars;

  _verifPrtStorage.forEach(s=>{
    if(!s.isPool){
      if(s.tNode) s.tNode.textContent=verifRestoreContent(s.tId);
      if(s.fNode) s.fNode.textContent=verifRestoreContent(s.fId);
    }
  });

  const qName=document.getElementById('vf-edit-name')?.innerText||_lastQName||'question';
  let serialized=new XMLSerializer().serializeToString(xmlDoc);
  serialized=serialized.replace(/^<\?xml[^?]*\?>\s*/i,'');
  // Corriger les balises auto-fermantes produites par XMLSerializer
  const selfClosingTags = ['syntaxhint','forbidwords','allowwords','options','testoptions',
    'truepenalty','falsepenalty','truefeedback','falsefeedback','description','variantsselectionseed'];
  selfClosingTags.forEach(tag => {
    serialized = serialized.replace(new RegExp(`<${tag}\\s*/>`, 'g'), `<${tag}></${tag}>`);
  });
  // Décoder &gt;/&lt; UNIQUEMENT dans questionvariables et feedbackvariables
  // (contenu Maxima — ne pas toucher aux autres blocs text)
  const fixMaximaBlock = (xml, tag) => xml.replace(
    new RegExp(`(<${tag}[^>]*>\\s*<text[^>]*>)([\\s\\S]*?)(</text>\\s*</${tag}>)`, 'g'),
    (match, open, content, close) => {
      const decoded = content.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
      if (decoded === content) return match;
      const inner = decoded.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
      return open + '<![CDATA[' + inner + ']]>' + close;
    }
  );
  serialized = fixMaximaBlock(serialized, 'questionvariables');
  serialized = fixMaximaBlock(serialized, 'feedbackvariables');
  let finalXml='<?xml version="1.0" encoding="UTF-8"?>\n'+serialized;
  
  // Correction input-ref pour composition uniquement (pas match)
  const isComposition = window._verifQData && window._verifQData.some(q => q.type === 'composition');
  if (isComposition) {
    finalXml = finalXml.replace(/input-ref-ans(\d+)="refAns1"/g, 'input-ref-ans$1_html="refAns1"');
  }

  if (window._verifOriginalJsxTag) {
      finalXml = finalXml.replace(/<!-- VF-START-PLACEHOLDER -->[\s\S]*?<!-- VF-END-PLACEHOLDER -->/gi, window._verifOriginalJsxTag);
  }

  const blob=new Blob([finalXml],{type:'text/xml'});
  Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:qName.replace(/\s+/g,'_')+'.xml'}).click();
  toast(I18N.t('msg.xml_exporte', {name: qName}));
  
  window._verifOriginalJsxTag = null;
}

function openCopyModal(){const m=document.getElementById('copyModal');m.style.display='flex';FocusTrap.trap(m,function(){document.getElementById('copyModal').style.display='none';FocusTrap.release();});}
function closeCopyModal(e){if(e.target===e.currentTarget||e.currentTarget===e.target){document.getElementById('copyModal').style.display='none';FocusTrap.release();}}
function openContactModal(){const m=document.getElementById('contactModal');m.style.display='flex';FocusTrap.trap(m,function(){document.getElementById('contactModal').style.display='none';FocusTrap.release();});}
function closeContactModal(e){if(e.target===e.currentTarget){document.getElementById('contactModal').style.display='none';FocusTrap.release();}}                        

/**
 * Crée un wrapper avec un titre cliquable (+/-) pour afficher/masquer du contenu.
 */
function createCollapsibleWrapper(title, contentNode, isOpen = true) {
    const wrapper = document.createElement('div');
    wrapper.className = `vf-collapsible-wrapper ${isOpen ? '' : 'vf-collapsed'}`;
    const header = document.createElement('div');
    header.className = 'vf-collapsible-header';
    header.innerHTML = `<span>${title}</span><span class="vf-toggle-btn">${isOpen ? '-' : '+'}</span>`;
    const body = document.createElement('div');
    body.className = 'vf-collapsible-body';
    body.appendChild(contentNode);
    header.onclick = function() {
        const isClosed = wrapper.classList.contains('vf-collapsed');
        if (isClosed) {
            body.style.display = 'block';
            wrapper.classList.remove('vf-collapsed');
            header.querySelector('.vf-toggle-btn').textContent = '-';
        } else {
            body.style.display = 'none';
            wrapper.classList.add('vf-collapsed');
            header.querySelector('.vf-toggle-btn').textContent = '+';
        }
    };
    wrapper.appendChild(header);
    wrapper.appendChild(body);
    return wrapper;
}

// LOGIQUE UI POUR LA MODALE PROMPT MATCH
function initMatchPromptUI() {
    const matterContainer = document.getElementById('match-pb-matter-buttons');
    const levelContainer = document.getElementById('match-pb-level-buttons');
    if(!matterContainer || !levelContainer) return;
    matterContainer.innerHTML = '';
    const matters = Object.keys(tagsArbre || {});
    matters.forEach(mat => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn'; 
        btn.textContent = mat;
        btn.onclick = () => selectMatchMatter(mat, btn);
        matterContainer.appendChild(btn);
    });
    updateMatchLevelButtons('Physique');
    updateMatchSousButtons();
}

function selectMatchMatter(matterName, btnElement) {
    const input = document.getElementById('match-pb-matter');
    if(input) input.value = matterName;
    const buttons = document.getElementById('match-pb-matter-buttons').querySelectorAll('button');
    buttons.forEach(b => {
        if(b === btnElement) b.classList.add('active');
        else b.classList.remove('active');
    });
    updateMatchLevelButtons(matterName);
    const levelContainer = document.getElementById('match-pb-level-buttons');
    const firstLevelBtn = levelContainer.querySelector('button');
    if(firstLevelBtn) {
        firstLevelBtn.click(); 
    } else {
        const lvlInput = document.getElementById('match-pb-level');
        if(lvlInput) lvlInput.value = "";
    }
    updateMatchPrompt();
}

function updateMatchLevelButtons(matterName) {
    const container = document.getElementById('match-pb-level-buttons');
    if(!container) return;
    container.innerHTML='';
    let levels = [];
    if(tagsArbre && tagsArbre[matterName]) {
        levels = Object.keys(tagsArbre[matterName]);
    } else {
        levels = ["2nde", "1ere", "Term", "1STL", "1STMG", "TSTL", "TSTMG"];
    }
    levels.forEach(lvl => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn';
        btn.textContent = lvl === '1ere' ? I18N.t('tpl.vf_bloom_1ere') : lvl;
        btn.onclick = () => selectMatchLevel(lvl, btn);
        container.appendChild(btn);
    });
}

function selectMatchLevel(levelName, btnElement) {
    const input = document.getElementById('match-pb-level');
    if(input) input.value = levelName;
    const buttons = document.getElementById('match-pb-level-buttons').querySelectorAll('button');
    buttons.forEach(b => {
        if(b === btnElement) b.classList.add('active');
        else b.classList.remove('active');
    });
    // Réinitialiser sous-matière + chapitre puis régénérer les boutons sous-matière
    { const e = document.getElementById('match-pb-sous'); if(e) e.value = ''; }
    { const e = document.getElementById('match-pb-chap'); if(e) e.value = ''; }
    { const e = document.getElementById('match-pb-chap-buttons'); if(e) e.innerHTML = ''; }
    updateMatchSousButtons();
    updateMatchPrompt();
}

// Boutons SOUS-MATIÈRE selon la matière + le niveau courants
function updateMatchSousButtons() {
    const cont = document.getElementById('match-pb-sous-buttons');
    if(!cont) return;
    cont.innerHTML = '';
    const mat = (document.getElementById('match-pb-matter') || {}).value || '';
    const niv = (document.getElementById('match-pb-level') || {}).value || '';
    const sousObj = (((tagsArbre || {})[mat]) || {})[niv] || {};
    Object.keys(sousObj).forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn';
        btn.textContent = s.replace(/_/g, ' ');
        btn.onclick = () => selectMatchSous(s, btn);
        cont.appendChild(btn);
    });
}
function selectMatchSous(sousKey, btnElement) {
    const input = document.getElementById('match-pb-sous');
    if(input) input.value = sousKey.replace(/_/g, ' ');
    document.getElementById('match-pb-sous-buttons').querySelectorAll('button')
        .forEach(b => b.classList.toggle('active', b === btnElement));
    updateMatchChapButtons(sousKey);
    updateMatchPrompt();
}
function updateMatchChapButtons(sousKey) {
    const cont = document.getElementById('match-pb-chap-buttons');
    if(!cont) return;
    cont.innerHTML = '';
    const mat = (document.getElementById('match-pb-matter') || {}).value || '';
    const niv = (document.getElementById('match-pb-level') || {}).value || '';
    const chaps = ((((tagsArbre || {})[mat]) || {})[niv] || {})[sousKey] || [];
    chaps.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'pb-cascade-btn';
        btn.textContent = c;
        btn.onclick = () => selectMatchChap(c, btn);
        cont.appendChild(btn);
    });
}
function selectMatchChap(chap, btnElement) {
    const input = document.getElementById('match-pb-chap');
    if(input) input.value = chap;
    document.getElementById('match-pb-chap-buttons').querySelectorAll('button')
        .forEach(b => b.classList.toggle('active', b === btnElement));
    updateMatchPrompt();
}

function handleMatchLangChange() {
    const select = document.getElementById('match-pb-lang-select');
    const customInput = document.getElementById('match-pb-lang-custom');
    if(select.value === 'Autre') {
        customInput.style.display = 'block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
    }
    updateMatchPrompt();
}

// ════════════════════════════════════════════════════════════════
//  CONSTRUCTION DE L'INTERFACE (Fonction principale)
// ══════════════════════════════════════════════════════════════════
function verifBuildInterface(xmlDoc, tags, qName, qData, previewText) {
  const container = document.getElementById('verif-container');
  if (!container) return; 
   container.innerHTML = ''; 
  try {
    _verifXmlDoc = xmlDoc;
    _verifTags = tags.slice();
    _verifPrtStorage = [];
    window._verifQData = qData;

    const _allVarsFromXml = xmlDoc.querySelector('questionvariables text')?.textContent || '';
    const inputByAnsNum = {}; 
    
    // --- MAPPING INPUTS ---
    Array.from(xmlDoc.querySelectorAll('question > input')).forEach(inp => {
        const nm = (inp.querySelector('name') || inp.querySelector('n'))?.textContent || '';
        
        // --- FILTRAGE CRITIQUE ---
        if (nm.endsWith('_flag') || nm.endsWith('_r') || nm.endsWith('_p')) return;
        // -------------------------

        const num = nm.replace(/\D/g, '') || '?';
        const type = (inp.querySelector('type'))?.textContent.trim() || '';
        if (nm.endsWith('_html')) {
            inputByAnsNum[num] = { name: nm, type: 'composition', tans: 'composition' };
        } else {
            inputByAnsNum[num] = { name: nm, type, tans: (inp.querySelector('tans'))?.textContent.trim() || ('ta' + num) };
        }
    });
    
    // --- 1. Nom de la question ---
    const nameEl = document.createElement('span');
    nameEl.className = 'vf-label'; nameEl.textContent = I18N.t('tpl.vf_nom_question');
    const nameZone = document.createElement('div'); nameZone.id = 'vf-edit-name'; nameZone.className = 'vf-zone-nom'; nameZone.contentEditable = 'true';
    const nameNode = xmlDoc.querySelector('question > name > text') || xmlDoc.querySelector('question > name > n');
    nameZone.innerText = nameNode ? nameNode.textContent : (qName || '');
    const nameGroup = document.createElement('div');
    nameGroup.append(nameEl, nameZone);
    container.appendChild(createCollapsibleWrapper(I18N.t('tpl.vf_section_nom'), nameGroup, true));

    // --- 2. Énoncé ---
    const grade = xmlDoc.querySelector('defaultgrade')?.textContent || ''; 
    const rawQtextXml = xmlDoc.querySelector('questiontext text')?.textContent || '';
    let rawQtext = previewText || rawQtextXml; 
    
    // GESTION COMPOSITION
    const isCompositionQ = Object.values(inputByAnsNum).some(info => info.type === 'composition');
    if (isCompositionQ) {
        const jsxTagRegex = /\[\[jsxgraph\b[^\]]*\]\]([\s\S]*?)\[\[\/jsxgraph\s*\]\]/gi;
        const inputRegex = /<div[^>]*style="[^"]*display\s*:\s*none[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
        const jsxMatch = rawQtextXml.match(jsxTagRegex);
        const inputMatch = rawQtextXml.match(inputRegex);
        if (jsxMatch && jsxMatch[0]) window._verifOriginalJsxTag = jsxMatch[0];
        const inputsHtml = inputMatch ? inputMatch.join('') : '';
        if (inputsHtml && !rawQtext.includes(inputsHtml)) rawQtext += '\n' + inputsHtml;
        const bannerHtml = `<div style="padding:10px 14px;background:#f5f3ff;border:1.5px dashed #a78bfa;border-radius:8px;font-size:.82rem;color:#5b21b6;text-align:center;">📝 Éditeur de réponse élève (visible dans Moodle uniquement)</div>`;
        const markerStart = '<!-- VF-START-PLACEHOLDER -->';
        const markerEnd = '<!-- VF-END-PLACEHOLDER -->';
        const staticHTML = markerStart + bannerHtml + markerEnd;
        if (jsxTagRegex.test(rawQtext)) {
            rawQtext = rawQtext.replace(jsxTagRegex, staticHTML);
        } else if (/style="[^"]*background:#f5f3ff[^"]*"/.test(rawQtext)) {
            const bannerRegex = /(<div[^>]*style="[^"]*background:#f5f3ff[^"]*"[^>]*>[\s\S]*?Éditeur de réponse élève[\s\S]*?<\/div>)/i;
            if (!rawQtext.includes('VF-START-PLACEHOLDER')) {
                 rawQtext = rawQtext.replace(bannerRegex, (match) => {
                    return markerStart + match + markerEnd;
                });
            }
        }
    }
    
    // Toolbar unique en haut de wQ
    const wQ = document.createElement('div');
    const dQ = document.createElement('div');
    dQ.id = 'vf-edit-q';
    dQ.className = 'vf-zone';
    dQ.contentEditable = 'true';

    const cwQ = qData.find(q => q.type === 'crossword');
    const doiQ = qData.find(q => q.type === 'doi');
    const specialTypes = ['doi','nuclear','chemical','chemical_topo'];
    const hasSpecial = qData.some(q => specialTypes.includes(q.type));

    if (doiQ) {
        // DOI : stocker le bloc interactif pour doDownload
        const interactiveMatch = rawQtextXml.match(/<!-- ENONCE-END -->([\s\S]*)/);
        window._doiInteractiveBlock = interactiveMatch ? interactiveMatch[1] : '';
        if (doiQ.rawConfig && doiQ.rawConfig.objects) {
            doiQ._previewAfter = `<div contenteditable="false" style="margin-top:10px;">` +
                `<div style="margin-bottom:8px;text-align:center;padding:8px;background:#f8fafc;border:2px dashed #cbd5e1;border-radius:8px;"><div style="color:#64748b;font-weight:bold;margin-bottom:6px;">${I18N.t('doi.etiquettes_lbl')}</div><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">` +
                (doiQ.rawConfig.mainObj ? `<div style="background:#EC4899;color:white;padding:6px 12px;border-radius:4px;font-weight:bold;">${doiQ.rawConfig.mainObj}</div>` : '') +
                doiQ.rawConfig.objects.map(o=>`<div style="background:${o.type==='intrus'?'#94a3b8':'#3B82F6'};color:white;padding:6px 12px;border-radius:4px;font-weight:bold;">${o.name}</div>`).join('') +
                `</div></div>` +
                `<div style="text-align:center;padding:10px;background:#f0f9ff;border:1px dashed #bae6fd;border-radius:8px;"><div style="font-size:.75rem;font-weight:700;color:#475569;margin-bottom:8px;">🕸️ ${I18N.t('doi.apercu_enonce_titre')}</div>${window.genDOIEmptyPreviewImage?window.genDOIEmptyPreviewImage(doiQ.rawConfig):'<div style="color:#94a3b8;font-style:italic;">' + I18N.t('doi.apercu_non_disponible') + '</div>'}</div>` +
                `</div>`;
        }
    }
    // V4 — aperçu complet de l'énoncé (texte + blocs entre les questions)
    if (previewText) {
        const fpDiv = document.createElement('div');
        fpDiv.className = 'vf-full-statement';
        const fpLabel = document.createElement('div');
        fpLabel.className = 'vf-full-statement-label';
        fpLabel.textContent = I18N.t('tpl.vf_enonce_complet') || 'Aperçu complet de l\'énoncé';
        fpDiv.appendChild(fpLabel);
        const fpContent = document.createElement('div');
        fpContent.className = 'vf-full-statement-body';
        // Dans l'aperçu global, remplacer les zones éditables par un placeholder
        // pour éviter d'afficher l'intitulé en double (il est déjà visible ci-dessous)
        const rawQtextForPreview = rawQtext.replace(
            /<!-- ENONCE-START -->[\s\S]*?<!-- ENONCE-END -->/g,
            '<div style="background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:6px;padding:7px 12px;color:#64748b;font-size:.82rem;font-style:italic;">✏️ Intitulé de la question (éditable ci-dessous)</div>'
        );
        fpContent.innerHTML = verifHideStackTags(rawQtextForPreview);
        fpDiv.appendChild(fpContent);
        wQ.appendChild(fpDiv);
        const sepFull = document.createElement('hr');
        sepFull.style.cssText = 'margin:12px 0;border:none;border-top:2px solid #e2e8f0;';
        wQ.appendChild(sepFull);
    }

    // --- CAS UNIVERSEL : boucle sur qData ---
    {
        const ES = '<!-- ENONCE-START -->';
        const EE = '<!-- ENONCE-END -->';
        let toolbarAdded = false;

        qData.forEach((q, idx) => {
            const tf = q.textFrag || '';
            const hasMarkers = tf.includes(ES) && tf.includes(EE);

            // --- Badge ---
            let badgeHtml = '';
            if (hasMarkers) {
                badgeHtml = tf.substring(0, tf.indexOf(ES)).trim();
            }
            if (badgeHtml) {
                const bd = document.createElement('div');
                bd.innerHTML = badgeHtml;
                bd.contentEditable = 'false';
                bd.style.marginBottom = '0';
                wQ.appendChild(bd);
            }

            // --- Toolbar (une seule fois, avant le premier éditeur) ---
            if (!toolbarAdded) {
                const tb = document.createElement('div');
                tb.innerHTML = verifCreateToolbar('vf-edit-q');
                wQ.appendChild(tb);
                toolbarAdded = true;
            }

            // --- Zone éditable ---
            const editDiv = idx === 0 ? dQ : document.createElement('div');
            if (idx !== 0) {
                editDiv.id = `vf-edit-q-${q.id}`;
                editDiv.className = 'vf-zone';
                editDiv.contentEditable = 'true';
            }

            if (hasMarkers) {
                const si = tf.indexOf(ES) + ES.length;
                const ei = tf.indexOf(EE);
                editDiv.innerHTML = verifHideStackTags(tf.substring(si, ei));
            } else {
                editDiv.innerHTML = verifHideStackTags(q.previewFrag || tf);
            }
            wQ.appendChild(editDiv);

            // --- Aperçu statique (types interactifs) ---
            if (['chemical_topo','chemical','nuclear'].includes(q.type)) {
                const staticLabels = {
                    'chemical_topo': ['ÉQUATION (SMILES)',['+','→','⇌','✏️ JSME']],
                    'chemical':      [I18N.t('tpl.vf_static_equation'),['x₂ Indice','xⁿ Expo','→','⇌','↔']],
                    'nuclear':       [I18N.t('tpl.vf_static_nucleaire'),['ᴬ/ᴢX','+','→','α','γ','β⁻','β⁺','e⁺','e⁻','n','p','*','ν']]
                };
                const [label, btns] = staticLabels[q.type];
                const sz = document.createElement('div');
                sz.contentEditable = 'false';
                sz.innerHTML = `<div style="margin-top:8px;background:#f9f9f9;border:1px solid #e2e8f0;border-radius:8px;padding:10px;"><div style="font-size:.72rem;font-weight:700;color:#64748b;margin-bottom:6px;">${label}</div><div style="display:flex;gap:4px;flex-wrap:wrap;background:#ecf0f1;padding:5px;border-radius:5px;margin-bottom:6px;">${btns.map(b=>`<button disabled style="padding:3px 8px;background:#fff;border:1px solid #bdc3c7;border-radius:4px;font-size:.78rem;color:#94a3b8;cursor:default;">${b}</button>`).join('')}</div><div style="min-height:44px;background:#fff;border:1px solid #ccc;border-radius:4px;padding:8px;font-size:.82rem;color:#94a3b8;font-style:italic;">(Zone de saisie élève — interactive dans Moodle)</div></div>`;
                wQ.appendChild(sz);
            } else if (q.type === 'doi' && q._previewAfter) {
                const pd = document.createElement('div');
                pd.innerHTML = q._previewAfter;
                wQ.appendChild(pd);
            } else if (q.type === 'crossword' && q.cwEmptyGrid) {
                const cwd = document.createElement('div');
                cwd.contentEditable = 'false';
                cwd.innerHTML = `<div style="text-align:center;margin-top:10px;padding:10px;background:#f0f9ff;border:1px dashed #bae6fd;border-radius:8px;"><div style="font-size:.75rem;font-weight:700;color:#475569;margin-bottom:8px;">🧩 Grille à compléter</div>${q.cwEmptyGrid}</div><div style="margin-top:8px;">${verifHideStackTags(q.cwDefinitionsOnly||'')}</div>`;
                wQ.appendChild(cwd);
            }

            // Séparateur entre questions
            if (idx < qData.length - 1) {
                const sep = document.createElement('hr');
                sep.style.cssText = 'margin:12px 0;border:none;border-top:2px dashed #e2e8f0;';
                wQ.appendChild(sep);
            }
        });
    }


    container.appendChild(createCollapsibleWrapper(I18N.t('tpl.vf_section_enonce'), wQ, true));

    // --- 3. Traitement des PRTs ---
    const prtContainer = document.createElement('div'); prtContainer.id = 'vf-prt-container';
    const doiWrappers = {}; 
    const matchProcessed = {}; 

    Array.from(xmlDoc.getElementsByTagName('prt')).forEach((prt) => {
      const prtName = (prt.querySelector('name')?.textContent || '').trim(); 
      const nameIdMatch = prtName.match(/(\d+)/); 
      let qNum;
      if (nameIdMatch) { qNum = nameIdMatch[1]; } else {
        const sansEl = prt.querySelector('sans');
        const sansText = (sansEl?.textContent || 'ans1').trim();
        qNum = sansText.replace(/\D/g, '') || '1';
      }

      const inputInfo = inputByAnsNum[qNum] || { type: '', tans: 'ta' + qNum };
      const currentQData = qData.find(q => q.id == qNum);
      
      const isMatch = currentQData && currentQData.type === 'match';
      const isComposition = inputInfo.type === 'composition';
      const isCrossword = currentQData && currentQData.type === 'crossword';
      const isPoolMode = ['checkbox','radio','dropdown'].includes(inputInfo.type);
      const isUnits = inputInfo.type === 'units';
      const isString = inputInfo.type === 'string';
      const isAlgebraic = inputInfo.type === 'algebraic';
      const isNumerical = inputInfo.type === 'numerical';
      const isDoi = (currentQData && currentQData.type === 'doi');
      const isChemTopo = (currentQData && currentQData.type === 'chem-topo');
      const isNuclear = (currentQData && currentQData.type === 'nuclear');
      const isSpecialType = ['chem', 'chem-topo', 'nuclear'].includes(inputInfo.type);
      const isComplexe = currentQData && currentQData.type === 'complexe';

      if (isMatch) {
        if (!matchProcessed[qNum]) {
          let previewCols = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin: 15px 0;">';
          previewCols += `<div style="background:#fff; padding:10px; border:1px solid #e2e8f0; border-radius:6px;"><strong style="color:var(--match); display:block; margin-bottom:8px; border-bottom:2px solid var(--match); padding-bottom:4px;">${I18N.t('tpl.vf_match_col_a')}</strong><ul style="margin:0; padding-left:20px; list-style-type:square;">`;
          if (currentQData && currentQData.state && currentQData.state.left) {
              currentQData.state.left.forEach(item => previewCols += `<li style="margin-bottom:5px; color:var(--navy2);">${item.html.replace(/<[^>]+>/g, '')}</li>`);
          } else { previewCols += `<li style="color:#94a3b8;">${I18N.t('tpl.vf_match_no_data')}</li>`; }
          previewCols += '</ul></div>';

          previewCols += `<div style="background:#fff; padding:10px; border:1px solid #e2e8f0; border-radius:6px;"><strong style="color:var(--match); display:block; margin-bottom:8px; border-bottom:2px solid var(--match); padding-bottom:4px;">${I18N.t('tpl.vf_match_col_b')}</strong><ul style="margin:0; padding-left:20px; list-style-type:square;">`;
          if (currentQData && currentQData.state && currentQData.state.right) {
              currentQData.state.right.forEach(item => previewCols += `<li style="margin-bottom:5px; color:var(--navy2);">${item.html.replace(/<[^>]+>/g, '')}</li>`);
          } else { previewCols += `<li style="color:#94a3b8;">${I18N.t('tpl.vf_match_no_data')}</li>`; }
          previewCols += '</ul></div></div>';

          const markerStart = '<!-- VF-START-PLACEHOLDER -->';
          const markerEnd = '<!-- VF-END-PLACEHOLDER -->';
          
          const staticHTML = `${markerStart}<div class="vf-jsx-fake-preview" contenteditable="false" style="padding:15px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; margin:10px 0;"><div style="color:#15803d; font-weight:bold; margin-bottom:10px;">🔗 Zone de réponse interactive (Relier)</div>${previewCols}<div style="font-size:0.8rem; color:#475569; margin-top:15px; padding-top:10px; border-top:1px solid #bbf7d0; font-style:italic;">⚠️ Note : La visualisation dynamique (JSXGraph) avec les lignes à relier ne s'affichera que dans Moodle lors de la tentative de réponse.</div></div>${markerEnd}`;

          const jsxTagRegex = /\[\[jsxgraph\b[^\]]*\]\]([\s\S]*?)\[\[\/jsxgraph\s*\]\]/gi;
          const match = rawQtext.match(jsxTagRegex);
          if (match && match[0]) { window._verifOriginalJsxTag = match[0]; } else { window._verifOriginalJsxTag = null; }
          let processedQtext = rawQtext.replace(jsxTagRegex, staticHTML);
          processedQtext = processedQtext.replace(/\[\[jsxgraph[\s\S]*?\[\[\/jsxgraph\]\]/gi, '');

          // Ne pas écraser dQ — la boucle universelle l'a déjà rempli correctement

          let tableHtml = `<div class="vf-node-box" style="background:#fff; border:1px solid #e2e8f0; padding-bottom:10px; margin-top:20px;"><div class="vf-section-title" style="margin-bottom:15px; color:var(--match);">${I18N.t('tpl.vf_match_correction')}</div>`;

          if (currentQData && currentQData.state) {
              const leftItems = currentQData.state.left || [];
              const rightItems = currentQData.state.right || [];
              const connections = currentQData.state.connections || [];
              tableHtml += `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:10px;"><div style="font-weight:bold; color:var(--navy3); padding:8px; background:#f1f5f9; border-radius:6px; text-align:center;">${I18N.t('tpl.vf_match_prop_a')}</div><div><div style="font-weight:bold; color:var(--navy3); padding:8px; background:#f1f5f9; border-radius:6px; text-align:center;">${I18N.t('tpl.vf_match_prop_b')}</div></div></div>`;
              leftItems.forEach((itemA, idxA) => {
                  const textA = itemA.html; 
                  const relatedB = connections.filter(c => c.l === idxA);
                  tableHtml += `<div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; border-top:1px solid #e2e8f0;"><div style="padding:12px; font-weight:600; color:var(--navy); display:flex; align-items:center;">${textA}</div><div style="padding:12px; display:flex; flex-direction:column; gap:8px; justify-content:center;">`;
                  if (relatedB.length === 0) { tableHtml += `<span style="color:#94a3b8; font-style:italic; font-size:0.9rem;">${I18N.t('tpl.vf_match_no_link')}</span>`; } else {
                      relatedB.forEach(conn => {
                          const itemB = rightItems[conn.r];
                          if(itemB) tableHtml += `<div style="background:#f8fafc; padding:6px 10px; border-radius:4px; border-left:3px solid var(--match); font-size:0.9rem; color:var(--navy2);">${itemB.html}</div>`;
                      });
                  }
                  tableHtml += `</div></div>`; 
              });
          } else { tableHtml += `<div style="color:#dc2626; padding:10px;">${I18N.t('tpl.vf_match_no_data_txt')}</div>`; }
          tableHtml += `</div>`; 

          const matchGroup = document.createElement('div');
          matchGroup.className = 'vf-prt-group'; 
          matchGroup.innerHTML = `<div class="vf-section-title">${I18N.t('tpl.vf_match_fb_titre', {n: qNum})}</div>` + tableHtml;
          prtContainer.appendChild(matchGroup);
          matchProcessed[qNum] = true;
        }
      } else if(isPoolMode){
        const listName=inputInfo.tans+'_all';
        const perQVars = (currentQData && currentQData.vars) ? currentQData.vars : _allVarsFromXml;
        let dataAll=verifParseMaximaList(perQVars,listName);
        if(!dataAll.length) dataAll=verifParseMaximaList(perQVars,'ta'+qNum+'_all');
        let dataFb=verifParseMaximaList(perQVars,'fb'+qNum);
        let poolVraiHtml='', poolFauxHtml='';
        dataAll.forEach(sub=>{
          if(!sub||sub.length<3) return;
          const id   = sub[0].trim().replace(/^["']|["']$/g,'');
          const bool = sub[1].trim().toLowerCase();
          const isV  = bool==='true';
          const prop = sub[2].replace(/^["']|["']$/g,'').trim();
          const fbEntry=dataFb.find(f=>f&&f[0]&&f[0].replace(/^["']|["']$/g,'').trim()===id);
          const fb = fbEntry&&fbEntry[1] ? fbEntry[1].replace(/^["']|["']$/g,'').trim() : '';
          const row=`<div class="vf-qcm-item" data-id="${id}" data-istrue="${isV}"><div class="vf-editable-cell prop-cell" contenteditable="true">${prop}</div><div class="vf-editable-cell fb-cell" contenteditable="true">${fb}</div></div>`;
          if(isV) poolVraiHtml+=row; else poolFauxHtml+=row;
        });
        const poolDiv=document.createElement('div'); poolDiv.className='vf-node-box';poolDiv.id = `vf-pool-${qNum}`;
        const emptyV=`<i style="color:#94a3b8;font-size:.8rem;">${I18N.t('tpl.vf_aucune_prop_vraie')}</i>`;
        const emptyF=`<i style="color:#94a3b8;font-size:.8rem;">${I18N.t('tpl.vf_aucune_prop_fausse')}</i>`;
        poolDiv.innerHTML=`<div class="vf-pool-stack"><div class="vf-pool vf-pool-vrai"><div style="font-size:.72rem;font-weight:700;color:#10b981;margin-bottom:6px;">${I18N.t('tpl.vf_pool_vraies')}</div><div class="vf-header-row"><div>${I18N.t('tpl.vf_pool_intitule')}</div><div>${I18N.t('tpl.vf_pool_feedback')}</div></div>${poolVraiHtml||emptyV}</div><div class="vf-pool vf-pool-faux"><div style="font-size:.72rem;font-weight:700;color:#ef4444;margin-bottom:6px;">${I18N.t('tpl.vf_pool_fausses')}</div><div class="vf-header-row"><div>${I18N.t('tpl.vf_pool_intitule')}</div><div>${I18N.t('tpl.vf_pool_feedback')}</div></div>${poolFauxHtml||emptyF}</div></div></div>`;
        const wrapper = document.createElement('div');
        wrapper.className = 'vf-prt-group';
        wrapper.innerHTML = `<div class="vf-section-title">${I18N.t('tpl.vf_fb_spec_q', {n: qNum, type: getVerifTypeLabel(inputInfo.type)})}</div>`;
        wrapper.appendChild(poolDiv);
        prtContainer.appendChild(wrapper);
        Array.from(prt.getElementsByTagName('node')).forEach(node=>{
          _verifPrtStorage.push({tNode:node.querySelector('truefeedback text'),fNode:node.querySelector('falsefeedback text'),tId:null, fId:null, isPool:true});
        });
      } else if (isComposition) {
        const compWrapper = document.createElement('div');
        compWrapper.className = 'vf-prt-group';
        compWrapper.innerHTML = `<div class="vf-section-title" style="color:#6d28d9;">${I18N.t('tpl.vf_comp_titre', {n: qNum})}</div><div class="vf-node-box" style="background:#f5f3ff;border-left:4px solid #6d28d9;"><div style="padding:12px;font-size:.88rem;color:#4c1d95;display:flex;align-items:center;gap:10px;"><span style="font-size:1.4rem;">👨‍🏫</span><div><strong>${I18N.t('tpl.vf_comp_manuelle')}</strong><br><span style="color:#6d28d9;font-size:.8rem;">${I18N.t('tpl.vf_comp_auto_note')}</span></div></div></div>`;
        prtContainer.appendChild(compWrapper);
      } else if (isDoi) {
        let doiWrapper = doiWrappers[qNum];
        if (!doiWrapper) {
          doiWrapper = document.createElement('div');
          doiWrapper.className = 'vf-prt-group';
          doiWrapper.style.borderLeft = '4px solid #3B82F6';
          doiWrapper.innerHTML = `<div class="vf-section-title" style="color:#3B82F6;">${I18N.t("tpl.vf_fb_spec_q", {n: qNum, type: getVerifTypeLabel("doi")})}</div>`;
          doiWrappers[qNum] = doiWrapper;
          prtContainer.appendChild(doiWrapper);
        }
        const prtNameLoop = (prt.querySelector('name')?.textContent || '').trim();
        const isPrtIntrus = prtNameLoop.includes('_2');
        const nodes = Array.from(prt.querySelectorAll('node'));
        if (nodes.length === 0) {
            const debugDiv = document.createElement('div');
            debugDiv.style.padding = "8px";
            debugDiv.style.fontSize = "0.8rem";
            debugDiv.style.color = "#94a3b8";
            debugDiv.style.fontStyle = "italic";
            debugDiv.textContent = `(Info: Aucun nœud détecté dans le PRT "${prtNameLoop}" pour la question ${qNum})`;
            doiWrapper.appendChild(debugDiv);
        }
        nodes.forEach((node, nIdx) => {
          const tId = `vf-p${qNum}n${prtNameLoop}t`;
          const fId = `vf-p${qNum}n${prtNameLoop}f`;
          let specificTitle = "";
          if (isPrtIntrus) { specificTitle = I18N.t("tpl.vf_doi_node_intrus"); } else {
              if (nIdx === 0) specificTitle = I18N.t("tpl.vf_doi_node_1");
              else if (nIdx === 1) specificTitle = I18N.t("tpl.vf_doi_node_2");
              else specificTitle = "Nœud " + (nIdx + 1);
          }
          const nodeDiv = document.createElement('div'); 
          nodeDiv.className = 'vf-node-box';
          nodeDiv.style.borderTop = '1px solid #e2e8f0';
          nodeDiv.style.marginTop = '10px';
          nodeDiv.style.paddingTop = '10px';
          nodeDiv.innerHTML = `<div style="font-size:.78rem;font-weight:700;color:#3B82F6;margin-bottom:8px;">${specificTitle}</div><span class="vf-label">${I18N.t('tpl.vf_si_vrai')}</span>${verifCreateToolbar(tId)}<div id="${tId}" class="vf-zone vf-vrai" contenteditable="true">${verifHideStackTags(node.querySelector('truefeedback text')?.textContent||'')}</div><span class="vf-label" style="margin-top:10px;">${I18N.t('tpl.vf_si_faux')}</span>${verifCreateToolbar(fId)}<div id="${fId}" class="vf-zone vf-faux" contenteditable="true">${verifHideStackTags(node.querySelector('falsefeedback text')?.textContent||'')}</div>`;
          doiWrapper.appendChild(nodeDiv);
          _verifPrtStorage.push({tNode:node.querySelector('truefeedback text'),fNode:node.querySelector('falsefeedback text'),tId,fId,isPool:false});
        });
      } else if (isChemTopo) {
        const chemTopoLabels = [I18N.t("tpl.vf_chemtopo_node_1"),I18N.t("tpl.vf_chemtopo_node_2"),I18N.t("tpl.vf_chemtopo_node_3"),I18N.t("tpl.vf_chemtopo_node_4"),I18N.t("tpl.vf_chemtopo_node_5"),I18N.t("tpl.vf_chemtopo_node_6"),I18N.t("tpl.vf_chemtopo_node_7")];
        const wrapper = document.createElement('div');
        wrapper.className = 'vf-prt-group';
        wrapper.innerHTML = `<div class="vf-section-title" style="color:#d97706;">${I18N.t("tpl.vf_fb_spec_q", {n: qNum, type: getVerifTypeLabel("chem-topo")})}</div>`;
        Array.from(prt.getElementsByTagName('node')).forEach((node, nIdx) => {
            const tId = `vf-p${qNum}n${nIdx}t`;
            const fId = `vf-p${qNum}n${nIdx}f`;
            const specificTitle = chemTopoLabels[nIdx] || `Nœud ${nIdx + 1}`;
            const nodeDiv = document.createElement('div'); 
            nodeDiv.className = 'vf-node-box';
            nodeDiv.style.borderTop = '1px solid #e2e8f0';
            nodeDiv.style.marginTop = '10px';
            nodeDiv.style.paddingTop = '10px';
            nodeDiv.innerHTML = `<div style="font-size:.78rem;font-weight:700;color:#d97706;margin-bottom:8px;">${specificTitle}</div><span class="vf-label">${I18N.t('tpl.vf_si_vrai')}</span>${verifCreateToolbar(tId)}<div id="${tId}" class="vf-zone vf-vrai" contenteditable="true">${verifHideStackTags(node.querySelector('truefeedback text')?.textContent||'')}</div><span class="vf-label" style="margin-top:10px;">${I18N.t('tpl.vf_si_faux')}</span>${verifCreateToolbar(fId)}<div id="${fId}" class="vf-zone vf-faux" contenteditable="true">${verifHideStackTags(node.querySelector('falsefeedback text')?.textContent||'')}</div>`;
            wrapper.appendChild(nodeDiv);
            _verifPrtStorage.push({tNode:node.querySelector('truefeedback text'),fNode:node.querySelector('falsefeedback text'),tId,fId,isPool:false});
        });
        prtContainer.appendChild(wrapper);
      } else if (isNuclear) {
        const nuclearLabels = [I18N.t("tpl.vf_nuclear_node_1"),I18N.t("tpl.vf_nuclear_node_2"),I18N.t("tpl.vf_nuclear_node_3"),I18N.t("tpl.vf_nuclear_node_4")];
        const wrapper = document.createElement('div');
        wrapper.className = 'vf-prt-group';
        wrapper.innerHTML = `<div class="vf-section-title" style="color:#8b5cf6;">${I18N.t("tpl.vf_fb_spec_q", {n: qNum, type: getVerifTypeLabel("nuclear")})}</div>`;
        Array.from(prt.getElementsByTagName('node')).forEach((node, nIdx) => {
            const tId = `vf-p${qNum}n${nIdx}t`;
            const fId = `vf-p${qNum}n${nIdx}f`;
            const specificTitle = nuclearLabels[nIdx] || `Nœud ${nIdx + 1}`;
            const nodeDiv = document.createElement('div'); 
            nodeDiv.className = 'vf-node-box';
            nodeDiv.style.borderTop = '1px solid #e2e8f0';
            nodeDiv.style.marginTop = '10px';
            nodeDiv.style.paddingTop = '10px';
            nodeDiv.innerHTML = `<div style="font-size:.78rem;font-weight:700;color:#8b5cf6;margin-bottom:8px;">${specificTitle}</div><span class="vf-label">${I18N.t('tpl.vf_si_vrai')}</span>${verifCreateToolbar(tId)}<div id="${tId}" class="vf-zone vf-vrai" contenteditable="true">${verifHideStackTags(node.querySelector('truefeedback text')?.textContent||'')}</div><span class="vf-label" style="margin-top:10px;">${I18N.t('tpl.vf_si_faux')}</span>${verifCreateToolbar(fId)}<div id="${fId}" class="vf-faux" contenteditable="true">${verifHideStackTags(node.querySelector('falsefeedback text')?.textContent||'')}</div>`;
            wrapper.appendChild(nodeDiv);
            _verifPrtStorage.push({tNode:node.querySelector('truefeedback text'),fNode:node.querySelector('falsefeedback text'),tId,fId,isPool:false});
        });
        prtContainer.appendChild(wrapper);
      } else if(isUnits){
        Array.from(prt.getElementsByTagName('node')).forEach((node,nIdx)=>{
          const tId=`vf-p${qNum}n${nIdx}t`, fId=`vf-p${qNum}n${nIdx}f`;
          const nodeLabel=nIdx===0?I18N.t("tpl.vf_units_node_1"):I18N.t("tpl.vf_units_node_2");
          const nodeDiv=document.createElement('div'); nodeDiv.className='vf-node-box';
          nodeDiv.innerHTML=`<div style="font-size:.78rem;font-weight:700;color:#d97706;margin-bottom:8px;">📐 ${nodeLabel}</div><span class="vf-label">${I18N.t('tpl.vf_si_vrai')}</span>${verifCreateToolbar(tId)}<div id="${tId}" class="vf-zone vf-vrai" contenteditable="true">${verifHideStackTags(node.querySelector('truefeedback text')?.textContent||'')}</div><span class="vf-label" style="margin-top:10px;">${I18N.t('tpl.vf_si_faux')}</span>${verifCreateToolbar(fId)}<div id="${fId}" class="vf-zone vf-faux" contenteditable="true">${verifHideStackTags(node.querySelector('falsefeedback text')?.textContent||'')}</div>`;
          const wrapper = document.createElement('div');
          wrapper.className = 'vf-prt-group';
          wrapper.innerHTML = `<div class="vf-section-title">${I18N.t("tpl.vf_fb_spec_q", {n: qNum, type: getVerifTypeLabel("units")})}</div>`;
          wrapper.appendChild(nodeDiv);
          prtContainer.appendChild(wrapper);
          _verifPrtStorage.push({tNode:node.querySelector('truefeedback text'),fNode:node.querySelector('falsefeedback text'),tId,fId,isPool:false});
        });
      } else if (isComplexe) {
        const wrapper = document.createElement('div');
        wrapper.className = 'vf-prt-group';
        wrapper.innerHTML = `<div class="vf-section-title">${I18N.t("tpl.vf_fb_spec_q", {n: qNum, type: "Nombres complexes"})}</div>`;
        Array.from(prt.getElementsByTagName('node')).forEach((node, nIdx) => {
            const tId = `vf-p${qNum}n${nIdx}t`;
            const fId = `vf-p${qNum}n${nIdx}f`;
            const nodeLabel = node.querySelector('description')?.textContent || ('Nœud ' + (nIdx + 1));
            const nodeDiv = document.createElement('div');
            nodeDiv.className = 'vf-node-box';
            nodeDiv.style.borderTop = '1px solid #e2e8f0';
            nodeDiv.style.marginTop = '10px';
            nodeDiv.style.paddingTop = '10px';
            nodeDiv.innerHTML = `<div style="font-size:.78rem;font-weight:700;color:#0e7490;margin-bottom:8px;">${nodeLabel}</div><span class="vf-label">${I18N.t('tpl.vf_si_vrai')}</span>${verifCreateToolbar(tId)}<div id="${tId}" class="vf-zone vf-vrai" contenteditable="true">${verifHideStackTags(node.querySelector('truefeedback text')?.textContent||'')}</div><span class="vf-label" style="margin-top:10px;">${I18N.t('tpl.vf_si_faux')}</span>${verifCreateToolbar(fId)}<div id="${fId}" class="vf-zone vf-faux" contenteditable="true">${verifHideStackTags(node.querySelector('falsefeedback text')?.textContent||'')}</div>`;
            wrapper.appendChild(nodeDiv);
            _verifPrtStorage.push({tNode: node.querySelector('truefeedback text'), fNode: node.querySelector('falsefeedback text'), tId, fId, isPool: false});
        });
        prtContainer.appendChild(wrapper);
      } else if (isCrossword) {
          Array.from(prt.getElementsByTagName('node')).forEach((node,nIdx)=>{
            const tId=`vf-p${qNum}n${nIdx}t`, fId=`vf-p${qNum}n${nIdx}f`;
            const nodeDiv=document.createElement('div'); nodeDiv.className='vf-node-box';
            nodeDiv.innerHTML=`<span class="vf-label">${I18N.t('tpl.vf_si_vrai')}</span>${verifCreateToolbar(tId)}<div id="${tId}" class="vf-zone vf-vrai" contenteditable="true">${verifHideStackTags(node.querySelector('truefeedback text')?.textContent||'')}</div><span class="vf-label" style="margin-top:10px;">${I18N.t('tpl.vf_si_faux')}</span>${verifCreateToolbar(fId)}<div id="${fId}" class="vf-zone vf-faux" contenteditable="true">${verifHideStackTags(node.querySelector('falsefeedback text')?.textContent||'')}</div>`;
            const wrapper = document.createElement('div');
            wrapper.className = 'vf-prt-group';
            wrapper.innerHTML = `<div class="vf-section-title">${I18N.t("tpl.vf_fb_spec_q", {n: qNum, type: getVerifTypeLabel("crossword")})}</div>`;
            wrapper.appendChild(nodeDiv);
            prtContainer.appendChild(wrapper);
            _verifPrtStorage.push({tNode:node.querySelector('truefeedback text'),fNode:node.querySelector('falsefeedback text'),tId,fId,isPool:false});
          });
      } else {
          Array.from(prt.getElementsByTagName('node')).forEach((node,nIdx)=>{
            const tId=`vf-p${qNum}n${nIdx}t`, fId=`vf-p${qNum}n${nIdx}f`;
            const nodeDiv=document.createElement('div'); nodeDiv.className='vf-node-box';
            let extraHtml='';
            if(isString){
              const _sVars = (currentQData) ? currentQData.vars : _allVarsFromXml;
              const taMatch=_sVars.match(new RegExp('ta'+qNum+'\\s*:\\s*"([^"]*)"'));
              if(taMatch) extraHtml=`<div style="margin-bottom:10px;padding:8px 12px;background:#fafafa;border:1px solid #e2e8f0;border-radius:6px;font-size:.85rem;"><span class="vf-label" style="margin-top:0;">${I18N.t("tpl.vf_reponse_attendue")}</span><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;">${taMatch[1]}</code></div>`;
            }
            if(isSpecialType){
               extraHtml=`<div style="margin-bottom:10px;padding:8px 12px;background:#fff7ed;border:1px solid #fdba74;border-radius:6px;font-size:.85rem;"><span style="font-weight:bold;color:#9a3412;">⚠️ Type Spécial (${inputInfo.type})</span><br><span style="color:#c2410c;">La solution complexe est gérée via la variable Maxima.</span></div>`;
            }
            nodeDiv.innerHTML=`${extraHtml}<span class="vf-label">${I18N.t('tpl.vf_si_vrai')}</span>${verifCreateToolbar(tId)}<div id="${tId}" class="vf-zone vf-vrai" contenteditable="true">${verifHideStackTags(node.querySelector('truefeedback text')?.textContent||'')}</div><span class="vf-label" style="margin-top:10px;">${I18N.t('tpl.vf_si_faux')}</span>${verifCreateToolbar(fId)}<div id="${fId}" class="vf-zone vf-faux" contenteditable="true">${verifHideStackTags(node.querySelector('falsefeedback text')?.textContent||'')}</div>`;
            const wrapper = document.createElement('div');
            wrapper.className = 'vf-prt-group';
            const typeToDisplay = (currentQData && currentQData.type) ? currentQData.type : inputInfo.type;
            wrapper.innerHTML = `<div class="vf-section-title">${I18N.t("tpl.vf_fb_spec_q", {n: qNum, type: getVerifTypeLabel(typeToDisplay)})}</div>`;
            wrapper.appendChild(nodeDiv);
            prtContainer.appendChild(wrapper);
            _verifPrtStorage.push({tNode:node.querySelector('truefeedback text'),fNode:node.querySelector('falsefeedback text'),tId,fId,isPool:false});
          });
      }
    });
    
    container.appendChild(createCollapsibleWrapper(I18N.t("tpl.vf_section_fb_spec"), prtContainer, true));

    // --- 4. Feedback général ---
    const lbG = document.createElement('span'); lbG.className = 'vf-label'; lbG.textContent = I18N.t('tpl.feedback_general');
    const wG = document.createElement('div'); wG.innerHTML = verifCreateToolbar('vf-edit-g');
    const rawGF = xmlDoc.querySelector('generalfeedback text')?.textContent || '';
    const hasMCQonly = qData.every(q => ['checkbox','radio','dropdown'].includes(q.type));
    const hasMCQ = qData.some(q => ['checkbox','radio','dropdown'].includes(q.type));
    // Si le seul contenu du generalfeedback vient des MCQ ({@textes_vrais@} checkbox ou {@texte_vrai@} radio/dropdown)
    const isMCQGeneralFeedback = rawGF.trim().includes('textes_vrais') || rawGF.trim().includes('texte_vrai');
    const isMatchOnlyGF = rawGF.trim().includes('appariements') || rawGF.trim().includes('correction des appariements');
    // Si le generalfeedback ne vient que des solutions de questions classiques (algébrique…), ne pas l'afficher dans la zone éditable — il est montré dans section 3 "Réponse attendue" du nœud PRT
    const hasSolutionOnly = qData.some(q => q.solution || q.generalFeedback);
    const autoGF = (hasMCQonly || isMCQGeneralFeedback || isMatchOnlyGF || hasSolutionOnly) ? '' : rawGF;
    let cleanRawGF = autoGF;
    const dG = document.createElement('div');
    dG.id = 'vf-edit-g';
    dG.className = 'vf-zone vf-general';
    const hasMatch = qData.some(q => q.type === 'match');
    let solutionsHtml = '';

    // Boucle dans l'ordre des questions pour préserver l'ordre d'affichage
    qData.forEach(q => {
        const num = q.id;
        const realType = q.type;

        if (realType === 'checkbox' || realType === 'radio' || realType === 'dropdown') {
            const typeLabel = getVerifTypeLabel(realType);
            const gf = q.generalFeedback || '';
            solutionsHtml += `<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed #e2e8f0;">
                <span style="font-weight:bold;color:var(--navy2);">Q${num} ${typeLabel}</span>
                <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${gf || I18N.t("tpl.vf_sol_mcq_note")}</span>
            </div>`;
            return;
        }

        if (realType === 'doi') {
            if (q.correctionImg) {
                solutionsHtml += `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                    <span style="font-weight:bold;color:var(--navy2);">Q${num} ${getVerifTypeLabel("doi")}</span>
                    <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${I18N.t("tpl.vf_sol_doi_schema")}</span>
                    <div style="margin-top:8px;">${q.correctionImg}</div>
                </div>`;
            }
            return;
        }

        if (realType === 'crossword') {
            if (q.cwFilledGrid) {
                solutionsHtml += `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                    <span style="font-weight:bold;color:var(--navy2);">Q${num} ${getVerifTypeLabel("crossword")}</span>
                    <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${I18N.t("tpl.vf_sol_grid_filled")}</span>
                    <div style="margin-top:8px;overflow-x:auto;">${q.cwFilledGrid}</div>
                </div>`;
            }
            return;
        }

        if (realType === 'match') {
            solutionsHtml += `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                <span style="font-weight:bold;color:var(--navy2);">Q${num} ${getVerifTypeLabel("match")}</span>
                <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${I18N.t("tpl.vf_sol_match_note")}</span>
            </div>`;
            return;
        }

        if (realType === 'nuclear') {
            solutionsHtml += `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                <span style="font-weight:bold;color:var(--navy2);">Q${num} ${getVerifTypeLabel("nuclear")}</span>
                <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${I18N.t("tpl.vf_sol_reaction_expected")}</span>
                ${q.nucKatexFrag ? `<div style="margin-top:8px;">${q.nucKatexFrag}</div>` : ""}
            </div>`;
            return;
        }

        if (realType === 'chemical') {
            const pf = q.previewFrag || '';
            const katexMatch = pf.match(/(<div[^>]*background:#f0fdf4[^>]*>[\s\S]*?<\/div>)/i);
            solutionsHtml += `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                <span style="font-weight:bold;color:var(--navy2);">Q${num} ${getVerifTypeLabel("chem")}</span>
                <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${I18N.t("tpl.vf_sol_answer_was")}</span>
                ${katexMatch ? `<div style="margin-top:8px;">${katexMatch[1]}</div>` : ""}
            </div>`;
            return;
        }

        if (realType === 'chemical_topo') {
            const ph = q.topoPreviewHtml || '';
            solutionsHtml += `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                <span style="font-weight:bold;color:var(--navy2);">Q${num} ${getVerifTypeLabel("chem-topo")}</span>
                <span style="color:#64748b;font-size:.85rem;margin-left:6px;">${I18N.t("tpl.vf_sol_reaction_was")}</span>
                ${ph ? `<div style="margin-top:10px;padding:10px;background:#f8f8f8;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">${ph}</div>` : ""}
            </div>`;
            return;
        }

        // Chips nombres complexes : feedback STACK auto-généré, on le signale dans la section Solutions
        if (realType === 'complexe') {
            solutionsHtml += `<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">
                <span style="font-weight:bold;color:var(--navy2);">Q${num} Nombres complexes</span>
                <span style="color:#0e7490;font-size:.82rem;margin-left:6px;">✓ Correction auto-générée — visible dans la zone ci-dessus</span>
            </div>`;
            return;
        }

        // Types classiques : chercher l'info dans inputByAnsNum
        const info = Object.values(inputByAnsNum).find(i => i.name && (i.name === `ans${num}` || i.name === `ans${num}s` === false && i.name === `ans${num}`));
        const infoFallback = inputByAnsNum[num];
        const infoUsed = info || infoFallback;
        if (!infoUsed) return;

        const isDedicatedUI = ['checkbox','radio','dropdown','match','composition'].includes(infoUsed.type);
        if (isDedicatedUI) return;

        const varName = infoUsed.tans;
        const matchVars = _allVarsFromXml.match(new RegExp(varName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\s*[:=]\\s*([^;]+);'));
        const extTypeMap = { 'float': 'tpl.vf_type_float', 'numeric': 'tpl.vf_type_numeric', 'textarea': 'tpl.vf_type_textarea', 'matrix': 'tpl.vf_type_matrix' };
        let answerDisplay = matchVars ? matchVars[1].trim().replace(/^"|"$/g,'') : I18N.t('tpl.vf_variable_non_definie');
        const extKey = extTypeMap[infoUsed.type];
        const typeDisplay = extKey ? I18N.t(extKey) : (getVerifTypeLabel(infoUsed.type) || infoUsed.type);
        const solHtml = (q.solution || q.generalFeedback)
            ? `<div style="margin-top:6px;padding:8px 10px;background:#f0f4f8;border-left:3px solid #94a3b8;border-radius:4px;font-size:.85rem;">${q.solution || q.generalFeedback}</div>`
            : '';
        solutionsHtml += `<div style="margin-bottom:8px;font-size:.9rem;border-bottom:1px dashed #e2e8f0;padding-bottom:6px;">
            <span style="font-weight:bold;color:var(--navy2);">Q${num} ${typeDisplay} :</span>
            <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#d946ef;">${answerDisplay}</code>
            ${solHtml}
        </div>`;
    });

    /* === CODE CONSERVÉ POUR RÉFÉRENCE — ANCIENNE LOGIQUE inputByAnsNum ===
    // Détection nucléaire via tans contenant '_latex' (KaTeX rendu)
    // if (info.tans && info.tans.includes('_latex')) {
    //     const latexVarName = info.tans;
    //     const matchLatex = _allVarsFromXml.match(new RegExp(latexVarName + '\\s*[:=]\\s*"([^"]*)"'));
    //     let latexStr = matchLatex ? matchLatex[1] : '';
    //     let renderedEquation = '<div style="color:#94a3b8;">Équation non trouvée ('+latexVarName+')</div>';
    //     if (latexStr) { try { renderedEquation = katex.renderToString(latexStr, { throwOnError:false, displayMode:true }); } catch(e) { renderedEquation = `<code style="color:red;">Erreur LaTeX</code>`; } }
    //     if (renderedEquation) solutionsHtml += `<div style="text-align:center;font-size:1.4em;margin-bottom:20px;">${renderedEquation}</div>`;
    //     return;
    // }
    // Exclure nuclear/chemical/chemical_topo du dump générique
    // if (realType === 'nuclear' || realType === 'chemical' || realType === 'chemical_topo') return;
    // isDedicatedUI = ['checkbox','radio','dropdown','match','composition'].includes(info.type) || ['match'].includes(realType);
    // Types classiques : algebraic, numeric, string, units, float, textarea, matrix, numerical → dump variable
    // if (isClassic) { solutionsHtml += `Q${num} (${info.type}) : ${answerDisplay}`; }
    // isSpecial : chem, chem-topo → affichage spécial avec fond orange
    // Filtrage inputs crossword par regex : if (info.name && /^cw\d+_/.test(info.name)) return;
    === FIN CODE RÉFÉRENCE === */
    dG.contentEditable = 'true';
    let finalHtml = verifHideStackTags(cleanRawGF);
    if (solutionsHtml) { finalHtml += `<div style="margin-top:20px; padding:15px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.05);"><div style="font-weight:bold; color:var(--navy2); margin-bottom:10px; display:flex; align-items:center; gap:8px;"><span style="font-size:1.2rem;">🔑</span> ${I18N.t("tpl.vf_reponses_attendues")}</div>${solutionsHtml}</div>`; }
    dG.innerHTML = finalHtml;
    wG.appendChild(dG);
    const generalGroup = document.createElement('div');
    generalGroup.append(lbG, wG);
    container.appendChild(createCollapsibleWrapper(I18N.t("tpl.vf_section_fb_gen"), generalGroup, true));

    // --- 5. Tags ---
    const tagSection = document.createElement('div');
    tagSection.style.cssText = 'margin-top:20px;padding:15px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;';
    tagSection.innerHTML = `<span class="vf-label">${I18N.t("tpl.vf_tags_moodle")}</span><div id="vf-tags-list" style="margin-bottom:8px;"></div><div style="display:flex;gap:6px;"><input type="text" id="vf-new-tag" style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:.85rem;" placeholder="${I18N.t("tpl.vf_nouveau_tag")}"><button onclick="verifAddTag()" style="padding:7px 12px;background:var(--navy2);color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:.82rem;">${I18N.t("tpl.vf_ajouter")}</button></div>`;
    container.appendChild(tagSection);
    verifRenderTags();

  } catch (error) {
    console.error("Erreur dans verifBuildInterface:", error);
    container.innerHTML = `<div style="padding:20px;background:#fee2e2;color:#b91c1c;border-radius:8px;"><h3 style="margin-top:0;">${I18N.t("msg.vf_erreur_preview")}</h3><code style="display:block;background:#fff;padding:10px;border-radius:4px;margin-top:10px;white-space:pre-wrap;">${error.message}</code></div>`;
  }
}