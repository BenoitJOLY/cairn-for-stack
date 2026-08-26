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

// ── XML GENERATORS (checkbox, pool, alg, num, units, str, cw) ───

// ══════════════════════════════════════════════════════
// Couleurs/fond puisés dans js/fb-box.js (styles configurables via la modale
// Options, cf. chantier "Encadrés de feedback PRT configurables") quand ce
// module est chargé (navigateur) ; repli sur les couleurs historiques sinon
// (tests Node, où fb-box.js n'est pas require()). Volontairement pas d'icône
// ni de changement de comportement sur html vide : beaucoup d'appelants
// (FB_JUSTE_DEFAULT/FB_FAUX_DEFAULT) incluent déjà leur propre icône.
function wrapFb(html,ok){
  const kind = ok ? 'true' : 'false';
  const s = (typeof getFbBoxStyles === 'function') ? getFbBoxStyles()[kind] : null;
  const col = s ? s.color : (ok?'#15803d':'#dc2626');
  const bg = s ? s.bg : (ok?'#f0fdf4':'#fff0f0');
  return `<div style="border-left:4px solid ${col};padding:10px 14px;background:${bg};border-radius:4px;margin:4px 0;">${html||'&nbsp;'}</div>`;
}

// ── Feedbacks détaillés par mode (Algébrique) : textes par défaut, éditables ──
// Contenu volontairement en texte brut (pas de <div> encadré, pas d'icône) : l'encadré
// coloré est appliqué uniquement au moment de l'aperçu/export via applyFbBox() (js/fb-box.js),
// jamais stocké comme valeur par défaut d'un champ édité par l'enseignant.
const ALG_FB_DEFS = {
  'developpement': [
    {key:'partial',  label:'⚠️ Correct mais non réduit',
     def:'<strong>Calcul correct mais non réduit.</strong> Votre expression est algébriquement correcte, mais vous devez regrouper les termes semblables.'},
    {key:'errsigne', label:'❌ Erreur de signe détectée',
     def:'<strong>Attention au signe !</strong> Votre expression n\'est pas exacte. Vérifiez la distribution du signe moins devant les parenthèses — il s\'applique à <em>tous</em> les termes.'}
  ],
  'factorisation': [
    {key:'partial', label:'⚠️ Correct mais non factorisé au maximum',
     def:'<strong>Calcul correct mais incomplet.</strong> Votre expression est correcte, mais elle n\'est pas factorisée au maximum. Pensez à extraire les facteurs communs numériques.'}
  ],
  'fraction': [
    {key:'partial', label:'⚠️ Correct mais non simplifié au maximum',
     def:'<strong>Calcul correct mais non simplifié.</strong> Votre expression est correcte, mais vous pouvez encore simplifier en factorisant numérateur et dénominateur.'}
  ],
  'expert': [
    {key:'partial',  label:'⚠️ Correct mais non réduit',
     def:'<strong>Calcul correct mais non réduit.</strong> Votre expression est algébriquement correcte, mais vous devez regrouper les termes semblables.'},
    {key:'errsigne', label:'❌ Erreur de signe détectée',
     def:'<strong>Attention au signe !</strong> Votre expression n\'est pas exacte. Vérifiez la distribution du signe moins devant les parenthèses — il s\'applique à <em>tous</em> les termes.'}
  ]
};

function _algFbId(mode, key) { return 'alg-fb-' + mode + '-' + key; }

function _algFb(mode, key) {
  const defs = ALG_FB_DEFS[mode] || [];
  const d = defs.find(x => x.key === key);
  const fallback = d ? d.def : '';
  const el = document.getElementById(_algFbId(mode, key));
  return (el && el.value.trim()) ? el.value : fallback;
}

function sanitizeMaxima(s){
  return s
    .replace(/−/g,'-')  // − MINUS SIGN → tiret ASCII
    .replace(/×/g,'*')  // × MULTIPLICATION SIGN → *
    .replace(/÷/g,'/')  // ÷ DIVISION SIGN → /
    .replace(/·/g,'*')  // · MIDDLE DOT → *
    .replace(/∗/g,'*')  // ∗ ASTERISK OPERATOR → *
    .replace(/⋅/g,'*')  // ⋅ DOT OPERATOR → *
    .replace(/∕/g,'/')  // ∕ DIVISION SLASH → /
    .replace(/⁡/g,'')   // ⁡ FUNCTION APPLICATION (invisible) → supprimé
    .replace(/­/g,'');  // ­ SOFT HYPHEN → supprimé
}

function algPrtNodeCanonical(X,n,test,sans,tans,opts,trueNext,trueScore,falseNext,falseScore,trueFb,falseFb,trueNote,falseNote,desc){
  return {
    name: String(n), description: desc||'', answertest: test, sans: sans, tans: tans,
    testoptions: opts||'', quiet: '0',
    truescoremode: '=', truescore: String(trueScore), truepenalty: '', truenextnode: String(trueNext),
    trueanswernote: trueNote||('PRT-'+X+'-'+n+'-T'), truefeedback: trueFb||'',
    falsescoremode: '=', falsescore: String(falseScore), falsepenalty: '', falsenextnode: String(falseNext),
    falseanswernote: falseNote||('PRT-'+X+'-'+n+'-F'), falsefeedback: falseFb||''
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { wrapFb: wrapFb, sanitizeMaxima: sanitizeMaxima, algPrtNodeCanonical: algPrtNodeCanonical };
}
