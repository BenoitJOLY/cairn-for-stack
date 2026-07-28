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

// Assemble une SEULE question STACK autonome (mêmes champs par défaut que
// buildXML() dans js/app.js, réduits à une question, sans tags ni signature
// stackforge) — utilisée pour l'aperçu réel isolé d'un chip (voir
// preview-checkbox.js), jamais pour l'export final (buildXML() reste le seul
// chemin d'export, inchangé). Gabarit vérifié par appel réel à /render le
// 2026-07-27 (HTTP 200, forme confirmée par test-render-shape.js).
function buildStandaloneQuestionXML(parts) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<quiz>\n'
    + '  <question type="stack">\n'
    + '    <name><text>apercu_reel</text></name>\n'
    + '    <questiontext format="html">\n'
    + '      <text><![CDATA[' + parts.textFrag + ']]></text>\n'
    + '    </questiontext>\n'
    + '    <generalfeedback format="html">\n'
    + '      <text><![CDATA[' + parts.generalFeedback + ']]></text>\n'
    + '    </generalfeedback>\n'
    + '    <defaultgrade>' + parts.bareme + '</defaultgrade>\n'
    + '    <penalty>0.1</penalty>\n'
    + '    <hidden>0</hidden>\n'
    + '    <idnumber></idnumber>\n'
    + '    <stackversion><text></text></stackversion>\n'
    + '    <questionvariables>\n'
    + '      <text><![CDATA[' + parts.vars + ']]></text>\n'
    + '    </questionvariables>\n'
    + '    <specificfeedback format="html"><text><![CDATA[]]></text></specificfeedback>\n'
    + '    <questionnote format="html"><text></text></questionnote>\n'
    + '    <questionsimplify>1</questionsimplify>\n'
    + '    <assumepositive>0</assumepositive>\n'
    + '    <assumereal>0</assumereal>\n'
    + '    <prtcorrect format="html"><text></text></prtcorrect>\n'
    + '    <prtpartiallycorrect format="html"><text></text></prtpartiallycorrect>\n'
    + '    <prtincorrect format="html"><text></text></prtincorrect>\n'
    + '    <decimals>.</decimals>\n'
    + '    <scientificnotation>*10</scientificnotation>\n'
    + '    <multiplicationsign>dot</multiplicationsign>\n'
    + '    <sqrtsign>1</sqrtsign>\n'
    + '    <complexno>i</complexno>\n'
    + '    <inversetrig>cos-1</inversetrig>\n'
    + '    <logicsymbol>lang</logicsymbol>\n'
    + '    <matrixparens>[</matrixparens>\n'
    + '    <isbroken>0</isbroken>\n'
    + '    <variantsselectionseed></variantsselectionseed>\n'
    + parts.inputXML + '\n\n'
    + parts.prtXML + '\n'
    + '  </question>\n'
    + '</quiz>';
}

function _extractInputNames(xml) {
  var names = [], re = /<input>\s*<name>([^<]+)<\/name>/g, m;
  while ((m = re.exec(xml))) names.push(m[1]);
  return names;
}

// Cherche `count` seeds "pleinement valides" (render OK + réponse de référence notée
// à 100%). Pour chaque candidat : XML de base + CE seed en <deployedseed> → /render
// (réponse de référence par input via questioninputs.<input>.samplesolutionrender) →
// /grade avec cette réponse → accepté seulement si isgradable et note totale == somme
// des poids des PRT (les deux champs vérifiés par appel réel au serveur du NAS le
// 2026-07-25 ; le calcul "note totale == somme des poids" est notre propre critère de
// "réponse de référence parfaitement notée", pas un champ documenté tel quel par
// stack-api).
// Seeds tirés au hasard dans [startSeed, maxSeed], PAS séquentiellement : la validité
// d'un seed (est-ce que le brassage aléatoire Maxima qu'il produit reste notable à
// 100%) n'a aucune raison d'être corrélée à sa proximité avec le seed précédent.
// Arrêt sur un compteur d'échecs CONSÉCUTIFS (`maxConsecutiveFails`, remis à zéro à
// chaque succès) : un seed valide peut arriver après une série d'échecs sans rapport,
// mais si on en enchaîne N sans le moindre succès entre-temps, il est peu probable
// d'en trouver un juste après. Un budget total (`maxAttempts`) reste en garde-fou pour
// éviter une boucle très longue si des succès arrivent occasionnellement (chaque
// succès remet le compteur consécutif à zéro sans jamais faire progresser `tried`).
// Révisé le 2026-07-28 (retour utilisateur) : la version précédente (budget total sans
// remise à zéro, b8c1273) tournait 60 essais sans jamais s'arrêter plus tôt même à 0
// succès — l'utilisateur attendait un arrêt rapide après quelques échecs d'affilée.
async function generateDeployedSeeds(xml, count, opts) {
  opts = opts || {};
  var minSeed = opts.startSeed || 1;
  var maxSeed = opts.maxSeed || 1000000;
  var maxConsecutiveFails = opts.maxConsecutiveFails || 10;
  var maxAttempts = opts.maxAttempts || Math.max(200, count * 50);
  var onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : function() {};
  var inputNames = _extractInputNames(xml);
  var validSeeds = [], triedSeeds = {}, tried = 0, consecutiveFails = 0;

  function pickSeed() {
    var seed, guard = 0;
    do {
      seed = minSeed + Math.floor(Math.random() * (maxSeed - minSeed + 1));
      guard++;
    } while (triedSeeds[seed] && guard < 1000);
    triedSeeds[seed] = true;
    return seed;
  }

  onProgress({ found: 0, target: count, tried: 0 });

  while (validSeeds.length < count && tried < maxAttempts && consecutiveFails < maxConsecutiveFails) {
    tried++;
    var seed = pickSeed();
    var ok = false;
    try {
      var tempXml = insertDeployedSeeds(xml, [seed]);
      var renderRes = await maximaRenderXML(tempXml, seed);
      // `samplesolutionrender` est la version LaTeX affichable (ex. "\text{1011111}"),
      // pas la valeur à soumettre pour la notation — vérifié par appel réel à
      // /render puis /grade le 2026-07-25 : soumettre samplesolutionrender donne
      // score 0 (isgradable:true mais faux), soumettre samplesolution[""] donne
      // score 1. `samplesolution` est une map par sous-partie ; pour un input
      // simple (string/algébrique/numérique) elle n'a qu'une clé "". Pour un input
      // à plusieurs sous-parties (ex. checkbox, une clé "_<position>" par case
      // COCHÉE), /grade n'accepte PAS un objet imbriqué sous answers[name] : il
      // faut aplatir, une clé par POSITION AFFICHÉE (cochée ou non) directement à
      // la racine de `answers`, nommée "<name>_<position>" avec "1"/"0" — comme le
      // ferait un formulaire HTML natif. Confirmé par appel réel à /grade le
      // 2026-07-28 (isgradable:true, score:1 uniquement avec cette forme aplatie ;
      // toutes les formes imbriquées/tableau/bitstring testées échouaient).
      var answers = {};
      inputNames.forEach(function(name) {
        var ir = renderRes && renderRes.questioninputs && renderRes.questioninputs[name];
        var sol = ir && ir.samplesolution;
        var solKeys = sol ? Object.keys(sol) : [];
        if (solKeys.length && solKeys[0].charAt(0) === '_') {
          var allKeys = Object.keys((ir.configuration && ir.configuration.options) || {});
          var trueKeys = solKeys.map(function(k) { return k.replace(/^_/, ''); });
          allKeys.forEach(function(k) {
            answers[name + '_' + k] = trueKeys.indexOf(k) >= 0 ? '1' : '0';
          });
        } else {
          answers[name] = solKeys.length === 1 ? sol[solKeys[0]] : undefined;
        }
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
    if (ok) { validSeeds.push(seed); consecutiveFails = 0; } else { consecutiveFails++; }
    onProgress({ found: validSeeds.length, target: count, tried: tried, consecutiveFails: consecutiveFails });
  }

  return {
    seeds: validSeeds,
    aborted: validSeeds.length < count,
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
    maximaGradeXML: maximaGradeXML, insertDeployedSeeds: insertDeployedSeeds, generateDeployedSeeds: generateDeployedSeeds,
    buildStandaloneQuestionXML: buildStandaloneQuestionXML
  };
}
