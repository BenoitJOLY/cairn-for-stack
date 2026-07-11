// stack-import.js — Import/edit existing STACK (Moodle XML) questions

// ── IMPORT FILE DIALOG ─────────────────────────────────────────────
function importStackQuestion() {
  var inp = document.getElementById('stack-import-file');
  if (inp) { inp.value = ''; inp.click(); }
}

function handleStackImportFile(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try { _processStackXml(e.target.result, file.name); }
    catch(err) { toast('❌ Import : ' + err.message); }
  };
  reader.readAsText(file, 'utf-8');
}

function _processStackXml(xmlText, fileName) {

  /* ── Détection signature HéStack round-trip ─────────────────────
     Depuis 2026-07-04 (v2) : état stocké en base64 dans un commentaire XML
     <!-- hestack::v1::... -->, jamais dans un champ de question. Un
     commentaire n'est rendu nulle part (ni élève, ni enseignant), donc
     c'est le seul emplacement réellement sûr — deux tentatives précédentes
     (span caché dans <questiontext>, texte brut dans <questiondescription>)
     étaient toutes deux de vrais champs affichés et cassaient l'UI (voir
     PLAN.md, incidents du 2026-07-04).
     Anciens formats conservés comme fallbacks pour réimporter d'anciens
     exports : texte plat dans <questiondescription>, span dans
     <questiontext>, <idnumber>. */
  var _sigMatch = xmlText.match(/<!--\s*hestack::v1::([A-Za-z0-9+/=\s]+?)\s*-->/);
  var _sigIsB64 = !!_sigMatch;
  if(!_sigMatch){
    /* Fallback texte plat dans <questiondescription> */
    _sigMatch = xmlText.match(/hestack::v1::([\s\S]*?)<\/text>/);
  }
  if(!_sigMatch){
    /* Fallback : span caché dans questiontext */
    _sigMatch = xmlText.match(/hestack::v1::([\s\S]*?)<\/span>/);
  }
  if(!_sigMatch){
    /* Fallback ancien format : <idnumber> CDATA */
    _sigMatch = xmlText.match(/<idnumber[^>]*>\s*<!\[CDATA\[hestack::v1::([\s\S]*?)\]\]>\s*<\/idnumber>/);
  }
  if(!_sigMatch){
    /* Fallback très ancien : <idnumber> sans CDATA */
    _sigMatch = xmlText.match(/<idnumber[^>]*>hestack::v1::([\s\S]*?)<\/idnumber>/);
  }
  if(_sigMatch){
    try{
      var rawJson;
      if(_sigIsB64){
        rawJson = decodeURIComponent(escape(atob(_sigMatch[1].replace(/\s+/g,''))));
      } else {
        /* Ré-échapper ]] > → ]]> (anciens exports) puis décoder les entités
           &lt;/&gt; (tous les chevrons du bloc étaient encodés à l'export pour
           empêcher le navigateur de parser le HTML imbriqué comme de vraies balises) */
        rawJson = _sigMatch[1].replace(/\]\] >/g,']]>').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
      }
      var state = JSON.parse(rawJson);
      if(state.html!==undefined && state.questions!==undefined){
        var quizName = state.quizName || fileName.replace(/\.xml$/i,'');
        var qCount   = Object.keys(state.questions||{}).length;
        if(!confirm('Ce fichier XML a été créé avec HéStack.\n\n'
          + '📦 Projet : « '+quizName+' » ('+qCount+' question'+(qCount>1?'s':'')+')\n\n'
          + 'Restaurer le projet complet avec tous ses modules ?\n'
          + '(Annuler = importer comme question STACK brute)')){
          /* L'utilisateur veut l'import brut → on continue normalement */
        } else {
          /* Restauration complète */
          questions = {};
          nextQid   = 1;
          var editor = document.getElementById('v4-editor');
          if(editor){
            editor.innerHTML = state.html||'';
            editor.querySelectorAll('.q-chip').forEach(function(chip){
              if(typeof attachChipHandlers==='function') attachChipHandlers(chip);
            });
          }
          Object.assign(questions, state.questions||{});
          nextQid = state.nextQid||1;
          if(state.sharedVars && typeof _sharedVars!=='undefined'){
            _sharedVars = state.sharedVars;
            if(typeof renderSharedVars==='function') renderSharedVars();
          }
          if(state.quizName){
            var qnEl = document.getElementById('quiz-name');
            if(qnEl) qnEl.value = state.quizName;
          }
          if(typeof renumberChips==='function') renumberChips();
          if(typeof saveEditorState==='function') saveEditorState();
          toast('✅ Projet HéStack restauré : « '+quizName+' » — '+qCount+' module'+(qCount>1?'s':'')+'.');
          return;
        }
      }
    }catch(e){
      /* JSON invalide → import brut */
      console.warn('[HéStack] Signature détectée mais JSON invalide :', e.message);
      toast('⚠️ Signature HéStack détectée mais JSON corrompu — import en mode expert. Détail : ' + e.message);
    }
  }

  var parser = new DOMParser();
  var doc = parser.parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('XML invalide ou corrompu.');

  var qEls = doc.querySelectorAll('question[type="stack"]');
  if (!qEls.length) throw new Error('Aucune question STACK trouvée dans ce fichier.');
  if (qEls.length > 1) toast('ℹ️ ' + qEls.length + ' questions trouvées, importation de la première.');

  var qEl = qEls[0];
  var nameEl = qEl.querySelector(':scope > name > text');
  var qname = nameEl ? nameEl.textContent.trim() : fileName.replace(/\.xml$/i, '');

  var qtextEl = qEl.querySelector(':scope > questiontext > text');
  var qtext = qtextEl ? qtextEl.textContent.trim() : '';

  // Lire les types HéStack depuis <questiondescription> si présent
  var _descEl = qEl.querySelector(':scope > questiondescription > text');
  var _descText = _descEl ? _descEl.textContent.trim() : '';
  var _hsTypesMatch = _descText.match(/hestack-types:([a-zA-Z0-9_,\-]+)/);
  var _hsChipTypes = _hsTypesMatch ? _hsTypesMatch[1].split(',').filter(Boolean) : [];

  // Extract PRT blocks directly from the raw XML string (preserves CDATA)
  var prtEls = qEl.querySelectorAll(':scope > prt');
  var prtNames = [], prtXmls = {};
  prtEls.forEach(function(pEl) {
    var nEl = pEl.querySelector(':scope > name');
    var prtName = nEl ? nEl.textContent.trim() : ('prt' + (prtNames.length + 1));
    prtNames.push(prtName);
    var raw = _extractPrtBlock(xmlText, prtName);
    prtXmls[prtName] = raw || new XMLSerializer().serializeToString(pEl);
  });

  // Insert chip into editor
  var qid = nextQid++;
  var chip = createChipEl(qid, 'stack-raw');
  var editor = document.getElementById('v4-editor');
  if (!editor) throw new Error('Éditeur introuvable.');
  editor.appendChild(chip);
  var sel = window.getSelection();
  var after = document.createRange();
  after.setStartAfter(chip); after.collapse(true);
  sel.removeAllRanges(); sel.addRange(after);
  editor.focus();
  document.execCommand('insertLineBreak');
  renumberChips();
  qid = parseInt(chip.dataset.qid);

  // Update chip label with the real question name
  var lbl = chip.querySelector('.chip-label');
  if (lbl) lbl.textContent = 'Q' + qid + ' · ' + qname;
  chip.title = qname;

  questions[qid] = {
    id: qid, type: 'stack-raw',
    name: qname, qtext: qtext,
    rawXml: xmlText,
    prtNames: prtNames, prtXmls: prtXmls,
    prtXML: prtNames.length ? prtXmls[prtNames[0]] : '',
    _editingPrt: null,
    xml: '', inputXML: '', feedbackRef: '', bareme: 0, state: null
  };

  updateChipStatus(qid, true);
  saveEditorState();
  var _typeInfo = _hsChipTypes.length ? ' [types : ' + _hsChipTypes.join(', ') + ']' : '';
  toast('✅ "' + qname + '" importée — ' + prtNames.length + ' PRT(s)' + _typeInfo + '. Utilisez 📥 dans le panneau pour télécharger.');
  openConfigPanel(qid, 'stack-raw');
}

// Extract a <prt>...</prt> block by name directly from the raw XML string
// This preserves CDATA sections perfectly.
function _extractPrtBlock(xmlText, prtName) {
  var pos = 0;
  while (true) {
    var s = xmlText.indexOf('<prt>', pos);
    if (s < 0) break;
    var e = xmlText.indexOf('</prt>', s);
    if (e < 0) break;
    var block = xmlText.substring(s, e + 6);
    var nm = block.match(/<name>\s*(?:<!\[CDATA\[)?\s*([^\]<\n]*?)\s*(?:\]\]>)?\s*<\/name>/);
    if (nm && nm[1].trim() === prtName) return block;
    pos = e + 6;
  }
  return null;
}

// ── PANEL INIT (hook appelé par openConfigPanel) ───────────────────
function stackRawInit(qid) {
  var q = questions[qid]; if (!q) return;

  var nameEl = document.getElementById('sraw-name');
  if (nameEl) nameEl.value = q.name || '';

  var qtEl = document.getElementById('sraw-qtext');
  if (qtEl) {
    if (q.qtext) {
      var plain = q.qtext.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
      qtEl.textContent = plain.substring(0, 320) + (plain.length > 320 ? '…' : '');
    } else {
      qtEl.textContent = '(texte non disponible)';
    }
  }

  var sec = document.getElementById('sraw-prt-section');
  if (sec) {
    if (!q.prtNames || !q.prtNames.length) {
      sec.innerHTML = '<p class="sraw-warn">⚠️ Aucun PRT trouvé dans cette question.</p>';
    } else {
      var h = '<div class="sraw-section-label">Arbres de réponse (PRT)</div><div class="sraw-prt-buttons">';
      q.prtNames.forEach(function(p) {
        h += '<button class="sraw-prt-btn" onclick="stackRawOpenPrt(' + qid + ',\'' + p + '\')">🌳 ' + p + '</button>';
      });
      h += '</div>';
      sec.innerHTML = h;
    }
  }
}

// ── OPEN PRT MANAGER FOR A SPECIFIC PRT ────────────────────────────
function stackRawOpenPrt(qid, prtName) {
  var q = questions[qid]; if (!q) return;
  q._editingPrt = prtName;
  q.prtXML = (q.prtXmls && q.prtXmls[prtName]) || '';
  closeConfigPanel();
  if (typeof openPrtManager === 'function') openPrtManager(qid);
}

// Called from savePrtManager to sync the edited PRT back into prtXmls
function _stackRawSyncPrt(qid, newPrtXml) {
  var q = questions[qid];
  if (!q || q.type !== 'stack-raw' || !q._editingPrt) return;
  if (!q.prtXmls) q.prtXmls = {};
  q.prtXmls[q._editingPrt] = newPrtXml;
}

// ── GENERATE (called by saveConfig) ────────────────────────────────
function genStackRaw(qid) {
  var q = questions[qid];
  if (!q) return Promise.resolve({ xml: '', bareme: 0 });
  var nameEl = document.getElementById('sraw-name');
  if (nameEl) q.name = nameEl.value.trim() || q.name;
  // Update chip label
  var chip = document.querySelector('.q-chip[data-qid="' + qid + '"]');
  if (chip) {
    var lbl = chip.querySelector('.chip-label');
    if (lbl) lbl.textContent = 'Q' + qid + ' · ' + q.name;
    chip.title = q.name;
  }
  return Promise.resolve({ xml: '', inputXML: '', feedbackRef: '', bareme: 0 });
}

// ── DOWNLOAD MODIFIED XML ─────────────────────────────────────────
function stackRawDownload(qid) {
  var q = questions[qid]; if (!q) return;
  var xml = q.rawXml || '';
  if (!xml) { toast('⚠️ Aucun XML source — question non importée ?'); return; }

  // Replace each modified PRT block in the original XML
  if (q.prtXmls) {
    Object.keys(q.prtXmls).forEach(function(prtName) {
      var newBlock = q.prtXmls[prtName];
      if (newBlock) xml = _replacePrtBlock(xml, prtName, newBlock);
    });
  }

  var fname = (q.name || 'question').replace(/[^a-zA-Z0-9_\-]/g, '_') + '_modifie.xml';
  var blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = fname;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✅ ' + fname + ' téléchargé.');
}

// Replace a <prt>...</prt> block matching prtName with newBlock
function _replacePrtBlock(xmlText, prtName, newBlock) {
  var pos = 0;
  while (true) {
    var s = xmlText.indexOf('<prt>', pos);
    if (s < 0) break;
    var e = xmlText.indexOf('</prt>', s);
    if (e < 0) break;
    var block = xmlText.substring(s, e + 6);
    var nm = block.match(/<name>\s*(?:<!\[CDATA\[)?\s*([^\]<\n]*?)\s*(?:\]\]>)?\s*<\/name>/);
    if (nm && nm[1].trim() === prtName) {
      return xmlText.substring(0, s) + newBlock + xmlText.substring(e + 6);
    }
    pos = e + 6;
  }
  return xmlText;
}
