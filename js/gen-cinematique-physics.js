/* ══════════════════════════════════════════════════════════════
   STACKFORGE — Cinématique du point : moteur physique pur.
   L'enseignant digitalise lui-même les points M0, M1, M2… (clic sur
   un fond libre ou une image importée dans l'atelier, voir
   js/cinematique-ui.js) — ce fichier ne simule plus rien, il se
   contente de convertir les points pixel en mètres réels (via 2
   points de calibration + une distance réelle connue) puis de
   calculer vi/vip1/dv par différences consécutives, exactement comme
   une vraie chronophotographie dépouillée à la main.
   Vocabulaire aligné sur l'énoncé : v2→vi, v3→vip1.
   ══════════════════════════════════════════════════════════════ */

/* Convertit une liste de points pixel {x,y} (y vers le bas, origine écran)
   en liste de points [x,y] en mètres (y vers le haut, origine = 1er repère
   de calibration). Translation-invariant pour toute différence de deux
   points (vi/vip1/dv) : seul l'affichage dépend de l'origine choisie. */
function cinPointsToMeters(points, calib) {
  var dx = calib.x2 - calib.x1, dy = calib.y2 - calib.y1;
  var pxDist = Math.sqrt(dx * dx + dy * dy);
  var echelle = calib.realDist / pxDist;
  return points.map(function (p) {
    return [(p.x - calib.x1) * echelle, -(p.y - calib.y1) * echelle];
  });
}

/* points : [{x,y}, ...] coordonnées pixel dans l'ordre de digitalisation (index = i).
   calib  : {x1,y1,x2,y2,realDist} — 2 points de calibration (pixel) + distance réelle (m).
   dt     : intervalle de temps entre 2 points consécutifs (s).
   iIdx   : indice i choisi par l'enseignant.
   method : 'apres' (défaut, méthode du point d'après, programme 2019) — vi = MiMi+1/dt,
            vip1 = Mi+1Mi+2/dt — ou 'symetrique' (méthode de la dérivée symétrique, utile pour
            les mouvements circulaires/paraboliques) — vi = Mi-1Mi+1/(2dt), vip1 = MiMi+2/(2dt),
            la corde sautant le point médian donne une direction tangente correcte pour une
            trajectoire courbe. Retourne aussi les paires de points réellement utilisées
            (vec1From/To, vec2From/To) et les indices à mettre en évidence (highlightIdx) pour
            que gen-cinematique.js / gen-cinematique-jsx.js n'aient jamais à retester `method`.
   Retourne {ok:false, failReason} si moins de 3 points ('notEnoughPoints'), calibration
   dégénérée ('badCalib') ou iIdx hors de [iMin, Mlist.length-3] ('badIndex', avec iMin/iMax),
   sinon l'objet complet consommé par gen-cinematique.js et cinematique-ui.js. */
function cinComputeAll(points, calib, dt, iIdx, method) {
  method = (method === 'symetrique') ? 'symetrique' : 'apres';
  if (!points || points.length < 3) {
    return { ok: false, failReason: 'notEnoughPoints' };
  }
  var dx = calib ? calib.x2 - calib.x1 : 0, dy = calib ? calib.y2 - calib.y1 : 0;
  var pxDist = Math.sqrt(dx * dx + dy * dy);
  if (!calib || !(calib.realDist > 0) || pxDist <= 0) {
    return { ok: false, failReason: 'badCalib' };
  }

  var Mlist = cinPointsToMeters(points, calib);
  var iMin = (method === 'symetrique') ? 1 : 0;
  var iMax = Mlist.length - 3;
  if (isNaN(iIdx) || iIdx < iMin || iIdx > iMax) {
    return { ok: false, failReason: 'badIndex', iIdx: iIdx, iMin: iMin, iMax: iMax };
  }

  var vec1From, vec1To, vec2From, vec2To, divisor, highlightIdx;
  if (method === 'symetrique') {
    vec1From = iIdx - 1; vec1To = iIdx + 1;
    vec2From = iIdx; vec2To = iIdx + 2;
    divisor = 2 * dt;
    highlightIdx = [iIdx - 1, iIdx, iIdx + 1, iIdx + 2];
  } else {
    vec1From = iIdx; vec1To = iIdx + 1;
    vec2From = iIdx + 1; vec2To = iIdx + 2;
    divisor = dt;
    highlightIdx = [iIdx, iIdx + 1, iIdx + 2];
  }

  var vi = [(Mlist[vec1To][0] - Mlist[vec1From][0]) / divisor, (Mlist[vec1To][1] - Mlist[vec1From][1]) / divisor];
  var vip1 = [(Mlist[vec2To][0] - Mlist[vec2From][0]) / divisor, (Mlist[vec2To][1] - Mlist[vec2From][1]) / divisor];
  var dv = [vip1[0] - vi[0], vip1[1] - vi[1]];
  var vi_norm = Math.hypot(vi[0], vi[1]);
  var vip1_norm = Math.hypot(vip1[0], vip1[1]);

  // Boundingbox Phase 1 : extents réels des points digitalisés + marge.
  var xs = Mlist.map(function (m) { return m[0]; });
  var ys = Mlist.map(function (m) { return m[1]; });
  var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
  var ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
  var margin = Math.max(xmax - xmin, ymax - ymin, 0.1) * 0.25;
  xmin -= margin; xmax += margin; ymin -= margin; ymax += margin;

  // kv : facteur d'échelle d'AFFICHAGE des vecteurs vitesse en Phase 2 (n'affecte
  // jamais vi/vip1/dv notés) — sans lui, la longueur des flèches (norme en m/s,
  // souvent bien plus grande que l'espacement inter-points pour un petit Δt)
  // écraserait visuellement les points Mi/Mi+1/Mi+2 sur le schéma.
  var totalSpacing = 0;
  for (var k = 0; k < Mlist.length - 1; k++) {
    totalSpacing += Math.hypot(Mlist[k + 1][0] - Mlist[k][0], Mlist[k + 1][1] - Mlist[k][1]);
  }
  var espacementMoyen = (Mlist.length > 1) ? totalSpacing / (Mlist.length - 1) : 1;
  var K = 3;
  var maxNorm = Math.max(vi_norm, vip1_norm) || 1;
  var kv = K * espacementMoyen / maxNorm;

  return {
    ok: true, Mlist: Mlist, iIdx: iIdx, iMin: iMin, iMax: iMax, method: method,
    vec1From: vec1From, vec1To: vec1To, vec2From: vec2From, vec2To: vec2To,
    divisor: divisor, highlightIdx: highlightIdx,
    vi: vi, vip1: vip1, dv: dv, vi_norm: vi_norm, vip1_norm: vip1_norm,
    xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax,
    kv: kv, espacementMoyen: espacementMoyen,
    echelle: calib.realDist / pxDist
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cinPointsToMeters: cinPointsToMeters, cinComputeAll: cinComputeAll };
}
