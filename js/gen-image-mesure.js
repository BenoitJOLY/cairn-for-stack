// gen-image-mesure.js — Mesure par proportionnalité sur image

// ── UI STATE ────────────────────────────────────────────────────────
var _immCapture = null; // null | 'r1' | 'r2' | {type:'target', el:HTMLElement}

// ── IMAGE LOAD ──────────────────────────────────────────────────────
function immLoadImage(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    var img = new Image();
    img.onload = function() {
      // Redimensionnement automatique : évite un XML Moodle trop lourd. Le
      // calibrage/les mesures se font ensuite sur l'image déjà redimensionnée,
      // donc les coordonnées pixel restent cohérentes.
      var MAX_DIM = 900;
      var w = img.naturalWidth, h = img.naturalHeight;
      var scale = Math.min(1, MAX_DIM / Math.max(w, h));
      var finalDataUrl = dataUrl, finalW = w, finalH = h;
      if (scale < 1) {
        finalW = Math.round(w * scale);
        finalH = Math.round(h * scale);
        var canvas = document.createElement('canvas');
        canvas.width = finalW; canvas.height = finalH;
        canvas.getContext('2d').drawImage(img, 0, 0, finalW, finalH);
        finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
      document.getElementById('imm-image-data').value = finalDataUrl;
      document.getElementById('imm-img-w').value = finalW;
      document.getElementById('imm-img-h').value = finalH;
      document.getElementById('imm-img').src = finalDataUrl;
      document.getElementById('imm-preview-wrap').style.display = '';
      // Size warning (base64 is ~4/3 of raw)
      var kb = Math.round(finalDataUrl.length / 1024);
      var warn = document.getElementById('imm-size-warn');
      if (kb > 200) {
        warn.textContent = I18N.t('imm.warn_lourd', {kb: kb});
        warn.style.display = '';
      } else {
        warn.style.display = 'none';
      }
      immUpdateOverlay();
      if (typeof immRefreshPreview === 'function') immRefreshPreview();
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// ── CAPTURE MODE ────────────────────────────────────────────────────
function immStartCapture(target) {
  _immCapture = target;
  var imgEl = document.getElementById('imm-img');
  imgEl.style.cursor = 'crosshair';
  imgEl.style.outline = '3px solid #0891b2';
  var hint = document.getElementById('imm-capture-hint');
  if (target && target.type === 'target' && target.ecart) {
    hint.textContent = target.stage === 2 ? I18N.t('imm.hint_second_point') : I18N.t('imm.hint_first_point');
  } else {
    hint.textContent = I18N.t('imm.hint_place_repere');
  }
  hint.style.display = '';
}

function immCaptureForTarget(btn) {
  var row = btn.closest('.imm-target-row');
  var typeSel = row.querySelector('.imm-t-type');
  var isEcart = typeSel && typeSel.value === 'ecart';
  immStartCapture({type: 'target', el: row, ecart: isEcart, stage: 1});
}

function immOnImageClick(e) {
  if (!_immCapture) return;
  var imgEl = document.getElementById('imm-img');
  var rect = imgEl.getBoundingClientRect();
  var cssX = e.clientX - rect.left;
  var cssY = e.clientY - rect.top;
  var natW = parseFloat(document.getElementById('imm-img-w').value) || 1;
  var natH = parseFloat(document.getElementById('imm-img-h').value) || 1;
  var px = Math.round(cssX * natW / rect.width);
  var py = Math.round(cssY * natH / rect.height);

  if (_immCapture === 'r1') {
    imgEl.style.cursor = 'default'; imgEl.style.outline = '';
    document.getElementById('imm-capture-hint').style.display = 'none';
    document.getElementById('imm-r1x').value = px;
    document.getElementById('imm-r1y').value = py;
    _immCapture = null;
  } else if (_immCapture === 'r2') {
    imgEl.style.cursor = 'default'; imgEl.style.outline = '';
    document.getElementById('imm-capture-hint').style.display = 'none';
    document.getElementById('imm-r2x').value = px;
    document.getElementById('imm-r2y').value = py;
    _immCapture = null;
  } else if (_immCapture && _immCapture.type === 'target') {
    var cap = _immCapture;
    var row = cap.el;
    var r1x = parseFloat(document.getElementById('imm-r1x').value);
    var r1y = parseFloat(document.getElementById('imm-r1y').value);
    var r1v = parseFloat(document.getElementById('imm-r1v').value);
    var r2x = parseFloat(document.getElementById('imm-r2x').value);
    var r2y = parseFloat(document.getElementById('imm-r2y').value);
    var r2v = parseFloat(document.getElementById('imm-r2v').value);

    if (cap.ecart && cap.stage === 1) {
      // Premier point (A) d'une mesure d'écart : on stocke sans calculer de valeur.
      row.dataset.px = px;
      row.dataset.py = py;
      row.dataset.px2 = '';
      row.dataset.py2 = '';
      immUpdateOverlay();
      immStartCapture({type: 'target', el: row, ecart: true, stage: 2});
      return;
    }

    imgEl.style.cursor = 'default'; imgEl.style.outline = '';
    document.getElementById('imm-capture-hint').style.display = 'none';

    if (cap.ecart) {
      // Second point (B) : la valeur attendue est l'écart réel entre A et B,
      // sans décalage d'origine (on utilise l'échelle en valeur absolue).
      var dxc = r2x - r1x, dyc = r2y - r1y;
      var calibDist = Math.sqrt(dxc * dxc + dyc * dyc);
      if (!isNaN(r1x) && !isNaN(r1y) && !isNaN(r2x) && !isNaN(r2y) && !isNaN(r1v) && !isNaN(r2v) && calibDist > 0) {
        var echelleMag = Math.abs(r2v - r1v) / calibDist;
        var pxA = parseFloat(row.dataset.px), pyA = parseFloat(row.dataset.py);
        var distAB = Math.hypot(px - pxA, py - pyA);
        row.dataset.px2 = px;
        row.dataset.py2 = py;
        row.querySelector('.imm-t-val').value = (distAB * echelleMag).toFixed(2);
      } else {
        alert(I18N.t('imm.alert_etalonnage_manquant'));
      }
    } else {
      // Valeur attendue = projection du point cliqué sur la droite repère1→repère2
      var dx = r2x - r1x, dy = r2y - r1y;
      var dist2 = dx * dx + dy * dy;
      if (!isNaN(r1x) && !isNaN(r1y) && !isNaN(r2x) && !isNaN(r2y) && !isNaN(r1v) && !isNaN(r2v) && dist2 > 0) {
        var t = ((px - r1x) * dx + (py - r1y) * dy) / dist2;
        var val = r1v + t * (r2v - r1v);
        row.querySelector('.imm-t-val').value = val.toFixed(2);
        row.dataset.px = px;
        row.dataset.py = py;
      } else {
        alert(I18N.t('imm.alert_etalonnage_manquant'));
      }
    }
    _immCapture = null;
  }
  immUpdateOverlay();
}

// ── OVERLAY (aperçu enseignant uniquement) ────────────────────────────
function immUpdateOverlay() {
  var svg = document.getElementById('imm-overlay');
  var imgEl = document.getElementById('imm-img');
  if (!svg || !imgEl || !imgEl.naturalWidth) return;

  var natW = imgEl.naturalWidth;
  var natH = imgEl.naturalHeight;
  svg.setAttribute('viewBox', '0 0 ' + natW + ' ' + natH);
  svg.innerHTML = '';

  var rad = Math.max(4, Math.round(natW / 150));

  function makeMarker(x, y, color) {
    if (isNaN(x) || isNaN(y)) return;
    var ns = 'http://www.w3.org/2000/svg';
    var c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', rad);
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', color);
    c.setAttribute('stroke-width', Math.max(2, Math.round(rad / 3)));
    svg.appendChild(c);
    var l1 = document.createElementNS(ns, 'line');
    l1.setAttribute('x1', x - rad * 1.8); l1.setAttribute('y1', y);
    l1.setAttribute('x2', x + rad * 1.8); l1.setAttribute('y2', y);
    l1.setAttribute('stroke', color); l1.setAttribute('stroke-width', 1.5);
    svg.appendChild(l1);
    var l2 = document.createElementNS(ns, 'line');
    l2.setAttribute('x1', x); l2.setAttribute('y1', y - rad * 1.8);
    l2.setAttribute('x2', x); l2.setAttribute('y2', y + rad * 1.8);
    l2.setAttribute('stroke', color); l2.setAttribute('stroke-width', 1.5);
    svg.appendChild(l2);
  }

  var r1x = parseFloat(document.getElementById('imm-r1x').value);
  var r1y = parseFloat(document.getElementById('imm-r1y').value);
  var r2x = parseFloat(document.getElementById('imm-r2x').value);
  var r2y = parseFloat(document.getElementById('imm-r2y').value);
  makeMarker(r1x, r1y, '#22d3ee');
  makeMarker(r2x, r2y, '#22d3ee');

  // Positions cibles (uniquement celles capturées à la souris, aperçu enseignant)
  document.querySelectorAll('.imm-target-row').forEach(function(row) {
    var typeSel = row.querySelector('.imm-t-type');
    var isEcart = typeSel && typeSel.value === 'ecart';
    var px = parseFloat(row.dataset.px), py = parseFloat(row.dataset.py);
    if (isEcart) {
      var px2 = parseFloat(row.dataset.px2), py2 = parseFloat(row.dataset.py2);
      makeMarker(px, py, '#a78bfa');
      makeMarker(px2, py2, '#a78bfa');
      if (!isNaN(px) && !isNaN(py) && !isNaN(px2) && !isNaN(py2)) {
        var ns = 'http://www.w3.org/2000/svg';
        var l = document.createElementNS(ns, 'line');
        l.setAttribute('x1', px); l.setAttribute('y1', py);
        l.setAttribute('x2', px2); l.setAttribute('y2', py2);
        l.setAttribute('stroke', '#a78bfa'); l.setAttribute('stroke-width', 1.5);
        l.setAttribute('stroke-dasharray', '4,3');
        svg.appendChild(l);
      }
    } else {
      makeMarker(px, py, '#fb923c');
    }
  });
}

// ── ADD TARGET ROW ───────────────────────────────────────────────────
function immAddTarget(desc, val) {
  var container = document.getElementById('imm-targets');
  if (container.querySelectorAll('.imm-target-row').length >= 6) return;
  var unit = document.getElementById('imm-unit').value || '';
  var n = container.querySelectorAll('.imm-target-row').length + 1;

  var row = document.createElement('div');
  row.className = 'imm-target-row';
  row.style.cssText = 'border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin:6px 0;background:#f9fafb;';
  row.innerHTML =
    '<div class="g2">' +
    '<div class="field"><label style="font-size:.8rem;">' + I18N.t('imm.desc_mesure_lbl', {n: n}) + '</label>' +
    '<input type="text" class="imm-t-desc" placeholder="' + I18N.t('imm.desc_mesure_ph') + '" value="' + (desc || '') + '" style="width:100%;"></div>' +
    '<div class="field"><label style="font-size:.8rem;">' + I18N.t('imm.valeur_attendue_lbl', {unit: unit}) + '</label>' +
    '<div style="display:flex;gap:6px;align-items:center;">' +
    '<input type="number" class="imm-t-val" step="any" placeholder="' + I18N.t('imm.valeur_attendue_ph') + '" value="' + (val !== undefined ? val : '') + '" style="width:90px;" oninput="immUpdateOverlay()">' +
    '<button type="button" class="btn-sm" title="' + I18N.t('imm.capturer_title') + '" onclick="immCaptureForTarget(this)">📍</button>' +
    '<button type="button" class="btn-sm" title="' + I18N.t('imm.supprimer_title') + '" onclick="this.closest(\'.imm-target-row\').remove();immUpdateOverlay();" style="color:#dc2626;">🗑️</button>' +
    '</div></div>' +
    '</div>' +
    '<div class="field" style="margin-top:4px;"><label style="font-size:.8rem;">' + I18N.t('imm.type_mesure_lbl') + '</label>' +
    '<select class="imm-t-type" onchange="var r=this.closest(\'.imm-target-row\');r.dataset.px=\'\';r.dataset.py=\'\';r.dataset.px2=\'\';r.dataset.py2=\'\';immUpdateOverlay();">' +
    '<option value="position">' + I18N.t('imm.type_position_opt') + '</option>' +
    '<option value="ecart">' + I18N.t('imm.type_ecart_opt') + '</option>' +
    '</select></div>';
  container.appendChild(row);
}

// ── JSXGraph board builder (partagé génération réelle + aperçu live) ──
// L'élève ne dispose PAS d'une conversion automatique px → unité réelle, ET
// ne voit AUCUN repère pré-placé par l'enseignant sur l'image (ni position,
// ni valeur) : seule une distance en pixels entre 2 points mobiles A/B est
// affichée. C'est à l'élève de repérer lui-même (à partir de la description
// textuelle de l'énoncé) où se trouvent les repères d'étalonnage sur le
// document, d'y positionner l'outil de mesure, d'en déduire l'échelle, puis
// de mesurer la grandeur demandée — rien n'est pré-placé ni pré-calculé.
function immBuildBoardJS(divIdExpr, imgData, imgW, imgH, jxgChunkFn) {
  var chunkFn = jxgChunkFn || jxgDropChunkedJsString;
  var jxg = '(function(){\n';
  jxg += 'var W=' + imgW + ',H=' + imgH + ';\n';
  jxg += 'var board=JXG.JSXGraph.initBoard(' + divIdExpr + ',{boundingbox:[0,H,W,0],axis:false,showNavigation:false,showCopyright:false,keepaspectratio:false,pan:{enabled:false},zoom:{enabled:false}});\n';
  jxg += 'board.create("image",[' + chunkFn(imgData, 2000) + ',[0,0],[W,H]],{fixed:true,highlight:false});\n';

  var lw = Math.max(1, Math.round(imgW / 400));

  // Outil de mesure générique : 2 points mobiles A et B, distance affichée en PIXELS seulement
  jxg += 'var A=board.create("point",[W*0.3,H*0.5],{name:"A",size:5,fillColor:"#fbbf24",strokeColor:"#fff",highlight:true,layer:6,showInfobox:false,label:{offset:[7,7],fontSize:13,color:"#fbbf24",cssStyle:"font-weight:bold;text-shadow:0 0 3px #000;"}});\n';
  jxg += 'var B=board.create("point",[W*0.7,H*0.5],{name:"B",size:5,fillColor:"#34d399",strokeColor:"#fff",highlight:true,layer:6,showInfobox:false,label:{offset:[7,7],fontSize:13,color:"#34d399",cssStyle:"font-weight:bold;text-shadow:0 0 3px #000;"}});\n';
  jxg += 'board.create("segment",[A,B],{strokeColor:"#a78bfa",strokeWidth:' + lw + ',dash:2,fixed:true,highlight:false,layer:5});\n';
  jxg += 'board.create("text",[function(){return (A.X()+B.X())/2;},function(){return (A.Y()+B.Y())/2;},function(){return Math.round(Math.hypot(B.X()-A.X(),B.Y()-A.Y()))+" px";}],{color:"#fff",fontSize:14,anchorX:"middle",anchorY:"middle",offset:[0,14],fixed:true,highlight:false,layer:7,cssStyle:"background:rgba(124,58,237,0.9);padding:2px 8px;border-radius:4px;font-weight:bold;"});\n';
  jxg += '})();';
  return jxg;
}

// ── GENERATOR ────────────────────────────────────────────────────────
function genImageMesureParams() {
  var bareme  = parseFloat(document.getElementById('imm-bareme').value) || 2;
  var text    = document.getElementById('imm-text').value || '';
  var imgData = document.getElementById('imm-image-data').value;
  var imgW    = parseFloat(document.getElementById('imm-img-w').value);
  var imgH    = parseFloat(document.getElementById('imm-img-h').value);
  var r1x     = parseFloat(document.getElementById('imm-r1x').value);
  var r1y     = parseFloat(document.getElementById('imm-r1y').value);
  var r1v     = parseFloat(document.getElementById('imm-r1v').value);
  var r1desc  = (document.getElementById('imm-r1desc') || {}).value || '';
  var r2x     = parseFloat(document.getElementById('imm-r2x').value);
  var r2y     = parseFloat(document.getElementById('imm-r2y').value);
  var r2v     = parseFloat(document.getElementById('imm-r2v').value);
  var r2desc  = (document.getElementById('imm-r2desc') || {}).value || '';
  var unit    = (document.getElementById('imm-unit').value || '').replace(/'/g, "\\'");
  var tol     = parseFloat(document.getElementById('imm-tol').value) || 5;
  var mode    = (document.getElementById('imm-mode') || {}).value || 'guide';
  var fbOk    = document.getElementById('imm-fb-ok').value   || FB_JUSTE_DEFAULT;
  var fbWrong = document.getElementById('imm-fb-wrong').value || FB_FAUX_DEFAULT;
  var fbGenEl = document.getElementById('imm-fbgen');

  // Read targets
  var targets = [];
  document.querySelectorAll('.imm-target-row').forEach(function(row) {
    var d = row.querySelector('.imm-t-desc').value.trim();
    var val = parseFloat(row.querySelector('.imm-t-val').value);
    var typeSel = row.querySelector('.imm-t-type');
    var type = (typeSel && typeSel.value === 'ecart') ? 'ecart' : 'position';
    var px = parseFloat(row.dataset.px), py = parseFloat(row.dataset.py);
    var px2 = parseFloat(row.dataset.px2), py2 = parseFloat(row.dataset.py2);
    var hasPx = type === 'ecart'
      ? (!isNaN(px) && !isNaN(py) && !isNaN(px2) && !isNaN(py2))
      : (!isNaN(px) && !isNaN(py));
    var pxDist = null;
    if (hasPx) {
      pxDist = type === 'ecart'
        ? Math.round(Math.hypot(px2 - px, py2 - py) * 1000) / 1000
        : Math.round(Math.hypot(px - r1x, py - r1y) * 1000) / 1000;
    }
    if (!isNaN(val)) targets.push({
      desc: d || I18N.t('imm.mesure_default_desc', {n: targets.length + 1}),
      val: val,
      type: type,
      hasPx: hasPx,
      pxDist: pxDist
    });
  });

  // Validations
  if (!imgData) { alert(I18N.t('imm.alert_charger_image')); return null; }
  if (isNaN(r1x) || isNaN(r1y) || isNaN(r2x) || isNaN(r2y) || isNaN(r1v) || isNaN(r2v) || (r1x === r2x && r1y === r2y)) {
    alert(I18N.t('imm.alert_etalonnage_distinct')); return null;
  }
  if (targets.length === 0) { alert(I18N.t('imm.alert_ajouter_mesure')); return null; }
  if (isNaN(imgW) || isNaN(imgH)) { alert(I18N.t('imm.alert_erreur_dimensions')); return null; }

  return {
    bareme: bareme, text: text, imgData: imgData, imgW: imgW, imgH: imgH,
    r1x: r1x, r1y: r1y, r1v: r1v, r2x: r2x, r2y: r2y, r2v: r2v,
    unit: unit, tol: tol, mode: mode, fbOk: fbOk, fbWrong: fbWrong,
    fbGenRaw: fbGenEl ? fbGenEl.value : '',
    targets: targets
  };
}

async function genImageMesure(X) {
  var p = genImageMesureParams();
  if (!p) return '';
  try {
    var res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'image-mesure', X: X, params: p })
    });
    if (res.ok) {
      var data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Quota hebdomadaire atteint.');
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "image-mesure", repli sur le calcul local (session expirée ?).');
  } catch (e) {
    console.warn('[stackforge] /api/generate injoignable pour "image-mesure", repli sur le calcul local.', e);
  }
  return genImageMesureCore(X, p);
}

function genImageMesureCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;
  var jxgDropChunkedJsString_D = deps.jxgDropChunkedJsString || jxgDropChunkedJsString;

  var bareme = p.bareme, text = p.text, imgData = p.imgData, imgW = p.imgW, imgH = p.imgH;
  var r1x = p.r1x, r1y = p.r1y, r1v = p.r1v, r2x = p.r2x, r2y = p.r2y, r2v = p.r2v;
  var unit = p.unit, tol = p.tol, mode = p.mode, fbOk = p.fbOk, fbWrong = p.fbWrong;
  var targets = p.targets;

  var N   = targets.length;

  // ── Maxima variable prefix ──
  var P = 'imm' + X;

  // ── 3 modes pédagogiques (structure des étapes vérifiées, pas la difficulté du document) ──
  // Guidé    : échelle + distance brute (avant origine) + valeur finale, chacune notée à part.
  // Autonome : seule la valeur finale rapporte des points ; l'échelle sert de filet de
  //            diagnostic (crédit partiel + indice si l'échelle est juste mais pas la finale).
  // Expert   : seule la valeur finale compte, sans aucun indice sur la nature de l'erreur.

  // Échelle (unité par pixel) déduite des 2 repères — commune à toute la question
  var calibDistPx    = Math.sqrt(Math.pow(r2x - r1x, 2) + Math.pow(r2y - r1y, 2));
  var echelle         = (r2v - r1v) / calibDistPx;
  var echelleRounded  = Math.round(echelle * 1e6) / 1e6;

  // Distance brute par cible (en unité réelle, AVANT prise en compte de l'origine r1v).
  // Pour une cible « écart entre 2 points », il n'y a pas d'origine à ajouter : la
  // distance brute EST la valeur finale, donc pas d'échelle signée (on prend |échelle|).
  targets.forEach(function(t) {
    var e = t.type === 'ecart' ? Math.abs(echelle) : echelle;
    t.rawDist = t.hasPx ? Math.round(t.pxDist * e * 1e6) / 1e6 : null;
  });

  // ── Feedback général auto-généré : méthode + corrigé chiffré, indépendant du mode
  // pédagogique (même l'Expert, qui ne donne aucun indice pendant la tentative, doit
  // pouvoir comprendre APRÈS coup comment on obtient la bonne réponse). ──
  var fbAuto = '<div style="margin-top:20px;padding:15px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;">'
    + '<div style="font-weight:bold;color:#0c4a6e;margin-bottom:10px;">' + I18N_D.t('imm.methode_corrige_lbl') + '</div>'
    + '<div style="margin-bottom:10px;font-size:.9rem;border-bottom:1px dashed #e2e8f0;padding-bottom:8px;">'
    + '<strong>' + I18N_D.t('imm.echelle_lbl') + '</strong> — ' + I18N_D.t('imm.echelle_full_desc', {r2v: r2v, r1v: r1v, calibDistPx: Math.round(calibDistPx), echelleRounded: echelleRounded, unit: htmlEsc_D(unit)}) + '</div>';
  targets.forEach(function(t, i) {
    var n = i + 1;
    var isLast = i === targets.length - 1;
    fbAuto += '<div style="margin-bottom:8px;font-size:.9rem;' + (isLast ? '' : 'border-bottom:1px dashed #e2e8f0;padding-bottom:8px;') + '">';
    fbAuto += '<span style="font-weight:bold;color:#0c4a6e;">' + n + '. ' + htmlEsc_D(t.desc) + ' :</span> ';
    if (!t.hasPx) {
      fbAuto += '<p>' + I18N_D.t('imm.valeur_attendue_simple', {val: t.val, unit: htmlEsc_D(unit)}) + '</p>';
    } else if (t.type === 'ecart') {
      fbAuto += '<p>' + I18N_D.t('imm.methode_ecart_desc', {pxDist: t.pxDist, echelleRounded: echelleRounded, val: t.val, unit: htmlEsc_D(unit)}) + '</p>';
    } else {
      fbAuto += '<p>' + I18N_D.t('imm.methode_position_desc', {pxDist: t.pxDist, echelleRounded: echelleRounded, rawDist: t.rawDist, r1v: r1v, val: t.val, unit: htmlEsc_D(unit)}) + '</p>';
    }
    fbAuto += '</div>';
  });
  fbAuto += '</div>';
  var generalFeedback = mkFbGen_D(fbAuto, p.fbGenRaw);

  // ── Répartition du barème selon le mode ──
  if (mode === 'guide') {
    // Un « unité de poids » par champ noté : échelle (1) + par cible (2 si distance
    // brute mesurable ET distincte de la valeur finale — donc seulement les cibles
    // « position » — sinon 1 seul champ noté = valeur finale repliée sur tout le poids).
    var totalUnits = 1;
    targets.forEach(function(t) { totalUnits += (t.hasPx && t.type !== 'ecart') ? 2 : 1; });
    var unitW = Math.round(bareme / totalUnits * 100) / 100;
    var wEchelle = unitW;
    targets.forEach(function(t) {
      if (t.hasPx && t.type !== 'ecart') { t.wRaw = unitW; t.wFinal = unitW; }
      else                               { t.wRaw = 0;     t.wFinal = unitW; }
    });
  } else {
    // Autonome / Expert : tout le barème est porté par la valeur finale de chaque cible.
    var share = Math.round(bareme / N * 100) / 100;
    targets.forEach(function(t) { t.wFinal = share; });
  }

  // ── JSXGraph code ──
  // Le rendu STACK utilise le plugin natif [[jsxgraph]]...[[/jsxgraph]] (pas
  // un <div class="jxgbox"><script>) : ce plugin injecte lui-même un script
  // sûr côté serveur, alors que Moodle nettoie/retire tout <script> brut
  // présent dans le questiontext HTML (format_text/clean_text). "divid" est
  // une variable JS fournie automatiquement par le plugin (pas de guillemets).
  var dispW = Math.min(700, imgW);
  var dispH = Math.round(imgH * dispW / imgW);

  var jxg = immBuildBoardJS('divid', imgData, imgW, imgH, jxgDropChunkedJsString_D);

  // ── textFrag (contenu visible, inséré dans le corps composite du Parcours) ──
  // Le code JS brut ne survit pas au traitement DOM (clone/innerHTML) du
  // composeur Parcours (js/app.js) : comme gen-jxgdrop.js, on le sort en
  // kbdRaw derrière un marqueur HS-KBD, restauré après coup par app.js.
  // Aucune valeur/description de repère n'est injectée automatiquement ici :
  // le professeur les rédige lui-même dans le champ Énoncé (ci-dessus, "text").
  var textFrag = '<div style="background:#0e7490;border-left:5px solid #164e63;padding:8px 14px;margin:0 0 10px 0;border-radius:6px;color:#fff;font-family:sans-serif;">'
      + '<strong style="font-size:1rem;">Q' + X + ' — ' + I18N_D.t('imm.banniere') + '</strong>'
      + '<span style="float:right;opacity:.85;">/ ' + bareme + ' pt</span></div>\n';
  if (text) textFrag += '<div>' + text + '</div>\n';
  textFrag += '[[jsxgraph width="' + dispW + 'px" height="' + dispH + 'px"]]\n';
  textFrag += '<!--HS-KBD:' + X + '-->\n';
  textFrag += '[[/jsxgraph]]\n';

  var modeLabel = mode === 'expert' ? I18N_D.t('imm.mode_expert_lbl') : (mode === 'autonome' ? I18N_D.t('imm.mode_autonome_lbl') : I18N_D.t('imm.mode_guide_lbl'));
  textFrag += '<p style="font-size:.78rem;color:#6b7280;margin:0 0 6px 0;">' + I18N_D.t('imm.mode_prefix') + ' <strong>' + modeLabel + '</strong></p>\n';

  if (mode === 'guide') {
    textFrag += '<p style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:6px;padding:8px 12px;font-size:.92rem;">'
        + '<strong>' + I18N_D.t('imm.etalonnage_lbl') + '</strong> — ' + I18N_D.t('imm.etalonnage_guide_desc') + '<br>'
        + I18N_D.t('imm.echelle_deduite_lbl', {unit: htmlEsc_D(unit)}) + ' [[input:' + P + 'ec]] [[validation:' + P + 'ec]]</p>\n';
  } else if (mode === 'autonome') {
    textFrag += '<p style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:6px;padding:8px 12px;font-size:.92rem;">'
        + '<strong>' + I18N_D.t('imm.etalonnage_lbl') + '</strong> — ' + I18N_D.t('imm.etalonnage_autonome_desc') + '<br>'
        + I18N_D.t('imm.echelle_calculee_lbl', {unit: htmlEsc_D(unit)}) + ' [[input:' + P + 'ec]] [[validation:' + P + 'ec]]</p>\n';
  }

  targets.forEach(function(t, i) {
    var n = i + 1;
    textFrag += '<p><strong>' + n + '. ' + htmlEsc_D(t.desc) + '</strong><br>';
    if (mode === 'guide' && t.hasPx && t.type !== 'ecart') {
      textFrag += I18N_D.t('imm.distance_brute_lbl', {unit: htmlEsc_D(unit)}) + ' [[input:' + P + 'r' + n + ']] [[validation:' + P + 'r' + n + ']]<br>';
    }
    var finalLabel = t.type === 'ecart'
      ? I18N_D.t('imm.valeur_mesuree_ecart_lbl')
      : I18N_D.t('imm.valeur_finale_lbl');
    textFrag += finalLabel + '&nbsp;: [[input:' + P + 'a' + n + ']] (' + htmlEsc_D(unit) + ') [[validation:' + P + 'a' + n + ']]</p>\n';
  });

  var kbdRaw = jxg;

  // Question variables
  var vars = P + 'ec: ' + echelleRounded + ';\n';
  vars += targets.map(function(t, i) {
    var n = i + 1;
    var s = P + 't' + n + ': ' + t.val + ';';
    if (mode === 'guide' && t.hasPx && t.type !== 'ecart') s += '\n' + P + 'r' + n + ': ' + t.rawDist + ';';
    return s;
  }).join('\n');

  // ── Helpers pour générer les paires input+PRT d'une étape numérique ──
  function immInputXML(name, tans) {
    var s = '';
    s += '<input>';
    s += '<name>' + name + '</name>';
    s += '<type>numerical</type>';
    s += '<tans>' + tans + '</tans>';
    s += '<boxsize>6</boxsize>';
    s += '<strictsyntax>1</strictsyntax>';
    s += '<insertstars>0</insertstars>';
    s += '<syntaxhint></syntaxhint>';
    s += '<syntaxattribute>0</syntaxattribute>';
    s += '<forbidwords></forbidwords>';
    s += '<allowwords></allowwords>';
    s += '<forbidfloat>0</forbidfloat>';
    s += '<requirelowestterms>0</requirelowestterms>';
    s += '<checkanswertype>0</checkanswertype>';
    s += '<mustverify>0</mustverify>';
    s += '<showvalidation>0</showvalidation>';
    s += '<options></options>';
    s += '</input>';
    return s;
  }
  // Boîtes de feedback colorées (mêmes codes que gen-oscilloscope.js : ✅/❌/🔶)
  function _immOk(txt)   { return '<div style="border-left:4px solid #15803d;padding:8px 12px;background:#f0fdf4;border-radius:4px;margin-bottom:10px;">✅ ' + txt + '</div>'; }
  function _immKo(txt)   { return '<div style="border-left:4px solid #dc2626;padding:8px 12px;background:#fef2f2;border-radius:4px;margin-bottom:10px;">❌ ' + txt + '</div>'; }
  function _immTrap(txt) { return '<div style="border-left:4px solid #ca8a04;padding:8px 12px;background:#fefce8;border-radius:4px;margin-bottom:10px;">🔶 ' + txt + '</div>'; }

  // Nœud PRT générique (même forme que buildPrtXml_D() de prt-manager.js, avec description)
  function _immNode(name, desc, test, sans, tans, testopt, tScoreMode, tScore, tNext, tNote, tFb, fScoreMode, fScore, fNext, fNote, fFb) {
    return {
      name: name, description: desc, answertest: test, sans: sans, tans: tans,
      testoptions: testopt, quiet: '0',
      truescoremode: tScoreMode, truescore: String(tScore), truepenalty: '', truenextnode: String(tNext),
      trueanswernote: tNote, truefeedback: tFb,
      falsescoremode: fScoreMode, falsescore: String(fScore), falsepenalty: '', falsenextnode: String(fNext),
      falseanswernote: fNote, falsefeedback: fFb
    };
  }
  function _immMeta(prtName, value) {
    return { name: prtName, value: String(value), autosimplify: '1', feedbackstyle: '1', feedbackvariables: '' };
  }

  // PRT Guidé — Échelle : nœud principal + nœud piège « repères inversés »
  // (signe opposé de l'échelle, erreur classique quand on inverse repère 1/2).
  function immPrtEchelleGuideXML(prtName, value, sans, tans) {
    var pieges = String(Math.round(-echelleRounded * 1e6) / 1e6);
    var nodes = [
      _immNode('0', 'Vérification de l\'échelle de conversion (pixels → ' + unit + ')',
        'NumRelative', sans, tans, tol,
        '+', 1, -1, prtName + '-0-T', _immOk('<strong>' + I18N_D.t('imm.echelle_correcte_lbl') + '</strong> ' + fbOk),
        '=', 0, 1, prtName + '-0-F', ''),
      _immNode('1', 'Piège : repères 1 et 2 inversés (signe de l\'échelle)',
        'NumRelative', sans, pieges, tol,
        '=', 0, -1, prtName + '-1-T', _immTrap(I18N_D.t('imm.piege_signe_desc')),
        '=', 0, -1, prtName + '-1-F', _immKo('<strong>' + I18N_D.t('imm.echelle_incorrecte_lbl') + '</strong> ' + fbWrong + '<p>' + I18N_D.t('imm.echelle_rappel_desc') + '</p>')
      )
    ];
    return buildPrtXml_D(_immMeta(prtName, value), nodes);
  }

  // PRT Guidé — Distance brute (avant origine), cibles de type Position uniquement :
  // nœud principal + nœud piège « oubli de la conversion » (a rendu le nb de pixels tel quel).
  function immPrtRawGuideXML(prtName, value, sans, tans, pxDistLit) {
    var piege = String(pxDistLit);
    var nodes = [
      _immNode('0', 'Vérification de la distance convertie (avant ajout de l\'origine)',
        'NumRelative', sans, tans, tol,
        '+', 1, -1, prtName + '-0-T', _immOk('<strong>' + I18N_D.t('imm.distance_correcte_lbl') + '</strong> ' + fbOk),
        '=', 0, 1, prtName + '-0-F', ''),
      _immNode('1', 'Piège : distance laissée en pixels (oubli de la conversion par l\'échelle)',
        'NumRelative', sans, piege, tol,
        '=', 0, -1, prtName + '-1-T', _immTrap(I18N_D.t('imm.piege_pixels_desc', {unit: unit})),
        '=', 0, -1, prtName + '-1-F', _immKo('<strong>' + I18N_D.t('imm.distance_incorrecte_lbl') + '</strong> ' + fbWrong + '<p>' + I18N_D.t('imm.distance_rappel_desc') + '</p>')
      )
    ];
    return buildPrtXml_D(_immMeta(prtName, value), nodes);
  }

  // PRT Guidé — Valeur finale : nœud principal + nœud piège différencié Position/Écart
  // (oubli d'ajouter l'origine, ou au contraire ajout à tort de l'origine à un écart).
  function immPrtFinalGuideXML(prtName, value, sans, tans, targetType, altLit) {
    var piege = String(altLit);
    var trapTxt = targetType === 'ecart'
      ? I18N_D.t('imm.piege_origine_ajoutee_desc')
      : I18N_D.t('imm.piege_origine_manquante_desc');
    var koHint = targetType === 'ecart'
      ? '<p>' + I18N_D.t('imm.kohint_ecart') + '</p>'
      : '<p>' + I18N_D.t('imm.kohint_position') + '</p>';
    var nodes = [
      _immNode('0', 'Vérification de la valeur finale',
        'NumRelative', sans, tans, tol,
        '+', 1, -1, prtName + '-0-T', _immOk('<strong>' + I18N_D.t('imm.valeur_finale_correcte_lbl') + '</strong> ' + fbOk),
        '=', 0, 1, prtName + '-0-F', ''),
      _immNode('1', targetType === 'ecart' ? 'Piège : origine ajoutée à tort à un écart' : 'Piège : origine (repère 1) non ajoutée',
        'NumRelative', sans, piege, tol,
        '=', 0, -1, prtName + '-1-T', _immTrap(trapTxt),
        '=', 0, -1, prtName + '-1-F', _immKo('<strong>' + I18N_D.t('imm.valeur_finale_incorrecte_lbl') + '</strong> ' + fbWrong + koHint)
      )
    ];
    return buildPrtXml_D(_immMeta(prtName, value), nodes);
  }

  // PRT Autonome — 2 nœuds : seule la valeur finale rapporte le plein score ;
  // si elle est fausse, on vérifie l'échelle pour un indice ciblé + crédit partiel,
  // sans révéler la nature exacte de l'erreur finale (tier intentionnellement générique).
  function immPrtAutonomeXML(prtName, value, sansFinal, tansFinal, targetType) {
    var hintFb = targetType === 'ecart'
      ? _immTrap(I18N_D.t('imm.hint_autonome_ecart'))
      : _immTrap(I18N_D.t('imm.hint_autonome_position'));
    var failFb = _immKo(I18N_D.t('imm.fail_autonome_desc'));
    var nodes = [
      _immNode('0', 'Vérification de la valeur finale attendue',
        'NumRelative', sansFinal, tansFinal, tol,
        '+', 1, -1, prtName + '-0-T', _immOk(fbOk),
        '+', 0, 1, prtName + '-0-F', ''),
      _immNode('1', 'Diagnostic (crédit partiel) : l\'échelle de conversion est-elle correcte ?',
        'NumRelative', P + 'ec', P + 'ec', tol,
        '+', 0.5, -1, prtName + '-1-T', hintFb,
        '=', 0, -1, prtName + '-1-F', failFb)
    ];
    return buildPrtXml_D(_immMeta(prtName, value), nodes);
  }

  // PRT Expert — 1 nœud, feedback neutre, aucune indication sur la localisation
  // de l'erreur (étalonnage / conversion / origine) : tier intentionnellement neutre.
  function immPrtExpertXML(prtName, value, sansFinal, tansFinal) {
    var neutralFail = _immKo(I18N_D.t('imm.neutral_fail_expert_desc'));
    var nodes = [
      _immNode('0', 'Vérification de la valeur finale (sans indication de la nature de l\'erreur)',
        'NumRelative', sansFinal, tansFinal, tol,
        '+', 1, -1, prtName + '-0-T', _immOk(fbOk),
        '=', 0, -1, prtName + '-0-F', neutralFail)
    ];
    return buildPrtXml_D(_immMeta(prtName, value), nodes);
  }

  // ── Inputs + PRTs selon le mode ──
  var inputXML, prtXML, fbRef;
  if (mode === 'guide') {
    inputXML = immInputXML(P + 'ec', P + 'ec');
    prtXML   = immPrtEchelleGuideXML('prt' + P + 'ec', wEchelle, P + 'ec', P + 'ec');
    fbRef    = '[[feedback:prt' + P + 'ec]]';
    targets.forEach(function(t, i) {
      var n = i + 1;
      if (t.hasPx && t.type !== 'ecart') {
        inputXML += '\n' + immInputXML(P + 'r' + n, P + 'r' + n);
        prtXML   += '\n' + immPrtRawGuideXML('prt' + P + 'r' + n, t.wRaw, P + 'r' + n, P + 'r' + n, t.pxDist);
        fbRef    += '[[feedback:prt' + P + 'r' + n + ']]';
      }
      var altLit = t.type === 'ecart' ? (Math.round((t.rawDist + r1v) * 1e6) / 1e6) : t.rawDist;
      inputXML += '\n' + immInputXML(P + 'a' + n, P + 't' + n);
      prtXML   += '\n' + immPrtFinalGuideXML('prt' + P + n, t.wFinal, P + 'a' + n, P + 't' + n, t.type, altLit);
      fbRef    += '[[feedback:prt' + P + n + ']]';
    });
  } else if (mode === 'autonome') {
    inputXML = immInputXML(P + 'ec', P + 'ec');
    prtXML   = '';
    fbRef    = '';
    targets.forEach(function(t, i) {
      var n = i + 1;
      inputXML += '\n' + immInputXML(P + 'a' + n, P + 't' + n);
      prtXML   += (prtXML ? '\n' : '') + immPrtAutonomeXML('prt' + P + n, t.wFinal, P + 'a' + n, P + 't' + n, t.type);
      fbRef    += '[[feedback:prt' + P + n + ']]';
    });
  } else { // expert
    inputXML = '';
    prtXML   = '';
    fbRef    = '';
    targets.forEach(function(t, i) {
      var n = i + 1;
      inputXML += (inputXML ? '\n' : '') + immInputXML(P + 'a' + n, P + 't' + n);
      prtXML   += (prtXML ? '\n' : '') + immPrtExpertXML('prt' + P + n, t.wFinal, P + 'a' + n, P + 't' + n);
      fbRef    += '[[feedback:prt' + P + n + ']]';
    });
  }

  return {
    bareme:          bareme,
    vars:            vars,
    qnote:           'Mesure image Q' + X,
    textFrag:        textFrag,
    kbdRaw:          kbdRaw,
    inputXML:        inputXML,
    prtXML:          prtXML,
    generalFeedback: generalFeedback,
    feedbackRef:     fbRef
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genImageMesure: genImageMesure, genImageMesureCore: genImageMesureCore, genImageMesureParams: genImageMesureParams };
}
