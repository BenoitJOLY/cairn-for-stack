// ── GÉNÉRATEUR : avancement (Tableau d'avancement, Physique-Chimie) ────────
//
// Deux modes :
//  - 'teacher'     : l'enseignant fournit toute la réaction (espèces, coeffs,
//    rôles, quantités initiales, excès, solvant). Tout est calculé une seule
//    fois dans <questionvariables>, comme n'importe quel autre type.
//  - 'follow_from' : prolongement d'une sous-question 'chemical' ou
//    'chemical_topo' DÉJÀ présente dans le même quiz — les coefficients de
//    référence viennent de la réponse brute de l'élève à cette sous-question
//    (ans_reacoef/ans_procoef ou ans_rk/ans_pk), PAS des coefficients du
//    professeur, pour ne pas pénaliser deux fois une équation mal équilibrée
//    (l'élève a déjà été noté sur l'équation elle-même).
//
// Contrainte STACK centrale : <questionvariables> et les <tans> des <input>
// sont évalués UNE FOIS PAR VARIANTE, AVANT la réponse de l'élève — ils ne
// peuvent donc JAMAIS lire la réponse d'une autre sous-question, même dans
// une question combinée. Seules les <feedbackvariables> d'un PRT (évaluées
// à la correction) peuvent lire ans_reacoefN/ans_procoefN/ans_rkN/ans_pkN.
// Conséquence : en mode follow_from, les coefficients "effectifs" (coef_eff,
// nc_eff, nf_eff, xmax_eff) sont recalculés dans les <feedbackvariables> du
// PRT de CETTE question, jamais dans <questionvariables>. L'<input> affiche
// toujours le corrigé du professeur (coef canonique) ; seule la correction
// (sans/tans des nœuds En cours/Final/x_max) utilise les valeurs effectives.
//
// Repli défensif : si la réponse de la sous-question source est absente, mal
// formée (mauvaise longueur) ou contient un coefficient non strictement
// positif, on retombe sur les coefficients canoniques du professeur — un
// élève qui n'a pas du tout répondu à la question précédente n'obtient pas
// un tableau d'avancement impossible à corriger.
//
// Gabarit XML original (à reproduire fidèlement) : un seul <prt>, 4 nœuds
// chaînés (Initial → En cours → Final → x_max), score additif 1/3+1/3+1/3
// pour les 3 lignes du tableau, nœud x_max informatif à 0 point. Comparaisons
// de listes entières via AlgEquiv (sans=[i1,i2,...], tans=[v1,v2,...]).
//
// Gabarit de câblage suivi : js/gen-zscore.js (deps injectables, defs[] en
// boucle) ; js/gen-topo.js pour la lecture des variables brutes élève d'une
// autre sous-question en <feedbackvariables> (cf. genChemicalTopoCore).

var AV_COEFF_SOURCES = {
  chemical_topo: function (srcX) { return 'append(ans_reacoef' + srcX + ',ans_procoef' + srcX + ')'; },
  chemical:      function (srcX) { return 'append(ans_rk' + srcX + ',ans_pk' + srcX + ')'; }
};

function _avBuildParams() {
  var rows = document.querySelectorAll('#av-species .av-row');
  var species = Array.prototype.map.call(rows, function (r) {
    var nomEl = r.querySelector('.av-nom');
    return {
      nom: (typeof _chemHtmlToLatexDisplay === 'function' ? _chemHtmlToLatexDisplay(nomEl.innerHTML) : (nomEl.textContent || '')).trim(),
      coeff: parseFloat(r.querySelector('.av-coeff').value) || 1,
      role: r.querySelector('.av-role').value,
      n0: r.querySelector('.av-n0').value,
      exces: !!r.querySelector('.av-exces').checked,
      solvant: !!r.querySelector('.av-solvant').checked
    };
  });
  var mode = document.getElementById('av-mode').value;
  return {
    bareme: parseFloat(v('av-bareme')) || 1,
    text: richVal('av-text'),
    mode: mode,
    sourceType: document.getElementById('av-source-type') ? document.getElementById('av-source-type').value : 'chemical_topo',
    sourceX: document.getElementById('av-source-x') ? (parseInt(document.getElementById('av-source-x').value) || 1) : 1,
    species: species,
    fbGen: richVal('av-fbgen')
  };
}

async function genAvancement(X) {
  var p = _avBuildParams();
  if (p.mode === 'follow_from') {
    var src = (typeof questions !== 'undefined') ? questions[p.sourceX] : null;
    if (!src || src.type !== p.sourceType) {
      throw new Error(I18N.t('av.err_bad_source', { x: p.sourceX, type: p.sourceType })
        || ('Q' + p.sourceX + " n'est pas une question de type \"" + p.sourceType + "\" déjà enregistrée dans ce quiz."));
    }
  }
  try {
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'avancement', X, params: p })
    });
    if (res.ok) { const data = await res.json(); if (data && data.ok) return data.parts; }
    if (res.status === 429) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Quota hebdomadaire atteint.'); }
    console.warn('[stackforge] /api/generate a répondu ' + res.status + ' pour "avancement", repli sur le calcul local.');
  } catch (e) { console.warn('[stackforge] /api/generate injoignable pour "avancement", repli sur le calcul local.', e); }
  return genAvancementCore(X, p);
}

function genAvancementCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var buildPrtXml_D = deps.buildPrtXml || buildPrtXml;
  var mkInput_D = deps._mkInput || _mkInput;
  var mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;
  var escapeMaximaString_D = deps.escapeMaximaString || escapeMaximaString;
  var htmlEsc_D = deps.htmlEsc || htmlEsc;

  var species = p.species || [];
  if (!species.length) throw new Error(I18N_D.t('av.err_no_species') || "Tableau d'avancement : ajoutez au moins une espèce.");
  species.forEach(function (s, i) {
    if (!s.nom) throw new Error(I18N_D.t('av.err_nom_manquant', { n: i + 1 }) || ('Espèce n°' + (i + 1) + ' : le nom (formule LaTeX) est obligatoire.'));
    if (!(s.coeff > 0)) throw new Error(I18N_D.t('av.err_coeff_invalide', { n: i + 1 }) || ('Espèce n°' + (i + 1) + ' : le coefficient stœchiométrique doit être > 0.'));
  });

  var bareme = p.bareme || 1;
  var mode = p.mode === 'follow_from' ? 'follow_from' : 'teacher';
  var n = species.length;

  var displayed = [];
  species.forEach(function (s, i) { if (!s.solvant) displayed.push({ s: s, idx: i + 1, j: displayed.length + 1 }); });
  if (!displayed.length) throw new Error(I18N_D.t('av.err_all_solvant') || "Au moins une espèce non-solvant doit figurer dans le tableau.");

  // ── Listes Maxima (identiques dans les deux modes ; coef${X}/sgn${X} servent
  //    aussi de repli en mode follow_from si la réponse antérieure est invalide).
  var nomList = species.map(function (s) { return '"' + escapeMaximaString_D(s.nom) + '"'; }).join(',');
  var coefList = species.map(function (s) { return s.coeff; }).join(',');
  var sgnList = species.map(function (s) { return s.role === 'produit' ? 1 : -1; }).join(',');
  var excList = species.map(function (s) { return (s.exces || s.solvant) ? 1 : 0; }).join(',');
  var n0List = species.map(function (s) { return s.n0 || 0; }).join(',');

  var vars = 'nom' + X + ':[' + nomList + ']$\n'
    + 'coef' + X + ':[' + coefList + ']$\n'
    + 'sgn' + X + ':[' + sgnList + ']$\n'
    + 'exc' + X + ':[' + excList + ']$\n'
    + 'n0' + X + ':[' + n0List + ']$\n'
    + 'rat' + X + ':makelist(if sgn' + X + '[k]=-1 and exc' + X + '[k]=0 then n0' + X + '[k]/coef' + X + '[k] else inf,k,1,' + n + ')$\n'
    + 'xmax' + X + ':apply(min,rat' + X + ')$\n'
    + 'nc' + X + ':makelist(n0' + X + '[k]+sgn' + X + '[k]*coef' + X + '[k]*x,k,1,' + n + ')$\n'
    + 'nf' + X + ':makelist(ev(nc' + X + '[k],x=xmax' + X + '),k,1,' + n + ')$';

  var iNames = displayed.map(function (d) { return 'i' + d.j + '_' + X; });
  var cNames = displayed.map(function (d) { return 'c' + d.j + '_' + X; });
  var fNames = displayed.map(function (d) { return 'f' + d.j + '_' + X; });
  var xmaxName = 'xmax_' + X;

  var iTans = '[' + displayed.map(function (d) { return 'n0' + X + '[' + d.idx + ']'; }).join(',') + ']';
  var cTansTeacher = '[' + displayed.map(function (d) { return 'nc' + X + '[' + d.idx + ']'; }).join(',') + ']';
  var fTansTeacher = '[' + displayed.map(function (d) { return 'nf' + X + '[' + d.idx + ']'; }).join(',') + ']';

  // ── Mode follow_from : coefficients "effectifs" recalculés en feedbackvariables,
  //    à partir de la réponse élève de la sous-question chemical/chemical_topo
  //    précédente (p.sourceX). Repli sur coef${X}/sgn${X} si absent/invalide.
  var feedbackVars = '', cTans = cTansTeacher, fTans = fTansTeacher, xmaxTans = 'xmax' + X;
  var followNote = '';
  if (mode === 'follow_from') {
    var srcFn = AV_COEFF_SOURCES[p.sourceType] || AV_COEFF_SOURCES.chemical_topo;
    var coefSrcExpr = srcFn(p.sourceX);
    feedbackVars = 'coef_src' + X + ':' + coefSrcExpr + '$\n'
      + 'coef_eff' + X + ':if listp(coef_src' + X + ') and length(coef_src' + X + ')=' + n + ' and every(lambda([cc],numberp(cc) and cc>0),coef_src' + X + ') then coef_src' + X + ' else coef' + X + '$\n'
      + 'rat_eff' + X + ':makelist(if sgn' + X + '[k]=-1 and exc' + X + '[k]=0 then n0' + X + '[k]/coef_eff' + X + '[k] else inf,k,1,' + n + ')$\n'
      + 'xmax_eff' + X + ':apply(min,rat_eff' + X + ')$\n'
      + 'nc_eff' + X + ':makelist(n0' + X + '[k]+sgn' + X + '[k]*coef_eff' + X + '[k]*x,k,1,' + n + ')$\n'
      + 'nf_eff' + X + ':makelist(ev(nc_eff' + X + '[k],x=xmax_eff' + X + '),k,1,' + n + ')$';
    cTans = '[' + displayed.map(function (d) { return 'nc_eff' + X + '[' + d.idx + ']'; }).join(',') + ']';
    fTans = '[' + displayed.map(function (d) { return 'nf_eff' + X + '[' + d.idx + ']'; }).join(',') + ']';
    xmaxTans = 'xmax_eff' + X;
    followNote = '<p style="font-size:.85em;color:#6b7280;margin-top:.4em;">ℹ️ '
      + (I18N_D.t('av.follow_note') || 'Ce tableau est corrigé à partir des coefficients que tu as toi-même proposés à la question précédente.')
      + '</p>';
  }

  // ── HTML : tableau généré par boucle sur les espèces affichées ───────────
  var HDR = I18N_D.t('av.hdr_espece') || 'Espèce';
  var ROWLBL = {
    i: I18N_D.t('av.row_initial') || 'État initial (mol)',
    c: I18N_D.t('av.row_encours') || 'En cours (mol)',
    f: I18N_D.t('av.row_final') || 'État final (mol)'
  };
  function thRow() {
    return '<tr><th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;"></th>'
      + displayed.map(function (d) { return '<th style="border:1px solid #cbd5e1;padding:6px;background:#f1f5f9;">\\(' + d.s.nom + '\\)' + (d.s.exces ? ' <em>(excès)</em>' : '') + (d.s.solvant ? '' : '') + '</th>'; }).join('')
      + '</tr>';
  }
  function tdRow(label, names) {
    return '<tr><td style="border:1px solid #cbd5e1;padding:6px;font-weight:600;">' + label + '</td>'
      + names.map(function (nm) { return '<td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">[[input:' + nm + ']]</td>'; }).join('')
      + '</tr>';
  }
  // Équation-bilan affichée au-dessus du tableau (pas seulement les noms d'espèces en
  // en-tête de colonne) : réactifs -> produits, dans l'ordre de saisie, coefficient
  // toujours affiché (même =1) pour rester fidèle à l'écriture du professeur.
  function eqTerm(d) { return d.s.coeff + '\\,' + d.s.nom; }
  var eqReac = displayed.filter(function (d) { return d.s.role !== 'produit'; }).map(eqTerm).join('\\ +\\ ');
  var eqProd = displayed.filter(function (d) { return d.s.role === 'produit'; }).map(eqTerm).join('\\ +\\ ');
  var eqRow = '<p style="text-align:center;font-weight:700;font-size:1.05em;margin:2px 0 10px;">\\(' + eqReac + '\\ \\longrightarrow\\ ' + eqProd + '\\)</p>';
  var introRow = '<p style="font-size:.9em;color:#475569;margin:4px 0 10px;">' + (I18N_D.t('av.table_intro') || "Complète le tableau en indiquant les quantités de matière, en mol, à chaque étape ; x désigne l'avancement de la réaction.") + '</p>';
  var table = eqRow + introRow
    + '<table style="border-collapse:collapse;margin:10px 0;">'
    + thRow()
    + tdRow(ROWLBL.i, iNames)
    + tdRow(ROWLBL.c, cNames)
    + tdRow(ROWLBL.f, fNames)
    + '</table>'
    + '<p>' + (I18N_D.t('av.xmax_label') || "Avancement maximal x_max =") + ' [[input:' + xmaxName + ']]</p>';

  var textFrag = (p.text ? '<p>' + p.text + '</p>' : '') + table + followNote;

  // ── Inputs ────────────────────────────────────────────────────────────
  var inputBlocks = [];
  displayed.forEach(function (d, k) {
    inputBlocks.push(mkInput_D({ name: iNames[k], type: 'numerical', tans: 'n0' + X + '[' + d.idx + ']', boxsize: 8, forbidfloat: 0 }));
    inputBlocks.push(mkInput_D({ name: cNames[k], type: 'algebraic', tans: 'nc' + X + '[' + d.idx + ']', boxsize: 15, forbidfloat: 0 }));
    inputBlocks.push(mkInput_D({ name: fNames[k], type: 'numerical', tans: 'nf' + X + '[' + d.idx + ']', boxsize: 8, forbidfloat: 0 }));
  });
  inputBlocks.push(mkInput_D({ name: xmaxName, type: 'numerical', tans: 'xmax' + X, boxsize: 8, forbidfloat: 0 }));

  // ── PRT : 1 seul prt${X}, 4 nœuds chaînés (Initial → En cours → Final → x_max) ──
  var prtName = 'prt' + X;
  // Le <name> d'un nœud PRT DOIT être l'indice séquentiel de sa position ('0','1',...) :
  // c'est cette valeur, pas une étiquette descriptive, que truenextnode/falsenextnode
  // référencent (cf. gen-optique.js/gen-acidebase.js/gen-units.js — même convention).
  // Un nom descriptif ("ninit1") romprait la chaîne car aucun autre nœud ne "pointe"
  // vers ce texte : Moodle ne retrouve alors plus le nœud suivant à l'import.
  var nInit = '0', nEnc = '1', nFin = '2', nXmax = '3';

  var fbInitTrue = I18N_D.t('av.fb_init_true') || 'Ligne « État initial » correcte.';
  var fbInitFalse = I18N_D.t('av.fb_init_false') || "Ligne « État initial » incorrecte : vérifie la quantité initiale de chaque espèce (0 pour les espèces formées).";
  var fbEncTrue = (I18N_D.t('av.fb_enc_true') || 'Ligne « En cours » correcte.') + followNote;
  var fbEncFalse = (I18N_D.t('av.fb_enc_false') || "Ligne « En cours » incorrecte : exprime chaque quantité en fonction de x à l'aide des coefficients stœchiométriques et du signe (- pour un réactif, + pour un produit).") + followNote;
  var fbFinTrue = (I18N_D.t('av.fb_fin_true') || 'Ligne « État final » correcte.') + followNote;
  var fbFinFalse = (I18N_D.t('av.fb_fin_false') || "Ligne « État final » incorrecte : remplace x par x_max dans la ligne « En cours ».") + followNote;
  var fbXmaxTrue = 'x_max ' + (I18N_D.t('av.fb_xmax_true') || 'correct.') + followNote;
  var fbXmaxFalse = (I18N_D.t('av.fb_xmax_false') || 'x_max incorrect : cherche le réactif limitant (hors espèces en excès et hors solvant).') + followNote;

  // nodes reste en texte BRUT (pas de fbBox ici) : c'est cette version qui est
  // exposée via prt.nodes pour la preview (js/preview-avancement.js applique
  // applyFbBox elle-même) et pour prt-manager.js. Seul xmlNodes (copie) porte
  // les encadrés colorés, pour l'export XML — voir js/gen-acidebase.js/gen-redox.js
  // pour le même patron.
  var nodes = [
    { name: nInit, description: 'État initial', answertest: 'AlgEquiv', sans: '[' + iNames.join(',') + ']', tans: iTans,
      truescoremode: '+', truescore: '1/3', truenextnode: '1', trueanswernote: prtName + '-1-T', truefeedback: fbInitTrue,
      falsescoremode: '+', falsescore: '0', falsenextnode: '1', falseanswernote: prtName + '-1-F', falsefeedback: fbInitFalse },
    { name: nEnc, description: 'En cours', answertest: 'AlgEquiv', sans: '[' + cNames.join(',') + ']', tans: cTans,
      truescoremode: '+', truescore: '1/3', truenextnode: '2', trueanswernote: prtName + '-2-T', truefeedback: fbEncTrue,
      falsescoremode: '+', falsescore: '0', falsenextnode: '2', falseanswernote: prtName + '-2-F', falsefeedback: fbEncFalse },
    { name: nFin, description: 'État final', answertest: 'AlgEquiv', sans: '[' + fNames.join(',') + ']', tans: fTans,
      truescoremode: '+', truescore: '1/3', truenextnode: '3', trueanswernote: prtName + '-3-T', truefeedback: fbFinTrue,
      falsescoremode: '+', falsescore: '0', falsenextnode: '3', falseanswernote: prtName + '-3-F', falsefeedback: fbFinFalse },
    { name: nXmax, description: 'x_max', answertest: 'AlgEquiv', sans: xmaxName, tans: xmaxTans,
      truescoremode: '+', truescore: '0', truenextnode: '-1', trueanswernote: prtName + '-4-T', truefeedback: fbXmaxTrue,
      falsescoremode: '+', falsescore: '0', falsenextnode: '-1', falseanswernote: prtName + '-4-F', falsefeedback: fbXmaxFalse }
  ];
  var prtMeta = { name: prtName, value: bareme.toFixed(7), autosimplify: '1', feedbackstyle: '1', feedbackvariables: feedbackVars };
  var xmlNodes = nodes.map(function (n) {
    return Object.assign({}, n, {
      truefeedback: applyFbBox_D('true', n.truefeedback),
      falsefeedback: applyFbBox_D('false', n.falsefeedback)
    });
  });
  var prtXML = buildPrtXml_D(prtMeta, xmlNodes);

  var generalFeedback = applyFbBox_D('general', mkFbGen_D(
    '<p>' + (I18N_D.t('av.gf_intro') || "Corrigé du tableau d'avancement :") + '</p>'
    + '<p>x_max = {@xmax' + X + '@}</p>',
    p.fbGen
  ));

  return {
    type: 'avancement',
    bareme: bareme,
    vars: vars,
    qnote: 'xmax={@xmax' + X + '@}',
    textFrag: textFrag,
    inputXML: inputBlocks.join('\n'),
    prtXML: prtXML,
    prt: { meta: prtMeta, nodes: nodes },
    generalFeedback: generalFeedback,
    feedbackRef: '[[feedback:' + prtName + ']]'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { genAvancementCore, AV_COEFF_SOURCES };
}
