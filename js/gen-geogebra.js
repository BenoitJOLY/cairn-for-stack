/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
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

// gen-geogebra.js — Generator for GeoGebra-embedded STACK questions
//
// L'enseignant référence une activité GeoGebra publiée (materialId sur
// geogebra.org/m/XXXX) et déclare :
//  - des variables d'ENTRÉE : objet GeoGebra <- valeur Maxima (aléatoire)
//  - des variables de SORTIE : objet GeoGebra -> input STACK noté (tans + tolérance)
// L'export XML utilise le filtre natif Moodle [[geogebra set="..." watch="..."]]
// (plugin filter_geogebra) pour l'injection/la lecture des objets GeoGebra —
// pas de <script> embarqué, qui serait nettoyé par le purificateur HTML de
// Moodle. Le nom d'objet GeoGebra d'une sortie doit être identique au nom de
// l'input STACK correspondant (c'est ainsi que le filtre fait la correspondance).
// Ce mécanisme couvre aussi bien une activité "entrées/sorties" qu'une activité
// de tracé (l'enseignant calcule lui-même, dans son fichier GeoGebra, un objet
// de correction — booléen ou score — exposé comme sortie).

function _ggbSanitizeName(s, fallback) {
  s = String(s || '').trim();
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s) ? s : fallback;
}

/* ── Bloc [[geogebra]] natif (plugin Moodle filter_geogebra) ─────────
   C'est le mécanisme réellement utilisé dans l'export XML : Moodle
   nettoie/supprime les balises <script> du texte de question par défaut,
   donc un embed JS brut (deployggb.js piloté à la main) ne survit pas à
   l'import. Le filtre natif [[geogebra set="..." watch="..."]] délègue
   l'injection des entrées et la lecture des sorties au plugin lui-même :
   - set="obj1,obj2"  : objets GeoGebra initialisés depuis les variables
     Maxima de MÊME NOM (déclarées dans <questionvariables>).
   - watch="obj3,obj4": objets GeoGebra synchronisés vers les inputs STACK
     de MÊME NOM (pas de suffixe qid — le nom GeoGebra doit être identique
     à l'input STACK pour que le filtre fasse la correspondance). */
function ggbBuildFilterTag(X, st) {
  var W = parseInt(st.width, 10) || 700;
  var H = parseInt(st.height, 10) || 500;
  var materialId = String(st.materialId || '').trim();

  var inputs = (st.inputs || []).filter(function (r) { return r.ggbName; });
  var outputs = (st.outputs || []).filter(function (r) { return r.ggbName; });

  var setAttr = inputs.map(function (r) { return r.ggbName; }).join(',');
  var watchAttr = outputs.map(function (o) { return o.ggbName; }).join(',');
  var rememberAttr = String(st.remember || '').trim();

  var paramsLines = [
    'params["material_id"]="' + materialId.replace(/"/g, '\\"') + '";',
    'params["showToolBar"]="' + (st.showToolbar ? 'true' : 'false') + '";',
    'params["showAlgebraInput"]="false";',
    'params["showMenuBar"]="false";',
    'params["enableRightClick"]="false";',
    'params["width"]=' + W + ';',
    'params["height"]=' + H + ';'
  ].join('\n');

  var tagAttrs = 'height="' + H + 'px" width="' + W + 'px"'
    + (setAttr ? ' set="' + setAttr + '"' : '')
    + (watchAttr ? ' watch="' + watchAttr + '"' : '')
    + (rememberAttr ? ' remember="' + rememberAttr + '"' : '');

  var block = '[[geogebra ' + tagAttrs + ']]\n' + paramsLines + '\n[[/geogebra]]';

  var hiddenInputsHtml = outputs.map(function (o) {
    return '<span hidden="">[[input:' + o.ggbName + ']] [[validation:' + o.ggbName + ']]</span>';
  }).join('\n');
  if (rememberAttr) {
    hiddenInputsHtml += '\n<span hidden="">[[input:remember]] [[validation:remember]]</span>';
  }

  return {block: block, hiddenInputsHtml: hiddenInputsHtml};
}

/* ── Assemble le bloc HTML/JS d'intégration de l'applet GeoGebra ─────
   Réservé à l'aperçu live du panneau de configuration (iframe scriptée
   propre à Cairn for Stack) : le filtre [[geogebra]] est traité côté serveur
   Moodle et ne peut pas être prévisualisé tel quel hors Moodle, donc
   l'aperçu continue de piloter l'API GeoGebra via deployggb.js. */
function ggbBuildEmbedHtml(X, st, opts) {
  opts = opts || {};
  var containerId = 'ggbApp_' + X;
  var W = parseInt(st.width, 10) || 700;
  var H = parseInt(st.height, 10) || 500;
  var materialId = String(st.materialId || '').trim();

  var inputs = (st.inputs || []).filter(function (r) { return r.ggbName; });
  var outputs = (st.outputs || []).filter(function (r) { return r.ggbName; });

  var stackNames = {};
  outputs.forEach(function (o, i) {
    stackNames[o.ggbName] = 'ggb' + X + 'o' + (i + 1);
  });

  var setValueLines = inputs.map(function (r) {
    var expr = String(r.expr || '0').trim();
    return "try{api.setValue('" + r.ggbName.replace(/'/g, "\\'") + "', " + '{#' + expr + '#}' + ");}catch(e){}";
  }).join('\n      ');
  if (opts.isPreset) {
    setValueLines += "\n      try{api.setValue('afficherCorrige', " + (opts.focusFbGen ? 1 : 0) + ");}catch(e){}";
  }

  var readLines = outputs.map(function (o) {
    var stackName = stackNames[o.ggbName];
    var t = o.type || 'numerical';
    var reader = (t === 'string')
      ? "api.getValueString('" + o.ggbName.replace(/'/g, "\\'") + "').replace(/^\"|\"$/g,'')"
      : "api.getValue('" + o.ggbName.replace(/'/g, "\\'") + "')";
    return "  (function(){\n"
      + "    var el=document.querySelector('input[name$=\"" + stackName + "\"]');\n"
      + "    if(!el||el.getAttribute('readonly')==='readonly')return;\n"
      + "    var val=" + reader + ";\n"
      + "    var sval=" + (t === 'boolean' ? "(val?'true':'false')" : "String(val)") + ";\n"
      + "    if(el.value===sval)return;\n"
      + "    el.value=sval;\n"
      + "    el.dispatchEvent(new Event('input',{bubbles:true}));\n"
      + "    el.dispatchEvent(new Event('change',{bubbles:true}));\n"
      + "  })();";
  }).join('\n');

  var listenerLines = outputs.map(function (o) {
    return "try{api.registerObjectUpdateListener('" + o.ggbName.replace(/'/g, "\\'") + "', ggb" + X + "_sync);}catch(e){}";
  }).join('\n      ');

  var loaderGuard = "if(typeof GGBApplet==='undefined'){var s=document.createElement('script');"
    + "s.src='https://www.geogebra.org/apps/deployggb.js';s.onload=ggb" + X + "_start;document.head.appendChild(s);}"
    + "else{ggb" + X + "_start();}";

  var script = "(function(){\n"
    + "function ggb" + X + "_sync(){\n" + readLines + "\n}\n"
    + "window.ggb" + X + "_sync=ggb" + X + "_sync;\n"
    + "function ggb" + X + "_start(){\n"
    + "  var params={\n"
    + "    material_id:'" + materialId.replace(/'/g, "\\'") + "',\n"
    + "    width:" + W + ",height:" + H + ",\n"
    + "    showToolBar:" + (st.showToolbar ? 'true' : 'false') + ",\n"
    + "    showAlgebraInput:false,showMenuBar:false,enableRightClick:false,\n"
    + "    appletOnLoad:function(api){\n"
    + "      window['ggbApplet_" + X + "']=api;\n"
    + "      " + (setValueLines || '') + "\n"
    + "      " + (listenerLines || '') + "\n"
    + "      ggb" + X + "_sync();\n"
    + "    }\n"
    + "  };\n"
    + "  var app=new GGBApplet(params,true);\n"
    + "  app.inject('" + containerId + "');\n"
    + "}\n"
    + loaderGuard + "\n"
    + "})();";

  var hiddenInputs = outputs.map(function (o) {
    var stackName = stackNames[o.ggbName];
    return '[[input:' + stackName + ']][[validation:' + stackName + ']]';
  }).join('\n');

  var html = '<div id="' + containerId + '" style="min-height:' + H + 'px;"></div>\n'
    + '<script>\n' + script + '\n<\/script>';

  return {
    containerHtml: html,
    hiddenInputsHtml: hiddenInputs,
    stackNames: stackNames
  };
}

/* Construit, pour UNE sortie, le feedback pédagogique bonne/mauvaise réponse :
   l'élève doit comprendre QUEL critère a échoué et COMMENT le corriger, pas
   juste obtenir un score global. Si le diagnostic (modèle préréglé) fournit
   un "hint" pédagogique, on l'affiche ; sinon (mode Expert, sans métadonnée)
   on retombe sur la révélation de la valeur attendue, seule information
   disponible. Factorisé pour être réutilisé à la fois par la génération XML
   réelle (genGeoGebra) et par l'aperçu du panneau de configuration
   (ggbRefreshPreview dans geogebra-ui.js).
   Retourne du texte BRUT (sans encadré/icône) : l'habillage visuel n'est
   appliqué qu'au point d'affichage/export (applyFbBox() côté XML, wrapFb()
   côté aperçu geogebra-ui.js), jamais ici, pour que prt-manager.js montre
   un texte propre à l'enseignant·e. */
function ggbBuildOutputFeedback(o, deps) {
  var htmlEsc_D = (deps && deps.htmlEsc) || htmlEsc;
  var label = htmlEsc_D(o.desc || o.ggbName);
  var trueFb = '<strong>' + label + '</strong> ' + I18N.t('ggb.fb_crit_ok');
  var remedy = o.hint
    ? htmlEsc_D(o.hint)
    : I18N.t('ggb.fb_expected_value') + ' <code>' + htmlEsc_D(String(o.tans || '')) + '</code>';
  var falseFb = '<strong>' + label + '</strong> ' + I18N.t('ggb.fb_crit_ko') + '<br>' + remedy;
  return {trueFb: trueFb, falseFb: falseFb};
}

/* Conservé pour compatibilité (aperçu) : concatène le feedback pédagogique de
   toutes les sorties, comme le fera la chaîne de nœuds PRT séquentiels. */
function ggbBuildFeedbackHtml(outputs, X) {
  var trueFb = outputs.map(function (o) { return ggbBuildOutputFeedback(o).trueFb; }).join('');
  var falseFb = outputs.map(function (o) { return ggbBuildOutputFeedback(o).falseFb; }).join('');
  return {trueFb: trueFb, falseFb: falseFb};
}

async function genGeoGebra(qid) {
  var q = questions[qid];
  var st = (window._ggbState) || {};
  var bareme = parseFloat(v('ggb-bareme')) || 1;
  var instruction = richVal('ggb-text');
  var materialId = (document.getElementById('ggb-material-id') || {}).value || '';
  var width = (document.getElementById('ggb-width') || {}).value || 700;
  var height = (document.getElementById('ggb-height') || {}).value || 500;
  var showToolbar = document.getElementById('ggb-show-toolbar') ? document.getElementById('ggb-show-toolbar').checked : false;

  if (!materialId.trim()) throw new Error(I18N.t('ggb.err_no_material'));
  var outputs = (st.outputs || []).filter(function (r) { return r.ggbName; });
  if (!outputs.length) throw new Error(I18N.t('ggb.err_no_outputs'));

  outputs.forEach(function (o) {
    if (!_ggbSanitizeName(o.ggbName, null)) throw new Error(I18N.t('ggb.err_bad_name', {name: o.ggbName}));
  });
  var inputs = (st.inputs || []).filter(function (r) { return r.ggbName; });
  inputs.forEach(function (r) {
    if (!_ggbSanitizeName(r.ggbName, null)) throw new Error(I18N.t('ggb.err_bad_name', {name: r.ggbName}));
  });

  var rememberAttr = String(st.remember || '').trim();
  var modelPreset = (typeof GGB_MODELS !== 'undefined') ? GGB_MODELS[st.model] : null;

  var p = {
    bareme: bareme, instruction: instruction,
    materialId: materialId, width: width, height: height, showToolbar: showToolbar,
    inputs: inputs, outputs: outputs, rememberAttr: rememberAttr,
    modelPreset: modelPreset,
    fbGen: v('ggb-fbgen')
  };
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'geogebra', X: qid, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
    }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "geogebra", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[cairnforstack] /api/generate injoignable pour "geogebra", repli sur le calcul local.', e); }
  return genGeoGebraCore(qid, p);
}

function genGeoGebraCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var ggbBuildFilterTag_D = deps.ggbBuildFilterTag || ggbBuildFilterTag;
  var ggbBuildOutputFeedback_D = deps.ggbBuildOutputFeedback || ggbBuildOutputFeedback;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;

  var bareme = p.bareme, instruction = p.instruction;
  var materialId = p.materialId, width = p.width, height = p.height, showToolbar = p.showToolbar;
  var inputs = p.inputs, outputs = p.outputs, rememberAttr = p.rememberAttr, modelPreset = p.modelPreset;

  var stateForBuild = {
    materialId: materialId, width: width, height: height, showToolbar: showToolbar,
    inputs: inputs, outputs: outputs, remember: rememberAttr
  };

  var built = ggbBuildFilterTag_D(X, stateForBuild);

  var varsMaxima = inputs.map(function (r) {
    return r.ggbName + ': ' + (r.expr || '0') + ';';
  }).join('\n');
  /* Modèles préréglés : l'objet booléen "afficherCorrige" du .ggb pilote
     l'affichage de la courbe de référence f. On expose sa valeur comme
     variable Maxima pour pouvoir la forcer à true dans l'instance GeoGebra
     réinjectée en feedback général (cf. plus bas), sans jamais l'activer
     dans l'instance principale que l'élève manipule. */
  if (modelPreset) {
    varsMaxima += (varsMaxima ? '\n' : '') + 'afficherCorrige: true;';
  }

  var inputsXML = outputs.map(function (o) {
    var name = o.ggbName;
    var t = o.type || 'numerical';
    var tans = t === 'boolean' ? (o.tans === 'false' ? 'false' : 'true')
      : t === 'string' ? '"' + String(o.tans || '').replace(/"/g, '\\"') + '"'
      : String(o.tans || '0');
    return '    <input>\n'
      + '      <name>' + name + '</name>\n'
      + '      <type>' + t + '</type>\n'
      + '      <tans>' + tans.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</tans>\n'
      + '      <boxsize>10</boxsize>\n'
      + '      <strictsyntax>1</strictsyntax>\n'
      + '      <insertstars>0</insertstars>\n'
      + '      <syntaxhint></syntaxhint>\n'
      + '      <syntaxattribute>0</syntaxattribute>\n'
      + '      <forbidwords></forbidwords>\n'
      + '      <allowwords></allowwords>\n'
      + '      <forbidfloat>0</forbidfloat>\n'
      + '      <requirelowestterms>0</requirelowestterms>\n'
      + '      <checkanswertype>0</checkanswertype>\n'
      + '      <mustverify>0</mustverify>\n'
      + '      <showvalidation>0</showvalidation>\n'
      + '      <options></options>\n'
      + '    </input>';
  }).join('\n');

  if (rememberAttr) {
    inputsXML += '\n    <input>\n'
      + '      <name>remember</name>\n'
      + '      <type>string</type>\n'
      + '      <tans>""</tans>\n'
      + '      <boxsize>10</boxsize>\n'
      + '      <strictsyntax>1</strictsyntax>\n'
      + '      <insertstars>0</insertstars>\n'
      + '      <syntaxhint></syntaxhint>\n'
      + '      <syntaxattribute>0</syntaxattribute>\n'
      + '      <forbidwords></forbidwords>\n'
      + '      <allowwords></allowwords>\n'
      + '      <forbidfloat>0</forbidfloat>\n'
      + '      <requirelowestterms>0</requirelowestterms>\n'
      + '      <checkanswertype>0</checkanswertype>\n'
      + '      <mustverify>0</mustverify>\n'
      + '      <showvalidation>0</showvalidation>\n'
      + '      <options>hideanswer</options>\n'
      + '    </input>';
  }

  var okItems = outputs.map(function (o) {
    var name = o.ggbName;
    var t = o.type || 'numerical';
    /* Un tracé GeoGebra non synchronisé (décalage de timing entre le clic
       "Valider mon tracé" et la vérification STACK) peut occasionnellement
       transmettre une valeur non numérique. On protège chaque critère avec
       numberp(...) pour compter ça comme faux plutôt que de faire planter
       tout le PRT avec une erreur d'évaluation. */
    if (t === 'numerical' && o.compareMode === 'sign') {
      return 'if numberp(' + name + ') and (' + name + ')*(' + (o.tans || '0') + ') > 0 then 1 else 0';
    }
    if (t === 'numerical') {
      var tol = parseFloat(o.tol);
      if (!(tol >= 0)) tol = 0.01;
      return 'if numberp(' + name + ') and abs(' + name + ' - (' + (o.tans || '0') + ')) <= ' + tol + ' then 1 else 0';
    }
    if (t === 'boolean') {
      return 'if ' + name + ' = ' + (o.tans === 'false' ? 'false' : 'true') + ' then 1 else 0';
    }
    return 'if stringp(' + name + ') and sdowncase(strim(" ", ' + name + ')) = sdowncase("' + String(o.tans || '').replace(/"/g, '\\"') + '") then 1 else 0';
  });

  var fbVarsMaxima = 'ggb_ok_' + X + ': [' + okItems.join(', ') + '];';

  /* PRT séquentiel : un nœud PAR critère de sortie, plutôt qu'un unique nœud
     agrégeant un score global. L'élève voit ainsi, pour chaque critère,
     s'il est correct ou non et pourquoi (cf. ggbBuildOutputFeedback) — au
     lieu d'un score en % et d'une révélation brute de tous les objets
     GeoGebra attendus. Chaque nœud teste ggb_ok_X[i+1] (déjà 0/1, protégé
     par numberp/stringp dans okItems) et enchaîne vers le suivant QUE le
     critère soit correct ou non (comme dans gen-oscilloscope.js), afin que
     tous les critères soient évalués et que leurs feedbacks respectifs
     s'accumulent. Chaque critère correct apporte 1/N du score, sans
     pénalité en cas d'échec (falsescoremode '-' avec 0 = aucun changement). */
  var N = outputs.length;
  var scorePerNode = String(Math.round((1 / N) * 1e10) / 1e10);
  var canonicalNodes = outputs.map(function (o, i) {
    var fb = ggbBuildOutputFeedback_D(o, deps);
    var isLast = i === N - 1;
    var nextNode = isLast ? '-1' : String(i + 1);
    var desc = o.desc || I18N_D.t('ggb.prt_node0_desc') + ' (' + o.ggbName + ')';
    return {
      name: String(i), description: desc, answertest: 'AlgEquiv',
      sans: 'ggb_ok_' + X + '[' + (i + 1) + ']', tans: '1',
      testoptions: '', quiet: '0',
      truescoremode: '+', truescore: scorePerNode, truepenalty: '0', truenextnode: nextNode,
      trueanswernote: 'PRT' + X + '-' + (i + 1) + '-T', truefeedback: fb.trueFb,
      falsescoremode: '-', falsescore: '0', falsepenalty: '0', falsenextnode: nextNode,
      falseanswernote: 'PRT' + X + '-' + (i + 1) + '-F', falsefeedback: fb.falseFb
    };
  });
  var prtMeta = {name: 'prt' + X, value: '1.0000000', autosimplify: '1', feedbackstyle: '2', feedbackvariables: fbVarsMaxima};
  var xmlNodes = canonicalNodes.map(function (n) {
    return Object.assign({}, n, {
      truefeedback: applyFbBox_D('true', n.truefeedback),
      falsefeedback: applyFbBox_D('false', n.falsefeedback)
    });
  });
  var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

  var formulaHtml = '';
  if (modelPreset && modelPreset.texFx) {
    formulaHtml = '<p>' + I18N_D.t('ggb.tracez_courbe_lbl') + ' \\[' + modelPreset.texFx + '\\]</p>';
  }

  /* Instance GeoGebra dédiée au feedback général : rechargée avec les mêmes
     coefficients tirés au sort (set="a,h,k,...") mais avec afficherCorrige
     forcé à true, pour révéler la courbe de référence f. Distincte de
     l'instance principale (matérial_id identique, mais aucun set/watch
     partagé) afin que la correction ne s'affiche jamais pendant la tentative
     de l'élève. */
  var correctionHtml = '';
  if (modelPreset) {
    var fbInputs = inputs.concat([{ggbName: 'afficherCorrige', expr: 'true'}]);
    var fbBuilt = ggbBuildFilterTag_D(X + 'fb', {
      materialId: materialId, width: width, height: height, showToolbar: false,
      inputs: fbInputs, outputs: [], remember: ''
    });
    correctionHtml = '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #e2e8f0;">'
      + '<span style="font-weight:bold;color:#1e293b;">Q' + X + ' — ' + I18N_D.t('ggb.banniere') + '</span>'
      + '<span style="color:#64748b;font-size:.85rem;margin-left:6px;">' + I18N_D.t('ggb.correction_lbl') + '</span>'
      + '</div>\n' + fbBuilt.block;
  }

  var HDR = '<div style="background:#38761d;border-left:5px solid #2a5c15;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N_D.t('ggb.banniere') + '</strong>'
    + '<span style="background:#2a5c15;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:bold;">/ ' + bareme + ' pt</span>'
    + '</div>';

  var textFrag = HDR
    + '<!-- ENONCE-START -->' + (instruction || '') + formulaHtml + '<!-- ENONCE-END -->\n'
    + built.block + '\n'
    + built.hiddenInputsHtml;

  return {
    bareme: bareme,
    vars: varsMaxima,
    qnote: 'GeoGebra Q' + X,
    textFrag: textFrag,
    inputXML: inputsXML,
    prtXML: prtXML,
    generalFeedback: mkFbGen_D(correctionHtml, p.fbGen),
    feedbackRef: '[[feedback:prt' + X + ']]',
    prt: {meta: prtMeta, nodes: canonicalNodes}
  };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genGeoGebra: genGeoGebra, genGeoGebraCore: genGeoGebraCore };
}
