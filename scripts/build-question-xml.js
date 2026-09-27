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

// build-question-xml.js — Construit un XML de question STACK bit-pour-bit
// identique à un export Cairn for Stack, à partir d'un fichier JSON décrivant
// le contenu pédagogique (texte, bonnes réponses, feedback), SANS jamais
// réinventer le format (bandeau HTML, gabarit XML, vocabulaire de tags).
//
// Pourquoi ce script existe : quand une question STACK est rédigée "à la
// main" (par un humain ou une IA) en s'inspirant du DSTU (skill
// stack-moodle-agent), deux choses dérivent inévitablement de ce que produit
// réellement l'appli :
//   1. les bandeaux colorés en tête de question (HTML/couleur/texte exacts
//      définis dans chaque js/gen-*.js) sont réécrits de mémoire ;
//   2. les tags sont inventés au lieu de suivre l'arbre matière/niveau/
//      sous-matière/chapitre réel (js/tags-data/<lang>.js) + les listes
//      figées Bloom/Difficulté (index.html).
//
// Ce script élimine ces deux dérives en appelant directement les VRAIES
// fonctions de génération de l'appli (gen<Type>Core, exportées en CommonJS
// dans chaque js/gen-*.js pour les tests unitaires — voir test/unit/) et en
// validant les tags contre les VRAIES données sources. Le rédacteur (humain
// ou IA) ne fournit que le contenu pédagogique ; ce script ne fait aucune
// mise en forme "à l'œil".
//
// Usage :
//   node scripts/build-question-xml.js <config.json> [xml_de_sortie]
//   (sortie par défaut : questions/<quizName>/questions.xml)
//
// Forme du fichier config.json : voir scripts/example-question-config.json.
//
// Types de question actuellement supportés (TYPE_REGISTRY ci-dessous) :
//   checkbox, string, vf, numerical, units.
// Pour ajouter un type (ex. match, crossword, composition...), ajouter une
// entrée dans TYPE_REGISTRY — le générateur doit exporter sa fonction
// gen<Type>Core(X, params, deps) en CommonJS (déjà le cas pour la quasi-
// totalité de js/gen-*.js, voir grep "module.exports" dans ce dossier).

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// ── Dépendances RÉELLES de l'appli, réutilisées telles quelles (même liste
// que scripts/check-prt-reachability.js, déjà éprouvée en Node) ────────────
const { buildPrtXml } = require(path.join(ROOT, 'js', 'prt-manager.js'));
const { applyFbBox, inferFbKind, stripLeadingFbIcon } = require(path.join(ROOT, 'js', 'fb-box.js'));
const { _mkFbGen, _mkInput } = require(path.join(ROOT, 'js', 'gen-math-shared.js'));
const { htmlEsc, rawEsc, escapeMaximaString } = require(path.join(ROOT, 'js', 'data.js'));
const { buildKbdStackHTML } = require(path.join(ROOT, 'js', 'keyboard.js'));

// ── Dépendances RÉELLES supplémentaires, nécessaires uniquement aux types
// Physique/Chimie/Organisation/Interactif-visuel ci-dessous (chaque fonction
// Core suit le motif `deps.X || X` : si X est défini dans un AUTRE fichier
// que gen-<type>.js, il faut l'injecter explicitement ici — sinon le repli
// module-scope suffit déjà et rien n'est à ajouter). ───────────────────────
const { _bpuVars } = require(path.join(ROOT, 'js', 'gen-bilanpuissance-calc.js'));
const { _pmoVars } = require(path.join(ROOT, 'js', 'gen-premierordre-calc.js'));
const { _thvVars } = require(path.join(ROOT, 'js', 'gen-thevenin-calc.js'));
const { cinComputeAll } = require(path.join(ROOT, 'js', 'gen-cinematique-physics.js'));
const { buildCinJSX_Phase1, buildCinJSX_Phase2 } = require(path.join(ROOT, 'js', 'gen-cinematique-jsx.js'));
const { jxgDropChunkedJsString, jxgDropChunkedRaw } = require(path.join(ROOT, 'js', 'gen-jxgdrop.js'));
const { generateCWMaximaString, renderCWGridHTML, renderCWGridHTMLEmpty } = require(path.join(ROOT, 'js', 'crossword-ui.js'));
const { CIR_ENGINE_JS, cirBuildLabels } = require(path.join(ROOT, 'js', 'circuit-atelier.js'));
const { CIR_ATELIER_CSS } = require(path.join(ROOT, 'js', 'circuit-ui.js'));
const { wrapFb } = require(path.join(ROOT, 'js', 'generators.js'));

// ── Registre des types de question supportés (extensible) ─────────────────
const TYPE_REGISTRY = {
  checkbox:  { file: 'gen-checkbox.js',  core: 'genCheckboxCore' },
  string:    { file: 'gen-string.js',    core: 'genStringCore' },
  vf:        { file: 'gen-vf.js',        core: 'genVFCore' },
  numerical: { file: 'gen-numerical.js', core: 'genNumericalCore' },
  units:     { file: 'gen-units.js',     core: 'genUnitsCore' },

  // ── Physique (js/palette.js → PALETTE_CATEGORIES['physique']) ──
  doi:            { file: 'doi.js',                core: 'genDOICore' },
  nuclear:        { file: 'gen-nuclear.js',         core: 'genNuclearCore' },
  optique:        { file: 'gen-optique.js',         core: 'genOptiqueCore' },
  circuit:        { file: 'gen-circuit.js',         core: 'genCircuitCore' },
  physique:       { file: 'gen-math-physique.js',   core: 'genPhysiqueCore' },
  oscilloscope:   { file: 'gen-oscilloscope.js',    core: 'genOscilloscopeCore' },
  diffraction:    { file: 'gen-diffraction.js',     core: 'genDiffractionCore' },
  rvbcmj:         { file: 'gen-optique.js',         core: 'genRvbCmjCore' },
  apn:            { file: 'gen-apn.js',             core: 'genApnCore' },
  cinematique:    { file: 'gen-cinematique.js',     core: 'genCinematiqueCore' },
  bilanpuissance: { file: 'gen-bilanpuissance.js',  core: 'genBilanpuissanceCore' },
  thevenin:       { file: 'gen-thevenin.js',        core: 'genTheveninCore' },
  premierordre:   { file: 'gen-premierordre.js',    core: 'genPremierordreCore' },

  // ── Chimie ──
  chemical:       { file: 'gen-topo.js',            core: 'genChemicalCore' },
  chemical_topo:  { file: 'gen-topo.js',            core: 'genChemicalTopoCore' },
  'acide-base':   { file: 'gen-acidebase.js',       core: 'genAcideBaseCore' },
  redox:          { file: 'gen-redox.js',           core: 'genRedoxCore' },
  nomenclature:   { file: 'gen-nomenclature.js',    core: 'genNomenclatureCore' },
  avancement:     { file: 'gen-avancement.js',      core: 'genAvancementCore' },

  // ── Organisation ──
  match:          { file: 'gen-match.js',           core: 'genMatchCore' },
  crossword:      { file: 'gen-crossword.js',       core: 'genCrosswordCore' },
  ord:            { file: 'gen-ord.js',             core: 'genOrdCore' },

  // ── Interactif / Visuel ──
  jxgdrop:        { file: 'gen-jxgdrop.js',         core: 'genJxgDropCore' },
  // imgclick a deux sous-modes réels (p.mode === 'sequence' | 'single'), déjà
  // distingués par genImgClickDispatchLocal() dans js/gen-imgclick.js — on
  // reproduit ici la même bascule (mêmes fonctions Core réelles), en y
  // transmettant `deps` (le dispatcher navigateur ne le fait pas, car dans le
  // navigateur les dépendances sont déjà des globales — ici on est en Node).
  imgclick: {
    file: 'gen-imgclick.js',
    core: (mod) => function (X, p, deps) {
      const fn = (p && p.mode === 'sequence') ? mod.genImgClickSequenceCore : mod.genImgClickCore;
      return fn(X, p, deps);
    },
  },
  imgslideshow:   { file: 'gen-imgslideshow.js',    core: 'genImgSlideshowCore' },
  'image-mesure': { file: 'gen-image-mesure.js',    core: 'genImageMesureCore' },
};

function loadCoreFn(type) {
  const entry = TYPE_REGISTRY[type];
  if (!entry) {
    throw new Error(
      `Type de question "${type}" non supporté par ce script.\n` +
      `Types disponibles : ${Object.keys(TYPE_REGISTRY).join(', ')}.\n` +
      `(Pour en ajouter un : compléter TYPE_REGISTRY dans scripts/build-question-xml.js` +
      ` avec le fichier js/gen-${type}.js et le nom exact de sa fonction Core exportée.)`
    );
  }
  const mod = require(path.join(ROOT, 'js', entry.file));
  if (typeof entry.core === 'function') return entry.core(mod);
  const fn = mod[entry.core];
  if (typeof fn !== 'function') {
    throw new Error(`${entry.file} n'exporte pas ${entry.core} — vérifier module.exports dans ce fichier.`);
  }
  return fn;
}

// ── I18N RÉEL, chargé depuis les vraies sources (jamais retapé à la main) ──
// js/i18n.js pose window.I18N ; lang/<lang>.js appelle I18N.add(...) sur le
// I18N global — on rejoue ces deux fichiers tels quels dans un sandbox vm
// minimal (juste un objet `window`, aucun accès document nécessaire ici).
function loadI18N(lang) {
  // i18n.js s'auto-initialise à l'exécution (init(), voir js/i18n.js:183) en
  // touchant le DOM (style injecté, sélecteur de langue, document.documentElement).
  // On fournit un stub document minimal qui rend ces opérations des no-op
  // sans jamais faire planter add()/t(), seules fonctions réellement utilisées
  // par ce script — ainsi la VRAIE logique i18n.js tourne inchangée.
  const sandboxWindow = {};
  const noop = function () {};
  const documentStub = {
    readyState: 'complete',
    documentElement: { setAttribute: noop },
    head: { appendChild: noop },
    getElementById: function () { return null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return { setAttribute: noop, appendChild: noop, textContent: '' }; },
    addEventListener: noop,
    dispatchEvent: noop,
  };
  const sandbox = {
    window: sandboxWindow,
    document: documentStub,
    CustomEvent: function (type, opts) { this.type = type; this.detail = opts && opts.detail; },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8'), sandbox, { filename: 'i18n.js' });
  sandbox.I18N = sandboxWindow.I18N;
  const langFile = path.join(ROOT, 'lang', lang + '.js');
  if (!fs.existsSync(langFile)) throw new Error(`Fichier de langue introuvable : ${langFile}`);
  vm.runInContext(fs.readFileSync(langFile, 'utf8'), sandbox, { filename: lang + '.js' });
  sandboxWindow.I18N.setLang(lang);
  return sandboxWindow.I18N;
}

// ── Arbre de tags RÉEL, extrait en direct de js/tags-data/<lang>.js (jamais
// retapé à la main — élimine la classe de bug "chapitre:corps_purs_et_melanges"
// qui n'existe dans aucun référentiel réel). ────────────────────────────────
function loadTagTree(lang) {
  let captured = null;
  const sandbox = { registerCountryTags: function (code, label, tree) { captured = tree; } };
  vm.createContext(sandbox);
  const file = path.join(ROOT, 'js', 'tags-data', lang + '.js');
  if (!fs.existsSync(file)) throw new Error(`Arbre de tags introuvable pour la langue "${lang}" : ${file}`);
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: lang + '.js' });
  if (!captured) throw new Error(`registerCountryTags() n'a pas été appelé par ${file} — format de fichier modifié ?`);
  return captured;
}

// ── Bloom / Difficulté : listes figées, extraites en direct de index.html
// (jamais codées en dur ici — si l'UI change ces boutons, ce script suit). ──
function loadFixedVocab() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const bloomBlock = html.match(/id="tm-group-6">([\s\S]*?)<\/div>\s*<\/div>/);
  const diffBlock = html.match(/id="tm-group-7">([\s\S]*?)<\/div>\s*<\/div>/);
  if (!bloomBlock || !diffBlock) {
    throw new Error(
      "Impossible d'extraire les listes Bloom/Difficulté depuis index.html " +
      '(structure #tm-group-6 / #tm-group-7 modifiée ? adapter les regex de loadFixedVocab()).'
    );
  }
  const extractDisplays = (block) => Array.from(block.matchAll(/data-display="([^"]+)"/g)).map((m) => m[1]);
  const bloom = extractDisplays(bloomBlock[1]);
  const difficulte = extractDisplays(diffBlock[1]);
  if (!bloom.length || !difficulte.length) {
    throw new Error("Extraction Bloom/Difficulté vide depuis index.html — vérifier les regex de loadFixedVocab().");
  }
  return { bloom, difficulte };
}

// ── tagClean(), copiée à l'identique de js/app.js (ne jamais la redériver). ─
function tagClean(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_\-:]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

// ── moodleLatex(), copiée à l'identique de js/app.js:23 (fonction pure, pas
// de DOM — stripMathDivs() n'est PAS reprise car elle ne traite que les
// artefacts de l'éditeur riche KaTeX, absents d'un texte fourni en JSON). ──
function moodleLatex(s) {
  if (!s) return s || '';
  s = s.replace(/\$\$([^$]*?)\$\$/gs, '\\[$1\\]');
  s = s.replace(/\$([^$\n]*?)\$/g, '\\($1\\)');
  s = s.replace(/(?<!\{)@(?!\})([^@]+?)@(?!\})/g, '{@$1@}');
  return s;
}

// ── Validation de la cascade matiere/niveau/sous-matiere/chapitre contre
// l'arbre RÉEL. Erreur explicite avec les valeurs valides si divergence — au
// lieu d'un tag fantaisiste silencieusement accepté. ────────────────────────
function validateTagPath(tree, sel) {
  const mats = Object.keys(tree);
  if (!sel.matiere || !tree[sel.matiere]) {
    throw new Error(`tags.matiere "${sel.matiere}" invalide. Valeurs possibles : ${mats.join(', ')}`);
  }
  const nivs = Object.keys(tree[sel.matiere]);
  if (!sel.niveau || !tree[sel.matiere][sel.niveau]) {
    throw new Error(`tags.niveau "${sel.niveau}" invalide pour matiere "${sel.matiere}". Valeurs possibles : ${nivs.join(', ')}`);
  }
  const sousMap = tree[sel.matiere][sel.niveau];
  const souss = Object.keys(sousMap);
  if (!sel.sousMatiere || !sousMap[sel.sousMatiere]) {
    throw new Error(`tags.sousMatiere "${sel.sousMatiere}" invalide pour ${sel.matiere}/${sel.niveau}. Valeurs possibles : ${souss.join(', ')}`);
  }
  const chaps = sousMap[sel.sousMatiere];
  if (!sel.chapitre || !chaps.includes(sel.chapitre)) {
    throw new Error(`tags.chapitre "${sel.chapitre}" invalide pour ${sel.matiere}/${sel.niveau}/${sel.sousMatiere}. Valeurs possibles : ${chaps.join(', ')}`);
  }
}

// ── Construit la liste de tags EXACTEMENT comme buildXML() dans js/app.js :
// cascade pédagogique + bloom + difficulte (uniques) + outils/divers (libres)
// + tags obligatoires ("stack", un par type de question, "jsmol" si
// nomenclature) + "pays:<lang>". ───────────────────────────────────────────
function buildTags(cfgTags, fixedVocab, typesUsed, lang) {
  const raw = [
    'matiere:' + cfgTags.matiere,
    'niveau:' + cfgTags.niveau,
    'sous-matiere:' + cfgTags.sousMatiere,
    'chapitre:' + cfgTags.chapitre,
  ];
  (cfgTags.bloom || []).forEach((b) => {
    if (!fixedVocab.bloom.includes(b)) {
      throw new Error(`tags.bloom "${b}" invalide. Valeurs possibles : ${fixedVocab.bloom.join(', ')}`);
    }
    raw.push('bloom:' + b);
  });
  if (cfgTags.difficulte) {
    if (!fixedVocab.difficulte.includes(cfgTags.difficulte)) {
      throw new Error(`tags.difficulte "${cfgTags.difficulte}" invalide. Valeurs possibles : ${fixedVocab.difficulte.join(', ')}`);
    }
    raw.push('difficulte:' + cfgTags.difficulte);
  }
  (cfgTags.outils || []).forEach((o) => raw.push(o));
  (cfgTags.divers || []).forEach((d) => raw.push(d));

  let tags = raw.filter(Boolean).map((t) => ({ raw: t, clean: tagClean(t) }));

  const mandatoryClean = new Set(['stack']);
  const JSMOL_TYPES = new Set(['nomenclature']);
  typesUsed.forEach((t) => {
    mandatoryClean.add(tagClean(t));
    if (JSMOL_TYPES.has(t)) mandatoryClean.add('jsmol');
  });
  const mandatory = [...mandatoryClean]
    .filter((c) => c && !tags.some((u) => u.clean === c))
    .map((c) => ({ raw: c, clean: c }));
  tags = tags.concat(mandatory);

  const paysTag = 'pays:' + lang;
  tags.push({ raw: paysTag, clean: tagClean(paysTag) });

  return tags;
}

// ── Assemble l'enveloppe XML complète, copiée à l'identique de buildXML()
// dans js/app.js:317-365 (mêmes champs, mêmes valeurs par défaut). Seule
// omission délibérée : le commentaire <!-- cairnforstack::v1::... --> qui
// encode l'état de l'éditeur navigateur pour ré-import dans l'appli — sans
// objet ici puisque ces questions ne sont jamais passées par l'éditeur. ────
function buildQuestionXml(cfg, results, tagsXML) {
  const totalB = results.reduce((s, r) => s + (r.bareme || 0), 0);
  let allTexts = results.map((r) => r.textFrag || '').join('\n');
  results.forEach((r, i) => {
    if (!r.kbdRaw) return;
    const marker = '<!--HS-KBD:' + (i + 1) + '-->';
    allTexts = allTexts.split(marker).join(r.kbdRaw);
  });
  allTexts = moodleLatex(allTexts);

  const allVars = results.map((r) => r.vars || '').join('\n\n');
  const allInputs = results.map((r) => r.inputXML || '').join('\n');
  let allPRTs = results.map((r) => r.prtXML || '').join('\n\n');
  if (cfg.feedbackStyle === 'formative') {
    allPRTs = allPRTs.replace(/<feedbackstyle>\d+<\/feedbackstyle>/g, '<feedbackstyle>0</feedbackstyle>');
  }
  const allFB = '<ol>\n' + results.map((r) => '  <li>' + (r.feedbackRef || '') + '</li>').join('\n') + '\n</ol>';
  const allQnote = results.map((r) => r.qnote || '').join(' | ');
  const generalFeedbackContent = moodleLatex(results.map((r) => r.generalFeedback || '').filter(Boolean).join('\n'));
  const hsTypes = cfg.questions.map((q) => q.type).join(',');
  const penaltyValue = cfg.penalty != null ? cfg.penalty : 0.1;
  const qName = String(cfg.quizName || 'exercice').replace(/\s+/g, '_');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<quiz>\n' +
    '  <question type="stack">\n' +
    '    <name><text>' + htmlEsc(qName) + '</text></name>\n' +
    '    <questiontext format="html">\n' +
    '      <text><![CDATA[' + allTexts + ']]></text>\n' +
    '    </questiontext>\n' +
    '    <generalfeedback format="html">\n' +
    '      <text><![CDATA[' + generalFeedbackContent + ']]></text>\n' +
    '    </generalfeedback>\n' +
    '    <defaultgrade>' + totalB + '</defaultgrade>\n' +
    '    <penalty>' + penaltyValue + '</penalty>\n' +
    '    <hidden>0</hidden>\n' +
    '    <idnumber></idnumber>\n' +
    '    <stackversion><text></text></stackversion>\n' +
    '    <questionvariables>\n' +
    '      <text><![CDATA[' + allVars + ']]></text>\n' +
    '    </questionvariables>\n' +
    '    <specificfeedback format="html">\n' +
    '      <text><![CDATA[' + allFB + ']]></text>\n' +
    '    </specificfeedback>\n' +
    '    <questionnote format="html">\n' +
    '      <text><![CDATA[' + allQnote + ']]></text>\n' +
    '    </questionnote>\n' +
    '    <questiondescription format="html">\n' +
    '      <text>Généré avec Cairn for Stack V1 | cairnforstack-types:' + hsTypes + '</text>\n' +
    '    </questiondescription>\n' +
    '    <questionsimplify>1</questionsimplify>\n' +
    '    <assumepositive>0</assumepositive>\n' +
    '    <assumereal>0</assumereal>\n' +
    '    <prtcorrect format="html"><text></text></prtcorrect>\n' +
    '    <prtpartiallycorrect format="html"><text></text></prtpartiallycorrect>\n' +
    '    <prtincorrect format="html"><text></text></prtincorrect>\n' +
    '    <decimals>.</decimals>\n' +
    '    <scientificnotation>*10</scientificnotation>\n' +
    '    <multiplicationsign>dot</multiplicationsign>\n' +
    '    <sqrtsign>1</sqrtsign>\n' +
    '    <complexno>i</complexno>\n' +
    '    <inversetrig>cos-1</inversetrig>\n' +
    '    <logicsymbol>lang</logicsymbol>\n' +
    '    <matrixparens>[</matrixparens>\n' +
    '    <isbroken>0</isbroken>\n' +
    '    <variantsselectionseed></variantsselectionseed>\n' +
    allInputs + '\n\n' +
    allPRTs + '\n\n' +
    tagsXML + '\n' +
    '  </question>\n' +
    '</quiz>'
  );
}

// ── Cœur du générateur, réutilisable aussi bien par la CLI ci-dessous que par
// scripts/build-question-server.js (interface fenêtrée, sans ligne de commande).
// Ne touche jamais au disque : reçoit un objet cfg déjà parsé, renvoie le XML. ─
function generateFromConfig(cfg) {
  const lang = cfg.lang || 'fr';

  const I18N = loadI18N(lang);
  const tagTree = loadTagTree(lang);
  const fixedVocab = loadFixedVocab();

  validateTagPath(tagTree, cfg.tags || {});
  const typesUsed = [...new Set((cfg.questions || []).map((q) => q.type))];
  const tags = buildTags(cfg.tags || {}, fixedVocab, typesUsed, lang);
  const tagsXML = '  <tags>\n' + tags.map((t) => '    <tag><text>' + t.clean + '</text></tag>').join('\n') + '\n  </tags>';

  const deps = {
    I18N,
    buildPrtXml,
    applyFbBox,
    inferFbKind,
    stripLeadingFbIcon,
    _mkFbGen,
    _mkInput,
    htmlEsc,
    rawEsc,
    escapeMaximaString,
    buildKbdStackHTML,
    _bpuVars,
    _pmoVars,
    _thvVars,
    cinComputeAll,
    buildCinJSX_Phase1,
    buildCinJSX_Phase2,
    jxgDropChunkedJsString,
    jxgDropChunkedRaw,
    generateCWMaximaString,
    renderCWGridHTML,
    renderCWGridHTMLEmpty,
    CIR_ENGINE_JS,
    CIR_ATELIER_CSS,
    cirBuildLabels,
    wrapFb,
    jsmolUrl: '',
  };

  const results = (cfg.questions || []).map((q, i) => {
    const coreFn = loadCoreFn(q.type);
    try {
      return coreFn(i + 1, q.params, deps);
    } catch (e) {
      throw new Error(`Question ${i + 1} (type "${q.type}") : ${e.message}`);
    }
  });

  const xml = buildQuestionXml(cfg, results, tagsXML);
  const totalB = results.reduce((s, r) => s + (r.bareme || 0), 0);
  const qName = String(cfg.quizName || 'exercice').replace(/\s+/g, '_');

  return { xml, tags, totalB, qName, nQuestions: results.length };
}

function main() {
  const [configPath, outArg] = process.argv.slice(2);
  if (!configPath) {
    console.error('Usage : node scripts/build-question-xml.js <config.json> [xml_de_sortie]');
    console.error('Voir scripts/example-question-config.json pour la forme attendue.');
    console.error('(Pas envie de ligne de commande ? Double-clique sur "Lancer Cairn XML.bat".)');
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8'));
  const { xml, tags, totalB, qName, nQuestions } = generateFromConfig(cfg);

  const outPath = outArg
    ? path.resolve(outArg)
    : path.join(ROOT, 'questions', qName, 'questions.xml');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, xml, 'utf8');

  console.log(`OK — ${nQuestions} question(s), ${totalB} pt au total.`);
  console.log('Tags : ' + tags.map((t) => t.clean).join(', '));
  console.log('Écrit dans : ' + outPath);
}

if (require.main === module) {
  main();
}

module.exports = { generateFromConfig, loadI18N, loadTagTree, loadFixedVocab, TYPE_REGISTRY };
