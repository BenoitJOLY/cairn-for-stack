function _mkFbGen(generalFeedback, fbGen) {
    return fbGen ? generalFeedback + `<p>${fbGen}</p>` : generalFeedback;
}

function _mkInput(o) {
    return `    <input>
      <name>${o.name}</name>
      <type>${o.type || 'algebraic'}</type>
      <tans>${o.tans}</tans>
      <boxsize>${o.boxsize || 15}</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint>${o.hint || ''}</syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords>${o.forbidwords || ''}</forbidwords>
      <allowwords>${o.allowwords || ''}</allowwords>
      <forbidfloat>${o.forbidfloat !== undefined ? o.forbidfloat : 1}</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>${o.checkanswertype || 0}</checkanswertype>
      <mustverify>${o.mustverify || 0}</mustverify>
      <showvalidation>${o.showvalidation !== undefined ? o.showvalidation : 2}</showvalidation>
      <options></options>
    </input>`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { _mkFbGen: _mkFbGen, _mkInput: _mkInput };
}

// ─── COMPLEXES ───────────────────────────────────────────────

