function renderPreviewHTML_statistiques(state) {
  var realParts = {};
  try { realParts = (typeof genStatistiquesCore === 'function') ? genStatistiquesCore(1, _statBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('stat', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  // ri(a,b) est un alias local de rand() défini dans gen-math-statistiques.js : toute
  // valeur qui en dépend encore requiert un tirage Maxima réel, donc n'est pas "connue".
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  // _hsPrtBoxes lit prt.nodes, désormais bruts (sans encadré, cf. js/fb-box.js) :
  // on applique l'encadré uniquement ici, au point d'affichage de l'aperçu — même
  // convention que preview-basen.js/preview-inequation.js, nécessaire pour pouvoir
  // substituer state.realFbWrongHTML (déjà encadré côté serveur) sans double-boîte.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var wrongFbHTML = _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars);
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _statRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée (série tirée aléatoirement via ri(...)).
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realGeneralFeedback, knownVars);
    if (state.realFbWrongHTML) wrongFbHTML = state.realFbWrongHTML;
  } else {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    var bodyFrag = (realParts.textFrag || '')
      .replace(/^<div style="background:#0284c7;border-left:5px solid #0369a1;[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
    scenarioHTML = bodyFrag
      ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement (s\xe9rie statistique) — voir l\'aper\xe7u \xe9l\xe8ve ci-dessous pour un exemple concret.</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realGeneralFeedback, knownVars) + note;
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.statistiques'), badgeColor: '#0f766e', noteBg: '#f0fdfa', noteColor: '#0f766e',
    prefix: 'stat', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: wrongFbHTML, fbGen: state.fbGen, fbBoxesPreWrapped: true
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// Même mécanisme que preview-basen.js (_bnRefreshRealPreview) : le HTML de /render
// (questionrender) déjà substitué par Maxima pour l'énoncé (série tirée via ri(...),
// jamais résolue par le recalcul JS local ci-dessus), et questionsamplesolutiontext
// pour le bloc "Correction". Le nom de l'input dépend du scénario (ans_med/ans_std/
// ans_et/ans_moy/ans_var/ans_q1/ans_q3, cf. gen-math-statistiques.js) : on le lit
// dynamiquement dans le XML généré via _extractInputNames plutôt que le coder en dur.
(function () {
  var _statPreviewSeed = null;
  var _statRealPreviewGen = 0;
  var _statLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _statEnsurePreviewSeed() {
    if (!_statPreviewSeed) _statPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _statPreviewSeed;
  }

  function _statSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('stat-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _statCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _statCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais syntaxiquement valide (NumAbsolute compare des
  // nombres) : un entier très négatif, jamais atteint par une série tirée en positif.
  async function _statFetchRealFbWrong(xml, seed) {
    try {
      var inputNames = (typeof _extractInputNames === 'function') ? _extractInputNames(xml) : [];
      if (!inputNames.length) return null;
      var answers = {};
      answers[inputNames[0]] = '-999999';
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _statCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _statRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'statistiques') return;
    var gen = ++_statRealPreviewGen;

    var p;
    try { p = _statBuildParams(); } catch (e) { return; }

    _statSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genStatistiquesCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_statEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _statRealPreviewGen) _statSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _statPreviewSeed);
      if (gen !== _statRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _statLastReal = {
        bodyHTML: _statCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.statRefreshPreview === 'function') window.statRefreshPreview();
      _statSetRealPreviewStatus('', false);

      var fbWrongHTML = await _statFetchRealFbWrong(xml, _statPreviewSeed);
      if (gen !== _statRealPreviewGen || !_statLastReal) return;
      if (fbWrongHTML) {
        _statLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.statRefreshPreview === 'function') window.statRefreshPreview();
      }
    } catch (e) {
      if (gen !== _statRealPreviewGen) return;
      _statSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function statRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'statistiques') return;
    _statPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _statRefreshRealPreview();
  }
  window.statRerollPreviewSeed = statRerollPreviewSeed;

  function statShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'statistiques') return;
    _statEnsurePreviewSeed();
    _statRefreshRealPreview();
  }
  window.statShowRealPreview = statShowRealPreview;

  function _statAugmentStateWithReal(state) {
    if (_statLastReal) {
      state.realBodyHTML = _statLastReal.bodyHTML;
      state.realFbGenHTML = _statLastReal.fbGenHTML;
      state.realFbWrongHTML = _statLastReal.fbWrongHTML;
    }
  }

  window.statRefreshPreview = _hsWireSimplePreview('statistiques', 'stat', 'stat-preview-container', 'fp-statistiques', renderPreviewHTML_statistiques, false, _statAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-statistiques');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _statPreviewSeed = null;
          _statLastReal = null;
          var rerollBtn = document.getElementById('stat-reroll-preview-btn');
          var showRealBtn = document.getElementById('stat-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genStatistiquesCore(1, _statBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _statSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
