// xml-lint.js — vérification statique du XML exporté, avant téléchargement.
// But : attraper localement les classes de bugs déjà rencontrées (voir PLAN.md,
// Problèmes connus) sans attendre un aller-retour d'import Moodle réel.
// N'importe quel `warn` retourné ici est un indice fort, pas forcément une
// certitude à 100% (le check d'équilibre CDATA est une heuristique) — l'appelant
// décide s'il bloque ou laisse continuer.

function lintExportedXML(xml) {
  var warnings = [];

  // 1) I18N n'existe que dans le contexte navigateur de StackForge (voir js/i18n.js).
  //    S'il apparaît littéralement dans le XML exporté, ce JS s'exécutera un jour
  //    dans le sandbox Moodle/JSXGraph où I18N est undefined → plantage silencieux.
  //    (cause exacte du Problème connu #36, bug 4 : I18N.t(...) laissé hors ${...}.)
  var i18nCalls = xml.match(/\bI18N\.(t|add|setLang|register)\s*\(/g);
  if (i18nCalls) {
    warnings.push('Appel(s) I18N.* trouvé(s) tel quel dans le XML exporté (' + i18nCalls.length + ') — '
      + 'I18N n\'existe pas côté Moodle. Vérifier que chaque I18N.t(...) dans un template '
      + 'JSXGraph/kbdRaw est bien enveloppé en ${JSON.stringify(I18N.t(...))}.');
  }

  // 2) Marqueurs kbdRaw non restaurés : la substitution du placeholder a échoué
  //    (q.kbdRaw absent/vide alors que le marqueur a été posé dans textFrag).
  var leftoverMarkers = xml.match(/<!--HS-KBD(-FBGEN)?:[^>]*-->/g);
  if (leftoverMarkers) {
    warnings.push('Marqueur(s) <!--HS-KBD...--> non remplacés dans le XML final (' + leftoverMarkers.length + ') — '
      + 'le JS brut correspondant n\'a pas été réinjecté, le widget élève sera probablement vide.');
  }

  // 3) <tans> vide : rejeté par le validateur serveur STACK (Problème connu #36, bug 3).
  if (/<tans>\s*<\/tans>/.test(xml)) {
    warnings.push('<tans></tans> vide détecté — sera rejeté par la validation serveur STACK.');
  }

  // 4) manualgraded:1 : forme rejetée par STACK, seule manualgraded:true est acceptée.
  if (/manualgraded\s*:\s*1\b/.test(xml)) {
    warnings.push('"manualgraded:1" détecté — STACK exige "manualgraded:true".');
  }

  // 5) Équilibre grossier des parenthèses/accolades/crochets à l'intérieur de
  //    chaque bloc <![CDATA[ ... ]]> (où vit le JS JSXGraph brut). Heuristique :
  //    ne tient pas compte des chaînes/commentaires, donc peut faux-positiver sur
  //    du texte contenant des parenthèses non appariées — à lire comme un indice,
  //    pas un verdict.
  var cdataRe = /<!\[CDATA\[([\s\S]*?)\]\]>/g, m, idx = 0;
  while ((m = cdataRe.exec(xml))) {
    idx++;
    var block = m[1];
    ['()', '{}', '[]'].forEach(function(pair) {
      var open = pair[0], close = pair[1];
      var opens = (block.split(open).length - 1);
      var closes = (block.split(close).length - 1);
      if (opens !== closes) {
        warnings.push('Bloc CDATA #' + idx + ' : déséquilibre "' + open + '/' + close + '" '
          + '(' + opens + ' ouvrant(s) / ' + closes + ' fermant(s)) — JS/Maxima potentiellement corrompu.');
      }
    });
  }

  return warnings;
}
