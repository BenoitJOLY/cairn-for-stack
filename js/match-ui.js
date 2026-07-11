// ── MATCH UI (RELIER) ───────────────────────────────────────────
//  LOGIQUE UI POUR MATCH (RELIER)
// ══════════════════════════════════════════════════

function addMatchItem(side) {
  const tempId = `match-new-${side}-${Date.now()}`;
  
  // On crée une textarea cachée temporaire pour que l'éditeur riche ait une cible
  const ta = document.createElement('textarea');
  ta.id = tempId;
  ta.style.display = 'none';
  ta.value = ""; 
  document.body.appendChild(ta);

  // On définit le contexte : on est en train de CRÉER un nouvel item
  matchEditContext = { isNew: true, side: side, tempId: tempId };

  openRich(tempId);
}

function editMatchItem(side, index) {
  const items = side === 'left' ? matchState.left : matchState.right;
  const item = items[index];
  const tempId = `match-edit-${side}-${index}`;
  
  // Textarea cachée pour l'édition
  const ta = document.createElement('textarea');
  ta.id = tempId;
  ta.style.display = 'none';
  ta.value = item.html;
  document.body.appendChild(ta);

  // On définit le contexte : on est en train d'ÉDITER un item existant
  matchEditContext = { isNew: false, side: side, index: index, tempId: tempId };

  openRich(tempId);
}

function renderMatchLists() {
  const lList = document.getElementById('match-list-left');
  const rList = document.getElementById('match-list-right');
  lList.innerHTML = ''; rList.innerHTML = '';

  matchState.left.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = `match-item ${matchState.selectedLeft === i ? 'selected' : ''}`;
    const tmp = document.createElement('div'); tmp.innerHTML = item.html;
    const txt = tmp.textContent || tmp.innerText || I18N.t('match.item_vide');

    div.innerHTML = `
      <span class="match-item-content" title="${txt}">${txt}</span>
      <div>
        <button class="match-btn-edit" onclick="editMatchItem('left', ${i})" aria-label="${I18N.t('btn.modifier')}">✏️</button>
        <button class="match-btn-del" onclick="removeMatchItem('left', ${i})" aria-label="${I18N.t('btn.supprimer')}">✕</button>
      </div>
    `;
    div.onclick = (e) => { if(e.target.tagName!=='BUTTON') selectMatchLeft(i); };
    lList.appendChild(div);
  });

  matchState.right.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'match-item';
    const tmp = document.createElement('div'); tmp.innerHTML = item.html;
    const txt = tmp.textContent || tmp.innerText || I18N.t('match.item_vide');

    div.innerHTML = `
      <span class="match-item-content" title="${txt}">${txt}</span>
      <div>
        <button class="match-btn-edit" onclick="editMatchItem('right', ${i})" aria-label="${I18N.t('btn.modifier')}">✏️</button>
        <button class="match-btn-del" onclick="removeMatchItem('right', ${i})" aria-label="${I18N.t('btn.supprimer')}">✕</button>
      </div>
    `;
    div.onclick = (e) => { if(e.target.tagName!=='BUTTON') selectMatchRight(i); };
    rList.appendChild(div);
  });
  
  renderMatchConnections();
}

function removeMatchItem(side, index) {
  const items = side === 'left' ? matchState.left : matchState.right;
  items.splice(index, 1);
  matchState.connections = matchState.connections.filter(c => {
    if(side === 'left') return c.l !== index;
    else return c.r !== index;
  });
  matchState.connections = matchState.connections.map(c => {
    let l = c.l, r = c.r;
    if(side === 'left' && c.l > index) l--;
    if(side === 'right' && c.r > index) r--;
    return {l, r};
  });
  
  matchState.selectedLeft = null;
  renderMatchLists();
}

function selectMatchLeft(index) {
  matchState.selectedLeft = index;
  renderMatchLists();
  document.getElementById('match-connections').scrollIntoView({behavior:'smooth'});
}

function selectMatchRight(index) {
  if (matchState.selectedLeft === null) {
    toast(I18N.t('msg.selectionnez_d_abord_un_element'));
    return;
  }
  const exists = matchState.connections.find(c => c.l === matchState.selectedLeft && c.r === index);
  if (!exists) {
    matchState.connections.push({ l: matchState.selectedLeft, r: index });
    matchState.selectedLeft = null;
    renderMatchLists();
  } else {
    toast(I18N.t('msg.cette_liaison_existe_deja'));
  }
}

function resetMatchSelection() { matchState.selectedLeft = null; renderMatchLists(); }
function clearMatchConnections() { if(confirm(I18N.t('match.effacer_liaisons'))) { matchState.connections = []; renderMatchLists(); } }

function removeMatchConnection(idx) {
  matchState.connections.splice(idx, 1);
  renderMatchLists();
}

function renderMatchConnections() {
  const list = document.getElementById('match-connections');
  list.innerHTML = '';
  matchState.connections.forEach((c, i) => {
    const lTxt = matchState.left[c.l] ? (matchState.left[c.l].text.replace(/<[^>]*>/g,'').substring(0,15)) : '?';
    const rTxt = matchState.right[c.r] ? (matchState.right[c.r].text.replace(/<[^>]*>/g,'').substring(0,15)) : '?';
    
    const tag = document.createElement('span');
    tag.className = 'match-connection-tag';
    tag.innerHTML = `${lTxt} ↔ ${rTxt} <button onclick="removeMatchConnection(${i})" aria-label="${I18N.t('btn.supprimer')}">✕</button>`;
    list.appendChild(tag);
  });
}
function selectType(t,btn){currentType=t;document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.form-panel').forEach(p=>p.classList.remove('active'));btn.classList.add('active');document.getElementById('fp-'+t).classList.add('active');}
function tab(prefix,pane,el){const body=el.closest('.form-panel-body');body.querySelectorAll('.mtab').forEach(t=>t.classList.remove('on'));body.querySelectorAll('.mpane').forEach(p=>p.classList.remove('on'));el.classList.add('on');document.getElementById(prefix+'-'+pane).classList.add('on');}