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

// ── RICH EDITOR + LINK MODAL + LATEX MODAL ─────────────────────

// ══════════════════════════════════════════════════════
//  RICH FIELD
// ══════════════════════════════════════════════════════
function richVal(id){const el=document.getElementById(id);return el?(el.value||''):'';}
function setRichVal(id,html){const ta=document.getElementById(id);if(ta)ta.value=html;const prev=document.getElementById('prev-'+id);if(prev)prev.innerHTML=html||'';}

let currentRichField=null,currentImg=null;
const richEditor=()=>document.getElementById('rich-editor');

function openRich(fieldId){
  currentRichField=fieldId;
  richEditor().innerHTML=parseLatexToSpans(richVal(fieldId));
  const _rt=document.getElementById('rich-title');const _sp=_rt.querySelector('span[data-i18n]');if(_sp)_sp.textContent=I18N.t('tpl.editeur')+fieldId.replace(/-/g,' ');else _rt.textContent=I18N.t('tpl.editeur')+fieldId.replace(/-/g,' ');
  document.getElementById('table-dialog').style.display='none';
  document.getElementById('img-props').style.display='none';
  currentImg=null;
  const modal = document.getElementById('richModal');
  modal.style.display='flex';
  FocusTrap.trap(modal, closeRich);
}
function closeRich(){document.getElementById('richModal').style.display='none';FocusTrap.release();}
// Zones .rich-preview cliquables : les rendre activables au clavier (Entrée/Espace) via délégation,
// pour remplacer les boutons "Éditeur" redondants supprimés du HTML.
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('rich-preview')){
    e.preventDefault();
    e.target.click();
  }
});
function confirmRich(){setRichVal(currentRichField,spansToLatex(richEditor()));
  // Lien bidirectionnel énoncé ↔ générateur de prompt IA (js/prompt.js) : si le champ
  // édité correspond à l'énoncé du type de prompt en cours, on répercute vers pb-question.
  if(typeof _pbTextIdForType==='function' && currentRichField===_pbTextIdForType(_pbType)){
    const pbq=document.getElementById('pb-question');
    if(pbq){ pbq.value=_pbHtmlToText(richVal(currentRichField)); if(typeof pbBuild==='function') pbBuild(); }
  }
  if(currentRichField==='chem-text' && typeof chemUpdateLock==='function') chemUpdateLock();
  if(currentRichField==='nuc-text' && typeof nucUpdateLock==='function') nucUpdateLock();
  if(currentRichField && currentRichField.indexOf('calc-')===0) {
    if(typeof calcUpdatePreview==='function') calcUpdatePreview();
    if(typeof calcRefreshPreview==='function') calcRefreshPreview();
  }
  if(currentRichField && currentRichField.indexOf('cw-def-')===0) {
    if(typeof cwRefreshPreview==='function') cwRefreshPreview();
  }
  // Gestion de la sauvegarde pour les items MATCH
  if(currentRichField && currentRichField.startsWith('match-edit-')) {
    const parts = currentRichField.split('-');
    const side = parts[2]; // left ou right
    const index = parseInt(parts[3]);
    const items = side === 'left' ? matchState.left : matchState.right;
    if(items[index]) {
      items[index].html = richEditor().innerHTML;
      // Mettre à jour le texte pour l'affichage liste
      const tmp = document.createElement('div'); tmp.innerHTML = items[index].html;
      items[index].text = tmp.textContent || tmp.innerText || "Item";
      renderMatchLists();
    }
  }
    // ══════════════════════════════════════════════════
  //  PATCH POUR MATCH : Sauvegarde intelligente
  // ══════════════════════════════════════════════════
  if(matchEditContext) {
    const ctx = matchEditContext;
    const htmlContent = richEditor().innerHTML;
    
    // Extraction du texte pour l'affichage dans la liste
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlContent;
    const textContent = tmp.textContent || tmp.innerText || "Élément";

    if(ctx.isNew) {
      // CAS 1 : C'était un nouvel item (bouton Ajouter)
      const targetList = ctx.side === 'left' ? matchState.left : matchState.right;
      targetList.push({
        id: Date.now(),
        html: htmlContent,
        text: textContent
      });
    } else {
      // CAS 2 : C'était une édition (bouton crayon)
      const targetList = ctx.side === 'left' ? matchState.left : matchState.right;
      if(targetList[ctx.index]) {
        targetList[ctx.index].html = htmlContent;
        targetList[ctx.index].text = textContent;
      }
    }

    // On nettoie la textarea temporaire et le contexte
    const tempTa = document.getElementById(ctx.tempId);
    if(tempTa) tempTa.remove();
    
    renderMatchLists(); // On rafraîchit l'affichage de la liste
    matchEditContext = null; // On réinitialise le contexte
  }
  // ══════════════════════════════════════════════════
  closeRich();}
function execR(cmd,val){richEditor().focus();document.execCommand(cmd,false,val||null);}

// LaTeX spans — stockage interne en format Moodle \(...\) / \[...\]
function parseLatexToSpans(html){
  // Accepte les deux formats : Moodle \(...\)/\[...\] ET ancien $...$/$...$
  // Note: utiliser .+? avec flag s pour que les formules contenant ) et ] soient bien capturées
  return html
    .replace(/\\\[(.+?)\\\]/gs,  (_,f)=>mkLxSpan(f,'block'))    // \[...\] → block
    .replace(/\\\((.+?)\\\)/gs,  (_,f)=>mkLxSpan(f,'inline'))   // \(...\) → inline
    .replace(/\$\$([^$]+?)\$\$/g,(_,f)=>mkLxSpan(f,'block'))    // $$...$$ legacy
    .replace(/\$([^$\n]+?)\$/g,  (_,f)=>mkLxSpan(f,'inline'));  // $...$ legacy
}
function mkLxSpan(formula,mode){try{const r=katex.renderToString(formula,{throwOnError:false,displayMode:mode==='block'});return`<span class="lx-span" data-f="${attrEsc(formula)}" data-m="${mode}" contenteditable="false">${r}&nbsp;</span>`;}catch(e){return(mode==='block'?'\\[':'\\(')+formula+(mode==='block'?'\\]':'\\)');}}

function spansToLatex(el){
  const c=el.cloneNode(true);
  c.querySelectorAll('.lx-span').forEach(s=>{const f=s.dataset.f,m=s.dataset.m;s.replaceWith(document.createTextNode(m==='block'?`\\[${f}\\]`:`\\(${f}\\)`));});
  c.querySelectorAll('.math-inline').forEach(s=>{const f=s.getAttribute('data-math');if(f)s.replaceWith(document.createTextNode(`\\(${f}\\)`));});
  c.querySelectorAll('.math-block').forEach(s=>{const f=s.getAttribute('data-math');if(f)s.replaceWith(document.createTextNode(`\\[${f}\\]`));});
  return _jxgUnwrapBlocks(c.innerHTML);
}

// Table
function toggleTableDialog(){const d=document.getElementById('table-dialog');d.style.display=d.style.display==='flex'?'none':'flex';}
function insertTable(){const rows=parseInt(v('tbl-rows'))||3,cols=parseInt(v('tbl-cols'))||3,hdr=document.getElementById('tbl-header').checked;let h='<table style="border-collapse:collapse;width:100%;margin:10px 0;">';if(hdr){h+='<tr>';for(let c=0;c<cols;c++)h+=`<th style="border:1px solid #cbd5e1;padding:6px 10px;background:#f1f5f9;">${I18N.t('dlg.table_header')} ${c+1}</th>`;h+='</tr>';}for(let r=hdr?1:0;r<rows;r++){h+='<tr>';for(let c=0;c<cols;c++)h+=`<td style="border:1px solid #cbd5e1;padding:6px 10px;">&nbsp;</td>`;h+='</tr>';}h+='</table><br>';const _tt=(_verifZoneActive)||richEditor();_richInsertHtml(h,_tt);document.getElementById('table-dialog').style.display='none';_verifZoneActive=null;}

// Image resize + insert
function handleRichImage(input){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{const img=new Image();img.onload=()=>{const maxW=800;let w=img.width,h=img.height;if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);const dataUrl=c.toDataURL('image/jpeg',0.88);const _ti=(_verifZoneActive)||richEditor();_richInsertHtml(`<img src="${dataUrl}" style="width:${w}px;max-width:800px;height:auto;display:block;margin:8px 0;border-radius:4px;" alt="image">`,_ti);};img.src=e.target.result;};reader.readAsDataURL(file);input.value='';}

// Image click → props
document.addEventListener('DOMContentLoaded',()=>{
  richEditor().addEventListener('click',e=>{
    if(e.target.tagName==='IMG')selectImg(e.target);
    else deselectImg();
  });
  richEditor().addEventListener('dblclick',e=>{
    const span=e.target.closest('.lx-span');
    if(span){
      e.preventDefault();
      e.stopPropagation();
      _editingLxSpan=span;
      setLMode(span.dataset.m||'inline');
      openLatexModal();
      document.getElementById('latex-input').value=span.dataset.f||'';
      updateLPreview();
    }
  });
});
function selectImg(img){if(currentImg)currentImg.classList.remove('selected');currentImg=img;img.classList.add('selected');document.getElementById('img-w').value=parseInt(img.style.width)||img.naturalWidth||400;document.getElementById('img-h').value=img.style.height&&img.style.height!=='auto'?parseInt(img.style.height):'';document.getElementById('img-alt').value=img.alt||'';document.getElementById('img-props').style.display='flex';}
function deselectImg(){if(currentImg)currentImg.classList.remove('selected');currentImg=null;document.getElementById('img-props').style.display='none';}
function applyImgProps(){if(!currentImg)return;let w=parseInt(v('img-w'));if(!w||w>800)w=800;currentImg.style.width=w+'px';currentImg.style.maxWidth='800px';const hVal=v('img-h');currentImg.style.height=hVal?parseInt(hVal)+'px':'auto';currentImg.alt=v('img-alt');}
function removeSelectedImg(){if(currentImg){currentImg.remove();deselectImg();}}

// Video
// Audio file embed → Base64 → HTML5 <audio> player
function handleRichAudio(input){
  const file=input.files[0];
  if(!file)return;
  const maxMb=10;
  if(file.size>maxMb*1024*1024){toast(I18N.t('msg.fichier_trop_grand', {mb: maxMb}));input.value='';return;}
  const reader=new FileReader();
  reader.onload=e=>{
    const dataUrl=e.target.result;
    const mime=file.type||'audio/mpeg';
    const name=file.name.replace(/"/g,'&quot;');
    const h=`<figure style="margin:10px 0;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;display:inline-block;">
  <figcaption style="font-size:.78rem;font-weight:600;color:#475569;margin-bottom:6px;">\uD83D\uDD0A ${name}</figcaption>
  <audio controls style="display:block;max-width:500px;">
    <source src="${dataUrl}" type="${mime}">
    Votre navigateur ne supporte pas l'audio HTML5.
  </audio>
</figure><br>`;
    const _ta=(_verifZoneActive)||richEditor();_richInsertHtml(h,_ta);
    _verifZoneActive=null;
  };
  reader.readAsDataURL(file);
  input.value='';
}

function verifHandleAudio(input,id){
  verifSetActive(id);
  handleRichAudio(input);
}
function insertRichVideo(){const url=prompt(I18N.t('rtb.video_prompt'));if(!url)return;let h='';const yt=url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?]+)/);const vm=url.match(/vimeo\.com\/(\d+)/);if(yt)h=`<br><iframe width="560" height="315" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allowfullscreen style="max-width:100%;border-radius:6px;"></iframe><br>`;else if(vm)h=`<br><iframe src="https://player.vimeo.com/video/${vm[1]}" width="560" height="315" frameborder="0" allowfullscreen style="max-width:100%;border-radius:6px;"></iframe><br>`;else h=`<br><video src="${url}" controls style="max-width:100%;border-radius:6px;"></video><br>`;const _tv=(_verifZoneActive)||richEditor();_richInsertHtml(h,_tv);_verifZoneActive=null;}

// ══════════════════════════════════════════════════════
//  LINK MODAL (with Base64 file embedding)
// ══════════════════════════════════════════════════════
let linkFileData=null; // {dataUrl, mimeType, fileName, isImage}

function openLinkModal(){
  linkFileData=null;
  document.getElementById('link-text').value='';
  document.getElementById('link-url').value='';
  document.getElementById('link-file').value='';
  document.getElementById('link-file-info').textContent='';
  document.getElementById('link-preview').textContent='';
  document.getElementById('link-confirm-btn').disabled=true;
  document.getElementById('link-blank').checked=true;
  const linkModal = document.getElementById('linkModal');
  linkModal.style.display='flex';
  FocusTrap.trap(linkModal, closeLinkModal);
}
function closeLinkModal(){document.getElementById('linkModal').style.display='none';FocusTrap.release();}

function handleLinkFile(input){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const dataUrl=e.target.result;
    const mimeType=file.type||'application/octet-stream';
    const isImage=mimeType.startsWith('image/');
    linkFileData={dataUrl,mimeType,fileName:file.name,isImage};
    document.getElementById('link-url').value=''; // clear URL if file selected
    document.getElementById('link-file-info').textContent=I18N.t('msg.fichier_info', {name: file.name, size: Math.round(file.size/1024)});
    document.getElementById('link-preview').textContent=isImage?I18N.t('msg.fichier_img'):I18N.t('msg.fichier_dl');
    document.getElementById('link-confirm-btn').disabled=false;
  };
  reader.readAsDataURL(file);
}
function updateLinkPreview(){
  const url=v('link-url');
  if(url){linkFileData=null;document.getElementById('link-file').value='';document.getElementById('link-file-info').textContent='';document.getElementById('link-preview').textContent='';document.getElementById('link-confirm-btn').disabled=false;}
  else if(!linkFileData)document.getElementById('link-confirm-btn').disabled=true;
}

function confirmLink(){
  const text=v('link-text');
  const blank=document.getElementById('link-blank').checked;
  const target=blank?' target="_blank"':'';
  let html='';

  if(linkFileData){
    if(linkFileData.isImage){
      // For image files: if over 800px, resize
      const img=new Image();
      img.onload=()=>{
        const maxW=800;let w=img.width,h=img.height;
        if(w>maxW){h=Math.round(h*maxW/w);w=maxW;}
        const c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        const resized=c.toDataURL('image/jpeg',0.88);
        const label=text||linkFileData.fileName;
        const imgHtml=`<a href="${resized}" download="${attrEsc(linkFileData.fileName)}"${target}><img src="${resized}" style="width:${w}px;max-width:800px;height:auto;display:block;margin:8px 0;border-radius:4px;" alt="${attrEsc(label)}"></a>`;
        const _it=_verifZoneActive||richEditor();_richInsertHtml(imgHtml,_it);closeLinkModal();_verifZoneActive=null;
      };
      img.src=linkFileData.dataUrl;
      return;
    } else {
      // Non-image: data-uri link
      const label=text||linkFileData.fileName;
      html=`<a href="${linkFileData.dataUrl}" download="${attrEsc(linkFileData.fileName)}"${target}>${htmlEsc(label)} 📎</a>`;
    }
  } else {
    // External URL
    const url=v('link-url').trim();
    if(!url){toast(I18N.t('msg.saisissez_une_url_ou_selectionnez'));return;}
    const label=text||url;
    html=`<a href="${attrEsc(url)}"${target}>${htmlEsc(label)}</a>`;
  }
  const lTgt=_verifZoneActive||richEditor();_richInsertHtml(html,lTgt);closeLinkModal();_verifZoneActive=null;
}

// ══════════════════════════════════════════════════════
//  LATEX MODAL
// ══════════════════════════════════════════════════════
let latexMode='inline';
let _editingLxSpan=null;
function openLatexModal(){const lm=document.getElementById('latexModal');lm.style.display='flex';document.getElementById('latex-input').value='';document.getElementById('latex-render').innerHTML=I18N.t('tpl.apercu');FocusTrap.trap(lm, closeLatexModal);}
function closeLatexModal(){document.getElementById('latexModal').style.display='none';FocusTrap.release();_editingLxSpan=null;}
function setLMode(m){latexMode=m;document.getElementById('lm-inline').classList.toggle('active',m==='inline');document.getElementById('lm-block').classList.toggle('active',m==='block');updateLPreview();}
function updateLPreview(){const f=v('latex-input');const r=document.getElementById('latex-render');if(!f){r.innerHTML=I18N.t('tpl.apercu');return;}try{r.innerHTML=katex.renderToString(f,{throwOnError:false,displayMode:latexMode==='block'});}catch(e){r.textContent='Erreur: '+e.message;}}
function aSym(s){const i=document.getElementById('latex-input'),p=i.selectionStart,e=i.selectionEnd;i.value=i.value.slice(0,p)+s+i.value.slice(e);i.selectionStart=i.selectionEnd=p+s.length;i.focus();updateLPreview();}
function iSym(full,before,after){const i=document.getElementById('latex-input'),p=i.selectionStart,e=i.selectionEnd;const sel=i.value.slice(p,e)||'';const ins=sel?before+sel+after:full;i.value=i.value.slice(0,p)+ins+i.value.slice(e);i.selectionStart=i.selectionEnd=p+ins.length;i.focus();updateLPreview();}
function confirmLatex(){
  const f=v('latex-input').trim();
  if(!f){closeLatexModal();return;}
  if(_editingLxSpan){
    const tmp=document.createElement('div');
    tmp.innerHTML=mkLxSpan(f,latexMode)+' ';
    _editingLxSpan.replaceWith(...Array.from(tmp.childNodes));
  } else {
    const tgt=_verifZoneActive||richEditor();
    _richInsertHtml(mkLxSpan(f,latexMode)+' ',tgt);
    _verifZoneActive=null;
  }
  closeLatexModal();
}

// ══════════════════════════════════════════════════════
//  SAUVEGARDE / RESTAURATION DE LA SÉLECTION
//  Corrige l'insertion (LaTeX, lien, image…) à la mauvaise
//  place : quand une fenêtre modale s'ouvre, le focus quitte
//  la zone éditable et le curseur est perdu. On mémorise donc
//  en continu la dernière position du curseur dans une zone
//  éditable, puis on la restaure juste avant l'insertion.
// ══════════════════════════════════════════════════════
let _richSavedRange=null;
// Sélecteur de toutes les zones éditables de l'outil (éditeur principal + zones de vérification)
const _RICH_HOST_SEL='#rich-editor, #v4-editor, .vf-zone, .vf-zone-nom, .vf-general, .vf-editable-cell, .prop-cell, .fb-cell';
function _richHostOf(node){
  const el=node&&(node.nodeType===1?node:node.parentElement);
  return el?el.closest(_RICH_HOST_SEL):null;
}
// Mémorise le range tant qu'il se trouve dans une zone éditable connue.
// On ignore les sélections faites dans les champs des modales (latex-input, etc.).
document.addEventListener('selectionchange',function(){
  const sel=window.getSelection();
  if(sel&&sel.rangeCount){
    const r=sel.getRangeAt(0);
    if(_richHostOf(r.commonAncestorContainer)){
      _richSavedRange=r.cloneRange();
    }
  }
});
// Redonne le focus à la cible et y replace le curseur exactement
// là où il était. Si le range mémorisé n'appartient pas à la cible,
// on place le curseur à la fin de celle-ci (repli sûr).
function restoreRichSelection(tgt){
  if(!tgt)return;
  const saved=_richSavedRange; // on capture AVANT le focus (focus peut écraser _richSavedRange via selectionchange)
  tgt.focus();
  const sel=window.getSelection();
  if(!sel)return;
  if(saved&&tgt.contains(saved.commonAncestorContainer)){
    sel.removeAllRanges();
    sel.addRange(saved);
  }else{
    const r=document.createRange();
    r.selectNodeContents(tgt);
    r.collapse(false); // fin de la zone
    sel.removeAllRanges();
    sel.addRange(r);
  }
}
// Insertion HTML robuste via Range API (remplace document.execCommand déprecié)
function _richInsertHtml(html, tgt) {
  restoreRichSelection(tgt);
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) { tgt.insertAdjacentHTML('beforeend', html); return; }
  const range = sel.getRangeAt(0);
  if (!tgt.contains(range.commonAncestorContainer)) { tgt.insertAdjacentHTML('beforeend', html); return; }
  range.deleteContents();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const frag = document.createDocumentFragment();
  let last = null;
  while (tmp.firstChild) { last = tmp.firstChild; frag.appendChild(last); }
  range.insertNode(frag);
  if (last) {
    const r2 = document.createRange();
    r2.setStartAfter(last);
    r2.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r2);
  }
}