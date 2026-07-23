// ── XML GENERATORS (checkbox, pool, alg, num, units, str, cw) ───

// ══════════════════════════════════════════════════════
function wrapFb(html,ok){const col=ok?'#15803d':'#dc2626';const bg=ok?'#f0fdf4':'#fff0f0';return `<div style="border-left:4px solid ${col};padding:10px 14px;background:${bg};border-radius:4px;margin:4px 0;">${html||'&nbsp;'}</div>`;}

// ── Feedbacks détaillés par mode (Algébrique) : textes par défaut, éditables ──
const ALG_FB_DEFS = {
  'developpement': [
    {key:'partial',  label:'⚠️ Correct mais non réduit',
     def:'<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠ <strong>Calcul correct mais non réduit.</strong> Votre expression est algébriquement correcte, mais vous devez regrouper les termes semblables.</div>'},
    {key:'errsigne', label:'❌ Erreur de signe détectée',
     def:'<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">❌ <strong>Attention au signe !</strong> Votre expression n\'est pas exacte. Vérifiez la distribution du signe moins devant les parenthèses — il s\'applique à <em>tous</em> les termes.</div>'}
  ],
  'factorisation': [
    {key:'partial', label:'⚠️ Correct mais non factorisé au maximum',
     def:'<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠ <strong>Calcul correct mais incomplet.</strong> Votre expression est correcte, mais elle n\'est pas factorisée au maximum. Pensez à extraire les facteurs communs numériques.</div>'}
  ],
  'fraction': [
    {key:'partial', label:'⚠️ Correct mais non simplifié au maximum',
     def:'<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠ <strong>Calcul correct mais non simplifié.</strong> Votre expression est correcte, mais vous pouvez encore simplifier en factorisant numérateur et dénominateur.</div>'}
  ],
  'expert': [
    {key:'partial',  label:'⚠️ Correct mais non réduit',
     def:'<div style="border-left:4px solid #eab308;padding:10px 14px;background:#fefce8;border-radius:4px;">⚠ <strong>Calcul correct mais non réduit.</strong> Votre expression est algébriquement correcte, mais vous devez regrouper les termes semblables.</div>'},
    {key:'errsigne', label:'❌ Erreur de signe détectée',
     def:'<div style="border-left:4px solid #f97316;padding:10px 14px;background:#fff7ed;border-radius:4px;">❌ <strong>Attention au signe !</strong> Votre expression n\'est pas exacte. Vérifiez la distribution du signe moins devant les parenthèses — il s\'applique à <em>tous</em> les termes.</div>'}
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
