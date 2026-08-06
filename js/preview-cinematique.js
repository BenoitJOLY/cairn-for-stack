/* ══════════════════════════════════════════════════════════════
   STACKFORGE — Aperçu live du type "cinematique". Suit le pattern
   oscilloscope/jxgdrop (js/preview.js:952-1069, js/preview-jxgdrop.js) :
   les MÊMES fonctions buildCinJSX_Phase1/Phase2 (js/gen-cinematique-jsx.js)
   servent à l'export XML et à l'aperçu local, avec des valeurs
   numériques littérales à la place des placeholders STACK {#...#}.
   Les inputs cachés ans_dv_x/ans_dv_y (liés via input-ref- en export
   réel) n'ont pas de contrepartie DOM en local : on stub juste les
   variables refDvX/refDvY à `undefined` (comme refAns1zN dans
   preview-jxgdrop.js) — tout le JS généré garde des `if (el) ...`
   avant de les utiliser, donc aucune erreur, juste une synchro no-op.
   ══════════════════════════════════════════════════════════════ */

function _cinTokenizeStack(html) {
  return String(html || '').replace(/\{@\s*([\s\S]+?)\s*@\}/g, function (full, expr) {
    return '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">' + String(expr).replace(/</g, '&lt;') + '</code>';
  });
}

function _cinBuildLivePreviewJS(state) {
  var dt = parseFloat(state.dt) || 0.15;
  var iIdx = Math.round(parseFloat(state.iIdx)) || 0;
  var method = (state.method === 'symetrique') ? 'symetrique' : 'apres';
  var points = (state.points && state.points.length) ? state.points : [];
  var calib = state.calib || null;

  var d = cinComputeAll(points, calib, dt, iIdx, method);
  if (!d.ok) {
    var reason;
    if (d.failReason === 'notEnoughPoints') {
      reason = I18N.t('cin.preview_err_not_enough_points');
    } else if (d.failReason === 'badCalib') {
      reason = I18N.t('cin.preview_err_bad_calib');
    } else {
      reason = I18N.t('cin.preview_err_bad_index', {iIdx: d.iIdx, iMin: d.iMin, iMax: d.iMax});
    }
    return { ok: false, reason: reason };
  }

  iIdx = d.iIdx;
  var boardId1 = 'cinLiveBoard1', boardId2 = 'cinLiveBoard2';
  var phase1JSX = buildCinJSX_Phase1({
    width: '100%', height: '340px',
    xmin: d.xmin, xmax: d.xmax, ymin: d.ymin, ymax: d.ymax,
    MlistExpr: JSON.stringify(d.Mlist), iIdxExpr: String(iIdx), method: d.method,
    MlistPxExpr: JSON.stringify(points.map(function (pt) { return [pt.x, pt.y]; })), echelle: d.echelle,
    refVec1X: 'refVec1X', refVec1Y: 'refVec1Y', refVec2X: 'refVec2X', refVec2Y: 'refVec2Y',
    nameVec1X: 'ans_vec1_x', nameVec1Y: 'ans_vec1_y', nameVec2X: 'ans_vec2_x', nameVec2Y: 'ans_vec2_y'
  });

  var Mi = d.Mlist[iIdx], Mip1 = d.Mlist[iIdx + 1], Mip2 = d.Mlist[iIdx + 2];
  var aviTip = [Mi[0] + d.kv * d.vi[0], Mi[1] + d.kv * d.vi[1]];
  var avip1Tip = [Mip1[0] + d.kv * d.vip1[0], Mip1[1] + d.kv * d.vip1[1]];
  var xsP2 = [Mi[0], Mip1[0], Mip2[0], aviTip[0], avip1Tip[0]];
  var ysP2 = [Mi[1], Mip1[1], Mip2[1], aviTip[1], avip1Tip[1]];
  var xmin2 = Math.min.apply(null, xsP2), xmax2 = Math.max.apply(null, xsP2);
  var ymin2 = Math.min.apply(null, ysP2), ymax2 = Math.max.apply(null, ysP2);
  var span2 = Math.max(xmax2 - xmin2, ymax2 - ymin2, 0.1);
  var pad2 = span2 * 0.3;
  xmin2 -= pad2; xmax2 += pad2; ymin2 -= pad2; ymax2 += pad2;
  xmax2 += span2 * 1.4;

  var phase2JSX = buildCinJSX_Phase2({
    width: '100%', height: '340px',
    xmin: xmin2, xmax: xmax2, ymin: ymin2, ymax: ymax2,
    MlistExpr: JSON.stringify(d.Mlist), iIdxExpr: String(iIdx),
    viExpr: JSON.stringify(d.vi), vip1Expr: JSON.stringify(d.vip1), kvExpr: String(d.kv),
    refDvX: 'refDvX', refDvY: 'refDvY', refVi: 'refVi', refVip1: 'refVip1',
    nameDvX: 'ans_dv_x', nameDvY: 'ans_dv_y', nameVi: 'ans_vi', nameVip1: 'ans_vip1'
  });

  var body1 = _oscStripJXGWrapper(phase1JSX);
  var body2 = _oscStripJXGWrapper(phase2JSX);

  var script = '(function(){ try {\n'
    + '  var stack_js = window.stack_js || (window.stack_js = { resize_containing_frame: function(){} });\n'
    + '  var refVec1X, refVec1Y, refVec2X, refVec2Y;\n'
    + '  var divid = ' + JSON.stringify(boardId1) + ';\n'
    + '  ' + body1 + '\n'
    + '} catch(e) { var el1=document.getElementById(' + JSON.stringify(boardId1) + '); if(el1) el1.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.75rem;white-space:pre-wrap;\\">Erreur JSXGraph (Phase 1) : " + String(e && e.message || e).replace(/</g,"&lt;") + "</p>"; console.error(e); }\n'
    + '})();\n'
    + '(function(){ try {\n'
    + '  var stack_js = window.stack_js || (window.stack_js = { resize_containing_frame: function(){} });\n'
    + '  var refDvX, refDvY, refVi, refVip1;\n'
    + '  var divid = ' + JSON.stringify(boardId2) + ';\n'
    + '  ' + body2 + '\n'
    + '} catch(e) { var el2=document.getElementById(' + JSON.stringify(boardId2) + '); if(el2) el2.innerHTML = "<p style=\\"color:#dc2626;padding:10px;font-family:monospace;font-size:.75rem;white-space:pre-wrap;\\">Erreur JSXGraph (Phase 2) : " + String(e && e.message || e).replace(/</g,"&lt;") + "</p>"; console.error(e); }\n'
    + '})();\n';

  return { ok: true, script: script, boardId1: boardId1, boardId2: boardId2 };
}

function renderPreviewHTML_cinematique(state) {
  var live = { ok: false };
  try { live = _cinBuildLivePreviewJS(state); } catch (e) { console.error('[preview] cinematique build error:', e); live = { ok: false, reason: String(e && e.message || e) }; }

  var exampleHTML;
  if (live.ok) {
    exampleHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
      + '<div style="flex:1 1 260px;"><div style="font-size:.72rem;color:#475569;margin-bottom:3px;">' + I18N.t('cin.preview_step1_label') + '</div>'
      + '<div id="' + live.boardId1 + '" style="position:relative;width:100%;height:340px;border:1px solid #cbd5e1;border-radius:8px;overflow:visible;background:#fff;"></div></div>'
      + '<div style="flex:1 1 260px;"><div style="font-size:.72rem;color:#475569;margin-bottom:3px;">' + I18N.t('cin.preview_step2_label') + '</div>'
      + '<div id="' + live.boardId2 + '" style="position:relative;width:100%;height:340px;border:1px solid #cbd5e1;border-radius:8px;overflow:visible;background:#fff;"></div></div>'
      + '</div>'
      + '<script src="lib/jsxgraph/jsxgraphcore.js"><\/script>'
      + '<script>' + live.script + '<\/script>';
  } else {
    exampleHTML = '<p style="color:#dc2626;font-style:italic;">' + (live.reason || I18N.t('cin.preview_unavailable_fallback')) + '</p>';
  }

  var realParts = null;
  try {
    if (typeof genCinematiqueCore === 'function' && typeof genCinematiqueParams === 'function') {
      realParts = genCinematiqueCore(1, genCinematiqueParams());
    }
  } catch (e) { realParts = null; }

  var node1 = realParts && realParts.prts && realParts.prts[0] && realParts.prts[0].nodes[0];
  var node2 = realParts && realParts.prts && realParts.prts[1] && realParts.prts[1].nodes[0];
  var extraFeedbackNodes = node2 ? [{
    desc: node2.description,
    fb: (node2.truefeedback ? '<div><strong>' + I18N.t('common.preview_if_correct') + ':</strong> ' + _cinTokenizeStack(node2.truefeedback) + '</div>' : '')
      + (node2.falsefeedback ? '<div><strong>' + I18N.t('common.preview_if_wrong') + ':</strong> ' + _cinTokenizeStack(node2.falsefeedback) + '</div>' : '')
  }] : [];

  return _hsSimplePreviewHTML({
    badge: I18N.t('cin.title'), badgeColor: '#4f46e5', noteBg: '#eef2ff', noteColor: '#312e81',
    prefix: 'cin', bareme: state.bareme || 1,
    text: _hsRenderMath(state.text || ('<p><em>' + I18N.t('cin.preview_default_statement') + '</em></p>')),
    exampleLabel: '',
    exampleHTML: exampleHTML,
    fbOk: node1 ? _cinTokenizeStack(node1.truefeedback) : '',
    fbWrong: node1 ? _cinTokenizeStack(node1.falsefeedback) : '',
    fbGenAuto: realParts ? _hsRenderMath(_cinTokenizeStack(realParts.generalFeedback || '')) : '',
    fbGen: state.fbGen,
    extraFeedbackNodes: extraFeedbackNodes
  });
}
window.cinRefreshPreview = _hsWireSimplePreview('cinematique', 'cin', 'cin-preview-container', 'fp-cinematique', renderPreviewHTML_cinematique, true);
