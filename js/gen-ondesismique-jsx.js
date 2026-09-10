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
   CAIRN FOR STACK — Ondes sismiques, scénario "vitesse-onde" :
   builder JSXGraph du sismogramme lisible. Suit le pattern
   "buildOscJSXCode_*(cfg)" de gen-oscilloscope.js / gen-cinematique-jsx.js :
   LA MÊME fonction sert à générer le JS de l'export XML (cfg.tarrExpr/
   cfg.heureSecExpr portent les placeholders STACK "{#q${X}_sis_tarr#}" /
   "{#q${X}_sis_heuresec#}") et celui de l'aperçu simulé (littéraux
   numériques, tirés côté JS) — voir preview-ondesismique.js. Retourne le
   bloc [[jsxgraph]]...[[/jsxgraph]] complet, pas seulement le corps JS.

   Axe des temps = une VRAIE heure locale (comme un sismogramme réel), pas
   un axe relatif "t (s)" démarrant à 0 : cfg.heureSecExpr donne l'heure du
   séisme en secondes depuis minuit (synchronisée avec le texte {@heure@}
   de l'énoncé via q${X}_sis_heureprofils, cf. gen-ondesismique-calc.js).
   En interne, le tracé reste calculé sur un axe relatif [0, xMax] (le
   paquet d'onde démarre à t = tarr, comme avant) ; seules les étiquettes
   de graduation sont reformatées en heure absolue (heureSec + t), via
   fmtClock(). L'élève lit ainsi une heure d'arrivée, pas un simple nombre
   de secondes, et doit la soustraire à l'heure du séisme — fidèle au geste
   réel de lecture d'un sismogramme.

   Le tracé : un bruit de fond déterministe (somme de sinus, pas de
   Math.random() dans functiongraph — sinon le tracé "flickerait" à
   chaque bd.update()) suivi d'un paquet d'onde amorti démarrant
   exactement à t = tarr (valeur "ronde", alignée sur une graduation),
   ce qui rend la lecture de l'heure d'arrivée non ambiguë.

   Pièges JSXGraph respectés (DSTU pôle 6) : tout create('text', ...)
   reçoit une fonction (jamais une chaîne), tout élément fixed:true reçoit
   aussi visible:true explicite, pas d'id="..." explicite sur [[jsxgraph]]
   (on utilise la variable implicite `divid`). Les étiquettes d'heure sont
   créées dans une boucle for : chaque position/texte dépend de l'indice de
   graduation `k`, donc capturée via une IIFE par itération (sinon toutes
   les closures partageraient la dernière valeur de `k`).
   ══════════════════════════════════════════════════════════════ */
function _sisSeismogramJSX(cfg) {
  var xMax = cfg.xMax, step = cfg.tickStep;
  var W = (cfg.width || 700) + 'px', H = (cfg.height || 300) + 'px';
  return '[[jsxgraph width="' + W + '" height="' + H + '"]]\n'
    + '(function(){\n'
    + 'var tarr=parseFloat("' + cfg.tarrExpr + '");\n'
    + 'var heureSec=parseFloat("' + cfg.heureSecExpr + '");\n'
    + 'var xMax=' + xMax + ', step=' + step + ';\n'
    + 'function pad2(n){ n=Math.floor(n); return (n<10?"0":"")+n; }\n'
    + 'function fmtClock(totalSec){\n'
    + '  totalSec=((totalSec%86400)+86400)%86400;\n'
    + '  var h=Math.floor(totalSec/3600); var rem=totalSec-h*3600;\n'
    + '  var m=Math.floor(rem/60); var s=rem-m*60;\n'
    + '  var sR=Math.round(s*1000)/1000;\n'
    + '  var sStr=(sR<10?"0":"")+(Number.isInteger(sR)?sR.toFixed(0):sR.toFixed(3));\n'
    + '  return pad2(h)+"h"+pad2(m)+"min"+sStr+"s";\n'
    + '}\n'
    + 'var bd=JXG.JSXGraph.initBoard(divid,{axis:false,showCopyright:false,showNavigation:false,'
    + 'boundingbox:[-xMax*0.04,1.7,xMax*1.04,-1.7],keepaspectratio:false});\n'
    + 'bd.create("segment",[[0,0],[xMax,0]],{strokeColor:"#334155",strokeWidth:1.3,fixed:true,visible:true,highlight:false,layer:1});\n'
    + 'for(var k=0;k<=xMax;k+=step){\n'
    + '  bd.create("segment",[[k,-1.6],[k,1.6]],{strokeColor:"#e5e7eb",strokeWidth:1,fixed:true,visible:true,highlight:false,layer:1});\n'
    + '  (function(kk){\n'
    + '    bd.create("text",[function(){return kk;},function(){return -1.85;},function(){return fmtClock(heureSec+kk);}],\n'
    + '      {fixed:true,visible:true,anchorX:"middle",fontSize:10.5,color:"#475569",highlight:false});\n'
    + '  })(k);\n'
    + '}\n'
    + 'function noiseAt(t){return 0.05*Math.sin(t*13.7)+0.035*Math.sin(t*5.3+1)+0.045*Math.sin(t*29.1+2);}\n'
    + 'function packet(t){var u=t-tarr; if(u<0) return 0; var env=Math.exp(-u/(xMax*0.16)); return env*(0.9*Math.sin(u*1.3)+0.4*Math.sin(u*3.1+0.5));}\n'
    + 'function seisSig(t){return noiseAt(t)+packet(t);}\n'
    + 'bd.create("functiongraph",[seisSig,0,xMax],{strokeColor:"#0f766e",strokeWidth:2,layer:3,highlight:false,fixed:true,visible:true,numberPoints:900,doAdvancedPlot:false});\n'
    + 'bd.create("text",[function(){return xMax*0.015;},function(){return 1.5;},function(){return "Amplitude";}],{fixed:true,visible:true,color:"#6b7280",fontSize:12,highlight:false});\n'
    + 'bd.create("text",[function(){return xMax*0.5;},function(){return -1.5;},function(){return "Heure locale";}],{fixed:true,visible:true,anchorX:"middle",color:"#6b7280",fontSize:12,highlight:false});\n'
    + '})();\n[[/jsxgraph]]';
}

/* _sisComputeGraphBounds : calcule xMax/tickStep à partir de la liste
   (JS, brute — string "40,60,80,...") des dates d'arrivée configurées par
   l'enseignant. Pas de dépendance Maxima : ce sont des bornes de tracé
   fixes, identiques pour toutes les variantes d'une même question. */
function _sisComputeGraphBounds(arrListRaw) {
  var nums = String(arrListRaw || '').split(',')
    .map(function (s) { return parseFloat(s.trim()); })
    .filter(function (n) { return !isNaN(n) && n > 0; });
  var tickStep = 20;
  var maxVal = nums.length ? Math.max.apply(null, nums) : 160;
  var xMax = Math.ceil((maxVal * 1.3) / tickStep) * tickStep;
  if (xMax <= maxVal) xMax += tickStep;
  return { xMax: xMax, tickStep: tickStep };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _sisSeismogramJSX: _sisSeismogramJSX, _sisComputeGraphBounds: _sisComputeGraphBounds };
}
