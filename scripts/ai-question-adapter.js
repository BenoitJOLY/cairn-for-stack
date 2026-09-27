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

// ai-question-adapter.js — Traduit le JSON "pédagogique simplifié" que l'IA a
// le droit d'inventer (énoncé, réponses, feedback) vers le JSON "params"
// exact attendu par gen<Type>Core() (scripts/build-question-xml.js). L'IA ne
// voit JAMAIS les champs structurels STACK (Xe, mXb, tolType, boxsize...) —
// ce module leur donne des valeurs par défaut sûres, pour que la seule chose
// que l'IA puisse "rater" soit le contenu pédagogique, jamais le format.

'use strict';

// ── Schéma "pédagogique" par type, décrit à l'IA dans le prompt. ──────────
const CONTENT_SCHEMAS = {
  checkbox: {
    label: 'Cases à cocher (plusieurs bonnes réponses possibles)',
    example: {
      type: 'checkbox',
      bareme: 1,
      enonce: "Parmi les propositions suivantes, cocher celles qui sont vraies à propos de la molécule d'eau.",
      propositions: [
        { texte: "La molécule d'eau est polaire.", correcte: true, feedback: 'Oui, la répartition des charges est asymétrique.' },
        { texte: "L'eau a pour formule H2O.", correcte: true, feedback: 'Exact, 2 atomes H et 1 atome O.' },
        { texte: "L'eau est un corps pur simple.", correcte: false, feedback: "Non, l'eau est un corps pur composé (2 éléments)." },
      ],
    },
    describe:
      'objet avec : "enonce" (texte HTML de la question), "propositions" (liste d\'AU MOINS 3 objets ' +
      '{ "texte", "correcte": true/false, "feedback" }, avec au moins 1 correcte et 1 fausse).',
  },
  vf: {
    label: 'Vrai/Faux (série d\'affirmations)',
    example: {
      type: 'vf',
      bareme: 1,
      enonce: 'Pour chaque affirmation, indiquer si elle est vraie ou fausse.',
      propositions: [
        { texte: 'Le carbone a 6 protons.', vraie: true, feedbackSiVrai: 'Correct.', feedbackSiFaux: 'Faux : relire le numéro atomique.' },
        { texte: "L'azote est un gaz noble.", vraie: false, feedbackSiVrai: "Non, l'azote n'est pas un gaz noble.", feedbackSiFaux: 'Correct, ce n\'est pas un gaz noble.' },
      ],
    },
    describe:
      'objet avec : "enonce", "propositions" (liste d\'AU MOINS 2 objets ' +
      '{ "texte", "vraie": true/false, "feedbackSiVrai", "feedbackSiFaux" }, avec au moins 1 vraie et 1 fausse).',
  },
  string: {
    label: 'Réponse texte courte (mot ou expression exacte)',
    example: {
      type: 'string',
      bareme: 1,
      enonce: "Quel est le nom de l'état physique de l'eau à 20°C sous pression atmosphérique ?",
      reponse: 'liquide',
      feedbackCorrect: 'Bonne réponse.',
      feedbackIncorrect: "Non, revoir le diagramme d'état de l'eau.",
      alternatives: [],
    },
    describe:
      'objet avec : "enonce", "reponse" (texte EXACT attendu, court), "feedbackCorrect", "feedbackIncorrect", ' +
      'et "alternatives" (liste optionnelle d\'autres réponses acceptées, [] si aucune).',
  },
  numerical: {
    label: 'Réponse numérique (calcul)',
    example: {
      type: 'numerical',
      bareme: 1,
      enonce: "Calculer la masse molaire de l'eau H2O en g/mol (M(H)=1, M(O)=16).",
      valeur: '18',
      chiffresSignificatifs: null,
      tolerancePourcent: 5,
      feedbackCorrect: 'Bonne réponse.',
      feedbackIncorrect: 'Revoir le calcul.',
    },
    describe:
      'objet avec : "enonce", "valeur" (le résultat numérique attendu, en texte, ex: "18" ou "3.14"), ' +
      '"chiffresSignificatifs" (entier ou null — mettre un entier UNIQUEMENT si l\'énoncé demande explicitement ' +
      'un arrondi à N chiffres significatifs), "tolerancePourcent" (tolérance relative acceptée, 5 par défaut), ' +
      '"feedbackCorrect", "feedbackIncorrect".',
  },
  units: {
    label: 'Grandeur avec unité (valeur + unité)',
    example: {
      type: 'units',
      bareme: 1,
      enonce: 'Convertir 2 heures en secondes.',
      valeur: '7200',
      unite: 's',
    },
    describe:
      'objet avec : "enonce", "valeur" (nombre attendu, en texte), "unite" (unité SI attendue, ex: "m/s", "kg", "s").',
  },
  match: {
    label: 'Association (relier deux colonnes)',
    example: {
      type: 'match',
      bareme: 2,
      enonce: 'Associez chaque grandeur à son unité SI.',
      paires: [
        { gauche: 'Masse', droite: 'kg' },
        { gauche: 'Durée', droite: 's' },
        { gauche: 'Intensité électrique', droite: 'A' },
      ],
    },
    describe:
      'objet avec : "enonce", "paires" (liste d\'AU MOINS 3 objets { "gauche", "droite" } — chaque paire est ' +
      'une association CORRECTE ; l\'appli mélangera leur présentation à l\'élève, ne pas s\'en soucier).',
  },
  ord: {
    label: 'Remise en ordre (étapes/éléments à ordonner)',
    example: {
      type: 'ord',
      bareme: 1,
      enonce: 'Remettre les étapes du protocole dans le bon ordre.',
      etapes: [
        'Peser la masse de soluté nécessaire.',
        'Verser le soluté dans la fiole jaugée.',
        "Ajouter de l'eau distillée jusqu'au trait de jauge.",
        'Boucher et agiter la fiole.',
      ],
    },
    describe:
      'objet avec : "enonce", "etapes" (liste d\'AU MOINS 3 chaînes de texte, dans le BON ORDRE — ' +
      "l'appli les présentera mélangées à l'élève, ne pas s'en soucier).",
  },
};

const TYPE_LABELS_FR = Object.fromEntries(Object.entries(CONTENT_SCHEMAS).map(([k, v]) => [k, v.label]));

function req(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ── Adaptateurs : JSON "pédagogique" IA → params exacts de gen<Type>Core(). ─
const ADAPTERS = {
  checkbox(raw, fb, ctx) {
    req(raw && typeof raw.enonce === 'string' && raw.enonce.trim(), `checkbox (question ${ctx}) : "enonce" manquant.`);
    req(Array.isArray(raw.propositions) && raw.propositions.length >= 2, `checkbox (question ${ctx}) : au moins 2 "propositions" requises.`);
    const props = raw.propositions.map((p, i) => {
      req(p && typeof p.texte === 'string' && p.texte.trim(), `checkbox (question ${ctx}) : proposition ${i + 1} sans "texte".`);
      return { bool: !!p.correcte, text: p.texte.trim(), fb: (p.feedback || '').trim(), fb2: '' };
    });
    const nbCorrect = props.filter((p) => p.bool).length;
    req(nbCorrect >= 1 && nbCorrect < props.length, `checkbox (question ${ctx}) : il faut au moins 1 proposition correcte et 1 fausse.`);
    return {
      bareme: Number(raw.bareme) || 1,
      text: raw.enonce.trim(),
      Xe: props.length,
      mXb: 'fixe',
      Xb: nbCorrect,
      props,
      showOubli: false,
      cbFbGen: '',
      cbFbGenShowFb: false,
    };
  },
  vf(raw, fb, ctx) {
    req(raw && typeof raw.enonce === 'string' && raw.enonce.trim(), `vf (question ${ctx}) : "enonce" manquant.`);
    req(Array.isArray(raw.propositions) && raw.propositions.length >= 2, `vf (question ${ctx}) : au moins 2 "propositions" requises.`);
    const props = raw.propositions.map((p, i) => {
      req(p && typeof p.texte === 'string' && p.texte.trim(), `vf (question ${ctx}) : proposition ${i + 1} sans "texte".`);
      return {
        isV: !!p.vraie,
        text: p.texte.trim(),
        fbIfVrai: (p.feedbackSiVrai || '').trim(),
        fbIfFaux: (p.feedbackSiFaux || '').trim(),
      };
    });
    const nbV = props.filter((p) => p.isV).length;
    req(nbV >= 1 && nbV < props.length, `vf (question ${ctx}) : il faut au moins 1 proposition vraie et 1 fausse.`);
    return {
      bareme: Number(raw.bareme) || 1,
      text: raw.enonce.trim(),
      fbGen: '',
      Xe: props.length,
      modeXb: 'fixe',
      Xb: nbV,
      props,
    };
  },
  string(raw, fb, ctx) {
    req(raw && typeof raw.enonce === 'string' && raw.enonce.trim(), `string (question ${ctx}) : "enonce" manquant.`);
    req(typeof raw.reponse === 'string' && raw.reponse.trim(), `string (question ${ctx}) : "reponse" manquante.`);
    const ansPlain = raw.reponse.trim();
    const altsArr = Array.isArray(raw.alternatives) ? raw.alternatives.map((a) => String(a).trim()).filter(Boolean) : [];
    return {
      bareme: Number(raw.bareme) || 1,
      text: raw.enonce.trim(),
      ansPlain,
      size: Math.max(15, Math.min(60, ansPlain.length + 8)),
      test: 'String',
      fbc: (raw.feedbackCorrect || '').trim() || fb.juste,
      fbe: (raw.feedbackIncorrect || '').trim() || fb.faux,
      fbGen: '',
      solH: '',
      paletteHtml: '',
      levenOn: false,
      altsArr,
    };
  },
  numerical(raw, fb, ctx) {
    req(raw && typeof raw.enonce === 'string' && raw.enonce.trim(), `numerical (question ${ctx}) : "enonce" manquant.`);
    req(raw.valeur !== undefined && raw.valeur !== null && String(raw.valeur).trim(), `numerical (question ${ctx}) : "valeur" manquante.`);
    const val = String(raw.valeur).trim();
    const n = raw.chiffresSignificatifs != null && !Number.isNaN(parseInt(raw.chiffresSignificatifs, 10))
      ? parseInt(raw.chiffresSignificatifs, 10)
      : null;
    return {
      bareme: Number(raw.bareme) || 1,
      text: raw.enonce.trim(),
      val,
      n: n || 3,
      isR: !!n,
      fbc: (raw.feedbackCorrect || '').trim() || fb.juste,
      fbe: (raw.feedbackIncorrect || '').trim() || fb.faux,
      tolType: 'NumRelative',
      tolVal: String(raw.tolerancePourcent != null ? raw.tolerancePourcent : 5),
      forbid: /\./.test(val) ? '0' : '1',
      numFbGen: '',
      aide: '',
      useKbd: false,
    };
  },
  units(raw, fb, ctx) {
    req(raw && typeof raw.enonce === 'string' && raw.enonce.trim(), `units (question ${ctx}) : "enonce" manquant.`);
    req(raw.valeur !== undefined && raw.valeur !== null && String(raw.valeur).trim(), `units (question ${ctx}) : "valeur" manquante.`);
    req(typeof raw.unite === 'string' && raw.unite.trim(), `units (question ${ctx}) : "unite" manquante.`);
    return {
      bareme: Number(raw.bareme) || 1,
      text: raw.enonce.trim(),
      val: String(raw.valeur).trim(),
      unit: raw.unite.trim(),
      fbGen: '',
      aide: '',
      useKbd: false,
    };
  },
  match(raw, fb, ctx) {
    req(raw && typeof raw.enonce === 'string' && raw.enonce.trim(), `match (question ${ctx}) : "enonce" manquant.`);
    req(Array.isArray(raw.paires) && raw.paires.length >= 3, `match (question ${ctx}) : au moins 3 "paires" requises.`);
    const paires = raw.paires.map((p, i) => {
      req(p && typeof p.gauche === 'string' && p.gauche.trim(), `match (question ${ctx}) : paire ${i + 1} sans "gauche".`);
      req(p && typeof p.droite === 'string' && p.droite.trim(), `match (question ${ctx}) : paire ${i + 1} sans "droite".`);
      return { gauche: p.gauche.trim(), droite: p.droite.trim() };
    });
    return {
      bareme: Number(raw.bareme) || 1,
      text: raw.enonce.trim(),
      left: paires.map((p) => ({ html: p.gauche })),
      right: paires.map((p) => ({ html: p.droite })),
      connections: paires.map((p, i) => ({ l: i, r: i })),
      fbGen: '',
    };
  },
  ord(raw, fb, ctx) {
    req(raw && typeof raw.enonce === 'string' && raw.enonce.trim(), `ord (question ${ctx}) : "enonce" manquant.`);
    req(Array.isArray(raw.etapes) && raw.etapes.length >= 3, `ord (question ${ctx}) : au moins 3 "etapes" requises.`);
    const itemTexts = raw.etapes.map((e, i) => {
      req(typeof e === 'string' && e.trim(), `ord (question ${ctx}) : étape ${i + 1} vide.`);
      return e.trim();
    });
    return {
      bareme: Number(raw.bareme) || 1,
      text: raw.enonce.trim(),
      itemTexts,
      isClone: false,
      fbGenExtra: '',
    };
  },
};

// ── Textes de feedback par défaut, IDENTIQUES à ceux de l'appli (I18N réel,
// jamais retapés) : FB_JUSTE_DEFAULT()/FB_FAUX_DEFAULT() dans js/data.js. ──
function defaultFeedback(I18N) {
  return {
    juste: I18N.t('common.fb_default_juste'),
    faux: I18N.t('common.fb_default_faux'),
  };
}

// ── Construit le bloc d'instructions (français) décrivant à l'IA la forme
// JSON exacte à produire pour chaque question demandée — une consigne
// précise par question (type + difficulté + mini-prompt de l'enseignant),
// pas un simple décompte "N questions de type X" : c'est l'enseignant qui
// décide QUOI il veut (ex: "relier le nom d'un changement d'état à des
// composés"), l'IA ne fait que rédiger le contenu conforme à cette consigne. ─
function buildSchemaInstructions(requests) {
  const lines = [];
  requests.forEach(({ id, type, difficulte, prompt }) => {
    const schema = CONTENT_SCHEMAS[type];
    if (!schema) throw new Error(`Type "${type}" inconnu pour la génération IA.`);
    lines.push(`- Question id=${id} : type "${type}" (${schema.label}), difficulté visée : ${difficulte || 'Modere'}.`);
    lines.push(`  Consigne de l'enseignant pour CETTE question (à respecter strictement) : ${prompt}`);
    lines.push(`  Forme JSON attendue (avec le champ "id" ci-dessus recopié à l'identique) : ${schema.describe}`);
    lines.push(`  Exemple : ${JSON.stringify(Object.assign({ id }, schema.example))}`);
  });
  return lines.join('\n');
}

// ── Construit le prompt complet envoyé à l'IA (un seul message utilisateur,
// même schéma d'appel que server/ai-generate.js). Le cours (Markdown) est
// désormais un contexte FACULTATIF (aide au vocabulaire/notations vues en
// classe) : la consigne par question, elle, est toujours obligatoire. ──────
function buildPrompt({ markdown, requests, matiere, niveau }) {
  const totalN = requests.length;
  const hasCourse = typeof markdown === 'string' && markdown.trim();
  const courseBlock = hasCourse
    ? '--- DÉBUT DU COURS ---\n' + markdown + '\n--- FIN DU COURS ---\n\n' +
      "Appuie-toi sur ce cours pour le vocabulaire et les notations exactes, sans jamais contredire une consigne ci-dessous.\n\n"
    : "Aucun extrait de cours n'a été fourni : utilise les connaissances standards du programme pour la matière et le niveau indiqués, sans inventer de notion hors-programme.\n\n";
  return (
    "Tu es un(e) enseignant(e) qui rédige des questions de type QCM/STACK pour Moodle" +
    `${matiere ? ` (matière : ${matiere}${niveau ? ', niveau : ' + niveau : ''})` : ''}. ` +
    'Rédige des questions PERTINENTES et EXACTES, en respectant strictement la consigne donnée pour CHAQUE question ' +
    "ci-dessous — c'est l'enseignant qui a choisi ce qu'il veut, ne t'en écarte pas. Le texte des énoncés/feedback " +
    "est en français, peut contenir du HTML simple (<strong>, <br>, <ul><li>) et des formules entre $...$.\n\n" +
    courseBlock +
    `Génère exactement ${totalN} question(s), une par consigne ci-dessous :\n` +
    buildSchemaInstructions(requests) + '\n\n' +
    'Réponds UNIQUEMENT avec un objet JSON valide (aucun texte autour, aucune balise markdown), de la forme :\n' +
    '{"questions": [ {"id": ..., "type": "...", ...champs du type...}, ... ]}\n' +
    'Chaque question DOIT porter le même "id" que la consigne à laquelle elle répond.'
  );
}

// ── Adapte un item JSON brut produit par l'IA en {type, params} prêt pour
// cfg.questions (voir generateFromConfig() dans build-question-xml.js). ───
function adaptAIQuestion(rawItem, I18N, ctxLabel) {
  const fb = defaultFeedback(I18N);
  const type = rawItem && rawItem.type;
  const adapter = ADAPTERS[type];
  if (!adapter) {
    throw new Error(
      `Question ${ctxLabel} : type "${type}" absent ou non reconnu dans la réponse de l'IA ` +
      `(types possibles : ${Object.keys(ADAPTERS).join(', ')}).`
    );
  }
  const params = adapter(rawItem, fb, ctxLabel);
  return { type, params };
}

module.exports = { CONTENT_SCHEMAS, TYPE_LABELS_FR, buildPrompt, adaptAIQuestion, defaultFeedback };
