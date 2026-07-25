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

// Note : contrairement à /render et /validate, /grade exige que `seed` soit déjà
// déclaré dans un <deployedseed> du XML soumis (HTTP 500 "The question XML does
// not contain deployed variants" sinon) — vérifié par appel direct au serveur
// stack-api du NAS le 2026-07-25.
function maximaGradeXML(xml, seed, answers) {
  return _maximaPost('/grade', { questionDefinition: xml, seed: seed, answers: answers || {} });
}

// Insère les <deployedseed>N</deployedseed> (un par variante validée, forme réellement
// utilisée par STACK — pas de wrapper <deployedseeds>) juste après le dernier </prt>,
// avant <qtest> — position confirmée en comparant deux exports STACK réels le
// 2026-07-25 (test/.../Atelier_circuits_electriques_v6.xml et
// test/.../APN-iso de prise de vue diaph et vitesse changés .xml : dans les deux,
// <deployedseed> suit immédiatement </prt>, jamais juste avant <tags> qui est
// d'ailleurs absent de plusieurs exports réels). Avant ce correctif, insertDeployedSeeds
// plaçait le bloc avant <tags> (ou en toute fin de <question>), une position que
// stack-api ne reconnaît pas comme variante déployée (d'où l'erreur "The question
// XML does not contain deployed variants" malgré la présence du tag).
// `seeds` vide/absent → xml renvoyé tel quel (pas de blocage si Maxima n'est pas
// configuré ou si aucune variante n'a pu être validée).
function insertDeployedSeeds(xml, seeds) {
  if (!seeds || !seeds.length) return xml;
  var block = seeds.map(function(s) { return '    <deployedseed>' + s + '</deployedseed>'; }).join('\n') + '\n';
  var anchor = /(<\/prt>)(?!([\s\S]*<\/prt>))/;
  if (anchor.test(xml)) return xml.replace(anchor, '$1\n' + block.replace(/\n$/, ''));
  return xml.replace('</question>', block + '  </question>');
}

function _extractInputNames(xml) {
  var names = [], re = /<input>\s*<name>([^<]+)<\/name>/g, m;
  while ((m = re.exec(xml))) names.push(m[1]);
  return names;
}

// Cherche `count` seeds "pleinement valides" (render OK + réponse de référence notée
// à 100%) en essayant des entiers séquentiels à partir de `startSeed`. Pour chaque
// candidat : XML de base + CE seed en <deployedseed> → /render (réponse de référence
// par input via questioninputs.<input>.samplesolutionrender) → /grade avec cette
// réponse → accepté seulement si isgradable et note totale == somme des poids des PRT
// (les deux champs vérifiés par appel réel au serveur du NAS le 2026-07-25 ; le calcul
// "note totale == somme des poids" est notre propre critère de "réponse de référence
// parfaitement notée", pas un champ documenté tel quel par stack-api).
// Sécurité anti-boucle infinie demandée par l'utilisateur : on arrête dès
// `maxConsecutiveFailures` échecs consécutifs (défaut 10), même si `count` n'est pas
// atteint — mieux vaut un export avec moins de variantes qu'un export qui ne se termine
// jamais parce que le serveur Maxima refuse systématiquement (mauvaise config, question
// mal formée, etc.).
async function generateDeployedSeeds(xml, count, opts) {
  opts = opts || {};
  var maxConsecutiveFailures = opts.maxConsecutiveFailures || 10;
  var startSeed = opts.startSeed || 1;
  var onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function() {};
  var inputNames = _extractInputNames(xml);
  var validSeeds = [], consecutiveFailures = 0, tried = 0, seed = startSeed;

  onProgress({ found: 0, target: count, tried: 0, consecutiveFailures: 0 });

  while (validSeeds.length < count && consecutiveFailures < maxConsecutiveFailures) {
    tried++;
    var ok = false;
    try {
      var tempXml = insertDeployedSeeds(xml, [seed]);
      var renderRes = await maximaRenderXML(tempXml, seed);
      // `samplesolutionrender` est la version LaTeX affichable (ex. "\text{1011111}"),
      // pas la valeur à soumettre pour la notation — vérifié par appel réel à
      // /render puis /grade le 2026-07-25 : soumettre samplesolutionrender donne
      // score 0 (isgradable:true mais faux), soumettre samplesolution[""] donne
      // score 1. `samplesolution` est une map par sous-partie ; pour un input
      // simple (string/algébrique/numérique) elle n'a qu'une clé "".
      var answers = {};
      inputNames.forEach(function(name) {
        var ir = renderRes && renderRes.questioninputs && renderRes.questioninputs[name];
        var sol = ir && ir.samplesolution;
        var solKeys = sol ? Object.keys(sol) : [];
        answers[name] = solKeys.length === 1 ? sol[solKeys[0]] : undefined;
      });
      var gradeRes = await maximaGradeXML(tempXml, seed, answers);
      if (gradeRes && gradeRes.isgradable) {
        // scoreweights contient déjà un total précalculé (ex. {"prt1":1,"total":1}) ;
        // sommer toutes ses clés comptait "total" en plus des PRT individuels et
        // doublait le score maximum attendu, faisant échouer toute réponse pourtant
        // parfaitement notée — vérifié par appel réel à /grade le 2026-07-25.
        var maxScore = (gradeRes.scoreweights && typeof gradeRes.scoreweights.total !== 'undefined')
          ? Number(gradeRes.scoreweights.total)
          : 1;
        ok = Math.abs((Number(gradeRes.score) || 0) - maxScore) < 1e-6;
      }
    } catch (e) {
      ok = false;
    }
    if (ok) { validSeeds.push(seed); consecutiveFailures = 0; }
    else { consecutiveFailures++; }
    onProgress({ found: validSeeds.length, target: count, tried: tried, consecutiveFailures: consecutiveFailures });
    seed++;
  }

  return {
    seeds: validSeeds,
    aborted: consecutiveFailures >= maxConsecutiveFailures,
    tried: tried
  };
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
    // /render exige un <deployedseed> déjà présent dans le XML soumis (sinon
    // "The question XML does not contain deployed variants") ; ce test rapide
    // n'a pas encore de variante générée à ce stade, donc on en déclare une
    // temporaire (seed 1) juste pour vérifier que la question se rend bien.
    var testSeed = 1;
    var res = await maximaRenderXML(insertDeployedSeeds(xml, [testSeed]), testSeed);
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
    maximaTestConnection: maximaTestConnection, maximaRenderXML: maximaRenderXML, maximaValidateInput: maximaValidateInput,
    maximaGradeXML: maximaGradeXML, insertDeployedSeeds: insertDeployedSeeds, generateDeployedSeeds: generateDeployedSeeds
  };
}
