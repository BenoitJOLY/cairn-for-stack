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

// ── GEO2D — Générateur de figures géométriques 2D ─────────────────────

let _geo2dShape = 'triangle';

function openGeo2dModal() {
  _geo2dSelectShape('triangle');
  document.getElementById('geo2d-preview').innerHTML = '';
  const modal = document.getElementById('geo2dModal');
  modal.style.display = 'flex';
  FocusTrap.trap(modal, closeGeo2dModal);
  setTimeout(_geo2dPreview, 50);
}

function closeGeo2dModal() {
  document.getElementById('geo2dModal').style.display = 'none';
  FocusTrap.release();
}

function _geo2dSelectShape(shape) {
  _geo2dShape = shape;
  document.querySelectorAll('.geo2d-shape-btn').forEach(function(b) {
    b.classList.toggle('geo2d-sel', b.dataset.shape === shape);
  });
  document.querySelectorAll('.geo2d-params').forEach(function(p) {
    p.style.display = p.id === 'geo2d-params-' + shape ? '' : 'none';
  });
  _geo2dPreview();
}

function _geo2dPreview() {
  try {
    var svg = _geo2dGenerate();
    document.getElementById('geo2d-preview').innerHTML = svg;
  } catch(e) {
    document.getElementById('geo2d-preview').innerHTML = '<p style="color:#ef4444;font-size:.82rem;padding:10px;">Paramètres invalides</p>';
  }
}

function geo2dInsert() {
  try {
    var svg = _geo2dGenerate();
    var uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    var html = '<img src="' + uri + '" style="max-width:100%;height:auto;display:inline-block;margin:4px;" alt="figure géométrique 2D">';
    closeGeo2dModal();
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

function _geo2dN(id, def) {
  var el = document.getElementById(id);
  return el ? (parseFloat(el.value) || def) : def;
}
function _geo2dS(id, def) {
  var el = document.getElementById(id);
  return el ? el.value : (def || '');
}
function _geo2dB(id) {
  var el = document.getElementById(id);
  return el ? el.checked : false;
}

function _geo2dGenerate() {
  switch (_geo2dShape) {
    case 'triangle':        return _g2Triangle();
    case 'carre':           return _g2Carre();
    case 'rectangle':       return _g2Rectangle();
    case 'losange':         return _g2Losange();
    case 'parallelogramme': return _g2Parallelogramme();
    case 'trapeze':         return _g2Trapeze();
    case 'cercle':          return _g2Cercle();
    case 'polygone':        return _g2Polygone();
    case 'camembert':       return _g2Camembert();
    case 'fraction':        return _g2Fraction();
    case 'thales':          return _g2Thales();
    case 'segment':         return _g2Segment();
    default: return '';
  }
}

// ─── SVG helpers ─────────────────────────────────────────────────────

function _g2Svg(w, h, content) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h
    + '" viewBox="0 0 ' + w + ' ' + h + '" font-family="serif" font-size="14">'
    + content + '</svg>';
}

function _g2Lbl(x, y, txt, bold) {
  return '<text x="' + x + '" y="' + y
    + '" text-anchor="middle" dominant-baseline="middle" font-size="13"'
    + (bold ? ' font-weight="bold"' : '') + ' fill="#1e293b">' + txt + '</text>';
}

function _g2Path(pts, fill, sw) {
  var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + ' Z';
  return '<path d="' + d + '" fill="' + (fill||'none') + '" stroke="#1e293b" stroke-width="' + (sw||1.8)
    + '" stroke-linejoin="round" stroke-linecap="round"/>';
}

function _g2Angle90(cx, cy, ux, uy) {
  var s = 9, vx = -uy, vy = ux;
  return '<path d="M' + (cx+ux*s).toFixed(1) + ' ' + (cy+uy*s).toFixed(1)
    + ' L' + (cx+ux*s+vx*s).toFixed(1) + ' ' + (cy+uy*s+vy*s).toFixed(1)
    + ' L' + (cx+vx*s).toFixed(1) + ' ' + (cy+vy*s).toFixed(1)
    + '" fill="none" stroke="#1e293b" stroke-width="1.2"/>';
}

// ─── TRIANGLE ────────────────────────────────────────────────────────

// Helpers de géométrie triangle (scope local via IIFE-style, but plain fns OK here)
function _g2TriFoot(P, A, B) { // pied de perpendiculaire de P sur droite AB
  var dx=B[0]-A[0], dy=B[1]-A[1], d2=dx*dx+dy*dy||1;
  var t=((P[0]-A[0])*dx+(P[1]-A[1])*dy)/d2;
  return [A[0]+t*dx, A[1]+t*dy];
}
function _g2TriMid(A, B) { return [(A[0]+B[0])/2, (A[1]+B[1])/2]; }
function _g2TriDir(A, B) { return [B[0]-A[0], B[1]-A[1]]; }
function _g2TriPerp(d) { return [-d[1], d[0]]; }
function _g2TriUnit(A, B) {
  var dx=B[0]-A[0], dy=B[1]-A[1], l=Math.hypot(dx,dy)||1;
  return [dx/l, dy/l];
}
// Tracé d'une droite complète à travers P avec direction d (clippée par overflow)
function _g2TriLine(P, d, col, sw, dsh) {
  var far=2500, l=Math.hypot(d[0],d[1])||1, ux=d[0]/l, uy=d[1]/l;
  return '<line x1="'+(P[0]-ux*far).toFixed(1)+'" y1="'+(P[1]-uy*far).toFixed(1)+
         '" x2="'+(P[0]+ux*far).toFixed(1)+'" y2="'+(P[1]+uy*far).toFixed(1)+
         '" stroke="'+(col||'#94a3b8')+'" stroke-width="'+(sw||1.2)+'"'+
         (dsh?' stroke-dasharray="'+dsh+'"':'')+' fill="none"/>';
}
// Segment A→B
function _g2TriSeg(A, B, col, sw, dsh) {
  return '<line x1="'+A[0].toFixed(1)+'" y1="'+A[1].toFixed(1)+
         '" x2="'+B[0].toFixed(1)+'" y2="'+B[1].toFixed(1)+
         '" stroke="'+(col||'#94a3b8')+'" stroke-width="'+(sw||1.2)+'"'+
         (dsh?' stroke-dasharray="'+dsh+'"':'')+' fill="none"/>';
}
// Traits de codage longueurs égales (n=1,2,3 traits perpendiculaires au côté)
function _g2TriTicks(P, Q, n) {
  if (!n) return '';
  var mx=(P[0]+Q[0])/2, my=(P[1]+Q[1])/2;
  var dx=Q[0]-P[0], dy=Q[1]-P[1], len=Math.hypot(dx,dy)||1;
  var ux=dx/len, uy=dy/len, px=-uy, py=ux, H=6, sp=5, r='';
  for (var i=0; i<n; i++) {
    var off=(i-(n-1)/2)*sp, cx=mx+ux*off, cy=my+uy*off;
    r+='<line x1="'+(cx-px*H).toFixed(1)+'" y1="'+(cy-py*H).toFixed(1)+
        '" x2="'+(cx+px*H).toFixed(1)+'" y2="'+(cy+py*H).toFixed(1)+
        '" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>';
  }
  return r;
}
// Arcs de codage angles égaux (n=1 un arc, n=2 double arc)
function _g2TriArcMark(V, P, Q, n) {
  if (!n) return '';
  var r='';
  var u1=_g2TriUnit(V,P), u2=_g2TriUnit(V,Q);
  var cross=u1[0]*u2[1]-u1[1]*u2[0], sweep=cross<0?0:1;
  for (var i=0; i<n; i++) {
    var rad=11+i*7;
    var p1=[V[0]+u1[0]*rad, V[1]+u1[1]*rad];
    var p2=[V[0]+u2[0]*rad, V[1]+u2[1]*rad];
    r+='<path d="M '+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+
        ' A '+rad+' '+rad+' 0 0 '+sweep+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1)+
        '" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>';
  }
  return r;
}

// Onglets triangle
function _g2TriTab(tab) {
  ['mesures','droites','cercles','points'].forEach(function(t) {
    var panel = document.getElementById('g2tri-panel-'+t);
    var btn   = document.getElementById('g2tri-tab-'+t);
    if (panel) panel.style.display = (t===tab) ? '' : 'none';
    if (btn)   btn.classList.toggle('g2tri-tab-sel', t===tab);
  });
}

// Sélection du type de construction (boutons)
function _g2TriSetType(type) {
  var inp = document.getElementById('g2tri-type');
  if (inp) inp.value = type;
  document.querySelectorAll('.g2tri-type-btn').forEach(function(b) {
    b.classList.toggle('g2tri-type-sel', b.getAttribute('data-type') === type);
  });
  _g2TriTypeChange();
}

// Libellés dynamiques selon le type
function _g2TriTypeChange() {
  var type = _geo2dS('g2tri-type', 'sss');
  var la = document.getElementById('g2tri-la');
  var lb = document.getElementById('g2tri-lb');
  if (la) la.textContent = type==='sss' ? 'a = BC' : 'Angle A (°)';
  if (lb) lb.textContent = type==='aas' ? 'Angle B (°)' : 'b = AC';
  _geo2dPreview();
}

function _g2Triangle() {
  var W = 320, H = 280, PAD = 40;
  var type = _geo2dS('g2tri-type', 'sss');
  var v1 = Math.max(0.01, _geo2dN('g2tri-a', 4));
  var v2 = Math.max(0.01, _geo2dN('g2tri-b', 5));
  var c  = Math.max(0.01, _geo2dN('g2tri-c', 6));

  // ── Calcul des côtés a, b selon le type ──
  var a, b;
  if (type === 'sas') {
    // v1 = angle A (°), v2 = b=AC, c = AB
    var angA = v1 * Math.PI / 180;
    a = Math.sqrt(v2*v2 + c*c - 2*v2*c*Math.cos(angA));
    b = v2;
  } else if (type === 'aas') {
    // v1 = angle A (°), v2 = angle B (°), c = AB
    var aA = v1*Math.PI/180, aB = v2*Math.PI/180, aC = Math.PI-aA-aB;
    if (aC <= 0.001) return _g2Svg(W,H,'<text x="'+W/2+'" y="'+H/2+'" text-anchor="middle" fill="#ef4444">Angles invalides</text>');
    a = c*Math.sin(aA)/Math.sin(aC);
    b = c*Math.sin(aB)/Math.sin(aC);
  } else {
    a = v1; b = v2; // SSS
  }

  if (a+b <= c || a+c <= b || b+c <= a) {
    return _g2Svg(W,H,'<text x="'+W/2+'" y="'+H/2+'" text-anchor="middle" fill="#ef4444">Inégalité triangle non vérifiée</text>');
  }

  // ── Sommets en coordonnées mathématiques ──
  var cosA = (b*b+c*c-a*a)/(2*b*c);
  var sinA = Math.sqrt(Math.max(0,1-cosA*cosA));
  var Bx0=c, Cx0=b*cosA, Cy0=b*sinA;

  var xMin=Math.min(0,Bx0,Cx0), xMax=Math.max(0,Bx0,Cx0);
  var sc = Math.min((W-2*PAD)/(xMax-xMin||1), (H-2*PAD)/(Cy0||1));
  function p(x0,y0){ return [PAD+(x0-xMin)*sc, H-PAD-y0*sc]; }
  var A=p(0,0), B=p(Bx0,0), C=p(Cx0,Cy0);

  // Longueurs écran (pour incercle)
  var ascr=Math.hypot(B[0]-C[0],B[1]-C[1]);
  var bscr=Math.hypot(A[0]-C[0],A[1]-C[1]);
  var cscr=Math.hypot(A[0]-B[0],A[1]-B[1]);

  var cMed='#2563eb', cHaut='#dc2626', cMdit='#16a34a', cBiss='#9333ea';
  var cPar='#ea580c', cPerp='#0891b2', cCirc='#7c3aed', cInsc='#0f766e';

  var content='';

  // ── Médianes ──
  if (_geo2dB('g2tri-ma')){ content+=_g2TriSeg(A,_g2TriMid(B,C),cMed,1.3,'6,3'); }
  if (_geo2dB('g2tri-mb')){ content+=_g2TriSeg(B,_g2TriMid(A,C),cMed,1.3,'6,3'); }
  if (_geo2dB('g2tri-mc')){ content+=_g2TriSeg(C,_g2TriMid(A,B),cMed,1.3,'6,3'); }

  // ── Hauteurs ──
  if (_geo2dB('g2tri-ha')){ content+=_g2TriSeg(A,_g2TriFoot(A,B,C),cHaut,1.3); }
  if (_geo2dB('g2tri-hb')){ content+=_g2TriSeg(B,_g2TriFoot(B,A,C),cHaut,1.3); }
  if (_geo2dB('g2tri-hc')){ content+=_g2TriSeg(C,_g2TriFoot(C,A,B),cHaut,1.3); }

  // ── Médiatrices ──
  if (_geo2dB('g2tri-mAB')){ content+=_g2TriLine(_g2TriMid(A,B),_g2TriPerp(_g2TriDir(A,B)),cMdit,1.2,'5,3'); }
  if (_geo2dB('g2tri-mBC')){ content+=_g2TriLine(_g2TriMid(B,C),_g2TriPerp(_g2TriDir(B,C)),cMdit,1.2,'5,3'); }
  if (_geo2dB('g2tri-mAC')){ content+=_g2TriLine(_g2TriMid(A,C),_g2TriPerp(_g2TriDir(A,C)),cMdit,1.2,'5,3'); }

  // ── Bissectrices ──
  function bisDir(V,P,Q){ var u1=_g2TriUnit(V,P),u2=_g2TriUnit(V,Q); return [u1[0]+u2[0],u1[1]+u2[1]]; }
  if (_geo2dB('g2tri-bA')){ content+=_g2TriLine(A,bisDir(A,B,C),cBiss,1.2,'3,3'); }
  if (_geo2dB('g2tri-bB')){ content+=_g2TriLine(B,bisDir(B,A,C),cBiss,1.2,'3,3'); }
  if (_geo2dB('g2tri-bC')){ content+=_g2TriLine(C,bisDir(C,A,B),cBiss,1.2,'3,3'); }

  // ── Parallèles ──
  if (_geo2dB('g2tri-pABC')){ content+=_g2TriLine(C,_g2TriDir(A,B),cPar,1.2,'8,4'); }
  if (_geo2dB('g2tri-pBCA')){ content+=_g2TriLine(A,_g2TriDir(B,C),cPar,1.2,'8,4'); }
  if (_geo2dB('g2tri-pACB')){ content+=_g2TriLine(B,_g2TriDir(A,C),cPar,1.2,'8,4'); }

  // ── Perpendiculaires ──
  if (_geo2dB('g2tri-perpABC')){ content+=_g2TriLine(C,_g2TriPerp(_g2TriDir(A,B)),cPerp,1.2,'2,3'); }
  if (_geo2dB('g2tri-perpBCA')){ content+=_g2TriLine(A,_g2TriPerp(_g2TriDir(B,C)),cPerp,1.2,'2,3'); }
  if (_geo2dB('g2tri-perpACB')){ content+=_g2TriLine(B,_g2TriPerp(_g2TriDir(A,C)),cPerp,1.2,'2,3'); }

  // ── Cercle circonscrit ──
  if (_geo2dB('g2tri-cc')) {
    var mAB=_g2TriMid(A,B), mAC=_g2TriMid(A,C);
    var pAB=_g2TriPerp(_g2TriDir(A,B)), pAC=_g2TriPerp(_g2TriDir(A,C));
    var det=pAB[0]*(-pAC[1])-pAB[1]*(-pAC[0]);
    if (Math.abs(det)>0.001) {
      var dx2=mAC[0]-mAB[0], dy2=mAC[1]-mAB[1];
      var t=(dx2*(-pAC[1])-dy2*(-pAC[0]))/det;
      var Oc=[mAB[0]+t*pAB[0], mAB[1]+t*pAB[1]];
      var Rc=Math.hypot(A[0]-Oc[0],A[1]-Oc[1]);
      content+='<circle cx="'+Oc[0].toFixed(1)+'" cy="'+Oc[1].toFixed(1)+'" r="'+Rc.toFixed(1)+'" fill="none" stroke="'+cCirc+'" stroke-width="1.3" stroke-dasharray="5,3"/>';
      if (_geo2dB('g2tri-cc-ctr')) {
        content+='<circle cx="'+Oc[0].toFixed(1)+'" cy="'+Oc[1].toFixed(1)+'" r="2.5" fill="'+cCirc+'"/>';
        content+=_g2Lbl(Oc[0]+8, Oc[1], 'O', false);
      }
    }
  }

  // ── Cercle inscrit ──
  if (_geo2dB('g2tri-ci')) {
    var perim=ascr+bscr+cscr;
    var Oi=[(ascr*A[0]+bscr*B[0]+cscr*C[0])/perim, (ascr*A[1]+bscr*B[1]+cscr*C[1])/perim];
    var area2=Math.abs((B[0]-A[0])*(C[1]-A[1])-(C[0]-A[0])*(B[1]-A[1]))/2;
    var Ri=area2/(perim/2);
    content+='<circle cx="'+Oi[0].toFixed(1)+'" cy="'+Oi[1].toFixed(1)+'" r="'+Ri.toFixed(1)+'" fill="none" stroke="'+cInsc+'" stroke-width="1.3" stroke-dasharray="4,3"/>';
    if (_geo2dB('g2tri-ci-ctr')) {
      content+='<circle cx="'+Oi[0].toFixed(1)+'" cy="'+Oi[1].toFixed(1)+'" r="2.5" fill="'+cInsc+'"/>';
      content+=_g2Lbl(Oi[0]+8, Oi[1], 'I', false);
    }
  }

  // ── Triangle (par-dessus les lignes) ──
  content += _g2Path([A,B,C], '#f0f9ff');

  // ── Points I, J, K sur les côtés ──
  // I sur [BA], J sur [BC], K sur [AC]
  var pts3 = {};
  if (_geo2dB('g2tri-Ishow')) {
    var ki = _geo2dN('g2tri-Ik', 0.5);
    pts3.I = [B[0]+ki*(A[0]-B[0]), B[1]+ki*(A[1]-B[1])];
    content+='<circle cx="'+pts3.I[0].toFixed(1)+'" cy="'+pts3.I[1].toFixed(1)+'" r="3" fill="#1e293b"/>';
    content+=_g2Lbl(pts3.I[0]-11, pts3.I[1]-2, 'I', false);
  }
  if (_geo2dB('g2tri-Jshow')) {
    var kj = _geo2dN('g2tri-Jk', 0.5);
    pts3.J = [B[0]+kj*(C[0]-B[0]), B[1]+kj*(C[1]-B[1])];
    content+='<circle cx="'+pts3.J[0].toFixed(1)+'" cy="'+pts3.J[1].toFixed(1)+'" r="3" fill="#1e293b"/>';
    content+=_g2Lbl(pts3.J[0]+11, pts3.J[1]-2, 'J', false);
  }
  if (_geo2dB('g2tri-Kshow')) {
    var kk = _geo2dN('g2tri-Kk', 0.5);
    pts3.K = [A[0]+kk*(C[0]-A[0]), A[1]+kk*(C[1]-A[1])];
    content+='<circle cx="'+pts3.K[0].toFixed(1)+'" cy="'+pts3.K[1].toFixed(1)+'" r="3" fill="#1e293b"/>';
    content+=_g2Lbl(pts3.K[0]+11, pts3.K[1]-2, 'K', false);
  }
  // Segments entre points
  if (pts3.I && pts3.J && _geo2dB('g2tri-sIJ')){ content+=_g2TriSeg(pts3.I,pts3.J,'#475569',1.5); }
  if (pts3.I && pts3.K && _geo2dB('g2tri-sIK')){ content+=_g2TriSeg(pts3.I,pts3.K,'#475569',1.5); }
  if (pts3.J && pts3.K && _geo2dB('g2tri-sJK')){ content+=_g2TriSeg(pts3.J,pts3.K,'#475569',1.5); }

  // ── Centroïde ──
  var gx=(A[0]+B[0]+C[0])/3, gy=(A[1]+B[1]+C[1])/3;
  function loff(V){ var dx=V[0]-gx,dy=V[1]-gy,l=Math.hypot(dx,dy)||1; return [V[0]+dx/l*18,V[1]+dy/l*18]; }

  // ── Codages longueurs égales ──
  content += _g2TriTicks(A,B,+(_geo2dS('g2tri-tick-AB','0')));
  content += _g2TriTicks(B,C,+(_geo2dS('g2tri-tick-BC','0')));
  content += _g2TriTicks(A,C,+(_geo2dS('g2tri-tick-AC','0')));

  // ── Codages angles égaux ──
  var arcA=+(_geo2dS('g2tri-arc-A','0')), arcB=+(_geo2dS('g2tri-arc-B','0')), arcC=+(_geo2dS('g2tri-arc-C','0'));
  content += _g2TriArcMark(A,B,C,arcA);
  content += _g2TriArcMark(B,A,C,arcB);
  content += _g2TriArcMark(C,A,B,arcC);

  // ── Codage angle droit ──
  var cod90=_geo2dS('g2tri-cod90','none');
  if (cod90!=='none') {
    var V90=cod90==='A'?A:cod90==='B'?B:C, P90=cod90==='A'?B:cod90==='B'?A:A;
    content+=_g2Angle90(V90[0],V90[1],_g2TriUnit(V90,P90)[0],_g2TriUnit(V90,P90)[1]);
  }

  // ── Angles calculés depuis les côtés finaux ──
  var aAd=Math.acos(Math.max(-1,Math.min(1,(b*b+c*c-a*a)/(2*b*c))))*180/Math.PI;
  var aBd=Math.acos(Math.max(-1,Math.min(1,(a*a+c*c-b*b)/(2*a*c))))*180/Math.PI;
  var aCd=180-aAd-aBd;

  // ── Côtés a, b, c — position : milieu du côté, décalé vers l'extérieur ──
  function sideTag(P,Q,idL,idSh,idV,val) {
    if (!_geo2dB(idSh)) return '';
    var mx=(P[0]+Q[0])/2, my=(P[1]+Q[1])/2;
    var dx=mx-gx, dy=my-gy, l=Math.hypot(dx,dy)||1;
    var ox=mx+dx/l*14, oy=my+dy/l*14;
    var lbl=_geo2dS(idL,'?');
    var txt=_geo2dB(idV) ? lbl+' = '+val.toFixed(2)+' cm' : lbl;
    return '<text x="'+ox.toFixed(1)+'" y="'+oy.toFixed(1)+
           '" text-anchor="middle" dominant-baseline="middle" font-size="12" font-style="italic" fill="#475569">'+txt+'</text>';
  }
  content += sideTag(B,C,'g2tri-lbl-a','g2tri-show-a','g2tri-val-a',a);
  content += sideTag(A,C,'g2tri-lbl-b','g2tri-show-b','g2tri-val-b',b);
  content += sideTag(A,B,'g2tri-lbl-c','g2tri-show-c','g2tri-val-c',c);

  // ── Angles α, β, γ — arc + label/valeur ──
  // show=true → affiche arc + lettre ; val=true → ajoute " = 45°"
  function angTag(V,P,Q,idL,idSh,idV,valDeg) {
    var sh=_geo2dB(idSh), sv=_geo2dB(idV);
    if (!sh && !sv) return '';
    var lbl=_geo2dS(idL,'?'), r=22;
    var u1=_g2TriUnit(V,P), u2=_g2TriUnit(V,Q);
    var cross=u1[0]*u2[1]-u1[1]*u2[0], sweep=cross<0?0:1;
    var p1=[V[0]+u1[0]*r,V[1]+u1[1]*r], p2=[V[0]+u2[0]*r,V[1]+u2[1]*r];
    var arc=sh ? '<path d="M '+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+
                 ' A '+r+' '+r+' 0 0 '+sweep+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1)+
                 '" fill="none" stroke="#64748b" stroke-width="1"/>' : '';
    var mid=[V[0]+(u1[0]+u2[0])*(r+4)*0.82, V[1]+(u1[1]+u2[1])*(r+4)*0.82];
    var txt=sv ? lbl+' = '+valDeg.toFixed(1)+'°' : lbl;
    return arc+'<text x="'+mid[0].toFixed(1)+'" y="'+mid[1].toFixed(1)+
           '" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#475569">'+txt+'</text>';
  }
  content += angTag(A,B,C,'g2tri-lbl-alpha','g2tri-show-alpha','g2tri-val-alpha',aAd);
  content += angTag(B,A,C,'g2tri-lbl-beta', 'g2tri-show-beta', 'g2tri-val-beta', aBd);
  content += angTag(C,A,B,'g2tri-lbl-gamma','g2tri-show-gamma','g2tri-val-gamma',aCd);

  // ── Sommets A, B, C ──
  // show=true → affiche le nom
  function vtxTag(V,idL,idSh) {
    if (!_geo2dB(idSh)) return '';
    var lo=loff(V), lbl=_geo2dS(idL,'?');
    return _g2Lbl(lo[0],lo[1],lbl,true);
  }
  content += vtxTag(A,'g2tri-lbl-A','g2tri-show-A');
  content += vtxTag(B,'g2tri-lbl-B','g2tri-show-B');
  content += vtxTag(C,'g2tri-lbl-C','g2tri-show-C');

  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+
         '" viewBox="0 0 '+W+' '+H+'" overflow="hidden" font-family="serif" font-size="14">'+
         content+'</svg>';
}

// ─── CARRÉ ───────────────────────────────────────────────────────────

function g2carToggleMesure() {
  var m = document.getElementById('g2car-mesure');
  var su = document.getElementById('g2car-sansunit');
  if (su) su.disabled = !(m && m.checked);
  _geo2dPreview();
}

function _g2Carre() {
  var tourne      = document.getElementById('g2car-orient-tourne') ? document.getElementById('g2car-orient-tourne').checked : false;
  var showAngles  = _geo2dB('g2car-angles');
  var codCotes    = _geo2dB('g2car-cod-cotes');
  var codDiag     = _geo2dB('g2car-cod-diag');
  var codMed      = _geo2dB('g2car-cod-med');
  var showDiagDB  = _geo2dB('g2car-diag-db');
  var showDiagCA  = _geo2dB('g2car-diag-ca');
  var showMedDC   = _geo2dB('g2car-med-dc');
  var showMedDA   = _geo2dB('g2car-med-da');
  var showCentre  = _geo2dB('g2car-centre');
  var centreLbl   = _geo2dS('g2car-centre-lbl', 'O');
  var showCircon  = _geo2dB('g2car-circon');
  var showInscrit = _geo2dB('g2car-inscrit');
  var showMesure  = _geo2dB('g2car-mesure');
  var sansUnit    = _geo2dB('g2car-sansunit');
  var aVal        = Math.max(0.1, _geo2dN('g2car-a', 3));

  var W = 300, H = 300, cx = 150, cy = 150;
  var baseSide = 170;
  var c = '';
  var D, C, B, A, side;

  if (tourne) {
    var r = baseSide / Math.SQRT2;
    side = baseSide;
    D = [cx - r, cy]; C = [cx, cy - r]; B = [cx + r, cy]; A = [cx, cy + r];
    c += '<polygon points="' + [D,C,B,A].map(function(p){ return p[0].toFixed(1)+','+p[1].toFixed(1); }).join(' ') +
         '" fill="#f0fdf4" stroke="#1e293b" stroke-width="1.8"/>';
  } else {
    side = baseSide;
    var ox = cx - side/2, oy = cy - side/2;
    D = [ox, oy]; C = [ox+side, oy]; B = [ox+side, oy+side]; A = [ox, oy+side];
    c += '<rect x="'+ox.toFixed(1)+'" y="'+oy.toFixed(1)+'" width="'+side+'" height="'+side+
         '" fill="#f0fdf4" stroke="#1e293b" stroke-width="1.8"/>';
  }

  var center = [(D[0]+B[0])/2, (D[1]+B[1])/2];

  function _unit(P1, P2) {
    var dx=P2[0]-P1[0], dy=P2[1]-P1[1], l=Math.sqrt(dx*dx+dy*dy);
    return l<1e-9 ? [1,0] : [dx/l, dy/l];
  }
  function _rightAngle(V, P1, P2) {
    var sz=9, u1=_unit(V,P1), u2=_unit(V,P2);
    var p1=[V[0]+u1[0]*sz, V[1]+u1[1]*sz];
    var corn=[V[0]+(u1[0]+u2[0])*sz, V[1]+(u1[1]+u2[1])*sz];
    var p2=[V[0]+u2[0]*sz, V[1]+u2[1]*sz];
    return '<path d="M'+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+
           ' L'+corn[0].toFixed(1)+' '+corn[1].toFixed(1)+
           ' L'+p2[0].toFixed(1)+' '+p2[1].toFixed(1)+
           '" fill="none" stroke="#1e293b" stroke-width="1.2"/>';
  }
  function _tick(P1, P2) {
    var mx=(P1[0]+P2[0])/2, my=(P1[1]+P2[1])/2, u=_unit(P1,P2), px=-u[1], py=u[0], tl=5;
    return '<line x1="'+(mx+px*tl).toFixed(1)+'" y1="'+(my+py*tl).toFixed(1)+
           '" x2="'+(mx-px*tl).toFixed(1)+'" y2="'+(my-py*tl).toFixed(1)+
           '" stroke="#1e293b" stroke-width="1.8"/>';
  }
  function _dashLine(P1, P2) {
    return '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+
           '" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+
           '" stroke="#64748b" stroke-width="1.2" stroke-dasharray="5,3"/>';
  }
  function _medLine(P1, P2, Q1, Q2) {
    var m1=[(P1[0]+P2[0])/2, (P1[1]+P2[1])/2];
    var m2=[(Q1[0]+Q2[0])/2, (Q1[1]+Q2[1])/2];
    return _dashLine(m1, m2);
  }
  function _midPerp(P1, P2) {
    var mx=(P1[0]+P2[0])/2, my=(P1[1]+P2[1])/2;
    var u=_unit(P1,P2), px=-u[1], py=u[0], sz=5;
    var dot=(center[0]-mx)*px+(center[1]-my)*py;
    if(dot<0){px=-px;py=-py;}
    var p1=[mx+u[0]*sz, my+u[1]*sz];
    var corn=[mx+u[0]*sz+px*sz, my+u[1]*sz+py*sz];
    var p2=[mx+px*sz, my+py*sz];
    return '<path d="M'+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+
           ' L'+corn[0].toFixed(1)+' '+corn[1].toFixed(1)+
           ' L'+p2[0].toFixed(1)+' '+p2[1].toFixed(1)+
           '" fill="none" stroke="#1e293b" stroke-width="1.0"/>'+
           '<line x1="'+(mx+u[0]*sz*0.45+px*3.5).toFixed(1)+'" y1="'+(my+u[1]*sz*0.45+py*3.5).toFixed(1)+
           '" x2="'+(mx+u[0]*sz*0.45-px*3.5).toFixed(1)+'" y2="'+(my+u[1]*sz*0.45-py*3.5).toFixed(1)+'" stroke="#1e293b" stroke-width="1.0"/>'+
           '<line x1="'+(mx-u[0]*sz*0.45+px*3.5).toFixed(1)+'" y1="'+(my-u[1]*sz*0.45+py*3.5).toFixed(1)+
           '" x2="'+(mx-u[0]*sz*0.45-px*3.5).toFixed(1)+'" y2="'+(my-u[1]*sz*0.45-py*3.5).toFixed(1)+'" stroke="#1e293b" stroke-width="1.0"/>';
  }

  // Square order: D→C→B→A (clockwise). Adjacencies: D-C, C-B, B-A, A-D.
  if (showAngles) {
    c += _rightAngle(D, C, A);
    c += _rightAngle(C, D, B);
    c += _rightAngle(B, C, A);
    c += _rightAngle(A, B, D);
  }

  if (codCotes) {
    c += _tick(D,C) + _tick(C,B) + _tick(B,A) + _tick(A,D);
  }

  // Diagonals: CA connects C(top-right/top) ↔ A(bottom-left/bottom)
  //            DB connects D(top-left/left) ↔ B(bottom-right/right)
  if (showDiagCA) {
    c += _dashLine(C, A);
    if (codDiag) { c += _tick(C, center) + _tick(center, A); }
  }
  if (showDiagDB) {
    c += _dashLine(D, B);
    if (codDiag) { c += _tick(D, center) + _tick(center, B); }
  }

  // Médiatrices: [DC] ↔ opposite side [AB], [DA] ↔ opposite side [CB]
  if (showMedDC) {
    c += _medLine(D, C, B, A);
    if (codMed) { c += _midPerp(D, C); }
  }
  if (showMedDA) {
    c += _medLine(D, A, C, B);
    if (codMed) { c += _midPerp(D, A); }
  }

  if (showInscrit) {
    c += '<circle cx="'+center[0].toFixed(1)+'" cy="'+center[1].toFixed(1)+
         '" r="'+(side/2).toFixed(1)+'" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="5,3"/>';
  }
  if (showCircon) {
    c += '<circle cx="'+center[0].toFixed(1)+'" cy="'+center[1].toFixed(1)+
         '" r="'+(side*Math.SQRT2/2).toFixed(1)+'" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="5,3"/>';
  }

  if (showCentre) {
    c += '<circle cx="'+center[0].toFixed(1)+'" cy="'+center[1].toFixed(1)+'" r="2.5" fill="#1e293b"/>';
    c += _g2Lbl(center[0]+9, center[1]-9, centreLbl||'O', false);
  }

  if (showMesure) {
    var mStr = sansUnit ? String(aVal) : aVal+' cm';
    var mx = (D[0]+C[0])/2, my = tourne ? (D[1]+C[1])/2-12 : D[1]-12;
    if (tourne) { mx -= 10; }
    c += '<text x="'+mx.toFixed(1)+'" y="'+my.toFixed(1)+
         '" text-anchor="middle" font-size="11" fill="#475569">'+mStr+'</text>';
  }

  var lo = 14;
  if (tourne) {
    if (_geo2dB('g2car-show-d')) c += _g2Lbl(D[0]-lo, D[1], _geo2dS('g2car-lbl-d','D'), true);
    if (_geo2dB('g2car-show-c')) c += _g2Lbl(C[0], C[1]-lo, _geo2dS('g2car-lbl-c','C'), true);
    if (_geo2dB('g2car-show-b')) c += _g2Lbl(B[0]+lo, B[1], _geo2dS('g2car-lbl-b','B'), true);
    if (_geo2dB('g2car-show-a')) c += _g2Lbl(A[0], A[1]+lo, _geo2dS('g2car-lbl-a','A'), true);
  } else {
    if (_geo2dB('g2car-show-d')) c += _g2Lbl(D[0]-lo, D[1]-lo/2, _geo2dS('g2car-lbl-d','D'), true);
    if (_geo2dB('g2car-show-c')) c += _g2Lbl(C[0]+lo, C[1]-lo/2, _geo2dS('g2car-lbl-c','C'), true);
    if (_geo2dB('g2car-show-b')) c += _g2Lbl(B[0]+lo, B[1]+lo/2, _geo2dS('g2car-lbl-b','B'), true);
    if (_geo2dB('g2car-show-a')) c += _g2Lbl(A[0]-lo, A[1]+lo/2, _geo2dS('g2car-lbl-a','A'), true);
  }

  return _g2Svg(W, H, c);
}

// ─── RECTANGLE ───────────────────────────────────────────────────────

function g2rectToggleMesure() {
  var m = document.getElementById('g2rect-mesure');
  var su = document.getElementById('g2rect-sansunit');
  if (su) su.disabled = !(m && m.checked);
  _geo2dPreview();
}

function _g2Rectangle() {
  var aVal        = Math.max(0.2, _geo2dN('g2rect-a', 5));   // diagonale AC
  var bVal        = Math.max(0.1, _geo2dN('g2rect-b', 3));   // côté AB
  var showMesure  = _geo2dB('g2rect-mesure');
  var sansUnit    = _geo2dB('g2rect-sansunit');
  var showAngles  = _geo2dB('g2rect-angles');
  var codCotes    = _geo2dB('g2rect-cod-cotes');
  var codMilieu   = _geo2dB('g2rect-cod-milieu');
  var codMed      = _geo2dB('g2rect-cod-med');
  var showDiagAC  = _geo2dB('g2rect-diag-ac');
  var showDiagBD  = _geo2dB('g2rect-diag-bd');
  var showMedAB   = _geo2dB('g2rect-med-ab');
  var showMedAD   = _geo2dB('g2rect-med-ad');
  var showCircon  = _geo2dB('g2rect-circon');
  var showAffC    = _geo2dB('g2rect-affcentre');
  var affCLbl     = _geo2dS('g2rect-affcentre-lbl', 'O');
  var showCentre  = _geo2dB('g2rect-centre');
  var centreLbl   = _geo2dS('g2rect-centre-lbl', 'O');

  var b2 = Math.min(bVal, aVal * 0.9999);
  var hCm = Math.sqrt(Math.max(0.01, aVal*aVal - b2*b2));

  var W = showCircon ? 340 : 300, H = showCircon ? 340 : 260, PAD = 38;
  var sc = Math.min((W-2*PAD)/b2, (H-2*PAD)/hCm);
  var w_px = b2*sc, h_px = hCm*sc;
  var ox = (W-w_px)/2, oy = (H-h_px)/2;

  // Sommets: A=BG, B=BD, C=HD, D=HG
  var A=[ox, oy+h_px], B=[ox+w_px, oy+h_px], C=[ox+w_px, oy], D=[ox, oy];
  var mcx=(A[0]+C[0])/2, mcy=(A[1]+C[1])/2;
  var c='';

  function _unit(P1,P2){var dx=P2[0]-P1[0],dy=P2[1]-P1[1],l=Math.sqrt(dx*dx+dy*dy);return l<1e-9?[1,0]:[dx/l,dy/l];}
  function _rightAngle(V,P1,P2){
    var sz=8,u1=_unit(V,P1),u2=_unit(V,P2);
    var p1=[V[0]+u1[0]*sz,V[1]+u1[1]*sz],corn=[V[0]+(u1[0]+u2[0])*sz,V[1]+(u1[1]+u2[1])*sz],p2=[V[0]+u2[0]*sz,V[1]+u2[1]*sz];
    return '<path d="M'+p1[0].toFixed(1)+','+p1[1].toFixed(1)+' L'+corn[0].toFixed(1)+','+corn[1].toFixed(1)+' L'+p2[0].toFixed(1)+','+p2[1].toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.2"/>';
  }
  function _tick(P1,P2,n){
    var mx=(P1[0]+P2[0])/2,my=(P1[1]+P2[1])/2,u=_unit(P1,P2),px=-u[1],py=u[0],tl=5,g=n>1?3.5:0,r='';
    for(var k=0;k<n;k++){var off=(k-(n-1)/2)*g;r+='<line x1="'+(mx+u[0]*off+px*tl).toFixed(1)+'" y1="'+(my+u[1]*off+py*tl).toFixed(1)+'" x2="'+(mx+u[0]*off-px*tl).toFixed(1)+'" y2="'+(my+u[1]*off-py*tl).toFixed(1)+'" stroke="#1e293b" stroke-width="1.8"/>';}
    return r;
  }
  function _dsh(P1,P2){return '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="#64748b" stroke-width="1.2" stroke-dasharray="5,3"/>';}
  function _perpMark(P1,P2){
    var mx=(P1[0]+P2[0])/2,my=(P1[1]+P2[1])/2,u=_unit(P1,P2),px=-u[1],py=u[0],sz=5;
    var dot=(mcx-mx)*px+(mcy-my)*py; if(dot<0){px=-px;py=-py;}
    var e1=[mx+u[0]*sz,my+u[1]*sz],corn=[mx+u[0]*sz+px*sz,my+u[1]*sz+py*sz],e2=[mx+px*sz,my+py*sz];
    return '<path d="M'+e1[0].toFixed(1)+','+e1[1].toFixed(1)+' L'+corn[0].toFixed(1)+','+corn[1].toFixed(1)+' L'+e2[0].toFixed(1)+','+e2[1].toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.0"/>';
  }

  c += '<rect x="'+ox.toFixed(1)+'" y="'+oy.toFixed(1)+'" width="'+w_px.toFixed(1)+'" height="'+h_px.toFixed(1)+'" fill="#f0fdf4" stroke="#1e293b" stroke-width="1.8"/>';

  if (showAngles) {
    c += _rightAngle(A,B,D) + _rightAngle(B,C,A) + _rightAngle(C,D,B) + _rightAngle(D,A,C);
  }
  if (codCotes) {
    c += _tick(A,B,1) + _tick(D,C,1);
    c += _tick(A,D,2) + _tick(B,C,2);
  }
  if (showDiagAC) {
    c += _dsh(A,C);
    if (codMilieu) { c += _tick(A,[mcx,mcy],1) + _tick([mcx,mcy],C,1); }
  }
  if (showDiagBD) {
    c += _dsh(B,D);
    if (codMilieu) { c += _tick(B,[mcx,mcy],1) + _tick([mcx,mcy],D,1); }
  }
  if (showMedAB) {
    c += _dsh([mcx,A[1]], [mcx,D[1]]);
    if (codMed) { c += _perpMark(A,B) + _perpMark(D,C); }
  }
  if (showMedAD) {
    c += _dsh([A[0],mcy], [B[0],mcy]);
    if (codMed) { c += _perpMark(A,D) + _perpMark(B,C); }
  }
  if (showCircon) {
    var rC = Math.sqrt(w_px*w_px + h_px*h_px)/2;
    c += '<circle cx="'+mcx.toFixed(1)+'" cy="'+mcy.toFixed(1)+'" r="'+rC.toFixed(1)+'" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="5,3"/>';
    if (showAffC) {
      c += '<circle cx="'+mcx.toFixed(1)+'" cy="'+mcy.toFixed(1)+'" r="2.5" fill="#1e293b"/>';
      if (affCLbl) c += _g2Lbl(mcx+9, mcy-9, affCLbl, false);
    }
  }
  if (showCentre) {
    c += '<circle cx="'+mcx.toFixed(1)+'" cy="'+mcy.toFixed(1)+'" r="2.5" fill="#1e293b"/>';
    if (centreLbl) c += _g2Lbl(mcx+9, mcy+9, centreLbl, false);
  }
  if (showMesure) {
    var su=sansUnit, mA=su?String(aVal):aVal+' cm', mB=su?String(bVal):bVal+' cm';
    c += '<text x="'+mcx.toFixed(1)+'" y="'+(A[1]+14).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569">'+mB+'</text>';
    if (showDiagAC) c += '<text x="'+(mcx+10).toFixed(1)+'" y="'+(mcy-5).toFixed(1)+'" text-anchor="start" font-size="11" fill="#475569">'+mA+'</text>';
  }
  var lo=14;
  if (_geo2dB('g2rect-show-a')) c += _g2Lbl(A[0]-lo, A[1]+lo/2, _geo2dS('g2rect-lbl-a','A'), true);
  if (_geo2dB('g2rect-show-b')) c += _g2Lbl(B[0]+lo, B[1]+lo/2, _geo2dS('g2rect-lbl-b','B'), true);
  if (_geo2dB('g2rect-show-c')) c += _g2Lbl(C[0]+lo, C[1]-lo/2, _geo2dS('g2rect-lbl-c','C'), true);
  if (_geo2dB('g2rect-show-d')) c += _g2Lbl(D[0]-lo, D[1]-lo/2, _geo2dS('g2rect-lbl-d','D'), true);
  return _g2Svg(W, H, c);
}

// ─── LOSANGE ─────────────────────────────────────────────────────────

function g2losToggleMesure() {
  var m = document.getElementById('g2los-mesure');
  var su = document.getElementById('g2los-sansunit');
  if (su) su.disabled = !(m && m.checked);
  _geo2dPreview();
}

function _g2Losange() {
  var aVal       = Math.max(0.1, _geo2dN('g2los-a', 4));
  var bDeg       = Math.max(10,  Math.min(170, _geo2dN('g2los-b', 45)));
  var showMesure = _geo2dB('g2los-mesure');
  var sansUnit   = _geo2dB('g2los-sansunit');
  var codPerp    = _geo2dB('g2los-cod-perp');
  var codMilieu  = _geo2dB('g2los-cod-milieu');
  var codCotes   = _geo2dB('g2los-cod-cotes');
  var showInscrit= _geo2dB('g2los-inscrit');
  var showDiagCA = _geo2dB('g2los-diag-ca');
  var showDiagBD = _geo2dB('g2los-diag-bd');
  var showCentre = _geo2dB('g2los-centre');
  var centreLbl  = _geo2dS('g2los-centre-lbl', 'O');

  var bRad = bDeg * Math.PI / 180;
  var W = 300, H = 280, cx = 150, cy = 140;
  // half-diagonals: d1=half BD (horiz), d2=half CA (vert)
  var nd1 = Math.cos(bRad/2), nd2 = Math.sin(bRad/2);
  var sc = Math.min((W-70)/2/nd1, (H-60)/2/nd2);
  var d1 = nd1*sc, d2 = nd2*sc;

  // Vertices: C=top, B=right, A=bottom, D=left
  var C=[cx,cy-d2], B=[cx+d1,cy], A=[cx,cy+d2], D=[cx-d1,cy];
  var c = _g2Path([C,B,A,D], '#fefce8');

  function _unit(P1,P2){ var dx=P2[0]-P1[0],dy=P2[1]-P1[1],l=Math.sqrt(dx*dx+dy*dy); return l<1e-9?[1,0]:[dx/l,dy/l]; }
  function _tick(P1,P2){ var mx=(P1[0]+P2[0])/2,my=(P1[1]+P2[1])/2,u=_unit(P1,P2),px=-u[1],py=u[0],tl=5;
    return '<line x1="'+(mx+px*tl).toFixed(1)+'" y1="'+(my+py*tl).toFixed(1)+'" x2="'+(mx-px*tl).toFixed(1)+'" y2="'+(my-py*tl).toFixed(1)+'" stroke="#1e293b" stroke-width="1.8"/>'; }
  function _dsh(P1,P2){ return '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="#64748b" stroke-width="1.2" stroke-dasharray="5,3"/>'; }

  // ── Codage côtés ──
  if (codCotes) { c += _tick(C,B)+_tick(B,A)+_tick(A,D)+_tick(D,C); }

  // ── Diagonales ──
  if (showDiagCA) {
    c += _dsh(C,A);
    if (codMilieu) { c += _tick(C,[cx,cy])+_tick([cx,cy],A); }
  }
  if (showDiagBD) {
    c += _dsh(B,D);
    if (codMilieu) { c += _tick(B,[cx,cy])+_tick([cx,cy],D); }
  }

  // ── Diagonales perpendiculaires (angle droit au centre) ──
  if (codPerp) {
    var sz=7;
    c += '<path d="M'+cx.toFixed(1)+','+(cy+sz).toFixed(1)+
         ' L'+(cx+sz).toFixed(1)+','+(cy+sz).toFixed(1)+
         ' L'+(cx+sz).toFixed(1)+','+cy.toFixed(1)+
         '" fill="none" stroke="#1e293b" stroke-width="1.1"/>';
  }

  // ── Cercle inscrit ──
  if (showInscrit) {
    var side_px = Math.sqrt(d1*d1+d2*d2);
    var rI = d1*d2/side_px;
    c += '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="'+rI.toFixed(1)+
         '" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="5,3"/>';
  }

  // ── Centre ──
  if (showCentre) {
    c += '<circle cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" r="2.5" fill="#1e293b"/>';
    if (centreLbl) c += _g2Lbl(cx+9, cy+9, centreLbl, false);
  }

  // ── Mesures ──
  if (showMesure) {
    var mStr = sansUnit ? String(aVal) : aVal+' cm';
    var bStr = sansUnit ? String(bDeg) : bDeg+'°';
    var mid = [(C[0]+B[0])/2, (C[1]+B[1])/2], u=_unit(C,B), px=-u[1], py=u[0];
    var dot=(mid[0]-cx)*px+(mid[1]-cy)*py;
    if(dot<0){px=-px;py=-py;}
    c += '<text x="'+(mid[0]+px*13).toFixed(1)+'" y="'+(mid[1]+py*13+4).toFixed(1)+
         '" text-anchor="middle" font-size="11" fill="#475569">'+mStr+'</text>';
    c += '<text x="'+(B[0]+12).toFixed(1)+'" y="'+(B[1]+4).toFixed(1)+
         '" text-anchor="start" font-size="10" fill="#475569">'+bStr+'</text>';
  }

  // ── Sommets ──
  var lo=14;
  if (_geo2dB('g2los-show-c')) c += _g2Lbl(cx, C[1]-lo, _geo2dS('g2los-lbl-c','C'), true);
  if (_geo2dB('g2los-show-b')) c += _g2Lbl(B[0]+lo, cy, _geo2dS('g2los-lbl-b','B'), true);
  if (_geo2dB('g2los-show-a')) c += _g2Lbl(cx, A[1]+lo, _geo2dS('g2los-lbl-a','A'), true);
  if (_geo2dB('g2los-show-d')) c += _g2Lbl(D[0]-lo, cy, _geo2dS('g2los-lbl-d','D'), true);

  return _g2Svg(W, H, c);
}

// ─── PARALLÉLOGRAMME ─────────────────────────────────────────────────

function g2parToggleMesure() {
  var m = document.getElementById('g2par-mesure');
  var su = document.getElementById('g2par-sansunit');
  if (su) su.disabled = !(m && m.checked);
  _geo2dPreview();
}

function _g2Parallelogramme() {
  var aVal       = Math.max(0.1, _geo2dN('g2par-a', 4));
  var bVal       = Math.max(0.1, _geo2dN('g2par-b', 5));
  var cVal       = Math.max(0.1, _geo2dN('g2par-c', 6));
  var showMesure = _geo2dB('g2par-mesure');
  var sansUnit   = _geo2dB('g2par-sansunit');
  var codMilieu  = _geo2dB('g2par-cod-milieu');
  var codCotes   = _geo2dB('g2par-cod-cotes');
  var codAngles  = _geo2dB('g2par-cod-angles');
  var showDiagAC = _geo2dB('g2par-diag-ac');
  var showDiagBD = _geo2dB('g2par-diag-bd');
  var showCentre = _geo2dB('g2par-centre');
  var centreLbl  = _geo2dS('g2par-centre-lbl', 'O');

  // angle at A from sides a,b and diagonal BD=c (law of cosines)
  var cosA = (aVal*aVal+bVal*bVal-cVal*cVal)/(2*aVal*bVal);
  cosA = Math.max(-0.92, Math.min(0.92, cosA));
  var angA = Math.acos(cosA);
  var hCm = bVal*Math.sin(angA), shCm = bVal*Math.cos(angA);

  var W=320, H=260, PAD=36;
  var totalW = aVal+Math.abs(shCm), sc = Math.min((W-2*PAD)/totalW, (H-2*PAD)/hCm);
  var a_px=aVal*sc, h_px=hCm*sc, sh_px=shCm*sc;
  var ox = PAD+(shCm<0?Math.abs(sh_px):0), oy=PAD;

  // Vertices: A=BL, B=BR, C=TR, D=TL
  var A=[ox,oy+h_px], B=[ox+a_px,oy+h_px], C=[ox+a_px+sh_px,oy], D=[ox+sh_px,oy];
  var center=[(A[0]+C[0])/2,(A[1]+C[1])/2];
  var c='';

  function _unit(P1,P2){var dx=P2[0]-P1[0],dy=P2[1]-P1[1],l=Math.sqrt(dx*dx+dy*dy);return l<1e-9?[1,0]:[dx/l,dy/l];}
  function _tick(P1,P2,n){
    var mx=(P1[0]+P2[0])/2,my=(P1[1]+P2[1])/2,u=_unit(P1,P2),px=-u[1],py=u[0],tl=5,g=n>1?3:0,r='';
    for(var k=0;k<n;k++){var off=(k-(n-1)/2)*g;
      r+='<line x1="'+(mx+u[0]*off+px*tl).toFixed(1)+'" y1="'+(my+u[1]*off+py*tl).toFixed(1)+
         '" x2="'+(mx+u[0]*off-px*tl).toFixed(1)+'" y2="'+(my+u[1]*off-py*tl).toFixed(1)+'" stroke="#1e293b" stroke-width="1.8"/>';}
    return r;
  }
  function _dsh(P1,P2){return '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="#64748b" stroke-width="1.2" stroke-dasharray="5,3"/>';}
  function _arcAt(V,P1,P2,r){
    var u1=_unit(V,P1),u2=_unit(V,P2),s=[V[0]+u1[0]*r,V[1]+u1[1]*r],e=[V[0]+u2[0]*r,V[1]+u2[1]*r];
    var cross=u1[0]*u2[1]-u1[1]*u2[0];
    return '<path d="M'+s[0].toFixed(1)+','+s[1].toFixed(1)+' A'+r+','+r+' 0 0,'+(cross<0?0:1)+' '+e[0].toFixed(1)+','+e[1].toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.0"/>';
  }

  c += _g2Path([A,B,C,D], '#fef3c7');

  // ── Codage côtés opposés ──
  if (codCotes) {
    c += _tick(A,B,1)+_tick(D,C,1); // base pair: 1 tick
    c += _tick(A,D,2)+_tick(B,C,2); // lateral pair: 2 ticks
  }

  // ── Codage angles ──
  if (codAngles) {
    c += _arcAt(A,B,D,14)+_arcAt(C,B,D,14);       // angle A = angle C : 1 arc
    c += _arcAt(B,A,C,12)+_arcAt(B,A,C,17);       // angle B : 2 arcs
    c += _arcAt(D,A,C,12)+_arcAt(D,A,C,17);       // angle D : 2 arcs
  }

  // ── Diagonales ──
  if (showDiagAC) {
    c += _dsh(A,C);
    if (codMilieu) { c += _tick(A,center,1)+_tick(center,C,1); }
  }
  if (showDiagBD) {
    c += _dsh(B,D);
    if (codMilieu) { c += _tick(B,center,1)+_tick(center,D,1); }
  }

  // ── Centre ──
  if (showCentre) {
    c += '<circle cx="'+center[0].toFixed(1)+'" cy="'+center[1].toFixed(1)+'" r="2.5" fill="#1e293b"/>';
    if (centreLbl) c += _g2Lbl(center[0]+9, center[1]+9, centreLbl, false);
  }

  // ── Mesures ──
  if (showMesure) {
    var su=sansUnit;
    var mA=su?String(aVal):aVal+' cm', mB=su?String(bVal):bVal+' cm', mC=su?String(cVal):cVal+' cm';
    c += '<text x="'+((A[0]+B[0])/2).toFixed(1)+'" y="'+(A[1]+14).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569">'+mA+'</text>';
    c += '<text x="'+((A[0]+D[0])/2-11).toFixed(1)+'" y="'+((A[1]+D[1])/2).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569">'+mB+'</text>';
    if (showDiagBD) c += '<text x="'+((B[0]+D[0])/2+11).toFixed(1)+'" y="'+((B[1]+D[1])/2).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569">'+mC+'</text>';
  }

  // ── Sommets ──
  var lo=14;
  if (_geo2dB('g2par-show-d')) c += _g2Lbl(D[0]-lo, D[1]-lo/2, _geo2dS('g2par-lbl-d','D'), true);
  if (_geo2dB('g2par-show-c')) c += _g2Lbl(C[0]+lo, C[1]-lo/2, _geo2dS('g2par-lbl-c','C'), true);
  if (_geo2dB('g2par-show-a')) c += _g2Lbl(A[0]-lo, A[1]+lo/2, _geo2dS('g2par-lbl-a','A'), true);
  if (_geo2dB('g2par-show-b')) c += _g2Lbl(B[0]+lo, B[1]+lo/2, _geo2dS('g2par-lbl-b','B'), true);

  return _g2Svg(W, H, c);
}

// ─── TRAPÈZE ─────────────────────────────────────────────────────────

function g2trapToggleMesure() {
  var m = document.getElementById('g2trap-mesure');
  var su = document.getElementById('g2trap-sansunit');
  if (su) su.disabled = !(m && m.checked);
  _geo2dPreview();
}

function _g2Trapeze() {
  var aVal       = Math.max(0.1, _geo2dN('g2trap-a', 5));
  var cVal       = Math.max(0.1, _geo2dN('g2trap-c', 3));
  var eVal       = Math.max(0,   _geo2dN('g2trap-e', 1));
  var hVal       = Math.max(0.1, _geo2dN('g2trap-h', 4));
  var showMesure = _geo2dB('g2trap-mesure');
  var sansUnit   = _geo2dB('g2trap-sansunit');
  var showSegAC  = _geo2dB('g2trap-seg-ac');
  var showSegBD  = _geo2dB('g2trap-seg-bd');
  var codAngles  = _geo2dB('g2trap-cod-angles');
  var codHaut    = _geo2dB('g2trap-cod-haut');
  var showHaut   = _geo2dB('g2trap-haut-line');
  var hautDist   = Math.max(0, _geo2dN('g2trap-haut-dist', 0));
  var prolPet    = _geo2dB('g2trap-prol-pet');
  var prolPetV   = Math.max(0, _geo2dN('g2trap-prol-pet-v', 0));
  var prolGrd    = _geo2dB('g2trap-prol-grd');
  var prolGrdV   = Math.max(0, _geo2dN('g2trap-prol-grd-v', 0));
  var showCentre = _geo2dB('g2trap-centre');
  var centreLbl  = _geo2dS('g2trap-centre-lbl', 'O');

  var W=320, H=260, PAD=36;
  var totalW = Math.max(aVal, eVal+cVal);
  var sc = Math.min((W-2*PAD)/totalW, (H-2*PAD)/hVal);
  var a_px=aVal*sc, c_px=cVal*sc, e_px=eVal*sc, h_px=hVal*sc;
  var ox=(W-a_px)/2, oy=PAD;

  // Sommets: A=BG, B=BD, D=HG, C=HD
  var A=[ox, oy+h_px], B=[ox+a_px, oy+h_px], D=[ox+e_px, oy], C=[ox+e_px+c_px, oy];
  var center=[(A[0]+B[0]+C[0]+D[0])/4, (A[1]+B[1]+C[1]+D[1])/4];
  var c='';

  function _unit(P1,P2){var dx=P2[0]-P1[0],dy=P2[1]-P1[1],l=Math.sqrt(dx*dx+dy*dy);return l<1e-9?[1,0]:[dx/l,dy/l];}
  function _dsh(P1,P2){return '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="#64748b" stroke-width="1.2" stroke-dasharray="5,3"/>';}
  function _ext(P1,P2){return '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="#94a3b8" stroke-width="1.1" stroke-dasharray="4,3"/>';}
  function _arcAt(V,P1,P2,r2){
    var u1=_unit(V,P1),u2=_unit(V,P2),s=[V[0]+u1[0]*r2,V[1]+u1[1]*r2],e2=[V[0]+u2[0]*r2,V[1]+u2[1]*r2];
    var cross=u1[0]*u2[1]-u1[1]*u2[0];
    return '<path d="M'+s[0].toFixed(1)+','+s[1].toFixed(1)+' A'+r2+','+r2+' 0 0,'+(cross<0?0:1)+' '+e2[0].toFixed(1)+','+e2[1].toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.0"/>';
  }

  c += _g2Path([A,B,C,D], '#fdf4ff');

  if (showSegAC) c += _dsh(A,C);
  if (showSegBD) c += _dsh(B,D);
  if (codAngles) {
    c += _arcAt(A,B,D,14) + _arcAt(B,A,C,14) + _arcAt(C,B,D,12) + _arcAt(D,A,C,12);
  }

  if (showHaut) {
    var footX = A[0] + hautDist*sc;
    c += '<line x1="'+footX.toFixed(1)+'" y1="'+A[1].toFixed(1)+'" x2="'+footX.toFixed(1)+'" y2="'+oy.toFixed(1)+'" stroke="#1e293b" stroke-width="1.1" stroke-dasharray="4,3"/>';
    if (codHaut) {
      var sz=7;
      c += '<path d="M'+footX.toFixed(1)+','+(A[1]-sz).toFixed(1)+' L'+(footX+sz).toFixed(1)+','+(A[1]-sz).toFixed(1)+' L'+(footX+sz).toFixed(1)+','+A[1].toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.1"/>';
    }
  }
  if (prolPet && prolPetV > 0) {
    var pv=prolPetV*sc;
    c += _ext(D,[D[0]-pv,D[1]]) + _ext(C,[C[0]+pv,C[1]]);
  }
  if (prolGrd && prolGrdV > 0) {
    var pv=prolGrdV*sc;
    c += _ext(A,[A[0]-pv,A[1]]) + _ext(B,[B[0]+pv,B[1]]);
  }
  if (showCentre) {
    c += '<circle cx="'+center[0].toFixed(1)+'" cy="'+center[1].toFixed(1)+'" r="2.5" fill="#1e293b"/>';
    if (centreLbl) c += _g2Lbl(center[0]+9, center[1]+9, centreLbl, false);
  }
  if (showMesure) {
    var su=sansUnit;
    var mA=su?String(aVal):aVal+' cm', mC=su?String(cVal):cVal+' cm', mH=su?String(hVal):hVal+' cm';
    c += '<text x="'+((A[0]+B[0])/2).toFixed(1)+'" y="'+(A[1]+14).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569">'+mA+'</text>';
    c += '<text x="'+((D[0]+C[0])/2).toFixed(1)+'" y="'+(D[1]-6).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569">'+mC+'</text>';
    c += '<text x="'+(B[0]+18).toFixed(1)+'" y="'+((A[1]+D[1])/2+4).toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569" transform="rotate(-90,'+(B[0]+18)+','+(((A[1]+D[1])/2+4))+')">'+mH+'</text>';
  }
  var lo=14;
  if (_geo2dB('g2trap-show-d')) c += _g2Lbl(D[0]-lo, D[1]-lo/2, _geo2dS('g2trap-lbl-d','D'), true);
  if (_geo2dB('g2trap-show-c')) c += _g2Lbl(C[0]+lo, C[1]-lo/2, _geo2dS('g2trap-lbl-c','C'), true);
  if (_geo2dB('g2trap-show-a')) c += _g2Lbl(A[0]-lo, A[1]+lo/2, _geo2dS('g2trap-lbl-a','A'), true);
  if (_geo2dB('g2trap-show-b')) c += _g2Lbl(B[0]+lo, B[1]+lo/2, _geo2dS('g2trap-lbl-b','B'), true);
  return _g2Svg(W, H, c);
}

// ─── CERCLE ──────────────────────────────────────────────────────────

function g2cerToggleMesure() {
  var m = document.getElementById('g2cer-mesure');
  var su = document.getElementById('g2cer-sansunit');
  if (su) su.disabled = !(m && m.checked);
  _geo2dPreview();
}

function g2cerToggleCentre() {
  var ch = document.getElementById('g2cer-centre');
  var nn = document.getElementById('g2cer-nomcentre');
  var ni = document.getElementById('g2cer-nomcentre-lbl');
  var on = ch && ch.checked;
  if (nn) nn.disabled = !on;
  if (ni) ni.disabled = !on;
  _geo2dPreview();
}

function _g2Cercle() {
  var vide       = document.getElementById('g2cer-fig-vide') ? document.getElementById('g2cer-fig-vide').checked : false;
  var aVal       = Math.max(0.1, _geo2dN('g2cer-a', 3));
  var showMesure = _geo2dB('g2cer-mesure');
  var sansUnit   = _geo2dB('g2cer-sansunit');
  var nbRay      = Math.min(6,  Math.max(0, Math.round(_geo2dN('g2cer-nb-ray', 0))));
  var rayExt     = _geo2dB('g2cer-ray-ext');
  var rayNms     = _geo2dS('g2cer-ray-nms', 'ABC');
  var nbDia      = Math.min(4,  Math.max(0, Math.round(_geo2dN('g2cer-nb-dia', 0))));
  var diaNms     = _geo2dB('g2cer-dia-nms');
  var diaNm      = _geo2dS('g2cer-dia-nm',  '[AB];[CD]');
  var nbCor      = Math.min(4,  Math.max(0, Math.round(_geo2dN('g2cer-nb-cor', 0))));
  var corNms     = _geo2dB('g2cer-cor-nms');
  var corNm      = _geo2dS('g2cer-cor-nm',  '[AB];[CD]');
  var nbTan      = Math.min(4,  Math.max(0, Math.round(_geo2dN('g2cer-nb-tan', 0))));
  var tanCon     = _geo2dB('g2cer-tan-con');
  var tanNms     = _geo2dS('g2cer-tan-nms', 'ABC');
  var nbPts      = Math.min(8,  Math.max(0, Math.round(_geo2dN('g2cer-nb-pts', 0))));
  var ptsNms     = _geo2dB('g2cer-pts-nms');
  var ptsNm      = _geo2dS('g2cer-pts-nm',  'ABC');
  var nomCercle  = _geo2dB('g2cer-nomcercle');
  var cercLbl    = _geo2dS('g2cer-nomcercle-lbl', 'K');
  var showCentre = _geo2dB('g2cer-centre');
  var nomCentre  = _geo2dB('g2cer-nomcentre');
  var centreLbl  = _geo2dS('g2cer-nomcentre-lbl', 'O');

  var W = 280, H = 280, cx = 140, cy = 140, r = 102;
  var c = '';

  function ptOn(theta) { return [cx + r*Math.cos(theta), cy + r*Math.sin(theta)]; }

  function parseLabels(s) {
    if (!s) return [];
    s = s.trim();
    if (s.indexOf(';') >= 0) return s.split(';').map(function(x){ return x.trim(); }).filter(Boolean);
    return s.split('').filter(function(ch){ return /\S/.test(ch); });
  }

  c += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+(vide?'none':'#eff6ff')+'" stroke="#1e293b" stroke-width="1.8"/>';

  // ── Rayons ──
  var rLbls = parseLabels(rayNms);
  for (var i = 0; i < nbRay; i++) {
    var theta = nbRay === 1 ? -Math.PI/6 : -Math.PI/2 + 2*Math.PI*i/nbRay;
    var P = ptOn(theta);
    c += '<line x1="'+cx+'" y1="'+cy+'" x2="'+P[0].toFixed(1)+'" y2="'+P[1].toFixed(1)+'" stroke="#1e293b" stroke-width="1.2"/>';
    if (rayExt && rLbls[i]) {
      c += _g2Lbl((cx+(r+13)*Math.cos(theta)).toFixed(1), (cy+(r+13)*Math.sin(theta)).toFixed(1), rLbls[i], true);
    }
  }

  // ── Mesure ──
  if (showMesure) {
    var mStr = sansUnit ? String(aVal) : aVal+' cm';
    var mTheta = nbRay === 1 ? -Math.PI/6 : (nbRay > 1 ? -Math.PI/2 : -Math.PI/6);
    if (nbRay === 0) {
      var rP = ptOn(mTheta);
      c += '<line x1="'+cx+'" y1="'+cy+'" x2="'+rP[0].toFixed(1)+'" y2="'+rP[1].toFixed(1)+'" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,3"/>';
    }
    var lx = cx + (r*0.5)*Math.cos(mTheta) - Math.sin(mTheta)*8;
    var ly = cy + (r*0.5)*Math.sin(mTheta) + Math.cos(mTheta)*8 - 5;
    c += '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle" font-size="11" fill="#475569">'+mStr+'</text>';
  }

  // ── Diamètres ──
  var dLbls = parseLabels(diaNm);
  for (var i = 0; i < nbDia; i++) {
    var theta = Math.PI*i/Math.max(nbDia, 1);
    var P1 = ptOn(theta), P2 = ptOn(theta + Math.PI);
    c += '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="#1e293b" stroke-width="1.2"/>';
    if (diaNms && dLbls[i]) {
      c += _g2Lbl((cx+(r+13)*Math.cos(theta)).toFixed(1), (cy+(r+13)*Math.sin(theta)).toFixed(1), dLbls[i], false);
    }
  }

  // ── Cordes ──
  var cLbls = parseLabels(corNm);
  for (var i = 0; i < nbCor; i++) {
    var t1 = Math.PI/4 + Math.PI*0.65*i, t2 = t1 + Math.PI*0.65;
    var P1 = ptOn(t1), P2 = ptOn(t2);
    c += '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="#1e293b" stroke-width="1.2"/>';
    if (corNms && cLbls[i]) {
      var mx = (P1[0]+P2[0])/2, my = (P1[1]+P2[1])/2;
      var dx = mx-cx, dy = my-cy, dl = Math.sqrt(dx*dx+dy*dy)||1;
      c += _g2Lbl((mx+dx/dl*10).toFixed(1), (my+dy/dl*10-5).toFixed(1), cLbls[i], false);
    }
  }

  // ── Tangentes ──
  var tLbls = parseLabels(tanNms);
  for (var i = 0; i < nbTan; i++) {
    var theta = Math.PI/4 + 2*Math.PI*i/Math.max(nbTan, 1);
    var P = ptOn(theta);
    var tx = -Math.sin(theta), ty = Math.cos(theta), ext = r*0.65;
    c += '<line x1="'+(P[0]+tx*ext).toFixed(1)+'" y1="'+(P[1]+ty*ext).toFixed(1)+
         '" x2="'+(P[0]-tx*ext).toFixed(1)+'" y2="'+(P[1]-ty*ext).toFixed(1)+'" stroke="#1e293b" stroke-width="1.2"/>';
    if (tanCon && tLbls[i]) {
      c += _g2Lbl((cx+(r+13)*Math.cos(theta)).toFixed(1), (cy+(r+13)*Math.sin(theta)).toFixed(1), tLbls[i], false);
    }
  }

  // ── Points ──
  var pLbls = parseLabels(ptsNm);
  for (var i = 0; i < nbPts; i++) {
    var theta = -Math.PI/2 + 2*Math.PI*i/Math.max(nbPts, 1);
    var P = ptOn(theta);
    c += '<circle cx="'+P[0].toFixed(1)+'" cy="'+P[1].toFixed(1)+'" r="3" fill="#1e293b"/>';
    if (ptsNms && pLbls[i]) {
      c += _g2Lbl((cx+(r+13)*Math.cos(theta)).toFixed(1), (cy+(r+13)*Math.sin(theta)).toFixed(1), pLbls[i], true);
    }
  }

  // ── Nom du cercle ──
  if (nomCercle && cercLbl) {
    var lx = cx + (r+18)*Math.cos(-3*Math.PI/4), ly = cy + (r+18)*Math.sin(-3*Math.PI/4);
    c += _g2Lbl(lx.toFixed(1), ly.toFixed(1), '('+cercLbl+')', false);
  }

  // ── Centre ──
  if (showCentre) {
    c += '<circle cx="'+cx+'" cy="'+cy+'" r="2.5" fill="#1e293b"/>';
    if (nomCentre && centreLbl) c += _g2Lbl(cx+10, cy+10, centreLbl, false);
  }

  return _g2Svg(W, H, c);
}

// ─── POLYGONE RÉGULIER ───────────────────────────────────────────────

function g2polToggleMesure() {
  var m = document.getElementById('g2pol-mesure');
  var su = document.getElementById('g2pol-sansunit');
  if (su) su.disabled = !(m && m.checked);
  _geo2dPreview();
}

function _g2Polygone() {
  var n           = Math.max(3, Math.min(12, Math.round(_geo2dN('g2pol-n', 6))));
  var bVal        = Math.max(0.1, _geo2dN('g2pol-b', 3));  // rayon circonscrit (cm, affichage)
  var aVal        = Math.max(0.1, _geo2dN('g2pol-a', 3));  // rayon inscrit (cm, affichage)
  var showMesure  = _geo2dB('g2pol-mesure');
  var sansUnit    = _geo2dB('g2pol-sansunit');
  var showCircon  = _geo2dB('g2pol-circon');
  var showRayCirc = _geo2dB('g2pol-ray-circ');
  var codRayCirc  = _geo2dB('g2pol-cod-ray-circ');
  var showInscrit = _geo2dB('g2pol-inscrit');
  var showRayIns  = _geo2dB('g2pol-ray-ins');
  var codRayIns   = _geo2dB('g2pol-cod-ray-ins');
  var showNom     = _geo2dB('g2pol-nom');
  var nomLbl      = _geo2dS('g2pol-nom-lbl', 'A');
  var showCentre  = _geo2dB('g2pol-centre');
  var centreLbl   = _geo2dS('g2pol-centre-lbl', 'O');
  var orientEl    = document.querySelector('input[name="g2pol-orient"]:checked');
  var coteEnHaut  = orientEl && orientEl.value === 'cote';

  var W=280, H=280, cx=140, cy=140, r=100;
  var r_ins = r * Math.cos(Math.PI/n);
  var c='';
  var startAngle = coteEnHaut ? (-Math.PI/2 + Math.PI/n) : -Math.PI/2;

  function _unit(P1,P2){var dx=P2[0]-P1[0],dy=P2[1]-P1[1],l=Math.sqrt(dx*dx+dy*dy);return l<1e-9?[1,0]:[dx/l,dy/l];}
  function _tick(P1,P2){
    var mx=(P1[0]+P2[0])/2,my=(P1[1]+P2[1])/2,u=_unit(P1,P2),px=-u[1],py=u[0],tl=4;
    return '<line x1="'+(mx+px*tl).toFixed(1)+'" y1="'+(my+py*tl).toFixed(1)+'" x2="'+(mx-px*tl).toFixed(1)+'" y2="'+(my-py*tl).toFixed(1)+'" stroke="#1e293b" stroke-width="1.5"/>';
  }

  // Sommets
  var pts=[];
  for(var i=0;i<n;i++){
    var th=startAngle+2*Math.PI*i/n;
    pts.push([cx+r*Math.cos(th), cy+r*Math.sin(th)]);
  }
  c += _g2Path(pts, '#f0fdf4');

  // ── Cercle circonscrit ──
  if (showCircon) {
    c += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="5,3"/>';
  }
  if (showRayCirc) {
    for(var i=0;i<n;i++){
      c += '<line x1="'+cx+'" y1="'+cy+'" x2="'+pts[i][0].toFixed(1)+'" y2="'+pts[i][1].toFixed(1)+'" stroke="#3b82f6" stroke-width="1.0"/>';
      if (codRayCirc) c += _tick([cx,cy], pts[i]);
    }
  }

  // ── Cercle inscrit ──
  if (showInscrit) {
    c += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r_ins.toFixed(1)+'" fill="none" stroke="#10b981" stroke-width="1.2" stroke-dasharray="5,3"/>';
  }
  if (showRayIns) {
    for(var i=0;i<n;i++){
      var p1=pts[i], p2=pts[(i+1)%n], mid=[(p1[0]+p2[0])/2,(p1[1]+p2[1])/2];
      c += '<line x1="'+cx+'" y1="'+cy+'" x2="'+mid[0].toFixed(1)+'" y2="'+mid[1].toFixed(1)+'" stroke="#10b981" stroke-width="1.0"/>';
      if (codRayIns) c += _tick([cx,cy], mid);
    }
  }

  // ── Mesures ──
  if (showMesure) {
    var su=sansUnit, mB=su?String(bVal):bVal+' cm', mA2=su?String(aVal):aVal+' cm';
    if (showRayCirc || showCircon) {
      c += '<text x="'+(cx+r*0.55).toFixed(1)+'" y="'+(cy-r*0.35).toFixed(1)+'" text-anchor="start" font-size="10" fill="#3b82f6">'+mB+'</text>';
    }
    if (showRayIns || showInscrit) {
      c += '<text x="'+(cx+r_ins*0.5).toFixed(1)+'" y="'+(cy+r_ins*0.35).toFixed(1)+'" text-anchor="start" font-size="10" fill="#10b981">'+mA2+'</text>';
    }
  }

  // ── Noms des sommets ──
  if (showNom && nomLbl) {
    var startCode=nomLbl.charCodeAt(0), lo=18;
    for(var i=0;i<n;i++){
      var th=startAngle+2*Math.PI*i/n;
      var lx=cx+(r+lo)*Math.cos(th), ly=cy+(r+lo)*Math.sin(th);
      c += _g2Lbl(lx.toFixed(1), ly.toFixed(1), String.fromCharCode(startCode+i), true);
    }
  }

  // ── Centre ──
  if (showCentre) {
    c += '<circle cx="'+cx+'" cy="'+cy+'" r="2.5" fill="#1e293b"/>';
    if (centreLbl) c += _g2Lbl(cx+9, cy+9, centreLbl, false);
  }
  return _g2Svg(W, H, c);
}

// ─── CAMEMBERT ───────────────────────────────────────────────────────

function _g2Camembert() {
  var rawV = _geo2dS('g2cam-data', '30,25,20,15,10');
  var rawL = _geo2dS('g2cam-labels', '');
  var vals = rawV.split(',').map(function(v){ return parseFloat(v.trim()); }).filter(function(v){ return !isNaN(v) && v > 0; });
  if (!vals.length) return _g2Svg(280, 200, _g2Lbl(140,100,'Saisir des valeurs'));
  var lbls = rawL ? rawL.split(',').map(function(l){ return l.trim(); }) : [];
  var total = vals.reduce(function(a,b){ return a+b; }, 0);
  var W = 300, H = 280, cx = 155, cy = 145, r = 100;
  var colors = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#f97316','#06b6d4','#84cc16'];
  var c = '', startA = -Math.PI/2;
  vals.forEach(function(v, i) {
    var angle = 2*Math.PI*v/total;
    var endA = startA + angle;
    var x1 = cx + r*Math.cos(startA), y1 = cy + r*Math.sin(startA);
    var x2 = cx + r*Math.cos(endA),   y2 = cy + r*Math.sin(endA);
    var lg = angle > Math.PI ? 1 : 0;
    var col = colors[i % colors.length];
    c += '<path d="M'+cx+' '+cy+' L'+x1.toFixed(1)+' '+y1.toFixed(1)+' A'+r+' '+r+' 0 '+lg+' 1 '+x2.toFixed(1)+' '+y2.toFixed(1)+' Z" fill="'+col+'" stroke="white" stroke-width="1.5"/>';
    var midA = startA + angle/2;
    var lx = cx + r*0.65*Math.cos(midA), ly = cy + r*0.65*Math.sin(midA);
    var pct = Math.round(v/total*100);
    c += '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="11" font-weight="bold" fill="white">'+pct+'%</text>';
    // légende
    var legY = 8 + i*18;
    c += '<rect x="6" y="'+(legY-6)+'" width="11" height="11" fill="'+col+'" rx="2"/>';
    var legTxt = (lbls[i] || 'Série '+(i+1)) + ' ('+pct+'%)';
    c += '<text x="21" y="'+legY+'" dominant-baseline="middle" font-size="10.5" fill="#1e293b">'+legTxt+'</text>';
    startA = endA;
  });
  return _g2Svg(W, H, c);
}

// ─── FRACTION ────────────────────────────────────────────────────────

function _g2Fraction() {
  var fracStr  = _geo2dS('g2frac-val', '3/5');
  var parts    = fracStr.split('/');
  var num      = Math.max(1, parseInt(parts[0]) || 1);
  var den      = Math.max(num, parseInt(parts[1]) || 5);
  var typeEl   = document.querySelector('input[name="g2frac-type"]:checked');
  var type     = typeEl ? typeEl.value : 'carre';
  var traitsEl = document.querySelector('input[name="g2frac-traits"]:checked');
  var traits   = traitsEl ? traitsEl.value : 'standard';
  var cote     = Math.max(0.5, _geo2dN('g2frac-cote', 3));
  var c = '';

  // ── Disque ──
  if (type === 'disque') {
    var W=260, H=280, cx=130, cy=130, r=102;
    for (var i=0; i<den; i++) {
      var a1=-Math.PI/2+2*Math.PI*i/den, a2=-Math.PI/2+2*Math.PI*(i+1)/den;
      var x1=(cx+r*Math.cos(a1)).toFixed(1), y1=(cy+r*Math.sin(a1)).toFixed(1);
      var x2=(cx+r*Math.cos(a2)).toFixed(1), y2=(cy+r*Math.sin(a2)).toFixed(1);
      var lg=(2*Math.PI/den>Math.PI)?1:0;
      if (i<num) c += '<path d="M'+cx+','+cy+' L'+x1+','+y1+' A'+r+','+r+' 0 '+lg+',1 '+x2+','+y2+' Z" fill="#3b82f6" stroke="white" stroke-width="1.5"/>';
    }
    c += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#1e293b" stroke-width="1.5"/>';
    for (var i=0; i<den; i++) {
      var a1=-Math.PI/2+2*Math.PI*i/den;
      c += '<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+r*Math.cos(a1)).toFixed(1)+'" y2="'+(cy+r*Math.sin(a1)).toFixed(1)+'" stroke="#1e293b" stroke-width="1.2"/>';
    }
    c += '<text x="'+cx+'" y="'+(cy+r+18)+'" text-anchor="middle" font-size="14" font-weight="bold" font-family="serif" fill="#1e293b">'+num+'/'+den+'</text>';
    return _g2Svg(W, H, c);
  }

  // ── Carré / Rectangle ──
  var rawCell   = cote * 18;  // px per cell (3cm→54px)
  var isVert    = (traits === 'horiz');   // "Horizontales seules" → colonne verticale
  var cellW     = isVert ? (type==='carre'?rawCell:rawCell*1.8) : Math.min(rawCell, 270/den);
  var cellH     = isVert ? Math.min(rawCell, 270/den) : (type==='carre'?cellW:cellW*0.56);
  cellW         = Math.max(16, cellW);
  cellH         = Math.max(16, cellH);
  var totalW    = isVert ? cellW : cellW*den;
  var totalH    = isVert ? cellH*den : cellH;
  var W         = Math.round(totalW)+60, H = Math.round(totalH)+60;
  var ox=30, oy=30;
  var rnd       = Math.floor(Math.random()*99999);
  var defs      = '';

  for (var i=0; i<den; i++) {
    var rx = isVert ? ox : ox+i*cellW;
    var ry = isVert ? oy+i*cellH : oy;
    var rw = cellW, rh = cellH;
    var filled = i < num;

    if (traits==='diag' && filled) {
      var cid='fc_'+rnd+'_'+i;
      defs += '<clipPath id="'+cid+'"><rect x="'+rx+'" y="'+ry+'" width="'+rw+'" height="'+rh+'"/></clipPath>';
      c += '<rect x="'+rx+'" y="'+ry+'" width="'+rw+'" height="'+rh+'" fill="#dbeafe"/>';
      for (var d=-rh; d<rw; d+=7) {
        c += '<line x1="'+(rx+d)+'" y1="'+ry+'" x2="'+(rx+d+rh)+'" y2="'+(ry+rh)+'" stroke="#2563eb" stroke-width="1.5" clip-path="url(#'+cid+')"/>';
      }
    } else {
      c += '<rect x="'+rx.toFixed(1)+'" y="'+ry.toFixed(1)+'" width="'+rw.toFixed(1)+'" height="'+rh.toFixed(1)+
           '" fill="'+(filled?'#3b82f6':'#e2e8f0')+'"/>';
    }
  }

  // Borders selon traits
  if (traits==='standard' || traits==='diag') {
    for (var i=0; i<den; i++) {
      var rx=isVert?ox:ox+i*cellW, ry=isVert?oy+i*cellH:oy;
      c += '<rect x="'+rx.toFixed(1)+'" y="'+ry.toFixed(1)+'" width="'+cellW.toFixed(1)+'" height="'+cellH.toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.2"/>';
    }
  } else if (traits==='vert') {
    c += '<rect x="'+ox+'" y="'+oy+'" width="'+totalW.toFixed(1)+'" height="'+totalH.toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.5"/>';
    for (var i=1; i<den; i++) c += '<line x1="'+(ox+i*cellW).toFixed(1)+'" y1="'+oy+'" x2="'+(ox+i*cellW).toFixed(1)+'" y2="'+(oy+totalH)+'" stroke="#1e293b" stroke-width="1.2"/>';
  } else {
    c += '<rect x="'+ox+'" y="'+oy+'" width="'+totalW.toFixed(1)+'" height="'+totalH.toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.5"/>';
    for (var i=1; i<den; i++) c += '<line x1="'+ox+'" y1="'+(oy+i*cellH).toFixed(1)+'" x2="'+(ox+totalW)+'" y2="'+(oy+i*cellH).toFixed(1)+'" stroke="#1e293b" stroke-width="1.2"/>';
  }
  c += '<rect x="'+ox+'" y="'+oy+'" width="'+totalW.toFixed(1)+'" height="'+totalH.toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="2"/>';
  c += '<text x="'+(ox+totalW/2)+'" y="'+(oy+totalH+18).toFixed(1)+'" text-anchor="middle" font-size="14" font-weight="bold" font-family="serif" fill="#1e293b">'+num+'/'+den+'</text>';
  if (defs) c = '<defs>'+defs+'</defs>'+c;
  return _g2Svg(W, H, c);
}

// ─── CONFIGURATION DE THALÈS ─────────────────────────────────────────

function _g2Thales() {
  var OA_cm  = Math.max(0.5, _geo2dN('g2tha-oa', 5));
  var OB_cm  = Math.max(0.5, _geo2dN('g2tha-ob', 5));
  var AB_cm  = Math.max(0.5, _geo2dN('g2tha-ab', 5));
  var inclDeg= _geo2dN('g2tha-incl', 0);
  var rn     = Math.max(1, Math.round(_geo2dN('g2tha-rn', 1)));
  var rd     = Math.max(rn+1, Math.round(_geo2dN('g2tha-rd', 2)));
  var ratio  = rn / rd;

  var trOA   = _geo2dB('g2tha-tr-oa');
  var trOB   = _geo2dB('g2tha-tr-ob');
  var trAB   = _geo2dB('g2tha-tr-ab');
  var trOA2  = _geo2dB('g2tha-tr-oa2');
  var trOB2  = _geo2dB('g2tha-tr-ob2');
  var trA2B2 = _geo2dB('g2tha-tr-a2b2');
  var doNom  = _geo2dB('g2tha-nom');
  var lblO   = _geo2dS('g2tha-lbl-o',  'O');
  var lblA   = _geo2dS('g2tha-lbl-a',  'A');
  var lblB   = _geo2dS('g2tha-lbl-b',  'B');
  var lblA2  = _geo2dS('g2tha-lbl-a2', "A'");
  var lblB2  = _geo2dS('g2tha-lbl-b2', "B'");
  var doLong = _geo2dB('g2tha-long');
  var lngOA  = _geo2dB('g2tha-long-oa');
  var lngOB  = _geo2dB('g2tha-long-ob');
  var lngAB  = _geo2dB('g2tha-long-ab');
  var lngOA2 = _geo2dB('g2tha-long-oa2');
  var lngOB2 = _geo2dB('g2tha-long-ob2');
  var lngA2B2= _geo2dB('g2tha-long-a2b2');
  var lngCm  = _geo2dB('g2tha-long-cm');
  var angOAB = _geo2dB('g2tha-ang-oab');
  var angA2  = _geo2dB('g2tha-ang-oa2b2');

  // Angle au sommet O (loi des cosinus)
  var cosO = (OA_cm*OA_cm + OB_cm*OB_cm - AB_cm*AB_cm) / (2*OA_cm*OB_cm);
  cosO = Math.max(-0.999, Math.min(0.999, cosO));
  var angO = Math.acos(cosO);

  // Directions (inclinaison = bissectrice de l'angle O, en deg, 0=horizontal droit)
  var incl = inclDeg * Math.PI / 180;
  var dirA = incl - angO/2;  // vers A (en bas si angle>0)
  var dirB = incl + angO/2;  // vers B (en haut)

  // Coordonnées mathématiques (1 unité = 1 cm)
  var Om=[0,0];
  var Am=[OA_cm*Math.cos(dirA), OA_cm*Math.sin(dirA)];
  var Bm=[OB_cm*Math.cos(dirB), OB_cm*Math.sin(dirB)];
  var A2m=[ratio*Am[0], ratio*Am[1]];
  var B2m=[ratio*Bm[0], ratio*Bm[1]];

  // Mise à l'échelle
  var allPts=[Om,Am,Bm,A2m,B2m];
  var xs=allPts.map(function(p){return p[0];}), ys=allPts.map(function(p){return p[1];});
  var minX=Math.min.apply(null,xs), maxX=Math.max.apply(null,xs);
  var minY=Math.min.apply(null,ys), maxY=Math.max.apply(null,ys);
  var rangeX=maxX-minX||1, rangeY=maxY-minY||1;
  var W=300, H=260, PAD=38;
  var sc=Math.min((W-2*PAD)/rangeX, (H-2*PAD)/rangeY);
  function toS(p){return [(p[0]-minX)*sc+PAD, H-((p[1]-minY)*sc+PAD)];}

  var O=toS(Om), A=toS(Am), B=toS(Bm), A2=toS(A2m), B2=toS(B2m);
  var cent=[(O[0]+A[0]+B[0]+A2[0]+B2[0])/5, (O[1]+A[1]+B[1]+A2[1]+B2[1])/5];
  var c='';

  function _unit(P1,P2){var dx=P2[0]-P1[0],dy=P2[1]-P1[1],l=Math.sqrt(dx*dx+dy*dy);return l<1e-9?[1,0]:[dx/l,dy/l];}
  function _seg(P1,P2,col,w,da){return '<line x1="'+P1[0].toFixed(1)+'" y1="'+P1[1].toFixed(1)+'" x2="'+P2[0].toFixed(1)+'" y2="'+P2[1].toFixed(1)+'" stroke="'+col+'" stroke-width="'+w+'"'+(da?' stroke-dasharray="'+da+'"':'')+'/>';}
  function _dot(P){return '<circle cx="'+P[0].toFixed(1)+'" cy="'+P[1].toFixed(1)+'" r="3" fill="#1e293b"/>';}
  function _rightAngle(V,P1,P2){
    var sz=8,u1=_unit(V,P1),u2=_unit(V,P2);
    var p1=[V[0]+u1[0]*sz,V[1]+u1[1]*sz],co=[V[0]+(u1[0]+u2[0])*sz,V[1]+(u1[1]+u2[1])*sz],p2=[V[0]+u2[0]*sz,V[1]+u2[1]*sz];
    return '<path d="M'+p1[0].toFixed(1)+','+p1[1].toFixed(1)+' L'+co[0].toFixed(1)+','+co[1].toFixed(1)+' L'+p2[0].toFixed(1)+','+p2[1].toFixed(1)+'" fill="none" stroke="#1e293b" stroke-width="1.2"/>';
  }
  function _ptLbl(P, lbl) {
    var dx=P[0]-cent[0], dy=P[1]-cent[1], l=Math.sqrt(dx*dx+dy*dy);
    if(l<1){dx=0;dy=-1;l=1;}
    var tx=P[0]+dx/l*16, ty=P[1]+dy/l*16;
    return '<text x="'+tx.toFixed(1)+'" y="'+(ty+4).toFixed(1)+'" text-anchor="middle" font-size="13" font-weight="bold" font-family="serif" fill="#1e293b">'+lbl+'</text>';
  }
  function _segLbl(P1,P2,val) {
    var u=_unit(P1,P2), px=-u[1], py=u[0];
    var mx=(P1[0]+P2[0])/2, my=(P1[1]+P2[1])/2;
    var txt=String(val)+(lngCm?' cm':'');
    return '<text x="'+(mx+px*12).toFixed(1)+'" y="'+(my+py*12+4).toFixed(1)+'" text-anchor="middle" font-size="10" fill="#475569">'+txt+'</text>';
  }

  // ── Segments ──
  if (trOA)   c += _seg(O, A,  '#64748b', 1.5, '');
  else if (trOA2) c += _seg(O, A2, '#64748b', 1.5, '');
  if (trOB)   c += _seg(O, B,  '#64748b', 1.5, '');
  else if (trOB2) c += _seg(O, B2, '#64748b', 1.5, '');
  if (trAB)   c += _seg(A, B,  '#2563eb', 2.0, '');
  if (trA2B2) c += _seg(A2,B2, '#2563eb', 2.0, '');

  // ── Angles droits ──
  if (angOAB) c += _rightAngle(A, O, B);
  if (angA2)  c += _rightAngle(A2, O, B2);

  // ── Points ──
  c += _dot(O)+_dot(A)+_dot(B)+_dot(A2)+_dot(B2);

  // ── Labels ──
  if (doNom) {
    if (lblO) c += _ptLbl(O, lblO);
    if (lblA) c += _ptLbl(A, lblA);
    if (lblB) c += _ptLbl(B, lblB);
    if (lblA2)c += _ptLbl(A2, lblA2);
    if (lblB2)c += _ptLbl(B2, lblB2);
  }

  // ── Longueurs ──
  if (doLong) {
    var fmtV = function(v){return parseFloat(v.toFixed(2));};
    var r2=rn+'/'+rd;
    if (lngOA)   c += _segLbl(O,  A,  fmtV(OA_cm));
    if (lngOB)   c += _segLbl(O,  B,  fmtV(OB_cm));
    if (lngAB)   c += _segLbl(A,  B,  fmtV(AB_cm));
    if (lngOA2)  c += _segLbl(O,  A2, fmtV(OA_cm*ratio));
    if (lngOB2)  c += _segLbl(O,  B2, fmtV(OB_cm*ratio));
    if (lngA2B2) c += _segLbl(A2, B2, fmtV(AB_cm*ratio));
  }

  return _g2Svg(W, H, c);
}

// ─── SEGMENT / DROITE / DEMI-DROITE ──────────────────────────────────

function _g2segRotate(delta) {
  var el = document.getElementById('g2seg-incl');
  if (!el) return;
  var v = (parseFloat(el.value) || 0) + delta;
  // Normalise dans [-180, 180]
  while (v > 180)  v -= 360;
  while (v < -180) v += 360;
  el.value = Math.round(v);
  _geo2dPreview();
}

function _g2thaRotate(delta) {
  var el = document.getElementById('g2tha-incl');
  if (!el) return;
  var v = (parseFloat(el.value) || 0) + delta;
  while (v > 180)  v -= 360;
  while (v < -180) v += 360;
  el.value = Math.round(v);
  _geo2dPreview();
}

function _g2Segment() {
  var long_cm  = Math.max(0.5, _geo2dN('g2seg-long', 5));
  var endA     = _geo2dS('g2seg-a', 'bar');   // none | bar | arrow
  var endB     = _geo2dS('g2seg-b', 'bar');
  var lblA     = _geo2dS('g2seg-lbl-a', 'A');
  var lblB     = _geo2dS('g2seg-lbl-b', 'B');
  var showA    = _geo2dB('g2seg-show-a');
  var showB    = _geo2dB('g2seg-show-b');
  var showNom  = _geo2dB('g2seg-nom');
  var nomLbl   = _geo2dS('g2seg-nom-lbl', 'AB');
  var incl     = _geo2dN('g2seg-incl', 0) * Math.PI / 180;

  var pDefs = [];
  for (var k=1; k<=4; k++) {
    if (_geo2dB('g2seg-p'+k)) {
      pDefs.push({ ap: Math.max(0, _geo2dN('g2seg-p'+k+'-ap', 2.5)), st: _geo2dS('g2seg-p'+k+'-st','x'), lbl: _geo2dS('g2seg-p'+k+'-lbl','') });
    }
  }

  var W=320, H=220, PAD=44;
  var sc = Math.min((W-2*PAD)/long_cm, 52);
  var l_px = long_cm * sc;
  var cx=W/2, cy=H/2;
  var dx=Math.cos(incl), dy=-Math.sin(incl);   // direction écran
  var A=[cx-l_px/2*dx, cy-l_px/2*dy], B=[cx+l_px/2*dx, cy+l_px/2*dy];

  function _unit(P1,P2){var ex=P2[0]-P1[0],ey=P2[1]-P1[1],l=Math.sqrt(ex*ex+ey*ey);return l<1e-9?[1,0]:[ex/l,ey/l];}
  var u=[dx,dy], px=-dy, py=dx;   // u = direction, (px,py) = perpendiculaire

  var c='';

  // ── Extension pour droite/demi-droite ──
  var drawFrom=A, drawTo=B;
  var ext=Math.max(W,H)*0.55;
  if (endA==='arrow' && endB==='arrow') {
    drawFrom=[A[0]-u[0]*ext, A[1]-u[1]*ext];
    drawTo  =[B[0]+u[0]*ext, B[1]+u[1]*ext];
  } else if (endA==='arrow') {
    drawFrom=[A[0]-u[0]*ext, A[1]-u[1]*ext];
  } else if (endB==='arrow') {
    drawTo  =[B[0]+u[0]*ext, B[1]+u[1]*ext];
  }

  c += '<line x1="'+drawFrom[0].toFixed(1)+'" y1="'+drawFrom[1].toFixed(1)+
       '" x2="'+drawTo[0].toFixed(1)+'" y2="'+drawTo[1].toFixed(1)+
       '" stroke="#1e293b" stroke-width="1.6"/>';

  // ── Marqueurs d'extrémités ──
  function _bar(P){ var t=7;
    return '<line x1="'+(P[0]+px*t).toFixed(1)+'" y1="'+(P[1]+py*t).toFixed(1)+
           '" x2="'+(P[0]-px*t).toFixed(1)+'" y2="'+(P[1]-py*t).toFixed(1)+'" stroke="#1e293b" stroke-width="1.8"/>';}
  function _arrow(P,dir){ var al=11,aw=5;
    var tx=P[0]+u[0]*al*dir, ty=P[1]+u[1]*al*dir;
    return '<path d="M'+(P[0]+px*aw).toFixed(1)+','+(P[1]+py*aw).toFixed(1)+
           ' L'+tx.toFixed(1)+','+ty.toFixed(1)+
           ' L'+(P[0]-px*aw).toFixed(1)+','+(P[1]-py*aw).toFixed(1)+
           '" fill="#1e293b" stroke="#1e293b" stroke-width="1" stroke-linejoin="round"/>';}

  if (endA==='bar')   c += _bar(A);
  if (endA==='arrow') c += _arrow(A,-1);
  if (endB==='bar')   c += _bar(B);
  if (endB==='arrow') c += _arrow(B,+1);

  // ── Points P ──
  function _ptMarker(P,st){ var s=5;
    if(st==='dot') return '<circle cx="'+P[0].toFixed(1)+'" cy="'+P[1].toFixed(1)+'" r="3.5" fill="#1e293b"/>';
    if(st==='bar') return '<line x1="'+(P[0]+px*s).toFixed(1)+'" y1="'+(P[1]+py*s).toFixed(1)+'" x2="'+(P[0]-px*s).toFixed(1)+'" y2="'+(P[1]-py*s).toFixed(1)+'" stroke="#1e293b" stroke-width="2"/>';
    return '<line x1="'+(P[0]+px*s+u[0]*s).toFixed(1)+'" y1="'+(P[1]+py*s+u[1]*s).toFixed(1)+'" x2="'+(P[0]-px*s-u[0]*s).toFixed(1)+'" y2="'+(P[1]-py*s-u[1]*s).toFixed(1)+'" stroke="#1e293b" stroke-width="1.5"/>'+
           '<line x1="'+(P[0]-px*s+u[0]*s).toFixed(1)+'" y1="'+(P[1]-py*s+u[1]*s).toFixed(1)+'" x2="'+(P[0]+px*s-u[0]*s).toFixed(1)+'" y2="'+(P[1]+py*s-u[1]*s).toFixed(1)+'" stroke="#1e293b" stroke-width="1.5"/>';}

  for (var i=0; i<pDefs.length; i++) {
    var pd=pDefs[i], t=pd.ap/long_cm;
    var P=[A[0]+t*(B[0]-A[0]), A[1]+t*(B[1]-A[1])];
    c += _ptMarker(P, pd.st);
    if (pd.lbl) {
      var side = py>=0 ? -1 : 1;
      c += '<text x="'+(P[0]+px*15*side).toFixed(1)+'" y="'+(P[1]+py*15*side+4).toFixed(1)+
           '" text-anchor="middle" font-size="13" font-weight="bold" font-family="serif" fill="#1e293b">'+pd.lbl+'</text>';
    }
  }

  // ── Nom du segment ──
  if (showNom && nomLbl) {
    var mid=[(A[0]+B[0])/2,(A[1]+B[1])/2], side=py>=0?1:-1;
    c += '<text x="'+(mid[0]+px*17*side).toFixed(1)+'" y="'+(mid[1]+py*17*side+4).toFixed(1)+
         '" text-anchor="middle" font-size="12" fill="#475569">['+nomLbl+']</text>';
  }

  // ── Labels A et B ──
  c += '<circle cx="'+A[0].toFixed(1)+'" cy="'+A[1].toFixed(1)+'" r="2.5" fill="#1e293b"/>';
  if (showA && lblA) c += '<text x="'+(A[0]-u[0]*16).toFixed(1)+'" y="'+(A[1]-u[1]*16+4).toFixed(1)+
       '" text-anchor="middle" font-size="13" font-weight="bold" font-family="serif" fill="#1e293b">'+lblA+'</text>';
  c += '<circle cx="'+B[0].toFixed(1)+'" cy="'+B[1].toFixed(1)+'" r="2.5" fill="#1e293b"/>';
  if (showB && lblB) c += '<text x="'+(B[0]+u[0]*16).toFixed(1)+'" y="'+(B[1]+u[1]*16+4).toFixed(1)+
       '" text-anchor="middle" font-size="13" font-weight="bold" font-family="serif" fill="#1e293b">'+lblB+'</text>';

  return _g2Svg(W, H, c);
}

