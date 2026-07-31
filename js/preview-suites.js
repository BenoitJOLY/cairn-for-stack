function renderPreviewHTML_suites(state) {
  var realParts = {};
  try { realParts = (typeof genSuitesCore === 'function') ? genSuitesCore(1, _suiBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('sui', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  // _hsPrtBoxes lit prt.nodes, bruts (sans encadré) : on applique l'encadré ici, au
  // point d'affichage de l'aperçu — même convention que preview-basen.js/
  // preview-statistiques.js, nécessaire pour pouvoir substituer state.realFbWrongHTML
  // (déjà encadré côté serveur) sans double encadré.
  prtBoxes.okFb = applyFbBox('true', prtBoxes.okFb);
  prtBoxes.wrongFb = applyFbBox('false', prtBoxes.wrongFb);
  var wrongFbHTML = _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars);
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _suiRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée (raison/quotient tirés via ri(...)).
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realGeneralFeedback, knownVars);
    if (state.realFbWrongHTML) wrongFbHTML = state.realFbWrongHTML;
  } else {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    var bodyFrag = (realParts.textFrag || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
    scenarioHTML = bodyFrag ? _calcTokenizeForPreview(bodyFrag, knownVars)
      : '<em style="color:#6b7280;">Question g\xe9n\xe9r\xe9e automatiquement — voir l\'aper\xe7u \xe9l\xe8ve pour un exemple.</em>';
    var note = '<p><em style="color:#475569;font-size:.82rem;">' + I18N.t('common.preview_maxima_vars_note') + '</em></p>';
    fbGenBody = _calcTokenizeForPreview(realGeneralFeedback, knownVars) + note;
  }
  return _hsSimplePreviewHTML({
    badge: I18N.t('type.suites'), badgeColor: '#7e22ce', noteBg: '#f5f3ff', noteColor: '#7e22ce',
    prefix: 'sui', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: wrongFbHTML, fbGen: state.fbGen, fbBoxesPreWrapped: true,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// Même mécanisme que preview-basen.js/preview-statistiques.js : le HTML de /render
// (questionrender) déjà substitué par Maxima pour l'énoncé (raison/quotient tirés
// via ri(...), jamais résolus par le recalcul JS local ci-dessus), et
// questionsamplesolutiontext pour le bloc "Correction". Le nom de l'input dépend du
// scénario (ans_un/ans_sn/ans_lim, cf. genSuitesCore) : lu dynamiquement dans le XML
// généré via _extractInputNames plutôt que codé en dur.
(function () {
  var _suiPreviewSeed = null;
  var _suiRealPreviewGen = 0;
  var _suiLastReal = null; // { bodyHTML, fbGenHTML, fbWrongHTML }

  function _suiEnsurePreviewSeed() {
    if (!_suiPreviewSeed) _suiPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _suiPreviewSeed;
  }

  function _suiSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('sui-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _suiCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  function _suiCleanFbWrongHTML(html) {
    return (html || '').replace(/^<div class="[a-z]+"><\/div>/, '');
  }

  // Sonde volontairement fausse mais syntaxiquement valide (AlgEquiv, la plupart des
  // champs interdisant les flottants) : un entier très négatif, jamais atteint par un
  // terme/une somme/une limite de suite tirée avec les bornes usuelles.
  async function _suiFetchRealFbWrong(xml, seed) {
    try {
      var inputNames = (typeof _extractInputNames === 'function') ? _extractInputNames(xml) : [];
      if (!inputNames.length) return null;
      var answers = {};
      answers[inputNames[0]] = '-999999';
      var gradeRes = await maximaGradeXML(xml, seed, answers);
      if (!gradeRes || !gradeRes.isgradable || !gradeRes.prts || !gradeRes.prts.prt1) return null;
      return _suiCleanFbWrongHTML(gradeRes.prts.prt1);
    } catch (e) { return null; }
  }

  async function _suiRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'suites') return;
    var gen = ++_suiRealPreviewGen;

    var p;
    try { p = _suiBuildParams(); } catch (e) { return; }

    _suiSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genSuitesCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_suiEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _suiRealPreviewGen) _suiSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _suiPreviewSeed);
      if (gen !== _suiRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _suiLastReal = {
        bodyHTML: _suiCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || '',
        fbWrongHTML: null
      };
      if (typeof window.suiRefreshPreview === 'function') window.suiRefreshPreview();
      _suiSetRealPreviewStatus('', false);

      var fbWrongHTML = await _suiFetchRealFbWrong(xml, _suiPreviewSeed);
      if (gen !== _suiRealPreviewGen || !_suiLastReal) return;
      if (fbWrongHTML) {
        _suiLastReal.fbWrongHTML = fbWrongHTML;
        if (typeof window.suiRefreshPreview === 'function') window.suiRefreshPreview();
      }
    } catch (e) {
      if (gen !== _suiRealPreviewGen) return;
      _suiSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function suiRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'suites') return;
    _suiPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _suiRefreshRealPreview();
  }
  window.suiRerollPreviewSeed = suiRerollPreviewSeed;

  function suiShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'suites') return;
    _suiEnsurePreviewSeed();
    _suiRefreshRealPreview();
  }
  window.suiShowRealPreview = suiShowRealPreview;

  function _suiAugmentStateWithReal(state) {
    if (_suiLastReal) {
      state.realBodyHTML = _suiLastReal.bodyHTML;
      state.realFbGenHTML = _suiLastReal.fbGenHTML;
      state.realFbWrongHTML = _suiLastReal.fbWrongHTML;
    }
  }

  window.suiRefreshPreview = _hsWireSimplePreview('suites', 'sui', 'sui-preview-container', 'fp-suites', renderPreviewHTML_suites, false, _suiAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré (même
  // convention que preview-basen.js).
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-suites');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _suiPreviewSeed = null;
          _suiLastReal = null;
          var rerollBtn = document.getElementById('sui-reroll-preview-btn');
          var showRealBtn = document.getElementById('sui-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genSuitesCore(1, _suiBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _suiSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
