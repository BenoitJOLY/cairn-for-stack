// ── NUCLEAR REACTION GENERATOR (Réaction Nucléaire) ─────────────

// ══════════════════════════════════════════════════════
//  HÉSTACK FORM PANEL — INTERACTIONS ÉDITEUR
// ══════════════════════════════════════════════════════

function nucInsert(text) {
  const editor = document.getElementById('nuc-editor');
  if (!editor) return;
  editor.focus();
  // Insère au curseur si sélection disponible, sinon en fin
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    editor.innerText += text;
  }
  nucRenderPreview();
}

function nucClear() {
  const editor = document.getElementById('nuc-editor');
  if (editor) editor.innerText = '';
  const preview = document.getElementById('nuc-preview');
  if (preview) preview.innerHTML = '<span style="color:#94a3b8;font-style:italic;">Aperçu KaTeX...</span>';
}

function nucRenderPreview() {
  const editor = document.getElementById('nuc-editor');
  const preview = document.getElementById('nuc-preview');
  if (!editor || !preview) return;

  let raw = editor.innerText.trim();
  if (!raw) {
    preview.innerHTML = '<span style="color:#94a3b8;font-style:italic;">Aperçu KaTeX...</span>';
    return;
  }

  // Normalisation pour KaTeX
  let latex = raw
    .replace(/\\beta-/g, '\\beta^{-}')
    .replace(/\\beta\+/g, '\\beta^{+}')
    .replace(/\s*->\s*/g, ' \\rightarrow ');

  try {
    preview.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode: true });
  } catch(e) {
    preview.innerHTML = `<code style="font-size:.85rem;color:#64748b;">${latex.replace(/</g,'&lt;')}</code>`;
  }
}

// ══════════════════════════════════════════════════════
//  PARSING CÔTÉ HÉSTACK (pour générer ta3 / ta4)
// ══════════════════════════════════════════════════════

// Clés = ce que les boutons insèrent (espaces tailing strippés)
const NUC_SUBMAP = {
  'n':       [1,  0,  'n'],
  'p':       [1,  1,  'p'],
  '\\alpha': [4,  2,  'He'],
  '\\beta-': [0, -1,  'e'],
  '\\beta+': [0,  1,  'e'],
  'e^+':     [0,  1,  'e'],
  'e^-':     [0, -1,  'e'],
  '\\gamma': [0,  0,  '\\gamma'],
  '\\nu':    [0,  0,  '\\nu']
};

function nucSplitByPlus(str) {
  let parts = [], depth = 0, cur = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '+' && depth === 0) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.filter(p => p);
}

function nucParseTerm(term) {
  term = term.trim();
  if (!term) return null;

  let coeff = 1, rest = term;
  // Coeff avec espace : "3 n", "2 {}^{4}_{2}He"
  const coeffM = term.match(/^(\d+)\s+(.*)/s);
  if (coeffM) { coeff = parseInt(coeffM[1]); rest = coeffM[2].trim(); }
  // Coeff sans espace collé sur une clé NUC_SUBMAP : "3n", "2p"
  else {
    const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const [key] of Object.entries(NUC_SUBMAP)) {
      if (term === key) break;
      const re = new RegExp('^(\\d+)(' + escapeRe(key) + ')\\s*$');
      const m = term.match(re);
      if (m) { coeff = parseInt(m[1]); rest = m[2]; break; }
    }
  }

  const rn = rest.replace(/\s+$/, '');

  for (const [key, val] of Object.entries(NUC_SUBMAP)) {
    if (rn === key) return [coeff, val[0], val[1], val[2]];
  }

  // {}^{A}_{Z}Symbol ou {}^{A}_{Z}Symbol*
  const m1 = rn.match(/^\{\}\^?\{(\d+)\}_?\{?(-?\d+)\}?([A-Za-z]+\*?)/);
  if (m1) return [coeff, parseInt(m1[1]), parseInt(m1[2]), m1[3]];

  // ^{A}_{Z}Symbol sans {}
  const m2 = rn.match(/^\^?\{(\d+)\}_?\{(-?\d+)\}([A-Za-z]+\*?)/);
  if (m2) return [coeff, parseInt(m2[1]), parseInt(m2[2]), m2[3]];

  return [coeff, '?', '?', rn];
}

function nucParseEquation(rawText) {
  let text = rawText
    .replace(/\\rightarrow/g, ' -> ')
    .replace(/→/g, ' -> ')
    .trim();

  const idx = text.indexOf('->');
  if (idx < 0) return null;

  const parseSide = s => nucSplitByPlus(s).map(nucParseTerm).filter(Boolean);
  return {
    reactants: parseSide(text.substring(0, idx).trim()),
    products:  parseSide(text.substring(idx + 2).trim())
  };
}

function nucToMaximaList(particles) {
  if (!particles || !particles.length) return '[]';
  return '[' + particles.map(p => `[${p[0]},${p[1]},${p[2]},"${p[3]}"]`).join(',') + ']';
}

// ══════════════════════════════════════════════════════
//  LATEX (pour previewFrag et fb_general)
// ══════════════════════════════════════════════════════

function nucParticleToLatex(p) {
  const [c, a, z, s] = p;
  const cs = (c === 1) ? '' : String(c) + '\\ ';
  if (s === 'He' && a === 4 && z === 2)  return cs + '\\alpha';
  if (s === 'e'  && z === -1) return cs + '\\beta^{-}';
  if (s === 'e'  && z === 1)  return cs + '\\beta^{+}';
  if (s === '\\gamma') return cs + '\\gamma';
  if (s === '\\nu')    return cs + '\\nu';
  if (s === 'n')  return cs + 'n';
  if (s === 'p')  return cs + 'p';
  // Nucléide général : {}^{A}_{Z}X ou {}^{A}_{Z}X*
  const starred  = s.endsWith('*');
  const sym      = starred ? s.slice(0, -1) : s;
  const starTex  = starred ? '^{*}' : '';
  const base     = (c === 1) ? '' : String(c) + '\\ ';
  return base + `{}^{${a}}_{${z}}${sym}${starTex}`;
}

function nucEquationToLatex(reactants, products) {
  return reactants.map(nucParticleToLatex).join(' + ')
       + ' \\rightarrow '
       + products.map(nucParticleToLatex).join(' + ');
}

// ══════════════════════════════════════════════════════
//  JSXGRAPH CODE (interface élève dans Moodle)
// ══════════════════════════════════════════════════════
function buildNuclearJSXCode(X) {
  // Noms des refs STACK — correspondent aux input-ref-* du [[jsxgraph]]
  const refAns  = `refA${X}`;   // raw LaTeX
  const refSent = `refS${X}`;   // sentinel ("0" quand réponse saisie)
  const refRea  = `refR${X}`;   // réactifs parsés [[coeff,A,Z,"X"],...]
  const refPro  = `refP${X}`;   // produits parsés

  return `[[jsxgraph width="100%" height="600px" input-ref-ans${X}="${refAns}" input-ref-ans${X}s="${refSent}" input-ref-ans${X}r="${refRea}" input-ref-ans${X}p="${refPro}"]]

// --- 1. UTILITAIRE ---
function setRef(ref, value) {
  var el = document.getElementById(ref);
  if (el) { el.value = value; el.dispatchEvent(new Event('change')); }
}

// --- 2. CONFIGURATION ---
var box = document.getElementById('jxgbox');
box.style.cssText = 'border:none; background:#f9f9f9; padding:15px; border-radius:8px; font-family:sans-serif; box-sizing:border-box; width:100%; height:100%; overflow:hidden; display:flex; flex-direction:column; gap:10px; align-items:center;';
box.innerHTML = '';

// --- 3. FONCTIONS ---
function makeVisBtn(insertCode, displayCode, color, width) {
    var b = document.createElement('button');
    b.style.cssText = 'padding:4px 8px; cursor:pointer; background:#fff; border:2px solid ' + (color||'#ccc') + '; border-radius:4px; font-size:0.85rem; height:45px; display:flex; align-items:center; justify-content:center; overflow:hidden; user-select:none; flex-shrink:0;' + (width ? 'width:'+width+';' : '');
    b.onmouseover = function() { this.style.borderColor='#3498db'; this.style.background='#eaf2f8'; };
    b.onmouseout  = function() { this.style.borderColor=(color||'#ccc'); this.style.background='#fff'; };
    b.onclick = function() { editor.focus(); document.execCommand('insertText', false, insertCode); updateLivePreview(); saveAnswer(); };
    var img = document.createElement('img');
    img.src = 'https://latex.codecogs.com/svg.image?' + encodeURIComponent(displayCode || insertCode);
    img.style.cssText = 'max-width:100%; max-height:30px; display:block;';
    b.appendChild(img);
    return b;
}

// --- 4. INTERFACE PRINCIPALE ---
var toolbar = document.createElement('div');
toolbar.style.cssText = 'display:flex; gap:8px; margin:0; flex-wrap:wrap; align-items:center; background:#ecf0f1; padding:10px; border-radius:8px; border:1px solid #bdc3c7; flex-shrink:0; width:100%;';

toolbar.appendChild(makeVisBtn('{}^{A}_{Z}X', '{}^{A}_{Z}X', '#2980b9', '80px'));
toolbar.appendChild(makeVisBtn(' + ', '+', '#7f8c8d', '40px'));
toolbar.appendChild(makeVisBtn(' \\\\rightarrow ', '\\\\rightarrow', '#7f8c8d', '50px'));
toolbar.appendChild(makeVisBtn('*', '*', '#8e44ad', '40px'));
var sep1 = document.createElement('span'); sep1.style.cssText='border-left:1px solid #999; margin:0 5px; height:30px; display:inline-block;'; toolbar.appendChild(sep1);
toolbar.appendChild(makeVisBtn('\\\\alpha ', '\\\\alpha', '#c0392b', '40px'));
toolbar.appendChild(makeVisBtn('\\\\gamma ', '\\\\gamma', '#27ae60', '40px'));
var sep2 = document.createElement('span'); sep2.style.cssText='border-left:1px solid #999; margin:0 5px; height:30px; display:inline-block;'; toolbar.appendChild(sep2);
toolbar.appendChild(makeVisBtn('\\\\beta- ', '\\\\beta^{-}', '#e67e22', '50px'));
toolbar.appendChild(makeVisBtn('\\\\beta+ ', '\\\\beta^{+}', '#e67e22', '50px'));
var sep3 = document.createElement('span'); sep3.style.cssText='border-left:1px solid #999; margin:0 5px; height:30px; display:inline-block;'; toolbar.appendChild(sep3);
toolbar.appendChild(makeVisBtn('e^+ ', 'e^{+}', '#d35400', '50px'));
toolbar.appendChild(makeVisBtn('e^- ', 'e^{-}', '#8e44ad', '50px'));
toolbar.appendChild(makeVisBtn('n ', 'n', '#f39c12', '40px'));
toolbar.appendChild(makeVisBtn('p ', 'p', '#e74c3c', '40px'));
var sep4 = document.createElement('span'); sep4.style.cssText='border-left:1px solid #999; margin:0 5px; height:30px; display:inline-block;'; toolbar.appendChild(sep4);
toolbar.appendChild(makeVisBtn('\\\\nu ', '\\\\nu', '#7f8c8d', '50px'));
box.appendChild(toolbar);

var previewContainer = document.createElement('div');
previewContainer.style.cssText = 'background:white; border:1px solid #bdc3c7; border-radius:4px; padding:15px; height:80px; flex-shrink:0; text-align:center; font-size:1.5rem; color:#333; display:flex; align-items:center; justify-content:center; overflow:auto; width:100%;';
previewContainer.innerHTML = '<span style="color:#999; font-style:italic;">Aperçu de la réaction...</span>';
box.appendChild(previewContainer);

var editor = document.createElement('div');
editor.contentEditable = true;
editor.innerHTML = '';
editor.style.cssText = 'width:100%; height:100px; flex-shrink:0; box-sizing:border-box; border:2px solid #34495e; padding:15px; background:white; border-radius:8px; outline:none; font-family:"Times New Roman", Times, serif; font-size:1.4rem; line-height:1.5; color:#2c3e50; overflow-y:auto; overflow-wrap:break-word; text-align:center; display:flex; align-items:center;';
box.appendChild(editor);

// --- 5. LOGIQUE PRÉVISUALISATION ---
function getLatexString() {
    var latex = '';
    function traverse(node) {
        if (node.nodeType === 3) { latex += node.nodeValue; }
        else if (node.nodeType === 1) {
            if (node.tagName === 'IMG') { var alt = node.getAttribute('alt')||''; latex += alt.replace(/\\\\displaystyle/g,''); }
            else { for (var i=0;i<node.childNodes.length;i++) traverse(node.childNodes[i]); }
        }
    }
    traverse(editor);
    return latex.trim();
}

function updateLivePreview() {
    var str = getLatexString();
    if (str === '') { previewContainer.innerHTML = '<span style="color:#999; font-style:italic;">Aperçu...</span>'; return; }
    var img = document.createElement('img');
    img.src = 'https://latex.codecogs.com/svg.image?\\\\displaystyle ' + encodeURIComponent(str);
    img.style.maxWidth = '100%';
    previewContainer.innerHTML = '';
    previewContainer.appendChild(img);
}

// --- 6. LOGIQUE DE PARSING NUCLÉAIRE ---
var subMap = {
    'n': [1,0,'n'], 'p': [1,1,'p'],
    '\\\\alpha': [4,2,'He'], '\\\\beta-': [0,-1,'e'], '\\\\beta+': [0,1,'e'],
    'e^+': [0,1,'e'], 'e^-': [0,-1,'e'], '\\\\gamma': [0,0,'\\\\gamma']
};

function splitBySafePlus(str) {
    var results=[], current='', level=0;
    for (var i=0;i<str.length;i++) {
        var ch=str[i];
        if(ch==='{') level++; if(ch==='}') level--;
        if(ch==='+'&&level===0){results.push(current.trim());current='';}
        else current+=ch;
    }
    results.push(current.trim());
    return results.filter(function(s){return s!=='';});
}

function parseToMaximaList(sideString) {
    if(!sideString) return '[]';
    var cleanStr = sideString.replace(/\\\\displaystyle/g,'').trim();
    if(cleanStr==='') return '[]';
    var terms = splitBySafePlus(cleanStr);
    var maximaList = [];
    terms.forEach(function(term) {
        term = term.trim(); if(!term) return;
        var coeffMatch = term.match(/^(\\d*)\\s*(.*)/);
        var coeff = coeffMatch[1]==='' ? '1' : coeffMatch[1];
        var rest  = coeffMatch[2];
        var a_val, z_val, x_val;
        var key = rest.replace(/\\\\/g,'').replace(/\\s/g,'').toLowerCase();
        if(subMap[key]){var vv=subMap[key];a_val=vv[0];z_val=vv[1];x_val=vv[2];}
        else {
            var match = rest.match(/\\{?\\^\\{([^}]+)\\}_\\{([^}]+)\\}([a-zA-Z0-9\\*]+)/);
            if(!match) match = rest.match(/\\{?\\_\\{([^}]+)\\}\\^\\{([^}]+)\\}([a-zA-Z0-9\\*]+)/);
            if(match){a_val=match[1];z_val=match[2];x_val=match[3];}
            else{a_val='?';z_val='?';x_val=rest;}
        }
        maximaList.push('['+coeff+','+a_val+','+z_val+',"'+x_val+'"]');
    });
    return '['+maximaList.join(',')+']';
}

// --- 7. LOGIQUE DE SAUVEGARDE ---
function saveAnswer() {
    var rawLatex = getLatexString();
    setRef(${refAns}, rawLatex);
    if(rawLatex.trim()!==''){setRef(${refSent},'0');}else{setRef(${refSent},'');}
    var parts = rawLatex.split(/->|\\\\rightarrow|→/);
    var reactantsStr = parts[0] ? parts[0].trim() : '';
    var productsStr  = parts.length>1 ? parts.slice(1).join('->').trim() : '';
    setRef(${refRea}, parseToMaximaList(reactantsStr));
    setRef(${refPro}, parseToMaximaList(productsStr));
}

editor.addEventListener('input', function(){ updateLivePreview(); saveAnswer(); });
editor.addEventListener('keyup', function(){ updateLivePreview(); saveAnswer(); });

// --- 8. RESTAURATION ---
var savedVal = document.getElementById(${refAns});
if(savedVal && savedVal.value && savedVal.value.trim()!==''){
    editor.innerHTML = savedVal.value; updateLivePreview(); saveAnswer();
}

[[/jsxgraph]]`;
}

// ══════════════════════════════════════════════════════
//  GÉNÉRATEUR PRINCIPAL
// ══════════════════════════════════════════════════════
function genNuclear(X) {
  const bareme = parseFloat(v('nuc-bareme')) || 1;
  const text   = richVal('nuc-text');
  const editor = document.getElementById('nuc-editor');
  const rawEq  = editor ? editor.innerText.trim() : '';

  if (!rawEq) throw new Error(I18N.t('msg.err_nuc_vide', {n: X}));
  if (!rawEq.includes('->') && !rawEq.includes('\\rightarrow') && !rawEq.includes('→')) {
    throw new Error(I18N.t('msg.err_nuc_fleche', {n: X}));
  }

  const parsed = nucParseEquation(rawEq);
  if (!parsed || !parsed.reactants.length || !parsed.products.length) {
    throw new Error(I18N.t('msg.err_nuc_parse', {n: X}));
  }

  const ta3Str = nucToMaximaList(parsed.reactants);
  const ta4Str = nucToMaximaList(parsed.products);

  // LaTeX pour affichage
  const latexEq = nucEquationToLatex(parsed.reactants, parsed.products);

  // Render KaTeX pour previewFrag
  let katexHtml = '';
  try {
    katexHtml = katex.renderToString(latexEq, { throwOnError: false, displayMode: true });
  } catch(e) {
    katexHtml = `<code>${latexEq.replace(/</g,'&lt;')}</code>`;
  }

  // Escape pour la chaîne Maxima (guillemets et antislashs)
  const latexForMaxima = latexEq.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // ── Variables Maxima ──────────────────────────────
  const vars =
`/* Q${X} : Réaction Nucléaire (${bareme}pt) */
nuc${X}_rea: ${ta3Str};
nuc${X}_pro: ${ta4Str};
nuc${X}_latex: "${latexForMaxima}"`;

  // ── JSXGraph code ─────────────────────────────────
  const jsxCode = buildNuclearJSXCode(X);

  const textFrag =
`<div style="background:#EAB308;border-left:5px solid #676863;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
  <strong style="font-weight:800;color:#3a3a37;font-size:.95rem;">Q${X} — Réaction Nucléaire</strong>
  <span style="background:#676863;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
</div>
<!-- ENONCE-START --><div style="margin-bottom:14px;">${text || ''}</div><!-- ENONCE-END -->
${jsxCode}
<div style="display:none;">
    [[input:ans${X}]] [[validation:ans${X}]]
    [[input:ans${X}s]] [[validation:ans${X}s]]
    [[input:ans${X}r]] [[validation:ans${X}r]]
    [[input:ans${X}p]] [[validation:ans${X}p]]
</div>`;

  // ── previewFrag (dans Héstack) ────────────────────
  const previewFrag =
`<div style="background:#EAB308;border-left:5px solid #676863;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
  <strong style="font-weight:800;color:#3a3a37;font-size:.95rem;">Q${X} — Réaction Nucléaire</strong>
  <span style="background:#676863;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
</div>
<!-- ENONCE-START --><div style="margin-bottom:10px;">${text || ''}</div><!-- ENONCE-END -->
<div style="text-align:center;padding:16px;background:#f0f0ee;border:1.5px dashed #676863;border-radius:8px;">
  ${katexHtml}
</div>`;

  // ── Inputs XML ────────────────────────────────────
  const inputXML =
`    <input>
      <name>ans${X}</name>
      <type>string</type>
      <tans>nuc${X}_latex</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>
    <input>
      <name>ans${X}s</name>
      <type>algebraic</type>
      <tans>1</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>
    <input>
      <name>ans${X}r</name>
      <type>algebraic</type>
      <tans>nuc${X}_rea</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>
    <input>
      <name>ans${X}p</name>
      <type>algebraic</type>
      <tans>nuc${X}_pro</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`;

  // ── Feedback Variables Maxima (calquées sur la référence) ──
  const fbVars =
`/* 1. FONCTIONS UTILITAIRES */
sort_nuclei${X}(lst) := sort(lst, lambda([x,y], is(x[2] < y[2]) or (x[2]=y[2] and x[3] < y[3])));

get_particle_latex${X}(p) := block(
   [c, a, z, s, coeff_str, s_clean],
   c : p[1], a : p[2], z : p[3], s : p[4],
   if c = 1 then coeff_str : "" else coeff_str : sconcat(c),
   if s = "He" and a = 4 and z = 2 then return(sconcat("\\(", coeff_str, "\\\\alpha", "\\)")),
   if s = "e" and a = 0 and z = -1 then return(sconcat("\\(", coeff_str, "\\\\beta^{-}", "\\)")),
   if s = "e" and a = 0 and z = 1  then return(sconcat("\\(", coeff_str, "\\\\beta^{+}", "\\)")),
   if s = "\\\\gamma" then return(sconcat("\\(", coeff_str, "\\\\gamma", "\\)")),
   if s = "n" then return(sconcat("\\(", coeff_str, "n", "\\)")),
   if s = "p" then return(sconcat("\\(", coeff_str, "p", "\\)")),
   if search("*", s) > 0 then (
       s_clean : substring(s, 1, slength(s)),
       if c = 1 then return(sconcat("\\({}^{", a, "}_{", z, "}", s_clean, "^*", "\\)"))
       else return(sconcat("\\(", c, " {}^{", a, "}_{", z, "}", s_clean, "^*", "\\)"))
   ),
   if c = 1 then sconcat("\\({}^{", a, "}_{", z, "}", s, "\\)")
   else sconcat("\\(", c, " {}^{", a, "}_{", z, "}", s, "\\)")
);

get_coeffs_errors${X}(s_raw, t_raw) := block(
   [s_sorted, t_sorted, errors, i, p_latex],
   s_sorted : sort_nuclei${X}(s_raw),
   t_sorted : sort_nuclei${X}(t_raw),
   errors : [],
   if length(s_sorted) # length(t_sorted) then (
      return(["Attention : Le nombre de termes est incorrect (ex: 2n et non n+n)."])
   ),
   for i:1 thru length(s_sorted) do (
      if s_sorted[i][1] # t_sorted[i][1] then (
         p_latex : get_particle_latex${X}(t_sorted[i]),
         errors : endcons(
           sconcat("Pour \\( ", p_latex, " \\) : coeff ", s_sorted[i][1], " au lieu de ", t_sorted[i][1]),
           errors
         )
      )
   ),
   errors
);

/* 2. PRÉPARATION DES DONNÉES */
tmp_r${X}: if listp(ans${X}r) then ans${X}r else [];
tmp_p${X}: if listp(ans${X}p) then ans${X}p else [];

list_reactants_student${X}: map(get_particle_latex${X}, tmp_r${X});
list_reactants_teacher${X}: map(get_particle_latex${X}, nuc${X}_rea);
list_products_student${X}:  map(get_particle_latex${X}, tmp_p${X});
list_products_teacher${X}:  map(get_particle_latex${X}, nuc${X}_pro);

list_errors_coeffs_reactants${X}: get_coeffs_errors${X}(tmp_r${X}, nuc${X}_rea);
list_errors_coeffs_products${X}:  get_coeffs_errors${X}(tmp_p${X}, nuc${X}_pro);

/* 3. FEEDBACKS */
if list_reactants_student${X} = [] then list_reactants_student${X}: ["(vide)"];
if list_reactants_teacher${X} = [] then list_reactants_teacher${X}: ["(vide)"];
fb_error_reactants${X}: sconcat(
   "<div style='padding:15px;background:#fff5f5;border-radius:8px;border-left:5px solid #e74c3c;'>",
   "<h4 style='margin-top:0;color:#c0392b;'>❌ Les réactifs sont incorrects</h4>",
   "<strong style='color:#d9534f;'>Votre réponse :</strong>",
   "<ul style='color:#333;margin-top:5px;'><li>", simplode(list_reactants_student${X}, "</li><li>"), "</li></ul>",
   "<strong style='color:#555;'>Réponse attendue :</strong>",
   "<ul style='color:#333;margin-top:5px;'><li>", simplode(list_reactants_teacher${X}, "</li><li>"), "</li></ul>",
   "</div>"
);
if list_products_student${X} = [] then list_products_student${X}: ["(vide)"];
if list_products_teacher${X} = [] then list_products_teacher${X}: ["(vide)"];
fb_error_products${X}: sconcat(
   "<div style='padding:15px;background:#fff5f5;border-radius:8px;border-left:5px solid #e74c3c;'>",
   "<h4 style='margin-top:0;color:#c0392b;'>❌ Les produits sont incorrects</h4>",
   "<strong style='color:#d9534f;'>Votre réponse :</strong>",
   "<ul style='color:#333;margin-top:5px;'><li>", simplode(list_products_student${X}, "</li><li>"), "</li></ul>",
   "<strong style='color:#555;'>Réponse attendue :</strong>",
   "<ul style='color:#333;margin-top:5px;'><li>", simplode(list_products_teacher${X}, "</li><li>"), "</li></ul>",
   "</div>"
);
if list_errors_coeffs_reactants${X} = [] then (
   fb_reactants_coeffs${X}: "<strong>Erreur inconnue.</strong>"
) else (
   fb_reactants_coeffs${X}: sconcat(
      "<div style='padding:15px;background:#fffbf0;border-radius:8px;border-left:5px solid #f39c12;'>",
      "<h4 style='margin-top:0;color:#d35400;'>⚠️ Attention aux coefficients (Réactifs)</h4>",
      "<span style='color:#e67e22;font-weight:bold;'>", simplode(list_errors_coeffs_reactants${X}, "<br/><br/>"), "</span>",
      "</div>"
   )
);
if list_errors_coeffs_products${X} = [] then (
   fb_products_coeffs${X}: "<strong>Erreur inconnue.</strong>"
) else (
   fb_products_coeffs${X}: sconcat(
      "<div style='padding:15px;background:#fffbf0;border-radius:8px;border-left:5px solid #f39c12;'>",
      "<h4 style='margin-top:0;color:#d35400;'>⚠️ Attention aux coefficients (Produits)</h4>",
      "<span style='color:#e67e22;font-weight:bold;'>", simplode(list_errors_coeffs_products${X}, "<br/><br/>"), "</span>",
      "</div>"
   )
);
fb_success${X}: sconcat(
   "<div style='padding:15px;background:#f0fff4;border-radius:8px;border-left:5px solid #27ae60;'>",
   "<h4 style='margin-top:0;color:#27ae60;'>✅ Excellent !</h4>",
   "<span style='color:#2ecc71;'>La réaction est correctement équilibrée.</span>",
   "</div>"
);

/* 4. NETTOYAGE ET VÉRIFICATIONS */
clean_symbol${X}(s) := if search("*", s) > 0 then substring(s, 1, slength(s)) else s;
tmp_r_clean${X}: map(lambda([x], [x[1], x[2], x[3], clean_symbol${X}(x[4])]), tmp_r${X});
tmp_p_clean${X}: map(lambda([x], [x[1], x[2], x[3], clean_symbol${X}(x[4])]), tmp_p${X});
ta_r_clean${X}:  map(lambda([x], [x[1], x[2], x[3], clean_symbol${X}(x[4])]), nuc${X}_rea);
ta_p_clean${X}:  map(lambda([x], [x[1], x[2], x[3], clean_symbol${X}(x[4])]), nuc${X}_pro);

verif_especes${X}: if (setify(map(lambda([x], rest(x)), tmp_r_clean${X})) = setify(map(lambda([x], rest(x)), ta_r_clean${X}))) and (setify(map(lambda([x], rest(x)), tmp_p_clean${X})) = setify(map(lambda([x], rest(x)), ta_p_clean${X}))) then true else false;
verif_total${X}: if (setify(tmp_r_clean${X}) = setify(ta_r_clean${X})) and (setify(tmp_p_clean${X}) = setify(ta_p_clean${X})) then true else false;
verif_total_precise${X}: if (setify(tmp_r${X}) = setify(nuc${X}_rea)) and (setify(tmp_p${X}) = setify(nuc${X}_pro)) then true else false;
asterisk_missing${X}: if verif_total${X} and not verif_total_precise${X} then true else false;
fb_asterisk${X}: sconcat(
   "<div style='padding:15px;background:#fffbf0;border-radius:8px;border-left:5px solid #f39c12;'>",
   "<h4 style='margin-top:0;color:#d35400;'>⚠️ Attention aux états excités</h4>",
   "<span style='color:#e67e22;'>La structure est correcte, mais vérifiez les états excités (*).</span>",
   "</div>"
);`;

  // ── PRT (7 nœuds, calqués sur la référence) ────
  const mkCanonNode=(n,desc,sans,tans,ts,tn,fs,fn,tfb,ffb,tm,fm)=>({
    name:String(n), description:desc, answertest:'AlgEquiv', sans:sans, tans:tans,
    testoptions:'', quiet:'0',
    truescoremode:tm||'+', truescore:String(ts), truepenalty:'', truenextnode:String(tn),
    trueanswernote:`prt${X}-${n}-T`, truefeedback:tfb,
    falsescoremode:fm||'-', falsescore:String(fs), falsepenalty:'', falsenextnode:String(fn),
    falseanswernote:`prt${X}-${n}-F`, falsefeedback:ffb
  });

  const canonicalNodes=[
    mkCanonNode(0,'verif réactifs',
      `setify(map(lambda([x], rest(x)), ans${X}r))`, `setify(map(lambda([x], rest(x)), nuc${X}_rea))`,
      0.3,1,0,1, '', `{@fb_error_reactants${X}@}`, '+', '='),
    mkCanonNode(1,'verif produits',
      `setify(map(lambda([x], rest(x)), ans${X}p))`, `setify(map(lambda([x], rest(x)), nuc${X}_pro))`,
      0.3,2,0,2, '', `{@fb_error_products${X}@}`),
    mkCanonNode(2,'arret si espèces incorrectes',
      `verif_especes${X}`, 'true',
      0,3,0,-1, '', ''),
    mkCanonNode(3,'Vérification Coefficients Réactifs',
      `setify(ans${X}r)`, `setify(nuc${X}_rea)`,
      0.2,4,0,4, '', `{@fb_reactants_coeffs${X}@}`),
    mkCanonNode(4,'Vérification Coefficients Produits',
      `setify(ans${X}p)`, `setify(nuc${X}_pro)`,
      0.2,5,0,-1, '', `{@fb_products_coeffs${X}@}`),
    mkCanonNode(5,'il manque les états excités',
      `asterisk_missing${X}`, 'false',
      0,6,0.2,6, '', `{@fb_asterisk${X}@}`),
    mkCanonNode(6,'Tout est bon',
      `verif_total${X}`, 'true',
      0,-1,0,-1, `{@fb_success${X}@}`, '')
  ];
  const prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'2', feedbackvariables: fbVars };
  const prtXML = buildPrtXml(prtMeta, canonicalNodes);

  return {
    bareme,
    vars,
    qnote: `Nucléaire Q${X}: {@nuc${X}_rea@} -> {@nuc${X}_pro@}`,
    textFrag,
    previewFrag,
    nucKatexFrag: `<div style="text-align:center;padding:16px;background:#f0f0ee;border:1.5px dashed #676863;border-radius:8px;"><img src="https://latex.codecogs.com/svg.image?\\displaystyle%20${encodeURIComponent(latexEq)}" style="max-width:100%;max-height:80px;" alt="${latexEq}"></div>`,
    inputXML,
    prtXML,
    prt: { meta: prtMeta, nodes: canonicalNodes },
    generalFeedback: _mkFbGen('', v('nuc-fbgen')),
    feedbackRef: `[[feedback:prt${X}]]`
  };
}
