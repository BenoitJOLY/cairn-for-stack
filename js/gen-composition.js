// ── GÉNÉRATEUR : COMPOSITION LIBRE (Éditeur riche + LaTeX) ──────────────────
// Ce module génère une question STACK avec un éditeur rich-text JSXGraph
// permettant à l'élève de rédiger une réponse libre avec formules LaTeX.
// ans1 (notes, manualgraded:1) = contenu HTML de l'éditeur — correction manuelle
// STACK officielle (cf. docs.stack-assessment.org/en/Moodle/Semi-automatic_Marking).
// Le PRT généré est inerte (jamais évalué par STACK une fois manualgraded posé) ;
// il n'existe que pour donner une cible à [[feedback:prt]] et pour le panneau de
// test interne (js/verif.js). Contrainte STACK : ce type de question ne peut pas
// être combiné avec un autre type dans le même exercice (voir garde-fous dans
// editor.js/palette.js/app.js).
// Le collage (paste/drop) dans l'éditeur élève est bloqué ; chaque tentative
// est signalée par un bandeau inséré dans ans1_html, donc visible du correcteur.

// ════════════════════════════════════════════════════════
//  RENDU HTML DU PANNEAU DE CONFIGURATION
// ════════════════════════════════════════════════════════

function renderComposition() {
  return `
  <div class="form-panel" id="fp-composition" style="display:block;">

    <div class="form-panel-head" style="background:#6d28d9;">
      ✏️ Composition Libre
    </div>

    <!-- Barème -->
    <div class="bareme-row">
      📊 Sur combien de points :
      <input type="number" id="comp-bareme" value="4" min="0.25" step="0.25"> pt
      <span style="font-size:.78rem;color:#92400e;margin-left:6px;">(note attribuée par le professeur)</span>
    </div>

    <div class="form-panel-body">

      <!-- Bandeau d'avertissement bien visible -->
      <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:10px;padding:14px 18px;margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
        <span style="font-size:1.6rem;flex-shrink:0;">👨‍🏫</span>
        <div>
          <strong style="color:#92400e;font-size:.95rem;">Correction manuelle STACK (semi-automatic marking)</strong>
          <p style="margin:5px 0 0 0;font-size:.82rem;color:#78350f;line-height:1.5;">
            Ce type de question laisse l'élève rédiger librement une réponse (texte, formules LaTeX, mise en forme) via l'input STACK <code>notes</code> configuré en <code>manualgraded:1</code>.
            <strong>Elle ne peut pas être évaluée par STACK</strong> : la tentative apparaît dans Moodle sous <em>Quiz → Résultats → « Nécessite une correction »</em>, et c'est le professeur qui attribue la note à cet endroit.
            Le barème indiqué ci-dessus fixe la note maximale (<code>defaultgrade</code>) de la question.
          </p>
        </div>
      </div>

      <!-- Bandeau contrainte d'exclusivité -->
      <div style="background:#fee2e2;border:2px solid #dc2626;border-radius:10px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px;">
        <span style="font-size:1.4rem;flex-shrink:0;">⚠️</span>
        <div>
          <strong style="color:#991b1b;font-size:.9rem;">Doit être seule dans l'exercice</strong>
          <p style="margin:5px 0 0 0;font-size:.8rem;color:#7f1d1d;line-height:1.5;">
            STACK ne permet pas de mélanger, dans une même question, un input à correction manuelle et un input à correction automatique.
            Cette Composition Libre ne peut donc pas être combinée avec un autre type de question dans le même exercice : StackForge bloque l'ajout d'une autre question si une Composition Libre est présente (et inversement).
          </p>
        </div>
      </div>

      <!-- Bandeau anti copier-coller -->
      <div style="background:#eff6ff;border:2px solid #2563eb;border-radius:10px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:flex-start;gap:12px;">
        <span style="font-size:1.4rem;flex-shrink:0;">🚫</span>
        <div>
          <strong style="color:#1e3a8a;font-size:.9rem;">Copier-coller bloqué et signalé</strong>
          <p style="margin:5px 0 0 0;font-size:.8rem;color:#1e3a8a;line-height:1.5;">
            Dans l'éditeur de réponse de l'élève, le collage (Ctrl+V, menu contextuel ou glisser-déposer de texte) est intercepté et n'insère rien.
            Chaque tentative bloquée fait apparaître un bandeau rouge <em>dans la réponse elle-même</em> avec un compteur — il est donc enregistré avec la copie et visible par le professeur au moment de la correction manuelle.
            Cela ne peut pas empêcher toute forme de triche (ex. recopie manuelle depuis une autre source), mais dissuade et trace le copier-coller direct.
          </p>
        </div>
      </div>

      <!-- Énoncé — zone principale -->
      <div class="field">
        <label style="font-size:.8rem;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:.05em;">
          📋 Énoncé de la question <span style="color:#dc2626;">*</span>
          <button class="btn-rich" onclick="openRich('comp-text')" style="margin-left:8px;">✏️ Éditeur riche</button>
        </label>
        <div class="rich-preview" id="prev-comp-text"
             data-ph="Rédigez ici la question posée à l'élève... (images, formules LaTeX, tableaux possibles)"
             onclick="openRich('comp-text')"
             style="min-height:90px;border-color:#7c3aed;background:#faf5ff;"></div>
        <textarea id="comp-text" style="display:none"></textarea>
        <span class="hint">Utilisez l'éditeur riche pour insérer des images, du LaTeX, des tableaux dans l'énoncé.</span>
      </div>

      <!-- Options secondaires -->
      <div class="g2" style="margin-top:4px;">
        <div class="field">
          <label>Taille de l'éditeur élève</label>
          <select id="comp-height">
            <option value="400px">Petite — réponse courte (400px)</option>
            <option value="600px" selected>Normale — paragraphe (600px)</option>
            <option value="800px">Grande — développement (800px)</option>
            <option value="1000px">Très grande — rédaction longue (1000px)</option>
          </select>
        </div>
        <div class="field">
          <label>Message affiché à l'élève</label>
          <input type="text" id="comp-msg"
            value="Votre réponse sera lue et corrigée par votre professeur."
            style="font-size:.85rem;">
          <span class="hint">Ce message apparaît sous l'éditeur dans la question.</span>
        </div>
      </div>

    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════
//  CODE JSXGRAPH (Template — injecté dans le XML)
// ════════════════════════════════════════════════════════

function buildCompositionJSX(height) {
  // Ce code est injecté tel quel dans le CDATA du questiontext
  // Il doit être une string JS valide en contexte JSXGraph STACK
  return `[[jsxgraph width="100%" height="${height}" input-ref-ans1="refAns1"]]

// --- UTILITAIRE ---
function setRef(ref, value) {
  var el = document.getElementById(ref);
  if (el) { el.value = value; el.dispatchEvent(new Event('change')); }
}

// --- CONFIGURATION ---
var box = document.getElementById('jxgbox');
box.style.cssText = 'border:none; background:#f9f9f9; padding:15px; border-radius:8px; font-family:sans-serif; box-sizing:border-box; width:100%; overflow:hidden;';
box.innerHTML = '';

var txtLatex = document.createElement('textarea');
txtLatex.rows = 3;
txtLatex.style.cssText = 'width:100%; padding:8px; font-family:monospace; border:1px solid #ccc; border-radius:4px; box-sizing:border-box; font-size:1rem;';

// --- PANNEAUX ---
var paneMath  = document.createElement('div');
paneMath.style.cssText  = 'display:flex; flex-wrap:wrap; gap:5px; align-items:center; min-height:100px; width:100%;';
var panePhys  = document.createElement('div');
panePhys.style.cssText  = 'display:none; flex-wrap:wrap; gap:5px; align-items:center; min-height:100px; width:100%;';
var paneGreek = document.createElement('div');
paneGreek.style.cssText = 'display:none; flex-wrap:wrap; gap:3px; align-items:center; min-height:100px; width:100%;';

// --- BOUTONS SYMBOLES ---
function makeSymBtn(label, code, pane) {
  var b = document.createElement('button');
  b.style.cssText = 'padding:4px 8px; cursor:pointer; background:#fff; border:1px solid #ccc; border-radius:3px; font-size:0.85rem; width:50px; height:40px; flex-shrink:0; display:flex; align-items:center; justify-content:center; overflow:hidden; user-select:none;';
  b.onmouseover = function() { this.style.borderColor='#3498db'; this.style.background='#eaf2f8'; };
  b.onmouseout  = function() { this.style.borderColor='#ccc';    this.style.background='#fff'; };
  b.onclick = function() { insertAtCursor(code); txtLatex.focus(); updatePreview(); };
  var displayCode = code;
  if (code === '_{}')             displayCode = 'a_n';
  else if (code === '^{n}')       displayCode = 'x^n';
  else if (code === '\\\\widehat{...}') displayCode = '\\\\widehat{A}';
  else if (code === '\\ \\\\sqrt[a]{b} ') displayCode = '\\\\sqrt[a]{b}';
  var img = document.createElement('img');
  img.src = 'https://latex.codecogs.com/svg.image?' + encodeURIComponent(displayCode);
  img.style.cssText = 'max-width:100%; max-height:20px; display:block;';
  b.appendChild(img);
  pane.appendChild(b);
}

// Panneau Math
makeSymBtn('a/b', '\\\\frac{a}{b}', paneMath);
makeSymBtn('a.b', '\\\\cdot', paneMath);
makeSymBtn('a×b', '\\\\times', paneMath);
makeSymBtn('a^n', '^{n}', paneMath);
makeSymBtn('a_n', '_{}', paneMath);
makeSymBtn('√a', '\\\\sqrt{a}', paneMath);
makeSymBtn('b√a', '\\ \\\\sqrt[a]{b} ', paneMath);
var s1=document.createElement('div'); s1.style.cssText='width:100%;border-top:1px solid #eee;margin:5px 0;font-size:.8em;color:#aaa;'; s1.innerText=I18N.t('comp.section_operations'); paneMath.appendChild(s1);
makeSymBtn('≠', '\\\\neq', paneMath);
makeSymBtn('≤', '\\\\le', paneMath);
makeSymBtn('≥', '\\\\ge', paneMath);
makeSymBtn('∈', '\\\\in', paneMath);
makeSymBtn('∉', '\\\\notin', paneMath);
var s2=document.createElement('div'); s2.style.cssText='width:100%;border-top:1px solid #eee;margin:5px 0;font-size:.8em;color:#aaa;'; s2.innerText=I18N.t('comp.section_ensembles'); paneMath.appendChild(s2);
makeSymBtn('N','\\\\mathbb{N}',paneMath); makeSymBtn('Z','\\\\mathbb{Z}',paneMath); makeSymBtn('Q','\\\\mathbb{Q}',paneMath); makeSymBtn('R','\\\\mathbb{R}',paneMath); makeSymBtn('C','\\\\mathbb{C}',paneMath);
var s3=document.createElement('div'); s3.style.cssText='width:100%;border-top:1px solid #eee;margin:5px 0;font-size:.8em;color:#aaa;'; s3.innerText=I18N.t('comp.section_fonctions_vecteurs'); paneMath.appendChild(s3);
makeSymBtn('|a|','|a|',paneMath); makeSymBtn('n!','n!',paneMath); makeSymBtn('∑','\\\\sum a',paneMath); makeSymBtn('∑lim','\\\\sum_{n=1}^{10} n^2',paneMath); makeSymBtn('∫','\\\\int_{a}^{b} x dx',paneMath); makeSymBtn('a⃗','\\\\vec{a}',paneMath); makeSymBtn('ȧ','\\\\dot{a}',paneMath); makeSymBtn('ä','\\\\ddot{a}',paneMath); makeSymBtn('â','\\\\widehat{...}',paneMath); makeSymBtn('∞','\\\\infty',paneMath);

// Panneau Physique
makeSymBtn('ā','\\\\overline{ab}',panePhys); makeSymBtn('a⃗','\\\\overrightarrow{ab}',panePhys); makeSymBtn('→','\\\\rightarrow',panePhys); makeSymBtn('←','\\\\leftarrow',panePhys); makeSymBtn('⇄','\\\\rightleftharpoons',panePhys);
var s4=document.createElement('div'); s4.style.cssText='width:100%;border-top:1px solid #eee;margin:5px 0;font-size:.8em;color:#aaa;'; s4.innerText=I18N.t('comp.section_chimie_logique'); panePhys.appendChild(s4);
makeSymBtn('H₂SO₄','H_2SO_4',panePhys); makeSymBtn('²³⁸U','{}_{92}^{238}U',panePhys); makeSymBtn('SO₄²⁻','SO_4^{2-}',panePhys); makeSymBtn('∧','\\\\land',panePhys); makeSymBtn('a⃗','\\\\vec{a}',panePhys); makeSymBtn('ȧ','\\\\dot{a}',panePhys); makeSymBtn('ä','\\\\ddot{a}',panePhys);

// Panneau Grec
var gW1=document.createElement('div'); gW1.style.cssText='display:flex;flex-wrap:wrap;gap:2px;border-bottom:1px dashed #ccc;padding-bottom:5px;margin-bottom:5px;width:100%;';
var gW2=document.createElement('div'); gW2.style.cssText='display:flex;flex-wrap:wrap;gap:2px;width:100%;';
['α','β','γ','δ','ε','θ','λ','μ','π','ρ','σ','τ','φ','χ','ψ','ω'].forEach(function(c,i){
  var codes=['\\\\alpha','\\\\beta','\\\\gamma','\\\\delta','\\\\epsilon','\\\\theta','\\\\lambda','\\\\mu','\\\\pi','\\\\rho','\\\\sigma','\\\\tau','\\\\phi','\\\\chi','\\\\psi','\\\\omega'];
  makeSymBtn(c,codes[i],gW1);
});
['Γ','Δ','Θ','Λ','Π','Σ','Φ','Ψ','Ω'].forEach(function(c,i){
  var codes=['\\\\Gamma','\\\\Delta','\\\\Theta','\\\\Lambda','\\\\Pi','\\\\Sigma','\\\\Phi','\\\\Psi','\\\\Omega'];
  makeSymBtn(c,codes[i],gW2);
});
paneGreek.appendChild(gW1); paneGreek.appendChild(document.createElement('div')); paneGreek.appendChild(gW2);

// --- MODALE ---
var modal = document.createElement('div');
modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
var modalContent = document.createElement('div');
modalContent.style.cssText = 'background:white; padding:0; border-radius:8px; width:95%; max-width:600px; box-shadow:0 4px 15px rgba(0,0,0,0.2); max-height:90vh; display:flex; flex-direction:column; box-sizing:border-box;';
var mHead = document.createElement('h3');
mHead.innerText = I18N.t('comp.modal_title');
mHead.style.cssText = 'margin:0; padding:15px; border-bottom:1px solid #eee; background:#f9f9f9; font-size:1.1rem; color:#333; text-align:center;';
var mBody = document.createElement('div');
mBody.style.cssText = 'flex:1; overflow-y:auto; padding:10px; overflow-x:hidden; min-height:200px;';
var mFoot = document.createElement('div');
mFoot.style.cssText = 'padding:15px; background:#f9f9f9; border-top:1px solid #ccc; border-radius:0 0 8px 8px; display:flex; flex-direction:column; gap:10px;';

// Onglets
var tabBar = document.createElement('div');
tabBar.style.cssText = 'display:flex; border-bottom:1px solid #ccc; margin-bottom:10px;';
var tabPanes = { 'math': paneMath, 'physique': panePhys, 'grec': paneGreek };
var tabLabels = { 'math': I18N.t('comp.tab_math'), 'physique': I18N.t('comp.tab_physique'), 'grec': I18N.t('comp.tab_grec') };
['math','physique','grec'].forEach(function(name, i) {
  var tb = document.createElement('button');
  tb.innerText = tabLabels[name];
  tb.style.cssText = 'flex:1; padding:8px; cursor:pointer; font-weight:bold; outline:none; border:none; border-bottom:2px solid ' + (i===0?'#34495e':'transparent') + '; background:' + (i===0?'#34495e':'none') + '; color:' + (i===0?'white':'#666') + ';';
  tb.onclick = function() {
    tabBar.querySelectorAll('button').forEach(function(b){ b.style.background='none'; b.style.color='#666'; b.style.borderBottomColor='transparent'; });
    tb.style.background='#34495e'; tb.style.color='white'; tb.style.borderBottomColor='#34495e';
    Object.keys(tabPanes).forEach(function(k){ tabPanes[k].style.display='none'; });
    tabPanes[name].style.display='flex';
  };
  tabBar.appendChild(tb);
});
mBody.appendChild(tabBar);
mBody.appendChild(paneMath); mBody.appendChild(panePhys); mBody.appendChild(paneGreek);

// Prévisualisation
var prevDiv = document.createElement('div');
prevDiv.style.cssText = 'border:1px dashed #ccc; padding:5px; min-height:20px; text-align:center; background:#fafafa; overflow-x:auto;';
var prevImg = document.createElement('img');
prevImg.style.cssText = 'max-width:100%; max-height:30px;';
prevDiv.appendChild(prevImg);
prevDiv.appendChild(document.createTextNode(' ' + I18N.t('comp.previsualisation')));
mFoot.appendChild(prevDiv);
mFoot.appendChild(txtLatex);

// Boutons footer
var btnRow = document.createElement('div');
btnRow.style.cssText = 'display:flex; gap:10px;';
var btnCancel = document.createElement('button');
btnCancel.innerText = I18N.t('comp.annuler');
btnCancel.style.cssText = 'flex:1; padding:10px; cursor:pointer; background:#95a5a6; color:white; border:none; border-radius:4px; font-weight:bold;';
btnCancel.onclick = function() { modal.style.display='none'; };
var btnIns = document.createElement('button');
btnIns.innerText = I18N.t('comp.inserer_formule');
btnIns.style.cssText = 'flex:2; padding:10px; cursor:pointer; background:#27ae60; color:white; border:none; border-radius:4px; font-weight:bold;';
btnIns.onclick = function() {
  var txt = txtLatex.value;
  if (txt.trim() !== '') {
    var imgEl = document.createElement('img');
    imgEl.src = 'https://latex.codecogs.com/svg.image?' + encodeURIComponent('\\\\displaystyle ' + txt);
    imgEl.alt = txt;
    imgEl.style.cssText = 'vertical-align:middle; margin:0 3px; max-height:1.8em; max-width:100%;';
    editor.focus();
    var sel = window.getSelection();
    if (sel.rangeCount > 0) {
      var range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(imgEl);
      range.setStartAfter(imgEl);
      range.collapse(true);
      sel.removeAllRanges(); sel.addRange(range);
    }
    updateData();
  }
  modal.style.display = 'none';
};
btnRow.appendChild(btnCancel); btnRow.appendChild(btnIns);
mFoot.appendChild(btnRow);

modalContent.appendChild(mHead); modalContent.appendChild(mBody); modalContent.appendChild(mFoot);
modal.appendChild(modalContent);
box.appendChild(modal);

// --- BARRE D'OUTILS ---
var toolbar = document.createElement('div');
toolbar.style.cssText = 'display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap; align-items:center;';
function makeToolBtn(html, cmd, color) {
  var b = document.createElement('button');
  b.type = 'button'; b.innerHTML = html;
  b.style.cssText = 'padding:6px 12px; cursor:pointer; background:' + (color||'#34495e') + '; color:white; border:none; border-radius:4px; font-weight:bold; font-size:.9rem;';
  b.onclick = function() { editor.focus(); document.execCommand(cmd, false, null); updateData(); };
  return b;
}
toolbar.appendChild(makeToolBtn('<b>' + I18N.t('comp.gras') + '</b>', 'bold'));
toolbar.appendChild(makeToolBtn('<i>' + I18N.t('comp.italique') + '</i>', 'italic'));
toolbar.appendChild(makeToolBtn('<u>' + I18N.t('comp.souligne') + '</u>', 'underline'));
var btnMath = document.createElement('button');
btnMath.type = 'button'; btnMath.innerHTML = I18N.t('comp.formule_latex_btn');
btnMath.style.cssText = 'padding:6px 12px; cursor:pointer; background:#8e44ad; color:white; border:none; border-radius:4px; font-weight:bold; font-size:.9rem; margin-left:8px;';
btnMath.onclick = function() { modal.style.display='flex'; txtLatex.value=''; prevImg.src=''; txtLatex.focus(); updatePreview(); };
toolbar.appendChild(btnMath);

// --- ÉDITEUR ---
var editor = document.createElement('div');
editor.contentEditable = true;
editor.innerHTML = I18N.t('tpl.tapez_votre_reponse_ici');
editor.style.cssText = 'width:100%; min-height:300px; border:2px solid #34495e; padding:10px; background:white; border-radius:4px; outline:none; line-height:1.6; font-size:1.1rem; box-sizing:border-box; overflow-wrap:break-word;';
editor.addEventListener('focus', function() { if (editor.innerHTML === I18N.t('tpl.tapez_votre_reponse_ici')) editor.innerHTML = ''; }, {once:true});

box.appendChild(toolbar);
box.appendChild(editor);

// --- LOGIQUE ---
function insertAtCursor(text) {
  var s=txtLatex.selectionStart, e=txtLatex.selectionEnd, v=txtLatex.value;
  txtLatex.value = v.substring(0,s) + text + v.substring(e);
  var np = s + text.length;
  if (text==='\\\\frac{a}{b}') np=s+6;
  else if (text==='\\\\sqrt{a}') np=s+6;
  else if (text==='^{n}') np=s+2;
  else if (text==='_{}') np=s+2;
  txtLatex.selectionStart = txtLatex.selectionEnd = np;
}

function updatePreview() {
  var txt = txtLatex.value;
  if (txt.trim()==='') { prevImg.style.display='none'; return; }
  prevImg.style.display='inline-block';
  prevImg.src = 'https://latex.codecogs.com/svg.image?' + encodeURIComponent('\\\\displaystyle '+txt);
}
txtLatex.addEventListener('keyup', updatePreview);

function updateData() {
  var html = editor.innerHTML;
  setRef(refAns1, html);
}
editor.addEventListener('input', updateData);
editor.addEventListener('keyup', updateData);
editor.addEventListener('mouseup', updateData);

// --- ANTI COPIER-COLLER ---
// Le collage (clavier, menu contextuel ou glisser-déposer) est bloqué. Une
// tentative bloquée reste néanmoins tracée : un bandeau visible est inséré
// dans la réponse elle-même (donc sauvegardé dans ans1_html) afin que le
// correcteur voie, au moment de la correction manuelle, qu'un collage a été
// tenté — même si le contenu collé n'a pas été inséré.
var pasteAttempts = 0;
function flagPasteAttempt() {
  pasteAttempts++;
  var banner = document.getElementById('paste-warn-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'paste-warn-banner';
    banner.contentEditable = false;
    banner.style.cssText = 'background:#fee2e2;border:2px solid #dc2626;border-radius:6px;padding:8px 12px;margin-bottom:8px;color:#991b1b;font-size:.85rem;font-weight:700;';
    editor.insertBefore(banner, editor.firstChild);
  }
  banner.textContent = I18N.t('comp.paste_banner', {n: pasteAttempts});
  updateData();
}
editor.addEventListener('paste', function(e) { e.preventDefault(); flagPasteAttempt(); });
editor.addEventListener('drop', function(e) { e.preventDefault(); flagPasteAttempt(); });
editor.addEventListener('dragover', function(e) { e.preventDefault(); });

// Restauration si déjà saisi
var savedVal = document.getElementById(refAns1);
if (savedVal && savedVal.value && savedVal.value.trim()!=='') {
  editor.innerHTML = savedVal.value;
  updateData();
}

[[/jsxgraph]]`;
}

// ════════════════════════════════════════════════════════
//  GÉNÉRATEUR XML
// ════════════════════════════════════════════════════════

function genComposition(X) {
  var bareme = parseFloat(document.getElementById('comp-bareme').value) || 4;
  var text   = richVal('comp-text');
  var height = document.getElementById('comp-height').value || '600px';
  var msgEl  = document.getElementById('comp-msg');
  var msg    = msgEl ? msgEl.value.trim() : I18N.t('comp.default_msg');

  if (!text || !text.replace(/<[^>]+>/g, '').trim()) {
    throw new Error(I18N.t('msg.err_comp_enonce', {n: X}));
  }

  var jsxCode = buildCompositionJSX(height, X);
  var vars  = '/* Q' + X + ' : Composition libre (correction manuelle STACK — manualgraded) */';
  var qnote = 'Composition Q' + X;

  var msgHtml = msg
    ? '<p style="margin-top:10px;padding:10px 14px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;font-size:.9rem;color:#78350f;">👨\u200d🏫 ' + msg + '</p>'
    : '';

  // ── textFrag : XML Moodle — énoncé AU-DESSUS du JSXGraph ──
  var textFrag =
    '<!-- ENONCE-START --><div style="margin-bottom:14px;">' + text + '</div><!-- ENONCE-END -->\n' +
    jsxCode + '\n' +
    msgHtml + '\n' +
    '<div style="display:none;">\n' +
    '  [[input:ans' + X + '_html]] [[validation:ans' + X + '_html]]\n' +
    '</div>';

  // ── previewFrag : prévisualisation StackForge — Q{X} Rédaction + énoncé seul, sans JSXGraph ──
  var previewFrag =
    '<div style="background:#ede9fe;border-left:5px solid #6d28d9;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
      '<strong style="font-weight:800;color:#4c1d95;font-size:.95rem;">Q' + X + ' — Rédaction</strong>' +
      '<span style="background:#6d28d9;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>' +
      '<span style="background:#fef3c7;color:#92400e;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">👨‍🏫 Correction manuelle</span>' +
    '</div>' +
    '<div style="margin-bottom:10px;">' + text + '</div>' +
    '<div style="padding:10px 14px;background:#f5f3ff;border:1.5px dashed #a78bfa;border-radius:8px;font-size:.82rem;color:#5b21b6;text-align:center;">' +
      '📝 Éditeur de réponse élève (visible dans Moodle uniquement)' +
    '</div>';

  // Input XML — type "notes" en manualgraded:1 (cf. STACK "Semi-automatic Marking").
  // Poser manualgraded sur cet input suffit à basculer TOUTE la question en
  // correction manuelle Moodle ("Nécessite une correction") : le PRT ci-dessous
  // n'est alors jamais évalué par STACK (question.php::grade_response court-circuite
  // dès qu'un input manualgraded est détecté, avant toute évaluation de PRT).
  // On le garde volontairement — nœud "toujours vrai" indépendant de toute saisie —
  // uniquement pour (a) donner une cible valide à [[feedback:prt]] dans le XML et
  // (b) permettre au panneau de test interne de StackForge (js/verif.js) d'afficher
  // le bandeau « correction manuelle ». Il n'a aucun effet sur la note réelle.
  var inputXML =
    '    <input>\n' +
    '      <name>ans' + X + '_html</name>\n' +
    '      <type>notes</type>\n' +
    '      <tans></tans>\n' +
    '      <boxsize>2000</boxsize>\n' +
    '      <strictsyntax>1</strictsyntax>\n' +
    '      <insertstars>0</insertstars>\n' +
    '      <syntaxhint></syntaxhint>\n' +
    '      <syntaxattribute>0</syntaxattribute>\n' +
    '      <forbidwords></forbidwords>\n' +
    '      <allowwords></allowwords>\n' +
    '      <forbidfloat>1</forbidfloat>\n' +
    '      <requirelowestterms>0</requirelowestterms>\n' +
    '      <checkanswertype>0</checkanswertype>\n' +
    '      <mustverify>1</mustverify>\n' +
    '      <showvalidation>1</showvalidation>\n' +
    '      <options>manualgraded:1</options>\n' +
    '    </input>';

  var prtMeta = { name: 'prt' + X, value: String(bareme), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  var canonicalNodes = [{
    name: '0', description: 'Inerte — correction manuelle par le professeur (manualgraded)',
    answertest: 'AlgEquiv', sans: '1', tans: '1', testoptions: '', quiet: '0',
    truescoremode: '=', truescore: '1', truepenalty: '', truenextnode: '-1',
    trueanswernote: 'PRT-' + X + '-1-T',
    truefeedback: '<p style="padding:10px;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;color:#166534;">✅ ' + I18N.t('comp.fb_enregistre') + '</p>',
    falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
    falseanswernote: 'PRT-' + X + '-1-F', falsefeedback: ''
  }];
  var prtXML = buildPrtXml(prtMeta, canonicalNodes);

  return {
    bareme     : bareme,
    vars       : vars,
    qnote      : qnote,
    textFrag   : textFrag,
    previewFrag: previewFrag,
    inputXML   : inputXML,
    prtXML     : prtXML,
    generalFeedback: _mkFbGen('', v('comp-fbgen')),
    feedbackRef: '[[feedback:prt' + X + ']]',
    prt        : { meta: prtMeta, nodes: canonicalNodes }
  };
}

// ════════════════════════════════════════════════════════
//  CAPTURE / RESTORE (édition d'une question existante)
// ════════════════════════════════════════════════════════

function captureComposition() {
  return {
    bareme : v('comp-bareme'),
    text   : richVal('comp-text'),
    height : v('comp-height'),
    msg    : document.getElementById('comp-msg') ? document.getElementById('comp-msg').value : ''
  };
}

function restoreComposition(data) {
  if (!data) return;
  document.getElementById('comp-bareme').value = data.bareme || 4;
  setRichVal('comp-text', data.text || '');
  document.getElementById('comp-height').value = data.height || '600px';
  if (document.getElementById('comp-msg')) {
    document.getElementById('comp-msg').value = data.msg || I18N.t('comp.default_msg');
  }
}

function validateComposition() {
  var text = richVal('comp-text').replace(/<[^>]+>/g, '').trim();
  if (!text) {
    toast(I18N.t('msg.a_i_composition_l_anonca'));
    return false;
  }
  return true;
}

function initComposition() {
  // Rien à initialiser dynamiquement
}
