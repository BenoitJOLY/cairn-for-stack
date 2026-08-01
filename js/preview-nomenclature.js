// preview-nomenclature.js — aperçu enseignant (simulé + réel Maxima) pour le chip
// unique "Nomenclature" (3 modes internes Fixe/Aléatoire/Checkbox, cf. js/gen-nomenclature.js).
//
// Particularité par rapport aux autres chips à aperçu réel (statistiques, calcul...) :
// les variables Maxima de gen-nomenclature.js sont suffixées par X (nom${X}, famille${X}...),
// pas préfixées par q (convention q_nom, q_famille...) — _calcExtractKnownVars /
// _calcTokenizeForPreview (js/preview.js) ne s'appliquent donc pas ici. On utilise à la
// place un tokenizer maison _nomTokenize() + une reconstitution JS pure du tirage aléatoire
// (_nomSimulateDraw, via NOM_DONNES déjà disponible côté client) pour l'aperçu "🎲 simulé".
//
// Le viewer SMILES (iframe vers le placeholder https://mon-domaine.com/viewer.html, cf.
// _nomIframe() dans gen-nomenclature.js) n'est délibérément jamais embarqué dans l'aperçu :
// ni domaine réel, ni appel réseau externe non sollicité par l'enseignant. On affiche à la
// place la chaîne SMILES brute dans un encart (_nomSmilesBox).

function _nomEscapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _nomCarbonCount(smiles) {
  var s = String(smiles || '');
  var count = 0;
  for (var i = 0; i < s.length; i++) if (s.charAt(i) === 'C') count++;
  return count;
}

// Reproduit côté JS le filtre Maxima donnes_filtres${X}/donnes_pool${X} (repli sur le
// pool complet si le filtre famille+carbones ne matche rien) — cf. gen-nomenclature.js.
function _nomFilteredPool(paramFamille, paramCarbonesMax) {
  var fam = paramFamille || 'Toutes';
  var cmax = (paramCarbonesMax === '' || paramCarbonesMax === null || paramCarbonesMax === undefined) ? null : parseInt(paramCarbonesMax, 10);
  var filtered = NOM_DONNES.filter(function (m) {
    return (fam === 'Toutes' || m[0] === fam) && (cmax === null || isNaN(cmax) || _nomCarbonCount(m[2]) <= cmax);
  });
  return filtered.length ? filtered : NOM_DONNES;
}

// Simulation JS pure du tirage rand(...) de Maxima (mode Aléatoire) : ne peut jamais
// être identique au tirage réel (seed Maxima), sert uniquement d'illustration avant
// que l'enseignant ne déclenche "👁️ Aperçu réel".
function _nomSimulateDraw(paramFamille, paramCarbonesMax) {
  var pool = _nomFilteredPool(paramFamille, paramCarbonesMax);
  var pick = pool[Math.floor(Math.random() * pool.length)];
  return { famille: pick[0], nom: pick[1], smiles: pick[2] };
}

function _nomSmilesBox(smiles) {
  return '<div style="display:inline-block;padding:10px 14px;background:#ecfeff;border:1.5px dashed #67e8f9;border-radius:8px;font-family:monospace;font-size:.95rem;color:#0e7490;">'
    + '🧬 SMILES : <strong>' + _nomEscapeHtml(smiles) + '</strong>'
    + '<div style="font-size:.74rem;color:#0e7490;font-weight:400;margin-top:4px;font-family:-apple-system,Segoe UI,Arial,sans-serif;">(la représentation moléculaire réelle ne s\'affiche que dans Moodle)</div>'
    + '</div>';
}

// Reverse la chaîne de ssubst de urlChain() (gen-nomenclature.js) — pas un décodage
// URI complet : seuls ces 5 motifs sont substitués côté Maxima.
function _nomDecodeSmilesUrl(encoded) {
  return String(encoded || '')
    .replace(/%5C/g, '\\')
    .replace(/%2F/g, '/')
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%3D/g, '=');
}

function _nomTokenize(html, known) {
  return String(html || '').replace(/\{@([a-zA-Z0-9_]+)@\}/g, function (m, name) {
    return (known && Object.prototype.hasOwnProperty.call(known, name)) ? known[name] : m;
  });
}

// Reproduit le style exact des fragments fb_bons${X}/fb_faux${X}/fb_manques${X}
// (sconcat(...) dans gen-nomenclature.js, mode Checkbox) pour que l'aperçu simulé et
// l'aperçu réel se ressemblent visuellement.
function _nomCbFbBox(kind, items) {
  if (!items || !items.length) return '';
  var styles = {
    bons: { style: 'color:green;border-left:4px solid green;padding:7px;margin:3px 0', title: 'Groupes correctement identifiés :' },
    faux: { style: 'color:red;border-left:4px solid red;padding:7px;margin:3px 0', title: 'Groupes cochés à tort (absents de la molécule) :' },
    manques: { style: "color:#92400e;background:#fffbeb;border-left:4px solid #f59e0b;padding:7px;margin:3px 0", title: 'Groupes présents mais oubliés :' }
  };
  var s = styles[kind];
  return '<div style="' + s.style + '"><b>' + s.title + '</b><ul>'
    + items.map(function (g) { return '<li>' + _nomEscapeHtml(g) + '</li>'; }).join('')
    + '</ul></div>';
}

function _nomStripBannerAndInputs(html, smilesReplacement) {
  var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:160px;';
  return String(html || '')
    .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
    .replace(/<iframe src="https:\/\/mon-domaine\.com\/viewer\.html\?smiles=\{@molecule_smiles_url\d+@\}"[^>]*><\/iframe>/, smilesReplacement)
    .replace(/<iframe src="https:\/\/mon-domaine\.com\/viewer\.html\?smiles=([^"]*)"[^>]*><\/iframe>/, function (m, enc) { return _nomSmilesBox(_nomDecodeSmilesUrl(enc)); })
    .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
    .replace(/\[\[validation:[^\]]+\]\]/g, '');
}

function _nomLocalScenarioHTML(state, known, realParts, smiles) {
  var body = _nomStripBannerAndInputs(realParts.textFrag, _nomSmilesBox(smiles));
  return _nomTokenize(body, known);
}

function renderPreviewHTML_nomenclature(state) {
  var mode = state.mode || 'fixe';
  var realParts = {};
  try { realParts = genNomenclatureCore(1, state); } catch (e) { realParts = {}; }
  _hsUpdateRerollVisibility('nom', _hsHasRandomization(realParts.vars || ''));

  var known = {};
  var extraFeedbackNodes = [];
  var smiles = '';
  var knownOk, knownWrong;

  if (mode === 'aleatoire') {
    var draw = _nomSimulateDraw(state.paramFamille, state.paramCarbonesMax);
    smiles = draw.smiles;
    known.nom1 = _nomEscapeHtml(draw.nom);
    known.famille1 = _nomEscapeHtml(draw.famille);
    // _hsPrtBoxes ne montre que node[0] (ok) et node[last] (wrong) : le PRT à 2 nœuds
    // de gen-nomenclature.js (nom puis famille) laisse donc invisibles node0.falsefeedback
    // (nom faux) et node1.truefeedback (famille correcte) — on les expose via extraFeedbackNodes
    // (mécanisme déjà prévu par _hsSimplePreviewHTML pour ce cas, cf. preview-basen.js).
    var nodes = (realParts.prt && realParts.prt.nodes) || [];
    if (nodes[0]) extraFeedbackNodes.push({ desc: nodes[0].description, fb: _nomTokenize(nodes[0].falsefeedback, known) });
    if (nodes[1]) extraFeedbackNodes.push({ desc: nodes[1].description, fb: _nomTokenize(nodes[1].truefeedback, known) });
  } else if (mode === 'checkbox') {
    smiles = state.cbSmiles;
    var vrais = _nomSplitList(state.cbVrais);
    known.groupes_vrais1 = vrais.length ? vrais.join(', ') : '<em>(aucun)</em>';
    knownOk = Object.assign({}, known, { fb_bons1: _nomCbFbBox('bons', vrais), fb_faux1: '', fb_manques1: '' });
    knownWrong = Object.assign({}, known, { fb_bons1: '', fb_faux1: '', fb_manques1: _nomCbFbBox('manques', vrais), pct1: '0' });
  } else { // fixe
    smiles = state.fixeSmiles;
    known.nom_attendu1 = _nomEscapeHtml(state.fixeNom || '');
    known.famille_attendue1 = _nomEscapeHtml(state.fixeFamille || '');
  }
  if (!knownOk) knownOk = known;
  if (!knownWrong) knownWrong = known;

  var prtBoxes = _hsPrtBoxes(realParts);
  prtBoxes.okFb = applyFbBox('true', _nomTokenize(prtBoxes.okFb, knownOk));
  prtBoxes.wrongFb = applyFbBox('false', _nomTokenize(prtBoxes.wrongFb, knownWrong));

  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _nomTokenize(realParts.generalFeedback || '', known);
    if (state.realFbWrongHTML) prtBoxes.wrongFb = state.realFbWrongHTML;
  } else {
    scenarioHTML = _nomLocalScenarioHTML(state, known, realParts, smiles);
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _nomTokenize(realParts.generalFeedback || '', known) + note;
  }

  return _hsSimplePreviewHTML({
    badge: dataLabel('nomenclature'), badgeColor: '#0e7490', noteBg: '#ecfeff', noteColor: '#0e7490',
    prefix: 'nom', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: prtBoxes.okFb, fbWrong: prtBoxes.wrongFb, fbGen: state.fbGen, fbBoxesPreWrapped: true,
    extraFeedbackNodes: extraFeedbackNodes
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// X=1 fixé (question autonome isolée, cf. buildStandaloneQuestionXML) : les noms
// d'input sont donc toujours ans1 (fixe/checkbox) ou ans1n/ans1f (aléatoire).
(function () {
  var _nomPreviewSeed = null;
  var _nomRealPreviewGen = 0;
  var _nomLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _nomEnsurePreviewSeed() {
    if (!_nomPreviewSeed) _nomPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _nomPreviewSeed;
  }

  function _nomSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('nom-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _nomCleanBodyHTML(html) {
    return _nomStripBannerAndInputs(html, '');
  }

  function _nomCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse (mais syntaxiquement valide pour chaque type d'input du
  // mode courant) pour récupérer le vrai feedback "réponse incorrecte" côté Maxima.
  async function _nomFetchRealFbWrong(xml, seed, mode, renderRes) {
    try {
      var answers = {};
      if (mode === 'aleatoire') {
        answers.ans1n = '__reponse_fausse__';
        answers.ans1f = '__famille_fausse__';
      } else if (mode === 'checkbox') {
        var ir = renderRes && renderRes.questioninputs && renderRes.questioninputs.ans1;
        var options = ir && ir.configuration && ir.configuration.options;
        if (!options) return null;
        Object.keys(options).forEach(function (k) { answers['ans1_' + k] = '0'; });
      } else {
        answers.ans1 = '__reponse_fausse__';
      }
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _nomCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _nomRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'nomenclature') return;
    var gen = ++_nomRealPreviewGen;

    var p;
    try { p = _nomReadFormParams(); } catch (e) { return; }
    var mode = p.mode || 'fixe';

    _nomSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genNomenclatureCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_nomEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _nomRealPreviewGen) _nomSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _nomPreviewSeed);
      if (gen !== _nomRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _nomLastReal = {
        bodyHTML: _nomCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.nomRefreshPreview === 'function') window.nomRefreshPreview();
      _nomSetRealPreviewStatus('', false);

      var fbWrongHTML = await _nomFetchRealFbWrong(xml, _nomPreviewSeed, mode, renderRes);
      if (gen !== _nomRealPreviewGen || !_nomLastReal) return;
      if (fbWrongHTML) {
        _nomLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.nomRefreshPreview === 'function') window.nomRefreshPreview();
      }
    } catch (e) {
      if (gen !== _nomRealPreviewGen) return;
      _nomSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function nomRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'nomenclature') return;
    _nomPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _nomRefreshRealPreview();
  }
  window.nomRerollPreviewSeed = nomRerollPreviewSeed;

  function nomShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'nomenclature') return;
    _nomEnsurePreviewSeed();
    _nomRefreshRealPreview();
  }
  window.nomShowRealPreview = nomShowRealPreview;

  function _nomAugmentStateWithReal(state) {
    if (_nomLastReal) {
      state.realBodyHTML = _nomLastReal.bodyHTML;
      state.realFbGenHTML = _nomLastReal.fbGenHTML;
      state.realFbWrongHTML = _nomLastReal.fbWrongHTML;
    }
  }

  window.nomRefreshPreview = _hsWireSimplePreview('nomenclature', 'nom', 'nom-preview-container', 'fp-nomenclature', renderPreviewHTML_nomenclature, false, _nomAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré et que le mode
  // courant est aléatoire (même convention que preview-statistiques.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-nomenclature');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _nomPreviewSeed = null;
          _nomLastReal = null;
          var rerollBtn = document.getElementById('nom-reroll-preview-btn');
          var showRealBtn = document.getElementById('nom-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genNomenclatureCore(1, _nomReadFormParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _nomSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
