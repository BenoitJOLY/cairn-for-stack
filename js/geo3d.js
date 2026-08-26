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

// ── GEO3D — Figures 3D en perspective cavalière ───────────────────────────

var _geo3dShape = 'pave';

function openGeo3dModal() {
  _geo3dSelectShape('pave');
  document.getElementById('geo3d-preview').innerHTML = '';
  var modal = document.getElementById('geo3dModal');
  modal.style.display = 'flex';
  FocusTrap.trap(modal, closeGeo3dModal);
  setTimeout(_geo3dPreview, 50);
}

function closeGeo3dModal() {
  document.getElementById('geo3dModal').style.display = 'none';
  FocusTrap.release();
}

function _geo3dSelectShape(shape) {
  _geo3dShape = shape;
  document.querySelectorAll('.geo3d-shape-btn').forEach(function(b) {
    b.classList.toggle('geo3d-sel', b.dataset.shape === shape);
  });
  document.querySelectorAll('.geo2d-params').forEach(function(p) {
    p.style.display = p.id === 'geo3d-params-' + shape ? '' : 'none';
  });
  _geo3dPreview();
}

function _geo3dPreview() {
  try {
    document.getElementById('geo3d-preview').innerHTML = _geo3dGenerate();
  } catch(e) {
    document.getElementById('geo3d-preview').innerHTML =
      '<p style="color:#ef4444;font-size:.82rem;padding:10px;">Paramètres invalides</p>';
  }
}

function geo3dInsert() {
  try {
    var svg = _geo3dGenerate();
    var uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    var html = '<img src="' + uri + '" style="max-width:100%;height:auto;display:inline-block;margin:4px;" alt="figure géométrique 3D">';
    closeGeo3dModal();
    var tgt = (typeof _verifZoneActive !== 'undefined' && _verifZoneActive) || richEditor();
    if (tgt) {
      restoreRichSelection(tgt);
      document.execCommand('insertHTML', false, html);
      if (typeof _verifZoneActive !== 'undefined') _verifZoneActive = null;
    }
  } catch(e) {
    if (typeof toast === 'function') toast('Paramètres invalides');
  }
}

// ── Param helpers ─────────────────────────────────────────────────────────
function _3N(id, def) { var el = document.getElementById(id); return el ? (parseFloat(el.value) || def) : def; }
function _3S(id, def) { var el = document.getElementById(id); return el ? el.value : (def || ''); }

function _geo3dGenerate() {
  switch (_geo3dShape) {
    case 'pave':        return _g3Pave();
    case 'prisme':      return _g3Prisme();
    case 'prisme_tri':  return _g3PrismeTri();
    case 'pyr_carre':   return _g3PyrCarree();
    case 'pyr_tri':     return _g3PyrTri();
    case 'tronc':       return _g3Tronc();
    case 'cone':        return _g3Cone();
    case 'cylindre':    return _g3Cylindre();
    case 'sphere':      return _g3Sphere();
    case 'coin_rect':   return _g3CoinRect();
    case 'coin_tri':    return _g3CoinTri();
    default: return '';
  }
}

// ─── Cavalier projection engine ───────────────────────────────────────────
// 3D → projected-2D (before fit): x=right, y=up, z=depth-away
// screen_y grows downward → negate y and z·sin contribution
function _cav(pts3d, alpha, k) {
  var ca = Math.cos(alpha), sa = Math.sin(alpha);
  return pts3d.map(function(p) {
    return [p[0] + p[2] * k * ca,  -p[1] - p[2] * k * sa];
  });
}

// Auto-scale + center into W×H viewport with PAD padding
function _fit(pts2d, W, H, PAD) {
  var xs = pts2d.map(function(p){return p[0];}),
      ys = pts2d.map(function(p){return p[1];});
  var x0 = Math.min.apply(null,xs), x1 = Math.max.apply(null,xs);
  var y0 = Math.min.apply(null,ys), y1 = Math.max.apply(null,ys);
  var rX = x1-x0 || 1, rY = y1-y0 || 1;
  var s = Math.min((W-2*PAD)/rX, (H-2*PAD)/rY);
  return { ox: (W-(x0+x1)*s)/2, oy: (H-(y0+y1)*s)/2, s: s };
}

function _scr(pts2d, f) {
  return pts2d.map(function(p){ return [f.ox + p[0]*f.s, f.oy + p[1]*f.s]; });
}

// Build SVG string from screen vertices + edge lists
var _W3 = 300, _H3 = 260, _PAD3 = 32;
var _STR = 'fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round"';
var _DSH = 'fill="none" stroke="#64748b" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="5,3"';

function _svgLine(a, b, dashed) {
  return '<line x1="'+a[0].toFixed(1)+'" y1="'+a[1].toFixed(1)+
         '" x2="'+b[0].toFixed(1)+'" y2="'+b[1].toFixed(1)+'" '+(dashed?_DSH:_STR)+'/>';
}

function _svgLbl(sx, sy, dx, dy, txt) {
  return '<text x="'+(sx+dx).toFixed(1)+'" y="'+(sy+dy).toFixed(1)+
         '" font-family="serif" font-size="13" font-weight="bold" fill="#1e293b">'+txt+'</text>';
}

function _svgWrap(W, H, inner) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+
         '" viewBox="0 0 '+W+' '+H+'">'+inner+'</svg>';
}

// Render a solid from vertex list + edge sets + optional labels
// labels: array of [vertexIdx, offsetX, offsetY, text]
// opts.lengths: { on:bool, unit:'cm'|'', edges:[[i,j],...] }  (defaults to solidE+dashE)
// opts.points: array of { xyz:[x,y,z], label:string, dx, dy }
function _render(verts3d, solidE, dashE, labels, opts) {
  opts = opts || {};
  var alpha = _3N('g3-angle', 45) * Math.PI / 180;
  var k     = _3N('g3-k', 50) / 100;
  var pts2d = _cav(verts3d, alpha, k);
  var f     = _fit(pts2d, _W3, _H3, _PAD3);
  var sc    = _scr(pts2d, f);
  var c = '';
  dashE.forEach(function(e){ c += _svgLine(sc[e[0]], sc[e[1]], true); });
  solidE.forEach(function(e){ c += _svgLine(sc[e[0]], sc[e[1]], false); });
  if (labels) labels.forEach(function(l){ c += _svgLbl(sc[l[0]][0], sc[l[0]][1], l[1], l[2], l[3]); });
  if (opts.lengths && opts.lengths.on) {
    var edges = opts.lengths.edges || solidE.concat(dashE);
    edges.forEach(function(e) {
      var d  = _dist3(verts3d[e[0]], verts3d[e[1]]);
      var mx = (sc[e[0]][0] + sc[e[1]][0]) / 2, my = (sc[e[0]][1] + sc[e[1]][1]) / 2;
      c += '<text x="'+mx.toFixed(1)+'" y="'+my.toFixed(1)+'" text-anchor="middle" font-family="sans-serif" font-size="10.5" fill="#7c3aed">'+_fmtLen3(d, opts.lengths.unit)+'</text>';
    });
  }
  if (opts.points) {
    var pf = f;
    opts.points.forEach(function(p) {
      var s2d = _cav([p.xyz], alpha, k);
      var s   = _scr(s2d, pf)[0];
      c += '<circle cx="'+s[0].toFixed(1)+'" cy="'+s[1].toFixed(1)+'" r="2.2" fill="#dc2626"/>';
      if (p.label) c += '<text x="'+(s[0]+(p.dx||4)).toFixed(1)+'" y="'+(s[1]+(p.dy||-4)).toFixed(1)+'" font-family="serif" font-size="12" font-style="italic" fill="#dc2626">'+p.label+'</text>';
    });
  }
  return _svgWrap(_W3, _H3, c);
}

// ─── Helpers: longueurs réelles + points remarquables ────────────────────
function _dist3(a, b) {
  var dx=a[0]-b[0], dy=a[1]-b[1], dz=a[2]-b[2];
  return Math.sqrt(dx*dx+dy*dy+dz*dz);
}
function _fmtLen3(d, unit) {
  var r = Math.round(d*100)/100;
  return (r % 1 === 0 ? r.toFixed(0) : String(r)) + (unit ? ' '+unit : '');
}
function _mid3(a, b) { return [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2]; }
function _centroid3(pts) {
  var n = pts.length, x=0,y=0,z=0;
  pts.forEach(function(p){ x+=p[0]; y+=p[1]; z+=p[2]; });
  return [x/n, y/n, z/n];
}
function _3B(id) { var el = document.getElementById(id); return !!(el && el.checked); }

// Points remarquables génériques : milieux des arêtes, centres des faces, centre/pied de hauteur
// idPrefix ex: 'g3pave' → cherche g3pave-rem-mid / g3pave-rem-face / g3pave-rem-center
function _g3Remarkable(v, edges, faces, centerPts, idPrefix) {
  var pts = [];
  if (_3B(idPrefix+'-rem-mid')) {
    edges.forEach(function(e, idx) {
      pts.push({ xyz: _mid3(v[e[0]], v[e[1]]), label: 'I'+(idx+1), dx:4, dy:-4 });
    });
  }
  if (faces && faces.length && _3B(idPrefix+'-rem-face')) {
    faces.forEach(function(fc, idx) {
      pts.push({ xyz: _centroid3(fc.map(function(i){ return v[i]; })), label: 'G'+(idx+1), dx:4, dy:-4 });
    });
  }
  if (centerPts && centerPts.length && _3B(idPrefix+'-rem-center')) {
    centerPts.forEach(function(cp) {
      pts.push({ xyz: cp.xyz, label: cp.label, dx:4, dy:-4 });
    });
  }
  return pts;
}
function _g3Lengths(idPrefix, edges) {
  return { on: _3B(idPrefix+'-len'), unit: _3B(idPrefix+'-len-cm') ? 'cm' : '', edges: edges };
}

// Render curves (cone/cylinder/sphere): same pipeline but returns screen + fit for manual drawing
function _renderSetup(verts3d) {
  var alpha = _3N('g3-angle', 45) * Math.PI / 180;
  var k     = _3N('g3-k', 50) / 100;
  var pts2d = _cav(verts3d, alpha, k);
  var f     = _fit(pts2d, _W3, _H3, _PAD3);
  return { alpha: alpha, k: k, pts2d: pts2d, f: f, sc: _scr(pts2d, f) };
}

// Polyline string from array of screen points
function _poly(pts) {
  return pts.map(function(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');
}

// ─── PAVé DROIT ──────────────────────────────────────────────────────────
// A(0,0,0) B(L,0,0) C(L,H,0) D(0,H,0) front  / E(0,0,P) F(L,0,P) G(L,H,P) H(0,H,P) back
function _g3Pave() {
  var L = Math.max(0.1, _3N('g3pave-l', 4));
  var H = Math.max(0.1, _3N('g3pave-h', 3));
  var P = Math.max(0.1, _3N('g3pave-p', 3));
  var v = [[0,0,0],[L,0,0],[L,H,0],[0,H,0],[0,0,P],[L,0,P],[L,H,P],[0,H,P]];
  //         0       1       2       3       4       5       6       7
  var sol = [[0,1],[1,2],[2,3],[3,0],[1,5],[2,6],[3,7],[5,6],[6,7]];
  var dsh = [[0,4],[4,5],[4,7]]; // AE, EF, EH hidden
  var def = ['A','B','C','D','E','F','G','H'];
  var nm  = def.map(function(l){ return _3S('g3pave-lbl-'+l, l); });
  var off = [[-14,5],[5,5],[5,-11],[-14,-11],[-14,5],[5,5],[5,-11],[-14,-11]];
  var lbl = nm.map(function(t,i){ return [i, off[i][0], off[i][1], t]; });
  var faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];
  var center = [{ xyz:[L/2,H/2,P/2], label:'O' }];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, center, 'g3pave');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3pave', sol.concat(dsh)), points: pts });
}

// ─── PRISME DROIT À BASE RÉGULIÈRE ───────────────────────────────────────
function _g3Prisme() {
  var n   = Math.max(3, Math.min(8, Math.round(_3N('g3pri-n', 5))));
  var R   = Math.max(0.1, _3N('g3pri-r', 2));
  var H   = Math.max(0.1, _3N('g3pri-h', 3));
  var rot = _3N('g3pri-rot', 0) * Math.PI / 180; // angle de rotation
  var v = [];
  for (var i = 0; i < n; i++) {
    var a = 2*Math.PI*i/n + rot;
    v.push([R*Math.cos(a), 0, R*Math.sin(a)]);  // bottom 2*i
    v.push([R*Math.cos(a), H, R*Math.sin(a)]);  // top    2*i+1
  }
  var sol = [], dsh = [];
  var letters = 'ABCDEFGH', lbl = [], names = [], bottomIdx = [], topIdx = [], faces = [];
  for (var ii = 0; ii < n; ii++) names.push(_3S('g3pri-lbl-'+letters[ii], letters[ii]));
  for (var j = 0; j < n; j++) {
    var jb = 2*j, jt = 2*j+1, nb = 2*((j+1)%n), nt = 2*((j+1)%n)+1;
    sol.push([jt, nt]);
    if (v[jb][2] < 0) { sol.push([jb, jt]); sol.push([jb, nb]); }
    else               { dsh.push([jb, jt]); dsh.push([jb, nb]); }
    lbl.push([jb, 4, 6, names[j]]);
    lbl.push([jt, 4,-10, names[j]+"'"]);
    bottomIdx.push(jb); topIdx.push(jt);
    faces.push([jb, nb, nt, jt]);
  }
  faces.push(bottomIdx, topIdx);
  var center = [{ xyz:[0,0,0], label:'O' }, { xyz:[0,H,0], label:"O'" }];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, center, 'g3pri');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3pri', sol.concat(dsh)), points: pts });
}

// ─── PRISME DROIT À BASE TRIANGULAIRE (triangle équilatéral) ─────────────
function _g3PrismeTri() {
  var a  = Math.max(0.1, _3N('g3ptri-a', 3));
  var H  = Math.max(0.1, _3N('g3ptri-h', 3));
  var h3 = a * Math.sqrt(3) / 2;
  //  0=A  1=B  2=C  bottom (z = 0, h3)   3=A' 4=B' 5=C' top
  var v = [
    [0, 0, 0], [a, 0, 0], [a/2, 0, h3],
    [0, H, 0], [a, H, 0], [a/2, H, h3]
  ];
  var sol = [[0,1],[0,3],[1,4],[3,4],[4,5],[3,5]];
  var dsh = [[0,2],[1,2],[2,5]]; // AC, BC hidden bottom back ; CC' hidden vertical
  var def = ['A','B','C'];
  var nm  = def.map(function(l){ return _3S('g3ptri-lbl-'+l, l); });
  var lbl = [[0,-14,5,nm[0]],[1,5,5,nm[1]],[2,4,10,nm[2]],
             [3,-14,-11,nm[0]+"'"],[4,5,-11,nm[1]+"'"],[5,4,-11,nm[2]+"'"]];
  var faces = [[0,1,2],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]];
  var center = [{ xyz:[a/2,0,h3/3], label:'O' }, { xyz:[a/2,H,h3/3], label:"O'" }];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, center, 'g3ptri');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3ptri', sol.concat(dsh)), points: pts });
}

// ─── PYRAMIDE RÉGULIÈRE À BASE CARRÉE ────────────────────────────────────
function _g3PyrCarree() {
  var L = Math.max(0.1, _3N('g3pyrc-l', 3));
  var H = Math.max(0.1, _3N('g3pyrc-h', 4));
  // Base ABCD in XZ plane at y=0; apex S above center
  var v = [
    [0, 0, 0], [L, 0, 0], [L, 0, L], [0, 0, L], // A B C D (0-3)
    [L/2, H, L/2]                                  // S (4)
  ];
  var sol = [[0,1],[1,2],[2,4],[1,4],[0,4]];
  var dsh = [[0,3],[3,4],[2,3]]; // AD, SD, DC hidden (D = sommet caché)
  var def = ['A','B','C','D','S'];
  var nm  = def.map(function(l){ return _3S('g3pyrc-lbl-'+l, l); });
  var off = [[-13,5],[5,5],[6,8],[-13,8],[0,-13]];
  var lbl = nm.map(function(t,i){ return [i, off[i][0], off[i][1], t]; });
  var faces = [[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]];
  var center = [{ xyz:[L/2,0,L/2], label:'O' }];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, center, 'g3pyrc');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3pyrc', sol.concat(dsh)), points: pts });
}

// ─── PYRAMIDE À BASE TRIANGULAIRE ────────────────────────────────────────
function _g3PyrTri() {
  var a  = Math.max(0.1, _3N('g3pyrt-a', 3));
  var H  = Math.max(0.1, _3N('g3pyrt-h', 4));
  var h3 = a * Math.sqrt(3) / 2;
  // A B C in XZ plane; S above centroid
  var v = [
    [0, 0, 0], [a, 0, 0], [a/2, 0, h3],
    [a/2, H, h3/3]
  ];
  var sol = [[0,1],[0,3],[1,3]];
  var dsh = [[0,2],[1,2],[2,3]]; // AC, BC, SC hidden (C = sommet caché)
  var def = ['A','B','C','S'];
  var nm  = def.map(function(l){ return _3S('g3pyrt-lbl-'+l, l); });
  var off = [[-13,5],[6,5],[4,10],[0,-13]];
  var lbl = nm.map(function(t,i){ return [i, off[i][0], off[i][1], t]; });
  var faces = [[0,1,2],[0,1,3],[1,2,3],[2,0,3]];
  var center = [{ xyz:[a/2,0,h3/3], label:'O' }];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, center, 'g3pyrt');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3pyrt', sol.concat(dsh)), points: pts });
}

// ─── TRONC DE PYRAMIDE À BASES RECTANGULAIRES ────────────────────────────
// Face du dessous : L × P ; face du dessus : pct% × dessous ; hauteur H
function _g3Tronc() {
  var L   = Math.max(0.1, _3N('g3tronc-L', 5));
  var P   = Math.max(0.1, _3N('g3tronc-P', 5));
  var pct = Math.max(10, Math.min(99, _3N('g3tronc-pct', 50))) / 100;
  var H   = Math.max(0.1, _3N('g3tronc-h', 5));
  var l = L * pct, p = P * pct;
  var dx = (L-l)/2, dz = (P-p)/2;
  var v = [
    [0,0,0],[L,0,0],[L,0,P],[0,0,P],                         // A B C D (0-3)
    [dx,H,dz],[dx+l,H,dz],[dx+l,H,dz+p],[dx,H,dz+p]         // E F G H (4-7)
  ];
  var sol = [[0,1],[1,2],[4,5],[5,6],[6,7],[4,7],[0,4],[1,5],[2,6]];
  var dsh = [[0,3],[2,3],[3,7]]; // AD, CD, DH hidden (D = sommet caché)
  var def = ['A','B','C','D','E','F','G','H'];
  var nm  = def.map(function(l){ return _3S('g3tronc-lbl-'+l, l); });
  var off = [[-13,5],[6,5],[6,8],[-13,8],[-13,-10],[6,-10],[6,-10],[-13,-10]];
  var lbl = nm.map(function(t,i){ return [i, off[i][0], off[i][1], t]; });
  var faces = [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
  var center = [{ xyz:[L/2,0,P/2], label:'O' }, { xyz:[L/2,H,P/2], label:"O'" }];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, center, 'g3tronc');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3tronc', sol.concat(dsh)), points: pts });
}

// ─── Helpers pour solides de révolution (ellipse = b=r·sin(angIncl)) ─────

// Arc SVG d'une demi-ellipse : large-arc=0 → arc mineur (sens horaire = bas de l'ellipse)
function _ellArcF(cx, cy, rx, ry) { // front (bas) = solid
  return '<path d="M '+(cx-rx).toFixed(1)+','+cy.toFixed(1)+
         ' A '+rx.toFixed(1)+','+ry.toFixed(1)+' 0 0 0 '+(cx+rx).toFixed(1)+','+cy.toFixed(1)+'" '+_STR+'/>';
}
function _ellArcB(cx, cy, rx, ry) { // back (haut) = dashed
  return '<path d="M '+(cx-rx).toFixed(1)+','+cy.toFixed(1)+
         ' A '+rx.toFixed(1)+','+ry.toFixed(1)+' 0 0 1 '+(cx+rx).toFixed(1)+','+cy.toFixed(1)+'" '+_DSH+'/>';
}

// ─── CÔNE DE RÉVOLUTION ───────────────────────────────────────────────────
function _g3Cone() {
  var R    = Math.max(0.1, _3N('g3cone-r', 2));
  var H    = Math.max(0.1, _3N('g3cone-h', 4));
  var incl = Math.max(5, Math.min(45, _3N('g3cone-incl', 10)));
  var W = _W3, Hv = _H3, PAD = _PAD3;
  var sa = Math.sin(incl * Math.PI / 180);
  // scale: total height = H + ry (from apex to bottom of base ellipse)
  var s  = Math.min((W-2*PAD)/(2*R), (Hv-2*PAD)/(H + R*sa));
  var rx = R*s, ry = R*sa*s;
  var cx = W/2;
  var yApex = (Hv - (H*s + ry)) / 2;
  var cyBot = yApex + H*s;

  var c = '';
  c += _ellArcF(cx, cyBot, rx, ry); // front arc base solid
  c += _ellArcB(cx, cyBot, rx, ry); // back arc base dashed
  // tangentes apex → extrémités gauche/droite de la base
  c += '<line x1="'+cx.toFixed(1)+'" y1="'+yApex.toFixed(1)+'" x2="'+(cx-rx).toFixed(1)+'" y2="'+cyBot.toFixed(1)+'" '+_STR+'/>';
  c += '<line x1="'+cx.toFixed(1)+'" y1="'+yApex.toFixed(1)+'" x2="'+(cx+rx).toFixed(1)+'" y2="'+cyBot.toFixed(1)+'" '+_STR+'/>';
  // labels
  c += _svgLbl(cx, yApex, 5, -4, 'S');
  c += '<circle cx="'+cx.toFixed(1)+'" cy="'+cyBot.toFixed(1)+'" r="2" fill="#1e293b"/>';
  c += '<text x="'+(cx+4).toFixed(1)+'" y="'+(cyBot+14).toFixed(1)+'" font-family="serif" font-size="12" fill="#1e293b">O</text>';
  return _svgWrap(W, Hv, c);
}

// ─── CYLINDRE DROIT ───────────────────────────────────────────────────────
function _g3Cylindre() {
  var R    = Math.max(0.1, _3N('g3cyl-r', 2));
  var H    = Math.max(0.1, _3N('g3cyl-h', 4));
  var incl = Math.max(5, Math.min(45, _3N('g3cyl-incl', 10)));
  var W = _W3, Hv = _H3, PAD = _PAD3;
  var sa = Math.sin(incl * Math.PI / 180);
  var s  = Math.min((W-2*PAD)/(2*R), (Hv-2*PAD)/(H + 2*R*sa));
  var rx = R*s, ry = R*sa*s;
  var cx = W/2;
  var figH = H*s + 2*ry;
  var cyTop = (Hv - figH) / 2 + ry;  // centre ellipse haute
  var cyBot = cyTop + H*s;             // centre ellipse basse

  var c = '';
  // ellipse basse : front solid, back dashed
  c += _ellArcF(cx, cyBot, rx, ry);
  c += _ellArcB(cx, cyBot, rx, ry);
  // ellipse haute : complète solid
  c += '<ellipse cx="'+cx.toFixed(1)+'" cy="'+cyTop.toFixed(1)+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.8"/>';
  // arêtes latérales verticales
  c += '<line x1="'+(cx-rx).toFixed(1)+'" y1="'+cyBot.toFixed(1)+'" x2="'+(cx-rx).toFixed(1)+'" y2="'+cyTop.toFixed(1)+'" '+_STR+'/>';
  c += '<line x1="'+(cx+rx).toFixed(1)+'" y1="'+cyBot.toFixed(1)+'" x2="'+(cx+rx).toFixed(1)+'" y2="'+cyTop.toFixed(1)+'" '+_STR+'/>';
  return _svgWrap(W, Hv, c);
}

// ─── SPHÈRE ───────────────────────────────────────────────────────────────
function _g3Sphere() {
  var R    = Math.max(0.1, _3N('g3sph-r', 2));
  var incl = Math.max(5, Math.min(45, _3N('g3sph-incl', 10)));
  var W = _W3, Hv = _H3, PAD = _PAD3;
  var sa = Math.sin(incl * Math.PI / 180);
  var s  = Math.min((W-2*PAD)/(2*R), (Hv-2*PAD)/(2*R));
  var rS = R*s;  // rayon écran
  var rx = rS, ry = R*sa*s; // demi-axes ellipse équateur
  var cx = W/2, cy = Hv/2;

  var c = '';
  // cercle silhouette
  c += '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+rS.toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.8"/>';
  // équateur : front (bas) solid, back (haut) dashed
  c += _ellArcF(cx, cy, rx, ry);
  c += _ellArcB(cx, cy, rx, ry);
  // centre O
  c += '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="2.5" fill="#1e293b"/>';
  c += '<text x="'+(cx+5).toFixed(1)+'" y="'+(cy+5).toFixed(1)+'" font-family="serif" font-size="12" font-weight="bold" fill="#1e293b">O</text>';
  // rayon r
  var rpx = cx + rS, rpy = cy;
  c += '<line x1="'+cx.toFixed(1)+'" y1="'+cy.toFixed(1)+'" x2="'+rpx.toFixed(1)+'" y2="'+rpy.toFixed(1)+'" stroke="#1e293b" stroke-width="1.2"/>';
  c += '<text x="'+((cx+rpx)/2).toFixed(1)+'" y="'+(cy-5).toFixed(1)+'" font-family="serif" font-size="12" font-style="italic" fill="#475569">r</text>';
  return _svgWrap(W, Hv, c);
}

// ─── COIN DE PAVé DROIT À BASE RECTANGULAIRE ─────────────────────────────
// Pyramid: base = rectangle ABCD in XZ plane (y=0); apex S = (0,H,0)
function _g3CoinRect() {
  var L = Math.max(0.1, _3N('g3cr-l', 4));
  var H = Math.max(0.1, _3N('g3cr-h', 3));
  var P = Math.max(0.1, _3N('g3cr-p', 3));
  var v = [
    [0,0,0],[L,0,0],[L,0,P],[0,0,P], // A B C D (0-3) base
    [0,H,0]                           // S (4) apex
  ];
  var sol = [[0,1],[1,2],[0,4],[1,4],[2,4]];
  var dsh = [[0,3],[2,3],[3,4]]; // AD, CD, SD hidden
  var def = ['A','B','C','D','S'];
  var nm  = def.map(function(l){ return _3S('g3cr-lbl-'+l, l); });
  var off = [[-13,5],[6,5],[6,8],[-13,8],[-14,-10]];
  var lbl = nm.map(function(t,i){ return [i, off[i][0], off[i][1], t]; });
  var faces = [[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, null, 'g3cr');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3cr', sol.concat(dsh)), points: pts });
}

// ─── COIN DE PAVé DROIT À BASE TRIANGULAIRE ──────────────────────────────
// Tetrahedron: base = triangle ABC; apex S = (0,H,0)
function _g3CoinTri() {
  var L = Math.max(0.1, _3N('g3ct-l', 4));
  var H = Math.max(0.1, _3N('g3ct-h', 3));
  var P = Math.max(0.1, _3N('g3ct-p', 3));
  var v = [
    [0,0,0],[L,0,0],[L,0,P], // A B C (0-2) base triangle
    [0,H,0]                   // S (3) apex
  ];
  var sol = [[0,1],[1,2],[0,3],[1,3],[2,3]];
  var dsh = [[0,2]]; // AC hidden
  var def = ['A','B','C','S'];
  var nm  = def.map(function(l){ return _3S('g3ct-lbl-'+l, l); });
  var off = [[-13,5],[6,5],[6,8],[-14,-10]];
  var lbl = nm.map(function(t,i){ return [i, off[i][0], off[i][1], t]; });
  var faces = [[0,1,2],[0,1,3],[1,2,3],[2,0,3]];
  var pts = _g3Remarkable(v, sol.concat(dsh), faces, null, 'g3ct');
  return _render(v, sol, dsh, lbl, { lengths: _g3Lengths('g3ct', sol.concat(dsh)), points: pts });
}
