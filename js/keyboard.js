// ── KEYBOARD MODAL + MAXIMA ANALYSIS + FIELD VALIDATION ─────────
let kbdCurrentType = null;
let kbdTargetField = null;

// Generate the STACK-ready keyboard HTML using the STACK-JS iframe API
function buildKbdStackHTML(X){
  const ansRef='ans'+X;
  return `<p>[[input:ans${X}]] [[validation:ans${X}]]</p>
[[iframe width="100%" height="230px" scrolling="false"]]
[[style]]
  body{margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;}
  .stack-keyboard-container{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;max-width:600px;box-sizing:border-box;margin-top:10px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);}
  .stack-keyboard-title{font-size:0.8rem;font-weight:700;color:#64748b;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.05em;}
  .stack-keyboard-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;}
  .stack-keyboard-row:last-child{margin-bottom:0;}
  .btn-ins{background:#ffffff !important;border:1px solid #e2e8f0 !important;border-radius:8px !important;color:#1e293b !important;padding:8px 14px !important;font-size:0.95rem !important;font-weight:600 !important;cursor:pointer !important;transition:all 0.2s ease !important;min-width:42px !important;line-height:1 !important;box-shadow:0 1px 3px rgba(0,0,0,0.08) !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;user-select:none;}
  .btn-ins:hover{background:#059669 !important;color:#ffffff !important;border-color:#059669 !important;transform:translateY(-1px);box-shadow:0 4px 6px -1px rgba(5,150,105,0.25) !important;}
  .btn-ins:active{background:#047857 !important;transform:translateY(0);box-shadow:0 1px 2px rgba(0,0,0,0.05) !important;}
  .stack-row-label{font-size:0.75rem;color:#94a3b8;width:100%;margin-bottom:4px;margin-top:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;}
  .stack-row-label:first-of-type{margin-top:0;}
[[/style]]
<div class="stack-keyboard-container">
  <div class="stack-keyboard-title">\u2328\ufe0f Aide \u00e0 la saisie</div>
  <div class="stack-row-label">Op\u00e9rateurs &amp; symboles</div>
  <div class="stack-keyboard-row">
    <button class="btn-ins" type="button" data-val="+">+</button>
    <button class="btn-ins" type="button" data-val="-">&#8722;</button>
    <button class="btn-ins" type="button" data-val="/">&#247;</button>
    <button class="btn-ins" type="button" data-val="*">&#215;</button>
    <button class="btn-ins" type="button" data-val="%pi">&#960;</button>
    <button class="btn-ins" type="button" data-val="^2">x&#178;</button>
    <button class="btn-ins" type="button" data-val="^">x&#8319;</button>
    <button class="btn-ins" type="button" data-val="*10^">&#215;10&#8319;</button>
    <button class="btn-ins" type="button" data-val="(">(</button>
    <button class="btn-ins" type="button" data-val=")">)</button>
  </div>
  <div class="stack-row-label">Fonctions usuelles</div>
  <div class="stack-keyboard-row">
    <button class="btn-ins" type="button" data-val="sqrt()">&#8730;</button>
    <button class="btn-ins" type="button" data-val="abs()">|x|</button>
    <button class="btn-ins" type="button" data-val="exp()">e&#739;</button>
    <button class="btn-ins" type="button" data-val="ln()">ln</button>
    <button class="btn-ins" type="button" data-val="log_10()">log</button>
    <button class="btn-ins" type="button" data-val="sin()">sin</button>
    <button class="btn-ins" type="button" data-val="cos()">cos</button>
    <button class="btn-ins" type="button" data-val="tan()">tan</button>
    <button class="btn-ins" type="button" data-val="asin()">Asin</button>
    <button class="btn-ins" type="button" data-val="acos()">Acos</button>
    <button class="btn-ins" type="button" data-val="atan()">Atan</button>
  </div>
</div>
[[script type="module"]]
import {stack_js} from '[[cors src="stackjsiframe.js"/]]';
stack_js.request_access_to_input("${ansRef}", true).then(function(input_id) {
    var stackInput = document.getElementById(input_id);
    document.querySelectorAll('.btn-ins').forEach(function(btn){
        btn.addEventListener('click', function(e){
            e.preventDefault();
            var val = this.getAttribute('data-val');
            var actuel = stackInput.value || '';
            var texteAvant = actuel.trimEnd();
            var charPrecedent = texteAvant.length > 0 ? texteAvant.slice(-1) : null;
            var excl = [null, '=', '+', '-', '*', '/', '^', '('];
            var estOp = /^[+\\-*\\/^)]/.test(val);
            var pref = '';
            if (!excl.includes(charPrecedent) && !estOp && actuel.length > 0) {
                pref = '*';
            }
            stackInput.value = actuel + pref + val;
            stackInput.dispatchEvent(new Event('change'));
        });
    });
});
[[/script]]
[[/iframe]]`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildKbdStackHTML: buildKbdStackHTML };
}

function openKbdModal(type,fieldId){
  kbdCurrentType = type;
  const colors = {alg:'var(--algebraic)',num:'var(--numerical)',un:'var(--units)'};
  const labels = {alg:'➗ '+I18N.t('tpl.vf_type_algebraic'),num:'🔢 '+I18N.t('tpl.vf_type_numerical'),un:'📐 '+I18N.t('tpl.vf_type_units')};
  document.getElementById('kbd-head-bar').style.background = colors[type]||'var(--navy)';
  document.querySelector('#kbd-head-bar h3').innerHTML = '<svg class="hs-ico"><use href="#ico-tool-keyboard"></use></svg> '+I18N.t('tpl.kbd_aide_saisie')+' — '+(labels[type]||'');
  document.getElementById('kbd-btn-confirm').style.background = colors[type]||'var(--navy)';

  // Sync "aide" checkbox with per-type state
  const aideMap = {alg:'alg-h-kbd', num:'num-h-kbd', un:'un-h-kbd'};
  const srcCb = document.getElementById(aideMap[type]);
  document.getElementById('kbd-aide-check').checked = srcCb ? srcCb.checked : false;

  // Target field (answer/value input, or an explicit fieldId override)
  const fieldMap = {alg:'alg-formula', num:'num-val', un:'un-val'};
  kbdTargetField = document.getElementById(fieldId||fieldMap[type])||null;

  // Pre-fill test zone
  const testInput = document.getElementById('kbd-test-input');
  testInput.value = kbdTargetField ? kbdTargetField.value : '';
  updateKbdPreview();

  const modal = document.getElementById('kbdModal');
  modal.style.display='flex';
  FocusTrap.trap(modal, closeKbdModal);
}

function closeKbdModal(){
  document.getElementById('kbdModal').style.display='none';
  FocusTrap.release();
}

function confirmKbdModal(){
  // Sync aide checkbox back
  const aideMap = {alg:'alg-h-kbd', num:'num-h-kbd', un:'un-h-kbd'};
  const srcCb = document.getElementById(aideMap[kbdCurrentType]);
  if(srcCb){
    srcCb.checked = document.getElementById('kbd-aide-check').checked;
    if(kbdCurrentType==='alg') updateAlgPreview();
    else if(kbdCurrentType==='num') updateNumPreview();
    else if(kbdCurrentType==='un') updateUnPreview();
  }
  kbdCopyToField();
  closeKbdModal();
}

function kbdCopyToField(){
  if(!kbdTargetField) return;
  const expr = document.getElementById('kbd-test-input').value.trim();
  if(!expr){ toast(I18N.t('msg.zone_de_test_vide_rien')); return; }
  kbdTargetField.value = expr;
  kbdTargetField.dispatchEvent(new Event('input',{bubbles:true}));
  toast(I18N.t('msg.expression_copiee_dans_le_champ'));
}

// ── Maxima expression → LaTeX string ──────────────────────────────────────
function maximaToLatex(expr){
  if(!expr) return '';
  let s = expr.trim();

  // 1. log_10(x) → \log_{10}\left(x\right)
  s = s.replace(/log_10\(([^)]*)\)/g, '\\log_{10}\\left($1\\right)');
  // 2. Named functions with ()
  const fns = {
    sqrt: '\\sqrt',
    abs:  null,   // handled separately → |x|
    exp:  '\\exp',
    ln:   '\\ln',
    sin:  '\\sin',
    cos:  '\\cos',
    tan:  '\\tan',
    asin: '\\arcsin',
    acos: '\\arccos',
    atan: '\\arctan',
  };
  s = s.replace(/abs\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, '\\left|$1\\right|');
  for(const [fn, latex] of Object.entries(fns)){
    if(!latex) continue;
    const re = new RegExp(fn+'\\(([^()]*(?:\\([^()]*\\)[^()]*)*)\\)','g');
    if(fn === 'sqrt'){
      s = s.replace(re, latex+'{$1}');
    } else {
      s = s.replace(re, latex+'\\left($1\\right)');
    }
  }
  // 3. %pi → \pi
  s = s.replace(/%pi/g, '\\pi');
  s = s.replace(/%e\b/g, 'e');

  // 4. a*10^b → a \times 10^{b}
  s = s.replace(/([^*\s]+)\s*\*\s*10\^\s*(-?\d+)/g, '$1 \\times 10^{$2}');

  // 5. a^(b) → a^{b},  a^b → a^{b}
  s = s.replace(/\^([A-Za-z0-9%_]+)/g, '^{$1}');
  s = s.replace(/\^\(([^)]+)\)/g, '^{$1}');

  // 6. Fractions: (num)/(denom) or num/denom
  // Try to detect top-level division a/b and convert to \frac{a}{b}
  s = splitFrac(s);

  // 7. Multiplication: strip * between tokens → \, or just remove
  //    But keep * between numbers to avoid confusion
  s = s.replace(/([A-Za-z0-9\}])\s*\*\s*([A-Za-z\(\\])/g, '$1 \\cdot $2');
  s = s.replace(/([A-Za-z0-9\}])\s*\*\s*(\d)/g, '$1 \\cdot $2');
  // Remove remaining * 
  s = s.replace(/\s*\*\s*/g, ' ');

  return s;
}

// Convert a/b → \frac{a}{b} — but only for local operands, not whole expressions.
// Strategy: tokenise by top-level operators (+, -, =, ≠, …) and apply
// fraction conversion only within each token.
function applyLocalFracs(s){
  // Split on top-level +, -, = preserving them (we will rejoin)
  // We do this by walking character by character
  const TOP_OPS = /^[+\-=<>]/;
  let parts = [];
  let depth = 0, cur = '';
  for(let i = 0; i < s.length; i++){
    const c = s[i];
    if(c==='('||c==='{'||c==='[') { depth++; cur+=c; }
    else if(c===')'||c==='}'||c===']') { depth--; cur+=c; }
    else if(depth===0 && (c==='+'||c==='-'||c==='=')){
      parts.push({t:'tok', v:cur}); parts.push({t:'op', v:c}); cur='';
    } else {
      cur+=c;
    }
  }
  if(cur!=='') parts.push({t:'tok', v:cur});

  // For each token, try to split on /
  const converted = parts.map(p => {
    if(p.t==='op') return p.v;
    return splitOnSlash(p.v.trim());
  });
  return converted.join('');
}

function splitOnSlash(s){
  // Find first / at depth 0
  let depth=0, slashIdx=-1;
  for(let i=0;i<s.length;i++){
    const c=s[i];
    if(c==='('||c==='{'||c==='[') depth++;
    else if(c===')'||c==='}'||c===']') depth--;
    else if(c==='/' && depth===0){ slashIdx=i; break; }
  }
  if(slashIdx<0) return s;

  let num   = s.slice(0,slashIdx).trim();
  let denom = s.slice(slashIdx+1).trim();

  // Unwrap outer parens
  if(num.startsWith('(')&&num.endsWith(')')) num=num.slice(1,-1);
  if(denom.startsWith('(')&&denom.endsWith(')')) denom=denom.slice(1,-1);

  return '\\frac{'+num+'}{'+denom+'}';
}

// Keep legacy alias used in maximaToLatex
function splitFrac(s){ return applyLocalFracs(s); }

function analyseMaxima(raw){
  const result={vars:[],errors:[],latex:''};
  if(!raw)return result;
  const KNOWN=new Set(['sqrt','abs','exp','ln','log_10','log','sin','cos','tan',
                       'asin','acos','atan','pi','e','inf','true','false']);
  const tokenRe=/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
  const seen=new Set();let m;
  while((m=tokenRe.exec(raw))!==null){
    const tok=m[1];
    if(!KNOWN.has(tok)&&!tok.startsWith('%')&&!/^\d/.test(tok))seen.add(tok);
  }
  result.vars=[...seen].sort();
  let depth=0;
  for(const ch of raw){
    if(ch==='(')depth++;
    else if(ch===')')depth--;
    if(depth<0){result.errors.push(I18N.t('kbd.err_par_fermante'));depth=0;}
  }
  if(depth>0)result.errors.push(I18N.t('kbd.err_par_ouvertes',{n:depth}));
  if(/[+*\/^]$/.test(raw.trim()))result.errors.push(I18N.t('kbd.err_fin_operateur'));
  if(/^[*\/^]/.test(raw.trim()))result.errors.push(I18N.t('kbd.err_debut_operateur'));
  result.latex=maximaToLatex(raw);
  return result;
}

function updateKbdPreview(){
  const raw=document.getElementById('kbd-test-input').value.trim();
  const box=document.getElementById('kbd-preview-box');
  const rawEl=document.getElementById('kbd-preview-raw');
  const varsEl=document.getElementById('kbd-vars-list');
  const validIcon=document.getElementById('kbd-valid-icon');
  const validMsg=document.getElementById('kbd-valid-msg');
  if(!raw){
    box.innerHTML='<span style="color:#94a3b8;font-style:italic;font-size:.85rem;">'+I18N.t('tpl.kbd_apercu_attente')+'</span>';
    if(rawEl)rawEl.textContent='';
    if(varsEl)varsEl.innerHTML='<span style="color:#94a3b8;font-style:italic;">—</span>';
    if(validIcon)validIcon.textContent='⬜';
    if(validMsg)validMsg.innerHTML='<span style="color:#94a3b8;font-style:italic;">'+I18N.t('tpl.kbd_attente_saisie')+'</span>';
    return;
  }
  const a=analyseMaxima(raw);
  if(varsEl){
    varsEl.innerHTML=a.vars.length
      ?a.vars.map(vv=>`<code style="background:#e0f2fe;color:#0369a1;padding:1px 5px;border-radius:3px;font-size:.82rem;">${vv}</code>`).join(' ')
      :'<span style="color:#94a3b8;font-style:italic;">'+I18N.t('tpl.kbd_aucune_variable')+'</span>';
  }
  if(validIcon&&validMsg){
    if(a.errors.length){
      validIcon.textContent='🔴';
      validMsg.innerHTML=a.errors.map(e=>`<span style="color:#dc2626;font-weight:600;">${e}</span>`).join(' &nbsp;·&nbsp; ');
    }else{
      validIcon.textContent='🟢';
      validMsg.innerHTML='<span style="color:#15803d;font-weight:600;">'+I18N.t('tpl.kbd_structure_valide')+'</span>';
    }
  }
  if(rawEl)rawEl.textContent='Maxima : '+raw;
  try{
    box.innerHTML=katex.renderToString(a.latex,{throwOnError:false,displayMode:true,output:'html'});
  }catch(e){
    box.innerHTML=`<code style="font-size:.85rem;color:#64748b;">${a.latex.replace(/</g,'&lt;')}</code>`;
  }
}

// Hook keyboard buttons inside the modal to the test input
// (garde 'typeof document' : ce fichier est aussi require() côté serveur
// pour buildKbdStackHTML, seule fonction pure exposée — voir server/generate.js)
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('#kbdModal .btn-kbd').forEach(function(btn){
      btn.addEventListener('click',function(e){
        e.preventDefault();
        const val = this.getAttribute('data-val');
        const input = document.getElementById('kbd-test-input');
        const start = input.selectionStart, end = input.selectionEnd;
        const actuel = input.value;
        const charPrecedent = start>0 ? actuel.charAt(start-1) : null;
        const exclusions = [null,'=','+','-','*','/','^','('];
        const insertionEstOperateur = /^[\+\-\*\/\^\)]/.test(val);
        let prefixe = '';
        if(!exclusions.includes(charPrecedent) && !insertionEstOperateur) prefixe='*';
        const texteAInserer = prefixe + val;
        input.value = actuel.substring(0,start) + texteAInserer + actuel.substring(end);
        input.focus();
        let newPos = start + texteAInserer.length;
        if(val.includes('()')) newPos = start + prefixe.length + val.indexOf('(') + 1;
        else if(val==='*10^') newPos = start + prefixe.length + 4;
        input.setSelectionRange(newPos,newPos);
        updateKbdPreview();
      });
    });
  });
}

// ══════════════════════════════════════════════════════
//  HELP
// ══════════════════════════════════════════════════════
function buildHelpHTML(selector,extra){const cbs=document.querySelectorAll(selector);let items=[];cbs.forEach(c=>{if(c.checked&&c.dataset.html)items.push(`<li>${c.dataset.html}</li>`);});if(extra)items.push(`<li>${extra}</li>`);if(!items.length)return '';return `<div style="background:#f8f9fa;border:1px solid #dee2e6;padding:15px;border-radius:8px;margin-bottom:15px;"><strong>Conseils pour la saisie :</strong><ul style="margin:8px 0 0 20px;line-height:1.7">${items.join('')}</ul></div>`;}
function buildAlgHelp(){const sv=document.getElementById('alg-h-vars').checked;const vars=v('alg-vars');return buildHelpHTML('.alg-h',sv&&vars?`Variables à utiliser : <code>${vars}</code>`:null);}
function algRenderFbDetail() {
    var container = document.getElementById('alg-fb-detail');
    if (!container || container.dataset.built || typeof ALG_FB_DEFS === 'undefined') return;

    var html = '';
    Object.keys(ALG_FB_DEFS).forEach(function(mode) {
        var groupId = 'alg-fb-group-' + mode;
        html += '<div class="alg-fb-group" id="' + groupId + '" style="display:none">';
        ALG_FB_DEFS[mode].forEach(function(item) {
            var id = _algFbId(mode, item.key);
            html += '<div class="field"><label>' + item.label
                 + '</label>'
                 + '<div class="rich-preview hs-minh42" id="prev-' + id + '" tabindex="0" role="button" onclick="openRich(\'' + id + '\')"></div>'
                 + '<textarea id="' + id + '" style="display:none"></textarea></div>';
        });
        html += '</div>';
    });
    container.innerHTML = html;
    container.dataset.built = '1';

    Object.keys(ALG_FB_DEFS).forEach(function(mode) {
        ALG_FB_DEFS[mode].forEach(function(item) {
            setRichVal(_algFbId(mode, item.key), item.def);
        });
    });
}

function toggleAlgMode(){
    const mode=document.getElementById('alg-mode')?.value||'libre';
    const row=document.getElementById('alg-error-row');
    if(row)row.style.display=mode==='expert'?'':'none';
    algRenderFbDetail();
    if (typeof ALG_FB_DEFS !== 'undefined') {
        Object.keys(ALG_FB_DEFS).forEach(function(m) {
            var g = document.getElementById('alg-fb-group-' + m);
            if (g) g.style.display = (m === mode) ? '' : 'none';
        });
    }
    if(typeof algRefreshPreview==='function')algRefreshPreview();
}
function buildUnHelp(){return buildHelpHTML('.un-h',null);}
function buildNumHelp(){return buildHelpHTML('.num-h',null);}
function toggleNumAide(){
  const on=document.getElementById('num-aide-on').checked;
  document.getElementById('num-aide-panel').style.display=on?'block':'none';
  updateNumPreview();
  if(typeof numRefreshPreview==='function')numRefreshPreview();
}
function updateAlgPreview(){
  if(typeof algRefreshPreview==='function')algRefreshPreview();
}
function toggleAlgAide(){
  const on=document.getElementById('alg-aide-on').checked;
  document.getElementById('alg-aide-panel').style.display=on?'block':'none';
  if(typeof algRefreshPreview==='function')algRefreshPreview();
}
function updateUnPreview(){
  const p=document.getElementById('un-help-preview');
  const h=buildUnHelp();
  const kbdOn=document.getElementById('un-h-kbd').checked;
  let preview=h||'';
  if(kbdOn)preview+='<div style="margin-top:8px;padding:9px 13px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:7px;font-size:.82rem;color:#1d4ed8;"><strong><svg class="hs-ico" aria-hidden="true"><use href="#ico-tool-keyboard"></use></svg> Clavier virtuel Maxima</strong> — sera inclus dans la question.</div>';
  p.innerHTML=preview||'<em style="color:#94a3b8">Cochez des options...</em>';
}
function updateNumPreview(){
  if(typeof numRefreshPreview==='function')numRefreshPreview();
}

// ══════════════════════════════════════════════════════
//  FIELD VALIDATION (show/hide error)
// ══════════════════════════════════════════════════════
function markErr(inputId,errId,bad){const inp=document.getElementById(inputId);const err=document.getElementById(errId);if(inp)inp.classList.toggle('err',bad);if(err)err.style.display=bad?'block':'none';return bad;}

// ══════════════════════════════════════════════════════
//  CONTRÔLE DE SYNTAXE MAXIMA — rejette 2x, x² (exige 2*x, x^2)
// ══════════════════════════════════════════════════════
function algSyntaxIssues(expr){
  if(!expr)return[];
  const issues=[];
  if(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(expr))issues.push('Exposant unicode interdit (x²) — utilisez x^2.');
  // Retire les notations scientifiques valides (1e+6, 2e-3) avant de chercher une multiplication implicite
  const stripped=expr.replace(/\d+(\.\d+)?[eE][+-]?\d+/g,'');
  if(/\d[a-zA-Z(]/.test(stripped)||/\)[a-zA-Z0-9(]/.test(stripped))issues.push('Multiplication implicite détectée (ex : 2x) — utilisez * explicitement (ex : 2*x).');
  return issues;
}
function markSyntaxErr(inputId,errId){
  const inp=document.getElementById(inputId),err=document.getElementById(errId);
  if(!inp||!err)return false;
  const issues=algSyntaxIssues(inp.value);
  err.style.display=issues.length?'block':'none';
  err.innerHTML=issues.map(function(m){return'⚠️ '+m;}).join('<br>');
  inp.classList.toggle('err',issues.length>0);
  return issues.length>0;
}
function algCheckSyntax(){
  markSyntaxErr('alg-formula','err-alg-formula-syntax');
  markSyntaxErr('alg-expr-display','err-alg-expr-display-syntax');
  markSyntaxErr('alg-error','err-alg-error-syntax');
}

function validateCurrentType(){
  let ok=true;
  if(currentType==='algebraic'){
    if(markErr('alg-formula','err-alg-formula',!v('alg-formula').trim()))ok=false;
    if(markErr('alg-expr-display','err-alg-expr-display',!v('alg-expr-display').trim()))ok=false;
    if(markSyntaxErr('alg-formula','err-alg-formula-syntax'))ok=false;
    if(markSyntaxErr('alg-expr-display','err-alg-expr-display-syntax'))ok=false;
    if(markSyntaxErr('alg-error','err-alg-error-syntax'))ok=false;
  }else if(currentType==='numerical'){
    if(markErr('num-val','err-num-val',!v('num-val').trim()))ok=false;
  }else if(currentType==='units'){
    if(markErr('un-val','err-un-val',!v('un-val').trim()))ok=false;
    if(markErr('un-unit','err-un-unit',!v('un-unit').trim()))ok=false;
  }else if(currentType==='string'){
    const ansRich=richVal('str-ans-rich').replace(/<[^>]+>/g,'').trim();
    if(markErr('prev-str-ans-rich','err-str-ans',!ansRich))ok=false;
  }else if(currentType==='composition'){
    const compText=richVal('comp-text').replace(/<[^>]+>/g,'').trim();
    if(!compText){toast(I18N.t('msg.a_i_composition_l_anonca'));ok=false;}
  }else if(currentType==='basen'){
    if(typeof bnLastInvalid!=='undefined'&&bnLastInvalid){
      toast('❌ Valeur ou bornes invalides : corrigez l\'aperçu avant d\'enregistrer.');
      ok=false;
    }
  }else if(currentType==='polynomes'){
    if(typeof polLastInvalid!=='undefined'&&polLastInvalid){
      toast('❌ Configuration invalide (voir l\'aperçu) : corrigez avant d\'enregistrer.');
      ok=false;
    }
  }else if(currentType==='equivalence'){
    if(markErr('eq-formule','err-eq-formule',!v('eq-formule').trim()))ok=false;
  }
  return ok;
}

// Auto-fill empty feedbacks with defaults
function resolveFb(fieldId,defaultHtml){
  const current=richVal(fieldId).trim().replace(/<\/?[^>]+>/g,'').trim();
  if(!current){
    // Ne pas écrire un défaut vide : setRichVal est enveloppé (voir
    // hsRegisterPreviewRefresher, js/preview.js) pour redéclencher tous les
    // aperçus après chaque appel. Un défaut vide laisse le champ vide, donc
    // le prochain appel de resolveFb() le re-déclenche indéfiniment
    // (récursion infinie setRichVal → refreshers → _xxxBuildParams → resolveFb).
    if(defaultHtml)setRichVal(fieldId,defaultHtml);
    return defaultHtml;
  }
  return richVal(fieldId);
}