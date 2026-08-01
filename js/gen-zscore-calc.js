// ── GÉNÉRATEUR "Z-score" (compatibilité métrologique) — helper Maxima pur ──
// z = |x_mesuré - x_référence| / u_c. Toutes les entrées sont des littéraux
// fournis par le prof (jamais randomisés, cf. décision utilisateur : MVP en
// valeur fixe uniquement) — même logique que la source Type B "impose" du
// type incertitude (gen-incertitude-calc.js) : le calcul reste en Maxima,
// mais avec des nombres en dur, pour cohérence de style et pour que la
// notation NumRelative/NumAbsolute du PRT reste possible.
function _zsVars(X, p) {
  var g = p.grandeurs || {};
  if (g.xMes === undefined || g.xMes === '') throw new Error('Z-score : la valeur mesurée x_mesuré est obligatoire.');
  if (g.xRef === undefined || g.xRef === '') throw new Error('Z-score : la valeur de référence x_référence est obligatoire.');
  if (g.uc === undefined || g.uc === '' || parseFloat(g.uc) <= 0) throw new Error('Z-score : l’incertitude combinée u_c est obligatoire et doit être positive.');
  return `/* Q${X} Z-score - compatibilité métrologique */
q${X}_xmes:float(${g.xMes});
q${X}_xref:float(${g.xRef});
q${X}_uc:float(${g.uc});
q${X}_z:float(abs(q${X}_xmes-q${X}_xref)/q${X}_uc);`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { _zsVars: _zsVars };
}
