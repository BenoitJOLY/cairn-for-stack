/* ══════════════════════════════════════════════════════════════
   STACKFORGE — Générateur Cinématique du point (vecteur vitesse,
   relation de Chasles), JSXGraph. Assemble gen-cinematique-physics.js
   (moteur RK4) et gen-cinematique-jsx.js (builders JSXGraph Phase1/
   Phase2) en un type de question complet, suivant le pattern
   genOscilloscope / _oscFinalize (js/gen-oscilloscope.js) et le
   pattern multi-PRT de genIncertitudeCore (js/gen-incertitude.js).
   ══════════════════════════════════════════════════════════════ */

function _cinHeader(X, bareme, title, tagBg, tagIcon, tagLabel){
  return '<div style="background:'+tagBg.bg+';border-left:5px solid '+tagBg.accent+';border-radius:0 8px 8px 0;'
    + 'padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q'+X+' — '+title+'</strong>'
    + '<span style="background:'+tagBg.accent+';color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ '+bareme+' pt</span>'
    + '<span style="background:#ffffff;color:'+tagBg.accent+';border:1px solid '+tagBg.accent+';padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">'+tagIcon+' '+tagLabel+'</span>'
    + '</div>';
}

/* ── Nœud PRT canonique (schéma buildPrtXml) — identique à _oscNode ── */
function _cinNode(name, desc, test, sans, tans, testopt, tScoreMode, tScore, tNext, tNote, tFb, fScoreMode, fScore, fNext, fNote, fFb){
  return {
    name: name, description: desc, answertest: test, sans: sans, tans: tans,
    testoptions: testopt, quiet: '0',
    truescoremode: tScoreMode, truescore: String(tScore), truepenalty: '', truenextnode: String(tNext),
    trueanswernote: tNote, truefeedback: tFb,
    falsescoremode: fScoreMode, falsescore: String(fScore), falsepenalty: '', falsenextnode: String(fNext),
    falseanswernote: fNote, falsefeedback: fFb
  };
}
/* Le texte reste brut ({__fbKind,text}) — l'encadré coloré n'est appliqué qu'à l'export XML
   (voir _cinFinalize), jamais dans les nœuds canoniques exposés à prt-manager.js. */
function _cinOk(txt){ return { __fbKind: 'true', text: txt }; }
function _cinKo(txt){ return { __fbKind: 'false', text: txt }; }
function _cinFbKindOf(v){ return (v && typeof v === 'object' && v.__fbKind) ? v.__fbKind : null; }
function _cinFbTextOf(v){ return (v && typeof v === 'object' && v.__fbKind) ? v.text : v; }

function _cinFmt(n){ return Number(n.toFixed(4)); }

/* Assemble plusieurs PRT (prt1 : norme vi, prt2 : vecteur Δvi) en un seul objet de retour,
   sur le modèle du pattern multi-PRT de genIncertitudeCore (js/gen-incertitude.js:96-129) :
   prt = allPrts[0] pour l'éditeur visuel (limitation MVP prt-manager.js, 1 seul PRT affiché),
   prts = allPrts pour l'export XML complet. */
function _cinFinalize(X, bareme, vars, qnote, textFrag, previewFrag, inputXML, prtDefs, genFb, fbGen, kbdRaw, deps){
  deps = deps || {};
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;

  var prtBlocks = [], feedbackRefs = [], allPrts = [];
  prtDefs.forEach(function(def){
    var xmlNode = Object.assign({}, def.node, {
      truefeedback: applyFbBox_D(_cinFbKindOf(def.node.truefeedback) || 'true', _cinFbTextOf(def.node.truefeedback)),
      falsefeedback: applyFbBox_D(_cinFbKindOf(def.node.falsefeedback) || 'false', _cinFbTextOf(def.node.falsefeedback))
    });
    var plainNode = Object.assign({}, def.node, {
      truefeedback: _cinFbTextOf(def.node.truefeedback),
      falsefeedback: _cinFbTextOf(def.node.falsefeedback)
    });
    prtBlocks.push(buildPrtXml_D(def.meta, [xmlNode]));
    feedbackRefs.push('[[feedback:'+def.meta.name+']]');
    allPrts.push({ meta: def.meta, nodes: [plainNode] });
  });

  return {
    bareme: bareme, vars: vars, qnote: qnote, textFrag: textFrag, previewFrag: previewFrag,
    inputXML: inputXML, prtXML: prtBlocks.join('\n\n'),
    prt: allPrts[0], prts: allPrts,
    generalFeedback: applyFbBox_D('general', _mkFbGen_D(genFb, fbGen)),
    feedbackRef: feedbackRefs.join(' '),
    kbdRaw: kbdRaw
  };
}

function genCinematiqueParams(){
  var atelier = (typeof cinGetAtelierState === 'function') ? cinGetAtelierState() : { points: [], calib: null };
  return {
    bareme: parseFloat(v('cin-bareme')) || 1,
    text: richVal('cin-text'),
    fbGen: v('cin-fbgen'),
    dt: parseFloat(v('cin-dt')) || 0.15,
    iIdx: Math.round(parseFloat(v('cin-iidx'))) || 0,
    method: v('cin-method') || 'apres',
    points: atelier.points || [],
    calib: atelier.calib || null
  };
}

async function genCinematique(X){
  var p = genCinematiqueParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'cinematique', X, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Quota hebdomadaire atteint.');
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "cinematique", repli sur le calcul local.');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "cinematique", repli sur le calcul local.', e); }
  return genCinematiqueCore(X, p);
}

function genCinematiqueCore(X, p, deps){
  deps = deps || {};
  var cinComputeAll_D = deps.cinComputeAll || cinComputeAll;
  var buildCinJSX_Phase1_D = deps.buildCinJSX_Phase1 || buildCinJSX_Phase1;
  var buildCinJSX_Phase2_D = deps.buildCinJSX_Phase2 || buildCinJSX_Phase2;
  var _mkInput_D = deps._mkInput || _mkInput;
  var _cinFinalize_D = deps._cinFinalize || _cinFinalize;
  var I18N_D = deps.I18N || I18N;

  var bareme = p.bareme, text = p.text, fbGen = p.fbGen;

  var d = cinComputeAll_D(p.points, p.calib, p.dt, p.iIdx, p.method);
  if (!d.ok) {
    var reason;
    if (d.failReason === 'notEnoughPoints') {
      reason = I18N_D.t('cin.err_not_enough_points');
    } else if (d.failReason === 'badCalib') {
      reason = I18N_D.t('cin.err_bad_calib');
    } else {
      var extra = d.iMin > 0 ? I18N_D.t('cin.err_bad_index_extra', {iMin: d.iMin}) : '';
      reason = I18N_D.t('cin.err_bad_index', {iIdx: d.iIdx, iMin: d.iMin, iMax: d.iMax, extra: extra});
    }
    throw new Error(reason);
  }

  var iIdx = d.iIdx;
  var a1 = d.vec1From, b1 = d.vec1To, a2 = d.vec2From, b2 = d.vec2To;
  var vec1 = [d.Mlist[b1][0] - d.Mlist[a1][0], d.Mlist[b1][1] - d.Mlist[a1][1]];
  var vec2 = [d.Mlist[b2][0] - d.Mlist[a2][0], d.Mlist[b2][1] - d.Mlist[a2][1]];

  var MlistStr = '[' + d.Mlist.map(function(pt){ return '[' + _cinFmt(pt[0]) + ',' + _cinFmt(pt[1]) + ']'; }).join(',') + ']';
  var MlistPxStr = JSON.stringify(p.points.map(function(pt){ return [pt.x, pt.y]; }));

  var vars = '/* Q'+X+' : Cinématique du point — vecteurs déplacement, normes et relation de Chasles ('+bareme+'pt) */\n'
    + 'dt_'+X+': ' + _cinFmt(p.dt) + '$\n'
    + 'dtEff_'+X+': ' + _cinFmt(d.divisor) + '$\n'
    + 'iIdx_'+X+': ' + iIdx + '$\n'
    + 'Mlist_'+X+': ' + MlistStr + '$\n'
    + 'vec1_'+X+': [' + _cinFmt(vec1[0]) + ', ' + _cinFmt(vec1[1]) + ']$\n'
    + 'vec2_'+X+': [' + _cinFmt(vec2[0]) + ', ' + _cinFmt(vec2[1]) + ']$\n'
    + 'vi_'+X+': [' + _cinFmt(d.vi[0]) + ', ' + _cinFmt(d.vi[1]) + ']$\n'
    + 'vip1_'+X+': [' + _cinFmt(d.vip1[0]) + ', ' + _cinFmt(d.vip1[1]) + ']$\n'
    + 'dv_'+X+': [vip1_'+X+'[1]-vi_'+X+'[1], vip1_'+X+'[2]-vi_'+X+'[2]]$\n'
    + 'vi_norm_'+X+': sqrt(vi_'+X+'[1]^2+vi_'+X+'[2]^2)$\n'
    + 'vip1_norm_'+X+': sqrt(vip1_'+X+'[1]^2+vip1_'+X+'[2]^2)$\n'
    + 'tol_vec_'+X+': 0.05$\n'
    + 'tol_vi_'+X+': 0.30$\n'
    + 'tol_vip1_'+X+': 0.30$\n'
    + 'tol_dv_'+X+': 0.20$\n'
    + 'kv_'+X+': ' + _cinFmt(d.kv) + '$\n';

  var header = _cinHeader(X, bareme, I18N_D.t('cin.header_title'), {bg:'#1e1b4b', accent:'#4f46e5'}, '🏹', I18N_D.t('palette.cat.physchim'));

  var phase1JSX = buildCinJSX_Phase1_D({
    width: '620px', height: '460px',
    xmin: _cinFmt(d.xmin), xmax: _cinFmt(d.xmax), ymin: _cinFmt(d.ymin), ymax: _cinFmt(d.ymax),
    MlistExpr: '{#Mlist_'+X+'#}', iIdxExpr: '{#iIdx_'+X+'#}',
    MlistPxExpr: MlistPxStr, echelle: _cinFmt(d.echelle), method: d.method,
    refVec1X: 'refVec1X'+X, refVec1Y: 'refVec1Y'+X, refVec2X: 'refVec2X'+X, refVec2Y: 'refVec2Y'+X,
    nameVec1X: 'ans_vec1_x'+X, nameVec1Y: 'ans_vec1_y'+X, nameVec2X: 'ans_vec2_x'+X, nameVec2Y: 'ans_vec2_y'+X,
    lblVec1: I18N_D.t('cin.jsx_lbl_vec1'), lblVec2: I18N_D.t('cin.jsx_lbl_vec2'),
    lblErase: I18N_D.t('cin.jsx_lbl_erase'),
    lblEchellePrefix: I18N_D.t('cin.jsx_echelle_prefix'), lblEchelleSuffix: I18N_D.t('cin.jsx_echelle_suffix'),
    lblClickInstruction: I18N_D.t('cin.jsx_click_instruction'),
    lblVec1Done: I18N_D.t('cin.jsx_vec1_done'), lblVec2Done: I18N_D.t('cin.jsx_vec2_done')
  });

  /* Boundingbox Phase 2 (littéral, comme la Phase 1 : points/calib/dt/iIdx ne sont
     jamais randomisés côté CAS, donc ce cadrage n'a pas besoin de passer par une
     variable Maxima) : englobe M_i/M_{i+1}/M_{i+2} et les pointes des flèches
     v_i/v_{i+1}, puis réserve un espace de travail à droite pour le clonage et le
     tracé final (sans quoi les boutons dédiés recouvriraient le schéma). */
  var Mi = d.Mlist[iIdx], Mip1 = d.Mlist[iIdx+1], Mip2 = d.Mlist[iIdx+2];
  var aviTip = [Mi[0] + d.kv*d.vi[0], Mi[1] + d.kv*d.vi[1]];
  var avip1Tip = [Mip1[0] + d.kv*d.vip1[0], Mip1[1] + d.kv*d.vip1[1]];
  var xsP2 = [Mi[0], Mip1[0], Mip2[0], aviTip[0], avip1Tip[0]];
  var ysP2 = [Mi[1], Mip1[1], Mip2[1], aviTip[1], avip1Tip[1]];
  var xmin2 = Math.min.apply(null, xsP2), xmax2 = Math.max.apply(null, xsP2);
  var ymin2 = Math.min.apply(null, ysP2), ymax2 = Math.max.apply(null, ysP2);
  var span2 = Math.max(xmax2 - xmin2, ymax2 - ymin2, 0.1);
  var pad2 = span2 * 0.3;
  xmin2 -= pad2; xmax2 += pad2; ymin2 -= pad2; ymax2 += pad2;
  xmax2 += span2 * 1.4;

  var phase2JSX = buildCinJSX_Phase2_D({
    width: '620px', height: '460px',
    xmin: _cinFmt(xmin2), xmax: _cinFmt(xmax2), ymin: _cinFmt(ymin2), ymax: _cinFmt(ymax2),
    MlistExpr: '{#Mlist_'+X+'#}', iIdxExpr: '{#iIdx_'+X+'#}',
    viExpr: '{#vi_'+X+'#}', vip1Expr: '{#vip1_'+X+'#}', kvExpr: '{#kv_'+X+'#}',
    refDvX: 'refDvX'+X, refDvY: 'refDvY'+X, refVi: 'refVi'+X, refVip1: 'refVip1'+X,
    nameDvX: 'ans_dv_x'+X, nameDvY: 'ans_dv_y'+X, nameVi: 'ans_vi'+X, nameVip1: 'ans_vip1'+X,
    lblPlaceholderA: I18N_D.t('cin.jsx_placeholder_a'), lblPlaceholderB: I18N_D.t('cin.jsx_placeholder_b'), lblPlaceholderC: I18N_D.t('cin.jsx_placeholder_c'),
    lblCloner: I18N_D.t('cin.jsx_lbl_cloner'), lblInverser: I18N_D.t('cin.jsx_lbl_inverser'),
    lblTracerDv: I18N_D.t('cin.jsx_lbl_tracer_dv'), lblRecommencer: I18N_D.t('cin.jsx_lbl_recommencer')
  });

  var kbdRaw = phase1JSX
    + '\n<div style="display: none;" aria-hidden="true" tabindex="-1">[[input:ans_vec1_x'+X+']] [[input:ans_vec1_y'+X+']] [[input:ans_vec2_x'+X+']] [[input:ans_vec2_y'+X+']]</div>\n'
    + '<p><strong>v<sub>' + iIdx + '</sub> = </strong> [[input:ans_vi'+X+']] m/s [[validation:ans_vi'+X+']] '
    + '&nbsp;&nbsp;<strong>v<sub>' + (iIdx+1) + '</sub> = </strong> [[input:ans_vip1'+X+']] m/s [[validation:ans_vip1'+X+']]</p>\n'
    + '<p><strong>' + I18N_D.t('cin.step2_title', {i: iIdx}) + '</strong></p>'
    + '<p>' + I18N_D.t('cin.step2_instruction', {i: iIdx, ip1: (iIdx+1)}) + '</p>\n'
    + '<div style="display: none;" aria-hidden="true" tabindex="-1">[[input:ans_dv_x'+X+']] [[input:ans_dv_y'+X+']]</div>\n'
    + phase2JSX;

  var textFrag = header
    + '<div style="margin-bottom:14px;">' + (text||'') + '</div>\n'
    + '<p><strong>' + I18N_D.t('cin.step1_title') + '</strong></p>'
    + '<p>' + I18N_D.t('cin.step1_instruction', {a1: a1, b1: b1, a2: a2, b2: b2, i: iIdx, ip1: (iIdx+1), dtEff: '{#dtEff_'+X+'#}'}) + '</p>\n'
    + '<div><!--HS-KBD:'+X+'--></div>';

  var previewFrag = header
    + '<div style="margin-bottom:10px;">'+(text||'')+'</div>\n'
    + '<div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:20px;text-align:center;color:#1e3a5f;font-family:monospace;font-size:.85rem;">'
    + I18N_D.t('cin.preview_placeholder')
    + '</div>';

  var inputVec1X = _mkInput_D({
    name: 'ans_vec1_x'+X, type: 'numerical', tans: 'vec1_'+X+'[1]', boxsize: 6,
    mustverify: 0, showvalidation: 0, forbidfloat: 0, checkanswertype: 0
  });
  var inputVec1Y = _mkInput_D({
    name: 'ans_vec1_y'+X, type: 'numerical', tans: 'vec1_'+X+'[2]', boxsize: 6,
    mustverify: 0, showvalidation: 0, forbidfloat: 0, checkanswertype: 0
  });
  var inputVec2X = _mkInput_D({
    name: 'ans_vec2_x'+X, type: 'numerical', tans: 'vec2_'+X+'[1]', boxsize: 6,
    mustverify: 0, showvalidation: 0, forbidfloat: 0, checkanswertype: 0
  });
  var inputVec2Y = _mkInput_D({
    name: 'ans_vec2_y'+X, type: 'numerical', tans: 'vec2_'+X+'[2]', boxsize: 6,
    mustverify: 0, showvalidation: 0, forbidfloat: 0, checkanswertype: 0
  });
  var inputAnsVi = _mkInput_D({
    name: 'ans_vi'+X, type: 'numerical', tans: 'vi_norm_'+X, boxsize: 8,
    mustverify: 1, showvalidation: 1, forbidfloat: 0, checkanswertype: 0
  });
  var inputAnsVip1 = _mkInput_D({
    name: 'ans_vip1'+X, type: 'numerical', tans: 'vip1_norm_'+X, boxsize: 8,
    mustverify: 1, showvalidation: 1, forbidfloat: 0, checkanswertype: 0
  });
  var inputDvX = _mkInput_D({
    name: 'ans_dv_x'+X, type: 'numerical', tans: 'dv_'+X+'[1]', boxsize: 6,
    mustverify: 0, showvalidation: 0, forbidfloat: 0, checkanswertype: 0
  });
  var inputDvY = _mkInput_D({
    name: 'ans_dv_y'+X, type: 'numerical', tans: 'dv_'+X+'[2]', boxsize: 6,
    mustverify: 0, showvalidation: 0, forbidfloat: 0, checkanswertype: 0
  });
  var inputXML = [inputVec1X, inputVec1Y, inputVec2X, inputVec2Y, inputAnsVi, inputAnsVip1, inputDvX, inputDvY].join('\n');

  var stepBareme = bareme / 5;

  var nodeVec1 = _cinNode('0', 'Vecteur déplacement M_'+a1+'M_'+b1, 'NumAbsolute', 'err_vec1_'+X, '0', 'tol_vec_'+X,
    '=', 1, -1, 'PRT-'+X+'-vec1-OK', _cinOk('<p>' + I18N_D.t('cin.fb_vec_ok', {a: a1, b: b1}) + '</p>'),
    '=', 0, -1, 'PRT-'+X+'-vec1-NOK', _cinKo('<p>' + I18N_D.t('cin.fb_vec_ko', {a: a1, b: b1}) + '</p>'));
  var metaVec1 = {
    name: 'prt'+X+'a', value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1',
    feedbackvariables: 'err_vec1_'+X+': sqrt((ans_vec1_x'+X+'-vec1_'+X+'[1])^2+(ans_vec1_y'+X+'-vec1_'+X+'[2])^2)$'
  };

  var nodeVec2 = _cinNode('0', 'Vecteur déplacement M_'+a2+'M_'+b2, 'NumAbsolute', 'err_vec2_'+X, '0', 'tol_vec_'+X,
    '=', 1, -1, 'PRT-'+X+'-vec2-OK', _cinOk('<p>' + I18N_D.t('cin.fb_vec_ok', {a: a2, b: b2}) + '</p>'),
    '=', 0, -1, 'PRT-'+X+'-vec2-NOK', _cinKo('<p>' + I18N_D.t('cin.fb_vec_ko', {a: a2, b: b2}) + '</p>'));
  var metaVec2 = {
    name: 'prt'+X+'b', value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1',
    feedbackvariables: 'err_vec2_'+X+': sqrt((ans_vec2_x'+X+'-vec2_'+X+'[1])^2+(ans_vec2_y'+X+'-vec2_'+X+'[2])^2)$'
  };

  var nodeVi = _cinNode('0', 'Norme de v_i', 'NumAbsolute', 'ans_vi'+X, 'vi_norm_'+X, 'tol_vi_'+X,
    '=', 1, -1, 'PRT-'+X+'-vi-OK', _cinOk('<p>' + I18N_D.t('cin.fb_norme_ok', {i: iIdx}) + '</p>'),
    '=', 0, -1, 'PRT-'+X+'-vi-NOK', _cinKo('<p>' + I18N_D.t('cin.fb_norme_ko', {i: iIdx, a: a1, b: b1, dtEff: '{@dtEff_'+X+'@}'}) + '</p>'));
  var metaVi = { name: 'prt'+X+'c', value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var nodeVip1 = _cinNode('0', 'Norme de v_{i+1}', 'NumAbsolute', 'ans_vip1'+X, 'vip1_norm_'+X, 'tol_vip1_'+X,
    '=', 1, -1, 'PRT-'+X+'-vip1-OK', _cinOk('<p>' + I18N_D.t('cin.fb_norme_ok', {i: (iIdx+1)}) + '</p>'),
    '=', 0, -1, 'PRT-'+X+'-vip1-NOK', _cinKo('<p>' + I18N_D.t('cin.fb_norme_ko', {i: (iIdx+1), a: a2, b: b2, dtEff: '{@dtEff_'+X+'@}'}) + '</p>'));
  var metaVip1 = { name: 'prt'+X+'d', value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };

  var nodeDv = _cinNode('0', 'Vecteur Δv_i (relatif, indépendant du placement)', 'NumAbsolute', 'err_dv_'+X, '0', 'tol_dv_'+X,
    '=', 1, -1, 'PRT-'+X+'-dv-OK', _cinOk('<p>' + I18N_D.t('cin.fb_dv_ok', {i: iIdx, ip1: (iIdx+1)}) + '</p>'),
    '=', 0, -1, 'PRT-'+X+'-dv-NOK', _cinKo('<p>' + I18N_D.t('cin.fb_dv_ko', {i: iIdx, ip1: (iIdx+1)}) + '</p>'));
  var metaDv = {
    name: 'prt'+X+'e', value: stepBareme.toFixed(7), autosimplify: '1', feedbackstyle: '1',
    feedbackvariables: 'err_dv_'+X+': sqrt((ans_dv_x'+X+'-dv_'+X+'[1])^2+(ans_dv_y'+X+'-dv_'+X+'[2])^2)$'
  };

  var qnote = 'v_i={@vi_norm_'+X+'@} m/s, v_{i+1}={@vip1_norm_'+X+'@} m/s, Δv_i=({@dv_'+X+'[1]@};{@dv_'+X+'[2]@}) m/s';

  var genFb = '<p><strong>' + I18N_D.t('cin.genfb_step1_title') + '</strong></p>'
    + '<p>' + I18N_D.t('cin.genfb_step1_vec', {a: a1, b: b1, i: iIdx, vecx: '{@vec1_'+X+'[1]@}', vecy: '{@vec1_'+X+'[2]@}', dtEff: '{@dtEff_'+X+'@}', norm: '{@vi_norm_'+X+'@}'}) + '</p>'
    + '<p>' + I18N_D.t('cin.genfb_step1_vec', {a: a2, b: b2, i: (iIdx+1), vecx: '{@vec2_'+X+'[1]@}', vecy: '{@vec2_'+X+'[2]@}', dtEff: '{@dtEff_'+X+'@}', norm: '{@vip1_norm_'+X+'@}'}) + '</p>'
    + '<p><strong>' + I18N_D.t('cin.genfb_step2_title', {i: iIdx}) + '</strong></p>'
    + '<p>' + I18N_D.t('cin.genfb_dv', {i: iIdx, ip1: (iIdx+1), dvx: '{@dv_'+X+'[1]@}', dvy: '{@dv_'+X+'[2]@}'}) + '</p>'
    + '<p>' + I18N_D.t('cin.genfb_construction', {i: iIdx, ip1: (iIdx+1)}) + '</p>';

  return _cinFinalize_D(X, bareme, vars, qnote, textFrag, previewFrag, inputXML,
    [{meta: metaVec1, node: nodeVec1}, {meta: metaVec2, node: nodeVec2},
     {meta: metaVi, node: nodeVi}, {meta: metaVip1, node: nodeVip1}, {meta: metaDv, node: nodeDv}],
    genFb, fbGen, kbdRaw, deps);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    genCinematiqueParams: genCinematiqueParams,
    genCinematique: genCinematique,
    genCinematiqueCore: genCinematiqueCore,
    _cinFinalize: _cinFinalize,
    _cinNode: _cinNode,
    _cinHeader: _cinHeader
  };
}
