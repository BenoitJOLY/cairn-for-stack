// ── CONNEXION MAXIMA RÉELLE (serveur STACK-API / Goemaxima) ──
// Aucune URL n'est codée en dur ici : chaque installation doit renseigner la
// sienne via le panneau de réglages (⚙️ Serveur Maxima), stockée uniquement
// dans le localStorage du navigateur de l'utilisateur — jamais dans le code
// livré ni commit. Voir PLAN.md pour le contexte (chantier "Connexion Maxima réelle").

var MAXIMA_CONFIG_KEY = 'stackforge_maxima_config';

function getMaximaConfig() {
  try {
    var raw = localStorage.getItem(MAXIMA_CONFIG_KEY);
    if (!raw) return { url: '' };
    var cfg = JSON.parse(raw);
    return { url: cfg.url || '' };
  } catch(e) { return { url: '' }; }
}

function setMaximaConfig(cfg) {
  var url = (cfg && cfg.url || '').trim().replace(/\/+$/, '');
  localStorage.setItem(MAXIMA_CONFIG_KEY, JSON.stringify({ url: url }));
}

function maximaConfigured() {
  return !!getMaximaConfig().url;
}

async function _maximaPost(route, body) {
  var cfg = getMaximaConfig();
  if (!cfg.url) throw new Error(I18N.t('maxima.err_non_configure'));
  var res;
  try {
    res = await fetch(cfg.url + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch(e) {
    throw new Error(I18N.t('maxima.err_connexion', { msg: e.message }));
  }
  var data = null;
  try { data = await res.json(); } catch(e) {}
  if (!res.ok) {
    var msg = (data && data.message) ? data.message : ('HTTP ' + res.status);
    throw new Error(msg);
  }
  return data;
}

function maximaTestConnection() {
  return _maximaPost('/diff', { questionDefinition: '<quiz><question type="stack"></question></quiz>' });
}

function maximaRenderXML(xml, seed) {
  var body = { questionDefinition: xml };
  if (seed !== undefined && seed !== null) body.seed = seed;
  return _maximaPost('/render', body);
}

function maximaValidateInput(xml, inputName, answers) {
  return _maximaPost('/validate', { questionDefinition: xml, inputName: inputName, answers: answers || {} });
}

// ── UI : panneau de réglages ──────────────────────────────────────
function openMaximaConfigModal() {
  var cfg = getMaximaConfig();
  var input = document.getElementById('maxima-url-input');
  if (input) input.value = cfg.url;
  var statusEl = document.getElementById('maxima-config-status');
  if (statusEl) { statusEl.textContent = ''; }
  var modal = document.getElementById('maximaConfigModal');
  if (modal) {
    modal.style.display = 'flex';
    if (typeof FocusTrap !== 'undefined') FocusTrap.trap(modal, closeMaximaConfigModal);
  }
}

function closeMaximaConfigModal(e) {
  if (e && e.target !== e.currentTarget) return;
  var modal = document.getElementById('maximaConfigModal');
  if (modal) modal.style.display = 'none';
  if (typeof FocusTrap !== 'undefined') FocusTrap.release();
}

function saveMaximaConfigFromUI() {
  var input = document.getElementById('maxima-url-input');
  var url = input ? input.value.trim() : '';
  setMaximaConfig({ url: url });
  toast(url ? I18N.t('maxima.msg_config_enregistree') : I18N.t('maxima.msg_config_effacee'));
}

async function testMaximaConnectionFromUI() {
  var statusEl = document.getElementById('maxima-config-status');
  var input = document.getElementById('maxima-url-input');
  var url = input ? input.value.trim() : '';
  setMaximaConfig({ url: url });
  if (!url) {
    if (statusEl) { statusEl.textContent = I18N.t('maxima.err_non_configure'); statusEl.style.color = '#b91c1c'; }
    return;
  }
  if (statusEl) { statusEl.textContent = I18N.t('maxima.msg_test_en_cours'); statusEl.style.color = '#64748b'; }
  try {
    await maximaTestConnection();
    if (statusEl) { statusEl.textContent = '✅ ' + I18N.t('maxima.msg_connexion_ok'); statusEl.style.color = '#059669'; }
  } catch(e) {
    if (statusEl) { statusEl.textContent = '❌ ' + e.message; statusEl.style.color = '#b91c1c'; }
  }
}

// ── UI : test d'un XML avec Maxima, avec affichage du statut dans `resultElId` ──
async function _testXMLWithMaxima(xml, resultElId) {
  var resultEl = document.getElementById(resultElId);
  if (!maximaConfigured()) {
    if (resultEl) { resultEl.textContent = I18N.t('maxima.err_non_configure'); resultEl.style.color = '#b91c1c'; }
    openMaximaConfigModal();
    return;
  }
  if (resultEl) { resultEl.textContent = I18N.t('maxima.msg_test_en_cours'); resultEl.style.color = '#64748b'; }
  try {
    var res = await maximaRenderXML(xml);
    if (resultEl) { resultEl.textContent = '✅ ' + I18N.t('maxima.msg_rendu_ok'); resultEl.style.color = '#059669'; }
    console.log('[maxima] render result', res);
  } catch(e) {
    if (resultEl) { resultEl.textContent = '❌ ' + e.message; resultEl.style.color = '#b91c1c'; }
    console.error('[maxima] test error', e);
  }
}

// ── UI : test de la question courante (depuis la fenêtre de tags avant export) ──
function testTagsXMLWithMaxima() {
  var built;
  try {
    built = buildXML();
  } catch(e) {
    console.error(e);
    toast((I18N.t('msg.erreur_xml') || 'Erreur XML : ') + e.message);
    return;
  }
  _lastXML = built.xml;
  _lastQName = built.qName;
  return _testXMLWithMaxima(built.xml, 'tm-maxima-result');
}

// ── UI : test de la question courante (depuis la modale de prévisualisation) ──
function testCurrentXMLWithMaxima() {
  if (!_lastXML) { toast(I18N.t('msg.aucune_donnee_a_previsualiser')); return; }
  return _testXMLWithMaxima(_lastXML, 'maxima-test-result');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getMaximaConfig: getMaximaConfig, setMaximaConfig: setMaximaConfig, maximaConfigured: maximaConfigured,
    maximaTestConnection: maximaTestConnection, maximaRenderXML: maximaRenderXML, maximaValidateInput: maximaValidateInput
  };
}
