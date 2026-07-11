// projects.js — Gestionnaire de projets HéStack
// Slots nommés localStorage + export/import .hestack

var _PROJ_KEY = 'v4_projects';
var _PROJ_MAX = 10;

/* ── Lire / écrire la liste ─────────────────────────────────────── */
function _projList(){
  try{ return JSON.parse(localStorage.getItem(_PROJ_KEY)||'[]'); }catch(e){ return []; }
}
function _projSave(list){
  try{ localStorage.setItem(_PROJ_KEY, JSON.stringify(list)); }catch(e){
    toast('❌ Espace localStorage insuffisant. Exportez un projet en .hestack pour libérer de la place.');
  }
}

/* ── Capturer l'état complet de l'éditeur ───────────────────────── */
function _projCapture(){
  var editor = document.getElementById('v4-editor');
  return {
    html:       editor ? editor.innerHTML : '',
    questions:  JSON.parse(JSON.stringify(questions||{})),
    nextQid:    nextQid||1,
    sharedVars: (typeof _sharedVars!=='undefined') ? JSON.parse(JSON.stringify(_sharedVars||[])) : [],
    quizName:   (document.getElementById('quiz-name')||{}).value || 'Sans titre'
  };
}

/* ── Restaurer l'état ───────────────────────────────────────────── */
function _projRestore(data){
  var editor = document.getElementById('v4-editor');
  if(editor && data.html !== undefined){
    editor.innerHTML = data.html;
    editor.querySelectorAll('.q-chip').forEach(function(chip){
      if(typeof attachChipHandlers==='function') attachChipHandlers(chip);
    });
  }
  if(data.questions) Object.assign(questions, data.questions);
  if(data.nextQid)   nextQid = data.nextQid;
  if(data.sharedVars && typeof _sharedVars!=='undefined') {
    _sharedVars = data.sharedVars;
    if(typeof renderSharedVars==='function') renderSharedVars();
  }
  if(data.quizName){
    var qn = document.getElementById('quiz-name');
    if(qn) qn.value = data.quizName;
  }
  if(typeof saveEditorState==='function') saveEditorState();
  _projUpdateAutosave();
}

/* ── Sauvegarder un slot nommé ──────────────────────────────────── */
function projSaveNamed(name){
  name = (name||'').trim();
  if(!name){ toast('❌ Donnez un nom à ce projet.'); return; }
  var list = _projList();
  var now  = new Date();
  var id   = String(now.getTime());
  list.unshift({ id:id, name:name, savedAt:now.toISOString(), data:_projCapture() });
  if(list.length > _PROJ_MAX) list = list.slice(0, _PROJ_MAX);
  _projSave(list);
  toast('💾 Projet « '+name+' » sauvegardé.');
  renderProjectsList();
  _projUpdateAutosave();
}

/* ── Charger un slot ────────────────────────────────────────────── */
function projLoad(id){
  var list = _projList();
  var proj = list.find(function(p){ return p.id===id; });
  if(!proj){ toast('❌ Projet introuvable.'); return; }
  if(!confirm('Charger « '+proj.name+' » ? Le travail non sauvegardé sera perdu.')){ return; }
  questions = {};
  nextQid   = 1;
  _projRestore(proj.data);
  closeProjectsModal();
  toast('✅ Projet « '+proj.name+' » chargé.');
}

/* ── Supprimer un slot ──────────────────────────────────────────── */
function projDelete(id){
  var list = _projList();
  var proj = list.find(function(p){ return p.id===id; });
  if(!proj) return;
  if(!confirm('Supprimer « '+proj.name+' » ?')) return;
  _projSave(list.filter(function(p){ return p.id!==id; }));
  renderProjectsList();
  toast('🗑️ Projet supprimé.');
}

/* ── Renommer un slot ───────────────────────────────────────────── */
function projRename(id){
  var list = _projList();
  var proj = list.find(function(p){ return p.id===id; });
  if(!proj) return;
  var newName = prompt('Nouveau nom :', proj.name);
  if(!newName||!newName.trim()) return;
  proj.name = newName.trim();
  _projSave(list);
  renderProjectsList();
}

/* ── Export .hestack ────────────────────────────────────────────── */
function projExport(){
  var data = _projCapture();
  var quizName = data.quizName || 'projet';
  var payload = JSON.stringify({ version:'1', exportedAt: new Date().toISOString(), data:data }, null, 2);
  var blob = new Blob([payload],{type:'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = quizName.replace(/[^a-zA-Z0-9_\-À-ž]/g,'_')+'.hestack';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('💾 Exporté : '+a.download);
}

/* ── Import .hestack ────────────────────────────────────────────── */
function projImport(input){
  var file = input.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var obj = JSON.parse(e.target.result);
      if(!obj.data || obj.data.html===undefined) throw new Error('Format .hestack invalide.');
      if(!confirm('Importer « '+(obj.data.quizName||file.name)+' » ? Le travail non sauvegardé sera perdu.')) return;
      questions = {};
      nextQid   = 1;
      _projRestore(obj.data);
      closeProjectsModal();
      toast('✅ Projet importé : '+(obj.data.quizName||file.name));
    }catch(err){
      toast('❌ Erreur import : '+err.message);
    }
    input.value = '';
  };
  reader.readAsText(file);
}

/* ── Indicateur autosave ─────────────────────────────────────────── */
function _projUpdateAutosave(){
  var el = document.getElementById('proj-autosave-lbl');
  if(el){
    var t = new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    el.textContent = '✓ autosauvegarde '+t;
    el.style.opacity = '1';
    clearTimeout(el._fadeTimer);
    el._fadeTimer = setTimeout(function(){ el.style.opacity='.45'; }, 4000);
  }
}

/* Brancher sur saveEditorState existant */
(function(){
  var _orig = window.saveEditorState;
  if(typeof _orig==='function'){
    window.saveEditorState = function(){
      _orig();
      _projUpdateAutosave();
    };
  }
})();

/* ── Rendu de la liste dans la modale ───────────────────────────── */
function renderProjectsList(){
  var list   = _projList();
  var el     = document.getElementById('proj-list');
  if(!el) return;
  var countEl = document.getElementById('proj-count');
  if(countEl) countEl.textContent = list.length+'/'+_PROJ_MAX;
  if(!list.length){
    el.innerHTML = '<div class="proj-empty">Aucun projet sauvegardé.<br>Utilisez « Sauvegarder » pour créer un premier slot.</div>';
    return;
  }
  el.innerHTML = list.map(function(p){
    var d = new Date(p.savedAt);
    var dateStr = d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})
                + ' ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    var qCount = p.data && p.data.questions ? Object.keys(p.data.questions).length : '?';
    return '<div class="proj-row" id="projrow-'+p.id+'">'
      +'<div class="proj-info">'
        +'<div class="proj-name">'+_escHtml(p.name)+'</div>'
        +'<div class="proj-meta">'+dateStr+' &middot; '+qCount+' question'+(qCount>1?'s':'')+'</div>'
      +'</div>'
      +'<div class="proj-actions">'
        +'<button class="proj-btn proj-btn-load" onclick="projLoad(\''+p.id+'\')">📂 Charger</button>'
        +'<button class="proj-btn proj-btn-rename" onclick="projRename(\''+p.id+'\')">✏️</button>'
        +'<button class="proj-btn proj-btn-del" onclick="projDelete(\''+p.id+'\')">🗑️</button>'
      +'</div>'
    +'</div>';
  }).join('');
}

function _escHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Ouvrir / fermer la modale ──────────────────────────────────── */
function openProjectsModal(){
  var m = document.getElementById('projectsModal');
  if(!m) return;
  m.style.display = 'flex';
  renderProjectsList();
  var inp = document.getElementById('proj-save-name');
  if(inp){
    inp.value = (document.getElementById('quiz-name')||{}).value || '';
    setTimeout(function(){ inp.focus(); inp.select(); }, 60);
  }
}

function closeProjectsModal(){
  var m = document.getElementById('projectsModal');
  if(m) m.style.display = 'none';
}

function projSaveFromModal(){
  var inp = document.getElementById('proj-save-name');
  projSaveNamed(inp ? inp.value : '');
}
