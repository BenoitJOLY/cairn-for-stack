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

// ── XML GENERATOR: nomenclature (Physique-Chimie) ──
// Un seul chip "Nomenclature", 3 modes internes (mode Fixe/Aléatoire/Checkbox-groupes),
// portés depuis les 3 gabarits STACK autonomes validés en Maxima réel :
//   test/mise à jour/Physique-chimie/nomenclature/nomenclature-type{1,2,3}-*.xml
// Toutes les variables Maxima sont suffixées par ${X} (Loi 2 : pas de variable
// partagée entre chips d'une même question combinée).

// Pool de molécules pour le mode Aléatoire (121 entrées, identique à la variable
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
["Aldéhydes", "2-Méthylbutanal", "C(C=O)(C)CC"],
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
["Esters", "2,2-Diméthylpropanoate d'éthyle", "CC(C)(C)C(=O)OCC"],
["Alcynes", "Éthyne", "C#C"],
["Alcynes", "Propyne", "CC#C"],
["Alcynes", "But-1-yne", "CCC#C"],
["Alcynes", "But-2-yne", "CC#CC"],
["Alcynes", "Pent-1-yne", "CCCC#C"],
["Alcynes", "Pent-2-yne", "CCC#CC"],
["Alcynes", "Hex-1-yne", "CCCCC#C"],
["Alcynes", "Hex-2-yne", "CCCC#CC"],
["Alcynes", "Hex-3-yne", "CCC#CCC"],
["Alcynes", "3-Méthylbut-1-yne", "C#CC(C)C"],
["Alcynes", "4-Méthylpent-2-yne", "CC#CC(C)C"],
["Amines", "Méthanamine", "CN"],
["Amines", "Éthanamine", "CCN"],
["Amines", "Propan-1-amine", "CCCN"],
["Amines", "Butan-1-amine", "CCCCN"],
["Amines", "Pentan-1-amine", "CCCCCN"],
["Amines", "Hexan-1-amine", "CCCCCCN"],
["Amines", "Propan-2-amine", "CC(N)C"],
["Amines", "Butan-2-amine", "CC(N)CC"],
["Amines", "2-Méthylpropan-1-amine", "CC(C)CN"],
["Amines", "2-Méthylpropan-2-amine", "CC(C)(C)N"],
["Amines", "Cyclopentanamine", "C1CCC(N)C1"],
["Amines", "Cyclohexanamine", "C1CCCC(N)C1"]
];

function _nomFamilies() {
  var set = {};
  NOM_DONNES.forEach(function(m){ set[m[0]] = true; });
  return Object.keys(set).sort(function(a,b){ return a.localeCompare(b, 'fr'); });
}

// ── Décomposition d'un nom IUPAC français en composants comparables ──
// Utilisée pour enrichir le PRT (famille / longueur de chaîne / substituants /
// numérotation / ordre, cf. demande enseignant) : le nom de RÉFÉRENCE (mode
// Fixe : p.fixeNom ; mode Aléatoire : chaque entrée de NOM_DONNES, précalculée
// une fois) est décomposé ici côté JS au moment de la génération. Le nom
// SOUMIS par l'étudiant est décomposé par l'équivalent Maxima nom_analyse${X}
// au moment de la correction (aucune exécution Maxima locale possible pour le
// vérifier — cf. test/unit/gen-nomenclature.test.js qui valide au moins cette
// version JS sur les 121 entrées réelles de NOM_DONNES + des cas Fixe types).
// Périmètre couvert : chaînes/cycles simples, substituants méthyl/éthyl/
// propyl/butyl (mono ou multi via di-/tri-/tétra-), 9 familles y compris le
// cas particulier des acides carboxyliques cycliques ("...carboxylique" et
// non "...oïque") et des esters ("<acide>oate de/d'<alkyle>").
const NOM_ROOTS_D = [
  ['méth', 1], ['éth', 2], ['prop', 3], ['but', 4], ['pent', 5],
  ['hex', 6], ['hept', 7], ['oct', 8], ['non', 9], ['déc', 10]
];
const NOM_SUBNAMES_D = ['méthyl', 'éthyl', 'propyl', 'butyl'];

function _nomPeelSubs(s) {
  const subs = [];
  let rest = s;
  const chunkRe = /^-?(\d+(?:,\d+)*)-(tétra|tri|di)?(méthyl|éthyl|propyl|butyl)/;
  let m;
  while ((m = chunkRe.exec(rest))) {
    const locants = m[1].split(',').map(function(x) { return parseInt(x, 10); });
    const mult = m[2] ? (m[2] === 'di' ? 2 : m[2] === 'tri' ? 3 : 4) : 1;
    if (locants.length !== mult) return null;
    locants.forEach(function(loc) { subs.push([loc, m[3]]); });
    rest = rest.slice(m[0].length);
  }
  return { subs: subs, rest: rest };
}

function _nomMatchRoot(rest) {
  for (let i = 0; i < NOM_ROOTS_D.length; i++) {
    const root = NOM_ROOTS_D[i][0], n = NOM_ROOTS_D[i][1];
    if (rest.indexOf(root) === 0) return { n: n, tail: rest.slice(root.length) };
  }
  return null;
}

// str : nom débarrassé du préfixe "acide "/du suffixe " de X"/du descripteur (e)/(z).
// Retourne {famille, longueur, iscyclo, subs, locprinc} ou null si aucun motif ne correspond.
function _nomTryCore(str) {
  let s = str;
  let iscyclo = false;
  if (s.indexOf('cyclo') === 0) { iscyclo = true; s = s.slice(5); }
  const peeled = _nomPeelSubs(s);
  if (!peeled) return null;
  const rm = _nomMatchRoot(peeled.rest);
  if (!rm) return null;
  const n = rm.n, tail = rm.tail, subs = peeled.subs;
  let mm;

  if (tail === 'ane' && !iscyclo) return { famille: 'Alcanes', longueur: n, iscyclo: false, subs: subs, locprinc: false };
  if (tail === 'anal') return { famille: 'Aldéhydes', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  if (tail === 'anol') return { famille: 'Alcools', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  if (tail === 'anone') return { famille: 'Cétones', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  if (tail === 'anamine') return { famille: 'Amines', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  mm = tail.match(/^an-(\d+)-ol$/);
  if (mm && !iscyclo) return { famille: 'Alcools', longueur: n, iscyclo: false, subs: subs, locprinc: parseInt(mm[1], 10) };
  mm = tail.match(/^an-(\d+)-one$/);
  if (mm && !iscyclo) return { famille: 'Cétones', longueur: n, iscyclo: false, subs: subs, locprinc: parseInt(mm[1], 10) };
  mm = tail.match(/^an-(\d+)-amine$/);
  if (mm && !iscyclo) return { famille: 'Amines', longueur: n, iscyclo: false, subs: subs, locprinc: parseInt(mm[1], 10) };
  mm = tail.match(/^-(\d+)-ène$/);
  if (mm) return { famille: 'Alcènes', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: parseInt(mm[1], 10) };
  if (tail === 'ène') return { famille: 'Alcènes', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  mm = tail.match(/^-(\d+)-yne$/);
  if (mm) return { famille: 'Alcynes', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: parseInt(mm[1], 10) };
  if (tail === 'yne') return { famille: 'Alcynes', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  if (tail === 'anoïque') return { famille: 'Acides carboxyliques', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  if (tail === 'anecarboxylique' && iscyclo) return { famille: 'Acides carboxyliques', longueur: n, iscyclo: true, subs: subs, locprinc: false };
  if (tail === 'anoate') return { famille: 'Esters', longueur: n, iscyclo: iscyclo, subs: subs, locprinc: false };
  return null;
}

// Groupe alkyle d'un ester ("méthyle", "éthyle", ...) : racine simple sans
// substituants (hors périmètre des 9 familles/121 entrées de la base).
function _nomTryAlkyle(str) {
  const rm = _nomMatchRoot(str);
  if (rm && rm.tail === 'yle') return rm.n;
  return null;
}

function _nomDecompose(rawName) {
  const fail = { ok: false, famille: null, longueur: 0, iscyclo: false, subs: [], locprinc: false, alkyle: null };
  let s = String(rawName || '').trim().toLowerCase();
  s = s.replace(/^\(\s*[ez]\s*\)\s*/i, '').trim();

  const mAcide = s.match(/^acide\s+(.+)$/);
  if (mAcide) {
    const core = _nomTryCore(mAcide[1]);
    if (core && core.famille === 'Acides carboxyliques') {
      return Object.assign({ ok: true, alkyle: null }, core);
    }
    return fail;
  }

  const mEster = s.match(/^(.+?)\s+(?:de\s+|d')(.+)$/);
  if (mEster) {
    const core = _nomTryCore(mEster[1]);
    if (core && core.famille === 'Esters') {
      const alk = _nomTryAlkyle(mEster[2].trim());
      if (alk == null) return fail;
      return Object.assign({ ok: true, alkyle: alk }, core);
    }
  }

  const core = _nomTryCore(s);
  if (core && core.famille !== 'Esters') {
    return Object.assign({ ok: true, alkyle: null }, core);
  }
  return fail;
}

// Décomposition (_nomDecompose) précalculée pour les 121 entrées de NOM_DONNES, dans le même ordre.
let _nomDonnesDecompCache = null;
function _nomDonnesDecomp() {
  if (!_nomDonnesDecompCache) {
    _nomDonnesDecompCache = NOM_DONNES.map(function(m) { return _nomDecompose(m[1]); });
  }
  return _nomDonnesDecompCache;
}

// Chaîne Maxima littérale d'une seule table ["Famille","Nom","SMILES",longueur,
// iscyclo,subs,locprinc,alkyle] par entrée de NOM_DONNES — famille/nom/smiles ET
// décomposition précalculée fusionnées dans la MÊME ligne. Indispensable : le
// mode Aléatoire filtre le pool par famille/carbones AVANT de tirer choix${X},
// donc si la décomposition vivait dans un tableau séparé indexé par le même
// choix${X}, un filtre actif désynchroniserait les deux tableaux (longueur
// différente/ordre différent) et decomp_ref${X} pointerait sur une autre
// molécule que celle réellement tirée (bug réel trouvé en live sur Moodle :
// crit_longueur/subs/numero/ordre faux même sur la réponse de référence, dès
// qu'un filtre famille était actif). Un seul tableau, un seul index : plus de
// désynchronisation possible.
// esc : fonction d'échappement Maxima injectée par l'appelant (deps.escapeMaximaString
// côté tests Node, global escapeMaximaString côté navigateur — cf. genNomenclatureCore).
function _nomDonnesMaximaLiteral(esc) {
  const decomps = _nomDonnesDecomp();
  return '[' + NOM_DONNES.map(function(m, i){
    const d = decomps[i];
    const longueur = d.ok ? d.longueur : 0;
    const iscyclo = d.ok ? String(!!d.iscyclo) : 'false';
    const subs = d.ok ? _nomSubsLiteral(d.subs) : '[]';
    const locprinc = d.ok && d.locprinc !== false ? String(d.locprinc) : 'false';
    const alkyle = d.ok && d.alkyle != null ? String(d.alkyle) : 'false';
    return '["' + esc(m[0]) + '","' + esc(m[1]) + '","' + esc(m[2]) + '",' + longueur + ',' + iscyclo + ',' + subs + ',' + locprinc + ',' + alkyle + ']';
  }).join(',') + ']';
}

function _nomIframe(X, I18N_D, jsmolUrl) {
  I18N_D = I18N_D || I18N;
  // jsmolUrl : racine du viewer JSmol configurée par l'admin de l'instance
  // (admin.html → GET /api/config/public → window._instanceJsmolUrl, cf.
  // js/app.js:fetchInstanceConfig). Résolue une fois par genNomenclatureCore
  // et propagée ici plutôt que lue directement (fonction testable côté Node,
  // où `window` n'existe pas). Tant qu'aucune URL n'est configurée, l'iframe
  // pointe vers un placeholder volontairement non résolu (voir historique).
  const base = (jsmolUrl || 'https://mon-domaine.com').replace(/\/+$/, '');
  return '<iframe src="' + base + '/viewer.html?smiles={@molecule_smiles_url' + X + '@}" width="300" height="300" style="border:0;" loading="lazy" title="' + I18N_D.t('nom.iframe_title') + '"></iframe>';
}

function _nomReadFormParams(){
  return {
    bareme: parseFloat(v('nom-bareme'))||1,
    text: richVal('nom-text'),
    mode: v('nom-mode')||'fixe',
    paramFamilles: _nomGetCheckedFamilies(),
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
        throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
    }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "nomenclature", repli sur le calcul local (session expirée ?).');
  } catch(e) { console.warn('[cairnforstack] /api/generate injoignable pour "nomenclature", repli sur le calcul local.', e); }
  return genNomenclatureCore(X, p);
}

function _nomSplitList(str) {
  return String(str||'').split(',').map(function(s){return s.trim();}).filter(function(s){return s.length>0;});
}

// Caractères à percent-encoder pour transformer un SMILES arbitraire en fragment
// d'URL sûr (au-delà des lettres/chiffres/- . _ ~, non réservés). "%" est en
// première position : voir le commentaire d'usage dans urlChain() ci-dessous.
const NOM_URL_ESCAPES_D = [
  ['%', '%25'], [' ', '%20'], ['"', '%22'], ['#', '%23'], ['$', '%24'],
  ['&', '%26'], ["'", '%27'], ['(', '%28'], [')', '%29'], ['*', '%2A'],
  ['+', '%2B'], [',', '%2C'], ['/', '%2F'], [':', '%3A'], [';', '%3B'],
  ['<', '%3C'], ['=', '%3D'], ['>', '%3E'], ['?', '%3F'], ['@', '%40'],
  ['[', '%5B'], ['\\', '%5C'], [']', '%5D'], ['^', '%5E'], ['`', '%60'],
  ['{', '%7B'], ['|', '%7C'], ['}', '%7D']
];

// Construit un littéral chaîne Maxima ("...") représentant un unique caractère,
// en échappant \ et " selon la syntaxe Maxima (même règle que escapeMaximaString).
function _nomMaximaCharLiteral(ch) {
  const esc = ch.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return '"' + esc + '"';
}

// ── Portage Maxima de _nomDecompose, appliqué à la réponse de l'étudiant ──
// Mêmes règles que le décomposeur JS ci-dessus (voir son commentaire), mais
// en Maxima pur (pas de regex disponible : lecture caractère par caractère,
// cf. le générateur nom_analyse${X} plus bas et gen-crossword.js pour
// l'idiome block/for/return déjà utilisé ailleurs dans ce projet).
function _nomMaximaHelpers(X) {
  return `nom_lower${X}(s) := block([r], r : sdowncase(s),
  r : ssubst("é","É",r), r : ssubst("è","È",r), r : ssubst("ê","Ê",r),
  r : ssubst("à","À",r), r : ssubst("â","Â",r), r : ssubst("ô","Ô",r),
  r : ssubst("ù","Ù",r), r : ssubst("î","Î",r), r : ssubst("ï","Ï",r),
  r : ssubst("ç","Ç",r), r)$
nom_left${X}(s, n) := if n <= 0 then "" else simplode(makelist(charat(s,k), k, 1, min(n,slength(s))))$
nom_drop${X}(s, n) := if n >= slength(s) then "" else simplode(makelist(charat(s,k), k, n+1, slength(s)))$
nom_starts${X}(s, pre) := is(nom_left${X}(s, slength(pre)) = pre)$
nom_endswith${X}(s, suf) := block([ls, lu], ls : slength(s), lu : slength(suf),
  if lu > ls then false else is(nom_drop${X}(s, ls-lu) = suf))$
nom_findchar${X}(s, ch, fromi) := block([k, r, found],
  r : 0, found : false,
  for k:fromi thru slength(s) do (
    if not found and charat(s,k) = ch then (r : k, found : true)
  ),
  r)$
nom_skipspaces${X}(s) := block([k, n, stop],
  n : 0, stop : false,
  for k:1 thru slength(s) do (
    if not stop then (if charat(s,k) = " " then n : k else stop : true)
  ),
  nom_drop${X}(s, n))$
nom_finddeidx${X}(s) := block([k, r, found],
  r : 0, found : false,
  for k:1 thru slength(s) do (
    if not found and (nom_starts${X}(nom_drop${X}(s, k-1), " de ") or nom_starts${X}(nom_drop${X}(s, k-1), " d'")) then (r : k, found : true)
  ),
  r)$
nom_isdigit${X}(c) := member(c, ["0","1","2","3","4","5","6","7","8","9"])$
nom_digitval${X}(c) := block([d, k, r, found], d : ["0","1","2","3","4","5","6","7","8","9"],
  r : 0, found : false,
  for k:1 thru 10 do (if not found and d[k] = c then (r : k-1, found : true)),
  r)$
nom_readint${X}(s, i) := block([j, n, iter],
  j : i, n : false,
  for iter:0 thru 20 do (
    if j > slength(s) or not nom_isdigit${X}(charat(s,j)) then return(true),
    n : if n = false then nom_digitval${X}(charat(s,j)) else (n*10 + nom_digitval${X}(charat(s,j))),
    j : j+1
  ),
  return([n, j]))$
nom_readlocants${X}(s, i) := block([j, n, locs, r, iter],
  r : nom_readint${X}(s, i),
  if r[1] = false then return([false, i]),
  locs : [r[1]], j : r[2],
  for iter:0 thru 10 do (
    if j > slength(s) or charat(s,j) # "," then return(true),
    r : nom_readint${X}(s, j+1),
    if r[1] = false then return(true),
    locs : append(locs, [r[1]]), j : r[2]
  ),
  return([locs, j]))$
nom_roots${X} : [["méth",1],["éth",2],["prop",3],["but",4],["pent",5],["hex",6],["hept",7],["oct",8],["non",9],["déc",10]]$
nom_subnames${X} : ["méthyl","éthyl","propyl","butyl"]$
nom_mults${X} : [["tétra",4],["tri",3],["di",2]]$
nom_matchroot${X}(s) := block([k, r, found],
  r : [false, s], found : false,
  for k:1 thru length(nom_roots${X}) do (
    if not found and nom_starts${X}(s, nom_roots${X}[k][1]) then (
      r : [nom_roots${X}[k][2], nom_drop${X}(s, slength(nom_roots${X}[k][1]))], found : true
    )
  ),
  r)$
nom_readchunk${X}(s, i) := block([j, r, locs, mult, k, mm, found, name],
  j : i,
  if j <= slength(s) and charat(s,j) = "-" then j : j+1,
  r : nom_readlocants${X}(s, j),
  if r[1] = false then return([false, false, i]),
  locs : r[1], j : r[2],
  if j > slength(s) or charat(s,j) # "-" then return([false, false, i]),
  j : j+1,
  mult : 1, found : false,
  for k:1 thru length(nom_mults${X}) do (
    mm : nom_mults${X}[k],
    if not found and nom_starts${X}(nom_drop${X}(s, j-1), mm[1]) then (mult : mm[2], j : j+slength(mm[1]), found : true)
  ),
  name : false,
  for k:1 thru length(nom_subnames${X}) do (
    if name = false and nom_starts${X}(nom_drop${X}(s, j-1), nom_subnames${X}[k]) then (name : nom_subnames${X}[k], j : j+slength(name))
  ),
  if name = false then return([false, false, i]),
  if length(locs) # mult then return([false, false, i]),
  return([locs, name, j]))$
nom_peelsubs${X}(s) := block([subs, i, r, k, iter],
  subs : [], i : 1,
  for iter:1 thru 20 do (
    r : nom_readchunk${X}(s, i),
    if r[1] = false then return(true),
    for k:1 thru length(r[1]) do subs : append(subs, [[r[1][k], r[2]]]),
    i : r[3]
  ),
  return([subs, nom_drop${X}(s, i-1)]))$
nom_tryalkyle${X}(s) := block([rm],
  rm : nom_matchroot${X}(s),
  if rm[1] = false then false elseif rm[2] = "yle" then rm[1] else false)$
nom_trycore${X}(s) := block([iscyclo, s1, peel, subs, rest, rm, n, tail],
  iscyclo : false, s1 : s,
  if nom_starts${X}(s1, "cyclo") then (iscyclo : true, s1 : nom_drop${X}(s1, 5)),
  peel : nom_peelsubs${X}(s1),
  subs : peel[1], rest : peel[2],
  rm : nom_matchroot${X}(rest),
  if rm[1] = false then return([false, false, 0, false, [], false]),
  n : rm[1], tail : rm[2],
  if tail = "ane" and not iscyclo then return([true, "Alcanes", n, false, subs, false]),
  if tail = "anal" then return([true, "Aldéhydes", n, iscyclo, subs, false]),
  if tail = "anol" then return([true, "Alcools", n, iscyclo, subs, false]),
  if tail = "anone" then return([true, "Cétones", n, iscyclo, subs, false]),
  if tail = "anamine" then return([true, "Amines", n, iscyclo, subs, false]),
  if not iscyclo and nom_starts${X}(tail, "an-") and nom_endswith${X}(tail, "-ol") then
    return([true, "Alcools", n, false, subs, nom_readint${X}(tail,4)[1]]),
  if not iscyclo and nom_starts${X}(tail, "an-") and nom_endswith${X}(tail, "-one") then
    return([true, "Cétones", n, false, subs, nom_readint${X}(tail,4)[1]]),
  if not iscyclo and nom_starts${X}(tail, "an-") and nom_endswith${X}(tail, "-amine") then
    return([true, "Amines", n, false, subs, nom_readint${X}(tail,4)[1]]),
  if tail = "ène" then return([true, "Alcènes", n, iscyclo, subs, false]),
  if nom_starts${X}(tail, "-") and nom_endswith${X}(tail, "-ène") then
    return([true, "Alcènes", n, iscyclo, subs, nom_readint${X}(tail,2)[1]]),
  if tail = "yne" then return([true, "Alcynes", n, iscyclo, subs, false]),
  if nom_starts${X}(tail, "-") and nom_endswith${X}(tail, "-yne") then
    return([true, "Alcynes", n, iscyclo, subs, nom_readint${X}(tail,2)[1]]),
  if tail = "anoïque" then return([true, "Acides carboxyliques", n, iscyclo, subs, false]),
  if tail = "anecarboxylique" and iscyclo then return([true, "Acides carboxyliques", n, true, subs, false]),
  if tail = "anoate" then return([true, "Esters", n, iscyclo, subs, false]),
  return([false, false, 0, false, [], false]))$
nom_analyse${X}(s0) := block([s, ezpos, core, acidcore, alk, deidx],
  s : nom_lower${X}(s0),
  if slength(s) >= 1 and charat(s,1) = "(" then (
    ezpos : nom_findchar${X}(s, ")", 2),
    if ezpos > 0 then s : nom_skipspaces${X}(nom_drop${X}(s, ezpos))
  ),
  if nom_starts${X}(s, "acide ") then (
    core : nom_trycore${X}(nom_drop${X}(s, 6)),
    return(if core[1] and core[2] = "Acides carboxyliques" then append(core, [false]) else [false, false, 0, false, [], false, false])
  ),
  deidx : nom_finddeidx${X}(s),
  if deidx > 0 then (
    acidcore : nom_trycore${X}(nom_left${X}(s, deidx-1)),
    if acidcore[1] and acidcore[2] = "Esters" then (
      alk : if nom_starts${X}(nom_drop${X}(s,deidx-1), " d'") then nom_tryalkyle${X}(nom_drop${X}(s, deidx+2))
            else nom_tryalkyle${X}(nom_drop${X}(s, deidx+3)),
      return(if alk = false then [false, false, 0, false, [], false, false] else append(acidcore, [alk]))
    )
  ),
  core : nom_trycore${X}(s),
  return(if core[1] and core[2] # "Esters" then append(core, [false]) else [false, false, 0, false, [], false, false]))$`;
}

// Variables Maxima calculant les 5 ou 6 critères de comparaison (famille /
// longueur+cycle / substituants / numérotation / ordre / alkyle-ester) entre
// la réponse analysée (ansVar) et la référence (variables *_ref${X}, déjà
// injectées comme littéraux calculés côté JS — cf. genNomenclatureCore).
// familleExpr : expression Maxima donnant la famille attendue ("false" si ce
// critère n'est pas utilisé pour ce mode, ex. Aléatoire qui a déjà un nœud
// famille séparé sur le menu déroulant).
function _nomCriteriaVars(X, ansVar, familleExpr) {
  let out = `res_ana${X} : nom_analyse${X}(${ansVar})$
famille_s${X} : res_ana${X}[2]$
longueur_s${X} : res_ana${X}[3]$
iscyclo_s${X} : res_ana${X}[4]$
subs_s${X} : res_ana${X}[5]$
locprinc_s${X} : res_ana${X}[6]$
alkyle_s${X} : res_ana${X}[7]$
crit_longueur${X} : is(longueur_s${X} = longueur_ref${X} and iscyclo_s${X} = iscyclo_ref${X})$
crit_subs${X} : is(sort(map(lambda([pp], pp[2]), subs_s${X})) = sort(map(lambda([pp], pp[2]), subs_ref${X})))$
crit_numero${X} : is(sort(subs_s${X}) = sort(subs_ref${X}) and locprinc_s${X} = locprinc_ref${X})$
crit_ordre${X} : is(map(lambda([pp], pp[2]), subs_s${X}) = map(lambda([pp], pp[2]), subs_ref${X}))$
crit_alkyle${X} : is(alkyle_ref${X} = false or alkyle_s${X} = alkyle_ref${X})$`;
  if (familleExpr !== 'false') {
    out += `\ncrit_famille${X} : is(famille_s${X} = ${familleExpr})$`;
  }
  return out;
}

// Construit les nœuds PRT diagnostiques : chaque nœud vaut bareme/n (n =
// nombre de critères actifs), et VRAI comme FAUX enchaînent vers le nœud
// suivant (accumulation indépendante par critère, cf. le nœud "0" existant
// du mode Aléatoire déjà bâti sur ce principe truenextnode=falsenextnode).
function _nomBuildCriteriaNodes(X, I18N_D, weight, includeFamille, includeAlkyle, nextAfterLast, nodeOffset) {
  const crits = [];
  if (includeFamille) crits.push({ key: 'famille', fbOk: 'nom.crit_famille_ok', fbKo: 'nom.crit_famille_ko' });
  crits.push({ key: 'longueur', fbOk: 'nom.crit_longueur_ok', fbKo: 'nom.crit_longueur_ko' });
  crits.push({ key: 'subs', fbOk: 'nom.crit_subs_ok', fbKo: 'nom.crit_subs_ko' });
  crits.push({ key: 'numero', fbOk: 'nom.crit_numero_ok', fbKo: 'nom.crit_numero_ko' });
  crits.push({ key: 'ordre', fbOk: 'nom.crit_ordre_ok', fbKo: 'nom.crit_ordre_ko' });
  if (includeAlkyle) crits.push({ key: 'alkyle', fbOk: 'nom.crit_alkyle_ok', fbKo: 'nom.crit_alkyle_ko' });

  return crits.map(function(c, idx) {
    const nodeIdx = nodeOffset + idx;
    const isLast = idx === crits.length - 1;
    const next = isLast ? nextAfterLast : String(nodeIdx + 1);
    return {
      name: String(nodeIdx), description: c.key, answertest: 'AlgEquiv',
      sans: `crit_${c.key}${X}`, tans: 'true',
      testoptions: '', quiet: '0',
      truescoremode: '+', truescore: String(weight), truepenalty: '', truenextnode: next,
      trueanswernote: `prt${X}-${nodeIdx + 1}-T`,
      truefeedback: `<p>${I18N_D.t(c.fbOk)}</p>`, fbKind: 'true',
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: next,
      falseanswernote: `prt${X}-${nodeIdx + 1}-F`,
      falsefeedback: `<p>${I18N_D.t(c.fbKo)}</p>`, falseFbKind: 'false'
    };
  });
}

// xmlNodes : copie des nœuds canoniques avec l'encadré coloré (bordure/fond/icône)
// appliqué, réservée à buildPrtXml_D/prtXML (export final) — prt.nodes (canonicalNodes)
// reste brut pour l'édition via prt-manager.js. Cf. js/fb-box.js et le même pattern
// dans js/gen-vf.js.
function _nomApplyFbBox(nodes, applyFbBox_D) {
  return nodes.map(function(n) {
    return Object.assign({}, n, {
      truefeedback: n.truefeedback ? applyFbBox_D(n.fbKind || 'true', n.truefeedback) : n.truefeedback,
      falsefeedback: n.falsefeedback ? applyFbBox_D(n.falseFbKind || 'false', n.falsefeedback) : n.falsefeedback
    });
  });
}

// Littéral Maxima ["nom", ...] pour une liste de couples [locant, "nom"].
function _nomSubsLiteral(subs) {
  return '[' + subs.map(function(p) { return '[' + p[0] + ',"' + p[1] + '"]'; }).join(',') + ']';
}

/* genNomenclatureCore : fonction pure (aucun accès DOM), cf. js/gen-checkbox.js pour
   le pattern (deps injectables pour les tests Node — test/unit/gen-nomenclature.test.js). */
function genNomenclatureCore(X, p, deps){
  deps = deps || {};
  const buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  const escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;
  const applyFbBox_D = deps.applyFbBox || applyFbBox;
  const I18N_D = deps.I18N || I18N;
  const jsmolUrl_D = deps.jsmolUrl || (typeof window !== 'undefined' && window._instanceJsmolUrl) || '';

  const bareme = p.bareme, text = p.text||'';
  const fbGen = p.fbGen||'';
  const banniere = `<div style="background:#0e7490;border-left:5px solid #155e75;border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <strong style="font-weight:800;color:#fff;font-size:.95rem;">Q${X} — ${I18N_D.t('nom.title')}</strong>
        <span style="background:#155e75;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ${bareme} pt</span>
      </div>`;

  // Table de percent-encoding pour bâtir molecule_smiles_url à partir d'un SMILES
  // saisi librement par l'enseignant : on ne peut pas se limiter aux 5 caractères
  // "usuels" (\ / ( ) =), un SMILES ou une frappe accidentelle peut contenir #, +,
  // [...], @, %, etc. "%" DOIT être substitué en premier — sinon les %XX déjà
  // insérés par les règles suivantes seraient eux-mêmes ré-encodés (URL cassée).
  const urlChain = () => [`molecule_smiles_url${X} : molecule_smiles${X}$`]
    .concat(NOM_URL_ESCAPES_D.map(([ch, code]) =>
      `molecule_smiles_url${X} : ssubst("${code}", ${_nomMaximaCharLiteral(ch)}, molecule_smiles_url${X})$`))
    .join('\n');

  if (p.mode === 'aleatoire') {
    // Compat rétro : anciens appelants (scripts, sauvegardes) qui passent encore
    // p.paramFamille (singulier, "Toutes" = pas de filtre) au lieu du tableau
    // p.paramFamilles issu des cases à cocher.
    const paramFamillesList = Array.isArray(p.paramFamilles) ? p.paramFamilles
      : (p.paramFamille && p.paramFamille !== 'Toutes' ? [p.paramFamille] : []);
    const paramFamillesLiteral = '[' + paramFamillesList.map(f => '"' + escapeMaximaString_D(f) + '"').join(',') + ']';
    const cmax = (p.paramCarbonesMax === '' || p.paramCarbonesMax == null) ? 'false' : (parseInt(p.paramCarbonesMax)||0);

    const vars = `/* Q${X} : Nomenclature - mode Aléatoire (${bareme}pt) */
param_familles${X} : ${paramFamillesLiteral}$
param_carbones_max${X} : ${cmax}$
donnes${X} : ${_nomDonnesMaximaLiteral(escapeMaximaString_D)}$
carbon_count${X}(s) := slength(s) - slength(ssubst("", "C", s))$
donnes_filtres${X} : sublist(donnes${X}, lambda([m], is((param_familles${X} = [] or elementp(m[1], setify(param_familles${X}))) and (param_carbones_max${X} = false or carbon_count${X}(m[3]) <= param_carbones_max${X}))))$
filtre_vide${X} : is(length(donnes_filtres${X}) = 0)$
donnes_pool${X} : if filtre_vide${X} then donnes${X} else donnes_filtres${X}$
choix${X} : rand(length(donnes_pool${X}))+1$
molecule${X} : donnes_pool${X}[choix${X}]$
famille${X} : molecule${X}[1]$
nom${X} : molecule${X}[2]$
molecule_smiles${X} : molecule${X}[3]$
longueur_ref${X} : molecule${X}[4]$
iscyclo_ref${X} : molecule${X}[5]$
subs_ref${X} : molecule${X}[6]$
locprinc_ref${X} : molecule${X}[7]$
alkyle_ref${X} : molecule${X}[8]$
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
${_nomMaximaHelpers(X)}
${urlChain()}`;

    // 6 nœuds à part égale (bareme/6) : 5 critères analysés depuis le nom
    // saisi (longueur/cycle, substituants, numérotation, ordre, alkyle-ester
    // — auto-validé quand la molécule tirée n'est pas un ester) + le nœud
    // famille existant (menu déroulant séparé, mécanique indépendante du texte).
    const nomWeight = bareme / 6;
    const critNodes = _nomBuildCriteriaNodes(X, I18N_D, nomWeight, false, true, '5', 0);
    const familleNode = {
      name: '5', description: 'famille', answertest: 'String', sans: `ans${X}f`, tans: `famille${X}`,
      testoptions: '', quiet: '0',
      truescoremode: '+', truescore: String(nomWeight), truepenalty: '', truenextnode: '-1',
      trueanswernote: `prt${X}-6-T`,
      truefeedback: `<p>${I18N_D.t('nom.fb_famille_ok', {famille: '{@famille'+X+'@}'})}</p>`, fbKind: 'true',
      falsescoremode: '=', falsescore: '0', falsepenalty: '', falsenextnode: '-1',
      falseanswernote: `prt${X}-6-F`,
      falsefeedback: `<p>${I18N_D.t('nom.fb_famille_ko', {famille: '{@famille'+X+'@}'})}</p>`, falseFbKind: 'false'
    };
    const prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables: _nomCriteriaVars(X, `ans${X}n`, 'false') };
    const canonicalNodes = critNodes.concat([familleNode]);
    const prtXML = buildPrtXml_D(prtMeta, _nomApplyFbBox(canonicalNodes, applyFbBox_D));

    return { bareme, vars, qnote:`{@nom${X}@}`,
      textFrag: `${banniere}
      <!-- ENONCE-START -->${text}<!-- ENONCE-END -->
      ${_nomIframe(X, I18N_D, jsmolUrl_D)}<br>
      <p>${I18N_D.t('nom.q_famille')} [[input:ans${X}f]] [[validation:ans${X}f]]</p>
      <p>${I18N_D.t('nom.q_nom')} [[input:ans${X}n]] [[validation:ans${X}n]]</p>`,
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
      generalFeedback: applyFbBox_D('general', `<p>${I18N_D.t('nom.genfb_aleatoire', {nom: '{@nom'+X+'@}', famille: '{@famille'+X+'@}'})}</p>${fbGen ? `<p>${fbGen}</p>` : ''}`),
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
fb_bons${X} : if length(coches_bons${X}) > 0 then sconcat("<div style='color:green;border-left:4px solid green;padding:7px;margin:3px 0'><b>${escapeMaximaString_D(I18N_D.t('nom.fb_groupes_ok_title'))}</b><ul>", simplode(map(lambda([g], sconcat("<li>", g, "</li>")), coches_bons${X})), "</ul></div>") else ""$
fb_faux${X} : if length(coches_faux${X}) > 0 then sconcat("<div style='color:red;border-left:4px solid red;padding:7px;margin:3px 0'><b>${escapeMaximaString_D(I18N_D.t('nom.fb_groupes_faux_title'))}</b><ul>", simplode(map(lambda([g], sconcat("<li>", g, "</li>")), coches_faux${X})), "</ul></div>") else ""$
fb_manques${X} : if length(manques${X}) > 0 then sconcat("<div style='color:#92400e;background:#fffbeb;border-left:4px solid #f59e0b;padding:7px;margin:3px 0'><b>${escapeMaximaString_D(I18N_D.t('nom.fb_groupes_manques_title'))}</b><ul>", simplode(map(lambda([g], sconcat("<li>", g, "</li>")), manques${X})), "</ul></div>") else ""$`;

    const prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'2', feedbackvariables:fbVars };
    const canonicalNodes = [
      { name:'0', description:'score checkbox groupes', answertest:'AlgEquiv', sans:`ans${X}`, tans:`tans_checkbox${X}`,
        testoptions:'', quiet:'0',
        truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
        trueanswernote:`prt${X}-1-T`,
        truefeedback:`<div style="padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #86efac;"><strong>✅ ${I18N_D.t('nom.fb_score_100')}</strong>{@fb_bons${X}@}</div>`,
        falsescoremode:'=', falsescore:`sc${X}`, falsepenalty:'', falsenextnode:'-1',
        falseanswernote:`prt${X}-1-F`,
        falsefeedback:`<div style="padding:12px;background:#fafafa;border-radius:8px;border:1px solid #e2e8f0"><p><strong>${I18N_D.t('nom.fb_score_pct', {pct: '{@pct'+X+'@}'})}</strong></p>{@fb_bons${X}@}{@fb_faux${X}@}{@fb_manques${X}@}</div>` }
    ];
    const prtXML = buildPrtXml_D(prtMeta, canonicalNodes);

    return { bareme, vars, qnote:`{@groupes_vrais${X}@}`,
      textFrag: `${banniere}
      <!-- ENONCE-START -->${text}<!-- ENONCE-END -->
      ${_nomIframe(X, I18N_D, jsmolUrl_D)}<br>
      <p>${I18N_D.t('nom.q_checkbox')} [[input:ans${X}]] [[validation:ans${X}]]</p>`,
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
      generalFeedback: applyFbBox_D('general', `<p>${I18N_D.t('nom.genfb_checkbox', {groupes: '{@groupes_vrais'+X+'@}'})}</p>${fbGen ? `<p>${fbGen}</p>` : ''}`),
      feedbackRef:`[[feedback:prt${X}]]`, prt:{meta:prtMeta,nodes:canonicalNodes} };
  }

  // mode === 'fixe' (par défaut) : molécule imposée, nom IUPAC saisi.
  // Si le nom attendu se décompose (7 familles couvertes, cf. _nomDecompose),
  // le PRT diagnostique famille/longueur/substituants/numérotation/ordre (+
  // alkyle pour un ester) à parts égales. Sinon (famille hors périmètre, nom
  // mal formé…) on retombe sur l'unique nœud RegExp tolérant historique.
  const fixeDecomp = _nomDecompose(p.fixeNom);
  const regexifyBlock = `regexify_nom${X}(s) := block([chars, out, c],
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

  let vars, prtMeta, canonicalNodes;
  if (fixeDecomp.ok) {
    const includeAlkyle = fixeDecomp.famille === 'Esters';
    const nCrit = includeAlkyle ? 6 : 5;
    const weight = bareme / nCrit;
    vars = `/* Q${X} : Nomenclature - mode Fixe (${bareme}pt) */
smiles_dessin${X} : "${escapeMaximaString_D(p.fixeSmiles)}"$
nom_attendu${X} : "${escapeMaximaString_D(p.fixeNom)}"$
famille_attendue${X} : "${escapeMaximaString_D(p.fixeFamille)}"$
molecule_smiles${X} : smiles_dessin${X}$
longueur_ref${X} : ${fixeDecomp.longueur}$
iscyclo_ref${X} : ${fixeDecomp.iscyclo}$
subs_ref${X} : ${_nomSubsLiteral(fixeDecomp.subs)}$
locprinc_ref${X} : ${fixeDecomp.locprinc === false ? 'false' : fixeDecomp.locprinc}$
alkyle_ref${X} : ${fixeDecomp.alkyle == null ? 'false' : fixeDecomp.alkyle}$
${_nomMaximaHelpers(X)}
${urlChain()}`;
    prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables: _nomCriteriaVars(X, `ans${X}`, `famille_attendue${X}`) };
    canonicalNodes = _nomBuildCriteriaNodes(X, I18N_D, weight, true, includeAlkyle, '-1', 0);
  } else {
    vars = `/* Q${X} : Nomenclature - mode Fixe (${bareme}pt) */
smiles_dessin${X} : "${escapeMaximaString_D(p.fixeSmiles)}"$
nom_attendu${X} : "${escapeMaximaString_D(p.fixeNom)}"$
famille_attendue${X} : "${escapeMaximaString_D(p.fixeFamille)}"$
molecule_smiles${X} : smiles_dessin${X}$
${urlChain()}
${regexifyBlock}`;
    prtMeta = { name:`prt${X}`, value:String(bareme), autosimplify:'1', feedbackstyle:'1', feedbackvariables:'' };
    canonicalNodes = [
      { name:'0', description:'nom IUPAC tolérant', answertest:'RegExp', sans:`ans${X}`, tans:`nom_pattern${X}`,
        testoptions:'', quiet:'0',
        truescoremode:'=', truescore:'1', truepenalty:'', truenextnode:'-1',
        trueanswernote:`prt${X}-1-T`,
        truefeedback:`<p>${I18N_D.t('nom.fb_fixe_ok', {famille: '{@famille_attendue'+X+'@}'})}</p>`, fbKind: 'true',
        falsescoremode:'=', falsescore:'0', falsepenalty:'', falsenextnode:'-1',
        falseanswernote:`prt${X}-1-F`,
        falsefeedback:`<p>${I18N_D.t('nom.fb_fixe_ko', {nom: '{@nom_attendu'+X+'@}', famille: '{@famille_attendue'+X+'@}'})}</p>`, falseFbKind: 'false' }
    ];
  }
  const prtXML = buildPrtXml_D(prtMeta, _nomApplyFbBox(canonicalNodes, applyFbBox_D));

  return { bareme, vars, qnote:`{@nom_attendu${X}@}`,
    textFrag: `${banniere}
    <!-- ENONCE-START -->${text}<!-- ENONCE-END -->
    ${_nomIframe(X, I18N_D, jsmolUrl_D)}<br>
    <p>${I18N_D.t('nom.q_nom_iupac')} [[input:ans${X}]] [[validation:ans${X}]]</p>`,
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
    generalFeedback: applyFbBox_D('general', `<p>${I18N_D.t('nom.genfb_fixe', {nom: '{@nom_attendu'+X+'@}', famille: '{@famille_attendue'+X+'@}'})}</p>${fbGen ? `<p>${fbGen}</p>` : ''}`),
    feedbackRef:`[[feedback:prt${X}]]`, prt:{meta:prtMeta,nodes:canonicalNodes} };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { genNomenclature: genNomenclature, genNomenclatureCore: genNomenclatureCore, NOM_DONNES: NOM_DONNES, _nomFamilies: _nomFamilies, _nomDecompose: _nomDecompose };
}
