function renderPreviewHTML_trigonometrie(state) {
  var realParts = {};
  try { realParts = (typeof genTrigonometrieCore === 'function') ? genTrigonometrieCore(1, _trigBuildParams()) : {}; } catch (e) { realParts = {}; }
  var realGeneralFeedback = realParts.generalFeedback || '';
  _hsUpdateRerollVisibility('trig', _hsHasRandomization(realParts.vars || ''));
  var knownVars = _calcExtractKnownVars(realParts.vars || '');
  Object.keys(knownVars).forEach(function(k) { if (/\bri\s*\(/.test(knownVars[k])) delete knownVars[k]; });
  var prtBoxes = _hsPrtBoxes(realParts);
  var scenarioHTML, fbGenBody;
  if (state.realBodyHTML) {
    // Tirage réellement calculé par Maxima (voir _trigRefreshRealPreview plus bas) :
    // plus aucune valeur q_{...} indéterminée, ni pour l'énoncé ni pour la correction.
    scenarioHTML = state.realBodyHTML;
    fbGenBody = state.realFbGenHTML || _calcTokenizeForPreview(realGeneralFeedback, knownVars);
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
    badge: I18N.t('type.trigonometrie'), badgeColor: '#b45309', noteBg: '#fffbeb', noteColor: '#b45309',
    prefix: 'trig', bareme: state.bareme || 1,
    text: _hsRenderMath(scenarioHTML),
    hideExampleBox: true,
    extraHeaderNote: state.realBodyHTML ? ('🟢 ' + I18N.t('common.preview_real_badge')) : ('🎲 ' + I18N.t('common.preview_sim_badge')),
    fbOkDesc: prtBoxes.okDesc, fbWrongDesc: prtBoxes.wrongDesc,
    fbGenAuto: _hsRenderMath(fbGenBody),
    fbOk: _calcTokenizeForPreview(prtBoxes.okFb, knownVars), fbWrong: _calcTokenizeForPreview(prtBoxes.wrongFb, knownVars), fbGen: state.fbGen,
    extraFeedbackNodes: (realParts.diagNodes || []).map(function(n) {
      return { desc: n.desc, fb: _calcTokenizeForPreview(n.fb, knownVars) };
    })
  });
}

// ── APERÇU RÉEL (via Maxima) ─────────────────────────────────────
// Même mécanisme que preview-inequation.js : /render fournit questionrender
// (énoncé déjà substitué) et questionsamplesolutiontext (correction déjà
// substituée) — fbOk/fbWrong restent gérées par la simulation locale.
(function () {
  var _trigPreviewSeed = null;
  var _trigRealPreviewGen = 0;
  var _trigLastReal = null; // { bodyHTML, fbGenHTML }

  function _trigEnsurePreviewSeed() {
    if (!_trigPreviewSeed) _trigPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    return _trigPreviewSeed;
  }

  function _trigSetRealPreviewStatus(msg, isError) {
    var el = document.getElementById('trig-real-preview-status');
    if (!el) return;
    el.textContent = msg || '';
    el.style.color = isError ? '#b91c1c' : '#64748b';
  }

  function _trigCleanBodyHTML(html) {
    var fakeInputStyle = 'padding:6px 10px;border:1px solid #94a3b8;border-radius:5px;font-size:.95rem;background:#f8fafc;color:#94a3b8;width:110px;';
    return (html || '')
      .replace(/^<div style="[^"]*border-left[^"]*"[^>]*>[\s\S]*?<\/div>/, '')
      .replace(/\[\[input:[^\]]+\]\]/g, '<input type="text" disabled aria-label="Aperçu du champ de réponse" style="' + fakeInputStyle + '">')
      .replace(/\[\[validation:[^\]]+\]\]/g, '');
  }

  async function _trigRefreshRealPreview() {
    if (typeof currentType === 'undefined' || currentType !== 'trigonometrie') return;
    var gen = ++_trigRealPreviewGen;

    var p;
    try { p = _trigBuildParams(); } catch (e) { return; }

    _trigSetRealPreviewStatus(I18N.t('common.preview_real_loading'), false);

    var xml;
    try {
      var parts = genTrigonometrieCore(1, p);
      xml = insertDeployedSeeds(buildStandaloneQuestionXML(parts), [_trigEnsurePreviewSeed()]);
    } catch (e) {
      if (gen === _trigRealPreviewGen) _trigSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
      return;
    }

    try {
      var renderRes = await maximaRenderXML(xml, _trigPreviewSeed);
      if (gen !== _trigRealPreviewGen) return; // réponse obsolète

      if (!renderRes || !renderRes.questionrender) throw new Error('forme inattendue');
      _trigLastReal = {
        bodyHTML: _trigCleanBodyHTML(renderRes.questionrender),
        fbGenHTML: renderRes.questionsamplesolutiontext || ''
      };
      if (typeof window.trigRefreshPreview === 'function') window.trigRefreshPreview();
      _trigSetRealPreviewStatus('', false);
    } catch (e) {
      if (gen !== _trigRealPreviewGen) return;
      _trigSetRealPreviewStatus('⚠️ ' + I18N.t('common.preview_real_fallback'), true);
    }
  }

  function trigRerollPreviewSeed() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'trigonometrie') return;
    _trigPreviewSeed = Math.floor(Math.random() * 1000000) + 1;
    _trigRefreshRealPreview();
  }
  window.trigRerollPreviewSeed = trigRerollPreviewSeed;

  function trigShowRealPreview() {
    if (typeof maximaConfigured !== 'function' || !maximaConfigured()) return;
    if (typeof currentType === 'undefined' || currentType !== 'trigonometrie') return;
    _trigEnsurePreviewSeed();
    _trigRefreshRealPreview();
  }
  window.trigShowRealPreview = trigShowRealPreview;

  function _trigAugmentStateWithReal(state) {
    if (_trigLastReal) {
      state.realBodyHTML = _trigLastReal.bodyHTML;
      state.realFbGenHTML = _trigLastReal.fbGenHTML;
    }
  }

  window.trigRefreshPreview = _hsWireSimplePreview('trigonometrie', 'trig', 'trig-preview-container', 'fp-trigonometrie', renderPreviewHTML_trigonometrie, false, _trigAugmentStateWithReal);

  // Nouvelle session d'édition (panneau réouvert) → seed réinitialisé, aperçu réel
  // effacé, boutons affichés/masqués selon que Maxima est configuré.
  (function wireRealPreviewPanel() {
    var panel = document.getElementById('fp-trigonometrie');
    if (!panel) return;
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'style' && panel.style.display !== 'none') {
          _trigPreviewSeed = null;
          _trigLastReal = null;
          var rerollBtn = document.getElementById('trig-reroll-preview-btn');
          var showRealBtn = document.getElementById('trig-show-real-preview-btn');
          var configured = typeof maximaConfigured === 'function' && maximaConfigured();
          var hasRandom = true;
          try { hasRandom = _hsHasRandomization(genTrigonometrieCore(1, _trigBuildParams()).vars); } catch (e) { hasRandom = true; }
          if (rerollBtn) rerollBtn.style.display = (configured && hasRandom) ? '' : 'none';
          if (showRealBtn) showRealBtn.style.display = configured ? '' : 'none';
          _trigSetRealPreviewStatus('', false);
        }
      });
    }).observe(panel, { attributes: true });
  })();
})();
