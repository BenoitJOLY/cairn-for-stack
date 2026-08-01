// editor.js — V4 contentEditable editor with chip insertion and serialisation

// ── Helpers ciblant #v4-editor (équivalent de execR / richEditor en V3) ────
function v4ExecR(cmd, val) {
  document.getElementById('v4-editor').focus();
  document.execCommand(cmd, false, val || null);
}

function v4OpenLatex() {
  _verifZoneActive = document.getElementById('v4-editor');
  openLatexModal();
}

function v4OpenLink() {
  _verifZoneActive = document.getElementById('v4-editor');
  openLinkModal();
}

function v4InsertVideo() {
  _verifZoneActive = document.getElementById('v4-editor');
  insertRichVideo();
}

function v4OpenJsxGraph() {
  _verifZoneActive = document.getElementById('v4-editor');
  openJsxGraphModal();
}

function v4OpenGeo2d() {
  _verifZoneActive = document.getElementById('v4-editor');
  openGeo2dModal();
}

function v4OpenGeo3d() {
  _verifZoneActive = document.getElementById('v4-editor');
  openGeo3dModal();
}

function v4ToggleTable() {
  var d = document.getElementById('v4-table-dialog');
  if (d) d.style.display = (d.style.display === 'flex') ? 'none' : 'flex';
}

function v4InsertTable() {
  var rows = parseInt(document.getElementById('v4-tbl-rows').value) || 3;
  var cols = parseInt(document.getElementById('v4-tbl-cols').value) || 3;
  var hdr = document.getElementById('v4-tbl-header').checked;
  var h = '<table style="border-collapse:collapse;width:100%;margin:10px 0;">';
  if (hdr) {
    h += '<tr>';
    for (var c = 0; c < cols; c++) h += '<th style="border:1px solid #cbd5e1;padding:6px 10px;background:#f1f5f9;">En-tête ' + (c + 1) + '</th>';
    h += '</tr>';
  }
  for (var r = hdr ? 1 : 0; r < rows; r++) {
    h += '<tr>';
    for (var c2 = 0; c2 < cols; c2++) h += '<td style="border:1px solid #cbd5e1;padding:6px 10px;">&nbsp;</td>';
    h += '</tr>';
  }
  h += '</table><br>';
  var tgt = document.getElementById('v4-editor');
  _verifZoneActive = tgt;
  restoreRichSelection(tgt);
  document.execCommand('insertHTML', false, h);
  _verifZoneActive = null;
  document.getElementById('v4-table-dialog').style.display = 'none';
}

// Image dans #v4-editor
var _v4CurrentImg = null;
function v4HandleImage(input) {
  _verifZoneActive = document.getElementById('v4-editor');
  handleRichImage(input); // de rich.js — utilise _verifZoneActive
}
function v4HandleAudio(input) {
  _verifZoneActive = document.getElementById('v4-editor');
  handleRichAudio(input); // de rich.js
}
function v4SelectImg(img) {
  if (_v4CurrentImg) _v4CurrentImg.classList.remove('selected');
  _v4CurrentImg = img;
  img.classList.add('selected');
  document.getElementById('v4-img-w').value = parseInt(img.style.width) || img.naturalWidth || 400;
  document.getElementById('v4-img-h').value = (img.style.height && img.style.height !== 'auto') ? parseInt(img.style.height) : '';
  document.getElementById('v4-img-alt').value = img.alt || '';
  document.getElementById('v4-img-props').style.display = 'flex';
}
function v4DeselectImg() {
  if (_v4CurrentImg) _v4CurrentImg.classList.remove('selected');
  _v4CurrentImg = null;
  var p = document.getElementById('v4-img-props');
  if (p) p.style.display = 'none';
}
function v4ApplyImgProps() {
  if (!_v4CurrentImg) return;
  var w = parseInt(document.getElementById('v4-img-w').value);
  if (!w || w > 800) w = 800;
  _v4CurrentImg.style.width = w + 'px';
  _v4CurrentImg.style.maxWidth = '800px';
  var hVal = document.getElementById('v4-img-h').value;
  _v4CurrentImg.style.height = hVal ? parseInt(hVal) + 'px' : 'auto';
  _v4CurrentImg.alt = document.getElementById('v4-img-alt').value;
}
function v4RemoveSelectedImg() {
  if (_v4CurrentImg) { _v4CurrentImg.remove(); v4DeselectImg(); }
}

const TYPE_ICON_MAP = {
  checkbox:'checkbox', radio:'radio', dropdown:'dropdown',
  algebraic:'algebraic', numerical:'numeric', units:'units',
  string:'string', match:'match', crossword:'crossword', doi:'doi',
  chemical:'chemistry', chemical_topo:'chemical_topo', nuclear:'nuclear',
  composition:'composition', jxgdrop:'jxgdrop', vf:'vf', ord:'ord',
  imgclick:'imgclick', rvbcmj:'rvbcmj', optique:'optique', 'acide-base':'acide-base', 'redox':'redox', 'basen':'basen', 'circuit':'circuit', 'logique':'logique', 'complexe':'complexe', 'calcul':'calcul', 'statistiques':'statistiques', 'matrices':'matrices', 'geometrie':'geometrie', 'suites':'suites', 'probabilites':'probabilites', 'trigonometrie':'trigonometrie', 'polynomes':'polynomes', 'limites':'limites', 'physique':'physique', 'oscilloscope':'oscilloscope', 'inequation':'inequation', 'diffraction':'diffraction', 'image-mesure':'image-mesure', 'equivalence':'equivalence',
  'stack-raw':'stack-import',
  'expert':'expert',
  'geogebra':'geogebra',
  'nomenclature':'chemistry'
};

function initEditor() {
  var editor = document.getElementById('v4-editor');
  if (!editor) return;

  editor.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = (e.dataTransfer.effectAllowed === 'move') ? 'move' : 'copy';
    editor.classList.add('drag-over');
  });

  editor.addEventListener('dragleave', function(e) {
    if (!editor.contains(e.relatedTarget)) {
      editor.classList.remove('drag-over');
    }
  });

  editor.addEventListener('drop', function(e) {
    e.preventDefault();
    editor.classList.remove('drag-over');
    var data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    if (data.indexOf('chip:') === 0) {
      // Déplacement d'un chip existant
      var qid = parseInt(data.slice(5));
      moveChipToPoint(e.clientX, e.clientY, qid);
    } else {
      // Insertion depuis la palette
      insertChipAtPoint(e.clientX, e.clientY, data);
    }
  });

  editor.addEventListener('click', function(e) {
    var chip = e.target.closest('.q-chip');
    if (chip) {
      e.preventDefault();
      openConfigPanel(parseInt(chip.dataset.qid), chip.dataset.type);
      return;
    }
    // Image click → panneau propriétés V4
    if (e.target.tagName === 'IMG') {
      v4SelectImg(e.target);
    } else {
      v4DeselectImg();
    }
  });

  editor.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Keep default list behaviour; only override when not in a list
      var sel = window.getSelection();
      var node = sel.anchorNode;
      var el = node ? (node.nodeType === Node.TEXT_NODE ? node.parentElement : node) : null;
      var inList = el && el.closest('ul,ol,li');
      if (!inList) {
        e.preventDefault();
        document.execCommand('insertLineBreak');
      }
    }
  });
}

function createChipEl(qid, type) {
  var chip = document.createElement('span');
  chip.contentEditable = 'false';
  chip.className = 'q-chip';
  chip.dataset.qid = String(qid);
  chip.dataset.type = type;
  chip.setAttribute('role', 'button');
  chip.setAttribute('tabindex', '0');
  chip.setAttribute('aria-label', 'Question ' + qid + ' · ' + dataLabel(type) + '. Cliquer pour configurer.');
  chip.style.background = (COLORS[type] || '#64748b') + '22';
  chip.style.borderColor = COLORS[type] || '#64748b';

  var ico = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ico.setAttribute('class', 'hs-ico chip-ico');
  ico.setAttribute('aria-hidden', 'true');
  var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#ico-type-' + (TYPE_ICON_MAP[type] || type));
  ico.appendChild(use);

  var lbl = document.createElement('span');
  lbl.className = 'chip-label';
  lbl.textContent = 'Q' + qid + ' · ' + dataLabel(type).replace(/^[^\s]+\s/, '');

  var sta = document.createElement('span');
  sta.className = 'chip-status';
  sta.setAttribute('aria-label', 'Non configuré');
  sta.textContent = '⚙';

  chip.appendChild(ico);
  chip.appendChild(lbl);
  chip.appendChild(sta);

  attachChipHandlers(chip);
  return chip;
}

function attachChipHandlers(chip) {
  chip.setAttribute('draggable', 'true');

  chip.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openConfigPanel(parseInt(chip.dataset.qid), chip.dataset.type);
    }
  });
  chip.addEventListener('dragstart', function(e) {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', 'chip:' + chip.dataset.qid);
    e.dataTransfer.effectAllowed = 'move';
    chip.classList.add('chip-dragging');
  });
  chip.addEventListener('dragend', function() {
    chip.classList.remove('chip-dragging');
  });
}

// STACK ne permet pas de mélanger, dans une même question, un input à
// correction manuelle (Composition Libre, manualgraded:true — voir gen-composition.js)
// et un input à correction automatique. On bloque donc toute insertion qui
// créerait ce mélange, dans les deux sens.
function canInsertChipType(type) {
  var existingTypes = getChipsInOrder().map(function(c) { return c.dataset.type; });
  var mixesComposition = type === 'composition'
    ? existingTypes.length > 0
    : existingTypes.indexOf('composition') !== -1;
  if (mixesComposition) {
    toast(I18N.t('msg.err_composition_exclusive'));
    return false;
  }
  return true;
}

function insertChipAtPoint(x, y, type) {
  if (!canInsertChipType(type)) return;
  var qid = nextQid++;
  var chip = createChipEl(qid, type);
  var editor = document.getElementById('v4-editor');

  var range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    var cpos = document.caretPositionFromPoint(x, y);
    if (cpos) { range = document.createRange(); range.setStart(cpos.offsetNode, cpos.offset); }
  }

  // Si le range atterrit dans un chip existant, sortir du chip
  if (range) {
    var node = range.startContainer;
    var el = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
    var parentChip = el ? el.closest('.q-chip') : null;
    if (parentChip) {
      range = document.createRange();
      range.setStartAfter(parentChip);
      range.collapse(true);
    }
  }

  // Insérer directement (pas de remove préalable contrairement à moveChipToPoint)
  if (range && editor.contains(range.startContainer)) {
    range.collapse(true);
    range.insertNode(chip);
  } else {
    editor.appendChild(chip);
  }

  // Placer le curseur juste après le chip, puis execCommand insère le saut de ligne
  // dans une position que le navigateur sait rendre éditable.
  var sel = window.getSelection();
  var afterChip = document.createRange();
  afterChip.setStartAfter(chip);
  afterChip.collapse(true);
  sel.removeAllRanges();
  sel.addRange(afterChip);
  editor.focus();
  document.execCommand('insertLineBreak');

  renumberChips();
  openConfigPanel(parseInt(chip.dataset.qid), type);
}

// Déplace un chip existant vers la position pointée (x, y).
// Stratégie : on place un nœud marqueur AVANT de retirer le chip, pour que la
// position cible survive au reflow causé par la suppression du chip.
function moveChipToPoint(x, y, qid) {
  var chip = document.querySelector('.q-chip[data-qid="' + qid + '"]');
  var editor = document.getElementById('v4-editor');
  if (!chip || !editor) return;

  // 1. Calculer le range cible pendant que le chip est encore dans le DOM
  var range = null;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    var cpos = document.caretPositionFromPoint(x, y);
    if (cpos) { range = document.createRange(); range.setStart(cpos.offsetNode, cpos.offset); }
  }

  // Si le range atterrit dans le chip lui-même, déplacer après
  if (range) {
    var el = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer : range.startContainer.parentElement;
    if (el && el.closest('.q-chip[data-qid="' + qid + '"]')) {
      range = document.createRange();
      range.setStartAfter(chip);
      range.collapse(true);
    }
  }

  if (!range || !editor.contains(range.startContainer)) {
    editor.appendChild(chip);
    return;
  }

  // 2. Planter un marqueur à la position cible (avant tout déplacement)
  var marker = document.createTextNode('');
  range.collapse(true);
  range.insertNode(marker);

  // 3. Retirer le chip de son ancienne position
  chip.remove();

  // 4. Insérer le chip juste avant le marqueur, puis supprimer le marqueur
  marker.parentNode.insertBefore(chip, marker);
  marker.remove();

  // 5. Placer le curseur après le chip
  var sel = window.getSelection();
  var after = document.createRange();
  after.setStartAfter(chip);
  after.collapse(true);
  sel.removeAllRanges();
  sel.addRange(after);
}


function updateChipStatus(qid, ok) {
  var chip = document.querySelector('.q-chip[data-qid="' + qid + '"]');
  if (!chip) return;
  var sta = chip.querySelector('.chip-status');
  if (ok) {
    sta.textContent = '✓';
    sta.setAttribute('aria-label', 'Configuré');
    chip.classList.add('chip-ok');
  } else {
    sta.textContent = '⚙';
    sta.setAttribute('aria-label', 'Non configuré');
    chip.classList.remove('chip-ok');
  }
}

function removeChip(qid) {
  var chip = document.querySelector('.q-chip[data-qid="' + qid + '"]');
  if (chip) chip.remove();
  delete questions[qid];
  renumberChips();
}

// Renumbers all chips in DOM order (1, 2, 3…) and migrates questions[] keys accordingly.
// Also patches ansN/prtN/taN references in already-generated XML fragments.
function renumberChips() {
  var chips = Array.from(document.querySelectorAll('#v4-editor .q-chip'));
  var newQuestions = {};

  chips.forEach(function(chip, index) {
    var newQid = index + 1;
    var oldQid = parseInt(chip.dataset.qid);

    if (questions[oldQid]) {
      var q = Object.assign({}, questions[oldQid]);
      if (oldQid !== newQid) {
        q.id = newQid;
        /* ren : patterns ciblés pour HTML/texte (préserve l'énoncé utilisateur) */
        var ren = function(s) {
          if (!s) return s;
          return s
            .replace(new RegExp('\\bans' + oldQid + '(?!\\d)', 'g'), 'ans' + newQid)
            .replace(new RegExp('\\bprt' + oldQid + '(?!\\d)', 'g'), 'prt' + newQid)
            .replace(new RegExp('\\bta' + oldQid + '(?!\\d)', 'g'), 'ta' + newQid)
            // qN_xxx : variables Maxima interpolées dans l'énoncé via {@qN_xxx@} (générateurs math)
            .replace(new RegExp('\\bq' + oldQid + '_(\\w+)', 'g'), 'q' + newQid + '_$1');
        };
        /* renCode : regex générique pour le code Maxima — tout identifiant finissant par le numéro */
        var renCode = function(s) {
          if (!s) return s;
          return s.replace(new RegExp('([a-zA-Z_])' + oldQid + '(?!\\d)', 'g'), '$1' + newQid);
        };
        /* renGgb : identifiants GeoGebra (ggbApp_X, ggbXoN, ggbX_sync…) — renCode est trop
           générique et confond le suffixe qid avec l'index de sortie intégré dans "ggbXoN"
           (ex: "ggb2o1" → "ggb1o1" au lieu de "ggb1o1" attendu), désynchronisant le nom
           d'input STACK (jamais renommé par ren, qui ignore ce schéma) et sa référence dans
           le PRT (renommée à tort par renCode). On applique donc un renommage ciblé et
           identique sur textFrag/inputXML ET prtXML/vars/qnote/feedbackRef/generalFeedback. */
        var renGgb = function(s) {
          if (!s) return s;
          return s
            .replace(new RegExp('ggbApp_' + oldQid + '\\b', 'g'), 'ggbApp_' + newQid)
            .replace(new RegExp('ggbApplet_' + oldQid + '\\b', 'g'), 'ggbApplet_' + newQid)
            .replace(new RegExp('\\bggb' + oldQid + '_(sync|start)\\b', 'g'), 'ggb' + newQid + '_$1')
            .replace(new RegExp('\\bggb' + oldQid + 'o(\\d+)\\b', 'g'), 'ggb' + newQid + 'o$1')
            .replace(new RegExp('\\bggb_ok_' + oldQid + '\\b', 'g'), 'ggb_ok_' + newQid)
            .replace(new RegExp('\\bggb_n_ok_' + oldQid + '\\b', 'g'), 'ggb_n_ok_' + newQid)
            .replace(new RegExp('\\bggb_sc_' + oldQid + '\\b', 'g'), 'ggb_sc_' + newQid)
            .replace(new RegExp('\\bggb_pct_' + oldQid + '\\b', 'g'), 'ggb_pct_' + newQid)
            .replace(new RegExp('\\bprt' + oldQid + '\\b', 'g'), 'prt' + newQid)
            .replace(new RegExp('\\bPRT' + oldQid + '-', 'g'), 'PRT' + newQid + '-')
            .replace(new RegExp('GeoGebra Q' + oldQid + '\\b', 'g'), 'GeoGebra Q' + newQid);
        };
        var isGgb = q.type === 'geogebra';
        q.textFrag = isGgb ? renGgb(ren(q.textFrag)) : ren(q.textFrag);      // contient l'énoncé : regex ciblé seulement
        q.inputXML = isGgb ? renGgb(ren(q.inputXML)) : ren(q.inputXML);
        q.prtXML = isGgb ? renGgb(q.prtXML) : renCode(q.prtXML);      // Maxima : feedbackvariables, sans, tans, feedback
        q.vars = isGgb ? renGgb(q.vars) : renCode(q.vars);           // Maxima : variables question
        q.qnote = isGgb ? renGgb(q.qnote) : renCode(q.qnote);
        q.feedbackRef = isGgb ? renGgb(q.feedbackRef) : renCode(q.feedbackRef);
        q.generalFeedback = isGgb ? renGgb(q.generalFeedback) : renCode(q.generalFeedback);
        // Types migrés JSON (ex: Base N) : q.prt doit suivre le même renommage que
        // q.prtXML, sinon il redevient une source de vérité périmée après renumérotation.
        if (q.prt) {
          var renPrt = isGgb ? renGgb : renCode;
          q.prt = {
            meta: Object.assign({}, q.prt.meta, { name: renPrt(q.prt.meta.name) }),
            nodes: q.prt.nodes.map(function(n) {
              return Object.assign({}, n, {
                sans: renPrt(n.sans), tans: renPrt(n.tans),
                trueanswernote: renPrt(n.trueanswernote), falseanswernote: renPrt(n.falseanswernote),
                truefeedback: renPrt(n.truefeedback), falsefeedback: renPrt(n.falsefeedback)
              });
            })
          };
        }
      }
      newQuestions[newQid] = q;
    }

    if (oldQid !== newQid) {
      chip.dataset.qid = String(newQid);
      var lbl = chip.querySelector('.chip-label');
      if (lbl) {
        var txt = lbl.textContent;
        var dot = txt.indexOf(' · ');
        lbl.textContent = 'Q' + newQid + (dot >= 0 ? txt.slice(dot) : ' · ' + chip.dataset.type);
      }
      var aria = chip.getAttribute('aria-label') || '';
      chip.setAttribute('aria-label', aria.replace(/^Question \d+/, 'Question ' + newQid));
    }
  });

  questions = newQuestions;
  nextQid = chips.length + 1;
}

// Returns editor HTML with chips replaced by their generator textFrag (or STACK placeholder)
function buildQuestionText() {
  var clone = document.getElementById('v4-editor').cloneNode(true);
  clone.querySelectorAll('.q-chip').forEach(function(chip) {
    var qid = parseInt(chip.dataset.qid);
    var q = questions[qid];
    if (q && q.textFrag) {
      var tpl = document.createElement('template');
      tpl.innerHTML = q.textFrag;
      chip.replaceWith(tpl.content);
    } else {
      chip.replaceWith(document.createTextNode('[[input:ans' + qid + ']] [[validation:ans' + qid + ']]'));
    }
  });
  // Le contenu libre de #v4-editor (hors chips) peut contenir un bloc JSXGraph
  // inséré tel quel (wrapper <div class="jxg-inserted-wrap">...<script type="text/plain">),
  // le même traitement que spansToLatex() (rich.js) doit donc s'appliquer ici.
  return _jxgUnwrapBlocks(clone.innerHTML);
}

// Returns chips in visual (DOM) order
function getChipsInOrder() {
  return Array.from(document.querySelectorAll('#v4-editor .q-chip'));
}

// Returns questions[] ordered by their chip position in the editor
function getQuestionsInDOMOrder() {
  return getChipsInOrder()
    .map(function(chip) { return questions[parseInt(chip.dataset.qid)]; })
    .filter(Boolean);
}

// Persist editor content in localStorage
function saveEditorState() {
  try {
    var html = document.getElementById('v4-editor').innerHTML;
    localStorage.setItem('v4_editor_html', html);
    localStorage.setItem('v4_questions', JSON.stringify(questions));
    localStorage.setItem('v4_nextQid', String(nextQid));
  } catch(e) {}
}

function loadEditorState() {
  try {
    var html = localStorage.getItem('v4_editor_html');
    var qs = localStorage.getItem('v4_questions');
    var nq = localStorage.getItem('v4_nextQid');
    var editor = document.getElementById('v4-editor');
    if (html && editor) {
      editor.innerHTML = html;
      // Re-attach all chip event handlers after restoring HTML
      editor.querySelectorAll('.q-chip').forEach(function(chip) {
        attachChipHandlers(chip);
      });
    }
    if (qs) {
      var parsed = JSON.parse(qs);
      // Merge into questions object
      Object.assign(questions, parsed);
      if (typeof migrateAllPrtFeedbackStyle === 'function') migrateAllPrtFeedbackStyle(questions);
    }
    if (nq) nextQid = parseInt(nq) || 1;
  } catch(e) {}
}

function clearEditorState() {
  try {
    localStorage.removeItem('v4_editor_html');
    localStorage.removeItem('v4_questions');
    localStorage.removeItem('v4_nextQid');
  } catch(e) {}
  document.getElementById('v4-editor').innerHTML = '';
  questions = {};
  nextQid = 1;
}

