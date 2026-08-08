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

// expert-ui.js — Expert STACK question editor (full mode)

var EXPERT_INPUT_TYPES = [
  'algebraic','numerical','matrix','checkbox','radio','dropdown',
  'string','boolean','equiv','units','textarea','varmatrix','singlechar'
];

/* Options avancées par type — chaque entrée : {key, label, type:'check'|'number', tip} */
var EXPERT_ADV_OPTS = {
  algebraic:[
    {key:'allowempty',    label:'Autoriser vide',    tip:'Réponse vide = EMPTYANSWER (valide)'},
    {key:'rationalized',  label:'Rationalisé',        tip:'Le dénominateur ne doit pas contenir de surds (√)'},
  ],
  numerical:[
    {key:'floatnum',      label:'Flottant',           tip:'La réponse doit satisfaire floatnump() — nombre décimal'},
    {key:'intnum',        label:'Entier explicite',   tip:'Entier seul : 6 ✓, 2*3 ✗'},
    {key:'rationalnum',   label:'Fraction',           tip:'Fraction rationnelle uniquement, pas d\'entier'},
    {key:'rationalized',  label:'Rationalisé',        tip:'Dénominateur sans surds'},
    {key:'allowempty',    label:'Autoriser vide',     tip:'Réponse vide = EMPTYANSWER'},
    {key:'mindp', label:'Décimales min', type:'number', tip:'Minimum de décimales requises (ex: 2 → 3.14)'},
    {key:'maxdp', label:'Décimales max', type:'number', tip:'Maximum de décimales autorisées'},
    {key:'minsf', label:'Chiffres sig. min', type:'number', tip:'Minimum de chiffres significatifs'},
    {key:'maxsf', label:'Chiffres sig. max', type:'number', tip:'Maximum de chiffres significatifs'},
  ],
  units:[
    {key:'allowempty',    label:'Autoriser vide',     tip:''},
    {key:'floatnum',      label:'Flottant',           tip:''},
    {key:'minsf', label:'Chiffres sig. min', type:'number', tip:''},
    {key:'maxsf', label:'Chiffres sig. max', type:'number', tip:''},
  ],
  matrix:[
    {key:'allowempty',    label:'Autoriser vide',     tip:''},
  ],
  varmatrix:[
    {key:'allowempty',    label:'Autoriser vide',     tip:''},
  ],
  string:[
    {key:'allowempty',    label:'Autoriser vide',     tip:'Réponse vide = "" au lieu de EMPTYANSWER'},
    {key:'casesensitive', label:'Sensible à la casse',tip:'A ≠ a pour la comparaison'},
  ],
  notes:[
    {key:'allowempty',    label:'Autoriser vide',     tip:''},
    {key:'manualgraded',  label:'Correction manuelle',tip:'Toute la question passe en correction manuelle'},
  ],
  textarea:[
    {key:'allowempty',    label:'Autoriser vide → [EMPTYANSWER]', tip:''},
  ],
  equiv:[
    {key:'allowempty',    label:'Autoriser vide → [EMPTYANSWER]', tip:''},
  ],
  boolean:[
    {key:'allowempty',    label:'Autoriser vide',     tip:''},
  ],
  radio:[
    {key:'shuffle',       label:'Mélanger les choix', tip:'Ordre aléatoire à chaque affichage'},
    {key:'nocheck',       label:'Sans bouton vérifier',tip:'Retire le bouton Vérifier pour cet input'},
  ],
  checkbox:[
    {key:'shuffle',       label:'Mélanger les choix', tip:''},
    {key:'nocheck',       label:'Sans bouton vérifier',tip:''},
  ],
  dropdown:[
    {key:'shuffle',       label:'Mélanger les choix', tip:''},
  ],
  singlechar:[]
};

/* Parse "floatnum,minsf:2,maxsf:3" → {floatnum:true, minsf:2, maxsf:3} */
function _parseAdvOpts(str){
  var r={};
  (str||'').split(',').forEach(function(p){
    p=p.trim(); if(!p) return;
    var m=p.match(/^(\w+):(\d+)$/);
    if(m) r[m[1]]=parseInt(m[2]); else r[p]=true;
  });
  return r;
}

/* {floatnum:true, minsf:2} → "floatnum,minsf:2" */
function _serializeAdvOpts(obj){
  return Object.keys(obj).filter(function(k){ return obj[k]||obj[k]===0; }).map(function(k){
    return (typeof obj[k]==='number') ? k+':'+obj[k] : k;
  }).join(',');
}

/* Génère le HTML des options avancées pour un input donné */
function expertAdvOptsHtml(inp, i){
  var defs = EXPERT_ADV_OPTS[inp.type||'algebraic'] || [];
  if(!defs.length) return '<div class="exp-adv-empty">Aucune option avancée pour ce type.</div>';
  var parsed = _parseAdvOpts(inp.options||'');
  var checks=[], nums=[];
  defs.forEach(function(d){
    if(d.type==='number'){
      var val = parsed[d.key]!=null ? parsed[d.key] : '';
      nums.push(
        '<label class="exp-adv-num" title="'+_ee(d.tip)+'">'
        +'<span>'+d.label+'</span>'
        +'<input type="number" min="0" max="20" value="'+val+'" placeholder="—" '
        +'onchange="expertUpdateAdvOpt('+i+',\''+d.key+'\',this.value===\'\'?null:+this.value)">'
        +'</label>'
      );
    } else {
      checks.push(
        '<label class="exp-chk" title="'+_ee(d.tip)+'">'
        +'<input type="checkbox"'+(parsed[d.key]?' checked':'')+' '
        +'onchange="expertUpdateAdvOpt('+i+',\''+d.key+'\',this.checked)">'
        +'<span>'+d.label+'</span>'
        +'</label>'
      );
    }
  });
  var warn='';
  if((parsed.mindp||parsed.maxdp) && (parsed.minsf||parsed.maxsf))
    warn='<div class="exp-adv-warn">⚠ Ne pas combiner décimales et chiffres significatifs.</div>';
  return checks.join('')+(nums.length?'<div class="exp-adv-nums">'+nums.join('')+'</div>':'')+warn;
}

/* Met à jour une option avancée individuelle */
function expertUpdateAdvOpt(i, key, val){
  var q=questions[_activeQid];
  if(!q||!q._expertState||!q._expertState.inputs[i]) return;
  var parsed=_parseAdvOpts(q._expertState.inputs[i].options||'');
  if(val===null||val===false||val==='') delete parsed[key];
  else parsed[key]=(val===true)?true:val;
  q._expertState.inputs[i].options=_serializeAdvOpts(parsed);
}

/* ════════════════════════════════════════════════════════════════════
   APERÇU LIVE — simulateur Maxima léger + rendu KaTeX
   ════════════════════════════════════════════════════════════════════ */

function expSimulateMaxima(varsCode){
  var env={};
  var lines=(varsCode||'').split(/[;\n]+/).map(function(l){return l.trim();}).filter(Boolean);
  lines.forEach(function(line){
    /* n'accepte que "nom : expression" */
    var m=line.match(/^([a-zA-Z_]\w*)\s*:(.*)/);
    if(!m) return;
    var name=m[1];
    var expr=m[2].trim()
      /* rand(n) → entier aléatoire 0..n-1 */
      .replace(/rand\s*\(\s*(\d+)\s*\)/g,function(_,n){ return String(Math.floor(Math.random()*parseInt(n))); })
      /* ^ → ** */
      .replace(/\^/g,'**')
      /* sqrt(x) → Math.sqrt(x) */
      .replace(/\bsqrt\b/g,'Math.sqrt')
      .replace(/\babs\b/g,'Math.abs')
      .replace(/\bfloor\b/g,'Math.floor')
      .replace(/\bceil\b/g,'Math.ceil');
    try{
      var args=Object.keys(env);
      var vals=args.map(function(k){return env[k];});
      /* eslint-disable no-new-func */
      var fn=new Function(args,'return ('+expr+')');
      var result=fn.apply(null,vals);
      /* Arrondir les flottants à 4 décimales */
      if(typeof result==='number'&&!Number.isInteger(result)) result=Math.round(result*10000)/10000;
      env[name]=result;
    }catch(e){ env[name]='?'; }
  });
  return env;
}

function _expReplaceStackTags(html, env){
  /* {@var@} → valeur simulée */
  html=html.replace(/\{@(\w+)@\}/g,function(_,name){
    return env[name]!==undefined
      ? '<span class="exp-pv-val">'+env[name]+'</span>'
      : '<span class="exp-pv-unknown">{@'+name+'@}</span>';
  });
  /* [[input:name]] → boîte stylée */
  html=html.replace(/\[\[input:(\w+)\]\]/g,function(_,name){
    return '<span class="exp-pv-input" title="'+_ee(I18N.t('exp.pv_input_title',{name:name}))+'">▢ <em>'+name+'</em></span>';
  });
  /* [[validation:name]] */
  html=html.replace(/\[\[validation:(\w+)\]\]/g,function(){
    return '<span class="exp-pv-valid">'+I18N.t('exp.pv_validation_label')+'</span>';
  });
  /* [[feedback:name]] */
  html=html.replace(/\[\[feedback:(\w+)\]\]/g,function(_,name){
    return '<span class="exp-pv-fb">📊 '+name+'</span>';
  });
  return html;
}

function _expKatexRender(container){
  /* Render \(...\) and \[...\] avec KaTeX */
  if(!container||typeof katex==='undefined') return;
  container.innerHTML=container.innerHTML
    .replace(/\\\[(.+?)\\\]/gs,function(_,f){
      try{ return '<span class="lx-block">'+katex.renderToString(f,{displayMode:true,throwOnError:false})+'</span>'; }
      catch(e){ return '\\['+f+'\\]'; }
    })
    .replace(/\\\((.+?)\\\)/gs,function(_,f){
      try{ return katex.renderToString(f,{displayMode:false,throwOnError:false}); }
      catch(e){ return '\\('+f+'\\)'; }
    });
}

function expRenderPreview(){
  var q=questions[_activeQid]; if(!q||!q._expertState) return;
  expertCaptureToState(_activeQid);
  var s=q._expertState;
  var env=expSimulateMaxima(s.vars||'');
  var real = (typeof window!=='undefined') ? window._expLastRealPreview : null;

  /* Afficher les variables simulées (indicatif — approximation JS locale,
     même en aperçu réel : STACK ne renvoie pas de dictionnaire de variables
     via /render, seul le texte déjà substitué est disponible) */
  var varsEl=document.getElementById('exp-preview-vars');
  if(varsEl){
    varsEl.innerHTML=Object.keys(env).map(function(k){
      return '<span class="exp-pv-chip"><b>'+k+'</b> = '+env[k]+'</span>';
    }).join('');
  }

  var badgeEl=document.getElementById('exp-preview-badge');
  if(badgeEl){
    if(real && real.bodyHTML){
      badgeEl.textContent='🟢 '+I18N.t('common.preview_real_badge');
      badgeEl.style.background='#ecfdf5'; badgeEl.style.color='#047857';
    } else {
      badgeEl.textContent='🎲 '+I18N.t('common.preview_sim_badge');
      badgeEl.style.background='#f1f5f9'; badgeEl.style.color='#475569';
    }
  }

  /* Énoncé — rendu réel (Maxima) si disponible, sinon simulation JS locale */
  var contentEl=document.getElementById('exp-preview-content');
  if(contentEl){
    contentEl.innerHTML = (real && real.bodyHTML)
      ? real.bodyHTML
      : _expReplaceStackTags(expGetQtextValue()||'<em>(vide)</em>', env);
    _expKatexRender(contentEl);
  }

  /* Feedback général — toujours simulé localement : contenu librement rédigé
     par l'enseignant, non réductible à "la solution attendue" (contrairement
     aux autres types, STACK ne renvoie aucun <generalfeedback> rendu via
     /render ou /grade pour ce cas). */
  var gfbEl=document.getElementById('exp-preview-gfb');
  if(gfbEl){
    var gfbHtml=applyFbBox('general', expGetGfbValue()||'')||'<em>(vide)</em>';
    gfbEl.innerHTML=_expReplaceStackTags(gfbHtml, env);
    _expKatexRender(gfbEl);
  }

  /* Feedbacks de chaque PRT — feedback réel du chemin "réponse correcte"
     (via /grade) quand disponible, sinon repli sur les feedbacks vrai/faux
     simulés de chaque nœud */
  var prtEl=document.getElementById('exp-preview-prt');
  if(prtEl){
    var rows=[];
    (s.prts||[]).forEach(function(prt){
      if(real && real.prtByName && real.prtByName[prt.name]){
        rows.push({html:real.prtByName[prt.name], real:true});
      } else {
        (prt.nodes||[]).forEach(function(n){
          if(n.truefeedback)  rows.push({html:applyFbBox(inferFbKind(n,'true'),  n.truefeedback), real:false});
          if(n.falsefeedback) rows.push({html:applyFbBox(inferFbKind(n,'false'), n.falsefeedback), real:false});
        });
      }
    });
    prtEl.innerHTML = rows.length
      ? rows.map(function(r){ return r.real ? r.html : _expReplaceStackTags(r.html, env); }).join('')
      : '<em>(vide)</em>';
    _expKatexRender(prtEl);
  }
}

/* ── JSXGraph / Géo2D / Géo3D dans les zones riches expert ───────── */
function expOpenJsx(zoneId){
  /* Pointer _verifZoneActive sur la zone contenteditable ciblée */
  _verifZoneActive = document.getElementById(zoneId);
  if(typeof openJsxGraphModal==='function') openJsxGraphModal();
}

function expOpenGeo2d(zoneId){
  _verifZoneActive = document.getElementById(zoneId);
  if(typeof openGeo2dModal==='function') openGeo2dModal();
}

function expOpenGeo3d(zoneId){
  _verifZoneActive = document.getElementById(zoneId);
  if(typeof openGeo3dModal==='function') openGeo3dModal();
}

/* ── Auto-grow textarea ─────────────────────────────────────────── */
function expAutoGrow(el){
  el.style.height='auto';
  el.style.height=(el.scrollHeight+2)+'px';
}
/* Déclencher sur les zones déjà remplies (ex: restore d'état) */
function expAutoGrowAll(){
  document.querySelectorAll('.exp-autogrow').forEach(expAutoGrow);
}

/* ── HTML escape ─────────────────────────────────────────────────── */
function _ee(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── Default state ───────────────────────────────────────────────── */
function expertDefaultState(qid){
  var n = qid||1;
  return {
    name:'', bareme:1, penalty:0,
    questionnote:'{@ta'+n+'@}',
    vars:'ta'+n+':1+rand(9);',
    questiontext:'<p>Énoncé de la question.</p>\n<p>[[input:ans1]] [[validation:ans1]]</p>',
    generalfeedback:'',
    inputs:[{
      name:'ans1', type:'algebraic', tans:'ta'+n,
      boxsize:15, strictsyntax:1, insertstars:0, syntaxhint:'',
      forbidwords:'', allowwords:'', forbidfloat:1,
      requirelowestterms:0, checkanswertype:0, mustverify:1,
      showvalidation:1, options:''
    }],
    prts:[{
      name:'prt1', value:1, autosimplify:1, feedbackstyle:2,
      feedbackvariables:'',
      nodes:[{
        name:'0', description:'',
        answertest:'AlgEquiv', sans:'ans1', tans:'ta'+n,
        testoptions:'', quiet:0,
        truescoremode:'=', truescore:'1', truepenalty:'',
        truenextnode:'-1', trueanswernote:'prt1-1-T',
        truefeedback:'<p>Bonne réponse !</p>',
        falsescoremode:'=', falsescore:'0', falsepenalty:'',
        falsenextnode:'-1', falseanswernote:'prt1-1-F',
        falsefeedback:'<p>Réponse incorrecte.</p>'
      }]
    }]
  };
}

/* ── Tab switching ───────────────────────────────────────────────── */
function expertShowTab(tabId){
  document.querySelectorAll('#fp-expert .exp-tab').forEach(function(b){
    b.classList.toggle('active', b.dataset.tab===tabId);
  });
  document.querySelectorAll('#fp-expert .exp-panel').forEach(function(p){
    p.hidden = (p.id !== 'exp-panel-'+tabId);
  });
}

/* ── Simple get/set helpers ──────────────────────────────────────── */
function _sv(id,val){ var el=document.getElementById(id); if(el) el.value=String(val==null?'':val); }
function _gv(id){ var el=document.getElementById(id); return el?el.value:''; }

/* ── Éditeur riche inline pour l'énoncé ─────────────────────────── */
var _expQtextCodeMode = false;

function expertInitQtextRich(html){
  var tb = document.getElementById('exp-qtext-tb');
  /* Injecter la toolbar une seule fois — verifCreateToolbar cible exp-qtext-rich */
  if(tb && !tb.querySelector('.rich-toolbar')){
    var tbHtml = (typeof verifCreateToolbar==='function')
      ? verifCreateToolbar('exp-qtext-rich')
      : '<div class="rich-toolbar"></div>';
    /* Insérer le bouton JSXGraph + Code juste avant le dernier </div> de la toolbar */
    tbHtml = tbHtml.replace(/<\/div>\s*$/, function(m){
      return '<div class="rtb-sep"></div>'
        + '<button class="rtb" onclick="verifExecR(\'exp-qtext-rich\',\'formatBlock\',\'<h3>\')" title="'+_ee(I18N.t('rtb.h3'))+'">H3</button>'
        + '<button class="rtb" onclick="verifExecR(\'exp-qtext-rich\',\'formatBlock\',\'<h4>\')" title="'+_ee(I18N.t('rtb.h4'))+'">H4</button>'
        + '<button class="rtb" onclick="verifExecR(\'exp-qtext-rich\',\'formatBlock\',\'<h5>\')" title="'+_ee(I18N.t('rtb.h5'))+'">H5</button>'
        + '<div class="rtb-sep"></div>'
        + '<button class="rtb rtb-jxg" onclick="expOpenJsx(\'exp-qtext-rich\')" title="'+_ee(I18N.t('exp.jsx_insert_title'))+'">📊 JSXGraph</button>'
        + '<button class="rtb rtb-geo2d" onclick="expOpenGeo2d(\'exp-qtext-rich\')" title="'+_ee(I18N.t('rtb.geo2d'))+'">'+I18N.t('rtb.geo2d_label')+'</button>'
        + '<button class="rtb rtb-geo3d" onclick="expOpenGeo3d(\'exp-qtext-rich\')" title="'+_ee(I18N.t('rtb.geo3d'))+'">'+I18N.t('rtb.geo3d_label')+'</button>'
        + '<div class="rtb-sep"></div>'
        + '<button class="rtb" id="exp-code-btn" onclick="expToggleQtextCode()" title="'+_ee(I18N.t('exp.toggle_code_title'))+'">'
        + '&#x3C;/&#x3E; '+I18N.t('exp.code_btn')+'</button>' + m;
    });
    /* Remplacer le border-radius de la toolbar pour la coller au-dessus de la zone */
    tbHtml = tbHtml.replace('border-radius:6px 6px 0 0','border-radius:0');
    tb.innerHTML = tbHtml;
  }
  var richEl = document.getElementById('exp-qtext-rich');
  if(richEl){
    richEl.innerHTML = (typeof parseLatexToSpans==='function')
      ? parseLatexToSpans(html||'')
      : (html||'');
  }
  /* Revenir en mode rich */
  _expQtextCodeMode = false;
  var codeEl = document.getElementById('exp-qtext-code');
  if(codeEl){ codeEl.style.display='none'; codeEl.value=''; }
  if(richEl) richEl.style.display='';
  var btn = document.getElementById('exp-code-btn');
  if(btn){ btn.style.background=''; btn.style.color=''; }
}

function expGetQtextValue(){
  var codeEl = document.getElementById('exp-qtext-code');
  var richEl = document.getElementById('exp-qtext-rich');
  if(_expQtextCodeMode && codeEl) return codeEl.value;
  if(richEl) return (typeof spansToLatex==='function') ? spansToLatex(richEl) : richEl.innerHTML;
  return '';
}

function expToggleQtextCode(){
  var richEl = document.getElementById('exp-qtext-rich');
  var codeEl = document.getElementById('exp-qtext-code');
  var btn    = document.getElementById('exp-code-btn');
  if(!richEl||!codeEl) return;
  _expQtextCodeMode = !_expQtextCodeMode;
  if(_expQtextCodeMode){
    codeEl.value = (typeof spansToLatex==='function') ? spansToLatex(richEl) : richEl.innerHTML;
    richEl.style.display = 'none';
    codeEl.style.display = '';
    codeEl.style.flex = '1';
    if(btn){ btn.style.background='#7c3aed'; btn.style.color='#fff'; btn.style.borderColor='#7c3aed'; }
    setTimeout(function(){ codeEl.focus(); },30);
  } else {
    var code = codeEl.value;
    richEl.innerHTML = (typeof parseLatexToSpans==='function') ? parseLatexToSpans(code) : code;
    codeEl.style.display = 'none';
    richEl.style.display = '';
    if(btn){ btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }
  }
}

/* ── Éditeur riche inline pour le feedback général ──────────────── */
var _expGfbCodeMode = false;

function expertInitGfbRich(html){
  var tb = document.getElementById('exp-gfb-tb');
  if(tb && !tb.querySelector('.rich-toolbar')){
    var tbHtml = (typeof verifCreateToolbar==='function')
      ? verifCreateToolbar('exp-gfb-rich')
      : '<div class="rich-toolbar"></div>';
    tbHtml = tbHtml.replace(/<\/div>\s*$/, function(m){
      return '<div class="rtb-sep"></div>'
        + '<button class="rtb" onclick="verifExecR(\'exp-gfb-rich\',\'formatBlock\',\'<h3>\')" title="'+_ee(I18N.t('rtb.h3'))+'">H3</button>'
        + '<button class="rtb" onclick="verifExecR(\'exp-gfb-rich\',\'formatBlock\',\'<h4>\')" title="'+_ee(I18N.t('rtb.h4'))+'">H4</button>'
        + '<button class="rtb" onclick="verifExecR(\'exp-gfb-rich\',\'formatBlock\',\'<h5>\')" title="'+_ee(I18N.t('rtb.h5'))+'">H5</button>'
        + '<div class="rtb-sep"></div>'
        + '<button class="rtb rtb-jxg" onclick="expOpenJsx(\'exp-gfb-rich\')" title="'+_ee(I18N.t('exp.jsx_insert_title'))+'">📊 JSXGraph</button>'
        + '<button class="rtb rtb-geo2d" onclick="expOpenGeo2d(\'exp-gfb-rich\')" title="'+_ee(I18N.t('rtb.geo2d'))+'">'+I18N.t('rtb.geo2d_label')+'</button>'
        + '<button class="rtb rtb-geo3d" onclick="expOpenGeo3d(\'exp-gfb-rich\')" title="'+_ee(I18N.t('rtb.geo3d'))+'">'+I18N.t('rtb.geo3d_label')+'</button>'
        + '<div class="rtb-sep"></div>'
        + '<button class="rtb" id="exp-gfb-code-btn" onclick="expToggleGfbCode()" title="'+_ee(I18N.t('exp.toggle_code_title'))+'">'
        + '&#x3C;/&#x3E; '+I18N.t('exp.code_btn')+'</button>' + m;
    });
    tbHtml = tbHtml.replace('border-radius:6px 6px 0 0','border-radius:0');
    tb.innerHTML = tbHtml;
  }
  var richEl = document.getElementById('exp-gfb-rich');
  if(richEl){
    richEl.innerHTML = (typeof parseLatexToSpans==='function')
      ? parseLatexToSpans(html||'')
      : (html||'');
  }
  _expGfbCodeMode = false;
  var codeEl = document.getElementById('exp-gfb-code');
  if(codeEl){ codeEl.style.display='none'; codeEl.value=''; }
  if(richEl) richEl.style.display='';
  var btn = document.getElementById('exp-gfb-code-btn');
  if(btn){ btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }
}

function expGetGfbValue(){
  var codeEl = document.getElementById('exp-gfb-code');
  var richEl = document.getElementById('exp-gfb-rich');
  if(_expGfbCodeMode && codeEl) return codeEl.value;
  if(richEl) return (typeof spansToLatex==='function') ? spansToLatex(richEl) : richEl.innerHTML;
  return '';
}

function expToggleGfbCode(){
  var richEl = document.getElementById('exp-gfb-rich');
  var codeEl = document.getElementById('exp-gfb-code');
  var btn    = document.getElementById('exp-gfb-code-btn');
  if(!richEl||!codeEl) return;
  _expGfbCodeMode = !_expGfbCodeMode;
  if(_expGfbCodeMode){
    codeEl.value = (typeof spansToLatex==='function') ? spansToLatex(richEl) : richEl.innerHTML;
    richEl.style.display = 'none';
    codeEl.style.display = '';
    codeEl.style.flex = '1';
    if(btn){ btn.style.background='#7c3aed'; btn.style.color='#fff'; btn.style.borderColor='#7c3aed'; }
    setTimeout(function(){ codeEl.focus(); },30);
  } else {
    var code = codeEl.value;
    richEl.innerHTML = (typeof parseLatexToSpans==='function') ? parseLatexToSpans(code) : code;
    codeEl.style.display = 'none';
    richEl.style.display = '';
    if(btn){ btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }
  }
}

/* ── Repli inline au moment de réinitialiser ────────────────────── */
function expertResetInline(){
  if(_prtInlineCurrentIdx!==null) expertCollapseInlinePrt(_prtInlineCurrentIdx);
}

/* ── Init (called by openConfigPanel) ───────────────────────────── */
function expertInit(qid){
  expertResetInline();
  if(!questions[qid]) questions[qid]={id:qid,type:'expert'};
  var q=questions[qid];
  if(!q._expertState){
    q._expertState = (q.state && q.state._expert) ? q.state._expert : expertDefaultState(qid);
  }
  var s=q._expertState;

  _sv('exp-bareme', s.bareme||1);
  _sv('exp-qnote',  s.questionnote||'');
  _sv('exp-vars',   s.vars||'');

  expertInitQtextRich(s.questiontext||'');
  expertInitGfbRich(s.generalfeedback||'');
  expertRenderInputs(s.inputs||[]);
  expertRenderPrts(qid, s.prts||[]);
  expertShowTab('meta');
  /* Auto-size les textareas déjà remplies */
  setTimeout(expAutoGrowAll, 20);
}

/* ── Capture live form → _expertState ───────────────────────────── */
function expertCaptureToState(qid){
  var q=questions[qid||_activeQid]; if(!q||!q._expertState) return;
  var s=q._expertState;
  s.bareme        = parseFloat(_gv('exp-bareme'))||1;
  s.questionnote  = _gv('exp-qnote');
  s.vars          = _gv('exp-vars');
  s.questiontext    = expGetQtextValue();
  s.generalfeedback = expGetGfbValue();
}

/* ── captureState hook (called by config-panel.js) ──────────────── */
function expertCaptureState(){
  expertCaptureToState(_activeQid);
  var q=questions[_activeQid];
  return { type:'expert', _expert: (q&&q._expertState) ? q._expertState : expertDefaultState() };
}

/* ── restoreState hook ───────────────────────────────────────────── */
function expertRestoreState(s){
  var q=questions[_activeQid]; if(!q) return;
  if(s&&s._expert){
    q._expertState=s._expert;
    expertInit(_activeQid);
  }
}

/* ════════════════════════════════════════════════════════════════════
   INPUTS
   ════════════════════════════════════════════════════════════════════ */

function expertRenderInputs(inputs){
  var c=document.getElementById('exp-inputs-list'); if(!c) return;
  c.innerHTML = inputs.map(expertInputCard).join('');
}

function expertInputCard(inp,i){
  var t = inp.type||'algebraic';
  var typeOpts = EXPERT_INPUT_TYPES.map(function(x){
    return '<option value="'+x+'"'+(t===x?' selected':'')+'>'+x+'</option>';
  }).join('');

  return '<div class="exp-card" id="exp-inp-'+i+'">'
    +'<div class="exp-card-hd">'
      +'<span class="exp-card-title">Input '+(i+1)+' &mdash; <code>'+_ee(inp.name)+'</code></span>'
      +'<button type="button" class="exp-card-del" onclick="expertRemoveInput('+i+')" title="'+_ee(I18N.t('common.supprimer'))+'">✕</button>'
    +'</div>'
    +'<div class="exp-card-body">'

      /* ── Ligne 1 : identité */
      +'<div class="exp-row3">'
        +'<div><label class="cfg-lbl" for="exp-inp-name-'+i+'">'+I18N.t('exp.input_name_lbl')+'</label>'
          +'<input id="exp-inp-name-'+i+'" class="hs-input exp-mono" value="'+_ee(inp.name)+'" '
          +'onchange="expertUpdateInput('+i+',\'name\',this.value);document.querySelector(\'#exp-inp-'+i+' code\').textContent=this.value"></div>'
        +'<div><label class="cfg-lbl" for="exp-inp-type-'+i+'">'+I18N.t('exp.input_type_lbl')+'</label>'
          +'<select id="exp-inp-type-'+i+'" class="hs-input" onchange="expertUpdateInput('+i+',\'type\',this.value)">'+typeOpts+'</select></div>'
        +'<div><label class="cfg-lbl" for="exp-inp-tans-'+i+'">'+I18N.t('exp.input_tans_lbl')+'</label>'
          +'<input id="exp-inp-tans-'+i+'" class="hs-input exp-mono" value="'+_ee(inp.tans)+'" onchange="expertUpdateInput('+i+',\'tans\',this.value)"></div>'
      +'</div>'

      /* ── Ligne 2 : champ et syntaxe */
      +'<div class="exp-row4">'
        +'<div><label class="cfg-lbl" for="exp-inp-boxsize-'+i+'">'+I18N.t('exp.input_boxsize_lbl')+'</label>'
          +'<input id="exp-inp-boxsize-'+i+'" type="number" class="hs-input" min="1" max="80" value="'+(inp.boxsize||15)+'" onchange="expertUpdateInput('+i+',\'boxsize\',+this.value)"></div>'
        +'<div><label class="cfg-lbl" for="exp-inp-syntaxhint-'+i+'">'+I18N.t('exp.input_syntaxhint_lbl')+'</label>'
          +'<input id="exp-inp-syntaxhint-'+i+'" class="hs-input exp-mono" value="'+_ee(inp.syntaxhint||'')+'" placeholder="'+_ee(I18N.t('exp.input_syntaxhint_ph'))+'" onchange="expertUpdateInput('+i+',\'syntaxhint\',this.value)"></div>'
        +'<div><label class="cfg-lbl" for="exp-inp-forbidwords-'+i+'">'+I18N.t('exp.input_forbidwords_lbl')+'</label>'
          +'<input id="exp-inp-forbidwords-'+i+'" class="hs-input exp-mono" value="'+_ee(inp.forbidwords||'')+'" placeholder="cos,sin,[[BASIC-TRIG]]" onchange="expertUpdateInput('+i+',\'forbidwords\',this.value)"></div>'
        +'<div><label class="cfg-lbl" for="exp-inp-allowwords-'+i+'">'+I18N.t('exp.input_allowwords_lbl')+'</label>'
          +'<input id="exp-inp-allowwords-'+i+'" class="hs-input exp-mono" value="'+_ee(inp.allowwords||'')+'" placeholder="Sin,myFunc" onchange="expertUpdateInput('+i+',\'allowwords\',this.value)"></div>'
      +'</div>'

      /* ── Options complètes par sections */
      +'<div class="exp-opts-panel" id="exp-inp-opts-'+i+'">'+expertInputOptsHtml(inp,i)+'</div>'

    +'</div>'
  +'</div>';
}

/* ── Cases d'options compactes selon le type ─────────────────── */
function expertInputOptsHtml(inp, i){
  var t = inp.type||'algebraic';
  var parsed = _parseAdvOpts(inp.options||'');
  var isMCQ = ['radio','checkbox','dropdown'].indexOf(t)>=0;
  var isNum  = t==='numerical';
  var isUnits= t==='units';

  function chk(field, lbl, tip, fromParsed){
    var checked = fromParsed ? !!parsed[field] : !!inp[field];
    var onch = fromParsed
      ? 'expertUpdateAdvOpt('+i+',\''+field+'\',this.checked)'
      : 'expertUpdateInput('+i+',\''+field+'\',this.checked?1:0)';
    return '<label class="exp-chk" title="'+_ee(tip||'')+'">'
      +'<input type="checkbox"'+(checked?' checked':'')+' onchange="'+onch+'">'
      +'<span>'+lbl+'</span></label>';
  }
  function numF(key, lbl, tip){
    var val = parsed[key]!=null ? parsed[key] : '';
    return '<label class="exp-chk exp-chk-num" title="'+_ee(tip||'')+'">'
      +'<span>'+lbl+'</span>'
      +'<input type="number" min="0" max="20" value="'+val+'" placeholder="—" '
      +'onchange="expertUpdateAdvOpt('+i+',\''+key+'\',this.value===\'\'?null:+this.value)">'
    +'</label>';
  }

  /* Select Étoiles (insertstars 0-7) */
  var starsVal = inp.insertstars||0;
  var starsOpts = [
    [0,I18N.t('exp.stars_opt0')],
    [1,I18N.t('exp.stars_opt1')],
    [2,I18N.t('exp.stars_opt2')],
    [3,I18N.t('exp.stars_opt3')],
    [4,I18N.t('exp.stars_opt4')],
    [5,I18N.t('exp.stars_opt5')],
    [6,I18N.t('exp.stars_opt6')],
    [7,I18N.t('exp.stars_opt7')],
  ].map(function(o){ return '<option value="'+o[0]+'"'+(starsVal===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('');

  /* Select Validation (showvalidation 0-3) */
  var showVal = inp.showvalidation!=null ? inp.showvalidation : 1;
  var showOpts = [
    [0,I18N.t('exp.showval_opt0')],
    [1,I18N.t('exp.showval_opt1')],
    [2,I18N.t('exp.showval_opt2')],
    [3,I18N.t('exp.showval_opt3')],
  ].map(function(o){ return '<option value="'+o[0]+'"'+(showVal==o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('');

  var s = '<div class="exp-toggles">';

  /* Communs à tous les types (hors MCQ pur) */
  if(!isMCQ){
    s += '<select class="hs-input exp-sel-inline" title="'+_ee(I18N.t('exp.stars_select_title'))+'" aria-label="'+_ee(I18N.t('exp.stars_select_title'))+'" onchange="expertUpdateInput('+i+',\'insertstars\',+this.value)">'+starsOpts+'</select>';
    s += chk('strictsyntax',I18N.t('exp.opt_strictsyntax_lbl'),I18N.t('exp.opt_strictsyntax_tip'));
    s += chk('forbidfloat',I18N.t('exp.opt_forbidfloat_lbl'),I18N.t('exp.opt_forbidfloat_tip'));
    s += chk('requirelowestterms',I18N.t('exp.opt_requirelowestterms_lbl'),I18N.t('exp.opt_requirelowestterms_tip'));
    s += chk('checkanswertype',I18N.t('exp.opt_checkanswertype_lbl'),I18N.t('exp.opt_checkanswertype_tip'));
    s += chk('allowempty',I18N.t('exp.opt_allowempty_lbl'),I18N.t('exp.opt_allowempty_tip'),true);
  }

  s += '<select class="hs-input exp-sel-inline" title="'+_ee(I18N.t('exp.showval_select_title'))+'" aria-label="'+_ee(I18N.t('exp.showval_select_title'))+'" onchange="expertUpdateInput('+i+',\'showvalidation\',+this.value)">'+showOpts+'</select>';
  s += chk('mustverify',I18N.t('exp.opt_mustverify_lbl'),I18N.t('exp.opt_mustverify_tip'));

  /* Numérique */
  if(isNum || isUnits){
    s += numF('minsf',I18N.t('exp.opt_minsf_lbl'),I18N.t('exp.opt_minsf_tip'));
    s += numF('maxsf',I18N.t('exp.opt_maxsf_lbl'),I18N.t('exp.opt_maxsf_tip'));
    s += numF('mindp',I18N.t('exp.opt_mindp_lbl'),I18N.t('exp.opt_mindp_tip'));
    s += numF('maxdp',I18N.t('exp.opt_maxdp_lbl'),I18N.t('exp.opt_maxdp_tip'));
  }
  if(isNum){
    s += chk('floatnum',I18N.t('exp.opt_floatnum_lbl'),I18N.t('exp.opt_floatnum_tip'),true);
    s += chk('intnum',I18N.t('exp.opt_intnum_lbl'),I18N.t('exp.opt_intnum_tip'),true);
    s += chk('rationalnum',I18N.t('exp.opt_rationalnum_lbl'),I18N.t('exp.opt_rationalnum_tip'),true);
    s += chk('rationalized',I18N.t('exp.opt_rationalized_lbl'),I18N.t('exp.opt_rationalized_tip'),true);
  }

  /* Texte */
  if(t==='string'){
    s += chk('casesensitive',I18N.t('exp.opt_casesensitive_lbl'),I18N.t('exp.opt_casesensitive_tip'),true);
    s += chk('allowempty',I18N.t('exp.opt_allowempty_lbl'),I18N.t('exp.opt_allowempty_tip_str'),true);
  }
  if(t==='notes'){
    s += chk('manualgraded',I18N.t('exp.opt_manualgraded_lbl'),I18N.t('exp.opt_manualgraded_tip'),true);
    s += chk('allowempty',I18N.t('exp.opt_allowempty_lbl'),I18N.t('exp.opt_allowempty_tip_str'),true);
  }
  if(t==='textarea'||t==='equiv'){
    s += chk('allowempty',I18N.t('exp.opt_allowempty_lbl'),I18N.t('exp.opt_allowempty_tip_str'),true);
  }

  /* MCQ */
  if(isMCQ){
    s += chk('shuffle',I18N.t('exp.opt_shuffle_lbl'),I18N.t('exp.opt_shuffle_tip'),true);
    s += chk('nocheck',I18N.t('exp.opt_nocheck_lbl'),I18N.t('exp.opt_nocheck_tip'),true);
    if(t!=='dropdown') s += chk('allowempty',I18N.t('exp.opt_allowempty_lbl'),I18N.t('exp.opt_allowempty_tip_mcq'),true);
  }

  s += '</div>';
  return s;
}

function expertUpdateInput(i,field,val){
  var q=questions[_activeQid];
  if(!q||!q._expertState||!q._expertState.inputs[i]) return;
  q._expertState.inputs[i][field]=val;
  if(field==='type'){
    q._expertState.inputs[i].options='';
    var optsEl=document.getElementById('exp-inp-opts-'+i);
    if(optsEl) optsEl.innerHTML=expertInputOptsHtml(q._expertState.inputs[i],i);
  }
}

function expertAddInput(){
  var q=questions[_activeQid]; if(!q||!q._expertState) return;
  var n=q._expertState.inputs.length+1;
  q._expertState.inputs.push({
    name:'ans'+n, type:'algebraic', tans:'ta'+n,
    boxsize:15, strictsyntax:1, insertstars:0, syntaxhint:'',
    forbidwords:'', allowwords:'', forbidfloat:1,
    requirelowestterms:0, checkanswertype:0, mustverify:1,
    showvalidation:1, options:''
  });
  expertRenderInputs(q._expertState.inputs);
}

function expertRemoveInput(i){
  var q=questions[_activeQid]; if(!q||!q._expertState) return;
  if(q._expertState.inputs.length<=1){ toast(I18N.t('exp.err_min_one_input')); return; }
  q._expertState.inputs.splice(i,1);
  expertRenderInputs(q._expertState.inputs);
}

/* ════════════════════════════════════════════════════════════════════
   PRTs
   ════════════════════════════════════════════════════════════════════ */

function expertRenderPrts(qid, prts){
  var c=document.getElementById('exp-prts-list'); if(!c) return;
  c.innerHTML = prts.map(function(prt,i){ return expertPrtCard(qid,prt,i); }).join('');
  setTimeout(expAutoGrowAll, 10);
}

function expertPrtCard(qid, prt, i){
  var fsLabels={'0':I18N.t('exp.fs_opt0'),'1':I18N.t('exp.fs_opt1'),'2':I18N.t('exp.fs_opt2'),'3':I18N.t('exp.fs_opt3')};
  var fsOpts=['0','1','2','3'].map(function(v){
    return '<option value="'+v+'"'+(String(prt.feedbackstyle||2)===v?' selected':'')+'>'+fsLabels[v]+'</option>';
  }).join('');
  var nodeCount=(prt.nodes||[]).length;

  return '<div class="exp-card exp-prt-card" id="exp-prt-'+i+'">'
    +'<div class="exp-card-hd">'
      +'<span class="exp-card-title">🌳 PRT '+(i+1)+' &mdash; <code>'+_ee(prt.name)+'</code></span>'
      +'<div style="display:flex;gap:6px;align-items:center;">'
        +'<button type="button" id="exp-prt-toggle-'+i+'" class="exp-prt-open"'
          +' onclick="expertExpandInlinePrt('+qid+','+i+')">'+I18N.t('exp.prt_show_tree_btn')+'</button>'
        +'<button type="button" class="exp-card-del" onclick="expertRemovePrt('+i+')" title="'+_ee(I18N.t('common.supprimer'))+'">✕</button>'
      +'</div>'
    +'</div>'
    /* ── Paramètres PRT ── */
    +'<div class="exp-card-body">'
      +'<div class="exp-row3">'
        +'<div><label class="cfg-lbl" for="exp-prt-name-'+i+'">'+I18N.t('exp.prt_name_lbl')+'</label>'
          +'<input id="exp-prt-name-'+i+'" class="hs-input exp-mono" value="'+_ee(prt.name)+'" '
          +'onchange="expertUpdatePrt('+i+',\'name\',this.value);document.querySelector(\'#exp-prt-'+i+' code\').textContent=this.value"></div>'
        +'<div><label class="cfg-lbl" for="exp-prt-value-'+i+'">'+I18N.t('exp.prt_value_lbl')+'</label>'
          +'<input id="exp-prt-value-'+i+'" type="number" class="hs-input" min="0" step="0.1" value="'+(prt.value||1)+'" onchange="expertUpdatePrt('+i+',\'value\',+this.value)"></div>'
        +'<div><label class="cfg-lbl" for="exp-prt-fs-'+i+'" title="'+_ee(I18N.t('exp.prt_feedbackstyle_title'))+'">'+I18N.t('exp.prt_feedbackstyle_lbl')+'</label>'
          +'<select id="exp-prt-fs-'+i+'" class="hs-input" onchange="expertUpdatePrt('+i+',\'feedbackstyle\',+this.value)">'+fsOpts+'</select></div>'
      +'</div>'
      +'<label class="exp-chk" style="margin-bottom:8px;">'
        +'<input type="checkbox" '+(prt.autosimplify?'checked':'')+' onchange="expertUpdatePrt('+i+',\'autosimplify\',this.checked?1:0)">'
        +'<span>Auto-simplify</span></label>'
      +'<div style="display:flex;flex-direction:column;gap:4px;"><label class="cfg-lbl" for="exp-prt-fbvars-'+i+'">'+I18N.t('exp.prt_feedbackvars_lbl')+'</label>'
        +'<textarea id="exp-prt-fbvars-'+i+'" class="hs-input exp-mono exp-autogrow" rows="2" style="resize:none;overflow:hidden;min-height:52px;"'
        +' oninput="expAutoGrow(this);expertUpdatePrt('+i+',\'feedbackvariables\',this.value)"'
        +' onchange="expertUpdatePrt('+i+',\'feedbackvariables\',this.value)">'+_ee(prt.feedbackvariables||'')+'</textarea></div>'
      +'<div class="exp-prt-info">📍 <span id="exp-prt-nodecount-'+i+'">'+nodeCount+'</span> '+I18N.t('exp.prt_node_count_suffix')+'</div>'
    +'</div>'
    /* ── Zone inline du prt-manager (masquée jusqu'au clic) ── */
    +'<div id="exp-prt-slot-'+i+'" class="exp-prt-slot" style="display:none;"></div>'
  +'</div>';
}

function expertUpdatePrt(i,field,val){
  var q=questions[_activeQid];
  if(!q||!q._expertState||!q._expertState.prts[i]) return;
  q._expertState.prts[i][field]=val;
}

function expertAddPrt(){
  var q=questions[_activeQid]; if(!q||!q._expertState) return;
  expertCaptureToState(_activeQid);
  var n=q._expertState.prts.length+1;
  var prtName='prt'+n;
  q._expertState.prts.push({
    name:prtName, value:1, autosimplify:1, feedbackstyle:2, feedbackvariables:'',
    nodes:[{
      name:'0', description:'', answertest:'AlgEquiv', sans:'ans1', tans:'ta1',
      testoptions:'', quiet:0,
      truescoremode:'=', truescore:'1', truepenalty:'',
      truenextnode:'-1', trueanswernote:prtName+'-1-T', truefeedback:'<p>Correct !</p>',
      falsescoremode:'=', falsescore:'0', falsepenalty:'',
      falsenextnode:'-1', falseanswernote:prtName+'-1-F', falsefeedback:'<p>Incorrect.</p>'
    }]
  });
  expertRenderPrts(_activeQid, q._expertState.prts);
}

function expertRemovePrt(i){
  var q=questions[_activeQid]; if(!q||!q._expertState) return;
  if(q._expertState.prts.length<=1){ toast(I18N.t('exp.err_min_one_prt')); return; }
  q._expertState.prts.splice(i,1);
  expertRenderPrts(_activeQid, q._expertState.prts);
}

/* ════════════════════════════════════════════════════════════════════
   PRT INLINE — transplante le corps du prt-manager dans la carte PRT
   ════════════════════════════════════════════════════════════════════ */
var _prtInlineCurrentIdx = null; // index PRT actuellement ouvert inline

function expertExpandInlinePrt(qid, prtIdx){
  var q=questions[qid]; if(!q||!q._expertState) return;
  expertCaptureToState(qid);

  /* Replier si déjà ouvert */
  if(_prtInlineCurrentIdx===prtIdx){ expertCollapseInlinePrt(prtIdx); return; }
  if(_prtInlineCurrentIdx!==null) expertCollapseInlinePrt(_prtInlineCurrentIdx);

  var prt=q._expertState.prts[prtIdx]; if(!prt) return;

  /* Sérialiser le PRT en XML pour prt-manager */
  q.prtXML = buildPrtXml(
    { name:prt.name, value:String(prt.value||1),
      autosimplify:String(prt.autosimplify===0?0:1),
      feedbackstyle:String(prt.feedbackstyle||2),
      feedbackvariables:prt.feedbackvariables||'' },
    prt.nodes||[]
  );
  q._editingExpertPrtIdx = prtIdx;
  _prtInlineCurrentIdx = prtIdx;
  _prtInlineMode = true;

  /* Transplanter le corps du prt-manager dans la zone inline */
  var body = document.getElementById('prt-mngr-body-el');
  var slot = document.getElementById('exp-prt-slot-'+prtIdx);
  if(!body||!slot){ _prtInlineMode=false; return; }
  slot.innerHTML='';
  /* Mini-barre d'outils inline */
  var bar = document.createElement('div');
  bar.className='exp-prt-inline-bar';
  bar.innerHTML=
    '<span style="font-size:.8rem;font-weight:700;color:#a78bfa;">'+_ee(I18N.t('exp.prt_tree_title',{name:prt.name}))+'</span>'
   +'<button class="prt-hdr-btn prt-hdr-tidy"  onclick="prtTidy()">⟳ '+_ee(I18N.t('prt.tidy_label'))+'</button>'
   +'<button class="prt-hdr-btn prt-hdr-reset" onclick="prtResetLayout()">⊞ Reset</button>'
   +'<button class="prt-hdr-btn prt-hdr-add"   onclick="prtAddNode()">'+I18N.t('exp.prt_add_node_btn')+'</button>'
   +'<button class="prt-hdr-btn prt-hdr-save"  onclick="savePrtManager()" style="margin-left:auto;">'+I18N.t('exp.prt_apply_btn')+'</button>';
  slot.appendChild(bar);
  slot.appendChild(body);
  slot.style.display='block';

  /* Initialiser l'état prt-manager */
  var parsed=parsePrtXml(q.prtXML); if(!parsed){ expertCollapseInlinePrt(prtIdx); return; }
  _prtQid=qid; _prtMeta=parsed.meta;
  _prtNodes=parsed.nodes.map(function(n){ return Object.assign({},n); });
  _prtSelectedNode=-1; _prtPos=[]; _prtDrag=null;
  _prtInitLayout();
  renderPrtSvg();
  renderNodeEditorPlaceholder();

  /* Mettre à jour le bouton */
  var btn=document.getElementById('exp-prt-toggle-'+prtIdx);
  if(btn){ btn.textContent=I18N.t('exp.prt_hide_tree_btn'); btn.style.background='#f0fdf4'; }
}

function expertCollapseInlinePrt(prtIdx){
  if(prtIdx===undefined) prtIdx=_prtInlineCurrentIdx;
  if(prtIdx===null||prtIdx===undefined) return;

  /* Remettre le body dans le modal d'origine */
  var body=document.getElementById('prt-mngr-body-el');
  var modal=document.getElementById('prt-manager-modal');
  if(body&&modal&&!modal.contains(body)){
    var box=modal.querySelector('.prt-mngr-box');
    if(box) box.appendChild(body);
  }

  /* Vider le slot */
  var slot=document.getElementById('exp-prt-slot-'+prtIdx);
  if(slot) slot.style.display='none';

  /* Bouton */
  var btn=document.getElementById('exp-prt-toggle-'+prtIdx);
  if(btn){ btn.textContent=I18N.t('exp.prt_show_tree_btn'); btn.style.background=''; }

  _prtInlineMode=false;
  _prtInlineCurrentIdx=null;
  _prtQid=null; _prtNodes=[]; _prtMeta={}; _prtSelectedNode=-1;
  _prtPos=[]; if(typeof _prtDrag!=='undefined') _prtDrag=null;
}

/* ── Sync inline (pas de fermeture, pas de réouverture) ─────────── */
function _expertSyncPrtInline(qid, newPrtXml){
  var q=questions[qid];
  if(!q||q.type!=='expert'||q._editingExpertPrtIdx===undefined) return;
  var idx=q._editingExpertPrtIdx;
  var parsed=parsePrtXml(newPrtXml); if(!parsed) return;
  if(!q._expertState) q._expertState=expertDefaultState(qid);
  var existing=q._expertState.prts[idx]||{};
  q._expertState.prts[idx]=Object.assign({},existing,parsed.meta,{nodes:parsed.nodes});
  /* Mettre à jour le compteur de nœuds dans la carte */
  var info=document.querySelector('#exp-prt-'+idx+' .exp-prt-info');
  if(info) info.textContent='📍 '+parsed.nodes.length+' '+I18N.t('exp.prt_node_count_suffix');
}

/* ── Sync modal (flow classique stack-raw ou expert en modal) ────── */
function _expertSyncPrt(qid, newPrtXml){
  var q=questions[qid];
  if(!q||q.type!=='expert'||q._editingExpertPrtIdx===undefined) return;
  var idx=q._editingExpertPrtIdx;
  var parsed=parsePrtXml(newPrtXml); if(!parsed) return;
  if(!q._expertState) q._expertState=expertDefaultState(qid);
  var existing=q._expertState.prts[idx]||{};
  q._expertState.prts[idx]=Object.assign({},existing,parsed.meta,{nodes:parsed.nodes});
  q._editingExpertPrtIdx=undefined;
  setTimeout(function(){ openConfigPanel(qid,'expert'); },60);
}

/* ════════════════════════════════════════════════════════════════════
   CONVERT stack-raw → expert
   ════════════════════════════════════════════════════════════════════ */
function convertStackRawToExpert(qid){
  var q=questions[qid];
  if(!q||q.type!=='stack-raw'){ toast(I18N.t('exp.err_not_stackraw')); return; }

  var parser=new DOMParser();
  var raw=q.rawXml||'<root/>';
  var doc=parser.parseFromString(raw,'application/xml');

  function gt(sel,fb){ var el=doc.querySelector(sel); return el?(el.textContent||'').trim():(fb||''); }

  /* Inputs */
  var inputs=[];
  doc.querySelectorAll('question > input').forEach(function(el){
    function gti(s,fb){ var f=el.querySelector(s); return f?(f.textContent||'').trim():(fb||''); }
    inputs.push({
      name:gti('name','ans1'), type:gti('type','algebraic'), tans:gti('tans',''),
      boxsize:parseInt(gti('boxsize','15'))||15,
      strictsyntax:parseInt(gti('strictsyntax','1')),
      insertstars:parseInt(gti('insertstars','0')),
      syntaxhint:gti('syntaxhint',''), forbidwords:gti('forbidwords',''),
      allowwords:gti('allowwords',''),
      forbidfloat:parseInt(gti('forbidfloat','1')),
      requirelowestterms:parseInt(gti('requirelowestterms','0')),
      checkanswertype:parseInt(gti('checkanswertype','0')),
      mustverify:parseInt(gti('mustverify','1')),
      showvalidation:parseInt(gti('showvalidation','1')),
      options:gti('options','')
    });
  });
  if(!inputs.length) inputs=expertDefaultState(qid).inputs;

  /* PRTs */
  var prts=[];
  (q.prtNames||[]).forEach(function(prtName){
    var prtXml=(q.prtXmls&&q.prtXmls[prtName])||'';
    if(prtXml){
      var parsed=parsePrtXml(prtXml);
      if(parsed){ prts.push(Object.assign({},parsed.meta,{nodes:parsed.nodes})); return; }
    }
    prts.push({name:prtName,value:1,autosimplify:1,feedbackstyle:2,feedbackvariables:'',nodes:[]});
  });
  if(!prts.length) prts=expertDefaultState(qid).prts;

  var expertState={
    name:q.name||'',
    bareme:parseFloat(gt('defaultgrade','1'))||1,
    penalty:parseFloat(gt('penalty','0'))||0,
    questionnote:gt('questionnote text',''),
    vars:gt('questionvariables text',''),
    questiontext:q.qtext||gt('questiontext text',''),
    generalfeedback:gt('generalfeedback text',''),
    inputs:inputs, prts:prts
  };

  q.type='expert';
  q._expertState=expertState;
  q.state={type:'expert',_expert:expertState};

  /* Mettre à jour le chip */
  var chip=document.querySelector('.q-chip[data-qid="'+qid+'"]');
  if(chip){
    var use=chip.querySelector('use');
    if(use) use.setAttribute('href','#ico-type-expert');
    chip.style.background='#7c3aed22';
  }

  updateChipStatus(qid,true);
  saveEditorState();
  toast(I18N.t('exp.toast_converted',{prts:prts.length,inputs:inputs.length}));
  openConfigPanel(qid,'expert');
}
