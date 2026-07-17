// app.js — V4 orchestration: buildXML, confirmAndPreview, doDownload, shared vars, tags, init

// Convertit les délimiteurs LaTeX et CAS vers le format attendu par Moodle/STACK
// Appliqué uniquement au contenu HTML (questiontext, feedbacks) — pas au code Maxima
function moodleLatex(s) {
  if (!s) return s || '';
  // $$...$$ → \[...\]  (display math — AVANT inline pour éviter double-conversion)
  s = s.replace(/\$\$([^$]*?)\$\$/gs, '\\[$1\\]');
  // $...$ → \(...\)  (inline math)
  s = s.replace(/\$([^$\n]*?)\$/g, '\\($1\\)');
  // @...@ → {@...@}  (CAS STACK — seulement si pas déjà entouré de {})
  // (?!\}) sur le @ initial : empêche le @} de fermeture d'un {@ existant de démarrer un nouveau match
  s = s.replace(/(?<!\{)@(?!\})([^@]+?)@(?!\})/g, '{@$1@}');
  return s;
}

// Convertit les éléments .math-inline/.math-block (rendu KaTeX stocké dans data-math)
// en délimiteurs Moodle \(...\) / \[...\] pour l'export XML
function stripMathDivs(html) {
  if (!html) return html || '';
  var div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('.math-inline').forEach(function(el) {
    var f = el.getAttribute('data-math');
    if (f) el.replaceWith(document.createTextNode('\\(' + f + '\\)'));
  });
  div.querySelectorAll('.math-block').forEach(function(el) {
    var f = el.getAttribute('data-math');
    if (f) el.replaceWith(document.createTextNode('\\[' + f + '\\]'));
  });
  div.querySelectorAll('.lx-span').forEach(function(el) {
    var f = el.getAttribute('data-f'), m = el.getAttribute('data-m');
    if (f) el.replaceWith(document.createTextNode(m === 'block' ? '\\[' + f + '\\]' : '\\(' + f + '\\)'));
  });
  return div.innerHTML;
}

// ── XML BUILD ────────────────────────────────────────────────────
function buildXML() {
  var orderedQ = getQuestionsInDOMOrder();
  if (!orderedQ.length) throw new Error(I18N.t('msg.aucune_question_a_previsualiser') || 'Aucune question configurée.');

  // Garde-fou XML : STACK interdit de mélanger, dans une même question, un
  // input à correction manuelle (Composition Libre) et un input à correction
  // automatique. Les points d'insertion (palette/drag&drop) bloquent déjà ce
  // cas, mais on revalide ici (état restauré depuis localStorage, etc.).
  if (orderedQ.some(function(q){ return q.type === 'composition'; }) && orderedQ.length > 1) {
    throw new Error(I18N.t('msg.err_composition_exclusive'));
  }

  var tags = _tmNoTag ? [] : getTagList();
  // Tags obligatoires : "stack" + un tag par type de question (toujours ajoutés)
  var mandatoryClean = new Set(['stack']);
  var typeSet = new Set(orderedQ.map(function(q){ return q.type; }).filter(Boolean));
  typeSet.forEach(function(t){
    mandatoryClean.add(typeof tagClean==='function' ? tagClean(t) : t);
  });
  var mandatoryTags = [...mandatoryClean]
    .filter(function(c){ return c && !tags.some(function(u){ return u.clean===c; }); })
    .map(function(c){ return { raw: c, clean: c }; });
  var allTags = tags.concat(mandatoryTags);
  if (!_tmNoTag && typeof currentPays === 'function') {
    var paysTag = 'pays:' + currentPays();
    allTags.push({ raw: paysTag, clean: typeof tagClean==='function' ? tagClean(paysTag) : paysTag });
  }
  var tagsXML = '  <tags>\n' + allTags.map(function(t){ return '    <tag><text>' + t.clean + '</text></tag>'; }).join('\n') + '\n  </tags>';

  var _rawName = (document.getElementById('quiz-name').value || '').trim();
  var _DEFAULT = 'Exercice sans titre';
  if (_rawName === _DEFAULT || _rawName === '') {
    var _now = new Date();
    var _pad = function(n){ return String(n).padStart(2,'0'); };
    var _ts = _now.getFullYear() + '_' + _pad(_now.getMonth()+1) + '_' + _pad(_now.getDate())
            + '_' + _pad(_now.getHours()) + 'h' + _pad(_now.getMinutes());
    _rawName = (_rawName || _DEFAULT) + '_' + _ts;
  }
  var qName = _rawName.replace(/\s+/g,'_') || 'exercice_v2';
  var n = orderedQ.length;
  var totalB = orderedQ.reduce(function(s,q){ return s + (q.bareme||0); }, 0);
  var sharedPool = typeof getAllSharedMaxima === 'function' ? getAllSharedMaxima().trim() : '';
  var questionVars = orderedQ.map(function(q){
    var s = q.vars||'';
    // Normaliser les caractères Unicode mathématiques → ASCII (Maxima ne les accepte pas)
    return s.replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/').replace(/·/g,'*').replace(/∗/g,'*').replace(/⋅/g,'*').replace(/∕/g,'/');
  }).join('\n\n');
  var allVars = sharedPool ? (sharedPool + '\n\n' + questionVars) : questionVars;

  // Editor content with chips replaced by textFrag
  var allTexts = buildQuestionText();
  // N'afficher l'aperçu global que s'il y a du texte libre dans l'éditeur entre/autour des chips
  var _edClone = document.getElementById('v4-editor').cloneNode(true);
  _edClone.querySelectorAll('.q-chip').forEach(function(c){ c.remove(); });
  var _hasExtraText = _edClone.textContent.replace(/ /g,'').trim().length > 0;
  var allTextsPreview = _hasExtraText ? allTexts : null;

  // Fallback vars : ajoute les variables manquantes pour les nouveaux nœuds PRT
  orderedQ.forEach(function(q) {
    if (q.type !== 'complexe') return;
    var X = q.id, sc = (q.state && q.state.scenario) || 'forme-alg';
    if (sc === 'forme-alg' && q.vars && q.vars.indexOf('q'+X+'_ta_conj') === -1) {
      q.vars += '\nq'+X+'_ta_conj:realpart(q'+X+'_ta)-imagpart(q'+X+'_ta)*%i;';
    }
    if (sc === 'module-arg' && q.vars && q.vars.indexOf('q'+X+'_ta_arg_neg') === -1) {
      q.vars += '\nq'+X+'_ta_arg_neg:-q'+X+'_ta_arg;';
    }
  });
  // Fallback PRT pour chips complexe dont le prtXML stale n'a pas assez de nœuds
  orderedQ.forEach(function(q) {
    if (q.type !== 'complexe') return;
    var X = q.id, sc = (q.state && q.state.scenario) || 'forme-alg';
    var b7 = (q.bareme || 1).toFixed(7);
    var nodeCount = ((q.prtXML || '').match(/<node>/g) || []).length;
    // Seuils : forme-alg=3, module-arg=4, equation-2deg=4
    var need = (sc === 'forme-alg') ? 3 : 4;
    if (nodeCount >= need) return;
    var cn = (q.state && q.state.complexno) || q.complexno || 'i';
    // PRT stale — reconstruire avec la structure riche
    if (sc === 'forme-alg') {
      q.prtXML = '    <prt>\n'
        + '      <name>prt'+X+'</name>\n      <value>'+b7+'</value>\n'
        + '      <autosimplify>1</autosimplify><feedbackstyle>1</feedbackstyle>\n'
        + '      <feedbackvariables><text></text></feedbackvariables>\n'
        + '      <node>\n        <name>0</name><description>R\xe9ponse exacte</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans1'+X+'</sans><tans>q'+X+'_ta</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-OK</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> La forme alg\xe9brique est correcte.</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>1</falsenextnode><falseanswernote>PRT-'+X+'-NOK</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>1</name><description>Conjugu\xe9 (signe Im invers\xe9)</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans1'+X+'</sans><tans>q'+X+'_ta_conj</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>0.5</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-CONJ</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠️ Signe de la partie imaginaire invers\xe9. V\xe9rifiez \\(i^2=-1\\).</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>2</falsenextnode><falseanswernote>PRT-'+X+'-NOK2</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>2</name><description>Erreur g\xe9n\xe9rique</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans1'+X+'</sans><tans>q'+X+'_ta</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-OK2</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ Correct !</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>-1</falsenextnode><falseanswernote>PRT-'+X+'-ERR</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ La r\xe9ponse correcte est \\({@q'+X+'_ta@}\\).</div>]]></text></falsefeedback>\n'
        + '      </node>\n    </prt>';
    } else if (sc === 'module-arg') {
      q.prtXML = '    <prt>\n'
        + '      <name>prt'+X+'</name>\n      <value>'+b7+'</value>\n'
        + '      <autosimplify>1</autosimplify><feedbackstyle>1</feedbackstyle>\n'
        + '      <feedbackvariables><text></text></feedbackvariables>\n'
        + '      <node>\n        <name>0</name><description>Module correct ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_mod'+X+'</sans><tans>q'+X+'_ta_mod</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>1</truenextnode><trueanswernote>PRT-'+X+'-MOD-OK</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>2</falsenextnode><falseanswernote>PRT-'+X+'-MOD-NOK</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>1</name><description>Module OK — Argument correct ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_arg'+X+'</sans><tans>q'+X+'_ta_arg</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-ARG-OK</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Module et argument corrects.</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0.5</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>3</falsenextnode><falseanswernote>PRT-'+X+'-ARG-NOK</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>2</name><description>Module faux — Argument correct ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_arg'+X+'</sans><tans>q'+X+'_ta_arg</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>0.5</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-MOD-NOK-ARG-OK</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠️ Argument correct, mais module faux. \\(|z|={@q'+X+'_ta_mod@}\\).</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>-1</falsenextnode><falseanswernote>PRT-'+X+'-TOUT-NOK</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(|z|={@q'+X+'_ta_mod@}\\) — \\(\\arg(z)={@q'+X+'_ta_arg@}\\).</div>]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>3</name><description>Erreur de quadrant (arg oppos\xe9) ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_arg'+X+'</sans><tans>q'+X+'_ta_arg_neg</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>0.25</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-QUADRANT</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🚨 <strong>Erreur de quadrant !</strong> Bonne valeur absolue mais mauvais signe. V\xe9rifiez le quadrant du nombre complexe.</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>-1</falsenextnode><falseanswernote>PRT-'+X+'-ARG-ERR</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(\\arg(z)={@q'+X+'_ta_arg@}\\). Utilisez le cercle trigonom\xe9trique.</div>]]></text></falsefeedback>\n'
        + '      </node>\n    </prt>';
    } else if (sc === 'equation-2deg') {
      q.prtXML = '    <prt>\n'
        + '      <name>prt'+X+'</name>\n      <value>'+b7+'</value>\n'
        + '      <autosimplify>1</autosimplify><feedbackstyle>1</feedbackstyle>\n'
        + '      <feedbackvariables><text></text></feedbackvariables>\n'
        + '      <node>\n        <name>0</name><description>z1 (Im positif) ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_z1'+X+'</sans><tans>q'+X+'_ta1</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>1</truenextnode><trueanswernote>PRT-'+X+'-Z1-OK</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>2</falsenextnode><falseanswernote>PRT-'+X+'-Z1-NOK</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>1</name><description>z1 OK — z2 correct ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_z2'+X+'</sans><tans>q'+X+'_ta2</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-Z2-OK</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #15803d;padding:10px 14px;background:#f0fdf4;border-radius:4px;">✅ <strong>Parfait !</strong> Les deux racines sont correctes et dans le bon ordre.</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0.5</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>-1</falsenextnode><falseanswernote>PRT-'+X+'-Z2-NOK</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠️ \\(z_1\\) correct, mais \\(z_2\\) faux. V\xe9rifiez le signe de la partie imaginaire.</div>]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>2</name><description>A-t-il invers\xe9 z1 et z2 ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_z1'+X+'</sans><tans>q'+X+'_ta2</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>1</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>3</truenextnode><trueanswernote>PRT-'+X+'-SWAP</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>-1</falsenextnode><falseanswernote>PRT-'+X+'-TOUT-NOK</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #dc2626;padding:10px 14px;background:#fff0f0;border-radius:4px;">❌ \\(z_1={@q'+X+'_ta1@}\\) et \\(z_2={@q'+X+'_ta2@}\\). Appliquez \\(z=\\frac{-b\\pm i\\sqrt{-\\Delta}}{2a}\\).</div>]]></text></falsefeedback>\n'
        + '      </node>\n'
        + '      <node>\n        <name>3</name><description>Inversion — z2=z1 attendu ?</description>\n'
        + '        <answertest>AlgEquiv</answertest>\n'
        + '        <sans>ans_z2'+X+'</sans><tans>q'+X+'_ta1</tans><testoptions></testoptions><quiet>0</quiet>\n'
        + '        <truescoremode>=</truescoremode><truescore>0.5</truescore><truepenalty></truepenalty>\n'
        + '        <truenextnode>-1</truenextnode><trueanswernote>PRT-'+X+'-SWAP-TOTAL</trueanswernote>\n'
        + '        <truefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">🔄 <strong>Racines invers\xe9es !</strong> Calculs justes mais \\(z_1\\) doit avoir la partie imaginaire <strong>positive</strong>.</div>]]></text></truefeedback>\n'
        + '        <falsescoremode>=</falsescoremode><falsescore>0.25</falsescore><falsepenalty></falsepenalty>\n'
        + '        <falsenextnode>-1</falsenextnode><falseanswernote>PRT-'+X+'-SWAP-PARTIAL</falseanswernote>\n'
        + '        <falsefeedback format="html"><text><![CDATA[<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠️ Vous avez mis \\({@q'+X+'_ta2@}\\) dans \\(z_1\\), mais \\(z_2\\) est \xe9galement faux.</div>]]></text></falsefeedback>\n'
        + '      </node>\n    </prt>';
    }
  });
  // Fallback inputXML pour chips complexe dont les inputs stale sont incomplets
  orderedQ.forEach(function(q) {
    if (q.type !== 'complexe') return;
    var X = q.id, sc = (q.state && q.state.scenario) || 'forme-alg';
    var cn = (q.state && q.state.complexno) || (q.complexno) || 'i';
    var inputCount = ((q.inputXML || '').match(/<input>/g) || []).length;
    var need = (sc === 'forme-alg') ? 1 : 2;
    if (inputCount >= need) return;
    if (sc === 'module-arg') {
      q.inputXML = _mkInput({name:'ans_mod'+X, tans:'q'+X+'_ta_mod', boxsize:15, hint:'sqrt(...)', checkanswertype:1, mustverify:1, showvalidation:2})
                 + '\n' + _mkInput({name:'ans_arg'+X, tans:'q'+X+'_ta_arg', boxsize:15, hint:'%pi/4', checkanswertype:1, mustverify:1, showvalidation:2});
    } else if (sc === 'equation-2deg') {
      q.inputXML = _mkInput({name:'ans_z1'+X, tans:'q'+X+'_ta1', boxsize:15, hint:'a+b*%'+cn, checkanswertype:1, mustverify:1, showvalidation:2})
                 + '\n' + _mkInput({name:'ans_z2'+X, tans:'q'+X+'_ta2', boxsize:15, hint:'a-b*%'+cn, checkanswertype:1, mustverify:1, showvalidation:2});
    }
  });
  var allInputs = orderedQ.map(function(q){ return q.inputXML||''; }).join('\n');
  var allPRTs = orderedQ.map(function(q){ return q.prtXML||''; }).join('\n\n');
  var allFB = '<ol>\n' + orderedQ.map(function(q){ return '  <li>' + (q.feedbackRef||'') + '</li>'; }).join('\n') + '\n</ol>';
  var allQnote = orderedQ.map(function(q){ return q.qnote||''; }).join(' | ');
  var hsTypes = orderedQ.map(function(q){ return q.type||''; }).filter(Boolean).join(',');
  // Garantit un feedback général riche pour les chips complexe (stale localStorage ou premier export)
  orderedQ.forEach(function(q) {
    if (q.type !== 'complexe' || q.generalFeedback) return;
    var X = q.id, sc = (q.state && q.state.scenario) || 'forme-alg', op = (q.state && q.state.op) || '*';
    var _FB = '<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">'
            + '<div style="font-weight:bold;margin-bottom:10px;">🔑 Correction détaillée</div>'
            + '<div style="font-size:.9rem;">';
    if (sc === 'module-arg') {
      q.generalFeedback = _FB
        + 'Formule : \\(|z|=\\sqrt{x^2+y^2}\\) &nbsp;—&nbsp; \\(\\arg(z)\\) dépend du quadrant.<br><br>'
        + 'Module : \\({@q'+X+'_ta_mod@}\\) &nbsp;—&nbsp; Argument : \\({@q'+X+'_ta_arg@}\\)'
        + '</div></div>';
    } else if (sc === 'equation-2deg') {
      q.generalFeedback = _FB
        + 'Discriminant : \\({@q'+X+'_delta@}\\)<br><br>'
        + '\\(z_1 = {@q'+X+'_ta1@}\\) &nbsp;—&nbsp; \\(z_2 = {@q'+X+'_ta2@}\\)'
        + '</div></div>';
    } else {
      var _fbM = {'*':'\\left({@q'+X+'_z1@}\\right)\\times\\left({@q'+X+'_z2@}\\right)',
                  '/':'\\dfrac{{@q'+X+'_z1@}}{{@q'+X+'_z2@}}',
                  '-':'\\left({@q'+X+'_z1@}\\right)-\\left({@q'+X+'_z2@}\\right)',
                  '+':'\\left({@q'+X+'_z1@}\\right)+\\left({@q'+X+'_z2@}\\right)'};
      var _fbHint = {'*':'On <strong>distribue</strong> le produit et on remplace \\(i^2\\) par \\(-1\\).',
                     '/':'On multiplie numérateur et dénominateur par le <strong>conjugué</strong> du dénominateur.',
                     '-':'On soustrait les <strong>parties réelles</strong> entre elles et les <strong>parties imaginaires</strong> entre elles.',
                     '+':'On additionne les <strong>parties réelles</strong> entre elles et les <strong>parties imaginaires</strong> entre elles.'};
      q.generalFeedback = _FB
        + (_fbHint[op]||'') + '<br><br>'
        + '\\[' + (_fbM[op]||'{@q'+X+'_ta@}') + ' = {@q'+X+'_ta@}\\]'
        + 'Partie réelle : \\({@q'+X+'_ta_re@}\\) &nbsp;—&nbsp; Partie imaginaire : \\({@q'+X+'_ta_im@}\\)'
        + '</div></div>';
    }
  });
  var generalFeedbackContent = moodleLatex(stripMathDivs(orderedQ.map(function(q){
    if (q.generalFeedback) return q.generalFeedback;
    if (q.solution) return '<div style="margin-top:8px;padding:10px;background:#f8f9fa;border-left:4px solid #94a3b8;border-radius:4px;">' + q.solution + '</div>';
    return '';
  }).filter(Boolean).join('\n')));
  allTexts = moodleLatex(stripMathDivs(allTexts));
  if (allTextsPreview) allTextsPreview = moodleLatex(stripMathDivs(allTextsPreview));

  /* Restaure les blocs clavier (aide à la saisie) tels quels, après tous les
     allers-retours DOM ci-dessus qui auraient échappé leur JS littéral
     (< > &&) en entités HTML et cassé le script. Voir js/generators.js
     (genAlgebraic/genNumerical/genUnits, marqueur <!--HS-KBD:X-->). */
  orderedQ.forEach(function(q){
    if (!q.kbdRaw) return;
    var marker = '<!--HS-KBD:' + q.id + '-->';
    allTexts = allTexts.split(marker).join(q.kbdRaw);
    if (allTextsPreview) allTextsPreview = allTextsPreview.split(marker).join(q.kbdRaw);
  });
  orderedQ.forEach(function(q){
    if (!q.kbdRawFbGen) return;
    var markerFb = '<!--HS-KBD-FBGEN:' + q.id + '-->';
    generalFeedbackContent = generalFeedbackContent.split(markerFb).join(q.kbdRawFbGen);
  });

  /* ── Signature StackForge pour round-trip ─────────────────────────
     stack-import.js lit le fichier XML comme du texte brut (FileReader),
     jamais via un champ Moodle — la signature n'a donc pas besoin de vivre
     dans un champ de question. Elle est stockée dans un commentaire XML
     <!-- stackforge::v1::... -->, jamais rendu ni affiché nulle part (ni côté
     élève, ni côté enseignant dans la banque de questions). Le JSON est
     encodé en base64 pour éviter tout souci d'échappement XML et la
     séquence interdite "--" dans un commentaire.
     Historique : d'abord dans un span caché de <questiontext> (avalait
     l'énoncé visible), puis dans <questiondescription> (affiché tel quel
     dans l'UI enseignant Moodle) — les deux étaient de vrais champs rendus,
     donc les deux étaient des mauvais emplacements. Ne JAMAIS y remettre
     la signature. */
  var _hsState = (function(){
    try{
      var s = JSON.stringify({
        html:       document.getElementById('v4-editor').innerHTML,
        questions:  questions,
        nextQid:    nextQid,
        sharedVars: typeof _sharedVars!=='undefined' ? _sharedVars : [],
        quizName:   (document.getElementById('quiz-name')||{}).value||''
      });
      var b64 = btoa(unescape(encodeURIComponent(s)));
      /* Cette chaîne peut contenir une image base64 (ex. Glisser-Déposer) et
         dépasser 100k caractères : sur une seule ligne, Moodle's xmlize()
         plante avec "No memory" (voir js/gen-jxgdrop.js, même piège). On la
         découpe en lignes de 2000 caractères — un commentaire XML tolère les
         retours à la ligne, et le lecteur (stack-import.js) les ignore au
         décodage. */
      var CH = 2000, lines = [];
      for (var i = 0; i < b64.length; i += CH) lines.push(b64.slice(i, i + CH));
      return lines.join('\n');
    }catch(e){ return ''; }
  })();

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<quiz>\n'
    + '  <question type="stack">\n'
    + '    <name><text>' + qName + '</text></name>\n'
    + '    <questiontext format="html">\n'
    + '      <text><![CDATA[' + allTexts + ']]></text>\n'
    + '    </questiontext>\n'
    + '    <generalfeedback format="html">\n'
    + '      <text><![CDATA[' + generalFeedbackContent + ']]></text>\n'
    + '    </generalfeedback>\n'
    + '    <defaultgrade>' + totalB + '</defaultgrade>\n'
    + '    <penalty>0.1</penalty>\n'
    + '    <hidden>0</hidden>\n'
    + '    <idnumber></idnumber>\n'
    + '    <stackversion><text></text></stackversion>\n'
    + '    <questionvariables>\n'
    + '      <text><![CDATA[' + allVars + ']]></text>\n'
    + '    </questionvariables>\n'
    + '    <specificfeedback format="html">\n'
    + '      <text><![CDATA[' + allFB + ']]></text>\n'
    + '    </specificfeedback>\n'
    + '    <questionnote format="html">\n'
    + '      <text>' + allQnote + '</text>\n'
    + '    </questionnote>\n'
    + '    <questiondescription format="html">\n'
    + '      <text>Généré avec StackForge V2 | stackforge-types:' + hsTypes + '</text>\n'
    + '    </questiondescription>\n'
    + '    <!-- stackforge::v1::' + _hsState + ' -->\n'
    + '    <questionsimplify>1</questionsimplify>\n'
    + '    <assumepositive>0</assumepositive>\n'
    + '    <assumereal>0</assumereal>\n'
    + '    <prtcorrect format="html"><text></text></prtcorrect>\n'
    + '    <prtpartiallycorrect format="html"><text></text></prtpartiallycorrect>\n'
    + '    <prtincorrect format="html"><text></text></prtincorrect>\n'
    + '    <decimals>.</decimals>\n'
    + '    <scientificnotation>*10</scientificnotation>\n'
    + '    <multiplicationsign>dot</multiplicationsign>\n'
    + '    <sqrtsign>1</sqrtsign>\n'
    + '    <complexno>' + (orderedQ.some(function(q){return q.complexno==='j';}) ? 'j' : 'i') + '</complexno>\n'
    + '    <inversetrig>cos-1</inversetrig>\n'
    + '    <logicsymbol>lang</logicsymbol>\n'
    + '    <matrixparens>[</matrixparens>\n'
    + '    <isbroken>0</isbroken>\n'
    + '    <variantsselectionseed></variantsselectionseed>\n'
    + allInputs + '\n\n'
    + allPRTs + '\n\n'
    + tagsXML + '\n'
    + '  </question>\n'
    + '</quiz>';

  return { xml: xml, qName: qName, n: n, totalB: totalB, tags: tags, allVars: allVars, allTexts: allTexts, allTextsPreview: allTextsPreview, allInputs: allInputs, allPRTs: allPRTs, allFB: allFB, questionsData: orderedQ.map(function(q){ return Object.assign({},q); }) };
}

var _lastXML = null, _lastQName = null;

function confirmAndPreview() {
  var orderedQ = getQuestionsInDOMOrder();
  if (!orderedQ.length) { toast(I18N.t('msg.aucune_question_a_previsualiser') || 'Aucune question à prévisualiser.'); return; }

  var built;
  try {
    built = buildXML();
  } catch(e) {
    console.error(e);
    toast((I18N.t('msg.erreur_xml') || 'Erreur XML : ') + e.message);
    return;
  }

  _lastXML = built.xml;
  _lastQName = built.qName;

  if (typeof lintExportedXML === 'function') {
    var lintWarnings = lintExportedXML(built.xml);
    if (lintWarnings.length) {
      console.warn('[xml-lint] Avertissements sur le XML exporté :\n- ' + lintWarnings.join('\n- '));
      var proceed = confirm(
        '⚠️ ' + lintWarnings.length + ' avertissement(s) détecté(s) dans le XML avant export :\n\n'
        + lintWarnings.map(function(w,i){ return (i+1) + '. ' + w; }).join('\n\n')
        + '\n\nExporter quand même ?'
      );
      if (!proceed) return;
    }
  }

  closeTagModal();
  try {
    var blob = new Blob([built.xml], { type: 'text/xml' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = built.qName + '.xml';
    a.click();
    if (typeof scormOnDownload === 'function') scormOnDownload();
    toast(I18N.t('msg.xml_exporte_n', { name: built.qName, n: built.n, pt: built.totalB }) || 'XML exporté !');
  } catch(e) {
    console.error(e);
    alert('Erreur critique lors de l\'export : ' + e.message + '\n\nConsultez la console (F12).');
    var tme = document.getElementById('tagModal');
    if (tme) { tme.style.display = 'flex'; if(typeof FocusTrap!=='undefined')FocusTrap.trap(tme,closeTagModal); }
  }
}

function doDownload() {
  if (!_lastXML || !_lastQName) { toast(I18N.t('msg.aucune_donnee_a_exporter') || 'Aucune donnée à exporter.'); return; }
  var blob = new Blob([_lastXML], { type: 'text/xml' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = _lastQName + '.xml';
  a.click();
  if (typeof scormOnDownload === 'function') scormOnDownload();
  closeVerifModal();
  var orderedQ = getQuestionsInDOMOrder();
  toast(I18N.t('msg.xml_exporte_n', { name: _lastQName, n: orderedQ.length, pt: orderedQ.reduce(function(s,q){return s+(q.bareme||0);},0) }) || 'XML exporté !');
}

// ── V4: quiz name locking ─────────────────────────────────────────
function applyFormula() {
  document.getElementById('num-val').value = document.getElementById('modal-formula').value;
  document.getElementById('calcModal').style.display = 'none';
}

// ── TAG MODAL (ported from V3 app.js) ────────────────────────────
var _tmNoTag = false;

function tmToggleNoTag() {
  _tmNoTag = !_tmNoTag;
  var btn  = document.getElementById('tm-notag-btn');
  var warn = document.getElementById('tm-notag-warn');
  var sec  = document.getElementById('tm-tag-sections');
  if (btn)  btn.classList.toggle('active', _tmNoTag);
  if (warn) warn.style.display = _tmNoTag ? '' : 'none';
  if (sec)  sec.style.opacity  = _tmNoTag ? '0.35' : '';
  if (sec)  sec.style.pointerEvents = _tmNoTag ? 'none' : '';
  updateTagRecap();
}

function openTagModal() {
  var chips = getChipsInOrder();
  if (!chips.length) { toast(I18N.t('msg.aucune_question_a_previsualiser') || 'Ajoutez d\'abord une question.'); return; }
  var unconfigured = chips.filter(function(c){ return !questions[parseInt(c.dataset.qid)]; });
  if (unconfigured.length) { toast('⚠️ ' + unconfigured.length + ' question(s) non configurée(s). Veuillez les configurer avant d\'exporter.'); return; }
  // Reset no-tag mode on each open
  _tmNoTag = false;
  var btn  = document.getElementById('tm-notag-btn');
  var warn = document.getElementById('tm-notag-warn');
  var sec  = document.getElementById('tm-tag-sections');
  if (btn)  btn.classList.remove('active');
  if (warn) warn.style.display = 'none';
  if (sec)  { sec.style.opacity=''; sec.style.pointerEvents=''; }
  tmInitMat();
  updateTagRecap();
  var el = document.getElementById('tagModal');
  el.style.display = 'flex';
  if (typeof FocusTrap !== 'undefined') FocusTrap.trap(el, closeTagModal);
}

function closeTagModal() {
  var el = document.getElementById('tagModal');
  if (el) el.style.display = 'none';
  if (typeof FocusTrap !== 'undefined') FocusTrap.release(el);
}

function tmInitMat() {
  var grp = document.getElementById('tm-group-mat');
  if (!grp || typeof tagsArbre === 'undefined') return;
  grp.innerHTML = Object.keys(tagsArbre).map(function(m) {
    return '<button class="tm-btn tm-mat" data-mat="' + m + '" onclick="tmSelectMat(this,\'' + m + '\')">' + m + '</button>';
  }).join('') + '<button class="tm-btn tm-mat" data-mat="autre" onclick="tmHandleAutre(this,\'tm-matiere\',1)">' + (I18N.t('btn.autre')||'Autre…') + '</button>';
  ['tm-sec-niv','tm-sec-sous','tm-sec-chap'].forEach(function(id){ var el=document.getElementById(id);if(el)el.style.display='none'; });
  tagSel = {1:new Set(),2:new Set(),3:new Set(),4:new Set(),5:new Set(),6:new Set(),7:new Set()};
  document.querySelectorAll('.tm-btn').forEach(function(b){b.classList.remove('active');});
  updateTagRecap();
}

function tmSelectMat(btn, mat) {
  document.querySelectorAll('.tm-btn.tm-mat').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  tagSel[1] = new Set([mat]);
  document.getElementById('tm-matiere').style.display = 'none';
  var niv = document.getElementById('tm-sec-niv');
  var sous = document.getElementById('tm-sec-sous');
  var chap = document.getElementById('tm-sec-chap');
  if (niv) { niv.style.display=''; tmBuildGroup('tm-group-niv', Object.keys(tagsArbre[mat]||{}), 'tmSelectNiv', 2); }
  if (sous) sous.style.display='none';
  if (chap) chap.style.display='none';
  tagSel[2]=new Set();tagSel[3]=new Set();tagSel[4]=new Set();
  updateTagRecap();
}

function tmSelectNiv(btn, mat, niv) {
  document.querySelectorAll('#tm-group-niv .tm-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  tagSel[2] = new Set([niv]);
  var mat0 = [...tagSel[1]][0];
  var sousMap = (tagsArbre[mat0]&&tagsArbre[mat0][niv])||{};
  var sec = document.getElementById('tm-sec-sous');
  var chap = document.getElementById('tm-sec-chap');
  if (sec) { sec.style.display=''; tmBuildGroup('tm-group-sous', Object.keys(sousMap), 'tmSelectSous', 3); }
  if (chap) chap.style.display='none';
  tagSel[3]=new Set();tagSel[4]=new Set();
  updateTagRecap();
}

function tmSelectSous(btn, sous) {
  document.querySelectorAll('#tm-group-sous .tm-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  tagSel[3] = new Set([sous]);
  var mat0 = [...tagSel[1]][0], niv0 = [...tagSel[2]][0];
  var chapArr = ((tagsArbre[mat0]&&tagsArbre[mat0][niv0]&&tagsArbre[mat0][niv0][sous])||[]);
  var sec = document.getElementById('tm-sec-chap');
  if (sec && chapArr.length) { sec.style.display=''; tmBuildGroup('tm-group-chap', chapArr, 'tmSelectChap', 4); }
  else if (sec) sec.style.display='none';
  tagSel[4]=new Set();
  updateTagRecap();
}

function tmSelectChap(btn, chap) {
  document.querySelectorAll('#tm-group-chap .tm-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  tagSel[4] = new Set([chap]);
  updateTagRecap();
}

function tmBuildGroup(id, items, fn, cat) {
  var grp = document.getElementById(id);
  if (!grp) return;
  grp.innerHTML = items.map(function(it) {
    return '<button class="tm-btn" onclick="' + fn + '(this,' + (cat===2?'\''+[...tagSel[1]][0]+'\',' :'') + '\'' + it.replace(/'/g,"\\'") + '\')">' + it + '</button>';
  }).join('');
}

function tmToggle(btn, cat) {
  btn.classList.toggle('active');
  var d = btn.dataset.display || btn.textContent;
  if (btn.classList.contains('active')) tagSel[cat].add(d);
  else tagSel[cat].delete(d);
  updateTagRecap();
}

function tmToggleSingle(btn, cat) {
  document.querySelectorAll('#tm-group-' + cat + ' .tm-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  tagSel[cat] = new Set([btn.dataset.display || btn.textContent]);
  updateTagRecap();
}

function tmHandleAutre(btn, inputId, cat) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  inp.style.display = inp.style.display === 'none' ? '' : 'none';
  if (inp.style.display !== 'none') inp.focus();
}

var TM_PREFIX = {1:'matiere',2:'niveau',3:'sous-matiere',4:'chapitre',6:'bloom',7:'difficulte'};

function getTagList() {
  var raw = [];
  [1,2,3,4,6,7].forEach(function(cat){
    tagSel[cat].forEach(function(v){raw.push(TM_PREFIX[cat] + ':' + v);});
  });
  tagSel[5].forEach(function(v){raw.push(v);});
  var autre1 = document.getElementById('tm-matiere');if(autre1&&autre1.value.trim())raw.push('matiere:' + autre1.value.trim());
  var autre2 = document.getElementById('tm-niveau');if(autre2&&autre2.value.trim())raw.push('niveau:' + autre2.value.trim());
  var autre5 = document.getElementById('tm-divers');if(autre5&&autre5.value.trim())raw.push(autre5.value.trim());
  return raw.filter(function(t){return t&&t.trim();}).map(function(t){
    return {raw:t, clean:typeof tagClean==='function'?tagClean(t):t};
  });
}

function updateTagRecap() {
  var tags = getTagList();
  var recap = document.getElementById('tm-recap');
  if (recap) {
    recap.innerHTML = _tmNoTag
      ? '<em style="color:#92400e;font-size:.82rem;">Aucun tag — question non mutualisable</em>'
      : tags.map(function(t){ return '<span class="tm-tag">' + t.clean + '</span>'; }).join('');
  }
  var disabled = !_tmNoTag && tags.length === 0;
  var btn = document.getElementById('tm-confirm-btn');
  if (btn) btn.disabled = disabled;
  var depositBtn = document.getElementById('tm-deposit-btn');
  if (depositBtn) depositBtn.disabled = disabled;
}

// ── DÉPÔT POUR VALIDATION (GitHub Contents API, sans backend) ────
// Chaque enseignant fournit son propre jeton (fine-grained PAT, écriture
// limitée à ce dépôt) : le fichier XML est committé directement dans
// a_verifier/ sur une branche dédiée, jamais sur main, pour relecture.
var GH_OWNER = 'bjoly-stackforge';
var GH_REPO = 'H-stack';
var GH_REVIEW_BRANCH = 'depot-a-verifier';
var GH_REVIEW_FOLDER = 'a_verifier';

function ghGetToken() {
  var t = localStorage.getItem('stackforge_gh_token');
  if (!t) {
    t = prompt('Jeton GitHub (fine-grained, accès en écriture limité à ce dépôt) — sera mémorisé dans ce navigateur pour les prochains dépôts :');
    if (t && t.trim()) localStorage.setItem('stackforge_gh_token', t.trim());
  }
  return t ? t.trim() : null;
}

async function ghApi(path, opts) {
  var token = ghGetToken();
  if (!token) throw new Error('Jeton GitHub manquant.');
  return fetch('https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + path, Object.assign({
    headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
  }, opts || {}));
}

async function ghEnsureReviewBranch() {
  var resp = await ghApi('/git/ref/heads/' + GH_REVIEW_BRANCH);
  if (resp.status === 200) return;
  if (resp.status !== 404) throw new Error('Impossible de vérifier la branche de relecture (HTTP ' + resp.status + ').');
  var mainRef = await ghApi('/git/ref/heads/main');
  if (!mainRef.ok) throw new Error('Impossible de lire la branche main (HTTP ' + mainRef.status + ').');
  var mainData = await mainRef.json();
  var createResp = await ghApi('/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: 'refs/heads/' + GH_REVIEW_BRANCH, sha: mainData.object.sha })
  });
  if (!createResp.ok) throw new Error('Impossible de créer la branche de relecture (HTTP ' + createResp.status + ').');
}

function ghBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function depositForReview() {
  var orderedQ = getQuestionsInDOMOrder();
  if (!orderedQ.length) { toast(I18N.t('msg.aucune_question_a_previsualiser') || 'Aucune question à déposer.'); return; }

  var built;
  try { built = buildXML(); } catch(e) { console.error(e); toast((I18N.t('msg.erreur_xml') || 'Erreur XML : ') + e.message); return; }

  var btn = document.getElementById('tm-deposit-btn');
  var originalLabel = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Dépôt en cours…'; }

  try {
    await ghEnsureReviewBranch();
    var pays = (typeof currentPays === 'function') ? currentPays() : 'fr';
    var path = GH_REVIEW_FOLDER + '/' + pays + '/' + built.qName + '.xml';
    var putResp = await ghApi('/contents/' + path, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Dépôt pour validation : ' + built.qName,
        content: ghBase64Utf8(built.xml),
        branch: GH_REVIEW_BRANCH
      })
    });
    if (!putResp.ok) {
      var errBody = await putResp.json().catch(function(){ return {}; });
      throw new Error(errBody.message || ('HTTP ' + putResp.status));
    }
    closeTagModal();
    toast('Déposé pour validation : ' + built.qName + '.xml (branche ' + GH_REVIEW_BRANCH + ')');
  } catch(e) {
    console.error(e);
    alert('Erreur lors du dépôt sur GitHub : ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }
  }
}

function tagClean(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9_\-:]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,'').toLowerCase();
}

function tmIO() {}

// ── SHARED VARS (V4 — formes typées) ──────────────────────────────

function _svEsc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

var _sharedVars = (function() {
  try { var s = localStorage.getItem('v4_shared_vars'); return s ? JSON.parse(s) : []; } catch(e) { return []; }
})();
var _svJsonEditIdx = null;

var _SV_LABELS = { algebraic:'Algébrique', numerical:'Numérique', boolean:'Booléen', string:'String', units:'Unités', json:'JSON' };
var _SV_COLORS = { algebraic:'#7c3aed', numerical:'#1d4ed8', boolean:'#d97706', string:'#0d9488', units:'#15803d', json:'#dc2626' };

function svComputeMaxima(sv) {
  if (!sv || !sv.name) return '';
  var n = sv.name;
  switch (sv.type) {
    case 'algebraic':  return sv.expr ? n + ': ' + sv.expr + ';' : '';
    case 'numerical':  return (sv.value !== '' && sv.value !== undefined) ? n + ': ' + sv.value + ';' : '';
    case 'boolean':    return n + ': ' + (sv.value === 'false' ? 'false' : 'true') + ';';
    case 'string':     return sv.value !== undefined ? n + ': "' + String(sv.value).replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '";' : '';
    case 'units':      return (sv.number && sv.unit) ? n + ': ' + sv.number + '*(' + sv.unit + ');' : '';
    case 'json': {
      var cols = sv.columns || [], rows = sv.rows || [];
      if (!cols.length || !rows.length) return '';
      var body = rows.map(function(row) {
        return '[' + cols.map(function(col, ci) {
          var v = String(row[ci] !== undefined ? row[ci] : '');
          if (col.colType === 'boolean') return v === 'false' ? 'false' : 'true';
          if (col.colType === 'numerical' || col.colType === 'algebraic' || col.colType === 'units') return v || '0';
          return '"' + v.replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '"';
        }).join(',') + ']';
      }).join(',');
      return n + ': [' + body + '];';
    }
    default: return '';
  }
}

function getAllSharedMaxima() {
  return _sharedVars.map(svComputeMaxima).filter(Boolean).join('\n');
}

function _svSave() {
  try { localStorage.setItem('v4_shared_vars', JSON.stringify(_sharedVars)); } catch(e) {}
}

function _svUpdatePreview() {
  var p = document.getElementById('sv-global-preview');
  if (p) p.textContent = getAllSharedMaxima() || '/* Aucune variable définie */';
  var b = document.getElementById('sp-var-count');
  if (b) b.textContent = _sharedVars.length;
  var ne = document.getElementById('sp-names-preview');
  if (ne) ne.textContent = _sharedVars.map(function(sv){ return sv.name || ''; }).filter(Boolean).join(', ');
}

function _svJsonEditorHtml(sv, i) {
  if (_svJsonEditIdx !== i) return '<div class="sv-json-editor" id="sv-json-ed-' + i + '" style="display:none;"></div>';
  var cols = sv.columns || [], rows = sv.rows || [];
  var CT = ['string','numerical','boolean','algebraic','units'];
  var CL = { string:'String', numerical:'Num.', boolean:'Bool.', algebraic:'Algèbre', units:'Unités' };

  var colRowsHtml = cols.map(function(col, ci) {
    var opts = CT.map(function(t) {
      return '<option value="' + t + '"' + (col.colType === t ? ' selected' : '') + '>' + CL[t] + '</option>';
    }).join('');
    return '<div class="sv-tbl-col-row">'
      + '<input class="sv-input sv-input-name" type="text" value="' + _svEsc(col.name||'') + '" placeholder="col' + (ci+1)
      + '" oninput="svJsonColName(' + i + ',' + ci + ',this.value)">'
      + '<select class="sv-select-sm" onchange="svJsonColType(' + i + ',' + ci + ',this.value)">' + opts + '</select>'
      + '<button class="sv-tbl-del-col" onclick="svJsonDelCol(' + i + ',' + ci + ')">✕</button>'
      + '</div>';
  }).join('') || '<span style="font-size:.77rem;color:#94a3b8;font-style:italic;">Aucune colonne — cliquez ＋ Colonne</span>';

  var headerHtml = cols.map(function(col) { return '<div class="sv-tbl-th">' + _svEsc(col.name||'') + '</div>'; }).join('')
    + (cols.length ? '<div class="sv-tbl-th" style="width:28px;"></div>' : '');

  var dataRowsHtml = rows.map(function(row, ri) {
    var cells = cols.map(function(col, ci) {
      var v = String(row[ci] !== undefined ? row[ci] : '');
      if (col.colType === 'boolean') {
        return '<select class="sv-tbl-cell" style="max-width:80px;" onchange="svJsonCell(' + i + ',' + ri + ',' + ci + ',this.value)">'
          + '<option value="true"' + (v !== 'false' ? ' selected' : '') + '>vrai</option>'
          + '<option value="false"' + (v === 'false' ? ' selected' : '') + '>faux</option>'
          + '</select>';
      }
      var isMono = (col.colType === 'numerical' || col.colType === 'algebraic' || col.colType === 'units');
      return '<input class="sv-tbl-cell' + (isMono ? ' sv-input-mono' : '') + '" type="text" value="'
        + _svEsc(v) + '" oninput="svJsonCell(' + i + ',' + ri + ',' + ci + ',this.value)">';
    }).join('');
    return '<div class="sv-tbl-row">' + cells + '<button class="sv-tbl-del-row" onclick="svJsonDelRow(' + i + ',' + ri + ')">✕</button></div>';
  }).join('');

  return '<div class="sv-json-editor" id="sv-json-ed-' + i + '">'
    + '<div class="sv-tbl-wrap">'
    + '<div class="sv-tbl-section-lbl">Colonnes</div>'
    + '<div class="sv-tbl-cols">' + colRowsHtml + '</div>'
    + '<button class="sv-tbl-add-col" onclick="svJsonAddCol(' + i + ')">＋ Colonne</button>'
    + (cols.length
      ? '<div class="sv-tbl-section-lbl" style="margin-top:12px;">Lignes</div>'
        + '<div class="sv-tbl-data"><div class="sv-tbl-header">' + headerHtml + '</div>' + dataRowsHtml + '</div>'
        + '<button class="sv-tbl-add-row" onclick="svJsonAddRow(' + i + ')">＋ Ligne</button>'
      : '')
    + '</div></div>';
}

function _svRowHtml(sv, i) {
  var t = sv.type || 'numerical';
  var tColor = _SV_COLORS[t] || '#64748b';
  var tLabel = _SV_LABELS[t] || t;
  var maxima = svComputeMaxima(sv);

  var nameInp = '<input class="sv-input sv-input-name" type="text" value="' + _svEsc(sv.name||'')
    + '" placeholder="nom" oninput="svSetName(' + i + ',this.value)">';
  var badge = '<span class="sv-type-badge" style="background:' + tColor + '18;color:' + tColor + ';border:1.5px solid ' + tColor + '55;">' + tLabel + '</span>';
  var del = '<button class="sv-del" onclick="svRemove(' + i + ')" title="Supprimer">✕</button>';

  var val = '';
  switch(t) {
    case 'algebraic':
      val = '<input class="sv-input sv-input-mono sv-flex1" type="text" value="' + _svEsc(sv.expr||'')
        + '" placeholder="ex : x^2+2*x" oninput="svSet(' + i + ',\'expr\',this.value)">';
      break;
    case 'numerical':
      val = '<input class="sv-input sv-input-sm sv-input-mono" type="text" value="' + _svEsc(sv.value||'')
        + '" placeholder="9.35" oninput="svSet(' + i + ',\'value\',this.value)">';
      break;
    case 'boolean':
      val = '<select class="sv-select" onchange="svSet(' + i + ',\'value\',this.value)">'
        + '<option value="true"' + (sv.value !== 'false' ? ' selected' : '') + '>vrai</option>'
        + '<option value="false"' + (sv.value === 'false' ? ' selected' : '') + '>faux</option>'
        + '</select>';
      break;
    case 'string':
      val = '<input class="sv-input sv-flex1" type="text" value="' + _svEsc(sv.value||'')
        + '" placeholder="Newton" oninput="svSet(' + i + ',\'value\',this.value)">';
      break;
    case 'units':
      val = '<input class="sv-input sv-input-sm sv-input-mono" type="text" value="' + _svEsc(sv.number||'')
        + '" placeholder="9.81" oninput="svSet(' + i + ',\'number\',this.value)">'
        + '<span class="sv-units-sep">×(</span>'
        + '<input class="sv-input sv-input-sm sv-input-mono" type="text" value="' + _svEsc(sv.unit||'')
        + '" placeholder="N/kg" oninput="svSet(' + i + ',\'unit\',this.value)">'
        + '<span class="sv-units-sep">)</span>';
      break;
    case 'json': {
      var nc = (sv.columns||[]).length, nr = (sv.rows||[]).length;
      val = '<span class="sv-json-summary">' + nc + ' col. · ' + nr + ' lig.</span>'
        + '<button class="sv-json-toggle" onclick="svJsonToggle(' + i + ')">'
        + (_svJsonEditIdx === i ? '▲ Réduire' : '✎ Éditer') + '</button>';
      break;
    }
  }

  var preview = t !== 'json' ? '<code class="sv-pr" id="sv-pr-' + i + '">' + _svEsc(maxima) + '</code>' : '';

  var inner = '<div class="sv-row-main">' + nameInp + badge + val + preview + del + '</div>';
  if (t === 'json') inner += _svJsonEditorHtml(sv, i);
  return '<div class="sv-row">' + inner + '</div>';
}

function renderSharedVars() {
  var list = document.getElementById('sv-list');
  if (!list) return;
  list.innerHTML = _sharedVars.length
    ? _sharedVars.map(_svRowHtml).join('')
    : '<p class="sv-empty-hint">Aucune variable définie.</p>';
  _svUpdatePreview();
  _svSave();
}

function addSharedVar(type) {
  var sv = { name: 'var' + (_sharedVars.length + 1), type: type || 'numerical' };
  if (type === 'algebraic') { sv.expr = ''; }
  else if (type === 'boolean') { sv.value = 'true'; }
  else if (type === 'units') { sv.number = ''; sv.unit = ''; }
  else if (type === 'json') { sv.columns = []; sv.rows = []; }
  else { sv.value = ''; }
  _sharedVars.push(sv);
  if (type === 'json') _svJsonEditIdx = _sharedVars.length - 1;
  renderSharedVars();
}

function svSetName(i, val) {
  if (!_sharedVars[i]) return;
  _sharedVars[i].name = val;
  var el = document.getElementById('sv-pr-' + i); if (el) el.textContent = svComputeMaxima(_sharedVars[i]);
  _svUpdatePreview(); _svSave();
}

function svSet(i, key, val) {
  if (!_sharedVars[i]) return;
  _sharedVars[i][key] = val;
  var el = document.getElementById('sv-pr-' + i); if (el) el.textContent = svComputeMaxima(_sharedVars[i]);
  _svUpdatePreview(); _svSave();
}

function svRemove(i) {
  _sharedVars.splice(i, 1);
  if (_svJsonEditIdx === i) _svJsonEditIdx = null;
  else if (_svJsonEditIdx !== null && _svJsonEditIdx > i) _svJsonEditIdx--;
  renderSharedVars();
}

function svJsonToggle(i) { _svJsonEditIdx = (_svJsonEditIdx === i) ? null : i; renderSharedVars(); }

function svJsonAddCol(i) {
  var sv = _sharedVars[i]; if (!sv) return;
  sv.columns = sv.columns || []; sv.rows = sv.rows || [];
  sv.columns.push({ name: 'col' + (sv.columns.length + 1), colType: 'string' });
  sv.rows.forEach(function(r) { r.push(''); });
  renderSharedVars();
}

function svJsonDelCol(i, ci) {
  var sv = _sharedVars[i]; if (!sv || !sv.columns) return;
  sv.columns.splice(ci, 1);
  (sv.rows||[]).forEach(function(r) { r.splice(ci, 1); });
  renderSharedVars();
}

function svJsonColName(i, ci, val) {
  var sv = _sharedVars[i];
  if (sv && sv.columns && sv.columns[ci]) { sv.columns[ci].name = val; _svSave(); }
}

function svJsonColType(i, ci, val) {
  var sv = _sharedVars[i];
  if (sv && sv.columns && sv.columns[ci]) { sv.columns[ci].colType = val; renderSharedVars(); }
}

function svJsonAddRow(i) {
  var sv = _sharedVars[i]; if (!sv) return;
  sv.rows = sv.rows || [];
  sv.rows.push((sv.columns||[]).map(function(col) {
    return col.colType === 'boolean' ? 'true' : col.colType === 'numerical' ? '0' : '';
  }));
  renderSharedVars();
}

function svJsonDelRow(i, ri) {
  var sv = _sharedVars[i]; if (!sv || !sv.rows) return;
  sv.rows.splice(ri, 1); renderSharedVars();
}

function svJsonCell(i, ri, ci, val) {
  var sv = _sharedVars[i]; if (!sv || !sv.rows || !sv.rows[ri]) return;
  sv.rows[ri][ci] = val;
  var el = document.getElementById('sv-pr-' + i); if (el) el.textContent = svComputeMaxima(sv);
  _svUpdatePreview(); _svSave();
}

function openSharedVarsModal() {
  renderSharedVars();
  var el = document.getElementById('sharedVarsModal');
  if (el) { el.style.display='flex'; if(typeof FocusTrap!=='undefined')FocusTrap.trap(el, closeSharedVarsModal); }
}

function closeSharedVarsModal() {
  var el = document.getElementById('sharedVarsModal');
  if (el) { el.style.display='none'; if(typeof FocusTrap!=='undefined')FocusTrap.release(el); }
}

// ── MISC HELPERS ─────────────────────────────────────────────────
function openCopyModal() { document.getElementById('copyModal').style.display='flex'; }
function closeCopyModal(e) { if(!e||e.target===document.getElementById('copyModal'))document.getElementById('copyModal').style.display='none'; }
function openContactModal() { document.getElementById('contactModal').style.display='flex'; }
function closeContactModal(e) { if(!e||e.target===document.getElementById('contactModal'))document.getElementById('contactModal').style.display='none'; }

// ── INIT ─────────────────────────────────────────────────────────
window.onload = function() {
  if (typeof I18N !== 'undefined' && typeof I18N.init === 'function') I18N.init();
  initPalette();
  initEditor();
  loadEditorState();

  if (typeof renderSharedVars === 'function') renderSharedVars();
  if (typeof topoRenderPreview === 'function') topoRenderPreview();
  if (typeof nucRenderPreview === 'function') nucRenderPreview();
  if (typeof chemParseAndPreview === 'function') chemParseAndPreview();

  // i18n DOM walk
  if (typeof I18N !== 'undefined' && typeof I18N.walk === 'function') I18N.walk(document.body);

  // KaTeX auto-render
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body, {
      delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],
      throwOnError:false
    });
  }
};
