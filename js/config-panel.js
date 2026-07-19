// config-panel.js — V4 configuration panel: open/close, captureState, restoreState, resetForm, save

var _activeQid = null;

// ── MODAL VISIBILITY ──────────────────────────────────────────────
function openConfigPanel(qid, type) {
  _activeQid = qid;
  currentType = type;

  // Update modal title
  var titleEl = document.getElementById('config-panel-title');
  if (titleEl) {
    var color = COLORS[type] || '#64748b';
    var ico = TYPE_ICON_MAP ? (TYPE_ICON_MAP[type] || type) : type;
    titleEl.innerHTML = '<svg class="hs-ico" style="color:' + color + '" aria-hidden="true"><use href="#ico-type-' + ico + '"></use></svg> '
      + 'Q' + qid + ' &middot; ' + (LABELS_PLAIN[type] || type).replace(/^[^\s]+\s/, '');
  }

  // Hide all form panels, show the correct one
  document.querySelectorAll('.form-panel').forEach(function(el) {
    el.style.display = 'none';
  });
  var fp = document.getElementById('fp-' + type);
  if (fp) fp.style.display = 'block';

  // Restore saved state or reset form
  var q = questions[qid];
  if (q && q.state) {
    restoreState(q.state);
  } else {
    resetFormForType(type);
  }

  // Rendu direct apercu crossword (bypass guards _hsWireSimplePreview)
  if (type === 'crossword') {
    setTimeout(function() {
      var _cwCont = document.getElementById('cw-preview-container');
      if (!_cwCont) { _cwCont = document.getElementById('cw-preview-container'); }
      try {
        var _cwHtml = renderPreviewHTML_cw(captureState());
        mountPreviewIframe('cw-preview-container', _cwHtml);
      } catch(_cwErr) {
        if (_cwCont) _cwCont.innerHTML = '<div style="font-family:sans-serif;padding:8px;color:#c00;font-size:.85rem;"><b>DEBUG:</b> ' + String(_cwErr) + '</div>';
      }
    }, 150);
  }

  // Open modal
  var modal = document.getElementById('q-config-modal');
  if (modal) {
    modal.classList.toggle('expert-fs', type === 'expert');
    modal.style.display = 'flex';
    if (typeof FocusTrap !== 'undefined') FocusTrap.trap(modal, closeConfigPanel);
    if (type === 'stack-raw' && typeof stackRawInit === 'function') {
      setTimeout(function(){ stackRawInit(qid); }, 0);
    } else if (type === 'expert' && typeof expertInit === 'function') {
      setTimeout(function(){ expertInit(qid); }, 0);
    } else if (fp) {
      var first = fp.querySelector('input:not([type=hidden]),select,textarea,[contenteditable]');
      if (first) setTimeout(function(){ try { first.focus(); } catch(e) {} }, 50);
    }
  }
}

function closeConfigPanel() {
  _activeQid = null;
  currentType = null;
  var modal = document.getElementById('q-config-modal');
  if (modal) { modal.style.display = 'none'; modal.classList.remove('expert-fs'); }
  if (typeof FocusTrap !== 'undefined') FocusTrap.release();
}

// ── GÉNÉRATION + STOCKAGE (partagé entre "Enregistrer" et "Arbre PRT") ──
// Recalcule la question depuis le formulaire courant et la stocke dans
// questions[qid], sans fermer le panneau. Retourne les parts générées, ou
// null si la génération a échoué (un toast d'erreur a déjà été affiché).
async function _generateAndStoreQuestion(qid, type) {
  if (!qid || !type) { toast('Aucune question active.'); return null; }

  if (typeof validateCurrentType === 'function' && !validateCurrentType()) {
    toast(I18N.t('msg.champs_obligatoires'));
    return null;
  }

  var W = window;
  var genMap = {
    checkbox: W.genCheckbox, radio: W.genRadio, dropdown: W.genDropdown,
    algebraic: W.genAlgebraic, numerical: W.genNumerical, units: W.genUnits,
    string: W.genString, match: W.genMatch, crossword: W.genCrossword, doi: W.genDOI,
    chemical: W.genChemical, chemical_topo: W.genChemicalTopo, nuclear: W.genNuclear,
    composition: W.genComposition, jxgdrop: W.genJxgDrop, vf: W.genVF, ord: W.genOrd,
    imgclick: W.genImgClick, glr: W.genGLR, rvbcmj: W.genRvbCmj, optique: W.genOptique, 'acide-base': W.genAcideBase, 'redox': W.genRedox, 'basen': W.genBasen, 'circuit': W.genCircuit, 'logique': W.genLogique, 'complexe': W.genComplexe, 'calcul': W.genCalcul, 'statistiques': W.genStatistiques, 'matrices': W.genMatrices, 'geometrie': W.genGeometrie, 'suites': W.genSuites, 'probabilites': W.genProbabilites, 'trigonometrie': W.genTrigonometrie, 'polynomes': W.genPolynomes, 'equivalence': W.genEquivalence, 'limites': W.genLimites, 'physique': W.genPhysique, 'oscilloscope': W.genOscilloscope, 'inequation': W.genInequation, 'thermo': W.genThermo, 'diffraction': W.genDiffraction, 'image-mesure': W.genImageMesure, 'apn': W.genApn,
    'stack-raw': W.genStackRaw,
    'expert': W.genExpert,
    'geogebra': W.genGeoGebra
  };

  var gen = genMap[type];
  if (!gen) { toast('❌ Générateur introuvable pour ' + type); return null; }

  var parts;
  try {
    parts = await gen(qid);
  } catch(e) {
    toast('❌ gen() : ' + e.message);
    console.error('_generateAndStoreQuestion gen() error:', e);
    return null;
  }

  if (!parts) { toast('❌ Le générateur a retourné undefined'); return null; }

  var state = captureState();
  questions[qid] = Object.assign({ id: qid, type: type }, parts, { state: state });

  updateChipStatus(qid, true);
  saveEditorState();
  return parts;
}

// ── SAVE ──────────────────────────────────────────────────────────
async function saveConfig() {
  try {
    var qid = _activeQid;
    var type = currentType;
    var parts = await _generateAndStoreQuestion(qid, type);
    if (!parts) return;
    toast('✅ Question Q' + qid + ' enregistrée (' + (parts.bareme || 0) + ' pt)');
    closeConfigPanel();
  } catch(e) {
    toast('❌ saveConfig : ' + e.message);
    console.error('saveConfig global error:', e);
  }
}

// ── ARBRE PRT depuis le panneau de config ───────────────────────────
// Le PRT est déjà du JSON généré en direct par le générateur (comme le
// reste de la question) : pas besoin d'un "Enregistrer" manuel préalable,
// on régénère silencieusement depuis le formulaire courant puis on ouvre
// l'éditeur d'arbre.
async function openPrtManagerFromConfig() {
  var qid = _activeQid;
  var type = currentType;
  if (!qid || !type) { toast('Aucune question active.'); return; }

  // stack-raw / expert gèrent déjà leur propre synchronisation PRT en direct.
  if (type === 'stack-raw' || type === 'expert') { openPrtManager(qid); return; }

  try {
    var parts = await _generateAndStoreQuestion(qid, type);
    if (!parts) return;
  } catch(e) {
    toast('❌ ' + e.message);
    console.error('openPrtManagerFromConfig error:', e);
    return;
  }
  openPrtManager(qid);
}

// ── DELETE ─────────────────────────────────────────────────────────
function deleteConfig() {
  var qid = _activeQid;
  if (!qid) return;
  if (!confirm(I18N.t('msg.confirm_del_q') + qid + ' ?')) return;
  removeChip(qid);
  saveEditorState();
  closeConfigPanel();
  toast('Question Q' + qid + ' supprimée.');
}

// ── CAPTURE STATE (adapted from V3 app.js) ───────────────────────
function captureState() {
  var t = currentType;
  var s = { type: t };
  switch(t) {
    case 'checkbox':
      s.bareme=v('cb-bareme');s.text=richVal('cb-text');s.xe=v('cb-xe');s.mXb=v('cb-mode-xb');s.xb=v('cb-xb');
      s.fbc=richVal('cb-fbc');s.fbe=richVal('cb-fbe');s.fbGen=richVal('cb-fbgen');
      s.showOubli=document.getElementById('cb-show-oubli')?.checked||false;
      s.fbGenShowFb=document.getElementById('cb-fbgen-showfb')?.checked||false;
      s.props=[];
      document.querySelectorAll('#cb-props .prop-row').forEach(function(r){
        s.props.push({isV:r.querySelector('.p-bool').value==='true',text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value,fb2:r.querySelector('.p-fb2')?.value||''});
      });
      break;
    case 'radio':
      s.bareme=v('ra-bareme');s.text=richVal('ra-text');s.xe=v('ra-xe');s.vrais=[];s.faux=[];
      s.fbGen=richVal('ra-fbgen');
      s.fbGenShowFb=document.getElementById('ra-fbgen-showfb')?.checked||false;
      document.querySelectorAll('#ra-vrais .prop-row').forEach(function(r){s.vrais.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
      document.querySelectorAll('#ra-faux .prop-row').forEach(function(r){s.faux.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
      break;
    case 'dropdown':
      s.bareme=v('dd-bareme');s.text=richVal('dd-text');s.xe=v('dd-xe');s.vrais=[];s.faux=[];
      s.fbGen=richVal('dd-fbgen');
      s.fbGenShowFb=document.getElementById('dd-fbgen-showfb')?.checked||false;
      document.querySelectorAll('#dd-vrais .prop-row').forEach(function(r){s.vrais.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
      document.querySelectorAll('#dd-faux .prop-row').forEach(function(r){s.faux.push({text:r.querySelector('.p-text').value,fb:r.querySelector('.p-fb').value});});
      break;
    case 'algebraic':
      s.bareme=v('alg-bareme');s.text=richVal('alg-text');s.formula=v('alg-formula');s.vars=v('alg-vars');
      s.mode=v('alg-mode');s.exprDisplay=document.getElementById('alg-expr-display')?.value||'';s.error=document.getElementById('alg-error')?.value||'';
      s.fbc=richVal('alg-fbc');s.fbe=richVal('alg-fbe');s.sol=richVal('alg-sol');
      s.aideOn=document.getElementById('alg-aide-on')?.checked||false;
      s.helpCbs=[...document.querySelectorAll('.alg-h')].map(function(c){return c.checked;});
      s.helpVars=document.getElementById('alg-h-vars').checked;
      s.fbDetail={};
      if (typeof ALG_FB_DEFS !== 'undefined') { Object.keys(ALG_FB_DEFS).forEach(function(mode){ ALG_FB_DEFS[mode].forEach(function(item){ s.fbDetail[_algFbId(mode,item.key)] = richVal(_algFbId(mode,item.key)); }); }); }
      break;
    case 'numerical':
      s.bareme=v('num-bareme');s.text=richVal('num-text');s.val=v('num-val');s.round=v('num-round');
      s.n=v('num-n');s.tolType=v('num-tol-type');s.tolVal=v('num-tol-val');s.dec=v('num-dec');
      s.fbc=richVal('num-fbc');s.fbe=richVal('num-fbe');s.fbGen=richVal('num-fbgen');
      s.aideOn=document.getElementById('num-aide-on')?.checked||false;
      s.helpCbs=[...document.querySelectorAll('.num-h')].map(function(c){return c.checked;});
      break;
    case 'units':
      s.bareme=v('un-bareme');s.text=richVal('un-text');s.val=v('un-val');s.unit=v('un-unit');
      s.tol=v('un-tol');s.sig=v('un-sig');s.fbc=richVal('un-fbc');s.fbe=richVal('un-fbe');
      s.fbGen=richVal('un-fbgen');
      s.helpCbs=[...document.querySelectorAll('.un-h')].map(function(c){return c.checked;});
      break;
    case 'string':
      s.bareme=v('str-bareme');s.text=richVal('str-text');s.ansRich=richVal('str-ans-rich');
      s.size=v('str-size');s.test=v('str-test');s.fbc=richVal('str-fbc');s.fbe=richVal('str-fbe');
      s.sol=richVal('str-sol');s.aideOn=document.getElementById('str-aide-on').checked;
      s.palettes=[...document.querySelectorAll('.str-pal')].map(function(c){return{v:c.value,ch:c.checked};});
      s.alts=(document.getElementById('str-alts')||{value:''}).value||'';
      break;
    case 'match':
      s.bareme=v('match-bareme');s.text=richVal('match-text');
      s.left=JSON.parse(JSON.stringify(matchState.left));
      s.right=JSON.parse(JSON.stringify(matchState.right));
      s.connections=JSON.parse(JSON.stringify(matchState.connections));
      s.fbGen=v('match-fbgen');
      break;
    case 'crossword':
      s.bareme=v('cw-bareme');s.count=v('cw-count');s.rows=[];
      document.querySelectorAll('#cw-body .cw-row').forEach(function(r){
        var defEl=r.querySelector('.cw-def');s.rows.push({w:(r.querySelector('.cw-word')||{}).value||''  ,d:defEl?defEl.value:''});
      });
      s.gridData=typeof currentGridData!=='undefined'?currentGridData:null;
      s.placedWords=typeof currentPlacedWords!=='undefined'?[...currentPlacedWords]:[];
      s.fbGen=v('cw-fbgen');
      break;
    case 'doi':
      s.bareme=v('doi-bareme');s.text=richVal('doi-text');s.mainObj=v('doi-main-obj');s.extra=v('doi-extra');s.rows=[];
      document.querySelectorAll('.doi-obj-row').forEach(function(r){
        s.rows.push({n:r.querySelector('.doi-name').value,t:r.querySelector('.doi-type').value});
      });
      s.fbGen=v('doi-fbgen');
      break;
    case 'chemical':
      s.bareme=v('chem-bareme');s.text=richVal('chem-text');
      s.eqHtml=document.getElementById('chem-editor-text').innerHTML;
      s.fbGen=v('chem-fbgen');
      break;
    case 'chemical_topo':
      s.bareme=v('topo-bareme');s.text=richVal('topo-text');
      s.equation=document.getElementById('topo-editor').innerText;
      s.w_prt1=v('topo-w_prt1');s.w_n0=v('topo-w_n0');s.w_n1=v('topo-w_n1');
      s.w_n2=v('topo-w_n2');s.w_n3=v('topo-w_n3');s.w_n4=v('topo-w_n4');s.w_n5=v('topo-w_n5');
      s.fbGen=v('topo-fbgen');
      break;
    case 'composition':
      s.bareme=v('comp-bareme');s.text=richVal('comp-text');s.height=v('comp-height');
      s.msg=document.getElementById('comp-msg')?document.getElementById('comp-msg').value:'';
      s.fbGen=v('comp-fbgen');
      break;
    case 'nuclear':
      s.bareme=v('nuc-bareme');s.text=richVal('nuc-text');
      s.equation=document.getElementById('nuc-editor')?document.getElementById('nuc-editor').innerText:'';
      s.fbGen=v('nuc-fbgen');
      break;
    case 'jxgdrop': {
      var jdst=window._jdState||{};
      s.bareme=v('jd-bareme');s.text=richVal('jd-text');
      s.bgName=jdst.bgName||'';s.bgData=jdst.bgData||'';s.bgW=jdst.bgW||0;s.bgH=jdst.bgH||0;
      s.proposals=JSON.parse(JSON.stringify(jdst.proposals||[]));
      s.zones=JSON.parse(JSON.stringify(jdst.zones||[]));
      s.nextPropId=jdst.nextPropId||1;s.nextZoneId=jdst.nextZoneId||1;
      s.zonesVisible=document.getElementById('jd-zones-visible')?document.getElementById('jd-zones-visible').checked:true;
      s.fbGen=v('jd-fbgen');
      break;
    }
    case 'geogebra': {
      var ggbSt=(typeof ggbCaptureFromForm==='function')?ggbCaptureFromForm():(window._ggbState||{});
      s.bareme=v('ggb-bareme');s.text=richVal('ggb-text');
      s.model=ggbSt.model||'expert';
      s.materialId=ggbSt.materialId||'';s.width=ggbSt.width||700;s.height=ggbSt.height||500;
      s.showToolbar=!!ggbSt.showToolbar;
      s.inputs=JSON.parse(JSON.stringify(ggbSt.inputs||[]));
      s.outputs=JSON.parse(JSON.stringify(ggbSt.outputs||[]));
      s.coeffCfg=JSON.parse(JSON.stringify(ggbSt.coeffCfg||{}));
      s.fbGen=v('ggb-fbgen');
      break;
    }
    case 'vf':
      s.bareme=v('vf-bareme');s.text=richVal('vf-text');s.props=[];
      s.xe=v('vf-xe');s.xb=v('vf-xb');s.modeXb=v('vf-mode-xb');
      s.fbGen=richVal('vf-fbgen');
      s.fbGenShowFb=document.getElementById('vf-fbgen-showfb')?.checked||false;
      document.querySelectorAll('#vf-props .vf-row').forEach(function(r){
        var expEl=r.querySelector('.vf-exp:checked');
        s.props.push({text:r.querySelector('.vf-ptext').value,exp:expEl?expEl.value:'v',
          fbIfVrai:r.querySelector('.vf-fb-ifvrai')?.value||'',fbIfFaux:r.querySelector('.vf-fb-iffaux')?.value||''});
      });
      break;
    case 'ord':
      s.bareme=v('ord-bareme');s.text=richVal('ord-text');
      s.clone=document.getElementById('ord-clone').checked;s.items=[];
      document.querySelectorAll('#ord-items .ord-row').forEach(function(r){
        s.items.push({text:r.querySelector('.ord-item-text').value});
      });
      s.fbGen=v('ord-fbgen');
      break;
    case 'imgclick':
      s.bareme=v('ic-bareme');
      s.text=richVal('ic-text');
      var icModeEl=document.querySelector('input[name="ic-mode"]:checked');
      s.mode=icModeEl?icModeEl.value:'single';
      s.fbOk=v('ic-fb-ok');s.fbWrong=v('ic-fb-wrong');s.fbGen=v('ic-fbgen');
      s.seqTime=v('ic-seq-time');
      var icst=window._icState||{};
      s.seqBgName=icst.bgName||'';s.seqBgData=icst.bgData||'';s.seqBgW=icst.bgW||0;s.seqBgH=icst.bgH||0;
      s.seqZones=JSON.parse(JSON.stringify(icst.zones||[]));
      s.seqNextZoneId=icst.nextZoneId||1;
      break;
    case 'glr':
      s.bareme=v('glr-bareme');s.fn=v('glr-fn');
      s.xMin=v('glr-xmin');s.xMax=v('glr-xmax');s.yMin=v('glr-ymin');s.yMax=v('glr-ymax');
      s.x0=v('glr-x0');s.tol=v('glr-tol');s.w=v('glr-w');s.h=v('glr-h');
      s.text=richVal('glr-text');s.fbOk=v('glr-fb-ok');s.fbWrong=v('glr-fb-wrong');s.fbGen=v('glr-fbgen');
      break;
    case 'rvbcmj':
      s.bareme=v('rvb-bareme');s.imgData=v('rvb-imgdata');
      var rvbModeEl=document.querySelector('input[name="rvb-mode"]:checked');
      s.mode=rvbModeEl?rvbModeEl.value:'rvb';
      s.nb=document.getElementById('rvb-nb').checked;
      s.answer=v('rvb-answer');s.text=richVal('rvb-text');
      s.fbOk=v('rvb-fb-ok');s.fbWrong=v('rvb-fb-wrong');s.fbGen=v('rvb-fbgen');
      break;
    case 'acide-base':
      s.bareme=v('ab-bareme');s.text=richVal('ab-text');
      s.abMethod=v('ab-method')||'colorimetrie';
      s.abType=v('ab-type')||'af-bf';s.abFind=v('ab-find')||'equivalence';
      s.nProtons=v('ab-n-protons')||'1';
      s.c1=v('ab-c1');s.v1=v('ab-v1');s.c2=v('ab-c2');
      s.pka=v('ab-pka');s.pka2=v('ab-pka2');s.pka3=v('ab-pka3');
      s.tolVol=v('ab-tol-vol');
      s.w=v('ab-w');s.h=v('ab-h');
      s.indicators=Array.prototype.slice.call(document.querySelectorAll('.ab-ind-chk:checked')).map(function(el){return el.dataset.ind;});
      s.fbGen=v('ab-fbgen');
      break;
    case 'redox':
      s.bareme=v('rx-bareme');s.text=richVal('rx-text');
      s.rxFind=v('rx-find')||'equivalence';
      s.e1=v('rx-e1');s.n1=v('rx-n1');
      s.e2=v('rx-e2');s.n2=v('rx-n2');
      s.c1=v('rx-c1');s.c2=v('rx-c2');s.v2=v('rx-v2');
      s.titrantName=v('rx-titrant-name');
      s.tolVol=v('rx-tol-vol');s.tolE=v('rx-tol-e');
      s.w=v('rx-w');s.h=v('rx-h');
      s.fbOk=v('rx-fb-ok');s.fbWrong=v('rx-fb-wrong');s.fbGen=v('rx-fbgen');
      break;
    case 'basen':
      s.bareme=v('bn-bareme');s.text=richVal('bn-text');
      s.format=v('bn-format')||'S';
      s.fromBase=v('bn-from-base')||'10';
      s.toBase=v('bn-to-base')||'2';
      s.valueMode=v('bn-value-mode')||'fixe';
      s.valueBase=v('bn-value-base')||'depart';
      s.value=v('bn-value')||'42';
      s.valueMin=v('bn-value-min')||'10';
      s.valueMax=v('bn-value-max')||'99';
      s.fbOk=v('bn-fb-ok');s.fbWrong=v('bn-fb-wrong');s.fbGen=v('bn-fbgen');
      break;
    case 'circuit':
      s.bareme=v('cir-bareme');s.text=richVal('cir-text');
      s.scenario=v('cir-scenario')||'loi-ohm';
      s.ask=v('cir-ask')||'i';
      s.e=v('cir-e')||'9';
      s.r1=v('cir-r1')||'100';
      s.r2=v('cir-r2')||'220';
      s.r3=v('cir-r3')||'0';
      s.iKnown=v('cir-i-known')||'0';
      s.tol=v('cir-tol')||'5';
      s.fbOk=v('cir-fb-ok');s.fbWrong=v('cir-fb-wrong');s.fbGen=v('cir-fbgen');
      break;
    case 'logique':
      s.bareme=v('lg-bareme');s.text=richVal('lg-text');
      s.scenario=v('lg-scenario')||'table';
      s.nbVars=v('lg-nb-vars')||'2';
      s.expr=v('lg-expr')||'(P and Q) or not(P)';
      s.expr2=v('lg-expr2')||'';
      s.expr3=v('lg-expr3')||'';
      s.expr4=v('lg-expr4')||'';
      s.subexpr1=v('lg-subexpr1')||'';
      s.subexpr2=v('lg-subexpr2')||'';
      s.tans=v('lg-tans')||'';
      s.nbBlanks=v('lg-nb-blanks')||'2';
      s.fbOk=v('lg-fb-ok');s.fbWrong=v('lg-fb-wrong');s.fbGen=v('lg-fbgen');
      break;
    case 'complexe':
      s.bareme=v('cpx-bareme');s.text=richVal('cpx-text');
      s.scenario=v('cpx-scenario')||'forme-alg';
      s.mode=v('cpx-mode')||'fixe';
      s.a=v('cpx-a')||'2'; s.b=v('cpx-b')||'3';
      s.c=v('cpx-c')||'1'; s.d=v('cpx-d')||'-1';
      s.op=v('cpx-op')||'*';
      s.eqb=v('cpx-eq-b')||'-2'; s.eqc=v('cpx-eq-c')||'5';
      s.complexno=v('cpx-complexno')||'i';
      s.randMin=v('cpx-rand-min')||'-5'; s.randMax=v('cpx-rand-max')||'5';
      s.fbGen=richVal('cpx-fbgen');
      s.fbDetail={};
      if (typeof CPX_FB_DEFS !== 'undefined') {
        Object.keys(CPX_FB_DEFS).forEach(function(scn){
          CPX_FB_DEFS[scn].forEach(function(item){
            s.fbDetail[_cpxFbId(scn,item.key)]=richVal(_cpxFbId(scn,item.key));
          });
        });
      }
      break;
    case 'calcul':
      s.bareme=v('calc-bareme');s.text=richVal('calc-text');
      s.scenario=v('calc-scenario')||'derivee';
      s.expr=v('calc-expr')||'x^2 + sin(x)';
      s.a=v('calc-a')||'0'; s.b=v('calc-b')||'1';
      s.varMode=(document.getElementById('calc-var-mode-hidden')||{}).value||'aleatoire';
      s.vars={};
      (CALC_VAR_SPECS[s.scenario]||[]).forEach(function(vs){
        var ea=document.getElementById('calc-var-'+vs.key+'-alea'), ef=document.getElementById('calc-var-'+vs.key+'-fixe');
        s.vars[vs.key]={alea: ea?ea.value:vs.domain.join(','), fixe: ef?ef.value:String(vs.domain[0])};
      });
      s.fbOk=richVal('calc-fb-ok');s.fbWrong=richVal('calc-fb-wrong');s.fbGen=v('calc-fbgen');
      break;
    case 'statistiques':
      s.bareme=v('stat-bareme');s.text=richVal('stat-text');
      s.scenario=v('stat-scenario')||'moyenne';
      s.data=v('stat-data')||'2,5,8,3,7,4,6';
      s.display=v('stat-display')||'liste';
      s.dataDecimals=v('stat-data-decimals')||'1';
      s.varName=v('stat-varname')||'x';
      s.randFormat=(function(){ var r=document.querySelector('input[name="stat-rand-format-radio"]:checked'); return r?r.value:'decimal'; })();
      s.fbOk=richVal('stat-fb-ok');s.fbWrong=richVal('stat-fb-wrong');s.fbGen=richVal('stat-fbgen');
      break;
    case 'matrices':
      s.bareme=v('mat-bareme');s.text=richVal('mat-text');
      s.scenario=v('mat-scenario')||'produit-2x2';
      s.randMin=v('mat-rand-min')||'-3';s.randMax=v('mat-rand-max')||'3';
      s.fbOk=v('mat-fb-ok');s.fbWrong=v('mat-fb-wrong');
      s.fbGen=v('mat-fbgen');
      break;
    case 'geometrie':
      s.bareme=v('geo-bareme');s.text=richVal('geo-text');
      s.scenario=v('geo-scenario')||'distance';
      s.dim=v('geo-dim')||'2d';
      s.mode=v('geo-mode')||'aleatoire';
      s.p1x=v('geo-p1x')||'1';s.p1y=v('geo-p1y')||'2';s.p1z=v('geo-p1z')||'0';
      s.p2x=v('geo-p2x')||'4';s.p2y=v('geo-p2y')||'6';s.p2z=v('geo-p2z')||'1';
      s.p3x=v('geo-p3x')||'0';s.p3y=v('geo-p3y')||'3';s.p3z=v('geo-p3z')||'2';
      s.fbOk=richVal('geo-fb-ok');s.fbWrong=richVal('geo-fb-wrong');s.fbGen=richVal('geo-fbgen');
      break;
    case 'suites':
      s.bareme=v('sui-bareme');s.text=richVal('sui-text');
      s.scenario=v('sui-scenario')||'terme-arith';
      s.mode=v('sui-mode')||'aleatoire';
      s.u0=v('sui-u0')||'3'; s.r=v('sui-r')||'2'; s.q=v('sui-q')||'2'; s.k=v('sui-k')||'5';
      s.u0Min=v('sui-u0-min')||'-5'; s.u0Max=v('sui-u0-max')||'5';
      s.rMin=v('sui-r-min')||'-5'; s.rMax=v('sui-r-max')||'5';
      s.qMin=v('sui-q-min')||'-3'; s.qMax=v('sui-q-max')||'3';
      s.kMin=v('sui-k-min')||'3'; s.kMax=v('sui-k-max')||'6';
      s.fbOk=v('sui-fb-ok');s.fbWrong=v('sui-fb-wrong');s.fbGen=v('sui-fbgen');
      break;
    case 'probabilites':
      s.bareme=v('prob-bareme');s.text=richVal('prob-text');
      s.scenario=v('prob-scenario')||'combinaison';
      s.mode=v('prob-mode')||'aleatoire';
      s.n=v('prob-n')||'10'; s.k=v('prob-k')||'3'; s.p=v('prob-p')||'0.5';
      s.pa=v('prob-pa')||'0.3'; s.pb=v('prob-pb')||'0.4'; s.pab=v('prob-pab')||'0.1';
      s.nMin=v('prob-n-min')||'6'; s.nMax=v('prob-n-max')||'12';
      s.kMin=v('prob-k-min')||'1'; s.kMax=v('prob-k-max')||'6';
      s.pMin=v('prob-p-min')||'0.2'; s.pMax=v('prob-p-max')||'0.8';
      s.paMin=v('prob-pa-min')||'0.2'; s.paMax=v('prob-pa-max')||'0.7';
      s.pbMin=v('prob-pb-min')||'0.2'; s.pbMax=v('prob-pb-max')||'0.7';
      s.pabMin=v('prob-pab-min')||'0.05'; s.pabMax=v('prob-pab-max')||'0.25';
      s.fbOk=v('prob-fb-ok');s.fbWrong=v('prob-fb-wrong');s.fbGen=v('prob-fbgen');
      break;
    case 'trigonometrie':
      s.bareme=v('trig-bareme');s.text=richVal('trig-text');
      s.scenario=v('trig-scenario')||'valeur-exacte';
      s.mode=(document.querySelector('input[name="trig-mode-r"]:checked')||{}).value||'aleatoire';
      s.fn=v('trig-fn')||'sin'; s.angle=v('trig-angle')||'%pi/6';
      s.expr=v('trig-expr')||'sin(x)^2 + cos(x)^2';
      s.fbOk=v('trig-fb-ok');s.fbWrong=v('trig-fb-wrong');s.fbGen=v('trig-fbgen');
      break;
    case 'polynomes':
      s.bareme=v('pol-bareme');s.text=richVal('pol-text');
      s.scenario=v('pol-scenario')||'discriminant';
      s.mode=(document.querySelector('input[name="pol-mode-r"]:checked')||{}).value||'aleatoire';
      s.a=v('pol-a')||'1'; s.b=v('pol-b')||'-5'; s.c=v('pol-c')||'6';
      s.deltaMin=v('pol-delta-min')||'1'; s.deltaMax=v('pol-delta-max')||'50';
      s.fbOk=v('pol-fb-ok');s.fbWrong=v('pol-fb-wrong');s.fbGen=v('pol-fbgen');
      break;
    case 'equivalence':
      s.bareme=v('eq-bareme');s.text=richVal('eq-text');
      s.scenario=v('eq-scenario')||'developpement';
      s.formule=v('eq-formule')||'';
      s.variable=v('eq-variable')||'x'; s.variables=v('eq-variables')||'x,y';
      s.resultat=v('eq-resultat')||'';
      s.etapeCheck=!!document.getElementById('eq-etape-check').checked;
      s.etapeVal=v('eq-etape-val')||'';
      s.fbOk=v('eq-fb-ok');s.fbWrong=v('eq-fb-wrong');s.fbGen=v('eq-fbgen');
      break;
    case 'limites':
      s.bareme=v('lim-bareme');s.text=richVal('lim-text');
      s.scenario=v('lim-scenario')||'plus-inf';
      s.mode=(document.querySelector('input[name="lim-mode-r"]:checked')||{}).value||'aleatoire';
      s.expr=v('lim-expr')||'(x^2-1)/(x-1)';
      s.point=v('lim-point')||'1';
      s.tans=v('lim-tans')||'2';
      s.fbOk=v('lim-fb-ok');s.fbWrong=v('lim-fb-wrong');s.fbGen=v('lim-fbgen');
      break;
    case 'physique':
      s.bareme=v('phy-bareme');s.text=richVal('phy-text');
      s.scenario=v('phy-scenario')||'mrua-vitesse';
      s.v0=v('phy-v0')||'0'; s.a=v('phy-a')||'9.81'; s.t=v('phy-t')||'3';
      s.m=v('phy-m')||'2'; s.d=v('phy-d')||'5';
      s.fbOk=v('phy-fb-ok');s.fbWrong=v('phy-fb-wrong');s.fbGen=v('phy-fbgen');
      break;
    case 'oscilloscope':
      s.bareme=v('osc-bareme');s.text=richVal('osc-text');
      s.mode=v('osc-mode')||'periode_frequence';
      s.pedMode=v('osc-ped-mode')||'guide';
      s.forme=v('osc-forme')||'aleatoire';
      s.freqMode=v('osc-freq-mode')||'fixed';
      s.ffreq=v('osc-ffreq')||'500';s.umax=v('osc-umax')||'3';
      s.evoltBase=v('osc-evolt-base')||'2000';s.evoltRange=v('osc-evolt-range')||'1000';
      s.tauBase=v('osc-tau-base')||'1000';s.tauRange=v('osc-tau-range')||'1000';
      s.fcarrier=v('osc-fcarrier')||'4000000';s.fmod=v('osc-fmod')||'2000';
      s.dtMin=v('osc-dt-min')||'4';s.dtMax=v('osc-dt-max')||'8';
      s.shIdx=document.getElementById('osc-sh-idx').value;
      s.svIdx=document.getElementById('osc-sv-idx').value;
      s.shAuto=document.getElementById('osc-sh-auto').checked;
      s.svAuto=document.getElementById('osc-sv-auto').checked;
      s.fbGen=v('osc-fbgen');
      break;
    case 'inequation':
      s.bareme=v('ineq-bareme');s.text=richVal('ineq-text');
      s.scenario=v('ineq-scenario')||'lineaire';
      s.mode=(document.querySelector('input[name="ineq-mode-r"]:checked')||{}).value||'aleatoire';
      s.a=v('ineq-a')||'2'; s.b=v('ineq-b')||'-6'; s.c=v('ineq-c')||'0';
      s.op=v('ineq-op')||'>';
      s.tans=v('ineq-tans')||'oo(3,inf)';
      s.fbOk=v('ineq-fb-ok');s.fbWrong=v('ineq-fb-wrong');s.fbGen=v('ineq-fbgen');
      break;
    case 'thermo':
      s.bareme=v('thy-bareme');s.text=richVal('thy-text');
      s.scenario=v('thy-scenario')||'pression';
      s.P=v('thy-P')||'101325'; s.V=v('thy-V')||'0.0224';
      s.n=v('thy-n')||'1'; s.T=v('thy-T')||'273.15';
      s.m=v('thy-m')||'1'; s.cp=v('thy-cp')||'4186'; s.dT=v('thy-dT')||'10';
      s.fbOk=v('thy-fb-ok');s.fbWrong=v('thy-fb-wrong');s.fbGen=v('thy-fbgen');
      break;
    case 'optique':
      s.scenario=v('opt-scenario')||'lentille-convergente';
      s.bareme=v('opt-bareme');s.text=richVal('opt-text');
      s.f=v('opt-f');s.oa=v('opt-oa');s.ab=v('opt-ab');
      s.mirF=v('opt-mir-f');s.mirSa=v('opt-mir-sa');s.mirAb=v('opt-mir-ab');
      s.w=v('opt-w');s.h=v('opt-h');
      s.fbGen=v('opt-fbgen');
      break;
    case 'apn':
      s.bareme=v('apn-bareme');s.text=richVal('apn-text');
      s.unknown=v('apn-unknown')||'V';
      s.changedD=document.getElementById('apn-changed-D').checked;
      s.changedV=document.getElementById('apn-changed-V').checked;
      s.changedI=document.getElementById('apn-changed-I').checked;
      s.fbOk=v('apn-fb-ok');s.fbWrong=v('apn-fb-wrong');s.fbGen=v('apn-fbgen');
      break;
    case 'diffraction':
      s.bareme=v('diff-bareme');s.text=richVal('diff-text');
      s.difftype=v('diff-type')||'fente_simple';s.diffmode=v('diff-mode')||'ecran';
      s.random=document.getElementById('diff-random')?document.getElementById('diff-random').checked:true;
      s.a=v('diff-a');s.d=v('diff-d');s.b=v('diff-b');s.lambda=v('diff-lambda');
      s.tol=v('diff-tol');
      s.fbOk=v('diff-fb-ok');s.fbWrong=v('diff-fb-wrong');s.fbGen=v('diff-fbgen');
      break;
    case 'image-mesure':
      s.bareme=v('imm-bareme');s.text=richVal('imm-text');
      s.imageData=v('imm-image-data');s.imgW=v('imm-img-w');s.imgH=v('imm-img-h');
      s.r1x=v('imm-r1x');s.r1y=v('imm-r1y');s.r1v=v('imm-r1v');s.r1desc=v('imm-r1desc');
      s.r2x=v('imm-r2x');s.r2y=v('imm-r2y');s.r2v=v('imm-r2v');s.r2desc=v('imm-r2desc');
      s.unit=v('imm-unit');s.tol=v('imm-tol');s.mode=v('imm-mode');
      s.fbOk=v('imm-fb-ok');s.fbWrong=v('imm-fb-wrong');s.fbGen=v('imm-fbgen');
      s.targets=[];
      document.querySelectorAll('.imm-target-row').forEach(function(row){
        var typeSel=row.querySelector('.imm-t-type');
        s.targets.push({desc:row.querySelector('.imm-t-desc').value,val:row.querySelector('.imm-t-val').value,type:typeSel?typeSel.value:'position',px:row.dataset.px,py:row.dataset.py,px2:row.dataset.px2,py2:row.dataset.py2});
      });
      break;
    case 'expert':
      if (typeof expertCaptureState === 'function') return expertCaptureState();
      break;
  }
  return s;
}

// ── RESTORE STATE (adapted from V3 app.js) ──────────────────────
function restoreState(s) {
  currentType = s.type;
  switch(s.type) {
    case 'expert':
      if (typeof expertRestoreState === 'function') expertRestoreState(s);
      return;
    case 'checkbox':
      document.getElementById('cb-bareme').value=s.bareme;setRichVal('cb-text',s.text);
      document.getElementById('cb-xe').value=s.xe;document.getElementById('cb-mode-xb').value=s.mXb;
      document.getElementById('cb-xb').value=s.xb;document.getElementById('cb-xb').disabled=s.mXb==='alea';
      setRichVal('cb-fbc',s.fbc||'');setRichVal('cb-fbe',s.fbe||'');setRichVal('cb-fbgen',s.fbGen||'');
      var cbOubliEl=document.getElementById('cb-show-oubli');if(cbOubliEl)cbOubliEl.checked=s.showOubli||false;
      var cbFbGenShowFbEl=document.getElementById('cb-fbgen-showfb');if(cbFbGenShowFbEl)cbFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('cb-props').innerHTML='';
      (s.props||[]).forEach(function(p){addCBRow(p.isV,p.text,p.fb,p.fb2||'');});
      if(typeof toggleCBOubli==='function')toggleCBOubli();
      break;
    case 'radio':
      document.getElementById('ra-bareme').value=s.bareme;setRichVal('ra-text',s.text);
      document.getElementById('ra-xe').value=s.xe;
      setRichVal('ra-fbgen',s.fbGen||'');
      var raFbGenShowFbEl=document.getElementById('ra-fbgen-showfb');if(raFbGenShowFbEl)raFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('ra-vrais').innerHTML='';document.getElementById('ra-faux').innerHTML='';
      (s.vrais||[]).forEach(function(p){addPoolRow('ra-vrais',true,p.text,p.fb,true);});
      (s.faux||[]).forEach(function(p){addPoolRow('ra-faux',false,p.text,p.fb,true);});
      if(typeof checkPoolWarn==='function')checkPoolWarn('ra');
      break;
    case 'dropdown':
      document.getElementById('dd-bareme').value=s.bareme;setRichVal('dd-text',s.text);
      document.getElementById('dd-xe').value=s.xe;
      setRichVal('dd-fbgen',s.fbGen||'');
      var ddFbGenShowFbEl=document.getElementById('dd-fbgen-showfb');if(ddFbGenShowFbEl)ddFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('dd-vrais').innerHTML='';document.getElementById('dd-faux').innerHTML='';
      (s.vrais||[]).forEach(function(p){addPoolRow('dd-vrais',true,p.text,p.fb,true);});
      (s.faux||[]).forEach(function(p){addPoolRow('dd-faux',false,p.text,p.fb,true);});
      if(typeof checkPoolWarn==='function')checkPoolWarn('dd');
      break;
    case 'algebraic':
      document.getElementById('alg-bareme').value=s.bareme;setRichVal('alg-text',s.text);
      document.getElementById('alg-formula').value=s.formula;document.getElementById('alg-vars').value=s.vars;
      if(document.getElementById('alg-mode'))document.getElementById('alg-mode').value=s.mode||'libre';
      if(document.getElementById('alg-expr-display'))document.getElementById('alg-expr-display').value=s.exprDisplay||'';
      if(document.getElementById('alg-error'))document.getElementById('alg-error').value=s.error||'';
      if(typeof toggleAlgMode==='function')toggleAlgMode();
      setRichVal('alg-fbc',s.fbc);setRichVal('alg-fbe',s.fbe);setRichVal('alg-sol',s.sol);
      if (typeof ALG_FB_DEFS !== 'undefined') { Object.keys(ALG_FB_DEFS).forEach(function(mode){ ALG_FB_DEFS[mode].forEach(function(item){ var id=_algFbId(mode,item.key); if(s.fbDetail && s.fbDetail[id]) setRichVal(id, s.fbDetail[id]); }); }); }
      var algCbs=document.querySelectorAll('.alg-h');
      (s.helpCbs||[]).forEach(function(cv,i){if(algCbs[i])algCbs[i].checked=cv;});
      document.getElementById('alg-h-vars').checked=!!s.helpVars;
      if(typeof updateAlgPreview==='function')updateAlgPreview();
      if(typeof markErr==='function')markErr('alg-formula','err-alg-formula',false);
      break;
    case 'numerical':
      document.getElementById('num-bareme').value=s.bareme;setRichVal('num-text',s.text);
      document.getElementById('num-val').value=s.val;document.getElementById('num-round').value=s.round;
      document.getElementById('num-n-wrap').style.display=s.round==='y'?'block':'none';
      document.getElementById('num-n').value=s.n;
      document.getElementById('num-tol-type').value=s.tolType;document.getElementById('num-tol-val').value=s.tolVal;
      document.getElementById('num-dec').value=s.dec;
      setRichVal('num-fbc',s.fbc);setRichVal('num-fbe',s.fbe);
      if(typeof markErr==='function')markErr('num-val','err-num-val',false);
      break;
    case 'units':
      document.getElementById('un-bareme').value=s.bareme;setRichVal('un-text',s.text);
      document.getElementById('un-val').value=s.val;document.getElementById('un-unit').value=s.unit;
      document.getElementById('un-tol').value=s.tol;document.getElementById('un-sig').value=s.sig;
      setRichVal('un-fbc',s.fbc);setRichVal('un-fbe',s.fbe);
      setRichVal('un-fbgen',s.fbGen||'');
      var unCbs=document.querySelectorAll('.un-h');
      (s.helpCbs||[]).forEach(function(cv,i){if(unCbs[i])unCbs[i].checked=cv;});
      if(typeof updateUnPreview==='function')updateUnPreview();
      break;
    case 'string':
      document.getElementById('str-bareme').value=s.bareme;setRichVal('str-text',s.text);
      setRichVal('str-ans-rich',s.ansRich||'');document.getElementById('str-size').value=s.size;
      document.getElementById('str-test').value=s.test;
      setRichVal('str-fbc',s.fbc);setRichVal('str-fbe',s.fbe);setRichVal('str-sol',s.sol);
      document.getElementById('str-aide-on').checked=!!s.aideOn;
      if(typeof toggleStrAide==='function')toggleStrAide();
      if(s.palettes)(s.palettes.forEach(function(p){var cb=document.querySelector('.str-pal[value="'+p.v+'"]');if(cb)cb.checked=p.ch;}));
      var strAltsEl=document.getElementById('str-alts');if(strAltsEl)strAltsEl.value=s.alts||'';
      if(typeof updateStrPalettePreview==='function')updateStrPalettePreview();
      break;
    case 'match':
      document.getElementById('match-bareme').value=s.bareme;setRichVal('match-text',s.text);
      matchState.left=JSON.parse(JSON.stringify(s.left));
      matchState.right=JSON.parse(JSON.stringify(s.right));
      matchState.connections=JSON.parse(JSON.stringify(s.connections));
      if(typeof renderMatchLists==='function')renderMatchLists();
      var _matchFbGen=document.getElementById('match-fbgen');if(_matchFbGen)_matchFbGen.value=s.fbGen||'';
      break;
    case 'crossword':
      document.getElementById('cw-bareme').value=s.bareme;document.getElementById('cw-count').value=s.count;
      document.getElementById('cw-body').innerHTML='';
      if(s.rows)s.rows.forEach(function(r){if(typeof addCWRow==='function')addCWRow(r.w,r.d);});
      if(typeof currentGridData!=='undefined')currentGridData=s.gridData||null;
      if(typeof currentPlacedWords!=='undefined')currentPlacedWords=new Set(s.placedWords||[]);
      if(s.gridData&&s.gridData.maxX!==undefined){
        document.getElementById('cw-preview-area').style.display='flex';
        document.getElementById('cw-grid-preview').innerHTML=typeof renderCWGridHTML==='function'?renderCWGridHTML(s.gridData.grid,s.gridData.maxX,s.gridData.maxY):'';
        document.getElementById('cw-status-msg').textContent=I18N.t('tpl.grille_sauvegardee');
      }
      var _cwFbGen=document.getElementById('cw-fbgen');if(_cwFbGen)_cwFbGen.value=s.fbGen||'';
      break;
    case 'doi':
      document.getElementById('doi-bareme').value=s.bareme;setRichVal('doi-text',s.text);
      document.getElementById('doi-main-obj').value=s.mainObj;document.getElementById('doi-extra').value=s.extra;
      document.getElementById('doi-objects-list').innerHTML='';
      if(s.rows)s.rows.forEach(function(r){if(typeof doiAddRow==='function')doiAddRow(r.n,r.t);});
      var _doiFbGen=document.getElementById('doi-fbgen');if(_doiFbGen)_doiFbGen.value=s.fbGen||'';
      if(typeof doiRefresh==='function')doiRefresh();
      break;
    case 'chemical':
      document.getElementById('chem-bareme').value=s.bareme;setRichVal('chem-text',s.text);
      document.getElementById('chem-editor-text').innerHTML=s.eqHtml;
      var _chemFbGen=document.getElementById('chem-fbgen');if(_chemFbGen)_chemFbGen.value=s.fbGen||'';
      if(typeof chemUpdateLock==='function')chemUpdateLock();
      if(typeof chemParseAndPreview==='function')chemParseAndPreview();
      break;
    case 'chemical_topo':
      document.getElementById('topo-bareme').value=s.bareme;setRichVal('topo-text',s.text);
      document.getElementById('topo-editor').innerText=s.equation;
      document.getElementById('topo-w_prt1').value=s.w_prt1;document.getElementById('topo-w_n0').value=s.w_n0;
      document.getElementById('topo-w_n1').value=s.w_n1;document.getElementById('topo-w_n2').value=s.w_n2;
      document.getElementById('topo-w_n3').value=s.w_n3;document.getElementById('topo-w_n4').value=s.w_n4;
      document.getElementById('topo-w_n5').value=s.w_n5;
      var _topoFbGen=document.getElementById('topo-fbgen');if(_topoFbGen)_topoFbGen.value=s.fbGen||'';
      if(typeof topoRenderPreview==='function')topoRenderPreview();
      if(typeof checkTopoScores==='function')checkTopoScores();
      break;
    case 'composition':
      document.getElementById('comp-bareme').value=s.bareme||4;setRichVal('comp-text',s.text||'');
      document.getElementById('comp-height').value=s.height||'600px';
      if(document.getElementById('comp-msg'))document.getElementById('comp-msg').value=s.msg||I18N.t('msg.comp_msg_default');
      var _compFbGen=document.getElementById('comp-fbgen');if(_compFbGen)_compFbGen.value=s.fbGen||'';
      break;
    case 'nuclear':
      document.getElementById('nuc-bareme').value=s.bareme||1;setRichVal('nuc-text',s.text||'');
      if(document.getElementById('nuc-editor'))document.getElementById('nuc-editor').innerText=s.equation||'';
      if(typeof nucUpdateLock==='function')nucUpdateLock();
      if(typeof nucRenderPreview==='function')nucRenderPreview();
      var _nucFbGen=document.getElementById('nuc-fbgen');if(_nucFbGen)_nucFbGen.value=s.fbGen||'';
      break;
    case 'jxgdrop':
      if(typeof jdRestoreState==='function')jdRestoreState(s);
      var _jdFbGen=document.getElementById('jd-fbgen');if(_jdFbGen)_jdFbGen.value=s.fbGen||'';
      break;
    case 'geogebra':
      document.getElementById('ggb-bareme').value=s.bareme||1;setRichVal('ggb-text',s.text||'');
      if(typeof ggbRestoreState==='function')ggbRestoreState(s);
      var _ggbFbGen=document.getElementById('ggb-fbgen');if(_ggbFbGen)_ggbFbGen.value=s.fbGen||'';
      break;
    case 'vf':
      document.getElementById('vf-bareme').value=s.bareme||1;setRichVal('vf-text',s.text||'');
      if(document.getElementById('vf-xe'))document.getElementById('vf-xe').value=s.xe||1;
      if(document.getElementById('vf-xb'))document.getElementById('vf-xb').value=s.xb||1;
      if(document.getElementById('vf-mode-xb'))document.getElementById('vf-mode-xb').value=s.modeXb||'fixe';
      if(document.getElementById('vf-xb'))document.getElementById('vf-xb').disabled=(s.modeXb==='alea');
      setRichVal('vf-fbgen',s.fbGen||'');
      var vfFbGenShowFbEl=document.getElementById('vf-fbgen-showfb');if(vfFbGenShowFbEl)vfFbGenShowFbEl.checked=s.fbGenShowFb||false;
      document.getElementById('vf-props').innerHTML='';
      (s.props||[]).forEach(function(p){if(typeof addVFRow==='function')addVFRow(p.text,p.exp,p.fbIfVrai||p.fbVrai||p.fbOk||'',p.fbIfFaux||p.fbFaux||p.fbWrong||'');});
      break;
    case 'ord':
      document.getElementById('ord-bareme').value=s.bareme||1;setRichVal('ord-text',s.text||'');
      document.getElementById('ord-clone').checked=!!s.clone;
      document.getElementById('ord-items').innerHTML='';
      (s.items||[]).forEach(function(it){if(typeof addOrdRow==='function')addOrdRow(it.text);});
      var _ordFbGen=document.getElementById('ord-fbgen');if(_ordFbGen)_ordFbGen.value=s.fbGen||'';
      break;
    case 'imgclick':
      document.getElementById('ic-bareme').value=s.bareme||1;
      setRichVal('ic-text',s.text||'');
      document.getElementById('ic-fb-ok').value=s.fbOk||'';document.getElementById('ic-fb-wrong').value=s.fbWrong||'';
      var _icFbGen=document.getElementById('ic-fbgen');if(_icFbGen)_icFbGen.value=s.fbGen||'';
      var icModeR=document.querySelector('input[name="ic-mode"][value="'+(s.mode||'single')+'"]');
      if(icModeR)icModeR.checked=true;
      document.getElementById('ic-seq-time').value=s.seqTime||5;
      if(typeof icRestoreState==='function')icRestoreState({
        bgName:s.seqBgName,bgData:s.seqBgData,bgW:s.seqBgW,bgH:s.seqBgH,
        zones:s.seqZones,nextZoneId:s.seqNextZoneId
      });
      if(typeof icToggleMode==='function')icToggleMode();
      break;
    case 'glr':
      document.getElementById('glr-bareme').value=s.bareme||1;document.getElementById('glr-fn').value=s.fn||'';
      document.getElementById('glr-xmin').value=s.xMin||-10;document.getElementById('glr-xmax').value=s.xMax||10;
      document.getElementById('glr-ymin').value=s.yMin||-10;document.getElementById('glr-ymax').value=s.yMax||10;
      document.getElementById('glr-x0').value=s.x0||0;document.getElementById('glr-tol').value=s.tol||0.5;
      document.getElementById('glr-w').value=s.w||500;document.getElementById('glr-h').value=s.h||400;
      setRichVal('glr-text',s.text||'');
      document.getElementById('glr-fb-ok').value=s.fbOk||'';document.getElementById('glr-fb-wrong').value=s.fbWrong||'';
      var _glrFbGen=document.getElementById('glr-fbgen');if(_glrFbGen)_glrFbGen.value=s.fbGen||'';
      break;
    case 'rvbcmj':
      document.getElementById('rvb-bareme').value=s.bareme||1;document.getElementById('rvb-imgdata').value=s.imgData||'';
      if(s.imgData&&typeof rvbRestoreImage==='function')rvbRestoreImage(s.imgData);
      var rvbR=document.querySelector('input[name="rvb-mode"][value="'+(s.mode||'rvb')+'"]');
      if(rvbR)rvbR.checked=true;
      document.getElementById('rvb-nb').checked=!!s.nb;
      document.getElementById('rvb-answer').value=s.answer||'';setRichVal('rvb-text',s.text||'');
      document.getElementById('rvb-fb-ok').value=s.fbOk||'';document.getElementById('rvb-fb-wrong').value=s.fbWrong||'';
      var _rvbFbGen=document.getElementById('rvb-fbgen');if(_rvbFbGen)_rvbFbGen.value=s.fbGen||'';
      document.getElementById('rvb-preview-filtered').style.display='none';
      break;
    case 'acide-base':
      document.getElementById('ab-bareme').value=s.bareme||1;
      setRichVal('ab-text',s.text||'');
      document.getElementById('ab-method').value=s.abMethod||'colorimetrie';
      document.getElementById('ab-type').value=s.abType||'af-bf';
      document.getElementById('ab-n-protons').value=s.nProtons||'1';
      document.getElementById('ab-c1').value=s.c1||0.1;
      document.getElementById('ab-v1').value=s.v1||20;
      document.getElementById('ab-c2').value=s.c2||0.1;
      document.getElementById('ab-pka').value=s.pka||4.8;
      document.getElementById('ab-pka2').value=s.pka2||9.2;
      document.getElementById('ab-pka3').value=s.pka3||12.35;
      document.getElementById('ab-tol-vol').value=s.tolVol||0.5;
      document.getElementById('ab-w').value=s.w||500;
      document.getElementById('ab-h').value=s.h||400;
      var _abInds=s.indicators&&s.indicators.length?s.indicators:['hel','bbt','phph'];
      document.querySelectorAll('.ab-ind-chk').forEach(function(el){el.checked=_abInds.indexOf(el.dataset.ind)!==-1;});
      var _abFbGen=document.getElementById('ab-fbgen');if(_abFbGen)_abFbGen.value=s.fbGen||'';
      document.getElementById('ab-find').value=s.abFind||'equivalence';
      if(typeof abFormChange==='function')abFormChange();
      break;
    case 'redox':
      document.getElementById('rx-bareme').value=s.bareme||1;
      setRichVal('rx-text',s.text||'');
      document.getElementById('rx-e1').value=s.e1!=null?s.e1:1.51;
      document.getElementById('rx-n1').value=s.n1||5;
      document.getElementById('rx-e2').value=s.e2!=null?s.e2:0.77;
      document.getElementById('rx-n2').value=s.n2||1;
      document.getElementById('rx-c1').value=s.c1||0.02;
      document.getElementById('rx-c2').value=s.c2||0.1;
      document.getElementById('rx-v2').value=s.v2||20;
      document.getElementById('rx-titrant-name').value=s.titrantName||'KMnO₄';
      document.getElementById('rx-tol-vol').value=s.tolVol||0.5;
      document.getElementById('rx-tol-e').value=s.tolE||0.05;
      document.getElementById('rx-w').value=s.w||500;
      document.getElementById('rx-h').value=s.h||400;
      document.getElementById('rx-fb-ok').value=s.fbOk||'';
      document.getElementById('rx-fb-wrong').value=s.fbWrong||'';
      var _rxFbGen=document.getElementById('rx-fbgen');if(_rxFbGen)_rxFbGen.value=s.fbGen||'';
      document.getElementById('rx-find').value=s.rxFind||'equivalence';
      if(typeof rxFormChange==='function')rxFormChange();
      break;
    case 'basen':
      document.getElementById('bn-bareme').value=s.bareme||1;
      setRichVal('bn-text',s.text||'');
      document.getElementById('bn-format').value=s.format||'S';
      document.getElementById('bn-from-base').value=s.fromBase||'10';
      document.getElementById('bn-to-base').value=s.toBase||'2';
      document.getElementById('bn-value-mode').value=s.valueMode||'fixe';
      document.getElementById('bn-value-base').value=s.valueBase||'depart';
      document.getElementById('bn-value').value=s.value||'42';
      document.getElementById('bn-value-min').value=s.valueMin||'10';
      document.getElementById('bn-value-max').value=s.valueMax||'99';
      if(typeof bnValueModeChange==='function')bnValueModeChange();
      document.getElementById('bn-fb-ok').value=s.fbOk||'';
      document.getElementById('bn-fb-wrong').value=s.fbWrong||'';
      var _bnFbGen=document.getElementById('bn-fbgen');if(_bnFbGen)_bnFbGen.value=s.fbGen||'';
      if(typeof bnFormChange==='function')bnFormChange();
      break;
    case 'circuit':
      document.getElementById('cir-bareme').value=s.bareme||1;
      setRichVal('cir-text',s.text||'');
      document.getElementById('cir-scenario').value=s.scenario||'loi-ohm';
      document.getElementById('cir-ask').value=s.ask||'i';
      document.getElementById('cir-e').value=s.e||'9';
      document.getElementById('cir-r1').value=s.r1||'100';
      document.getElementById('cir-r2').value=s.r2||'220';
      document.getElementById('cir-r3').value=s.r3||'0';
      document.getElementById('cir-i-known').value=s.iKnown||'0';
      document.getElementById('cir-tol').value=s.tol||'5';
      document.getElementById('cir-fb-ok').value=s.fbOk||'';
      document.getElementById('cir-fb-wrong').value=s.fbWrong||'';
      var _cirFbGen=document.getElementById('cir-fbgen');if(_cirFbGen)_cirFbGen.value=s.fbGen||'';
      if(typeof cirFormChange==='function')cirFormChange();
      break;
    case 'logique':
      document.getElementById('lg-bareme').value=s.bareme||1;
      setRichVal('lg-text',s.text||'');
      document.getElementById('lg-scenario').value=s.scenario||'table';
      document.getElementById('lg-nb-vars').value=s.nbVars||'2';
      document.getElementById('lg-expr').value=s.expr||'(P and Q) or not(P)';
      document.getElementById('lg-expr2').value=s.expr2||'';
      document.getElementById('lg-expr3').value=s.expr3||'';
      document.getElementById('lg-expr4').value=s.expr4||'';
      document.getElementById('lg-subexpr1').value=s.subexpr1||'';
      document.getElementById('lg-subexpr2').value=s.subexpr2||'';
      document.getElementById('lg-tans').value=s.tans||'';
      document.getElementById('lg-nb-blanks').value=s.nbBlanks||'2';
      document.getElementById('lg-fb-ok').value=s.fbOk||'';
      document.getElementById('lg-fb-wrong').value=s.fbWrong||'';
      var _lgFbGen=document.getElementById('lg-fbgen');if(_lgFbGen)_lgFbGen.value=s.fbGen||'';
      if(typeof lgFormChange==='function')lgFormChange();
      break;
    case 'complexe':
      document.getElementById('cpx-bareme').value=s.bareme||1;
      setRichVal('cpx-text',s.text||'');
      document.getElementById('cpx-scenario').value=s.scenario||'forme-alg';
      document.getElementById('cpx-mode').value=s.mode||'fixe';
      document.getElementById('cpx-a').value=s.a||'2';
      document.getElementById('cpx-b').value=s.b||'3';
      document.getElementById('cpx-c').value=s.c||'1';
      document.getElementById('cpx-d').value=s.d||'-1';
      document.getElementById('cpx-op').value=s.op||'*';
      document.getElementById('cpx-eq-b').value=s.eqb||'-2';
      document.getElementById('cpx-eq-c').value=s.eqc||'5';
      document.getElementById('cpx-complexno').value=s.complexno||'i';
      document.getElementById('cpx-rand-min').value=s.randMin||'-5';
      document.getElementById('cpx-rand-max').value=s.randMax||'5';
      setRichVal('cpx-fbgen',s.fbGen||'');
      if(typeof cpxFormChange==='function')cpxFormChange();
      if (s.fbDetail && typeof CPX_FB_DEFS !== 'undefined') {
        Object.keys(CPX_FB_DEFS).forEach(function(scn){
          CPX_FB_DEFS[scn].forEach(function(item){
            var id=_cpxFbId(scn,item.key);
            if (s.fbDetail[id]) setRichVal(id, s.fbDetail[id]);
          });
        });
      }
      break;
    case 'calcul':
      document.getElementById('calc-bareme').value=s.bareme||1;
      setRichVal('calc-text',s.text||'');
      document.getElementById('calc-scenario').value=s.scenario||'derivee';
      document.getElementById('calc-expr').value=s.expr||'x^2 + sin(x)';
      document.getElementById('calc-a').value=s.a||'0';
      document.getElementById('calc-b').value=s.b||'1';
      setRichVal('calc-fb-ok',s.fbOk||'');
      setRichVal('calc-fb-wrong',s.fbWrong||'');
      setRichVal('calc-fbgen',s.fbGen||'');
      if(typeof calcFormChange==='function')calcFormChange();
      if(s.vars){
        Object.keys(s.vars).forEach(function(key){
          var ea=document.getElementById('calc-var-'+key+'-alea'), ef=document.getElementById('calc-var-'+key+'-fixe');
          if(ea) ea.value=s.vars[key].alea;
          if(ef) ef.value=s.vars[key].fixe;
        });
      }
      if(s.varMode){
        var r=document.querySelector('input[name="calc-var-mode-r"][value="'+s.varMode+'"]');
        if(r){ r.checked=true; if(typeof calcVarModeChange==='function')calcVarModeChange(s.varMode); }
      }
      break;
    case 'statistiques':
      document.getElementById('stat-bareme').value=s.bareme||1;
      setRichVal('stat-text',s.text||'');
      document.getElementById('stat-scenario').value=s.scenario||'moyenne';
      document.getElementById('stat-data').value=s.data||'2,5,8,3,7,4,6';
      document.getElementById('stat-display').value=s.display||'liste';
      document.getElementById('stat-data-decimals').value=s.dataDecimals||'1';
      document.getElementById('stat-varname').value=s.varName||'x';
      document.querySelectorAll('input[name="stat-rand-format-radio"]').forEach(function(r){ r.checked=(r.value===(s.randFormat||'decimal')); });
      document.querySelectorAll('input[name="stat-display-radio"]').forEach(function(r){ r.checked=(r.value===(s.display||'liste')); });
      setRichVal('stat-fb-ok',s.fbOk||'');
      setRichVal('stat-fb-wrong',s.fbWrong||'');
      setRichVal('stat-fbgen',s.fbGen||'');
      if(typeof statFormChange==='function')statFormChange();
      break;
    case 'matrices':
      document.getElementById('mat-bareme').value=s.bareme||1;
      setRichVal('mat-text',s.text||'');
      document.getElementById('mat-scenario').value=s.scenario||'produit-2x2';
      var matRMin=document.getElementById('mat-rand-min');if(matRMin)matRMin.value=s.randMin||'-3';
      var matRMax=document.getElementById('mat-rand-max');if(matRMax)matRMax.value=s.randMax||'3';
      var matFbOk=document.getElementById('mat-fb-ok');if(matFbOk)matFbOk.value=s.fbOk||'';
      var matFbWrong=document.getElementById('mat-fb-wrong');if(matFbWrong)matFbWrong.value=s.fbWrong||'';
      document.getElementById('mat-fbgen').value=s.fbGen||'';
      if(typeof matFormChange==='function')matFormChange();
      break;
    case 'geometrie':
      document.getElementById('geo-bareme').value=s.bareme||1;
      setRichVal('geo-text',s.text||'');
      document.getElementById('geo-scenario').value=s.scenario||'distance';
      var _gDim=document.getElementById('geo-dim');if(_gDim)_gDim.value=s.dim||'2d';
      var _gMode=document.getElementById('geo-mode');if(_gMode)_gMode.value=s.mode||'aleatoire';
      var _gP=['p1x','p1y','p1z','p2x','p2y','p2z','p3x','p3y','p3z'];
      _gP.forEach(function(k){var e=document.getElementById('geo-'+k);if(e)e.value=s[k]||'0';});
      setRichVal('geo-fb-ok',s.fbOk||'');
      setRichVal('geo-fb-wrong',s.fbWrong||'');
      setRichVal('geo-fbgen',s.fbGen||'');
      if(typeof geoFormChange==='function')geoFormChange();
      break;
    case 'suites':
      document.getElementById('sui-bareme').value=s.bareme||1;
      setRichVal('sui-text',s.text||'');
      document.getElementById('sui-scenario').value=s.scenario||'terme-arith';
      var _sMode=document.getElementById('sui-mode');if(_sMode)_sMode.value=s.mode||'aleatoire';
      document.getElementById('sui-u0').value=s.u0||'3';
      document.getElementById('sui-r').value=s.r||'2';
      document.getElementById('sui-q').value=s.q||'2';
      var _sK=document.getElementById('sui-k');if(_sK)_sK.value=s.k||'5';
      var _sB=['u0-min','u0-max','r-min','r-max','q-min','q-max','k-min','k-max'];
      var _sBDef={u0Min:'-5',u0Max:'5',rMin:'-5',rMax:'5',qMin:'-3',qMax:'3',kMin:'3',kMax:'6'};
      _sB.forEach(function(id){
        var camel=id.replace(/-(\w)/,function(_,c){return c.toUpperCase();});
        var e=document.getElementById('sui-'+id);if(e)e.value=s[camel]||_sBDef[camel];
      });
      document.getElementById('sui-fb-ok').value=s.fbOk||'';
      document.getElementById('sui-fb-wrong').value=s.fbWrong||'';
      document.getElementById('sui-fbgen').value=s.fbGen||'';
      if(typeof suiFormChange==='function')suiFormChange();
      break;
    case 'probabilites':
      document.getElementById('prob-bareme').value=s.bareme||1;
      setRichVal('prob-text',s.text||'');
      document.getElementById('prob-scenario').value=s.scenario||'combinaison';
      var _pMode=document.getElementById('prob-mode');if(_pMode)_pMode.value=s.mode||'aleatoire';
      document.getElementById('prob-n').value=s.n||'10';
      document.getElementById('prob-k').value=s.k||'3';
      document.getElementById('prob-p').value=s.p||'0.5';
      document.getElementById('prob-pa').value=s.pa||'0.3';
      document.getElementById('prob-pb').value=s.pb||'0.4';
      document.getElementById('prob-pab').value=s.pab||'0.1';
      var _pB=['n-min','n-max','k-min','k-max','p-min','p-max','pa-min','pa-max','pb-min','pb-max','pab-min','pab-max'];
      var _pBDef={nMin:'6',nMax:'12',kMin:'1',kMax:'6',pMin:'0.2',pMax:'0.8',paMin:'0.2',paMax:'0.7',pbMin:'0.2',pbMax:'0.7',pabMin:'0.05',pabMax:'0.25'};
      _pB.forEach(function(id){
        var camel=id.replace(/-(\w)/,function(_,c){return c.toUpperCase();});
        var e=document.getElementById('prob-'+id);if(e)e.value=s[camel]||_pBDef[camel];
      });
      document.getElementById('prob-fb-ok').value=s.fbOk||'';
      document.getElementById('prob-fb-wrong').value=s.fbWrong||'';
      document.getElementById('prob-fbgen').value=s.fbGen||'';
      if(typeof probFormChange==='function')probFormChange();
      break;
    case 'trigonometrie':
      document.getElementById('trig-bareme').value=s.bareme||1;
      setRichVal('trig-text',s.text||'');
      document.getElementById('trig-scenario').value=s.scenario||'valeur-exacte';
      var trigModeR=document.querySelector('input[name="trig-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(trigModeR) trigModeR.checked=true;
      document.getElementById('trig-fn').value=s.fn||'sin';
      document.getElementById('trig-angle').value=s.angle||'%pi/6';
      document.getElementById('trig-expr').value=s.expr||'sin(x)^2 + cos(x)^2';
      document.getElementById('trig-fb-ok').value=s.fbOk||'';
      document.getElementById('trig-fb-wrong').value=s.fbWrong||'';
      document.getElementById('trig-fbgen').value=s.fbGen||'';
      if(typeof trigFormChange==='function')trigFormChange();
      break;
    case 'polynomes':
      document.getElementById('pol-bareme').value=s.bareme||1;
      setRichVal('pol-text',s.text||'');
      document.getElementById('pol-scenario').value=s.scenario||'discriminant';
      var polModeR=document.querySelector('input[name="pol-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(polModeR) polModeR.checked=true;
      document.getElementById('pol-a').value=s.a||'1';
      document.getElementById('pol-b').value=s.b||'-5';
      document.getElementById('pol-c').value=s.c||'6';
      document.getElementById('pol-delta-min').value=s.deltaMin||'1';
      document.getElementById('pol-delta-max').value=s.deltaMax||'50';
      document.getElementById('pol-fb-ok').value=s.fbOk||'';
      document.getElementById('pol-fb-wrong').value=s.fbWrong||'';
      document.getElementById('pol-fbgen').value=s.fbGen||'';
      if(typeof polOnScenarioChange==='function')polOnScenarioChange();
      else if(typeof polFormChange==='function')polFormChange();
      break;
    case 'equivalence':
      document.getElementById('eq-bareme').value=s.bareme||1;
      setRichVal('eq-text',s.text||'');
      document.getElementById('eq-scenario').value=s.scenario||'developpement';
      document.getElementById('eq-formule').value=s.formule||'';
      document.getElementById('eq-variable').value=s.variable||'x';
      document.getElementById('eq-variables').value=s.variables||'x,y';
      document.getElementById('eq-resultat').value=s.resultat||'';
      document.getElementById('eq-etape-check').checked=!!s.etapeCheck;
      document.getElementById('eq-etape-val').value=s.etapeVal||'';
      document.getElementById('eq-fb-ok').value=s.fbOk||'';
      document.getElementById('eq-fb-wrong').value=s.fbWrong||'';
      document.getElementById('eq-fbgen').value=s.fbGen||'';
      if(typeof eqOnScenarioChange==='function')eqOnScenarioChange();
      break;
    case 'limites':
      document.getElementById('lim-bareme').value=s.bareme||1;
      setRichVal('lim-text',s.text||'');
      document.getElementById('lim-scenario').value=s.scenario||'plus-inf';
      var limModeR=document.querySelector('input[name="lim-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(limModeR) limModeR.checked=true;
      document.getElementById('lim-expr').value=s.expr||'(x^2-1)/(x-1)';
      document.getElementById('lim-point').value=s.point||'1';
      document.getElementById('lim-tans').value=s.tans||'2';
      document.getElementById('lim-fb-ok').value=s.fbOk||'';
      document.getElementById('lim-fb-wrong').value=s.fbWrong||'';
      document.getElementById('lim-fbgen').value=s.fbGen||'';
      if(typeof limFormChange==='function')limFormChange();
      break;
    case 'physique':
      document.getElementById('phy-bareme').value=s.bareme||1;
      setRichVal('phy-text',s.text||'');
      document.getElementById('phy-scenario').value=s.scenario||'mrua-vitesse';
      document.getElementById('phy-v0').value=s.v0||'0';
      document.getElementById('phy-a').value=s.a||'9.81';
      document.getElementById('phy-t').value=s.t||'3';
      document.getElementById('phy-m').value=s.m||'2';
      document.getElementById('phy-d').value=s.d||'5';
      document.getElementById('phy-fb-ok').value=s.fbOk||'';
      document.getElementById('phy-fb-wrong').value=s.fbWrong||'';
      document.getElementById('phy-fbgen').value=s.fbGen||'';
      if(typeof phyFormChange==='function')phyFormChange();
      break;
    case 'oscilloscope':
      document.getElementById('osc-bareme').value=s.bareme||1;
      setRichVal('osc-text',s.text||'');
      document.getElementById('osc-mode').value=s.mode||'periode_frequence';
      var _oscPedMode=document.getElementById('osc-ped-mode');if(_oscPedMode)_oscPedMode.value=s.pedMode||'guide';
      document.getElementById('osc-forme').value=s.forme||'aleatoire';
      document.getElementById('osc-freq-mode').value=s.freqMode||'fixed';
      document.getElementById('osc-ffreq').value=s.ffreq||'500';
      document.getElementById('osc-umax').value=s.umax||'3';
      document.getElementById('osc-evolt-base').value=s.evoltBase||'2000';
      document.getElementById('osc-evolt-range').value=s.evoltRange||'1000';
      document.getElementById('osc-tau-base').value=s.tauBase||'1000';
      document.getElementById('osc-tau-range').value=s.tauRange||'1000';
      document.getElementById('osc-fcarrier').value=s.fcarrier||'4000000';
      document.getElementById('osc-fmod').value=s.fmod||'2000';
      document.getElementById('osc-dt-min').value=s.dtMin||'4';
      document.getElementById('osc-dt-max').value=s.dtMax||'8';
      document.getElementById('osc-sh-auto').checked=s.shAuto!==false;
      document.getElementById('osc-sv-auto').checked=s.svAuto!==false;
      if(!s.shAuto) document.getElementById('osc-sh-idx').value=s.shIdx||'10';
      if(!s.svAuto) document.getElementById('osc-sv-idx').value=s.svIdx||'7';
      document.getElementById('osc-sh-idx').disabled=document.getElementById('osc-sh-auto').checked;
      document.getElementById('osc-sv-idx').disabled=document.getElementById('osc-sv-auto').checked;
      var _oscFbGen=document.getElementById('osc-fbgen');if(_oscFbGen)_oscFbGen.value=s.fbGen||'';
      if(typeof oscModeChange==='function')oscModeChange();
      if(typeof oscFreqModeChange==='function')oscFreqModeChange();
      if(typeof oscUpdateShSvAuto==='function')oscUpdateShSvAuto();
      break;
    case 'inequation':
      document.getElementById('ineq-bareme').value=s.bareme||1;
      setRichVal('ineq-text',s.text||'');
      document.getElementById('ineq-scenario').value=s.scenario||'lineaire';
      var ineqModeR=document.querySelector('input[name="ineq-mode-r"][value="'+(s.mode||'aleatoire')+'"]');
      if(ineqModeR) ineqModeR.checked=true;
      document.getElementById('ineq-a').value=s.a||'2';
      document.getElementById('ineq-b').value=s.b||'-6';
      document.getElementById('ineq-c').value=s.c||'0';
      document.getElementById('ineq-op').value=s.op||'>';
      document.getElementById('ineq-tans').value=s.tans||'oo(3,inf)';
      document.getElementById('ineq-fb-ok').value=s.fbOk||'';
      document.getElementById('ineq-fb-wrong').value=s.fbWrong||'';
      var _ineqFbGen=document.getElementById('ineq-fbgen');if(_ineqFbGen)_ineqFbGen.value=s.fbGen||'';
      if(typeof ineqFormChange==='function')ineqFormChange();
      break;
    case 'thermo':
      document.getElementById('thy-bareme').value=s.bareme||1;
      setRichVal('thy-text',s.text||'');
      document.getElementById('thy-scenario').value=s.scenario||'pression';
      document.getElementById('thy-P').value=s.P||'101325';
      document.getElementById('thy-V').value=s.V||'0.0224';
      document.getElementById('thy-n').value=s.n||'1';
      document.getElementById('thy-T').value=s.T||'273.15';
      document.getElementById('thy-m').value=s.m||'1';
      document.getElementById('thy-cp').value=s.cp||'4186';
      document.getElementById('thy-dT').value=s.dT||'10';
      document.getElementById('thy-fb-ok').value=s.fbOk||'';
      document.getElementById('thy-fb-wrong').value=s.fbWrong||'';
      var _thyFbGen=document.getElementById('thy-fbgen');if(_thyFbGen)_thyFbGen.value=s.fbGen||'';
      if(typeof thyFormChange==='function')thyFormChange();
      break;
    case 'optique':
      document.getElementById('opt-scenario').value=s.scenario||'lentille-convergente';
      document.getElementById('opt-bareme').value=s.bareme||1;
      setRichVal('opt-text',s.text||'');
      document.getElementById('opt-f').value=s.f||20;
      document.getElementById('opt-oa').value=s.oa||-30;
      document.getElementById('opt-ab').value=s.ab||2;
      document.getElementById('opt-mir-f').value=s.mirF||3;
      document.getElementById('opt-mir-sa').value=s.mirSa||7;
      document.getElementById('opt-mir-ab').value=s.mirAb||1.5;
      document.getElementById('opt-w').value=s.w||700;
      document.getElementById('opt-h').value=s.h||380;
      var _optFbGen=document.getElementById('opt-fbgen');if(_optFbGen)_optFbGen.value=s.fbGen||'';
      if(typeof optScenarioChange==='function')optScenarioChange();
      break;
    case 'apn':
      document.getElementById('apn-bareme').value=s.bareme||1;
      setRichVal('apn-text',s.text||'');
      document.getElementById('apn-unknown').value=s.unknown||'V';
      document.getElementById('apn-changed-D').checked=!!s.changedD;
      document.getElementById('apn-changed-V').checked=!!s.changedV;
      document.getElementById('apn-changed-I').checked=!!s.changedI;
      document.getElementById('apn-fb-ok').value=s.fbOk||'';
      document.getElementById('apn-fb-wrong').value=s.fbWrong||'';
      var _apnFbGen=document.getElementById('apn-fbgen');if(_apnFbGen)_apnFbGen.value=s.fbGen||'';
      if(typeof apnUnknownChange==='function')apnUnknownChange();
      break;
    case 'diffraction':
      document.getElementById('diff-bareme').value=s.bareme||1;
      setRichVal('diff-text',s.text||'');
      document.getElementById('diff-type').value=s.difftype||'fente_simple';
      document.getElementById('diff-mode').value=s.diffmode||'ecran';
      var diffRnd=document.getElementById('diff-random');
      if(diffRnd)diffRnd.checked=!!s.random;
      document.getElementById('diff-a').value=s.a||50;
      document.getElementById('diff-d').value=s.d||2;
      document.getElementById('diff-b').value=s.b||200;
      document.getElementById('diff-lambda').value=s.lambda||532;
      document.getElementById('diff-tol').value=s.tol||10;
      document.getElementById('diff-fb-ok').value=s.fbOk||'';
      document.getElementById('diff-fb-wrong').value=s.fbWrong||'';
      var _diffFbGen=document.getElementById('diff-fbgen');if(_diffFbGen)_diffFbGen.value=s.fbGen||'';
      if(typeof diffTypeChange==='function')diffTypeChange();
      if(typeof diffRandomToggle==='function')diffRandomToggle();
      break;
    case 'image-mesure':
      document.getElementById('imm-bareme').value=s.bareme||2;
      setRichVal('imm-text',s.text||'');
      document.getElementById('imm-img-w').value=s.imgW||'';
      document.getElementById('imm-img-h').value=s.imgH||'';
      document.getElementById('imm-r1x').value=s.r1x||'';
      document.getElementById('imm-r1y').value=s.r1y||'';
      document.getElementById('imm-r1v').value=s.r1v||'';
      document.getElementById('imm-r1desc').value=s.r1desc||'';
      document.getElementById('imm-r2x').value=s.r2x||'';
      document.getElementById('imm-r2y').value=s.r2y||'';
      document.getElementById('imm-r2v').value=s.r2v||'';
      document.getElementById('imm-r2desc').value=s.r2desc||'';
      document.getElementById('imm-unit').value=s.unit||'nm';
      document.getElementById('imm-tol').value=s.tol||5;
      var _immMode=document.getElementById('imm-mode');if(_immMode)_immMode.value=s.mode||'guide';
      document.getElementById('imm-fb-ok').value=s.fbOk||'';
      document.getElementById('imm-fb-wrong').value=s.fbWrong||'';
      var _immFbGen=document.getElementById('imm-fbgen');if(_immFbGen)_immFbGen.value=s.fbGen||'';
      if(s.imageData){
        document.getElementById('imm-image-data').value=s.imageData;
        var immImg=document.getElementById('imm-img');
        immImg.src=s.imageData;
        document.getElementById('imm-preview-wrap').style.display='';
        if(typeof immUpdateOverlay==='function')immUpdateOverlay();
      }
      document.getElementById('imm-targets').innerHTML='';
      (s.targets||[]).forEach(function(t){
        if(typeof immAddTarget!=='function')return;
        immAddTarget(t.desc,t.val);
        var _immRows=document.querySelectorAll('#imm-targets .imm-target-row');
        var _immLast=_immRows[_immRows.length-1];
        if(_immLast){
          var _immTypeSel=_immLast.querySelector('.imm-t-type');
          if(_immTypeSel)_immTypeSel.value=t.type||'position';
          if(t.px!==undefined&&t.px!==''&&t.px!==null){_immLast.dataset.px=t.px;_immLast.dataset.py=t.py;}
          if(t.px2!==undefined&&t.px2!==''&&t.px2!==null){_immLast.dataset.px2=t.px2;_immLast.dataset.py2=t.py2;}
        }
      });
      if(typeof immUpdateOverlay==='function')immUpdateOverlay();
      break;
  }
}

// ── RESET FORM (adapted from V3 app.js resetForm) ────────────────
function resetFormForType(type) {
  switch(type) {
    case 'checkbox':
      var cbOubliReset=document.getElementById('cb-show-oubli');if(cbOubliReset)cbOubliReset.checked=false;
      var cbFbGenShowFbReset=document.getElementById('cb-fbgen-showfb');if(cbFbGenShowFbReset)cbFbGenShowFbReset.checked=false;
      document.getElementById('cb-props').innerHTML='';
      if(typeof addCBRow==='function'){addCBRow(true);addCBRow(false);}
      setRichVal('cb-text','');document.getElementById('cb-bareme').value=1;
      document.getElementById('cb-xe').value=2;document.getElementById('cb-mode-xb').value='fixe';
      document.getElementById('cb-xb').value=1;document.getElementById('cb-xb').disabled=false;
      setRichVal('cb-fbc',I18N.t('msg.cb_fbc_default'));setRichVal('cb-fbe',I18N.t('msg.cb_fbe_default'));setRichVal('cb-fbgen','');
      var warnCb=document.getElementById('warn-cb-draw');if(warnCb)warnCb.style.display='none';
      break;
    case 'radio':
      document.getElementById('ra-vrais').innerHTML='';document.getElementById('ra-faux').innerHTML='';
      if(typeof addPoolRow==='function'){addPoolRow('ra-vrais',true,'','',true);addPoolRow('ra-faux',false,'','',true);}
      setRichVal('ra-text','');document.getElementById('ra-bareme').value=1;document.getElementById('ra-xe').value=2;
      setRichVal('ra-fbgen','');
      var raFbGenShowFbReset=document.getElementById('ra-fbgen-showfb');if(raFbGenShowFbReset)raFbGenShowFbReset.checked=false;
      if(typeof checkPoolWarn==='function')checkPoolWarn('ra');
      break;
    case 'dropdown':
      document.getElementById('dd-vrais').innerHTML='';document.getElementById('dd-faux').innerHTML='';
      if(typeof addPoolRow==='function'){addPoolRow('dd-vrais',true,'','',true);addPoolRow('dd-faux',false,'','',true);}
      setRichVal('dd-text','');document.getElementById('dd-bareme').value=1;document.getElementById('dd-xe').value=2;
      setRichVal('dd-fbgen','');
      var ddFbGenShowFbReset=document.getElementById('dd-fbgen-showfb');if(ddFbGenShowFbReset)ddFbGenShowFbReset.checked=false;
      if(typeof checkPoolWarn==='function')checkPoolWarn('dd');
      break;
    case 'algebraic':
      ['alg-text','alg-fbc','alg-fbe','alg-sol'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('alg-formula').value='';
      if(document.getElementById('alg-mode'))document.getElementById('alg-mode').value='libre';
      if(document.getElementById('alg-expr-display'))document.getElementById('alg-expr-display').value='';
      if(document.getElementById('alg-error'))document.getElementById('alg-error').value='';
      if(typeof toggleAlgMode==='function')toggleAlgMode();
      if (typeof ALG_FB_DEFS !== 'undefined') { Object.keys(ALG_FB_DEFS).forEach(function(mode){ ALG_FB_DEFS[mode].forEach(function(item){ setRichVal(_algFbId(mode,item.key), item.def); }); }); }
      break;
    case 'numerical':
      ['num-text','num-fbc','num-fbe'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('num-val').value='';
      break;
    case 'units':
      ['un-text','un-fbc','un-fbe','un-fbgen'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('un-val').value='';document.getElementById('un-unit').value='';
      break;
    case 'string':
      ['str-text','str-ans-rich','str-fbc','str-fbe','str-sol'].forEach(function(id){setRichVal(id,'');});
      document.getElementById('str-ans').value='';
      document.getElementById('str-aide-on').checked=false;
      if(typeof toggleStrAide==='function')toggleStrAide();
      var strAltsEl2=document.getElementById('str-alts');if(strAltsEl2)strAltsEl2.value='';
      break;
    case 'match':
      matchState={left:[],right:[],connections:[],selectedLeft:null};
      setRichVal('match-text','');
      if(typeof renderMatchLists==='function')renderMatchLists();
      var _matchfbGen=document.getElementById('match-fbgen');if(_matchfbGen)_matchfbGen.value='';
      break;
    case 'crossword':
      document.getElementById('cw-body').innerHTML='';
      if(typeof addCWRow==='function')addCWRow('','');
      setRichVal('cw-text','');
      var _cwfbGen=document.getElementById('cw-fbgen');if(_cwfbGen)_cwfbGen.value='';
      break;
    case 'doi':
      document.getElementById('doi-objects-list').innerHTML='';
      if(typeof doiAddRow==='function')doiAddRow('Terre','gravitationnel');
      setRichVal('doi-text','');
      document.getElementById('doi-main-obj').value='Système';document.getElementById('doi-extra').value='1';
      var _doifbGen=document.getElementById('doi-fbgen');if(_doifbGen)_doifbGen.value='';
      if(typeof doiRefresh==='function')doiRefresh();
      break;
    case 'chemical':
      setRichVal('chem-text','');
      document.getElementById('chem-editor-text').innerHTML='CH<sub>4</sub> + 2 O<sub>2</sub> -&gt; CO<sub>2</sub> + 2 H<sub>2</sub>O';
      var _chemfbGen=document.getElementById('chem-fbgen');if(_chemfbGen)_chemfbGen.value='';
      if(typeof chemUpdateLock==='function')chemUpdateLock();
      if(typeof chemParseAndPreview==='function')chemParseAndPreview();
      break;
    case 'chemical_topo':
      setRichVal('topo-text','');
      document.getElementById('topo-editor').innerText='CCCl + [OH-] -> CCO + [Cl-]';
      document.getElementById('topo-w_prt1').value=5;document.getElementById('topo-w_n0').value=20;
      document.getElementById('topo-w_n1').value=10;document.getElementById('topo-w_n2').value=40;
      document.getElementById('topo-w_n3').value=50;document.getElementById('topo-w_n4').value=25;
      document.getElementById('topo-w_n5').value=50;
      var _topofbGen=document.getElementById('topo-fbgen');if(_topofbGen)_topofbGen.value='';
      break;
    case 'composition':
      setRichVal('comp-text','');document.getElementById('comp-bareme').value=4;
      document.getElementById('comp-height').value='600px';
      if(document.getElementById('comp-msg'))document.getElementById('comp-msg').value=I18N.t('msg.comp_msg_default');
      var _compfbGen=document.getElementById('comp-fbgen');if(_compfbGen)_compfbGen.value='';
      break;
    case 'nuclear':
      setRichVal('nuc-text','');
      if(document.getElementById('nuc-editor'))document.getElementById('nuc-editor').innerText='';
      document.getElementById('nuc-bareme').value=1;
      if(typeof nucUpdateLock==='function')nucUpdateLock();
      if(typeof nucRenderPreview==='function')nucRenderPreview();
      var _nucfbGen=document.getElementById('nuc-fbgen');if(_nucfbGen)_nucfbGen.value='';
      break;
    case 'jxgdrop':
      if(typeof jdReset==='function')jdReset();
      var _jdfbGen=document.getElementById('jd-fbgen');if(_jdfbGen)_jdfbGen.value='';
      break;
    case 'geogebra':
      if(typeof ggbReset==='function')ggbReset();
      var _ggbfbGen=document.getElementById('ggb-fbgen');if(_ggbfbGen)_ggbfbGen.value='';
      break;
    case 'vf':
      document.getElementById('vf-props').innerHTML='';
      if(typeof addVFRow==='function'){addVFRow();}
      setRichVal('vf-text','');document.getElementById('vf-bareme').value=1;
      if(document.getElementById('vf-xe'))document.getElementById('vf-xe').value=1;
      if(document.getElementById('vf-xb')){document.getElementById('vf-xb').value=1;document.getElementById('vf-xb').disabled=false;}
      if(document.getElementById('vf-mode-xb'))document.getElementById('vf-mode-xb').value='fixe';
      setRichVal('vf-fbgen','');
      var vfFbGenShowFbReset=document.getElementById('vf-fbgen-showfb');if(vfFbGenShowFbReset)vfFbGenShowFbReset.checked=false;
      break;
    case 'ord':
      document.getElementById('ord-items').innerHTML='';
      if(typeof addOrdRow==='function'){addOrdRow();addOrdRow();addOrdRow();}
      setRichVal('ord-text','');document.getElementById('ord-bareme').value=1;
      document.getElementById('ord-clone').checked=false;
      var _ordfbGen=document.getElementById('ord-fbgen');if(_ordfbGen)_ordfbGen.value='';
      break;
    case 'imgclick':
      setRichVal('ic-text','');
      document.getElementById('ic-fb-ok').value='';document.getElementById('ic-fb-wrong').value='';
      var _icfbGen=document.getElementById('ic-fbgen');if(_icfbGen)_icfbGen.value='';
      document.getElementById('ic-bareme').value=1;
      var icModeDef=document.querySelector('input[name="ic-mode"][value="single"]');
      if(icModeDef)icModeDef.checked=true;
      document.getElementById('ic-seq-time').value=5;
      if(typeof icReset==='function')icReset();
      if(typeof icToggleMode==='function')icToggleMode();
      break;
    case 'glr':
      document.getElementById('glr-fn').value='';
      document.getElementById('glr-xmin').value=-10;document.getElementById('glr-xmax').value=10;
      document.getElementById('glr-ymin').value=-10;document.getElementById('glr-ymax').value=10;
      document.getElementById('glr-x0').value=0;document.getElementById('glr-tol').value=0.5;
      document.getElementById('glr-w').value=500;document.getElementById('glr-h').value=400;
      setRichVal('glr-text','');document.getElementById('glr-fb-ok').value='';document.getElementById('glr-fb-wrong').value='';
      var _glrfbGen=document.getElementById('glr-fbgen');if(_glrfbGen)_glrfbGen.value='';
      document.getElementById('glr-bareme').value=1;
      break;
    case 'rvbcmj':
      document.getElementById('rvb-imgdata').value='';
      if(typeof rvbClearImage==='function')rvbClearImage();
      var rvbFileClear=document.getElementById('rvb-file');if(rvbFileClear)rvbFileClear.value='';
      var rvbFnClear=document.getElementById('rvb-filename');if(rvbFnClear)rvbFnClear.textContent='';
      var rvbRvb=document.querySelector('input[name="rvb-mode"][value="rvb"]');if(rvbRvb)rvbRvb.checked=true;
      document.getElementById('rvb-nb').checked=false;document.getElementById('rvb-answer').value='';
      setRichVal('rvb-text','');document.getElementById('rvb-fb-ok').value='';document.getElementById('rvb-fb-wrong').value='';
      var _rvbfbGen=document.getElementById('rvb-fbgen');if(_rvbfbGen)_rvbfbGen.value='';
      document.getElementById('rvb-bareme').value=1;
      var rvbPF=document.getElementById('rvb-preview-filtered');
      if(rvbPF){rvbPF.style.display='none';rvbPF.innerHTML='';}
      break;
    case 'acide-base':
      setRichVal('ab-text','');
      document.getElementById('ab-bareme').value=1;
      document.getElementById('ab-method').value='colorimetrie';
      document.getElementById('ab-type').value='af-bf';
      document.getElementById('ab-n-protons').value='1';
      document.getElementById('ab-find').value='equivalence';
      document.getElementById('ab-c1').value=0.1;
      document.getElementById('ab-v1').value=20;
      document.getElementById('ab-c2').value=0.1;
      document.getElementById('ab-pka').value=4.8;
      document.getElementById('ab-pka2').value=9.2;
      document.getElementById('ab-pka3').value=12.35;
      document.getElementById('ab-tol-vol').value=0.5;
      document.getElementById('ab-w').value=500;
      document.getElementById('ab-h').value=400;
      document.querySelectorAll('.ab-ind-chk').forEach(function(el){el.checked=(['hel','bbt','phph'].indexOf(el.dataset.ind)!==-1);});
      var _abfbGen=document.getElementById('ab-fbgen');if(_abfbGen)_abfbGen.value='';
      if(typeof abFormChange==='function')abFormChange();
      break;
    case 'redox':
      setRichVal('rx-text','');
      document.getElementById('rx-bareme').value=1;
      document.getElementById('rx-find').value='equivalence';
      document.getElementById('rx-e1').value=1.51;
      document.getElementById('rx-n1').value=5;
      document.getElementById('rx-e2').value=0.77;
      document.getElementById('rx-n2').value=1;
      document.getElementById('rx-c1').value=0.02;
      document.getElementById('rx-c2').value=0.1;
      document.getElementById('rx-v2').value=20;
      document.getElementById('rx-titrant-name').value='KMnO₄';
      document.getElementById('rx-tol-vol').value=0.5;
      document.getElementById('rx-tol-e').value=0.05;
      document.getElementById('rx-w').value=500;
      document.getElementById('rx-h').value=400;
      document.getElementById('rx-fb-ok').value='';
      document.getElementById('rx-fb-wrong').value='';
      var _rxfbGen=document.getElementById('rx-fbgen');if(_rxfbGen)_rxfbGen.value='';
      if(typeof rxFormChange==='function')rxFormChange();
      break;
    case 'basen':
      setRichVal('bn-text','');
      document.getElementById('bn-bareme').value=1;
      document.getElementById('bn-format').value='S';
      document.getElementById('bn-from-base').value='10';
      document.getElementById('bn-to-base').value='2';
      document.getElementById('bn-value-mode').value='fixe';
      document.getElementById('bn-value-base').value='depart';
      document.getElementById('bn-value').value='42';
      document.getElementById('bn-value-min').value='10';
      document.getElementById('bn-value-max').value='99';
      document.getElementById('bn-fb-ok').value='';
      document.getElementById('bn-fb-wrong').value='';
      var _bnfbGen=document.getElementById('bn-fbgen');if(_bnfbGen)_bnfbGen.value='';
      if(typeof bnValueModeChange==='function')bnValueModeChange();
      break;
    case 'circuit':
      setRichVal('cir-text','');
      document.getElementById('cir-bareme').value=1;
      document.getElementById('cir-scenario').value='loi-ohm';
      document.getElementById('cir-ask').value='i';
      document.getElementById('cir-e').value='9';
      document.getElementById('cir-r1').value='100';
      document.getElementById('cir-r2').value='220';
      document.getElementById('cir-r3').value='0';
      document.getElementById('cir-i-known').value='0';
      document.getElementById('cir-tol').value='5';
      document.getElementById('cir-fb-ok').value='';
      document.getElementById('cir-fb-wrong').value='';
      var _cirfbGen=document.getElementById('cir-fbgen');if(_cirfbGen)_cirfbGen.value='';
      if(typeof cirFormChange==='function')cirFormChange();
      break;
    case 'logique':
      setRichVal('lg-text','');
      document.getElementById('lg-bareme').value=1;
      document.getElementById('lg-scenario').value='table';
      document.getElementById('lg-nb-vars').value='2';
      document.getElementById('lg-expr').value='(P and Q) or not(P)';
      document.getElementById('lg-expr2').value='';
      document.getElementById('lg-expr3').value='';
      document.getElementById('lg-expr4').value='';
      document.getElementById('lg-subexpr1').value='';
      document.getElementById('lg-subexpr2').value='';
      document.getElementById('lg-tans').value='';
      document.getElementById('lg-nb-blanks').value='2';
      document.getElementById('lg-fb-ok').value='';
      document.getElementById('lg-fb-wrong').value='';
      var _lgfbGen=document.getElementById('lg-fbgen');if(_lgfbGen)_lgfbGen.value='';
      if(typeof lgFormChange==='function')lgFormChange();
      break;
    case 'complexe':
      setRichVal('cpx-text','');
      document.getElementById('cpx-bareme').value=1;
      document.getElementById('cpx-scenario').value='forme-alg';
      document.getElementById('cpx-mode').value='fixe';
      document.getElementById('cpx-a').value='2';
      document.getElementById('cpx-b').value='3';
      document.getElementById('cpx-c').value='1';
      document.getElementById('cpx-d').value='-1';
      document.getElementById('cpx-op').value='*';
      document.getElementById('cpx-eq-b').value='-2';
      document.getElementById('cpx-eq-c').value='5';
      document.getElementById('cpx-complexno').value='i';
      document.getElementById('cpx-rand-min').value='-5';
      document.getElementById('cpx-rand-max').value='5';
      setRichVal('cpx-fbgen','');
      if(typeof cpxFormChange==='function')cpxFormChange();
      if (typeof CPX_FB_DEFS !== 'undefined') {
        Object.keys(CPX_FB_DEFS).forEach(function(scn){
          CPX_FB_DEFS[scn].forEach(function(item){
            setRichVal(_cpxFbId(scn,item.key), item.def);
          });
        });
      }
      break;
    case 'calcul':
      setRichVal('calc-text','');
      document.getElementById('calc-bareme').value=1;
      document.getElementById('calc-scenario').value='derivee';
      document.getElementById('calc-expr').value='x^2 + sin(x)';
      document.getElementById('calc-a').value='0';
      document.getElementById('calc-b').value='1';
      setRichVal('calc-fb-ok','');
      setRichVal('calc-fb-wrong','');
      setRichVal('calc-fbgen','');
      if(typeof calcFormChange==='function')calcFormChange();
      break;
    case 'statistiques':
      setRichVal('stat-text','');
      document.getElementById('stat-bareme').value=1;
      document.getElementById('stat-scenario').value='moyenne';
      document.getElementById('stat-data').value='2,5,8,3,7,4,6';
      document.getElementById('stat-display').value='liste';
      document.getElementById('stat-data-decimals').value='1';
      document.getElementById('stat-varname').value='x';
      document.querySelectorAll('input[name="stat-rand-format-radio"]').forEach(function(r){ r.checked=(r.value==='decimal'); });
      document.querySelectorAll('input[name="stat-display-radio"]').forEach(function(r){ r.checked=(r.value==='liste'); });
      setRichVal('stat-fb-ok','');
      setRichVal('stat-fb-wrong','');
      setRichVal('stat-fbgen','');
      if(typeof statFormChange==='function')statFormChange();
      break;
    case 'matrices':
      setRichVal('mat-text','');
      document.getElementById('mat-bareme').value=1;
      document.getElementById('mat-scenario').value='produit-2x2';
      var matRMinR=document.getElementById('mat-rand-min');if(matRMinR)matRMinR.value='-3';
      var matRMaxR=document.getElementById('mat-rand-max');if(matRMaxR)matRMaxR.value='3';
      var matFbOkR=document.getElementById('mat-fb-ok');if(matFbOkR)matFbOkR.value='';
      var matFbWrongR=document.getElementById('mat-fb-wrong');if(matFbWrongR)matFbWrongR.value='';
      document.getElementById('mat-fbgen').value='';
      if(typeof matFormChange==='function')matFormChange();
      break;
    case 'geometrie':
      setRichVal('geo-text','');
      document.getElementById('geo-bareme').value=1;
      document.getElementById('geo-scenario').value='distance';
      var _gDimR=document.getElementById('geo-dim');if(_gDimR)_gDimR.value='2d';
      var _gModeR=document.getElementById('geo-mode');if(_gModeR)_gModeR.value='aleatoire';
      setRichVal('geo-fb-ok','');
      setRichVal('geo-fb-wrong','');
      setRichVal('geo-fbgen','');
      if(typeof geoFormChange==='function')geoFormChange();
      break;
    case 'suites':
      setRichVal('sui-text','');
      document.getElementById('sui-bareme').value=1;
      document.getElementById('sui-scenario').value='terme-arith';
      var _srMode=document.getElementById('sui-mode');if(_srMode)_srMode.value='aleatoire';
      document.getElementById('sui-u0').value='3';
      document.getElementById('sui-r').value='2';
      document.getElementById('sui-q').value='2';
      var _srK=document.getElementById('sui-k');if(_srK)_srK.value='5';
      var _srB={'u0-min':'-5','u0-max':'5','r-min':'-5','r-max':'5','q-min':'-3','q-max':'3','k-min':'3','k-max':'6'};
      Object.keys(_srB).forEach(function(id){var e=document.getElementById('sui-'+id);if(e)e.value=_srB[id];});
      document.getElementById('sui-fb-ok').value='';
      document.getElementById('sui-fb-wrong').value='';
      document.getElementById('sui-fbgen').value='';
      if(typeof suiFormChange==='function')suiFormChange();
      break;
    case 'probabilites':
      setRichVal('prob-text','');
      document.getElementById('prob-bareme').value=1;
      document.getElementById('prob-scenario').value='combinaison';
      var _prMode=document.getElementById('prob-mode');if(_prMode)_prMode.value='aleatoire';
      document.getElementById('prob-n').value='10';
      document.getElementById('prob-k').value='3';
      document.getElementById('prob-p').value='0.5';
      document.getElementById('prob-pa').value='0.3';
      document.getElementById('prob-pb').value='0.4';
      document.getElementById('prob-pab').value='0.1';
      var _prB={'n-min':'6','n-max':'12','k-min':'1','k-max':'6','p-min':'0.2','p-max':'0.8','pa-min':'0.2','pa-max':'0.7','pb-min':'0.2','pb-max':'0.7','pab-min':'0.05','pab-max':'0.25'};
      Object.keys(_prB).forEach(function(id){var e=document.getElementById('prob-'+id);if(e)e.value=_prB[id];});
      document.getElementById('prob-fb-ok').value='';
      document.getElementById('prob-fb-wrong').value='';
      document.getElementById('prob-fbgen').value='';
      if(typeof probFormChange==='function')probFormChange();
      break;
    case 'trigonometrie':
      setRichVal('trig-text','');
      document.getElementById('trig-bareme').value=1;
      document.getElementById('trig-scenario').value='valeur-exacte';
      var trigModeRReset=document.querySelector('input[name="trig-mode-r"][value="aleatoire"]');
      if(trigModeRReset) trigModeRReset.checked=true;
      document.getElementById('trig-fn').value='sin';
      document.getElementById('trig-angle').value='%pi/6';
      document.getElementById('trig-expr').value='sin(x)^2 + cos(x)^2';
      document.getElementById('trig-fb-ok').value='';
      document.getElementById('trig-fb-wrong').value='';
      document.getElementById('trig-fbgen').value='';
      if(typeof trigFormChange==='function')trigFormChange();
      break;
    case 'polynomes':
      setRichVal('pol-text','');
      document.getElementById('pol-bareme').value=1;
      document.getElementById('pol-scenario').value='discriminant';
      var polModeRReset=document.querySelector('input[name="pol-mode-r"][value="aleatoire"]');
      if(polModeRReset) polModeRReset.checked=true;
      document.getElementById('pol-a').value='1';
      document.getElementById('pol-b').value='-5';
      document.getElementById('pol-c').value='6';
      document.getElementById('pol-delta-min').value='1';
      document.getElementById('pol-delta-max').value='50';
      document.getElementById('pol-fb-ok').value='';
      document.getElementById('pol-fb-wrong').value='';
      document.getElementById('pol-fbgen').value='';
      if(typeof polFormChange==='function')polFormChange();
      break;
    case 'equivalence':
      setRichVal('eq-text','');
      document.getElementById('eq-bareme').value=1;
      document.getElementById('eq-scenario').value='developpement';
      document.getElementById('eq-formule').value='';
      document.getElementById('eq-variable').value='x';
      document.getElementById('eq-variables').value='x,y';
      document.getElementById('eq-resultat').value='';
      document.getElementById('eq-etape-check').checked=false;
      document.getElementById('eq-etape-val').value='';
      document.getElementById('eq-fb-ok').value='';
      document.getElementById('eq-fb-wrong').value='';
      document.getElementById('eq-fbgen').value='';
      if(typeof eqFormChange==='function')eqFormChange();
      break;
    case 'limites':
      setRichVal('lim-text','');
      document.getElementById('lim-bareme').value=1;
      document.getElementById('lim-scenario').value='plus-inf';
      var limModeRReset=document.querySelector('input[name="lim-mode-r"][value="aleatoire"]');
      if(limModeRReset) limModeRReset.checked=true;
      document.getElementById('lim-expr').value='(x^2-1)/(x-1)';
      document.getElementById('lim-point').value='1';
      document.getElementById('lim-tans').value='2';
      document.getElementById('lim-fb-ok').value='';
      document.getElementById('lim-fb-wrong').value='';
      document.getElementById('lim-fbgen').value='';
      if(typeof limFormChange==='function')limFormChange();
      break;
    case 'physique':
      setRichVal('phy-text','');
      document.getElementById('phy-bareme').value=1;
      document.getElementById('phy-scenario').value='mrua-vitesse';
      document.getElementById('phy-v0').value='0';
      document.getElementById('phy-a').value='9.81';
      document.getElementById('phy-t').value='3';
      document.getElementById('phy-m').value='2';
      document.getElementById('phy-d').value='5';
      document.getElementById('phy-fb-ok').value='';
      document.getElementById('phy-fb-wrong').value='';
      document.getElementById('phy-fbgen').value='';
      if(typeof phyFormChange==='function')phyFormChange();
      break;
    case 'oscilloscope':
      setRichVal('osc-text','');
      document.getElementById('osc-bareme').value=1;
      document.getElementById('osc-mode').value='periode_frequence';
      var _oscPedModeReset=document.getElementById('osc-ped-mode');if(_oscPedModeReset)_oscPedModeReset.value='guide';
      document.getElementById('osc-forme').value='aleatoire';
      document.getElementById('osc-freq-mode').value='fixed';
      document.getElementById('osc-ffreq').value='500';
      document.getElementById('osc-umax').value='3';
      document.getElementById('osc-evolt-base').value='2000';
      document.getElementById('osc-evolt-range').value='1000';
      document.getElementById('osc-tau-base').value='1000';
      document.getElementById('osc-tau-range').value='1000';
      document.getElementById('osc-fcarrier').value='4000000';
      document.getElementById('osc-fmod').value='2000';
      document.getElementById('osc-dt-min').value='4';
      document.getElementById('osc-dt-max').value='8';
      document.getElementById('osc-sh-auto').checked=true;
      document.getElementById('osc-sv-auto').checked=true;
      document.getElementById('osc-sh-idx').disabled=true;
      document.getElementById('osc-sv-idx').disabled=true;
      var _oscfbGen=document.getElementById('osc-fbgen');if(_oscfbGen)_oscfbGen.value='';
      if(typeof oscModeChange==='function')oscModeChange();
      if(typeof oscFreqModeChange==='function')oscFreqModeChange();
      if(typeof oscUpdateShSvAuto==='function')oscUpdateShSvAuto();
      break;
    case 'inequation':
      setRichVal('ineq-text','');
      document.getElementById('ineq-bareme').value=1;
      document.getElementById('ineq-scenario').value='lineaire';
      var ineqModeRReset=document.querySelector('input[name="ineq-mode-r"][value="aleatoire"]');
      if(ineqModeRReset) ineqModeRReset.checked=true;
      document.getElementById('ineq-a').value='2';
      document.getElementById('ineq-b').value='-6';
      document.getElementById('ineq-c').value='0';
      document.getElementById('ineq-op').value='>';
      document.getElementById('ineq-tans').value='oo(3,inf)';
      document.getElementById('ineq-fb-ok').value='';
      document.getElementById('ineq-fb-wrong').value='';
      var _ineqfbGen=document.getElementById('ineq-fbgen');if(_ineqfbGen)_ineqfbGen.value='';
      if(typeof ineqFormChange==='function')ineqFormChange();
      break;
    case 'thermo':
      setRichVal('thy-text','');
      document.getElementById('thy-bareme').value=1;
      document.getElementById('thy-scenario').value='pression';
      document.getElementById('thy-P').value='101325';
      document.getElementById('thy-V').value='0.0224';
      document.getElementById('thy-n').value='1';
      document.getElementById('thy-T').value='273.15';
      document.getElementById('thy-m').value='1';
      document.getElementById('thy-cp').value='4186';
      document.getElementById('thy-dT').value='10';
      document.getElementById('thy-fb-ok').value='';
      document.getElementById('thy-fb-wrong').value='';
      var _thyfbGen=document.getElementById('thy-fbgen');if(_thyfbGen)_thyfbGen.value='';
      if(typeof thyFormChange==='function')thyFormChange();
      break;
    case 'optique':
      setRichVal('opt-text','');
      document.getElementById('opt-scenario').value='lentille-convergente';
      document.getElementById('opt-bareme').value=1;
      document.getElementById('opt-f').value=20;
      document.getElementById('opt-oa').value=-30;
      document.getElementById('opt-ab').value=2;
      document.getElementById('opt-mir-f').value=3;
      document.getElementById('opt-mir-sa').value=7;
      document.getElementById('opt-mir-ab').value=1.5;
      document.getElementById('opt-w').value=700;
      document.getElementById('opt-h').value=380;
      var _optfbGen=document.getElementById('opt-fbgen');if(_optfbGen)_optfbGen.value='';
      if(typeof optScenarioChange==='function')optScenarioChange();
      break;
    case 'apn':
      setRichVal('apn-text','');
      document.getElementById('apn-bareme').value=1;
      document.getElementById('apn-unknown').value='V';
      document.getElementById('apn-changed-D').checked=true;
      document.getElementById('apn-changed-V').checked=false;
      document.getElementById('apn-changed-I').checked=false;
      document.getElementById('apn-fb-ok').value='';
      document.getElementById('apn-fb-wrong').value='';
      var _apnfbGen=document.getElementById('apn-fbgen');if(_apnfbGen)_apnfbGen.value='';
      if(typeof apnUnknownChange==='function')apnUnknownChange();
      break;
    case 'diffraction':
      setRichVal('diff-text','');
      document.getElementById('diff-bareme').value=1;
      document.getElementById('diff-type').value='fente_simple';
      document.getElementById('diff-mode').value='ecran';
      document.getElementById('diff-random').checked=true;
      document.getElementById('diff-a').value=50;
      document.getElementById('diff-d').value=2;
      document.getElementById('diff-b').value=200;
      document.getElementById('diff-lambda').value=532;
      document.getElementById('diff-tol').value=10;
      document.getElementById('diff-fb-ok').value='';
      document.getElementById('diff-fb-wrong').value='';
      var _difffbGen=document.getElementById('diff-fbgen');if(_difffbGen)_difffbGen.value='';
      if(typeof diffTypeChange==='function')diffTypeChange();
      if(typeof diffRandomToggle==='function')diffRandomToggle();
      break;
    case 'image-mesure':
      setRichVal('imm-text','');
      document.getElementById('imm-bareme').value=2;
      document.getElementById('imm-image-data').value='';
      document.getElementById('imm-img-w').value='';
      document.getElementById('imm-img-h').value='';
      document.getElementById('imm-preview-wrap').style.display='none';
      document.getElementById('imm-r1x').value='';
      document.getElementById('imm-r1y').value='';
      document.getElementById('imm-r1v').value='';
      document.getElementById('imm-r1desc').value='';
      document.getElementById('imm-r2x').value='';
      document.getElementById('imm-r2y').value='';
      document.getElementById('imm-r2v').value='';
      document.getElementById('imm-r2desc').value='';
      document.getElementById('imm-unit').value='nm';
      document.getElementById('imm-tol').value=5;
      var _immModeReset=document.getElementById('imm-mode');if(_immModeReset)_immModeReset.value='guide';
      document.getElementById('imm-fb-ok').value='';
      document.getElementById('imm-fb-wrong').value='';
      var _immfbGen=document.getElementById('imm-fbgen');if(_immfbGen)_immfbGen.value='';
      document.getElementById('imm-targets').innerHTML='';
      if(typeof immAddTarget==='function')immAddTarget();
      break;
    case 'expert':
      if(typeof expertInit==='function') expertInit(_activeQid);
      break;
  }
}


