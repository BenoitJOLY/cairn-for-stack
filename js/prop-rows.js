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

// ── PROP ROWS + POOL VALIDATION ─────────────────────────────────

// ══════════════════════════════════════════════════════
//  PROP ROWS
// ══════════════════════════════════════════════════════
function addCBRow(isV,text='',fb='',fb2=''){
  const id=uid();
  const div=document.createElement('div');
  div.id='r'+id;
  div.className='prop-row';
  const showOubli=document.getElementById('cb-show-oubli')?.checked;
  const textField=`<div><div id="prev-p-text-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" aria-label="${I18N.t('tpl.prop_intitule')}" data-ph="${I18N.t('tpl.prop_intitule')}" onclick="openRich('p-text-${id}')"></div><textarea id="p-text-${id}" class="p-text" style="display:none"></textarea></div>`;
  const fbField=`<div class="p-fb-col"><div id="prev-p-fb-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" aria-label="Feedback" data-ph="Feedback" onclick="openRich('p-fb-${id}')"></div><textarea id="p-fb-${id}" class="p-fb" style="display:none"></textarea></div>`;
  const fb2inner=isV?`<div id="prev-p-fb2-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" aria-label="Feedback si oubliée" data-ph="Feedback si oubliée" onclick="openRich('p-fb2-${id}')"></div><textarea id="p-fb2-${id}" class="p-fb2" style="display:none"></textarea>`:`<input type="hidden" class="p-fb2" value="">`;
  const fb2wrap=isV?`<div class="p-fb2-wrap" style="grid-column:1/-1;${showOubli?'':'display:none;'}">${fb2inner}</div>`:`<input type="hidden" class="p-fb2" value="">`;
  div.innerHTML=`<span class="type-badge ${isV?'badge-v':'badge-f'}">${isV?I18N.t('tpl.prop_vrai'):I18N.t('tpl.prop_faux')}</span><input type="hidden" class="p-bool" value="${isV}">${textField}${fbField}<button class="btn-del" onclick="document.getElementById('r${id}').remove();validateCBDraw();" aria-label="${I18N.t('btn.supprimer')}">✕</button>${fb2wrap}`;
  document.getElementById('cb-props').appendChild(div);
  setRichVal(`p-text-${id}`,text);
  setRichVal(`p-fb-${id}`,fb);
  if(isV)setRichVal(`p-fb2-${id}`,fb2);
  validateCBDraw();
}

function toggleCBOubli(){const on=document.getElementById('cb-show-oubli')?.checked;document.querySelectorAll('#cb-props .prop-row').forEach(r=>{const wrap=r.querySelector('.p-fb2-wrap');if(wrap)wrap.style.display=on?'':'none';});}

function addPoolRow(cid,isV,text,fb,upd){
  if(text===undefined)text='';
  if(fb===undefined)fb='';
  const id=uid();
  const div=document.createElement('div');
  div.id='r'+id;
  div.className='prop-row two-col';
  const textField=`<div><div id="prev-p-text-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" aria-label="${I18N.t('tpl.prop_intitule')}" data-ph="${I18N.t('tpl.prop_intitule')}" onclick="openRich('p-text-${id}')"></div><textarea id="p-text-${id}" class="p-text" style="display:none"></textarea></div>`;
  const fbField=`<div class="p-fb-col"><div id="prev-p-fb-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" aria-label="Feedback" data-ph="Feedback" onclick="openRich('p-fb-${id}')"></div><textarea id="p-fb-${id}" class="p-fb" style="display:none"></textarea></div>`;
  div.innerHTML=`<input type="hidden" class="p-bool" value="${isV}">${textField}${fbField}<button class="btn-del" onclick="delPoolRow('r${id}','${cid}')" aria-label="${I18N.t('btn.supprimer')}">✕</button>`;
  document.getElementById(cid).appendChild(div);
  setRichVal(`p-text-${id}`,text);
  setRichVal(`p-fb-${id}`,fb);
  if(upd)refreshPoolCounts(cid);
}

function delPoolRow(rowId,cid){document.getElementById(rowId).remove();refreshPoolCounts(cid);const prefix=cid.split('-')[0];checkPoolWarn(prefix);}
function refreshPoolCounts(cid){
  // Re-validate draws after any pool change
  const pfx=cid.split('-')[0];
  if(pfx==='cb'){setTimeout(validateCBDraw,0);}
  else{setTimeout(()=>validateRADraw(pfx),0);}const prefix=cid.split('-')[0];['vrais','faux'].forEach(t=>{const el=document.getElementById(`${prefix}-${t}-count`);if(el)el.textContent=`(${document.querySelectorAll(`#${prefix}-${t} .prop-row`).length})`;});}
// ═══════════════════════════════════════════════════════
// FIX 2 — VALIDATION DES TIRAGES
// ═══════════════════════════════════════════════════════

/** Returns {nv,nf} counts for a pool prefix */
function poolCounts(prefix){
  // Checkbox stores ALL props in #cb-props with a hidden .p-bool field
  // Radio/Dropdown split into #prefix-vrais / #prefix-faux
  if(prefix==='cb'){
    const rows=document.querySelectorAll('#cb-props .prop-row');
    let nv=0,nf=0;
    rows.forEach(r=>{
      const bool=r.querySelector('.p-bool');
      if(bool&&(bool.value==='true'||bool.value===true))nv++; else nf++;
    });
    return{nv,nf};
  }
  const nv=document.querySelectorAll(`#${prefix}-vrais .prop-row`).length;
  const nf=document.querySelectorAll(`#${prefix}-faux .prop-row`).length;
  return{nv,nf};
}

/**
 * Validates CB draw parameters and shows/hides warning.
 * Rules:
 *   FIXED XB: 1 ≤ XB ≤ nv ; XE_min = XB+1 ; XE_max = XB+nf
 *   ALEA  XB: XE_min = 2 ; XE_max = nv+nf ; ensures random XB ≤ XE-1
 */
function validateCBDraw(){
  const {nv,nf}=poolCounts('cb');
  const xe=parseInt(document.getElementById('cb-xe')?.value)||0;
  const xb=parseInt(document.getElementById('cb-xb')?.value)||0;
  const mode=document.getElementById('cb-mode-xb')?.value||'fixe';
  const warnEl=document.getElementById('warn-cb-draw');
  const msgEl=document.getElementById('warn-cb-draw-msg');
  if(!warnEl||!msgEl)return true;
  const errors=[];
  if(mode==='fixe'){
    if(nv<1) errors.push(`Ajoutez au moins 1 proposition VRAIE.`);
    else if(xb<1||xb>nv) errors.push(`Le nombre de bonnes propositions à afficher doit être entre 1 et ${nv} (nb de vraies en banque).`);
    if(xe<xb) errors.push(`Le nombre de propositions à afficher doit être ≥ ${xb} (le nombre de vraies à afficher).`);
    if(xe>xb+nf) errors.push(`Nb de propositions à afficher max = ${xb+nf} (${xb} vraies + ${nf} fausses disponibles).`);
  } else {
    // ALEA: XB is random between 1 and min(XE-1, nv)
    if(xe<2) errors.push(`XE doit être ≥ 2 (au moins 1 vraie + 1 fausse).`);
    if(xe>nv+nf&&nv+nf>0) errors.push(`XE max = ${nv+nf} (toutes les propositions disponibles).`);
    if(nv<1) errors.push(`Ajoutez au moins 1 proposition VRAIE.`);
    if(nf<1) errors.push(`Ajoutez au moins 1 proposition FAUSSE.`);
 // Verify random XB stays < XE (crucial)
    /* contrainte supprimée : 0 fausse autorisée */
  }
  const ok=errors.length===0;
  warnEl.style.display=ok?'none':'block';
  msgEl.innerHTML=errors.join('<br>');
  return ok;
}

/**
 * Validates RA/DD draw parameters.
 * Rules: XE_min = 2 ; XE_max = nf + 1
 */
function validateRADraw(prefix){
  const {nv,nf}=poolCounts(prefix);
  const xe=parseInt(document.getElementById(prefix+'-xe')?.value)||0;
  const warnEl=document.getElementById(`warn-${prefix}-draw`);
  const msgEl=document.getElementById(`warn-${prefix}-draw-msg`);
  if(!warnEl||!msgEl)return true;
  const errors=[];
  if(nv<1) errors.push('Ajoutez au moins 1 proposition VRAIE.');
  if(xe<2) errors.push('XE doit être ≥ 2 (1 vraie + 1 fausse au minimum).');
  if(xe>nf+1) errors.push(`Nombre de propositions max = ${nf+1} (1 vraie + ${nf} faux disponibles).`);
  const ok=errors.length===0;
  warnEl.style.display=ok?'none':'block';
  msgEl.innerHTML=errors.join('<br>');
  return ok;
}

// ══════════════════════════════════════════════════════
//  VRAI / FAUX — ajout d'une ligne de proposition
// ══════════════════════════════════════════════════════
function validateVFDraw() {
  var rows = document.querySelectorAll('#vf-props .vf-row');
  var nv = 0, nf = 0;
  rows.forEach(function(r) {
    var exp = r.querySelector('.vf-exp:checked');
    if (exp && exp.value === 'f') nf++; else nv++;
  });
  var xe   = parseInt(document.getElementById('vf-xe')?.value) || 0;
  var xb   = parseInt(document.getElementById('vf-xb')?.value) || 0;
  var mode = document.getElementById('vf-mode-xb')?.value || 'fixe';
  var warnEl = document.getElementById('warn-vf-draw');
  var msgEl  = document.getElementById('warn-vf-draw-msg');
  if (!warnEl || !msgEl) return true;
  var errors = [];
  if (mode === 'fixe') {
    if (nv < 1) errors.push('Ajoutez au moins 1 proposition VRAIE.');
    else if (xb < 1 || xb > nv) errors.push('Nb de vraies à afficher : entre 1 et ' + nv + '.');
    if (xe < xb) errors.push('Nb total doit être ≥ ' + xb + ' (nb de vraies).');
    if (xe > xb + nf) errors.push('Max = ' + (xb + nf) + ' (' + xb + ' vraies + ' + nf + ' fausses disponibles).');
  } else {
    if (xe < 2) errors.push('Nb à afficher doit être ≥ 2.');
    if (nv + nf > 0 && xe > nv + nf) errors.push('Max = ' + (nv + nf) + ' (toutes les propositions).');
    if (nv < 1) errors.push('Ajoutez au moins 1 proposition VRAIE.');
    if (nf < 1) errors.push('Ajoutez au moins 1 proposition FAUSSE.');
  }
  warnEl.style.display = errors.length ? 'block' : 'none';
  msgEl.textContent = errors.join(' ');
  return errors.length === 0;
}

function addVFRow(text, exp, fbIfVrai, fbIfFaux) {
  text     = text     || '';
  exp      = exp      !== undefined ? exp : 1;
  fbIfVrai = fbIfVrai || '';
  fbIfFaux = fbIfFaux || '';

  const id     = uid();
  const isFaux = (exp === 2 || exp === 'f');
  const chkV   = !isFaux ? 'checked' : '';
  const chkF   = isFaux  ? 'checked' : '';

  const div = document.createElement('div');
  div.id = 'vfr' + id;
  div.className = 'vf-row';
  div.innerHTML =
    `<div class="vf-row-num"></div>
    <div class="vf-row-top">
      <div class="vf-ptext-wrap"><div id="prev-vf-ptext-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" data-ph="${I18N.t('vf.row_ptext_ph')}" onclick="openRich('vf-ptext-${id}')"></div><textarea id="vf-ptext-${id}" class="vf-ptext" style="display:none"></textarea></div>
      <div class="vf-exp-group">
        <span class="vf-exp-label">${I18N.t('vf.row_reponse_attendue_lbl')}</span>
        <label class="vf-radio-lbl"><input type="radio" class="vf-exp" name="vf-exp-${id}" value="v" ${chkV} onchange="validateVFDraw();"> ${I18N.t('vf.preview_vrai')}</label>
        <label class="vf-radio-lbl"><input type="radio" class="vf-exp" name="vf-exp-${id}" value="f" ${chkF} onchange="validateVFDraw();"> ${I18N.t('vf.preview_faux')}</label>
      </div>
      <button class="btn-del" onclick="document.getElementById('vfr${id}').remove();validateVFDraw();renumberVFRows();" aria-label="${I18N.t('btn.supprimer')}">✕</button>
    </div>
    <div class="vf-row-fbs">
      <div class="vf-fb-block">
        <label class="vf-fb-label">${I18N.t('vf.row_si_vrai_lbl_html')}</label>
        <div id="prev-vf-fbv-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" data-ph="${I18N.t('vf.row_fbv_ph')}" onclick="openRich('vf-fbv-${id}')"></div>
        <textarea id="vf-fbv-${id}" class="vf-fb-ifvrai" style="display:none"></textarea>
      </div>
      <div class="vf-fb-block">
        <label class="vf-fb-label">${I18N.t('vf.row_si_faux_lbl_html')}</label>
        <div id="prev-vf-fbf-${id}" class="rich-preview rich-preview-sm" tabindex="0" role="button" data-ph="${I18N.t('vf.row_fbf_ph')}" onclick="openRich('vf-fbf-${id}')"></div>
        <textarea id="vf-fbf-${id}" class="vf-fb-iffaux" style="display:none"></textarea>
      </div>
    </div>`;

  document.getElementById('vf-props').appendChild(div);
  setRichVal(`vf-ptext-${id}`, text);
  setRichVal(`vf-fbv-${id}`, fbIfVrai);
  setRichVal(`vf-fbf-${id}`, fbIfFaux);
  validateVFDraw();
  renumberVFRows();
}

function renumberVFRows() {
  document.querySelectorAll('#vf-props .vf-row').forEach(function(r, i) {
    var numEl = r.querySelector('.vf-row-num');
    if (numEl) numEl.textContent = I18N.t('vf.row_prop_num', { n: i + 1 });
  });
}

function addOrdRow(text) {
  text = text || '';
  const id = uid();

  const div = document.createElement('div');
  div.id = 'ordr' + id;
  div.className = 'ord-row';
  div.draggable = true;
  div.innerHTML =
    `<span class="ord-handle" title="${I18N.t('ord.drag_hint')}">⠿</span>
    <span class="ord-num"></span>
    <input type="text" class="ord-item-text" value="${attrEsc(text)}" placeholder="${I18N.t('ord.item_ph')}">
    <button class="btn-del" onclick="document.getElementById('ordr${id}').remove();renumberOrdRows();if(typeof ordRefreshPreview==='function')ordRefreshPreview();" aria-label="${I18N.t('btn.supprimer')}">✕</button>`;

  document.getElementById('ord-items').appendChild(div);
  wireOrdDrag(div);
  renumberOrdRows();
  if (typeof ordRefreshPreview === 'function') ordRefreshPreview();
}

function renumberOrdRows() {
  document.querySelectorAll('#ord-items .ord-row').forEach(function(r, i) {
    var numEl = r.querySelector('.ord-num');
    if (numEl) numEl.textContent = (i + 1) + '.';
  });
}

var _ordDragEl = null;
function wireOrdDrag(row) {
  row.addEventListener('dragstart', function(e) {
    _ordDragEl = row;
    e.dataTransfer.effectAllowed = 'move';
    row.classList.add('ord-dragging');
  });
  row.addEventListener('dragend', function() {
    row.classList.remove('ord-dragging');
    _ordDragEl = null;
  });
  row.addEventListener('dragover', function(e) { e.preventDefault(); });
  row.addEventListener('drop', function(e) {
    e.preventDefault();
    if (!_ordDragEl || _ordDragEl === row) return;
    var container = document.getElementById('ord-items');
    var rows = Array.from(container.querySelectorAll('.ord-row'));
    var fromIdx = rows.indexOf(_ordDragEl), toIdx = rows.indexOf(row);
    if (fromIdx < toIdx) container.insertBefore(_ordDragEl, row.nextSibling);
    else container.insertBefore(_ordDragEl, row);
    renumberOrdRows();
    if (typeof ordRefreshPreview === 'function') ordRefreshPreview();
  });
}

// ══════════════════════════════════════════════════════
//  SÉLECTION SUR IMAGE — mode séquence chronométrée
// ══════════════════════════════════════════════════════
function icToggleMode() {
  var m = document.querySelector('input[name="ic-mode"]:checked');
  var mode = m ? m.value : 'single';
  var single = document.getElementById('ic-mode-single');
  var seq = document.getElementById('ic-mode-sequence');
  if (single) single.style.display = mode === 'single' ? '' : 'none';
  if (seq) seq.style.display = mode === 'sequence' ? '' : 'none';
  if (typeof icRefreshPreview === 'function') icRefreshPreview();
}


// Éditeur de zones du mode séquence : voir js/imgclick-ui.js (canvas + upload direct).

// ═══════════════════════════════════════════════════════
// FIX 3 — JSON IMPORT MODAL
// ═══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
//  JSON IMPORT LOGIC (Réparé et fusionné)
// ════════════════════════════════════════════════════════════════════════════════════
