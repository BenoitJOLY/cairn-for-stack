// gen-expert.js — Generator for expert STACK questions

/* ── Build <input> XML ─────────────────────────────────────────── */
function buildInputXml(inp){
  function e(v){ return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  return [
    '    <input>',
    '      <name>'+e(inp.name)+'</name>',
    '      <type>'+e(inp.type||'algebraic')+'</type>',
    '      <tans>'+e(inp.tans)+'</tans>',
    '      <boxsize>'+(inp.boxsize||15)+'</boxsize>',
    '      <strictsyntax>'+(inp.strictsyntax===0?0:1)+'</strictsyntax>',
    '      <insertstars>'+(inp.insertstars||0)+'</insertstars>',
    '      <syntaxhint>'+e(inp.syntaxhint)+'</syntaxhint>',
    '      <syntaxattribute>0</syntaxattribute>',
    '      <forbidwords>'+e(inp.forbidwords)+'</forbidwords>',
    '      <allowwords>'+e(inp.allowwords)+'</allowwords>',
    '      <forbidfloat>'+(inp.forbidfloat===0?0:1)+'</forbidfloat>',
    '      <requirelowestterms>'+(inp.requirelowestterms||0)+'</requirelowestterms>',
    '      <checkanswertype>'+(inp.checkanswertype||0)+'</checkanswertype>',
    '      <mustverify>'+(inp.mustverify===0?0:1)+'</mustverify>',
    '      <showvalidation>'+(inp.showvalidation!=null?+inp.showvalidation:1)+'</showvalidation>',
    '      <options>'+e(inp.options)+'</options>',
    '    </input>'
  ].join('\n');
}

/* ── Generator ─────────────────────────────────────────────────── */
function genExpertParams(qid){
  var q=questions[qid];
  if(!q) throw new Error(I18N.t('msg.err_expert_q_introuvable'));

  /* Sync live form → _expertState */
  if(typeof expertCaptureToState==='function') expertCaptureToState(qid);

  var s=q._expertState;
  if(!s) throw new Error(I18N.t('msg.err_expert_state'));

  return s;
}

async function genExpert(qid){
  var s = genExpertParams(qid);
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'expert', X: qid, params: s})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "expert", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "expert", repli sur le calcul local.', e); }
  return genExpertCore(s);
}

/* genExpertCore : fonction pure (aucun accès DOM ni au store `questions`),
   voir js/gen-redox.js pour le pattern (deps injectables pour les tests
   Node — test/unit/gen-expert.test.js). */
function genExpertCore(s, deps){
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var inferFbKind_D = deps.inferFbKind || inferFbKind;

  var inputs=s.inputs||[];
  var prts=s.prts||[];

  if(!inputs.length) throw new Error(I18N_D.t('msg.err_expert_input_requis'));
  if(!prts.length)   throw new Error(I18N_D.t('msg.err_expert_prt_requis'));

  /* Validate inputs */
  for(var i=0;i<inputs.length;i++){
    if(!String(inputs[i].name||'').match(/^[a-zA-Z][a-zA-Z0-9_]*$/))
      throw new Error(I18N_D.t('msg.err_expert_input_nom', {name: inputs[i].name}));
    if(!String(inputs[i].tans||'').trim())
      throw new Error(I18N_D.t('msg.err_expert_tans', {name: inputs[i].name}));
  }

  /* Validate PRTs */
  for(var j=0;j<prts.length;j++){
    var prt=prts[j];
    if(!String(prt.name||'').match(/^[a-zA-Z][a-zA-Z0-9_]*$/))
      throw new Error(I18N_D.t('msg.err_expert_prt_nom', {name: prt.name}));
    if(!(prt.nodes&&prt.nodes.length))
      throw new Error(I18N_D.t('msg.err_expert_prt_noeud', {name: prt.name}));
    /* Détection de boucle infinie : DFS depuis le nœud 0 */
    var nodeIds=prt.nodes.map(function(n){return String(n.id||n.name||n.nodeid);});
    var adjTrue={}, adjFalse={};
    prt.nodes.forEach(function(n){
      var id=String(n.id||n.name||n.nodeid);
      adjTrue[id]  = String(n.truenextnode||n.truenode||'END');
      adjFalse[id] = String(n.falsenextnode||n.falsenode||'END');
    });
    /* Vérifier chaque nœud : si on peut atteindre ce même nœud en suivant un chemin */
    function _hasCycle(startId){
      var visited={}; var stack=[startId];
      while(stack.length){
        var cur=stack.pop();
        if(cur==='END'||cur==='-1') continue;
        if(visited[cur]) return true;
        visited[cur]=true;
        if(adjTrue[cur]) stack.push(adjTrue[cur]);
        if(adjFalse[cur]) stack.push(adjFalse[cur]);
      }
      return false;
    }
    for(var ni=0;ni<nodeIds.length;ni++){
      /* Simuler DFS en partant du successeur de ce nœud pour détecter s'il revient sur lui */
      var nid=nodeIds[ni];
      var subVisited={}; var subStack=[adjTrue[nid],adjFalse[nid]];
      var cycleFound=false;
      while(subStack.length&&!cycleFound){
        var cur2=subStack.pop();
        if(!cur2||cur2==='END'||cur2==='-1') continue;
        if(cur2===nid){cycleFound=true;break;}
        if(subVisited[cur2]) continue;
        subVisited[cur2]=true;
        if(adjTrue[cur2]) subStack.push(adjTrue[cur2]);
        if(adjFalse[cur2]) subStack.push(adjFalse[cur2]);
      }
      if(cycleFound) throw new Error(I18N_D.t('msg.err_expert_boucle', {name: prt.name, nid: nid}));
    }
    /* Vérifier que les nœuds référencés existent */
    prt.nodes.forEach(function(n){
      var id=String(n.id||n.name||n.nodeid);
      var tNext=adjTrue[id]; var fNext=adjFalse[id];
      if(tNext&&tNext!=='END'&&tNext!=='-1'&&nodeIds.indexOf(tNext)<0)
        throw new Error(I18N_D.t('msg.err_expert_succ_vrai', {name: prt.name, id: id, tnext: tNext}));
      if(fNext&&fNext!=='END'&&fNext!=='-1'&&nodeIds.indexOf(fNext)<0)
        throw new Error(I18N_D.t('msg.err_expert_succ_faux', {name: prt.name, id: id, fnext: fNext}));
    });
    /* Vérifier que tous les nœuds sont atteignables depuis le nœud racine (0) */
    var rootId=nodeIds[0];
    var reachable={}; var rStack=[rootId];
    while(rStack.length){
      var rCur=rStack.pop();
      if(!rCur||rCur==='END'||rCur==='-1'||reachable[rCur]) continue;
      reachable[rCur]=true;
      if(adjTrue[rCur]&&adjTrue[rCur]!=='END'&&adjTrue[rCur]!=='-1') rStack.push(adjTrue[rCur]);
      if(adjFalse[rCur]&&adjFalse[rCur]!=='END'&&adjFalse[rCur]!=='-1') rStack.push(adjFalse[rCur]);
    }
    var orphans=nodeIds.filter(function(id){ return !reachable[id]; });
    if(orphans.length)
      throw new Error(I18N_D.t('msg.err_expert_orphelins', {name: prt.name, orphans: orphans.join(', ')}));
  }

  var inputXML = inputs.map(buildInputXml).join('\n');

  var prtXML = prts.map(function(prt){
    var xmlNodes = (prt.nodes||[]).map(function(n){
      return Object.assign({}, n, {
        truefeedback:  applyFbBox_D(inferFbKind_D(n,'true'),  n.truefeedback),
        falsefeedback: applyFbBox_D(inferFbKind_D(n,'false'), n.falsefeedback)
      });
    });
    return buildPrtXml_D(
      { name:prt.name, value:String(prt.value||1),
        autosimplify:String(prt.autosimplify===0?0:1),
        feedbackstyle:String(prt.feedbackstyle||2),
        feedbackvariables:prt.feedbackvariables||'' },
      xmlNodes
    );
  }).join('\n');

  var feedbackRef = prts.map(function(prt){
    return '<p>[[feedback:'+prt.name+']]</p>';
  }).join('\n');

  return {
    bareme:    parseFloat(s.bareme)||1,
    penalty:   parseFloat(s.penalty)||0,
    vars:      s.vars||'',
    textFrag:  s.questiontext||'',
    inputXML:  inputXML,
    prtXML:    prtXML,
    feedbackRef: feedbackRef,
    generalFeedback: applyFbBox_D('general', s.generalfeedback||''),
    qnote:     s.questionnote||'',
    name:      s.name||''
  };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genExpert: genExpert, genExpertCore: genExpertCore, genExpertParams: genExpertParams, buildInputXml: buildInputXml };
}
