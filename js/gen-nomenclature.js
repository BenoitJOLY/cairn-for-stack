// ── XML GENERATOR: nomenclature (Physique-Chimie) ──
// Un seul chip "Nomenclature", 3 modes internes (mode Fixe/Aléatoire/Checkbox-groupes),
// portés depuis les 3 gabarits STACK autonomes validés en Maxima réel :
//   test/mise à jour/Physique-chimie/nomenclature/nomenclature-type{1,2,3}-*.xml
// Toutes les variables Maxima sont suffixées par ${X} (Loi 2 : pas de variable
// partagée entre chips d'une même question combinée).

// Pool de molécules pour le mode Aléatoire (98 entrées, identique à la variable
// Maxima "donnes" du gabarit Type 1). Sert aussi côté JS à peupler le menu
// déroulant "Famille" du panneau de config.
const NOM_DONNES = [
["Alcanes", "Méthane", "C"],
["Alcanes", "Éthane", "CC"],
["Alcanes", "Propane", "CCC"],
["Alcanes", "Butane", "CCCC"],
["Alcanes", "Pentane", "CCCCC"],
["Alcanes", "Hexane", "CCCCCC"],
["Alcanes", "2-Méthylpropane", "CC(C)C"],
["Alcanes", "2-Méthylbutane", "CC(C)CC"],
["Alcanes", "2,2-Diméthylpropane", "C(C)(C)C"],
["Alcanes", "2-Méthylpentane", "CC(C)CCC"],
["Alcanes", "3-Méthylpentane", "CCC(C)CC"],
["Alcanes", "2,2-Diméthylbutane", "CC(C)(C)C"],
["Alcanes", "2,3-Diméthylbutane", "CC(C)C(C)"],
["Alcools", "Méthanol", "CO"],
["Alcools", "Éthanol", "CCO"],
["Alcools", "Propan-1-ol", "CCCO"],
["Alcools", "Butan-1-ol", "CCCCO"],
["Alcools", "Pentan-1-ol", "CCCCCO"],
["Alcools", "Hexan-1-ol", "CCCCCCO"],
["Alcools", "Propan-2-ol", "CC(O)C"],
["Alcools", "Butan-2-ol", "CC(O)CC"],
["Alcools", "2-Méthylpropan-1-ol", "CC(C)O"],
["Alcools", "2-Méthylpropan-2-ol", "CC(C)(C)O"],
["Alcools", "Pentan-2-ol", "CC(O)CCC"],
["Alcools", "Pentan-3-ol", "CCC(O)CC"],
["Alcools", "2-Méthylbutan-1-ol", "CC(C)CCO"],
["Alcools", "3-Méthylbutan-1-ol", "CCC(C)CO"],
["Alcools", "2-Méthylbutan-2-ol", "CC(C)(O)CC"],
["Alcools", "3-Méthylbutan-2-ol", "CCC(O)C(C)"],
["Alcools", "Cyclopropanol", "C1C(O)C1"],
["Alcools", "Cyclobutanol", "C1CC(O)C1"],
["Alcools", "Cyclopentanol", "C1CCC(O)C1"],
["Alcools", "Cyclohexanol", "C1CCCC(O)C1"],
["Aldéhydes", "Méthanal", "C=O"],
["Aldéhydes", "Éthanal", "CC=O"],
["Aldéhydes", "Propanal", "CCC=O"],
["Aldéhydes", "Butanal", "CCCC=O"],
["Aldéhydes", "Pentanal", "CCCCC=O"],
["Aldéhydes", "Hexanal", "CCCCCC=O"],
["Aldéhydes", "2-Méthylpropanal", "C(C=O)(C)C"],
["Aldéhydes", "2-Méthylbutanal", "C(C=O)(C)CC=O"],
["Aldéhydes", "3-Méthylbutanal", "C(C=O)C(C)C"],
["Aldéhydes", "2,2-Diméthylpropanal", "C(C=O)(C)(C)C"],
["Aldéhydes", "2-Éthylbutanal", "C(C=O)(CC)CC"],
["Aldéhydes", "2,3-Diméthylbutanal", "C(C=O)(C)C(C)C"],
["Alcènes", "Éthène", "C=C"],
["Alcènes", "Propène", "CC=C"],
["Alcènes", "But-1-ène", "CCC=C"],
["Alcènes", "(E) But-2-ène", "C/C=C\\C"],
["Alcènes", "(Z) But-2-ène", "C/C=C/C"],
["Alcènes", "Pent-1-ène", "CCCC=C"],
["Alcènes", "(E) Pent-2-ène", "CC/C=C\\C"],
["Alcènes", "(Z) Pent-2-ène", "CC/C=C/C"],
["Alcènes", "Hex-1-ène", "CCCCC=C"],
["Alcènes", "(E) Hex-3-ène", "CC/C=C\\CC"],
["Alcènes", "(Z) Hex-3-ène", "CC/C=C/CC"],
["Alcènes", "(E) Hex-2-ène", "CCC/C=C\\C"],
["Alcènes", "(Z) Hex-2-ène", "CCC/C=C/C"],
["Cétones", "Propanone", "CC(=O)C"],
["Cétones", "Butan-2-one", "CCC(=O)C"],
["Cétones", "Pentan-2-one", "CCCC(=O)C"],
["Cétones", "Pentan-3-one", "CCC(=O)CC"],
["Cétones", "Hexan-2-one", "CCCCC(=O)C"],
["Cétones", "Hexan-3-one", "CCCC(=O)CC"],
["Cétones", "3-Méthylbutan-2-one", "CC(C)C(=O)C"],
["Cétones", "3,3-Diméthylbutan-2-one", "CC(C)(C)C(=O)C"],
["Cétones", "Cyclopropanone", "C1CC1=O"],
["Cétones", "Cyclobutanone", "C1CCC1=O"],
["Cétones", "Cyclopentanone", "C1CCCC1=O"],
["Cétones", "Cyclohexanone", "C1CCCCC1=O"],
["Acides carboxyliques", "Acide méthanoïque", "C(=O)O"],
["Acides carboxyliques", "Acide éthanoïque", "CC(=O)O"],
["Acides carboxyliques", "Acide propanoïque", "CCC(=O)O"],
["Acides carboxyliques", "Acide butanoïque", "CCCC(=O)O"],
["Acides carboxyliques", "Acide pentanoïque", "CCCCC(=O)O"],
["Acides carboxyliques", "Acide hexanoïque", "CCCCCC(=O)O"],
["Acides carboxyliques", "Acide 2-méthylbutanoïque", "CCC(C)C(=O)O"],
["Acides carboxyliques", "Acide 3-méthylbutanoïque", "CC(C)CC(=O)O"],
["Acides carboxyliques", "Acide 2,2-diméthylpropanoïque", "CC(C)(C)C(=O)O"],
["Acides carboxyliques", "Acide 2-éthylbutanoïque", "CCC(CC)C(=O)O"],
["Acides carboxyliques", "Acide 2,3-diméthylbutanoïque", "CC(C)C(C)C(=O)O"],
["Acides carboxyliques", "Acide cyclopropanecarboxylique", "C1CC1C(=O)O"],
["Acides carboxyliques", "Acide cyclobutanecarboxylique", "C1CCC1C(=O)O"],
["Acides carboxyliques", "Acide cyclopentanecarboxylique", "C1CCCC1C(=O)O"],
["Acides carboxyliques", "Acide cyclohexanecarboxylique", "C1CCCCC1C(=O)O"],
["Esters", "Méthanoate de méthyle", "COC=O"],
["Esters", "Éthanoate d'éthyle", "CC(=O)OCC"],
["Esters", "Propanoate de méthyle", "CCC(=O)OC"],
["Esters", "Propanoate d'éthyle", "CCC(=O)OCC"],
["Esters", "Butanoate de méthyle", "CCCC(=O)OC"],
["Esters", "Butanoate d'éthyle", "CCCC(=O)OCC"],
["Esters", "Pentanoate de méthyle", "CCCCC(=O)OC"],
["Esters", "2-Méthylpropanoate de méthyle", "CC(C)C(=O)OC"],
["Esters", "2-Méthylpropanoate d'éthyle", "CC(C)C(=O)OCC"],
["Esters", "2-Méthylbutanoate de méthyle", "CC(C)CC(=O)OC"],
["Esters", "3-Méthylbutanoate d'éthyle", "CCC(C)C(=O)OCC"],
["Esters", "2,2-Diméthylpropanoate de méthyle", "CC(C)(C)C(=O)OC"],
["Esters", "2,2-Diméthylpropanoate d'éthyle", "CC(C)(C)C(=O)OCC"]
];

function _nomFamilies() {
  var set = {};
  NOM_DONNES.forEach(function(m){ set[m[0]] = true; });
  return Object.keys(set).sort(function(a,b){ return a.localeCompare(b, 'fr'); });
}

// Chaîne Maxima littérale ["Famille","Nom","SMILES"] pour toutes les entrées de NOM_DONNES.
// esc : fonction d'échappement Maxima injectée par l'appelant (deps.escapeMaximaString
// côté tests Node, global escapeMaximaString côté navigateur — cf. genNomenclatureCore).
function _nomDonnesMaximaLiteral(esc) {
  return '[' + NOM_DONNES.map(function(m){
    return '["' + esc(m[0]) + '","' + esc(m[1]) + '","' + esc(m[2]) + '"]';
  }).join(',') + ']';
}

function _nomIframe(X) {
  return '<iframe src="https://mon-domaine.com/viewer.html?smiles={@molecule_smiles_url' + X + '@}" width="300" height="300" style="border:0;" loading="lazy" title="Représentation de la molécule"></iframe>';
}

function _nomReadFormParams(){
  return {
    bareme: parseFloat(v('nom-bareme'))||1,
    text: richVal('nom-text'),
    mode: v('nom-mode')||'fixe',
    paramFamille: v('nom-param-famille')||'Toutes',
    paramCarbonesMax: v('nom-param-carbones-max'),
    fixeSmiles: v('nom-fixe-smiles'),
    fixeNom: v('nom-fixe-nom'),
    fixeFamille: v('nom-fixe-famille'),
    cbSmiles: v('nom-cb-smiles'),
    cbVrais: v('nom-cb-vrais'),
    cbFaux: v('nom-cb-faux'),
    fbGen: resolveFb('nom-fbgen', '')
  };
}

async function genNomenclature(X){
  const p = _nomReadFormParams();
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'nomenclature', X, params: p})
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Quota hebdomadaire atteint.');
    }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "nomenclature", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[stackforge] /api/generate injoignable pour "nomenclature", repli sur le calcul local.', e); }
  return genNomenclatureCore(X, p);
}

function _nomSplitList(str) {
  return String(str||'').split(',').map(function(s){return s.trim();}).filter(function(s){return s.length>0;});
}

/* genNomenclatureCore : fonction pure (aucun accès DOM), cf. js/gen-checkbox.js pour
   le pattern (deps injectables pour les tests Node — test/unit/gen-nomenclature.test.js). */
function genNomenclatureCore(X, p, deps){
  deps = deps || {};
  const buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  const escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;

  const bareme = p.bareme, text = p.text||'';
  const fbGen = p.fbGen||'';
  const banniere = `<div style="background:#0e7490;border-left:5px solid #155e75;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — Nomenclature chimique</strong>
        <span style="background:#155e75;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
      </div>`;

  const urlChain = () => `molecule_smiles_url${X} : molecule_smiles${X}$
molecule_smiles_url${X} : ssubst("%5C", "\\\\", molecule_smiles_url${X})$
molecule_smiles_url${X} : ssubst("%2F", "/", molecule_smiles_url${X})$
molecule_smiles_url${X} : ssubst("%28", "(", molecule_smiles_url${X})$
molecule_smiles_url${X} : ssubst("%29", ")", molecule_smiles_url${X})$
molecule_smiles_url${X} : ssubst("%3D", "=", molecule_smiles_url${X})$`;

  if (p.mode === 'aleatoire') {
    const paramFamille = escapeMaximaString_D(p.paramFamille || 'Toutes');
    const cmax = (p.paramCarbonesMax === '' || p.paramCarbonesMax == null) ? 'false' : (parseInt(p.paramCarbonesMax)||0);

    const vars = `/* Q${X} : Nomenclature - mode Aléatoire (${bareme}pt) */
param_famille${X} : "${paramFamille}"$
param_carbones_max${X} : ${cmax}$
donnes${X} : ${_nomDonnesMaximaLiteral(escapeMaximaString_D)}$
carbon_count${X}(s) := slength(s) - slength(ssubst("", "C", s))$
donnes_filtres${X} : sublist(donnes${X}, lambda([m], is((param_famille${X} = "Toutes" or m[1] = param_famille${X}) and (param_carbones_max${X} = false or carbon_count${X}(m[3]) <= param_carbones_max${X}))))$
filtre_vide${X} : is(length(donnes_filtres${X}) = 0)$
donnes_pool${X} : if filtre_vide${X} then donnes${X} else donnes_filtres${X}$
choix${X} : rand(length(donnes_pool${X}))+1$
molecule${X} : donnes_pool${X}[choix${X}]$
famille${X} : molecule${X}[1]$
nom${X} : molecule${X}[2]$
molecule_smiles${X} : molecule${X}[3]$
strip_accents${X}(s) := block([s2],
  s2 : s,
  s2 : ssubst("e","é",s2), s2 : ssubst("e","è",s2), s2 : ssubst("e","ê",s2), s2 : ssubst("e","ë",s2),
  s2 : ssubst("a","à",s2), s2 : ssubst("a","â",s2),
  s2 : ssubst("i","î",s2), s2 : ssubst("i","ï",s2),
  s2 : ssubst("o","ô",s2), s2 : ssubst("u","ù",s2), s2 : ssubst("u","û",s2), s2 : ssubst("c","ç",s2),
  s2 : ssubst("E","É",s2), s2 : ssubst("E","È",s2), s2 : ssubst("A","À",s2), s2 : ssubst("C","Ç",s2),
  s2)$
liste_familles${X} : sort(listify(setify(map(lambda([m], m[1]), donnes${X}))), lambda([a,b], orderlessp(strip_accents${X}(a), strip_accents${X}(b))))$
options_famille${X} : map(lambda([f], [f, is(f=famille${X}), f]), liste_familles${X})$
${urlChain()}`;

    const prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables:'' };
    const canonicalNodes = [
      { name:'0', description:'nom', answertest:'String', sans:`ans${X}n`, tans:`nom${X}`,
        testoptions:'', quiet:'0',
        truescoremode:'+', truescore:'0.5', truepenalty:'', truenextnode:'1',
        trueanswernote:`prt${X}-1-T`,
        truefeedback:`<p>C'est le bon nom.</p>`,
        falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'1',
        falseanswernote:`prt${X}-1-F`,
        falsefeedback:`<p>Ce n'est pas le bon nom (réponse attendue : {@nom${X}@}).</p>` },
      { name:'1', description:'famille', answertest:'String', sans:`ans${X}f`, tans:`famille${X}`,
        testoptions:'', quiet:'0',
        truescoremode:'+', truescore:'0.5', truepenalty:'', truenextnode:'-1',
        trueanswernote:`prt${X}-2-T`,
        truefeedback:`<p>Cette molécule fait bien partie de la famille des {@famille${X}@}.</p>`,
        falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
        falseanswernote:`prt${X}-2-F`,
        falsefeedback:`<p>Cette molécule ne fait pas partie de la famille indiquée. Famille attendue : {@famille${X}@}.</p>` }
    ];
    const prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    return { bareme, vars, qnote:`{@nom${X}@}`,
      textFrag: `${banniere}
      <!-- ENONCE-START -->${text}<!-- ENONCE-END -->
      ${_nomIframe(X)}<br>
      <p>Cette molécule fait partie de quelle famille ? [[input:ans${X}f]] [[validation:ans${X}f]]</p>
      <p>Quel est le nom de cette molécule ? [[input:ans${X}n]] [[validation:ans${X}n]]</p>`,
      inputXML: `    <input>
      <name>ans${X}n</name>
      <type>string</type>
      <tans>nom${X}</tans>
      <boxsize>25</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>1</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>
    <input>
      <name>ans${X}f</name>
      <type>dropdown</type>
      <tans>options_famille${X}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`,
      prtXML,
      generalFeedback: `<p>Molécule : {@nom${X}@} (famille : {@famille${X}@}).</p>${fbGen ? `<p>${fbGen}</p>` : ''}`,
      feedbackRef:`[[feedback:prt${X}]]`, prt:{meta:prtMeta,nodes:canonicalNodes} };
  }

  if (p.mode === 'checkbox') {
    const groupesVrais = _nomSplitList(p.cbVrais);
    const groupesFaux = _nomSplitList(p.cbFaux);
    const gvLit = '[' + groupesVrais.map(function(g){return '"'+escapeMaximaString_D(g)+'"';}).join(',') + ']';
    const gfLit = '[' + groupesFaux.map(function(g){return '"'+escapeMaximaString_D(g)+'"';}).join(',') + ']';

    const vars = `/* Q${X} : Nomenclature - mode Checkbox groupes (${bareme}pt) */
smiles_dessin${X} : "${escapeMaximaString_D(p.cbSmiles)}"$
groupes_vrais${X} : ${gvLit}$
groupes_faux${X} : ${gfLit}$
molecule_smiles${X} : smiles_dessin${X}$
${urlChain()}
tous_groupes${X} : random_permutation(append(groupes_vrais${X}, groupes_faux${X}))$
tans_checkbox${X} : map(lambda([g], [g, elementp(g, setify(groupes_vrais${X})), g]), tous_groupes${X})$`;

    const fbVars = `idx${X} : flatten([ans${X}])$
bons${X} : groupes_vrais${X}$
nv${X} : cardinality(intersection(setify(idx${X}), setify(bons${X})))$
nf${X} : cardinality(intersection(setify(idx${X}), setify(groupes_faux${X})))$
den${X} : length(bons${X})$
sc${X} : if den${X} > 0 then max(0, float((nv${X}-nf${X})/den${X})) else 0$
pct${X} : floor(sc${X}*100)$
manques${X} : listify(setdifference(setify(bons${X}), setify(idx${X})))$
coches_faux${X} : listify(intersection(setify(idx${X}), setify(groupes_faux${X})))$
coches_bons${X} : listify(intersection(setify(idx${X}), setify(bons${X})))$
fb_bons${X} : if length(coches_bons${X}) > 0 then sconcat("<div style='color:green;border-left:4px solid green;padding:7px;margin:3px 0'><b>Groupes correctement identifiés :</b><ul>", simplode(map(lambda([g], sconcat("<li>", g, "</li>")), coches_bons${X})), "</ul></div>") else ""$
fb_faux${X} : if length(coches_faux${X}) > 0 then sconcat("<div style='color:red;border-left:4px solid red;padding:7px;margin:3px 0'><b>Groupes cochés à tort (absents de la molécule) :</b><ul>", simplode(map(lambda([g], sconcat("<li>", g, "</li>")), coches_faux${X})), "</ul></div>") else ""$
fb_manques${X} : if length(manques${X}) > 0 then sconcat("<div style='color:#92400e;background:#fffbeb;border-left:4px solid #f59e0b;padding:7px;margin:3px 0'><b>Groupes présents mais oubliés :</b><ul>", simplode(map(lambda([g], sconcat("<li>", g, "</li>")), manques${X})), "</ul></div>") else ""$`;

    const prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'2', feedbackvariables:fbVars };
    const canonicalNodes = [
      { name:'0', description:'score checkbox groupes', answertest:'AlgEquiv', sans:`ans${X}`, tans:`tans_checkbox${X}`,
        testoptions:'', quiet:'0',
        truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
        trueanswernote:`prt${X}-1-T`,
        truefeedback:`<div style="padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;"><strong>✅ Score : 100%</strong>{@fb_bons${X}@}</div>`,
        falsescoremode:'=', falsescore:`sc${X}`, falsepenalty:'', falsenextnode:'-1',
        falseanswernote:`prt${X}-1-F`,
        falsefeedback:`<div style="padding:12px;background:#fafafa;border-radius:8px;border:1px solid #e2e8f0"><p><strong>Score : {@pct${X}@}%</strong></p>{@fb_bons${X}@}{@fb_faux${X}@}{@fb_manques${X}@}</div>` }
    ];
    const prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    return { bareme, vars, qnote:`{@groupes_vrais${X}@}`,
      textFrag: `${banniere}
      <!-- ENONCE-START -->${text}<!-- ENONCE-END -->
      ${_nomIframe(X)}<br>
      <p>Cochez le ou les groupe(s) caractéristique(s) réellement présent(s) dans cette molécule : [[input:ans${X}]] [[validation:ans${X}]]</p>`,
      inputXML: `    <input>
      <name>ans${X}</name>
      <type>checkbox</type>
      <tans>tans_checkbox${X}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`,
      prtXML,
      generalFeedback: `<p>Groupes présents : {@groupes_vrais${X}@}.</p>${fbGen ? `<p>${fbGen}</p>` : ''}`,
      feedbackRef:`[[feedback:prt${X}]]`, prt:{meta:prtMeta,nodes:canonicalNodes} };
  }

  // mode === 'fixe' (par défaut) : molécule imposée, nom IUPAC saisi, tolérance regex
  const vars = `/* Q${X} : Nomenclature - mode Fixe (${bareme}pt) */
smiles_dessin${X} : "${escapeMaximaString_D(p.fixeSmiles)}"$
nom_attendu${X} : "${escapeMaximaString_D(p.fixeNom)}"$
famille_attendue${X} : "${escapeMaximaString_D(p.fixeFamille)}"$
molecule_smiles${X} : smiles_dessin${X}$
${urlChain()}
regexify_nom${X}(s) := block([chars, out, c],
  chars : charlist(s),
  out : "(?i)^",
  for c in chars do (
    out : if c = "(" then sconcat(out, "\\\\(")
          elseif c = ")" then sconcat(out, "\\\\)")
          elseif c = "-" then sconcat(out, "[- ]?")
          elseif c = " " then sconcat(out, "[- ]?")
          else sconcat(out, c)
  ),
  out : sconcat(out, "$"),
  out)$
nom_pattern${X} : regexify_nom${X}(nom_attendu${X})$`;

  const prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables:'' };
  const canonicalNodes = [
    { name:'0', description:'nom IUPAC tolérant', answertest:'RegExp', sans:`ans${X}`, tans:`nom_pattern${X}`,
      testoptions:'', quiet:'0',
      truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
      trueanswernote:`prt${X}-1-T`,
      truefeedback:`<p>C'est le bon nom (famille : {@famille_attendue${X}@}).</p>`,
      falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
      falseanswernote:`prt${X}-1-F`,
      falsefeedback:`<p>Ce n'est pas le bon nom. Réponse attendue : {@nom_attendu${X}@} (famille : {@famille_attendue${X}@}).</p>` }
  ];
  const prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

  return { bareme, vars, qnote:`{@nom_attendu${X}@}`,
    textFrag: `${banniere}
    <!-- ENONCE-START -->${text}<!-- ENONCE-END -->
    ${_nomIframe(X)}<br>
    <p>Quel est le nom de cette molécule en nomenclature IUPAC ? [[input:ans${X}]] [[validation:ans${X}]]</p>`,
    inputXML: `    <input>
      <name>ans${X}</name>
      <type>string</type>
      <tans>nom_attendu${X}</tans>
      <boxsize>30</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>1</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`,
    prtXML,
    generalFeedback: `<p>Molécule imposée : {@nom_attendu${X}@} (famille : {@famille_attendue${X}@}).</p>${fbGen ? `<p>${fbGen}</p>` : ''}`,
    feedbackRef:`[[feedback:prt${X}]]`, prt:{meta:prtMeta,nodes:canonicalNodes} };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genNomenclature: genNomenclature, genNomenclatureCore: genNomenclatureCore, NOM_DONNES: NOM_DONNES, _nomFamilies: _nomFamilies };
}
