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

/* ══════════════════════════════════════════════════════════════
   CAIRN FOR STACK — Cinématique du point : builders JSXGraph (Phase 1 et
   Phase 2), suivant le pattern "buildOscJSXCode_*(cfg)" de
   gen-oscilloscope.js : la MÊME fonction sert à générer le JS de
   l'export XML (cfg porte des placeholders STACK {#var#}) et celui
   de l'aperçu live (cfg porte des littéraux numériques) — voir
   preview-cinematique.js. Chaque fonction retourne le bloc
   [[jsxgraph]]...[[/jsxgraph]] complet (comme oscilloscope), pas
   seulement le corps JS.

   Les points M_i sont désormais digitalisés à la main par l'enseignant
   (atelier js/cinematique-ui.js) et convertis en mètres réels par
   cinPointsToMeters (js/gen-cinematique-physics.js) — il n'y a plus de
   piste/vol libre simulée : Mlist/iIdx/vi/vip1/kv sont les seules
   grandeurs consommées ici, comme avant.

   Pièges JSXGraph respectés (DSTU pôle 6) :
   - tout create('text', ...) reçoit une fonction, jamais une chaîne ;
   - tout élément fixed:true reçoit aussi visible:true explicite ;
   - aucun bouton HTML brut : document.createElement uniquement ;
   - pas d'id="..." explicite sur [[jsxgraph]] : on utilise la
     variable implicite `divid` (voir _oscLightBoardJS), comme pour
     oscilloscope ;
   - liaison des inputs cachés ans_dv_x/ans_dv_y via input-ref-* +
     document.getElementById(ref) + dispatchEvent('change') (6.3) —
     jamais document.querySelector.
   ══════════════════════════════════════════════════════════════ */

/* Phase 1 — chronophotographie : les points M_i, M_{i+1}, M_{i+2} (i =
   iIdx, choisi par l'enseignant) sont mis en évidence, et l'élève trace
   lui-même les 2 vecteurs déplacement M_iM_{i+1} et M_{i+1}M_{i+2} en
   cliquant successivement sur les points concernés (accroche exacte,
   ce sont les points déjà tracés) via 2 boutons d'armement dédiés. Les
   vecteurs tracés sont synchronisés vers ans_vec1_x/y et ans_vec2_x/y
   (input-ref-, notés en PRT) — rien n'est pré-affiché ni pré-résolu. */
function buildCinJSX_Phase1(cfg) {
  var Wnum = parseInt(cfg.width, 10) || 620;
  var boardHnum = parseInt(cfg.height, 10) || 460;
  var W = Wnum + 'px';
  var refVec1X = cfg.refVec1X || 'refVec1X', refVec1Y = cfg.refVec1Y || 'refVec1Y';
  var refVec2X = cfg.refVec2X || 'refVec2X', refVec2Y = cfg.refVec2Y || 'refVec2Y';
  var nameVec1X = cfg.nameVec1X || 'ans_vec1_x', nameVec1Y = cfg.nameVec1Y || 'ans_vec1_y';
  var nameVec2X = cfg.nameVec2X || 'ans_vec2_x', nameVec2Y = cfg.nameVec2Y || 'ans_vec2_y';
  var lblVec1 = cfg.lblVec1 || 'Tracer le 1ᵉʳ vecteur déplacement';
  var lblVec2 = cfg.lblVec2 || 'Tracer le 2ᵉ vecteur déplacement';
  var lblErase = cfg.lblErase || '✖ Effacer';
  var lblEchellePrefix = cfg.lblEchellePrefix || 'Échelle du document : 1 pixel ↔ ';
  var lblEchelleSuffix = cfg.lblEchelleSuffix || ' m.';
  var lblClickInstruction = cfg.lblClickInstruction || 'Cliquez sur les 2 points successifs concernés, dans l\'ordre, sur le graphique.';
  var lblVec1Done = cfg.lblVec1Done || 'Vecteur 1 tracé ✓';
  var lblVec2Done = cfg.lblVec2Done || 'Vecteur 2 tracé ✓';
  return '[[jsxgraph width="' + W + '" aspect-ratio="' + (Wnum / boardHnum).toFixed(3) + '"'
    + ' input-ref-' + nameVec1X + '="' + refVec1X + '" input-ref-' + nameVec1Y + '="' + refVec1Y + '"'
    + ' input-ref-' + nameVec2X + '="' + refVec2X + '" input-ref-' + nameVec2Y + '="' + refVec2Y + '"]]\n'
    + '(function(){\n'
    + 'var b1 = JXG.JSXGraph.initBoard(divid, {\n'
    + '  boundingbox: [' + cfg.xmin + ', ' + cfg.ymax + ', ' + cfg.xmax + ', ' + cfg.ymin + '],\n'
    + '  axis: true, showCopyright: false, showNavigation: false, keepAspectRatio: true,\n'
    + '  resize: {enabled: false}\n'
    + '});\n'
    + 'b1.create("text", [' + cfg.xmin + '+0.3, ' + cfg.ymin + '+0.4, function(){ return "x (m)"; }], {fontSize:12, fixed:true, visible:true});\n'
    + 'b1.create("text", [' + cfg.xmin + '+0.3, ' + cfg.ymax + '-0.3, function(){ return "y (m)"; }], {fontSize:12, fixed:true, visible:true});\n'
    + 'var Mlist = ' + cfg.MlistExpr + ';\n'
    + 'var MlistPx = ' + cfg.MlistPxExpr + ';\n'
    + 'var echelle = ' + cfg.echelle + ';\n'
    + 'var iIdx = ' + cfg.iIdxExpr + ';\n'
    + 'var method = "' + (cfg.method === 'symetrique' ? 'symetrique' : 'apres') + '";\n'
    + 'var Mpts = [];\n'
    + 'for (var i = 0; i < Mlist.length; i++) {\n'
    + '  var isTarget = (method === "symetrique")\n'
    + '    ? (i === iIdx - 1 || i === iIdx || i === iIdx + 1 || i === iIdx + 2)\n'
    + '    : (i === iIdx || i === iIdx + 1 || i === iIdx + 2);\n'
    + '  Mpts.push(b1.create("point", Mlist[i], {\n'
    + '    name: "M" + i, fixed: true, visible: true,\n'
    + '    size: isTarget ? 4.5 : 3,\n'
    + '    color: isTarget ? "#dc2626" : "#0033aa",\n'
    + '    label: {offset:[6,6], fontSize: isTarget ? 14 : 12}\n'
    + '  }));\n'
    + '}\n'
    + 'var ctrl = document.createElement("div");\n'
    + 'ctrl.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;align-items:center;";\n'
    + 'function mkBtn(label, color){\n'
    + '  var b = document.createElement("button");\n'
    + '  b.type = "button"; b.textContent = label;\n'
    + '  b.style.cssText = "padding:6px 10px;font-size:12.5px;border:1.5px solid "+color+";border-radius:4px;background:#fff;color:"+color+";cursor:pointer;font-weight:600;";\n'
    + '  return b;\n'
    + '}\n'
    + 'var LBL_VEC1 = ' + JSON.stringify(lblVec1) + ';\n'
    + 'var LBL_VEC2 = ' + JSON.stringify(lblVec2) + ';\n'
    + 'var btnVec1 = mkBtn(LBL_VEC1, "#f97316");\n'
    + 'var btnVec2 = mkBtn(LBL_VEC2, "#7c3aed");\n'
    + 'var btnEraseVec1 = mkBtn(' + JSON.stringify(lblErase) + ', "#f97316");\n'
    + 'var btnEraseVec2 = mkBtn(' + JSON.stringify(lblErase) + ', "#7c3aed");\n'
    + 'btnEraseVec1.style.cssText += "padding:6px 8px;display:none;";\n'
    + 'btnEraseVec2.style.cssText += "padding:6px 8px;display:none;";\n'
    + 'var statusTxt = document.createElement("div");\n'
    + 'statusTxt.style.cssText = "font-size:12px;color:#374151;flex-basis:100%;min-height:15px;";\n'
    + 'var noteEchelle = document.createElement("div");\n'
    + 'noteEchelle.style.cssText = "font-size:12px;color:#475569;flex-basis:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:6px 10px;margin-bottom:2px;";\n'
    + 'noteEchelle.textContent = ' + JSON.stringify(lblEchellePrefix) + ' + echelle.toFixed(5) + ' + JSON.stringify(lblEchelleSuffix) + ';\n'
    + 'var vec1Done = false, vec2Done = false, pendingSlot = 0, pendingFirst = -1;\n'
    + 'var arrowVec1 = null, arrowVec2 = null, labelVec1 = null, labelVec2 = null;\n'
    + 'function syncVec(slot, dx, dy){\n'
    + '  var elX = document.getElementById(slot === 1 ? ' + refVec1X + ' : ' + refVec2X + ');\n'
    + '  var elY = document.getElementById(slot === 1 ? ' + refVec1Y + ' : ' + refVec2Y + ');\n'
    + '  if (elX) { elX.value = dx === null ? "" : dx.toFixed(3); elX.dispatchEvent(new Event("change")); }\n'
    + '  if (elY) { elY.value = dy === null ? "" : dy.toFixed(3); elY.dispatchEvent(new Event("change")); }\n'
    + '}\n'
    + 'function armSlot(slot){\n'
    + '  if ((slot === 1 && vec1Done) || (slot === 2 && vec2Done)) return;\n'
    + '  pendingSlot = slot; pendingFirst = -1;\n'
    + '  statusTxt.textContent = ' + JSON.stringify(lblClickInstruction) + ';\n'
    + '}\n'
    + 'function finishVec(slot, startIdx, endIdx){\n'
    + '  var dx = Mlist[endIdx][0] - Mlist[startIdx][0], dy = Mlist[endIdx][1] - Mlist[startIdx][1];\n'
    + '  var pxDx = MlistPx[endIdx][0] - MlistPx[startIdx][0], pxDy = MlistPx[endIdx][1] - MlistPx[startIdx][1];\n'
    + '  var pxLen = Math.sqrt(pxDx*pxDx + pxDy*pxDy);\n'
    + '  var col = slot === 1 ? "#f97316" : "#7c3aed";\n'
    + '  var arrow = b1.create("arrow", [Mpts[startIdx], Mpts[endIdx]], {strokeColor:col, strokeWidth:3, fixed:true, highlight:false});\n'
    + '  var midX = (Mlist[startIdx][0] + Mlist[endIdx][0]) / 2, midY = (Mlist[startIdx][1] + Mlist[endIdx][1]) / 2;\n'
    + '  var lenStr = pxLen.toFixed(1) + " px";\n'
    + '  var label = b1.create("text", [midX + 0.15, midY + 0.15, function(){ return lenStr; }], {fontSize:12, color:col, fixed:true, visible:true, cssStyle:"font-weight:700;background:rgba(255,255,255,.8);padding:1px 4px;border-radius:3px;"});\n'
    + '  syncVec(slot, dx, dy);\n'
    + '  if (slot === 1) { arrowVec1 = arrow; labelVec1 = label; vec1Done = true; btnVec1.disabled = true; btnVec1.style.opacity = "0.5"; btnVec1.textContent = ' + JSON.stringify(lblVec1Done) + '; btnEraseVec1.style.display = "inline-block"; }\n'
    + '  else { arrowVec2 = arrow; labelVec2 = label; vec2Done = true; btnVec2.disabled = true; btnVec2.style.opacity = "0.5"; btnVec2.textContent = ' + JSON.stringify(lblVec2Done) + '; btnEraseVec2.style.display = "inline-block"; }\n'
    + '  b1.update();\n'
    + '}\n'
    + 'function eraseVec(slot){\n'
    + '  var arrow = slot === 1 ? arrowVec1 : arrowVec2;\n'
    + '  var label = slot === 1 ? labelVec1 : labelVec2;\n'
    + '  if (arrow) { b1.removeObject(arrow); }\n'
    + '  if (label) { b1.removeObject(label); }\n'
    + '  if (slot === 1) {\n'
    + '    arrowVec1 = null; labelVec1 = null; vec1Done = false;\n'
    + '    btnVec1.disabled = false; btnVec1.style.opacity = "1"; btnVec1.textContent = LBL_VEC1;\n'
    + '    btnEraseVec1.style.display = "none";\n'
    + '  } else {\n'
    + '    arrowVec2 = null; labelVec2 = null; vec2Done = false;\n'
    + '    btnVec2.disabled = false; btnVec2.style.opacity = "1"; btnVec2.textContent = LBL_VEC2;\n'
    + '    btnEraseVec2.style.display = "none";\n'
    + '  }\n'
    + '  syncVec(slot, null, null);\n'
    + '  b1.update();\n'
    + '}\n'
    + 'btnVec1.addEventListener("click", function(){ armSlot(1); });\n'
    + 'btnVec2.addEventListener("click", function(){ armSlot(2); });\n'
    + 'btnEraseVec1.addEventListener("click", function(){ eraseVec(1); });\n'
    + 'btnEraseVec2.addEventListener("click", function(){ eraseVec(2); });\n'
    + 'Mpts.forEach(function(pt, idx){\n'
    + '  pt.on("down", function(){\n'
    + '    if (!pendingSlot) return;\n'
    + '    if (pendingFirst === -1) { pendingFirst = idx; return; }\n'
    + '    if (idx === pendingFirst) return;\n'
    + '    var slot = pendingSlot;\n'
    + '    finishVec(slot, pendingFirst, idx);\n'
    + '    statusTxt.textContent = "";\n'
    + '    pendingSlot = 0; pendingFirst = -1;\n'
    + '  });\n'
    + '});\n'
    + '(function(){\n'
    + '  function tryRestore(refXid, refYid, slot){\n'
    + '    var elX = document.getElementById(refXid), elY = document.getElementById(refYid);\n'
    + '    if (!elX || !elY) return;\n'
    + '    var sx = parseFloat(elX.value), sy = parseFloat(elY.value);\n'
    + '    if (isNaN(sx) || isNaN(sy) || (sx === 0 && sy === 0)) return;\n'
    + '    var bestI = -1, bestJ = -1, bestD = 0.05;\n'
    + '    for (var i = 0; i < Mlist.length; i++) {\n'
    + '      for (var j = 0; j < Mlist.length; j++) {\n'
    + '        if (i === j) continue;\n'
    + '        var d = Math.hypot(Mlist[j][0] - Mlist[i][0] - sx, Mlist[j][1] - Mlist[i][1] - sy);\n'
    + '        if (d < bestD) { bestD = d; bestI = i; bestJ = j; }\n'
    + '      }\n'
    + '    }\n'
    + '    if (bestI === -1) return;\n'
    + '    finishVec(slot, bestI, bestJ);\n'
    + '  }\n'
    + '  tryRestore(' + refVec1X + ', ' + refVec1Y + ', 1);\n'
    + '  tryRestore(' + refVec2X + ', ' + refVec2Y + ', 2);\n'
    + '})();\n'
    + 'ctrl.appendChild(noteEchelle);\n'
    + 'ctrl.appendChild(btnVec1);\n'
    + 'ctrl.appendChild(btnEraseVec1);\n'
    + 'ctrl.appendChild(btnVec2);\n'
    + 'ctrl.appendChild(btnEraseVec2);\n'
    + 'ctrl.appendChild(statusTxt);\n'
    + 'document.body.appendChild(ctrl);\n'
    + 'b1.update();\n'
    + 'stack_js.resize_containing_frame("' + W + '", document.documentElement.offsetHeight + "px");\n'
    + '})();\n'
    + '[[/jsxgraph]]';
}

/* Phase 2 — vi (bleu, depuis M_i) et vip1 (vert, depuis M_{i+1}) restent
   invisibles (juste un texte d'attente) tant que les 2 champs numériques
   ans_vi/ans_vip1 (renseignés par l'élève à partir de ses tracés de
   Phase 1) ne sont pas remplis (présence non vide, indépendant de leur
   exactitude) ; dès qu'ils le sont, les vraies valeurs du générateur sont
   tracées — v_i part de M_i, colinéaire à M_iM_{i+1} ; v_{i+1} part de
   M_{i+1}, colinéaire à M_{i+1}M_{i+2} (longueur mise à l'échelle par kv,
   affichage uniquement, jamais la notation) — et les boutons de
   clonage/tracé s'activent. L'élève clone/inverse/accroche (magnétique,
   <0.3, sur les origines de clones uniquement) pour construire
   visuellement la relation de Chasles, puis trace un vecteur rouge final
   (2 points librement déplaçables, sans accroche) dont les composantes
   relatives (pointe - origine) sont synchronisées vers ans_dv_x/ans_dv_y
   — seule valeur notée pour cette étape (indépendante du placement). */
function buildCinJSX_Phase2(cfg) {
  var Wnum = parseInt(cfg.width, 10) || 460;
  var boardHnum = parseInt(cfg.height, 10) || 420;
  var W = Wnum + 'px';
  var refDvX = cfg.refDvX || 'refDvX', refDvY = cfg.refDvY || 'refDvY';
  var refVi = cfg.refVi || 'refVi', refVip1 = cfg.refVip1 || 'refVip1';
  var nameVi = cfg.nameVi || 'ans_vi', nameVip1 = cfg.nameVip1 || 'ans_vip1';
  var lblPlaceholderA = cfg.lblPlaceholderA || 'Renseignez v';
  var lblPlaceholderB = cfg.lblPlaceholderB || ' et v';
  var lblPlaceholderC = cfg.lblPlaceholderC || ' ci-dessus pour faire apparaître les vecteurs.';
  var lblCloner = cfg.lblCloner || 'Cloner v';
  var lblInverser = cfg.lblInverser || 'Inverser';
  var lblTracerDv = cfg.lblTracerDv || 'Tracer Δv';
  var lblRecommencer = cfg.lblRecommencer || '↻ Recommencer';
  return '[[jsxgraph width="' + W + '" aspect-ratio="' + (Wnum / boardHnum).toFixed(3) + '"'
    + ' input-ref-' + (cfg.nameDvX || 'ans_dv_x') + '="' + refDvX + '" input-ref-' + (cfg.nameDvY || 'ans_dv_y') + '="' + refDvY + '"'
    + ' input-ref-' + nameVi + '="' + refVi + '" input-ref-' + nameVip1 + '="' + refVip1 + '"]]\n'
    + '(function(){\n'
    + 'var Mlist = ' + cfg.MlistExpr + ';\n'
    + 'var iIdx = ' + cfg.iIdxExpr + ';\n'
    + 'var Mi = Mlist[iIdx], Mip1 = Mlist[iIdx+1], Mip2 = Mlist[iIdx+2];\n'
    + 'var vi = ' + cfg.viExpr + ';\n'
    + 'var vip1 = ' + cfg.vip1Expr + ';\n'
    + 'var kv = ' + cfg.kvExpr + ';\n'
    + 'var wx0 = ' + cfg.xmin + ', wx1 = ' + cfg.xmax + ', wy0 = ' + cfg.ymin + ', wy1 = ' + cfg.ymax + ';\n'
    + 'var b2 = JXG.JSXGraph.initBoard(divid, {\n'
    + '  boundingbox: [wx0, wy1, wx1, wy0],\n'
    + '  axis: true, showCopyright: false, showNavigation: true, keepAspectRatio: true, grid: true,\n'
    + '  zoom: { enabled: true, wheel: true, needShift: false, factorX: 1.25, factorY: 1.25 },\n'
    + '  pan: { enabled: true, needTwoFingers: false, needShift: true },\n'
    + '  resize: {enabled: false}\n'
    + '});\n'
    + '(function(){\n'
    + '  var elX0 = document.getElementById(' + refDvX + ');\n'
    + '  var elY0 = document.getElementById(' + refDvY + ');\n'
    + '  if (elX0 && !elX0.value) { elX0.value = "0"; elX0.dispatchEvent(new Event("change")); }\n'
    + '  if (elY0 && !elY0.value) { elY0.value = "0"; elY0.dispatchEvent(new Event("change")); }\n'
    + '})();\n'
    + 'var placeholder = b2.create("text", [function(){return wx0+(wx1-wx0)*0.04;}, function(){return wy0+(wy1-wy0)*0.5;}, function(){\n'
    + '  return ' + JSON.stringify(lblPlaceholderA) + ' + iIdx + ' + JSON.stringify(lblPlaceholderB) + ' + (iIdx+1) + ' + JSON.stringify(lblPlaceholderC) + ';\n'
    + '}], {fontSize:12, color:"#94a3b8", fixed:true, visible:true});\n'
    + 'var Mi_pt = null, Mip1_pt = null, Avi = null, Avip1 = null;\n'
    + 'var built = false;\n'
    + '\n'
    + 'var clones = [];\n'
    + 'var selected = null;\n'
    + 'var usedVi = false, usedVip1 = false;\n'
    + '\n'
    + 'function selectClone(rec){\n'
    + '  if (selected === rec) {\n'
    + '    selected = null;\n'
    + '  } else {\n'
    + '    selected = rec;\n'
    + '  }\n'
    + '  clones.forEach(function(c){ c.arrow.setAttribute({strokeWidth: (c === selected) ? 6 : 3}); });\n'
    + '  btnInvert.disabled = !selected;\n'
    + '  b2.update();\n'
    + '}\n'
    + '\n'
    + 'function mkClone(kind, baseVec, color, startX, startY){\n'
    + '  var offX = baseVec[0], offY = baseVec[1];\n'
    + '  var origin = b2.create("point", [startX, startY], {name:"", size:3, color:color, fixed:false, visible:true, showInfobox:false});\n'
    + '  var tip = b2.create("point", [\n'
    + '    function(){ return origin.X() + offX; },\n'
    + '    function(){ return origin.Y() + offY; }\n'
    + '  ], {name:"", size:1, color:color, fixed:true, visible:true, withLabel:false});\n'
    + '  var arrow = b2.create("arrow", [origin, tip], {strokeColor:color, strokeWidth:3, highlight:false});\n'
    + '  var rec = {\n'
    + '    kind: kind, origin: origin, tip: tip, arrow: arrow,\n'
    + '    invert: function(){ offX *= -1; offY *= -1; b2.update(); }\n'
    + '  };\n'
    + '  arrow.on("down", function(){ selectClone(rec); });\n'
    + '  origin.on("down", function(){ selectClone(rec); });\n'
    + '  origin.on("drag", function(){\n'
    + '    var targets = [];\n'
    + '    if (kind !== "vi" && Avi) targets.push([Avi.X(), Avi.Y()]);\n'
    + '    if (kind !== "vip1" && Avip1) targets.push([Avip1.X(), Avip1.Y()]);\n'
    + '    clones.forEach(function(c){ if (c !== rec) targets.push([c.tip.X(), c.tip.Y()]); });\n'
    + '    var ox = origin.X(), oy = origin.Y();\n'
    + '    var bestD = 0.3, bestX = null, bestY = null;\n'
    + '    targets.forEach(function(t){\n'
    + '      var d = Math.hypot(ox - t[0], oy - t[1]);\n'
    + '      if (d < bestD) { bestD = d; bestX = t[0]; bestY = t[1]; }\n'
    + '    });\n'
    + '    if (bestX !== null) origin.setPosition(JXG.COORDS_BY_USER, [bestX, bestY]);\n'
    + '    b2.update();\n'
    + '  });\n'
    + '  clones.push(rec);\n'
    + '  return rec;\n'
    + '}\n'
    + '\n'
    + 'var ctrl = document.createElement("div");\n'
    + 'ctrl.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;";\n'
    + 'function mkBtn(label, color){\n'
    + '  var b = document.createElement("button");\n'
    + '  b.type = "button"; b.textContent = label;\n'
    + '  b.style.cssText = "padding:6px 12px;font-size:12.5px;border:1.5px solid "+color+";border-radius:4px;background:#fff;color:"+color+";cursor:pointer;font-weight:600;";\n'
    + '  b.disabled = true; b.style.opacity = "0.4";\n'
    + '  return b;\n'
    + '}\n'
    + 'var btnCloneVi = mkBtn(' + JSON.stringify(lblCloner) + ' + iIdx, "#f97316");\n'
    + 'var btnCloneVip1 = mkBtn(' + JSON.stringify(lblCloner) + ' + (iIdx+1), "#7c3aed");\n'
    + 'var btnInvert = mkBtn(' + JSON.stringify(lblInverser) + ', "#374151");\n'
    + 'var btnTrace = mkBtn(' + JSON.stringify(lblTracerDv) + ' + iIdx, "#dc2626");\n'
    + 'var btnResetP2 = mkBtn(' + JSON.stringify(lblRecommencer) + ', "#64748b");\n'
    + '\n'
    + 'btnCloneVi.addEventListener("click", function(){\n'
    + '  if (usedVi || !built) return;\n'
    + '  usedVi = true; btnCloneVi.disabled = true; btnCloneVi.style.opacity = "0.4";\n'
    + '  mkClone("vi", [kv*vi[0], kv*vi[1]], "#f97316", wx0+(wx1-wx0)*0.82, wy0+(wy1-wy0)*0.22);\n'
    + '});\n'
    + 'btnCloneVip1.addEventListener("click", function(){\n'
    + '  if (usedVip1 || !built) return;\n'
    + '  usedVip1 = true; btnCloneVip1.disabled = true; btnCloneVip1.style.opacity = "0.4";\n'
    + '  mkClone("vip1", [kv*vip1[0], kv*vip1[1]], "#7c3aed", wx0+(wx1-wx0)*0.82, wy0+(wy1-wy0)*0.52);\n'
    + '});\n'
    + 'btnInvert.addEventListener("click", function(){\n'
    + '  if (!selected) return;\n'
    + '  selected.invert();\n'
    + '});\n'
    + '\n'
    + 'var redOrigin = null, redTip = null, redArrow = null, traced = false;\n'
    + 'function syncDvInput(){\n'
    + '  if (!redOrigin || !redTip) return;\n'
    + '  var dx = (redTip.X() - redOrigin.X()) / kv;\n'
    + '  var dy = (redTip.Y() - redOrigin.Y()) / kv;\n'
    + '  var elX = document.getElementById(' + refDvX + ');\n'
    + '  var elY = document.getElementById(' + refDvY + ');\n'
    + '  if (elX) { elX.value = dx.toFixed(3); elX.dispatchEvent(new Event("change")); }\n'
    + '  if (elY) { elY.value = dy.toFixed(3); elY.dispatchEvent(new Event("change")); }\n'
    + '}\n'
    + 'btnTrace.addEventListener("click", function(){\n'
    + '  if (traced || !built) return;\n'
    + '  traced = true; btnTrace.disabled = true; btnTrace.style.opacity = "0.4";\n'
    + '  redOrigin = b2.create("point", [wx0+(wx1-wx0)*0.82, wy0+(wy1-wy0)*0.80], {name:"", size:3, color:"#dc2626", fixed:false, visible:true, showInfobox:false});\n'
    + '  redTip = b2.create("point", [wx0+(wx1-wx0)*0.95, wy0+(wy1-wy0)*0.90], {name:"", size:3, color:"#dc2626", fixed:false, visible:true, showInfobox:false});\n'
    + '  redArrow = b2.create("arrow", [redOrigin, redTip], {strokeColor:"#dc2626", strokeWidth:3, highlight:false});\n'
    + '  syncDvInput();\n'
    + '  redOrigin.on("drag", syncDvInput);\n'
    + '  redTip.on("drag", syncDvInput);\n'
    + '  b2.update();\n'
    + '});\n'
    + 'btnResetP2.addEventListener("click", function(){\n'
    + '  if (!built) return;\n'
    + '  clones.forEach(function(c){ b2.removeObject(c.origin); b2.removeObject(c.tip); b2.removeObject(c.arrow); });\n'
    + '  clones = []; selected = null; usedVi = false; usedVip1 = false;\n'
    + '  btnCloneVi.disabled = false; btnCloneVi.style.opacity = "1";\n'
    + '  btnCloneVip1.disabled = false; btnCloneVip1.style.opacity = "1";\n'
    + '  btnInvert.disabled = true;\n'
    + '  if (redArrow) { b2.removeObject(redOrigin); b2.removeObject(redTip); b2.removeObject(redArrow); redOrigin = null; redTip = null; redArrow = null; }\n'
    + '  traced = false; btnTrace.disabled = false; btnTrace.style.opacity = "1";\n'
    + '  var elX = document.getElementById(' + refDvX + ');\n'
    + '  var elY = document.getElementById(' + refDvY + ');\n'
    + '  if (elX) { elX.value = "0"; elX.dispatchEvent(new Event("change")); }\n'
    + '  if (elY) { elY.value = "0"; elY.dispatchEvent(new Event("change")); }\n'
    + '  b2.update();\n'
    + '});\n'
    + '\n'
    + 'ctrl.appendChild(btnCloneVi);\n'
    + 'ctrl.appendChild(btnCloneVip1);\n'
    + 'ctrl.appendChild(btnInvert);\n'
    + 'ctrl.appendChild(btnTrace);\n'
    + 'ctrl.appendChild(btnResetP2);\n'
    + 'document.body.appendChild(ctrl);\n'
    + 'stack_js.resize_containing_frame("' + W + '", document.documentElement.offsetHeight + "px");\n'
    + '\n'
    + 'function tryBuild(){\n'
    + '  if (built) return;\n'
    + '  var elVi = document.getElementById(' + refVi + ');\n'
    + '  var elVip1 = document.getElementById(' + refVip1 + ');\n'
    + '  var okVi = elVi && String(elVi.value).trim() !== "";\n'
    + '  var okVip1 = elVip1 && String(elVip1.value).trim() !== "";\n'
    + '  if (!okVi || !okVip1) return;\n'
    + '  built = true;\n'
    + '  placeholder.setAttribute({visible: false});\n'
    + '  Mi_pt = b2.create("point", Mi, {name:"M" + iIdx, fixed:true, visible:true, size:3, color:"#0033aa", label:{offset:[6,6], fontSize:12}});\n'
    + '  Mip1_pt = b2.create("point", Mip1, {name:"M" + (iIdx+1), fixed:true, visible:true, size:3, color:"#0033aa", label:{offset:[6,6], fontSize:12}});\n'
    + '  b2.create("point", Mip2, {name:"M" + (iIdx+2), fixed:true, visible:true, size:3, color:"#0033aa", label:{offset:[6,6], fontSize:12}});\n'
    + '  Avi = b2.create("point", [function(){return Mi[0]+kv*vi[0];}, function(){return Mi[1]+kv*vi[1];}], {name:"", fixed:true, visible:true, size:1, withLabel:false});\n'
    + '  b2.create("arrow", [Mi_pt, Avi], {strokeColor:"#2563eb", strokeWidth:2.5, fixed:true, highlight:false});\n'
    + '  b2.create("text", [function(){return Mi[0]+kv*vi[0]*0.5-0.35;}, function(){return Mi[1]+kv*vi[1]*0.5+0.2;}, function(){return "v" + iIdx;}], {fontSize:14, color:"#2563eb", fixed:true, visible:true});\n'
    + '  Avip1 = b2.create("point", [function(){return Mip1[0]+kv*vip1[0];}, function(){return Mip1[1]+kv*vip1[1];}], {name:"", fixed:true, visible:true, size:1, withLabel:false});\n'
    + '  b2.create("arrow", [Mip1_pt, Avip1], {strokeColor:"#16a34a", strokeWidth:2.5, fixed:true, highlight:false});\n'
    + '  b2.create("text", [function(){return Mip1[0]+kv*vip1[0]*0.5-0.35;}, function(){return Mip1[1]+kv*vip1[1]*0.5+0.2;}, function(){return "v" + (iIdx+1);}], {fontSize:14, color:"#16a34a", fixed:true, visible:true});\n'
    + '  btnCloneVi.disabled = false; btnCloneVi.style.opacity = "1";\n'
    + '  btnCloneVip1.disabled = false; btnCloneVip1.style.opacity = "1";\n'
    + '  btnTrace.disabled = false; btnTrace.style.opacity = "1";\n'
    + '  btnResetP2.disabled = false; btnResetP2.style.opacity = "1";\n'
    + '  (function(){\n'
    + '    var elDvX = document.getElementById(' + refDvX + ');\n'
    + '    var elDvY = document.getElementById(' + refDvY + ');\n'
    + '    var dvx = elDvX ? parseFloat(elDvX.value) : NaN;\n'
    + '    var dvy = elDvY ? parseFloat(elDvY.value) : NaN;\n'
    + '    if (isNaN(dvx) || isNaN(dvy) || (dvx === 0 && dvy === 0)) return;\n'
    + '    usedVi = true; btnCloneVi.disabled = true; btnCloneVi.style.opacity = "0.4";\n'
    + '    var c1 = mkClone("vi", [-kv*vi[0], -kv*vi[1]], "#f97316", wx0+(wx1-wx0)*0.82, wy0+(wy1-wy0)*0.22);\n'
    + '    usedVip1 = true; btnCloneVip1.disabled = true; btnCloneVip1.style.opacity = "0.4";\n'
    + '    mkClone("vip1", [kv*vip1[0], kv*vip1[1]], "#7c3aed", c1.tip.X(), c1.tip.Y());\n'
    + '    traced = true; btnTrace.disabled = true; btnTrace.style.opacity = "0.4";\n'
    + '    redOrigin = b2.create("point", [c1.origin.X(), c1.origin.Y()], {name:"", size:3, color:"#dc2626", fixed:false, visible:true, showInfobox:false});\n'
    + '    redTip = b2.create("point", [c1.origin.X() + kv*dvx, c1.origin.Y() + kv*dvy], {name:"", size:3, color:"#dc2626", fixed:false, visible:true, showInfobox:false});\n'
    + '    redArrow = b2.create("arrow", [redOrigin, redTip], {strokeColor:"#dc2626", strokeWidth:3, highlight:false});\n'
    + '    redOrigin.on("drag", syncDvInput);\n'
    + '    redTip.on("drag", syncDvInput);\n'
    + '  })();\n'
    + '  b2.update();\n'
    + '}\n'
    + '(function(){\n'
    + '  var elVi = document.getElementById(' + refVi + ');\n'
    + '  var elVip1 = document.getElementById(' + refVip1 + ');\n'
    + '  if (elVi) { elVi.addEventListener("change", tryBuild); elVi.addEventListener("blur", tryBuild); }\n'
    + '  if (elVip1) { elVip1.addEventListener("change", tryBuild); elVip1.addEventListener("blur", tryBuild); }\n'
    + '  tryBuild();\n'
    + '})();\n'
    + 'b2.update();\n'
    + '})();\n'
    + '[[/jsxgraph]]';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildCinJSX_Phase1: buildCinJSX_Phase1,
    buildCinJSX_Phase2: buildCinJSX_Phase2
  };
}
