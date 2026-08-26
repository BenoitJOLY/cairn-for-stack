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

// ── GÉNÉRATEUR "Incertitude" (physique-chimie) — helpers Maxima purs ──
// Une fonction par variante (LOI 2 : isolation), aucune ne dépend d'une
// variable calculée par une autre — chacune reçoit (X, p) et retourne un
// fragment de <questionvariables> autonome, suffixé q${X}_*.
// Assemblage/orchestration : js/gen-incertitude.js (genIncertitudeCore).

// ── TYPE A (statistique) : moyenne, écart-type échantillon, incertitude-type A ──
function _incTypeAVars(X, p) {
  var a = p.typeA || {};
  var mode = a.mode || 'manuel';
  var listCode;
  if (mode === 'aleatoire') {
    var moy = a.moyenneVraie, sig = a.ecartTypePop, n = a.n, d = a.decimales;
    if (moy === undefined || moy === '' || sig === undefined || sig === '' || !n) {
      throw new Error('Type A (aléatoire) : moyenne cible, écart-type cible et n sont obligatoires.');
    }
    d = (d === undefined || d === '' || isNaN(d)) ? 2 : Math.max(0, Math.min(4, parseInt(d)));
    // Bruit uniforme calibré sur [-amp,amp] avec amp=sigma*sqrt(3), seule façon
    // d'obtenir une variance d'échantillon EXACTEMENT égale à sig^2 sans générateur
    // gaussien natif en Maxima STACK (signalé à l'utilisateur — pas une vraie loi normale).
    // q${X}_amp est irrationnel (sqrt(3)) : le bruit entier/10^d généré ci-dessous
    // tombe bien sur la grille à d décimales, mais moy-amp+bruit n'y tombe QUE si on
    // arrondit explicitement la somme finale — sinon les mesures héritent de la
    // pleine précision float (bug signalé : 10 chiffres après la virgule).
    listCode = `ri${X}(a,b):=a+rand(b-a+1);
q${X}_amp:float(${sig}*sqrt(3));
q${X}_scaleN${X}:round(2*q${X}_amp*10^${d});
q${X}_L:makelist(float(round((${moy}-q${X}_amp+ri${X}(0,q${X}_scaleN${X})/10^${d})*10^${d})/10^${d}),i,1,${n});`;
  } else {
    var data = (a.data || []).slice();
    if (data.length < 2) throw new Error('Type A (manuel) : au moins 2 mesures sont nécessaires.');
    listCode = `q${X}_L:[${data.join(',')}];`;
  }
  return `/* Q${X} Incertitude - Type A (${mode}) */
${listCode}
q${X}_n:length(q${X}_L);
q${X}_moy:float(mean(q${X}_L));
q${X}_s:float(sqrt(sum((q${X}_L[i]-q${X}_moy)^2,i,1,q${X}_n)/(q${X}_n-1)));
q${X}_uA:float(q${X}_s/sqrt(q${X}_n));`;
}

// ── TYPE B (instrumentale) : 4 sources d'erreur, une formule chacune ──
function _incTypeBVars(X, p) {
  var b = p.typeB || {};
  var source = b.source || 'resolution';
  var code;
  if (source === 'resolution') {
    if (b.q === undefined || b.q === '') throw new Error('Type B (résolution) : la résolution/digit (q) est obligatoire.');
    code = `q${X}_uB:float(${b.q}/sqrt(12));`;
  } else if (source === 'tolerance') {
    if (b.delta === undefined || b.delta === '') throw new Error('Type B (tolérance) : la tolérance constructeur (Δ) est obligatoire.');
    code = `q${X}_uB:float(${b.delta}/sqrt(3));`;
  } else if (source === 'calibration') {
    if (b.ucert === undefined || b.ucert === '' || b.kcert === undefined || b.kcert === '') {
      throw new Error('Type B (calibration) : Ucertificat et kcertificat sont obligatoires.');
    }
    code = `q${X}_uB:float(${b.ucert}/${b.kcert});`;
  } else if (source === 'impose') {
    if (b.valeur === undefined || b.valeur === '') throw new Error('Type B (valeur imposée) : uB est obligatoire.');
    code = `q${X}_uB:float(${b.valeur});`;
  } else if (source === 'propagation') {
    // La source 'propagation' ne passe plus par ce chemin : c'est
    // _incPropagationVars() qui la génère intégralement (voir plus bas), appelée par
    // genIncertitudeCore() à la place de _incTypeAVars+_incTypeBVars.
    throw new Error('Type B : la source "propagation" est gérée par _incPropagationVars, pas par _incTypeBVars.');
  } else {
    throw new Error('Type B : source d’erreur inconnue (' + source + ').');
  }
  return `/* Q${X} Incertitude - Type B (${source}) */\n${code}`;
}

// ── GRANDEUR COMPOSÉE (propagation par dérivation partielle) ──
// L'enseignant fournit la formule symbolique de Y (ex. T=2*%pi*sqrt(L/g)) et, pour
// chaque grandeur intervenant dedans, un symbole + une valeur + une incertitude
// (littéraux profs, jamais randomisés). u(Y) est obtenue par la loi de propagation
// des incertitudes générale (GUM) : u(Y)=sqrt(Σ (∂Y/∂Xi)²·u(Xi)²), calculée en Maxima
// via diff() — précédent déjà établi dans gen-math-calcul.js/gen-acidebase.js, donc
// pas d'improvisation CAS (Règle 0 DSTU). Les symboles ne sont JAMAIS assignés
// directement (pas de "L:12") : seulement substitués via ev(...) au moment de
// l'évaluation, pour que diff() reste valide sur l'expression symbolique.
// q${X}_moy réutilise le slot "moyenne" du pipeline Type A (= Y0) et q${X}_uA est
// forcé à 0 pour que q${X}_uc=sqrt(uA²+uB²)=uB=u(Y) sans toucher _incRoundingVars/
// _incFinalRegex/l'étape "uc" en aval.
function _incPropagationVars(X, p) {
  var b = p.typeB || {};
  var formula = (b.formula || '').trim();
  if (!formula) throw new Error('Grandeur composée : la formule de Y est obligatoire.');
  var terms = (b.propTerms || []).filter(function (t) {
    return t && t.symbole !== '' && t.symbole !== undefined && t.valeur !== '' && t.valeur !== undefined && t.incertitude !== '' && t.incertitude !== undefined;
  });
  if (terms.length < 1) throw new Error('Grandeur composée : ajoutez au moins une grandeur (symbole + valeur + incertitude).');
  var idRe = /^[A-Za-z][A-Za-z0-9_]*$/;
  var seen = {};
  terms.forEach(function (t) {
    if (!idRe.test(t.symbole)) throw new Error('Grandeur composée : "' + t.symbole + '" n’est pas un symbole valide (lettres/chiffres/_, doit commencer par une lettre).');
    if (seen[t.symbole]) throw new Error('Grandeur composée : le symbole "' + t.symbole + '" est utilisé plusieurs fois.');
    seen[t.symbole] = true;
  });
  var subst = terms.map(function (t) { return `${t.symbole}=${t.valeur}`; }).join(',');
  var sumSq = terms.map(function (t) {
    return `ev(diff(q${X}_Yexpr,${t.symbole}),${subst})^2*(${t.incertitude})^2`;
  }).join('+');
  // Coefficient d'élasticité (Xi/Y0)·∂Y/∂Xi de chaque grandeur, réutilisé par
  // gen-incertitude.js pour afficher la formule relative "prête à l'emploi"
  // (u(Y)/Y=√(Σ(ci·u(Xi)/Xi)²)) sans que l'élève ait à dériver — même
  // dérivée partielle que sumSq ci-dessus, juste réexprimée en relatif.
  var pdVars = (b.formulaMode === 'pret')
    ? '\n' + terms.map(function (t) {
        return `q${X}_pd_${t.symbole}:float(ev(diff(q${X}_Yexpr,${t.symbole}),${subst})*(${t.valeur})/q${X}_moy);`;
      }).join('\n')
    : '';
  return `/* Q${X} Incertitude - Grandeur composée (propagation par dérivation partielle) */
q${X}_Yexpr:(${formula});
q${X}_moy:float(ev(q${X}_Yexpr,${subst}));
q${X}_uA:0;
q${X}_uB:float(sqrt(${sumSq}));${pdVars}`;
}

// ── ARRONDI GUM : composition, élargissement, chiffres significatifs ──
function _incRoundingVars(X, p) {
  var r = p.rounding || {};
  var sigfig = (parseInt(r.sigfig) === 2) ? 2 : 1;
  var roundup = !!r.roundup;
  var roundFn = roundup ? `ceiling` : `round`;
  var k, kNote;
  if (r.studentEnabled) {
    // n est un littéral connu côté JS (jamais un q${X}_n randomisé) : le
    // coefficient de Student est résolu ici et injecté en dur, cf. commentaire
    // de gen-incertitude-student.js (Règle 0 DSTU, pas de load(distrib) CAS).
    var a = p.typeA || {};
    var n = (a.mode === 'aleatoire') ? parseInt(a.n) : (a.data || []).length;
    k = _incStudentFactor(n, r.confidence);
    kNote = `, facteur de Student t(ν=${_incStudentDf(n)}, ${_incStudentConfidence(r.confidence)}%)`;
  } else {
    k = (parseInt(r.k) === 2) ? 2 : 1;
    kNote = '';
  }
  return `/* Q${X} Incertitude - Composition + arrondi GUM (${sigfig} c.s.${roundup ? ', arrondi par exc\xe8s' : ''}${kNote}) */
q${X}_k:${k};
q${X}_uc:float(sqrt(q${X}_uA^2+q${X}_uB^2));
q${X}_U_brut:float(q${X}_k*q${X}_uc);
q${X}_exp:floor(log(q${X}_U_brut)/log(10))-(${sigfig}-1);
q${X}_scale:float(10^q${X}_exp);
q${X}_U:float(${roundFn}(q${X}_U_brut/q${X}_scale)*q${X}_scale);
q${X}_moy_r:float(round(q${X}_moy/q${X}_scale)*q${X}_scale);`;
}

// ── ÉCRITURE FINALE (format "encadrement" uniquement) : formatage décimal exact
// (sans string() natif, peu fiable sur les zéros terminaux) + regex tolérante
// construite caractère par caractère (même parade qu'au bug de double-substitution
// de regexify_nom() dans js/gen-nomenclature.js : jamais de ssubst séquentiel sur
// les mêmes caractères). Le format "pm" n'utilise plus cette fonction : suite à un
// bug regex confirmé 2x en prod, il repose désormais sur 2 champs natifs STACK
// (units si une unité est définie, sinon NumAbsolute — cf. _ecrPmDefs() dans
// js/gen-incertitude-steps.js).
function _incFinalRegex(X, p, deps) {
  deps = deps || {};
  var escFn = deps.escapeMaximaString || (typeof escapeMaximaString === 'function' ? escapeMaximaString : function(s){ return String(s); });
  var unit = ((p.context || {}).unite || '').trim();
  var symb = ((p.context || {}).symbole || '').trim() || 'x';
  var unitClause = unit ? `sconcat("\\\\s*",inc_esc${X}("${escFn(unit)}"))` : `""`;
  var unitLiteral = unit ? `," ","${escFn(unit)}"` : '';
  var helpers = `inc_pad${X}(n,width):=block([s],s:sconcat(n),while slength(s)<width do s:sconcat("0",s),s)$
inc_fmt${X}(val,nd):=block([sc,sg,ip,fp],
  sc:round(val*10^nd),sg:if sc<0 then "-" else "",sc:abs(sc),
  ip:floor(sc/10^nd),fp:sc-ip*10^nd,
  if nd=0 then sconcat(sg,ip) else sconcat(sg,ip,".",inc_pad${X}(fp,nd)))$
inc_esc${X}(s):=block([chars,out,c,sp],chars:charlist(s),out:"",
  sp:["\\\\",".","^","$","*","+","?","(",")","[","]","{","}","|","/"],
  for c in chars do out:if member(c,sp) then sconcat(out,"\\\\",c) else sconcat(out,c),
  out)$
q${X}_nd:max(0,-q${X}_exp);`;
  return `/* Q${X} Incertitude - Formatage GUM (d\xe9cimales fixes) + regex "\xe9criture finale" (encadrement) */
${helpers}
q${X}_inf_r:q${X}_moy_r-q${X}_U;
q${X}_sup_r:q${X}_moy_r+q${X}_U;
q${X}_inf_r_s:inc_fmt${X}(q${X}_inf_r,q${X}_nd);
q${X}_sup_r_s:inc_fmt${X}(q${X}_sup_r,q${X}_nd);
q${X}_ecr_regex:sconcat("(?i)^\\\\s*",inc_esc${X}(q${X}_inf_r_s),"\\\\s*<\\\\s*(",inc_esc${X}("${escFn(symb)}"),"\\\\s*<\\\\s*)?",inc_esc${X}(q${X}_sup_r_s),${unitClause},"\\\\s*$");
q${X}_ecr_attendue:sconcat(q${X}_inf_r_s," < ","${escFn(symb)}"," < ",q${X}_sup_r_s${unitLiteral});`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _incTypeAVars: _incTypeAVars, _incTypeBVars: _incTypeBVars, _incPropagationVars: _incPropagationVars, _incRoundingVars: _incRoundingVars, _incFinalRegex: _incFinalRegex };
}
